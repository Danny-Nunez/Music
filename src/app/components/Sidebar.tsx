'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { PLAYLIST_UPDATED_EVENT, PLAYLIST_CREATED_EVENT, SONG_ADDED_EVENT } from '../../lib/events';
import { PlusIcon, CheckIcon, XMarkIcon, QueueListIcon  } from '@heroicons/react/24/outline';
import { 
  Home, 
  Music, 
  Mic, 
  Drum, 
  Dumbbell, 
  Zap, 
  Heart, 
  Palmtree, 
  Salad, 
  PartyPopper, 
  Smile 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Song {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface Playlist {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  songs: Song[];
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Helper function to check if a route is active
  const isActive = (path: string) => pathname === path;
  const isGenreActive = (genre: string) => pathname.startsWith(`/genre/${genre}`);
  const isPlaylistActive = (playlistId: string) => pathname === `/playlists/${playlistId}`;

  const fetchPlaylists = useCallback(async () => {
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
  }, [session?.user?.email]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  useEffect(() => {
    const handlePlaylistUpdate = (event: CustomEvent<{ playlistId: string; newName: string }>) => {
      setPlaylists(prevPlaylists =>
        prevPlaylists.map(playlist =>
          playlist.id === event.detail.playlistId
            ? { ...playlist, name: event.detail.newName }
            : playlist
        )
      );
    };

    const handlePlaylistCreated = (event: CustomEvent<{ playlist: Playlist }>) => {
      setPlaylists(prevPlaylists => [...prevPlaylists, event.detail.playlist]);
    };

    const handleSongAdded = (event: CustomEvent<{ playlistId: string; updatedPlaylist: Playlist }>) => {
      setPlaylists(prevPlaylists =>
        prevPlaylists.map(playlist =>
          playlist.id === event.detail.playlistId
            ? { ...playlist, songs: event.detail.updatedPlaylist.songs }
            : playlist
        )
      );
    };

    window.addEventListener(PLAYLIST_UPDATED_EVENT, handlePlaylistUpdate as EventListener);
    window.addEventListener(PLAYLIST_CREATED_EVENT, handlePlaylistCreated as EventListener);
    window.addEventListener(SONG_ADDED_EVENT, handleSongAdded as EventListener);

    return () => {
      window.removeEventListener(PLAYLIST_UPDATED_EVENT, handlePlaylistUpdate as EventListener);
      window.removeEventListener(PLAYLIST_CREATED_EVENT, handlePlaylistCreated as EventListener);
      window.removeEventListener(SONG_ADDED_EVENT, handleSongAdded as EventListener);
    };
  }, []);

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
      toast.success('Playlist created');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create playlist');
    }
  };

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-black text-white flex flex-col hidden md:flex overflow-y-auto ">
      <div className="flex-shrink-0 p-6 mb-8">
        <Link 
          href="/" 
          className="text-2xl font-bold hover:text-white/90 transition-colors flex"
          onClick={(e) => {
            // Prevent any interference with video playback
            e.stopPropagation();
          }}
        >
          <img
            src="/logo.png"
            alt="logo"
            className="w-8 h-8 mr-2"
          />
          Beatinbox
        </Link>
      </div>

      <nav className="flex-shrink-0 space-y-4 px-6">
        <Link
          href="/"
          className={`flex items-center gap-3 transition-colors ${
            isActive('/') 
              ? 'text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={(e) => {
            // Prevent any interference with video playback
            e.stopPropagation();
          }}
        >
          <div className={`p-2 rounded-lg transition-colors ${
            isActive('/') 
              ? 'bg-red-600/20 text-red-400' 
              : ''
          }`}>
            <Home className="w-5 h-5" />
          </div>
          Home
        </Link>
        
        <div className="pt-4 border-t border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Genres</h3>
          
          <Link
            href="/genre/pop"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('pop') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('pop') 
                ? 'bg-purple-600/20 text-purple-400' 
                : ''
            }`}>
              <Music className="w-5 h-5" />
            </div>
            Pop
          </Link>
          
          <Link
            href="/genre/hiphop"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('hiphop') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('hiphop') 
                ? 'bg-orange-600/20 text-orange-400' 
                : ''
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            Hip Hop
          </Link>
          
          <Link
            href="/genre/rock"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('rock') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('rock') 
                ? 'bg-red-600/20 text-red-400' 
                : ''
            }`}>
              <Drum className="w-5 h-5" />
            </div>
            Rock
          </Link>
          
          <Link
            href="/genre/workout"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('workout') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('workout') 
                ? 'bg-green-600/20 text-green-400' 
                : ''
            }`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            Workout
          </Link>
          
          <Link
            href="/genre/electronic"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('electronic') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('electronic') 
                ? 'bg-blue-600/20 text-blue-400' 
                : ''
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            Electronic
          </Link>
          
          <Link
            href="/genre/rnb"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('rnb') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('rnb') 
                ? 'bg-pink-600/20 text-pink-400' 
                : ''
            }`}>
              <Heart className="w-5 h-5" />
            </div>
            R&B
          </Link>
          
          <Link
            href="/genre/reggae"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('reggae') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('reggae') 
                ? 'bg-green-600/20 text-green-400' 
                : ''
            }`}>
              <Palmtree className="w-5 h-5" />
            </div>
            Reggae
          </Link>
          
          <Link
            href="/genre/latin"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('latin') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('latin') 
                ? 'bg-yellow-600/20 text-yellow-400' 
                : ''
            }`}>
              <Salad className="w-5 h-5" />
            </div>
            Latin
          </Link>
          
          <Link
            href="/genre/party"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('party') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('party') 
                ? 'bg-indigo-600/20 text-indigo-400' 
                : ''
            }`}>
              <PartyPopper className="w-5 h-5" />
            </div>
            Party
          </Link>
          
          <Link
            href="/genre/goodvibe"
            className={`flex items-center gap-3 transition-colors ${
              isGenreActive('goodvibe') 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              isGenreActive('goodvibe') 
                ? 'bg-cyan-600/20 text-cyan-400' 
                : ''
            }`}>
              <Smile className="w-5 h-5" />
            </div>
            Good Vibes
          </Link>
        </div>
      </nav>

      {session?.user && (
        <div className="flex-1 min-h-0 mt-8 px-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QueueListIcon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Your Playlists</h2>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Create new playlist"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          {isCreating && (
            <div className="mb-4 relative w-48">
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
          <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-2 hover:brightness-110 pb-32">
            {playlists.map((playlist) => (
              <Link
                key={`${playlist.id}-${playlist.songs?.[0]?.thumbnail || 'default'}`}
                href={`/playlists/${playlist.id}`}
                className={`flex items-center gap-3 transition-colors ${
                  isPlaylistActive(playlist.id) 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={(e) => {
                  // Prevent any interference with video playback
                  e.stopPropagation();
                }}
              >
                <div className={`rounded transition-colors ${
                  isPlaylistActive(playlist.id) 
                    ? 'ring-2 ring-red-400/50' 
                    : ''
                }`}>
                  <img
                    src={playlist.songs?.[0]?.thumbnail || '/defaultcover.png'}
                    alt={playlist.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                </div>
                <span className="truncate">{playlist.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}