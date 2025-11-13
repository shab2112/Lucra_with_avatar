import { LiveAvatarSession, SessionConfig, SessionState, SessionEvent } from '@heygen/liveavatar-web-sdk';
import { API_KEY, API_URL, AVATAR_ID, VOICE_ID, CONTEXT_ID } from './secrets';
import EventEmitter from 'eventemitter3';

export interface LiveAvatarEvents {
  ready: () => void;
  speaking: (isSpeaking: boolean) => void;
  error: (error: Error) => void;
  avatarStarted: () => void;
  avatarStopped: () => void;
}

interface CreateSessionResponse {
  sessionId: string;
  sessionToken: string;
}

export class LiveAvatarClient {
  private session: LiveAvatarSession | null = null;
  private emitter = new EventEmitter<LiveAvatarEvents>();
  private isInitialized = false;
  private videoElement: HTMLVideoElement | null = null;

  public on = this.emitter.on.bind(this.emitter);
  public off = this.emitter.off.bind(this.emitter);

  constructor() {}

  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      this.emitter.emit('ready');
    } catch (error) {
      console.error('Failed to initialize LiveAvatar:', error);
      this.emitter.emit('error', error as Error);
      throw error;
    }
  }

  private async createSession(): Promise<CreateSessionResponse> {
    console.log('Creating LiveAvatar session via edge function...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/create-liveavatar-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create session:', response.status, error);
      throw new Error(`Failed to create session (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log('Session token received:', data);
    return {
      sessionId: data.sessionId,
      sessionToken: data.sessionToken,
    };
  }

  async startAvatar(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('LiveAvatar client not initialized');
    }

    try {
      this.videoElement = videoElement;

      const { sessionId, sessionToken } = await this.createSession();

      const sessionConfig: SessionConfig = {
        voiceChat: true,
        apiUrl: API_URL,
      };

      this.session = new LiveAvatarSession(sessionToken, sessionConfig);

      this.session.on(SessionEvent.STATE_CHANGE, (state: SessionState) => {
        console.log('Avatar state changed:', state);
        if (state === SessionState.CONNECTED) {
          this.emitter.emit('avatarStarted');
        } else if (state === SessionState.DISCONNECTED) {
          this.emitter.emit('avatarStopped');
        }
      });

      await this.session.start();

      this.session.attach(videoElement);
    } catch (error) {
      console.error('Failed to start avatar:', error);
      this.emitter.emit('error', error as Error);
      throw error;
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.session) {
      console.error('No active avatar session');
      return;
    }

    try {
      this.session.message(text);
    } catch (error) {
      console.error('Failed to make avatar speak:', error);
      this.emitter.emit('error', error as Error);
      throw error;
    }
  }

  async interrupt(): Promise<void> {
    if (!this.session) {
      return;
    }

    try {
      this.session.interrupt();
    } catch (error) {
      console.error('Failed to interrupt avatar:', error);
    }
  }

  async stopAvatar(): Promise<void> {
    if (!this.session) {
      return;
    }

    try {
      await this.session.stop();
      this.session = null;
      this.videoElement = null;
      this.emitter.emit('avatarStopped');
    } catch (error) {
      console.error('Failed to stop avatar:', error);
      this.emitter.emit('error', error as Error);
    }
  }

  isAvatarActive(): boolean {
    return this.session !== null;
  }
}
