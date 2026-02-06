declare module 'youtube-music-api' {
  interface Thumbnail {
    url: string;
    width: number;
    height: number;
  }

  interface Artist {
    name: string;
    browseId: string;
  }

  interface Album {
    name: string;
    browseId: string;
    thumbnails: Thumbnail[];
    year?: string;
  }

  interface Song {
    name: string;
    videoId: string;
    playlistId?: string;
    artist: Artist[];
    album?: Album;
    duration?: number;
    thumbnails: Thumbnail[];
  }

  interface SearchResult {
    content: Song[]; // Adjust as per API response structure
    // Add additional properties as needed
  }

  class YoutubeMusicApi {
    constructor();
    initialize(): Promise<void>;
    initalize(): Promise<void>; // Include the typo to match the package's actual method
    search(query: string, type?: string): Promise<SearchResult>;
    getAlbum(albumId: string): Promise<Record<string, unknown>>;
    getPlaylist(browseId: string, contentLimit?: number): Promise<{
      title?: string;
      thumbnails?: Array<{ url: string }>;
      content: Array<{
        videoId: string;
        name: string;
        author?: { name: string } | Array<{ name: string }>;
        duration?: number;
        thumbnails?: Array<{ url: string }>;
      }>;
      error?: string;
    }>;
  }

  export = YoutubeMusicApi;
}
