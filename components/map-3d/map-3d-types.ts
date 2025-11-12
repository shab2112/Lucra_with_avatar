/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Copyright 2025 Google LLC
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

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-explicit-any */

// Using a full React import to ensure this file is treated as a module,
// which is required for module augmentation to work correctly.
import React from 'react';
// FIX: An import from the module is needed for module augmentation to work.
// Using an empty import to ensure the module is recognized by TypeScript.
import {} from '@vis.gl/react-google-maps';

// add an overload signature for the useMapsLibrary hook, so typescript
// knows what the 'maps3d' library is.
declare module '@vis.gl/react-google-maps' {
  export function useMapsLibrary(
    name: 'maps3d'
  ): google.maps.Maps3DLibrary | null;
  export function useMapsLibrary(
    name: 'elevation'
  ): google.maps.ElevationLibrary | null;
  // Add overload for 'places' library
  export function useMapsLibrary(
    name: 'places'
  ): google.maps.PlacesLibrary | null;
  // Add overload for 'geocoding' library
  export function useMapsLibrary(
    name: 'geocoding'
  ): google.maps.GeocodingLibrary | null;
}

// temporary fix until @types/google.maps is updated with the latest changes
declare global {
  namespace google.maps {
    interface LatLng {
      lat(): number;
      lng(): number;
      toJSON(): {lat: number; lng: number};
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLngAltitude {
      lat: number;
      lng: number;
      altitude: number;
      toJSON(): LatLngAltitudeLiteral;
    }

    interface LatLngAltitudeLiteral {
      lat: number;
      lng: number;
      altitude: number;
    }
    
    // Define the PlacesLibrary interface
    interface PlacesLibrary {
      Place: typeof places.Place;
      PlaceContextualElement: any;
      PlaceContextualListConfigElement: any;
    }

    namespace places {
      class Place {
        constructor(options: {id: string});
        fetchFields(options: {
          fields: string[];
        }): Promise<{place: Place}>;
        location?: LatLng;
        displayName?: string;
      }
    }

    interface ElevationLibrary {
      ElevationService: {
        new (): ElevationService;
      };
    }

    interface ElevationResult {
      elevation: number;
      location: LatLng;
      resolution: number;
    }

    interface LocationElevationRequest {
      locations: LatLngLiteral[];
    }

    class ElevationService {
      getElevationForLocations(
        request: LocationElevationRequest
      ): Promise<{results: ElevationResult[]}>;
    }

    // Add missing types for the Geocoding service.
    interface GeocodingLibrary {
      Geocoder: {
        new (): Geocoder;
      };
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest
      ): Promise<{results: GeocoderResult[]}>;
    }

    interface GeocoderRequest {
      address?: string | null;
      location?: LatLng | LatLngLiteral;
      placeId?: string | null;
    }

    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: GeocoderGeometry;
      place_id: string;
      types: string[];
    }
    
    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderGeometry {
      location: LatLng;
      location_type: string;
      viewport: LatLngBounds;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      // ... and other methods
    }

    interface Maps3DLibrary {
      Marker3DInteractiveElement: {
        new (options: any): HTMLElement;
      };
    }

    namespace maps3d {
      interface CameraOptions {
        center?: google.maps.LatLngAltitude | google.maps.LatLngAltitudeLiteral;
        heading?: number;
        range?: number;
        roll?: number;
        tilt?: number;
      }

      interface FlyAroundAnimationOptions {
        camera: CameraOptions;
        durationMillis?: number;
        rounds?: number;
      }

      interface FlyToAnimationOptions {
        endCamera: CameraOptions;
        durationMillis?: number;
      }
      interface Map3DElement extends HTMLElement {
        mode?: 'HYBRID' | 'SATELLITE';
        flyCameraAround: (options: FlyAroundAnimationOptions) => void;
        flyCameraTo: (options: FlyToAnimationOptions) => void;
        center: google.maps.LatLngAltitude | google.maps.LatLngAltitudeLiteral;
        heading: number;
        range: number;
        roll: number;
        tilt: number;
        defaultUIHidden?: boolean;
      }

      interface Map3DElementOptions {
        center?: google.maps.LatLngAltitude | google.maps.LatLngAltitudeLiteral;
        heading?: number;
        range?: number;
        roll?: number;
        tilt?: number;
        defaultUIHidden?: boolean;
      }
    }
  }
}

// add the <gmp-map-3d> custom-element to the JSX.IntrinsicElements
// interface, so it can be used in jsx
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ['gmp-map-3d']: CustomElement<
        google.maps.maps3d.Map3DElement,
        google.maps.maps3d.Map3DElement
      >;
    }
  }
}

// a helper type for CustomElement definitions
type CustomElement<TElem, TAttr> = Partial<
  TAttr &
    React.DOMAttributes<TElem> &
    React.RefAttributes<TElem> & {
      // for whatever reason, anything else doesn't work as children
      // of a custom element, so we allow `any` here
      children: any;
    }
>;
