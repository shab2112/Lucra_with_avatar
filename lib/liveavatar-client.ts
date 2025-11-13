import { LiveAvatarSession, SessionConfig, SessionState, SessionEvent } from '@heygen/liveavatar-web-sdk';
import { API_KEY, AVATAR_ID, VOICE_ID, CONTEXT_ID } from './secrets';
import EventEmitter from 'eventemitter3';

export interface LiveAvatarEvents {
  ready: () => void;
  speaking: (isSpeaking: boolean) => void;
  error: (error: Error) => void;
  avatarStarted: () => void;
  avatarStopped: () => void;
}

export class LiveAvatarClient {
  private session: LiveAvatarSession | null = null;
  private emitter = new EventEmitter<LiveAvatarEvents>();
  private isInitialized = false;

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

  async startAvatar(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('LiveAvatar client not initialized');
    }

    try {
      const sessionConfig: SessionConfig = {
        token: API_KEY,
        avatarId: AVATAR_ID,
        voiceId: VOICE_ID,
        knowledgeBaseId: CONTEXT_ID,
        video: videoElement,
      };

      this.session = new LiveAvatarSession(sessionConfig);

      this.session.on(SessionEvent.STATE_CHANGE, (state: SessionState) => {
        if (state === SessionState.CONNECTED) {
          this.emitter.emit('avatarStarted');
        } else if (state === SessionState.DISCONNECTED) {
          this.emitter.emit('avatarStopped');
        }
      });

      await this.session.connect();
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
      await this.session.speak(text);
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
      await this.session.interrupt();
    } catch (error) {
      console.error('Failed to interrupt avatar:', error);
    }
  }

  async stopAvatar(): Promise<void> {
    if (!this.session) {
      return;
    }

    try {
      await this.session.disconnect();
      this.session = null;
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
