import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';

export function AvatarDisplay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { avatarClient, connected } = useLiveAPIContext();

  useEffect(() => {
    if (!avatarClient.current || !connected) {
      return;
    }

    const handleAvatarStarted = () => {
      setIsAvatarActive(true);
      setError(null);
    };

    const handleAvatarStopped = () => {
      setIsAvatarActive(false);
    };

    const handleError = (err: Error) => {
      setError(err.message);
      console.error('Avatar error:', err);
    };

    avatarClient.current.on('avatarStarted', handleAvatarStarted);
    avatarClient.current.on('avatarStopped', handleAvatarStopped);
    avatarClient.current.on('error', handleError);

    return () => {
      if (avatarClient.current) {
        avatarClient.current.off('avatarStarted', handleAvatarStarted);
        avatarClient.current.off('avatarStopped', handleAvatarStopped);
        avatarClient.current.off('error', handleError);
      }
    };
  }, [avatarClient, connected]);

  useEffect(() => {
    if (connected && avatarClient.current && hiddenVideoRef.current && !isAvatarActive) {
      avatarClient.current.startAvatar(hiddenVideoRef.current).catch(err => {
        console.error('Failed to start avatar:', err);
        setError(err.message);
      });
    }
  }, [connected, avatarClient, isAvatarActive]);

  useEffect(() => {
    const processVideo = () => {
      const video = hiddenVideoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !isAvatarActive) {
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const draw = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (g > 90 && g > r * 1.5 && g > b * 1.5) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    processVideo();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAvatarActive]);

  if (!connected) {
    return null;
  }

  return (
    <div className="avatar-display">
      <video
        ref={hiddenVideoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
        muted={false}
      />
      <canvas
        ref={canvasRef}
        className="avatar-video"
      />
      {error && (
        <div className="avatar-error">
          <p>Avatar Error: {error}</p>
        </div>
      )}
    </div>
  );
}
