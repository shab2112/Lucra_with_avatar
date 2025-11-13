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
  session_id: string;
  access_token: string;
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
    const response = await fetch(`${API_URL}/v1/streaming.new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        avatar_id: AVATAR_ID,
        voice: {
          voice_id: VOICE_ID,
        },
        knowledge_base_id: CONTEXT_ID,
        version: 'v2',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create session: ${error}`);
    }

    const data = await response.json();
    return {
      session_id: data.data.session_id,
      access_token: data.data.access_token,
    };
  }

  async startAvatar(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('LiveAvatar client not initialized');
    }

    try {
      this.videoElement = videoElement;

      const { access_token } = await this.createSession();

      const sessionConfig: SessionConfig = {
        voiceChat: true,
      };

      this.session = new LiveAvatarSession(access_token, sessionConfig);

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
