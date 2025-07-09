'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { PLAYLIST_UPDATED_EVENT, PLAYLIST_CREATED_EVENT, SONG_ADDED_EVENT } from '../../lib/events';
import { PlusIcon, CheckIcon, XMarkIcon, QueueListIcon  } from '@heroicons/react/24/outline';
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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

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
    <div className="fixed top-0 left-0 w-64 h-screen bg-black text-white p-6 flex flex-col hidden md:flex">
      <div className="mb-8">
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

      <nav className="space-y-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
          onClick={(e) => {
            // Prevent any interference with video playback
            e.stopPropagation();
          }}
        >
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
      </nav>

      {session?.user && (
        <div className="mt-8">
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
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 hover:brightness-110">
            {playlists.map((playlist) => (
              <Link
                key={`${playlist.id}-${playlist.songs?.[0]?.thumbnail || 'default'}`}
                href={`/playlists/${playlist.id}`}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                onClick={(e) => {
                  // Prevent any interference with video playback
                  e.stopPropagation();
                }}
              >
                <img
                  src={playlist.songs?.[0]?.thumbnail || '/defaultcover.png'}
                  alt={playlist.name}
                  className="w-10 h-10 object-cover rounded"
                />
                <span className="truncate">{playlist.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}