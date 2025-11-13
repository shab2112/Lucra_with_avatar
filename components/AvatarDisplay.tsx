import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';

export function AvatarDisplay() {
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (connected && avatarClient.current && videoRef.current && !isAvatarActive) {
      avatarClient.current.startAvatar(videoRef.current).catch(err => {
        console.error('Failed to start avatar:', err);
        setError(err.message);
      });
    }
  }, [connected, avatarClient, isAvatarActive]);

  if (!connected) {
    return null;
  }

  return (
    <div className="avatar-display">
      <video
        ref={videoRef}
        className="avatar-video"
        autoPlay
        playsInline
        muted={false}
      />
      {error && (
        <div className="avatar-error">
          <p>Avatar Error: {error}</p>
        </div>
      )}
    </div>
  );
}
