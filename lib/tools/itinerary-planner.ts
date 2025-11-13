/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const itineraryPlannerTools: FunctionCall[] = [
  {
    name: 'mapsGrounding',
    description: `A powerful tool that uses Google Maps data to find ANY type of place or point of interest. Use this to search for schools, hospitals, malls, restaurants, parks, museums, hotels, entertainment venues, or ANY other type of place. This tool can find places ANYWHERE - use it whenever the user asks about locations, amenities, or places.`,
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'A natural language search query. Examples: "hospitals near Palm Jumeirah", "schools in Downtown Dubai", "restaurants near Dubai Marina", "parks near my location". Include the location/area in the query for best results.',
        },
        markerBehavior: {
          type: 'STRING',
          description:
            'Controls which results get markers on the map. Use "all" to show all results (recommended), "mentioned" for only places you mention in your response, or "none" for no markers.',
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
