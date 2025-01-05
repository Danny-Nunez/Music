'use client';

import { useState } from 'react';
import PlaylistModal from './PlaylistModal';

interface Track {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  artist: string;
}

interface ArtistPageAddToPlaylistButtonProps {
  track: Track;
  className?: string;
}

export default function ArtistPageAddToPlaylistButton({ track, className = '' }: ArtistPageAddToPlaylistButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`p-2 text-gray-400 hover:text-white transition-colors ${className}`}
        title="Add to playlist"
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
      {showModal && (
        <PlaylistModal
          onClose={() => setShowModal(false)}
          song={{
            id: track.videoId,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail
          }}
        />
      )}
    </>
  );
}