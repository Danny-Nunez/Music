'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePlayerStore } from '../../store/playerStore';
import PlaylistModal from '../../components/PlaylistModal';

interface Video {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { setCurrentTrack, setQueue } = usePlayerStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handlePlay = (video: Video, index: number) => {
    // Format all videos for the queue
    const formattedVideos = searchResults.map(v => ({
      id: v.id,
      videoId: v.id,
      title: v.title,
      artist: v.artist,
      thumbnail: v.thumbnail
    }));

    // Set the clicked video as current
    setCurrentTrack(formattedVideos[index]);

    // Reorder queue to start from the clicked video
    const reorderedQueue = [
      ...formattedVideos.slice(index),
      ...formattedVideos.slice(0, index)
    ];
    setQueue(reorderedQueue);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-black text-white pt-20">
      <div className="p-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for songs..."
              className="flex-1 bg-[#3E3E3E] text-white px-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button
              type="submit"
              className="bg-white text-black px-8 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.map((video, index) => (
            <div
              key={video.id}
              className="bg-[#282828] p-4 rounded-lg hover:bg-[#3E3E3E] transition-colors group"
            >
              <div className="relative aspect-square mb-4">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover rounded-md"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <button
                  onClick={() => handlePlay(video, index)}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-white mb-1 truncate">{video.title}</h3>
              <p className="text-gray-400 text-sm truncate">{video.artist}</p>
              <button
                onClick={() => setSelectedVideo(video)}
                className="mt-3 text-gray-400 hover:text-white transition-colors"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {selectedVideo && (
          <PlaylistModal
            onClose={() => setSelectedVideo(null)}
            song={{
              id: selectedVideo.id,
              title: selectedVideo.title,
              artist: selectedVideo.artist,
              thumbnail: selectedVideo.thumbnail
            }}
          />
        )}
      </div>
    </div>
  );
}