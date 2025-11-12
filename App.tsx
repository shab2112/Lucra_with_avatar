import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { Map3D } from './components/map-3d';
import ControlTray from './components/ControlTray';
import StreamingConsole from './components/streaming-console/StreamingConsole';
import Sidebar from './components/Sidebar';
import { GroundingWidget } from './components/GroundingWidget';
import { useMapStore } from './lib/state';
import { MapController } from './lib/map-controller';
import { lookAtWithPadding } from './lib/look-at';
import './index.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

function AppComponent() {
  const mapRef = useRef<google.maps.maps3d.Map3DElement | null>(null);
  const consolePanelRef = useRef<HTMLDivElement>(null);
  const controlTrayRef = useRef<HTMLDivElement>(null);
  const [mapController, setMapController] = useState<MapController | null>(null);
  const [padding, setPadding] = useState<[number, number, number, number]>([0.05, 0.05, 0.05, 0.35]);

  const placesLib = useMapsLibrary('places');
  const elevationLib = useMapsLibrary('elevation');
  const geocodingLib = useMapsLibrary('geocoding');
  const maps3dLib = useMapsLibrary('maps3d');

  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const { markers, routes, cameraTarget, preventAutoFrame } = useMapStore();

  useEffect(() => {
    if (geocodingLib && !geocoder) {
      setGeocoder(new geocodingLib.Geocoder());
    }
  }, [geocodingLib, geocoder]);

  useEffect(() => {
    if (mapRef.current && !mapController && maps3dLib && elevationLib) {
      const controller = new MapController({
        map: mapRef.current,
        maps3dLib: maps3dLib,
        elevationLib: elevationLib,
      });
      setMapController(controller);
    }
  }, [mapController, maps3dLib, elevationLib]);

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
        bottom = Math.max(bottom, (trayEl.offsetHeight / vh) + 0.02);
      }

      setPadding([top, right, bottom, left]);
    };

    const observer = new ResizeObserver(calculatePadding);
    if (consolePanelRef.current) observer.observe(consolePanelRef.current);
    if (controlTrayRef.current) observer.observe(controlTrayRef.current);
    window.addEventListener('resize', calculatePadding);

    calculatePadding();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculatePadding);
    };
  }, []);

  useEffect(() => {
    if (!mapController || markers.length === 0) return;

    const flyToMarkers = async () => {
      if (preventAutoFrame) return;

      const locations = markers.map(m => ({
        lat: m.position.lat,
        lng: m.position.lng,
        alt: m.position.altitude || 0
      }));

      try {
        if (!elevationLib) return;
        const elevator = new elevationLib.ElevationService();
        const cameraProps = await lookAtWithPadding(
          locations,
          elevator,
          0,
          padding
        );

        mapController.flyTo(cameraProps);
      } catch (error) {
        console.error('Error flying to markers:', error);
      }
    };

    mapController.clearMarkers();
    mapController.addMarkers(markers);
    flyToMarkers();
  }, [markers, mapController, padding, elevationLib, preventAutoFrame]);

  useEffect(() => {
    console.log('Camera target changed:', cameraTarget, 'MapController ready:', !!mapController);
    if (!mapController || !cameraTarget) return;
    console.log('Flying to:', cameraTarget);
    mapController.flyTo(cameraTarget);
  }, [cameraTarget, mapController]);

  useEffect(() => {
    if (!mapController) return;
    mapController.setRoutes(routes);
  }, [routes, mapController]);

  if (!GOOGLE_API_KEY) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '1rem' }}>
            Google API Key Required
          </h1>
          <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
            Please add your Google API key to the .env file as VITE_GOOGLE_API_KEY (for Gemini)
          </p>
        </div>
      </div>
    );
  }

  return (
    <LiveAPIProvider
      apiKey={GOOGLE_API_KEY}
      map={mapRef.current}
      placesLib={placesLib}
      elevationLib={elevationLib}
      geocoder={geocoder}
      padding={padding}
    >
      <div className="app">
        <div ref={consolePanelRef} className="console-panel">
          <StreamingConsole />
        </div>

        <div className="map-container">
          <Map3D
            ref={mapRef}
            center={{ lat: 25.2048, lng: 55.2708, altitude: 0 }}
            range={50000}
            heading={0}
            tilt={45}
            roll={0}
          />
          <GroundingWidget />
        </div>

        <div ref={controlTrayRef} className="control-tray-container">
          <ControlTray />
        </div>

        <Sidebar />
      </div>
    </LiveAPIProvider>
  );
}

function App() {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '1rem' }}>
            Google Maps API Key Required
          </h1>
          <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
            Please add your Google Maps API key to the .env file as VITE_GOOGLE_MAPS_API_KEY
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      version={'alpha'}
      apiKey={GOOGLE_MAPS_API_KEY}
      solutionChannel="gmp_aistudio_itineraryapplet_v1.0.0"
    >
      <AppComponent />
    </APIProvider>
  );
}

export default App;
