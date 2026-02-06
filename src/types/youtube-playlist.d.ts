declare module 'youtube-playlist' {
  interface PlaylistItem {
    id?: string;
    name?: string;
    url?: string;
    duration?: number;
    isPrivate?: boolean;
  }
  interface PlaylistData {
    name?: string;
    playlist: PlaylistItem[];
  }
  const ytlist: (
    url: string,
    opt?: string | ('id' | 'name' | 'url' | 'duration')[]
  ) => Promise<{ data: PlaylistData }>;
  export = ytlist;
}
