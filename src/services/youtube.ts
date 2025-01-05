import { Video } from '@/types/video';

export async function searchVideos(query: string): Promise<Video[]> {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }
    return response.json();
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
}

export async function getTrendingVideos(): Promise<Video[]> {
  try {
    const response = await fetch('/api/videos');
    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return [];
  }
}