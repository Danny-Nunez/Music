'use client';

import { useEffect, useState, useCallback } from 'react';
import { emitPlaylistUpdated } from '../../../lib/events';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { XMarkIcon, PlayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '../../../store/playerStore';
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
  songs: Song[];
}

export default function PlaylistPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const { setCurrentTrack, setQueue } = usePlayerStore();
  const [opacity, setOpacity] = useState(1);
  const isOwner = session?.user?.id === playlist?.userId;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const newOpacity = Math.max(1 - scrollTop / 300, 0);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchPlaylist = useCallback(async () => {
    try {
      const response = await fetch(`/api/playlists/${params.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch playlist');
      }
      const data = await response.json();
      setPlaylist(data);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params) {
      fetchPlaylist();
    }
  }, [params, fetchPlaylist]);

  const removeSong = async (videoId: string) => {
    try {
      const songToRemove = playlist?.songs.find((song) => song.videoId === videoId);

      const response = await fetch(`/api/playlists/${params.id}/songs`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: videoId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove song');
      }

      // Update local state
      setPlaylist(prev => {
        if (!prev) return null;
        return {
          ...prev,
          songs: prev.songs.filter(song => song.videoId !== videoId)
        };
      });

      toast.success(`Successfully removed "${songToRemove?.title}" from the playlist`);
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove song');
    }
  };

  const playAll = () => {
    if (playlist && playlist.songs.length > 0) {
      const formattedSongs = playlist.songs.map(song => ({
        id: song.videoId,
        videoId: song.videoId,
        title: song.title,
        artist: song.artist || 'From Playlist',
        thumbnail: song.thumbnail
      }));

      // Set the first song as current and the rest as queue
      setCurrentTrack(formattedSongs[0]);
      setQueue(formattedSongs);
      toast.success('Playing playlist');
    }
  };

  const updatePlaylistName = async () => {
    if (!playlist || !editedName.trim()) return;

    try {
      const response = await fetch(`/api/playlists/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update playlist');
      }

      const newName = editedName.trim();
      setPlaylist(prev => prev ? { ...prev, name: newName } : null);
      setIsEditing(false);
      emitPlaylistUpdated(params.id as string, newName);
      toast.success('Playlist name updated');
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update playlist');
    }
  };

  const deletePlaylist = async () => {
    if (!playlist || !window.confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const response = await fetch(`/api/playlists/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete playlist');
      }

      toast.success('Playlist deleted');
      window.location.href = '/'; // Redirect to home page
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete playlist');
    }
  };

  const playSong = (song: Song, index: number) => {
    if (!playlist) return;

    // Format all songs
    const formattedSongs = playlist.songs.map(s => ({
      id: s.videoId,
      videoId: s.videoId,
      title: s.title,
      artist: s.artist || 'From Playlist',
      thumbnail: s.thumbnail
    }));

    // Set the clicked song as current
    setCurrentTrack(formattedSongs[index]);

    // Reorder queue to start from the clicked song
    const reorderedQueue = [
      ...formattedSongs.slice(index),
      ...formattedSongs.slice(0, index)
    ];
    setQueue(reorderedQueue);
  };

  useEffect(() => {
    if (playlist) {
      console.log('Song URLs and Image URLs:');
      playlist.songs.forEach((song) => {
        console.log(`Song URL: https://www.youtube.com/watch?v=${song.videoId}`);
        console.log(`Image URL: ${song.thumbnail}`);
      });
    }
  }, [playlist]);
  

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white pt-20 rounded-lg max-w-screen-lg">
        <div className="flex items-center justify-center min-h-[300px] bg-[#121212]">
          <div className="animate-pulse w-16 h-16 rounded-full bg-white/10"></div>
        </div>
        <div className="p-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white mx-4 rounded-xl mb-8 max-w-screen-lg">
    {/* Hero Banner */}
<div className="relative h-[250px] w-full flex flex-col md:flex-row items-center md:items-stretch">
  {playlist.songs.length >= 4 ? (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full md:w-1/4 h-full">
      {playlist.songs.slice(0, 4).map((song, index) => (
        <img
          key={song.videoId}
          src={song.thumbnail || '/defaultcover.png'}
          alt={`${playlist.name} - Image ${index + 1}`}
          className="w-full h-full object-cover"
          style={{
            opacity,
            transition: 'opacity 0.1s ease-in-out',
          }}
        />
      ))}
    </div>
  ) : (
    <div className="flex-shrink-0 w-full md:w-1/3 h-full relative">
      <img
        src={playlist.songs[0]?.thumbnail || '/defaultcover.png'}
        alt={playlist.name}
        className="w-full h-full object-cover object-center"
        style={{
          opacity,
          transition: 'opacity 0.1s ease-in-out',
        }}
      />
    </div>
  )}
 
  <div className=" w-[100%] flex-1 bg-gradient-to-b from-zinc-900 to-none bg-black/0 md:to-black md:bg-black/50 flex flex-col justify-center p-8">
    <div className="flex items-center justify-between">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="bg-zinc-900 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
            placeholder="Playlist name"
            autoFocus
          />
          <button
            onClick={updatePlaylistName}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditedName(playlist.name);
            }}
            className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <h1 className="text-6xl font-black text-left">{playlist.name}</h1>
          {isOwner && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedName(playlist.name);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Edit playlist name"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={deletePlaylist}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Delete playlist"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    <div className="flex">
    <p className="text-white text-md mt-8 font-medium text-left md:text-center">
      {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
    </p>
    {playlist.songs.length > 0 && (
      <button
        onClick={playAll}
        className="mt-7 ml-4 flex items-center gap-2 bg-red-600 text-white px-2 py-2 rounded-full hover:bg-red-700 transition-colors"
      >
        <PlayIcon className="h-5 w-5" />
       
      </button>
    )}
    </div>
  </div>
</div>


      {/* Songs List */}
      <div className="p-4 bg-gradient-to-b from-black to-zinc-900 pt-52 md:pt-10">
      
        <div className="grid grid-cols-1 gap-4">
          {playlist.songs.map((song, index) => (
            <div
              key={song.videoId}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={song.thumbnail || '/defaultcover.png'}
                  alt={song.title}
                  className="w-full h-full object-cover rounded"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                  <button
                    onClick={() => playSong(song, index)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <PlayIcon className="h-8 w-8 text-white" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{song.title}</h3>
                <p className="text-gray-400 text-sm truncate">{song.artist || 'From Playlist'}</p>
              </div>
              {isOwner && (
                <button
                  onClick={() => removeSong(song.videoId)}
                  className="text-gray-400 hover:text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from playlist"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          
          {playlist.songs.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No songs in this playlist yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}