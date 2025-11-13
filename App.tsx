// import React, { useEffect, useRef, useState } from 'react';
// import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
// import { LiveAPIProvider } from './contexts/LiveAPIContext';
// import { Map3D } from './components/map-3d';
// import ControlTray from './components/ControlTray';
// import StreamingConsole from './components/streaming-console/StreamingConsole';
// import Sidebar from './components/Sidebar';
// import { GroundingWidget } from './components/GroundingWidget';
// import { useMapStore } from './lib/state';
// import { MapController } from './lib/map-controller';
// import { lookAtWithPadding } from './lib/look-at';
// import './index.css';

// const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// function AppComponent() {
//   const mapRef = useRef<google.maps.maps3d.Map3DElement | null>(null);
//   const consolePanelRef = useRef<HTMLDivElement>(null);
//   const controlTrayRef = useRef<HTMLDivElement>(null);
//   const [mapController, setMapController] = useState<MapController | null>(null);
//   const [padding, setPadding] = useState<[number, number, number, number]>([0.05, 0.05, 0.05, 0.35]);
//   const pendingCameraTargetRef = useRef<any>(null);

//   const placesLib = useMapsLibrary('places');
//   const elevationLib = useMapsLibrary('elevation');
//   const geocodingLib = useMapsLibrary('geocoding');
//   const maps3dLib = useMapsLibrary('maps3d');

//   const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

//   const { markers, routes, cameraTarget, preventAutoFrame } = useMapStore();

//   useEffect(() => {
//     if (geocodingLib && !geocoder) {
//       setGeocoder(new geocodingLib.Geocoder());
//     }
//   }, [geocodingLib, geocoder]);

//   useEffect(() => {
//     if (mapRef.current && !mapController && maps3dLib && elevationLib) {
//       const controller = new MapController({
//         map: mapRef.current,
//         maps3dLib: maps3dLib,
//         elevationLib: elevationLib,
//       });
//       setMapController(controller);

//       // Apply any pending camera target
//       if (pendingCameraTargetRef.current) {
//         console.log('Applying pending camera target:', pendingCameraTargetRef.current);
//         controller.flyTo(pendingCameraTargetRef.current);
//         pendingCameraTargetRef.current = null;
//       }
//     }
//   }, [mapController, maps3dLib, elevationLib]);

//   useEffect(() => {
//     const calculatePadding = () => {
//       const consoleEl = consolePanelRef.current;
//       const trayEl = controlTrayRef.current;
//       const vh = window.innerHeight;
//       const vw = window.innerWidth;

//       if (!consoleEl || !trayEl) return;

//       const isMobile = window.matchMedia('(max-width: 768px)').matches;

//       const top = 0.05;
//       const right = 0.05;
//       let bottom = 0.05;
//       let left = 0.05;

//       if (!isMobile) {
//         left = Math.max(left, (consoleEl.offsetWidth / vw) + 0.02);
//         bottom = Math.max(bottom, (trayEl.offsetHeight / vh) + 0.02);
//       }

//       setPadding([top, right, bottom, left]);
//     };

//     const observer = new ResizeObserver(calculatePadding);
//     if (consolePanelRef.current) observer.observe(consolePanelRef.current);
//     if (controlTrayRef.current) observer.observe(controlTrayRef.current);
//     window.addEventListener('resize', calculatePadding);

//     calculatePadding();

//     return () => {
//       observer.disconnect();
//       window.removeEventListener('resize', calculatePadding);
//     };
//   }, []);

//   useEffect(() => {
//     if (!mapController || markers.length === 0) return;

//     const flyToMarkers = async () => {
//       if (preventAutoFrame) return;

//       const locations = markers.map(m => ({
//         lat: m.position.lat,
//         lng: m.position.lng,
//         alt: m.position.altitude || 0
//       }));

//       try {
//         if (!elevationLib) return;
//         const elevator = new elevationLib.ElevationService();
//         const cameraProps = await lookAtWithPadding(
//           locations,
//           elevator,
//           0,
//           padding
//         );

//         mapController.flyTo(cameraProps);
//       } catch (error) {
//         console.error('Error flying to markers:', error);
//       }
//     };

//     mapController.clearMarkers();
//     mapController.addMarkers(markers);
//     flyToMarkers();
//   }, [markers, mapController, padding, elevationLib, preventAutoFrame]);

//   useEffect(() => {
//     console.log('Camera target changed:', cameraTarget, 'MapController ready:', !!mapController);
//     if (!cameraTarget) return;

//     if (!mapController) {
//       // Store the camera target to apply later when map is ready
//       console.log('Map not ready yet, storing pending camera target');
//       pendingCameraTargetRef.current = cameraTarget;
//       return;
//     }

//     console.log('Flying to:', cameraTarget);
//     mapController.flyTo(cameraTarget);
//   }, [cameraTarget, mapController]);

//   useEffect(() => {
//     if (!mapController) return;
//     mapController.setRoutes(routes);
//   }, [routes, mapController]);

//   if (!GOOGLE_API_KEY) {
//     return (
//       <div style={{
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         padding: '2rem'
//       }}>
//         <div style={{
//           maxWidth: '600px',
//           background: 'white',
//           borderRadius: '16px',
//           padding: '2rem',
//           boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
//         }}>
//           <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '1rem' }}>
//             Google API Key Required
//           </h1>
//           <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
//             Please add your Google API key to the .env file as VITE_GOOGLE_API_KEY (for Gemini)
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <LiveAPIProvider
//       apiKey={GOOGLE_API_KEY}
//       map={mapRef.current}
//       placesLib={placesLib}
//       elevationLib={elevationLib}
//       geocoder={geocoder}
//       padding={padding}
//     >
//       <div className="app">
//         <div ref={consolePanelRef} className="console-panel">
//           <StreamingConsole />
//         </div>

//         <div className="map-container">
//           <Map3D
//             ref={mapRef}
//             center={{ lat: 25.2048, lng: 55.2708, altitude: 0 }}
//             range={50000}
//             heading={0}
//             tilt={45}
//             roll={0}
//           />
//           <GroundingWidget />
//         </div>

//         <div ref={controlTrayRef} className="control-tray-container">
//           <ControlTray />
//         </div>

//         <Sidebar />
//       </div>
//     </LiveAPIProvider>
//   );
// }

// function App() {
//   if (!GOOGLE_MAPS_API_KEY) {
//     return (
//       <div style={{
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         padding: '2rem'
//       }}>
//         <div style={{
//           maxWidth: '600px',
//           background: 'white',
//           borderRadius: '16px',
//           padding: '2rem',
//           boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
//         }}>
//           <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '1rem' }}>
//             Google Maps API Key Required
//           </h1>
//           <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
//             Please add your Google Maps API key to the .env file as VITE_GOOGLE_MAPS_API_KEY
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <APIProvider
//       version={'alpha'}
//       apiKey={GOOGLE_MAPS_API_KEY}
//       solutionChannel="gmp_aistudio_itineraryapplet_v1.0.0"
//     >
//       <AppComponent />
//     </APIProvider>
//   );
// }

// export default App;
import React from 'react';
import './index.css';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Chat with Maps - Real Estate
        </h1>

        <div style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#92400e',
            marginBottom: '1rem'
          }}>
            Setup Required
          </h2>
          <p style={{ color: '#78350f', lineHeight: '1.6', marginBottom: '1rem' }}>
            This application requires several API keys and additional setup to function:
          </p>
          <ul style={{ color: '#78350f', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li><strong>Google Maps API Key</strong> with the following APIs enabled:
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Maps JavaScript API</li>
                <li>Maps 3D API (Alpha)</li>
                <li>Places API (New)</li>
                <li>Geocoding API</li>
                <li>Elevation API</li>
              </ul>
            </li>
            <li style={{ marginTop: '0.5rem' }}><strong>Gemini API Key</strong> for AI-powered conversations</li>
            <li style={{ marginTop: '0.5rem' }}><strong>Complete component structure</strong> (currently missing)</li>
          </ul>
        </div>

        <div style={{
          background: '#e0e7ff',
          border: '2px solid #6366f1',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#3730a3',
            marginBottom: '1rem'
          }}>
            Missing Components
          </h2>
          <p style={{ color: '#3730a3', lineHeight: '1.6' }}>
            The following components and files are needed for this application to work:
          </p>
          <ul style={{ color: '#3730a3', lineHeight: '1.8', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>components/ControlTray</li>
            <li>components/ErrorScreen</li>
            <li>components/streaming-console/StreamingConsole</li>
            <li>components/popup/PopUp</li>
            <li>components/Sidebar</li>
            <li>components/map-3d/Map3D</li>
            <li>contexts/LiveAPIContext</li>
            <li>lib/state</li>
            <li>lib/map-controller</li>
            <li>hooks/use-live-api</li>
          </ul>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          background: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}>
            Would you like me to:
          </h3>
          <div style={{ color: '#4b5563', lineHeight: '1.8' }}>
            <p>1. Create a simplified demo version that doesn't require Google Maps API?</p>
            <p>2. Help you set up the required API keys and component structure?</p>
            <p>3. Build a different real estate application from scratch?</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
