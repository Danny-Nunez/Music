'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { PLAYLIST_UPDATED_EVENT, PLAYLIST_CREATED_EVENT, SONG_ADDED_EVENT, emitPlaylistCreated } from '../../lib/events';
import { useRouter } from 'next/navigation';
import { PlusIcon, CheckIcon, XMarkIcon, QueueListIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SignInModal from '@/components/SignInModal';
import ArtistPageAddToPlaylistButton from '@/components/ArtistPageAddToPlaylistButton';
import { usePlayerStore } from '../../store/playerStore';

interface ArtistResult {
  text: string;
  id: string;
  type: 'artist';
  exactMatch?: boolean;
}

interface SongResult {
  type: 'song';
  videoId: string;
  name: string;
  artist: {
    name: string;
    browseId: string;
  };
  album?: {
    name: string;
    browseId: string;
  };
  duration: number;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
}

interface VideoResult {
  type: 'video';
  videoId: string;
  name: string;
  author: string;
  views: string;
  duration: number;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  };
}

type SearchResult = ArtistResult | VideoResult | SongResult;

interface Song {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export default function Header() {
  const { data: session, status } = useSession();
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/playlists?userOnly=true');
          if (response.ok) {
            const data = await response.json();
            setPlaylists(data);
          }
        } catch (error) {
          console.error('Error fetching playlists:', error);
        }
      }
    };

    fetchPlaylists();
  }, [session?.user?.email]);

  useEffect(() => {
    const handlePlaylistUpdate = (event: CustomEvent<{ playlistId: string; newName: string }>) => {
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((playlist) =>
          playlist.id === event.detail.playlistId
            ? { ...playlist, name: event.detail.newName }
            : playlist
        )
      );
    };
  
    const handlePlaylistCreated = (event: CustomEvent<{ playlist: Playlist }>) => {
      const newPlaylist = {
        ...event.detail.playlist,
        songs: [], // Ensure songs array exists
      };
      setPlaylists((prevPlaylists) => [...prevPlaylists, newPlaylist]);
    };
  
    const handleSongAdded = (event: CustomEvent<{ playlistId: string; updatedPlaylist: Playlist }>) => {
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((playlist) =>
          playlist.id === event.detail.playlistId
            ? { ...playlist, songs: event.detail.updatedPlaylist.songs }
            : playlist
        )
      );
    };
  
    // Add event listeners
    window.addEventListener(PLAYLIST_UPDATED_EVENT, handlePlaylistUpdate as EventListener);
    window.addEventListener(PLAYLIST_CREATED_EVENT, handlePlaylistCreated as EventListener);
    window.addEventListener(SONG_ADDED_EVENT, handleSongAdded as EventListener);
  
    return () => {
      // Remove event listeners
      window.removeEventListener(PLAYLIST_UPDATED_EVENT, handlePlaylistUpdate as EventListener);
      window.removeEventListener(PLAYLIST_CREATED_EVENT, handlePlaylistCreated as EventListener);
      window.removeEventListener(SONG_ADDED_EVENT, handleSongAdded as EventListener);
    };
  }, []);
  

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    let songs = [];
    let videos = [];
    let artists = [];

    try {
      // Fetch songs from YouTube Music API
      const songResponse = await fetch(`/api/youtubemusic?q=${encodeURIComponent(query)}&type=song`);
      if (songResponse.ok) {
        const songData = await songResponse.json();
        songs = songData.content || [];
      }
    } catch (error) {
      console.error('Song search error:', error);
    }

    try {
      // Fetch videos from YouTube Music API
      const videoResponse = await fetch(`/api/youtubemusic?q=${encodeURIComponent(query)}&type=video`);
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        videos = videoData.content || [];
      }
    } catch (error) {
      console.error('Video search error:', error);
    }

    try {
      // Fetch artists from search API
      const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        artists = searchData.artists || [];
      }
    } catch (error) {
      console.error('Artist search error:', error);
    }

    // Combine results from all sources
    const combinedResults = [...songs, ...artists, ...videos];
    setSearchResults(combinedResults);
    setShowResults(combinedResults.length > 0);
    setIsSearching(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isSearchContainer = target.closest('.search-container');
    const isVideoClick = target.closest('button') || target.closest('.video-result');
    const isPlayPauseClick = target.closest('.play-pause-button');
    
    // Don't close if clicking inside search container, video elements, or play/pause button
    if (!isSearchContainer && !isVideoClick && !isPlayPauseClick) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleArtistClick = (result: ArtistResult) => {
    setShowResults(false);
    setSearchQuery('');
    
    // Handle artist click
    const pathSegments = result.id.split('/').filter(Boolean);
    console.log('Navigating to artist:', {
      originalId: result.id,
      pathSegments
    });
    router.push(`/artist/${pathSegments.join('/')}`);
  };

  const handleVideoClick = (result: VideoResult, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    const player = document.querySelector('iframe')?.contentWindow;
    setCurrentTrack({
      id: result.videoId,
      videoId: result.videoId,
      title: result.name,
      artist: result.author,
      thumbnail: result.thumbnails.url
    });
    player?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    setIsPlaying(true);
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create playlist');
      }

      const newPlaylist = await response.json();
      setPlaylists(prev => [...prev, newPlaylist]);
      setNewPlaylistName('');
      setIsCreating(false);
      emitPlaylistCreated(newPlaylist);
      toast.success('Playlist created');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create playlist');
    }
  };

  const handleNavLinkClick = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 md:left-64 right-0 h-20 bg-black/95 backdrop-blur-sm headernav z-40 flex items-center justify-between px-4 md:px-4 max-w-screen-lg">
        <div className="flex-1 max-w-xl relative search-container mr-10 inline-flex z-40">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder="Search artists..."
              className="w-full bg-zinc-900 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>

          {showResults && searchResults.length > 0 && (
            <div 
              className="absolute top-full mt-2 w-full bg-[#282828] rounded-lg shadow-lg overflow-hidden max-h-[400px] overflow-y-auto z-40 search-container"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {/* Artists Section */}
              {searchResults.some(r => r.type === 'artist') && (
                <div>
                  <div className="px-3 py-2 bg-[#1d1d1d] border-b border-[#383838]">
                    <h3 className="text-gray-400 text-sm font-medium">Artists</h3>
                  </div>
                  {searchResults.filter(r => r.type === 'artist').map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-3 hover:bg-[#383838] cursor-pointer"
                      onClick={() => handleArtistClick(result as ArtistResult)}
                    >
                      <div>
                        <h4 className="text-white font-medium">{(result as ArtistResult).text}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Songs Section */}
              {searchResults.some(r => r.type === 'song') && (
                <div>
                  <div className="px-3 py-2 bg-[#1d1d1d] border-b border-[#383838]">
                    <h3 className="text-gray-400 text-sm font-medium">Songs</h3>
                  </div>
                  {searchResults.filter(r => r.type === 'song').map((result) => {
                    const songResult = result as SongResult;
                    const thumbnail = songResult.thumbnails[songResult.thumbnails.length - 1]?.url;
                    return (
                      <div
                        key={songResult.videoId}
                        className="group flex items-center gap-3 p-3 hover:bg-[#383838] cursor-default video-result"
                      >
                        <div className="flex items-center gap-3 w-full video-result">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={thumbnail}
                              alt={songResult.name}
                              fill
                              className="object-cover rounded"
                            />
                            {currentTrack?.videoId === songResult.videoId ? (
                              <div 
                                className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors video-result"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const player = document.querySelector('iframe')?.contentWindow;
                                    if (isPlaying) {
                                      player?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                                      setIsPlaying(false);
                                    } else {
                                      player?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                      setIsPlaying(true);
                                    }
                                    return false;
                                  }}
                                  className="z-10 video-result play-pause-button"
                                >
                                  <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                                    {isPlaying ? (
                                      <PauseIcon className="h-4 w-4 text-white pointer-events-none" />
                                    ) : (
                                      <PlayIcon className="h-4 w-4 text-white pointer-events-none" />
                                    )}
                                  </div>
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors video-result"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCurrentTrack({
                                        id: songResult.videoId,
                                        videoId: songResult.videoId,
                                        title: songResult.name,
                                        artist: songResult.artist.name,
                                        thumbnail: thumbnail
                                      });
                                      const player = document.querySelector('iframe')?.contentWindow;
                                      player?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                      setIsPlaying(true);
                                    }}
                                    className="z-10 video-result"
                                  >
                                    <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                                      <PlayIcon className="h-4 w-4 text-white pointer-events-none" />
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium line-clamp-1">{songResult.name}</h4>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <span>{songResult.artist.name}</span>
                              {songResult.album && (
                                <>
                                  <span>•</span>
                                  <span>{songResult.album.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArtistPageAddToPlaylistButton
                            track={{
                              id: songResult.videoId,
                              videoId: songResult.videoId,
                              title: songResult.name,
                              thumbnail: thumbnail,
                              artist: songResult.artist.name
                            }}
                            className="opacity-0 group-hover:opacity-100 video-result"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Videos Section */}
              {searchResults.some(r => r.type === 'video') && (
                <div>
                  <div className="px-3 py-2 bg-[#1d1d1d] border-b border-[#383838]">
                    <h3 className="text-gray-400 text-sm font-medium">Videos</h3>
                  </div>
                  {searchResults.filter(r => r.type === 'video').map((result) => (
                    <div
                      key={result.videoId}
                      className="group flex items-center gap-3 p-3 hover:bg-[#383838] cursor-default video-result"
                    >
                      <div 
                        className="flex items-center gap-3 w-full video-result"
                      >
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={(result as VideoResult).thumbnails.url}
                            alt={(result as VideoResult).name}
                            fill
                            className="object-cover rounded"
                          />
                          {currentTrack?.videoId === result.videoId ? (
                            <div 
                              className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors video-result"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const player = document.querySelector('iframe')?.contentWindow;
                                    if (isPlaying) {
                                      player?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                                      setIsPlaying(false);
                                    } else {
                                      player?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                      setIsPlaying(true);
                                    }
                                    return false;
                                  }}
                                  className="z-10 video-result play-pause-button"
                              >
                                <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                                  {isPlaying ? (
                                    <PauseIcon className="h-4 w-4 text-white pointer-events-none" />
                                  ) : (
                                    <PlayIcon className="h-4 w-4 text-white pointer-events-none" />
                                  )}
                                </div>
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors video-result"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleVideoClick(result as VideoResult, e);
                                  }}
                                  className="z-10 video-result"
                                >
                                  <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                                    <PlayIcon className="h-4 w-4 text-white pointer-events-none" />
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium line-clamp-1">{(result as VideoResult).name}</h4>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <span>{(result as VideoResult).author}</span>
                            <span>•</span>
                            <span>{(result as VideoResult).views}</span>
                          </div>
                        </div>
                        <ArtistPageAddToPlaylistButton
                          track={{
                            id: result.videoId,
                            videoId: result.videoId,
                            title: result.name,
                            thumbnail: result.thumbnails.url,
                            artist: result.author
                          }}
                          className="opacity-0 group-hover:opacity-100 video-result"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 z-40">
          <button
            className="text-white md:hidden"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          >
            {isMobileNavOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            )}
          </button>

          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : session?.user ? (
            <div className="hidden md:flex items-center gap-3">
              <Image
                src={session.user.image || '/default-user.png'}
                alt={session.user.name || 'User'}
                width={38}
                height={38}
                className="rounded-full"
              />
              <button
                onClick={async () => {
                  await signOut({ callbackUrl: '/' });
                  toast.success('You have been signed out');
                }}
                className="text-black font-semibold bg-white px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSignInModal(true)}
              className="hidden md:flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>

        <div
          className={`headernavSlider z-30 fixed bg-gradient-to-b from-black to-zinc-800 top-0 left-0 right-0 p-4 md:hidden transform transition-transform duration-300 ease-in-out ${
            isMobileNavOpen ? 'translate-y-20' : '-translate-y-full'
          }`}
        >
          <nav className="space-y-4">
            <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colorse" onClick={handleNavLinkClick}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </Link>
            {session?.user && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4 mt-8">
                  <h2 className="text-lg font-semibold text-white flex"><QueueListIcon className="h-5 w-5 mt-1 mr-2"/>Your Playlists</h2>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Create new playlist"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                {isCreating && (
                  <div className="mb-4 relative w-full">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="New playlist"
                      className="w-full bg-gray-800 text-white pl-3 pr-16 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          createPlaylist();
                        } else if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewPlaylistName('');
                        }
                      }}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        onClick={createPlaylist}
                        className="text-green-500 hover:text-green-400 transition-colors p-1"
                        title="Save playlist"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setNewPlaylistName('');
                        }}
                        className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                        title="Cancel"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-2 overflow-y-auto max-h-[400px]">
                  {playlists.map((playlist) => (
                    <Link
                      key={`${playlist.id}-${playlist.songs?.[0]?.thumbnail || 'default'}`}
                      href={`/playlists/${playlist.id}`}
                      className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors hover:brightness-110"
                      onClick={handleNavLinkClick}
                    >
                      <Image
                        src={playlist.songs?.[0]?.thumbnail || '/defaultcover.png'}
                        alt={playlist.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded"
                        loading="lazy"
                      />
                      <span className="truncate">{playlist.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {session?.user ? (
              <div className="pt-10 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <Image
                    src={session.user.image || '/default-user.png'}
                    alt={session.user.name || 'User'}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <button
                    onClick={async () => {
                      setIsMobileNavOpen(false);
                      await signOut({ callbackUrl: '/' });
                      toast.success('You have been signed out');
                    }}
                    className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-10 border-t border-gray-800 pb-2">
              <button
            
                onClick={() => setShowSignInModal(true)}
                className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
              >
                Sign in
              </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      {showSignInModal && (
        <SignInModal onClose={() => setShowSignInModal(false)} />
      )}
    </>
  );
}
