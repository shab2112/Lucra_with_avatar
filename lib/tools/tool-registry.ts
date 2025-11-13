/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GenerateContentResponse, GroundingChunk } from '@google/genai';
import { fetchMapsGroundedResponseREST } from '@/lib/maps-grounding';
import { MapMarker, useLogStore, useMapStore } from '@/lib/state';

// Hardcoded data for Dubai communities and projects to simulate a database API
const dubaiCommunities: Record<string, { lat: number; lng: number }> = {
  'dubai hills estate': { lat: 25.1118, lng: 55.2575 },
  'palm jumeirah': { lat: 25.1189, lng: 55.1383 },
  'downtown dubai': { lat: 25.1972, lng: 55.2744 },
  'dubai marina': { lat: 25.0784, lng: 55.1384 },
  'arabian ranches': { lat: 25.0683, lng: 55.2515 },
};

const realEstateProjects: Record<string, { name: string; type: string; position: { lat: number; lng: number } }[]> = {
  'dubai hills estate': [
    { name: 'Maple at Dubai Hills', type: 'Villas', position: { lat: 25.1050, lng: 55.2600 } },
    { name: 'Park Heights', type: 'Apartments', position: { lat: 25.1150, lng: 55.2550 } },
    { name: 'Golfville', type: 'Off-plan', position: { lat: 25.1100, lng: 55.2590 } },
  ],
  'downtown dubai': [
    { name: 'Burj Khalifa Residences', type: 'Apartments', position: { lat: 25.1972, lng: 55.2744 } },
    { name: 'The Address Downtown', type: 'Apartments', position: { lat: 25.1945, lng: 55.2787 } },
    { name: 'Grande Opera District', type: 'Off-plan', position: { lat: 25.1930, lng: 55.2760 } },
  ],
  'palm jumeirah': [
      { name: 'The Palm Tower', type: 'Apartments', position: { lat: 25.1118, lng: 55.1495 } },
      { name: 'XXII Carat', type: 'Villas', position: { lat: 25.1025, lng: 55.1275 } },
  ],
  'dubai marina': [
      { name: 'Marina Gate', type: 'Apartments', position: { lat: 25.0870, lng: 55.1470 } },
      { name: 'Address Beach Resort', type: 'Apartments', position: { lat: 25.0780, lng: 55.1330 } },
  ]
};

/**
 * Context object containing shared resources and setters that can be passed
 * to any tool implementation.
 */
export interface ToolContext {
  map: google.maps.maps3d.Map3DElement | null;
  placesLib: google.maps.PlacesLibrary | null;
  elevationLib: google.maps.ElevationLibrary | null;
  geocoder: google.maps.Geocoder | null;
  padding: [number, number, number, number];
  setHeldGroundedResponse: (
    response: GenerateContentResponse | undefined,
  ) => void;
  setHeldGroundingChunks: (chunks: GroundingChunk[] | undefined) => void;
}

/**
 * Defines the signature for any tool's implementation function.
 * @param args - The arguments for the function call, provided by the model.
 * @param context - The shared context object.
 * @returns A promise that resolves to either a string or a GenerateContentResponse
 *          to be sent back to the model.
 */
export type ToolImplementation = (
  args: any,
  context: ToolContext,
) => Promise<GenerateContentResponse | string>;

/**
 * Fetches and processes place details from grounding chunks.
 * @param groundingChunks - The grounding chunks from the model's response.
 * @param placesLib - The Google Maps Places library instance.
 * @param responseText - The model's text response to filter relevant places.
 * @param markerBehavior - Controls whether to show all markers or only mentioned ones.
 * @returns A promise that resolves to an array of MapMarker objects.
 */
async function fetchPlaceDetailsFromChunks(
  groundingChunks: GroundingChunk[],
  placesLib: google.maps.PlacesLibrary,
  responseText?: string,
  markerBehavior: 'mentioned' | 'all' | 'none' = 'mentioned',
): Promise<MapMarker[]> {
  if (markerBehavior === 'none' || !groundingChunks?.length) {
    return [];
  }

  let chunksToProcess = groundingChunks.filter(c => c.maps?.placeId);
  if (markerBehavior === 'mentioned' && responseText) {
    // Filter the marker list to only what was mentioned in the grounding text.
    chunksToProcess = chunksToProcess.filter(
      chunk =>
        chunk.maps?.title && responseText.includes(chunk.maps.title),
    );
  }

  if (!chunksToProcess.length) {
    return [];
  }

  const placesRequests = chunksToProcess.map(chunk => {
    const placeId = chunk.maps!.placeId.replace('places/', '');
    const place = new placesLib.Place({ id: placeId });
    return place.fetchFields({ fields: ['location', 'displayName'] });
  });

  const locationResults = await Promise.allSettled(placesRequests);

  const newMarkers: MapMarker[] = locationResults
    .map((result, index) => {
      if (result.status !== 'fulfilled' || !result.value.place.location) {
        return null;
      }
      
      const { place } = result.value;
      const originalChunk = chunksToProcess[index];
      
      let showLabel = true; // Default for 'mentioned'
      if (markerBehavior === 'all') {
        showLabel = !!(responseText && originalChunk.maps?.title && responseText.includes(originalChunk.maps.title));
      }

      return {
        position: {
          lat: place.location.lat(),
          lng: place.location.lng(),
          altitude: 1,
        },
        label: place.displayName ?? '',
        showLabel,
      };
    })
    .filter((marker): marker is MapMarker => marker !== null);

  return newMarkers;
}

/**
 * Updates the global map state based on the provided markers and grounding data.
 * It decides whether to perform a special close-up zoom or a general auto-frame.
 * @param markers - An array of markers to display on the map.
 * @param groundingChunks - The original grounding chunks to check for metadata.
 */
function updateMapStateWithMarkers(
  markers: MapMarker[],
  groundingChunks: GroundingChunk[],
) {
  const hasPlaceAnswerSources = groundingChunks.some(
    chunk => chunk.maps?.placeAnswerSources,
  );

  if (hasPlaceAnswerSources && markers.length === 1) {
    // Special close-up zoom: prevent auto-framing and set a direct camera target.
    const { setPreventAutoFrame, setMarkers, setCameraTarget } =
      useMapStore.getState();

    setPreventAutoFrame(true);
    setMarkers(markers);
    setCameraTarget({
      center: { ...markers[0].position, altitude: 200 },
      range: 500, // A tighter range for a close-up
      tilt: 60, // A steeper tilt for a more dramatic view
      heading: 0,
      roll: 0,
    });
  } else {
    // Default behavior: just set the markers and let the App component auto-frame them.
    const { setPreventAutoFrame, setMarkers } = useMapStore.getState();
    setPreventAutoFrame(false);
    setMarkers(markers);
  }
}


/**
 * Tool implementation for grounding queries with Google Maps.
 *
 * This tool fetches a grounded response and then, in a non-blocking way,
 * processes the place data to update the markers and camera on the 3D map.
 */
const mapsGrounding: ToolImplementation = async (args, context) => {
  const { setHeldGroundedResponse, setHeldGroundingChunks, placesLib } = context;
  const {
    query,
    markerBehavior = 'mentioned',
    systemInstruction,
    enableWidget,
  } = args;

  const groundedResponse = await fetchMapsGroundedResponseREST({
    prompt: query as string,
    systemInstruction: systemInstruction as string | undefined,
    enableWidget: enableWidget as boolean | undefined,
  });

  if (!groundedResponse) {
    return 'Failed to get a response from maps grounding.';
  }

  // Hold response data for display in the chat log
  setHeldGroundedResponse(groundedResponse);
  const groundingChunks =
    groundedResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks && groundingChunks.length > 0) {
    setHeldGroundingChunks(groundingChunks);
  } else {
    // If there are no grounding chunks, clear any existing markers and return.
    useMapStore.getState().setMarkers([]);
    return groundedResponse;
  }

  // Process place details and update the map state asynchronously.
  // This is done in a self-invoking async function so that the `mapsGrounding`
  // tool can return the response to the model immediately without waiting for
  // the map UI to update.
  if (placesLib && markerBehavior !== 'none') {
    (async () => {
      try {
        const responseText =
          groundedResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        const markers = await fetchPlaceDetailsFromChunks(
          groundingChunks,
          placesLib,
          responseText,
          markerBehavior,
        );
        updateMapStateWithMarkers(markers, groundingChunks);
      } catch (e) {
        console.error('Error processing place details and updating map:', e);
      }
    })();
  } else if (markerBehavior === 'none') {
    // If no markers are to be created, ensure the map is cleared.
    useMapStore.getState().setMarkers([]);
  }

  return groundedResponse;
};

/**
 * Tool implementation for displaying a Dubai community on the 3D map.
 */
const locateCommunity: ToolImplementation = async (args, context) => {
  const { communityName } = args;

  if (typeof communityName !== 'string') {
    return 'Invalid community name provided.';
  }

  const communityKey = communityName.toLowerCase();
  const community = dubaiCommunities[communityKey];

  if (!community) {
    const message = `Sorry, I couldn't find the community "${communityName}". Please try another, like "Dubai Hills Estate" or "Downtown Dubai".`;
    useLogStore.getState().addTurn({ role: 'system', text: message, isFinal: true });
    return message;
  }

  // Clear previous markers when locating a new community
  useMapStore.getState().clearMarkers();

  useMapStore.getState().setCameraTarget({
    center: { ...community, altitude: 2000 },
    range: 10000,
    tilt: 30,
    heading: 0,
    roll: 0,
  });

  return `Located ${communityName} on the map.`;
};


/**
 * Tool implementation for finding and marking real estate projects on the map.
 */
const findProjects: ToolImplementation = async (args, context) => {
  const { communityName, projectType } = args;

  if (typeof communityName !== 'string' || typeof projectType !== 'string') {
    return 'Invalid community name or project type provided.';
  }

  const communityKey = communityName.toLowerCase();
  const projectsInCommunity = realEstateProjects[communityKey];

  if (!projectsInCommunity) {
    return `I don't have project data for "${communityName}" right now.`;
  }
  
  const filteredProjects = projectsInCommunity.filter(
    p => p.type.toLowerCase().includes(projectType.toLowerCase())
  );

  if (filteredProjects.length === 0) {
    return `I couldn't find any "${projectType}" projects in ${communityName}. You could try another type.`;
  }

  const markersToSet: MapMarker[] = filteredProjects.map(project => ({
    position: { ...project.position, altitude: 1 },
    label: project.name,
    showLabel: true,
  }));

  const { setMarkers, setPreventAutoFrame } = useMapStore.getState();
  setPreventAutoFrame(false); // Ensure auto-framing is enabled
  setMarkers(markersToSet);

  return `Found and marked ${filteredProjects.length} ${projectType} projects in ${communityName}.`;
};

/**
 * A registry mapping tool names to their implementation functions.
 * The `onToolCall` handler uses this to dispatch function calls dynamically.
 */
export const toolRegistry: Record<string, ToolImplementation> = {
  mapsGrounding,
  locateCommunity,
  findProjects,
};