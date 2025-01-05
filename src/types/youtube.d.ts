declare namespace YT {
  interface Player {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    mute(): void;
    unMute(): void;
  }

  interface PlayerEvent {
    target: Player;
    data: number;
  }
}