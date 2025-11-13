import React, { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { Map3D, Map3DCameraProps } from './components/map-3d';
import ControlTray from './components/ControlTray';
import ErrorScreen from './components/ErrorScreen';
import PopUp from './components/popup/PopUp';
import StreamingConsole from './components/streaming-console/StreamingConsole';
import Sidebar from './components/Sidebar';
import { GroundingWidget } from './components/GroundingWidget';
import { AvatarDisplay } from './components/AvatarDisplay';
import { useMapStore } from './lib/state';
import { MapController } from './lib/map-controller';
import { lookAtWithPadding } from './lib/look-at';
import './index.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const INITIAL_VIEW_PROPS = {
  center: {
    lat: 25.12, // Centered on Dubai
    lng: 55.22,
    altitude: 1000
  },
  range: 35000, // Zoomed out to see major communities
  heading: 0,
  tilt: 30,
  roll: 0
};
/**
 * The main application component. It serves as the primary view controller,
 * orchestrating the layout of UI components and reacting to global state changes
 * to update the 3D map.
 */
function AppComponent() {
  const [map, setMap] = useState<google.maps.maps3d.Map3DElement | null>(null); 
  // const mapRef = useRef<google.maps.maps3d.Map3DElement | null>(null);
  const consolePanelRef = useRef<HTMLDivElement>(null);
  const controlTrayRef = useRef<HTMLDivElement>(null);
  const mapController = useRef<MapController | null>(null);
  const [padding, setPadding] = useState<[number, number, number, number]>([0.05, 0.05, 0.05, 0.35]);
  // const pendingCameraTargetRef = useRef<any>(null);
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const placesLib = useMapsLibrary('places');
  const elevationLib = useMapsLibrary('elevation');
  const geocodingLib = useMapsLibrary('geocoding');
  const maps3dLib = useMapsLibrary('maps3d');

  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const { markers, cameraTarget, setCameraTarget, preventAutoFrame  } = useMapStore();

  useEffect(() => {
    if (geocodingLib && !geocoder) {
      setGeocoder(new geocodingLib.Geocoder());
    }
  }, [geocodingLib, geocoder]);

  useEffect(() => {
    if (map && maps3dLib && elevationLib) {
      const mapController.current = new MapController({
        map,
        maps3dLib,
        elevationLib,
      });
    }
    // Invalidate the controller if its dependencies change.
    return () => {
      mapController.current = null;
    };
  }, [map, maps3dLib, elevationLib]);
  
      // Apply any pending camera target
  //     if (pendingCameraTargetRef.current) {
  //       console.log('Applying pending camera target:', pendingCameraTargetRef.current);
  //       controller.flyTo(pendingCameraTargetRef.current);
  //       pendingCameraTargetRef.current = null;
  //     }
  //   }
  // }, [mapController, maps3dLib, elevationLib]);
  // Effect: Calculate responsive padding.
  // This effect observes the size of the console and control tray to calculate
  // padding values. These values represent how much of the viewport is
  // covered by UI, ensuring that when the map frames content, nothing is hidden.
  // See `lib/look-at.ts` for how this padding is used.
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
        // bottom = Math.max(bottom, (trayEl.offsetHeight / vh) + 0.02);
      }

      setPadding([top, right, bottom, left]);
    };
    // Use ResizeObserver for more reliable updates on the elements themselves.
    const observer = new ResizeObserver(calculatePadding);
    if (consolePanelRef.current) observer.observe(consolePanelRef.current);
    if (controlTrayRef.current) observer.observe(controlTrayRef.current);

    // Also listen to window resize
    window.addEventListener('resize', calculatePadding);

    // Initial calculation after a short delay to ensure layout is stable
    const timeoutId = setTimeout(calculatePadding, 100);

    // calculatePadding();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculatePadding);
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

  // Effect: Reactively render markers and routes on the map.
  // This is the core of the component's "reactive" nature. It listens for
  // changes to the `markers` array in the global Zustand store.
  // Whenever a tool updates this state, this effect triggers, commanding the
  // MapController to clear the map, add the new entities, and then
  // intelligently frame them all in the camera's view, respecting UI padding.
  useEffect(() => {
    if (!mapController.current) return;
    const controller = mapController.current;
    controller.clearMap();

    if (markers.length > 0) {
      controller.addMarkers(markers);
    }
    
    // Combine all points from markers for framing
    const markerPositions = markers.map(m => m.position);
    const allEntities = [...markerPositions].map(p => ({ position: p }));
    if (allEntities.length > 0 && !preventAutoFrame) {
      controller.frameEntities(allEntities, padding);
    }
  }, [markers, padding, preventAutoFrame]); // Re-run when markers or padding change


  // Effect: Reactively handle direct camera movement requests.
  // This effect listens for changes to `cameraTarget`. Tools can set this state
  // to request a direct camera flight to a specific location or view. Once the
  // flight is initiated, the target is cleared to prevent re-triggering.
  useEffect(() => {
    if (cameraTarget && mapController.current) {
      mapController.current.flyTo(cameraTarget);
      // Reset the target so it doesn't re-trigger on re-renders
      setCameraTarget(null);
      // After a direct camera flight, reset the auto-frame prevention flag
      // to ensure subsequent marker updates behave as expected.
      useMapStore.getState().setPreventAutoFrame(false);
    }
  }, [cameraTarget, setCameraTarget]);

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
      setViewProps(oldProps => ({...oldProps, ...props}));
    }, []);

  return (
    <LiveAPIProvider 
      apiKey={GOOGLE_MAPS_API_KEY} 
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
      
/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  return (
    <div className="App">
    <APIProvider
                version={'alpha'}
                apiKey={'AIzaSyCYTvt7YMcKjSNTnBa42djlndCeDvZHkr0'}
                solutionChannel={"gmp_aistudio_itineraryapplet_v1.0.0"}>  
      <AppComponent />
    </APIProvider>

    </div>
  );
}

export default App;