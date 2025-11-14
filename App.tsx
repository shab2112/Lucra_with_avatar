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
import React, {useCallback, useState, useEffect, useRef} from 'react';

import ControlTray from './components/ControlTray';
import ErrorScreen from './components/ErrorScreen';
import StreamingConsole from './components/streaming-console/StreamingConsole';
import PopUp from './components/popup/PopUp';
import Sidebar from './components/Sidebar';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Map3D, Map3DCameraProps} from './components/map-3d';
import { useMapStore } from './lib/state';
import { MapController } from './lib/map-controller';

const GEMINI_API_KEY = process.env.VITE_GOOGLE_API_KEY as string;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

if (typeof GEMINI_API_KEY !== 'string' || !GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in .env file');
}

if (typeof GOOGLE_MAPS_API_KEY !== 'string' || !GOOGLE_MAPS_API_KEY) {
  throw new Error('Missing VITE_GOOGLE_API_KEY in .env file');
}

const INITIAL_VIEW_PROPS = {
  center: {
    lat: 25.12,
    lng: 55.22,
    altitude: 1000
  },
  range: 35000,
  heading: 0,
  tilt: 30,
  roll: 0
};

function AppComponent() {
  const [map, setMap] = useState<google.maps.maps3d.Map3DElement | null>(null);
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const { markers, cameraTarget, setCameraTarget, preventAutoFrame } = useMapStore();
  const mapController = useRef<MapController | null>(null);

  const maps3dLib = useMapsLibrary('maps3d');
  const elevationLib = useMapsLibrary('elevation');

  const [showPopUp, setShowPopUp] = useState(true);

  const consolePanelRef = useRef<HTMLDivElement>(null);
  const controlTrayRef = useRef<HTMLElement>(null);
  const [padding, setPadding] = useState<[number, number, number, number]>([0.05, 0.05, 0.05, 0.05]);

  useEffect(() => {
    if (geocodingLib) {
      setGeocoder(new geocodingLib.Geocoder());
    }
  }, [geocodingLib]);

  useEffect(() => {
    if (map && maps3dLib && elevationLib) {
      mapController.current = new MapController({
        map,
        maps3dLib,
        elevationLib,
      });
    }
    return () => {
      mapController.current = null;
    };
  }, [map, maps3dLib, elevationLib]);

  useEffect(() => {
    const calculatePadding = () => {
      const consoleEl = consolePanelRef.current;
      const trayEl = controlTrayRef.current;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      if (!consoleEl || !trayEl) return;

      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      
      const top = 0.05;
      const right = 0.05;
      let bottom = 0.05;
      let left = 0.05;

      if (!isMobile) {
          left = Math.max(left, (consoleEl.offsetWidth / vw) + 0.02);
      }
      
      setPadding([top, right, bottom, left]);
    };

    const observer = new ResizeObserver(calculatePadding);
    if (consolePanelRef.current) observer.observe(consolePanelRef.current);
    if (controlTrayRef.current) observer.observe(controlTrayRef.current);

    window.addEventListener('resize', calculatePadding);

    const timeoutId = setTimeout(calculatePadding, 100);

    return () => {
        window.removeEventListener('resize', calculatePadding);
        observer.disconnect();
        clearTimeout(timeoutId);
    };
  }, []);

  const handleClosePopUp = () => {
    setShowPopUp(false);
  };
  
  useEffect(() => {
    if (map) {
      const banner = document.querySelector(
        '.vAygCK-api-load-alpha-banner',
      ) as HTMLElement;
      if (banner) {
        banner.style.display = 'none';
      }
    }
  }, [map]);

  useEffect(() => {
    if (!mapController.current) return;

    const controller = mapController.current;
    controller.clearMap();

    if (markers.length > 0) {
      controller.addMarkers(markers);
    }
    
    const markerPositions = markers.map(m => m.position);
    const allEntities = [...markerPositions].map(p => ({ position: p }));

    if (allEntities.length > 0 && !preventAutoFrame) {
      controller.frameEntities(allEntities, padding);
    }
  }, [markers, padding, preventAutoFrame]);

  useEffect(() => {
    if (cameraTarget && mapController.current) {
      mapController.current.flyTo(cameraTarget);
      setCameraTarget(null);
      useMapStore.getState().setPreventAutoFrame(false);
    }
  }, [cameraTarget, setCameraTarget]);

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
      setViewProps(oldProps => ({...oldProps, ...props}));
    }, []);

  return (
    <LiveAPIProvider 
      apiKey={GEMINI_API_KEY} 
      map={map} 
      placesLib={placesLib}
      elevationLib={elevationLib}
      geocoder={geocoder}
      padding={padding}
    >
        <ErrorScreen />
        <Sidebar />
         {showPopUp && <PopUp onClose={handleClosePopUp} />}
        <div className="streaming-console">
          <div className="console-panel" ref={consolePanelRef}>
            <StreamingConsole />
            <ControlTray trayRef={controlTrayRef} />
          </div>
          <div className="map-panel">
              <Map3D
                ref={element => setMap(element ?? null)}
                onCameraChange={handleCameraChange}
                {...viewProps}>
              </Map3D>
          </div>
        </div>
    </LiveAPIProvider>
  );
}

function App() {
  return (
    <div className="App">
      <APIProvider
        version={'alpha'}
        apiKey={GOOGLE_MAPS_API_KEY}
        solutionChannel={"gmp_aistudio_itineraryapplet_v1.0.0"}>  
        <AppComponent />
      </APIProvider>
    </div>
  );
}

export default App;