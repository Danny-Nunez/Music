'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { emitPlaylistCreated } from '../lib/events';

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface Playlist {
  id: string;
  name: string;
  userId: string;
}

interface PlaylistModalProps {
  onClose: () => void;
  song: Song;
}

export default function PlaylistModal({ onClose, song }: PlaylistModalProps) {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/playlists?userOnly=true');
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        setPlaylists(data);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchPlaylists();
    }
  }, [session?.user?.email]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlaylistName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      const newPlaylist = await response.json();
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setSuccessMessage('Playlist created successfully');
      emitPlaylistCreated(newPlaylist);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Adding song to playlist:', { playlistId, song });
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(song),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add song to playlist');
      }

      setSuccessMessage('Song added to playlist successfully');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error adding song to playlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add song to playlist');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#282828] p-6 rounded-lg">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#282828] p-6 rounded-lg">
          <div className="text-white mb-4">Please log in to add songs to playlists</div>
          <button
            onClick={onClose}
            className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#282828] p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
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
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name"
              className="flex-1 bg-[#3E3E3E] text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button
              onClick={handleCreatePlaylist}
              disabled={loading || !newPlaylistName.trim()}
              className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id)}
              disabled={loading}
              className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="text-white font-medium">{playlist.name}</h3>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-sm">{error}</div>
        )}

        {successMessage && (
          <div className="mt-4 text-green-500 text-sm">{successMessage}</div>
        )}

        {loading && (
          <div className="mt-4 text-gray-400 text-sm">Loading...</div>
        )}
      </div>
    </div>
  );
}