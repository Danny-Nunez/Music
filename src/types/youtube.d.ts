export const enum PlayerState {
  UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
  }

  export interface Player {
    getPlayerState(): PlayerState;
    playVideo(): void;
    pauseVideo(): void;
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    mute(): void;
    unMute(): void;
  }

  export interface PlayerEvent {
    target: Player;
    data: PlayerState;
  }
