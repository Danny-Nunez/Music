'use client';

import { useState } from 'react';
import PlaylistModal from './PlaylistModal';

interface Track {
  videoId: string;
  title: string;
  thumbnail: string;
  artist: string;
}

interface AddToPlaylistButtonProps {
  track: Track;
  className?: string;
}

export default function AddToPlaylistButton({ track, className = '' }: AddToPlaylistButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-gray-400 hover:text-white transition-colors ${className}`}
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