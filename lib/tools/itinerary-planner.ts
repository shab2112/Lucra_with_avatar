/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const itineraryPlannerTools: FunctionCall[] = [
  {
    name: 'mapsGrounding',
    description: `A tool that uses Google Maps data to find nearby points of interest (amenities) like schools, hospitals, malls, or restaurants.`,
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'A search query, like "schools near Dubai Hills Estate" or "restaurants in Downtown Dubai". You MUST be as precise as possible.',
        },
        markerBehavior: {
          type: 'STRING',
          description:
            'Controls which results get markers. "mentioned" for places in the text response, "all" for all search results, or "none" for no markers.',
          enum: ['mentioned', 'all', 'none'],
        },
      },
      required: ['query'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'locateCommunity',
    description: 'Call this function to display a specific Dubai community on the map. This provides a wide, establishing shot of the area.',
    parameters: {
      type: 'OBJECT',
      properties: {
        communityName: {
          type: 'STRING',
          description: 'The name of the Dubai community to locate (e.g., "Dubai Hills Estate", "Palm Jumeirah").',
        },
      },
      required: ['communityName'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'findProjects',
    description: 'Finds and displays real estate projects on the map within a specific community. It adds markers for each project found.',
    parameters: {
      type: 'OBJECT',
      properties: {
        communityName: {
          type: 'STRING',
          description: 'The name of the community where to search for projects.',
        },
        projectType: {
          type: 'STRING',
          description: 'The type of project to search for (e.g., "Villas", "Apartments", "Off-plan").',
        },
      },
      required: ['communityName', 'projectType'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
];
