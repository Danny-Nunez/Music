import { google } from 'googleapis';
import { Video } from '@/types/video';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export async function searchVideosServer(query: string): Promise<Video[]> {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      maxResults: 50,
      type: ['video'],
      videoCategoryId: '10', // Music category
    });

    return (response.data.items || []).map(item => ({
      id: item.id?.videoId || '',
      title: item.snippet?.title?.split(' - ')[1] || item.snippet?.title || '',
      artist: item.snippet?.title?.split(' - ')[0] || 'Unknown Artist',
      thumbnail: item.snippet?.thumbnails?.high?.url || ''
    }));
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
}

export async function getTrendingVideosServer(): Promise<Video[]> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet'],
      chart: 'mostPopular',
      maxResults: 50,
      videoCategoryId: '10', // Music category
      regionCode: 'US'
    });

    return (response.data.items || []).map(item => ({
      id: item.id || '',
      title: item.snippet?.title?.split(' - ')[1] || item.snippet?.title || '',
      artist: item.snippet?.title?.split(' - ')[0] || 'Unknown Artist',
      thumbnail: item.snippet?.thumbnails?.high?.url || ''
    }));
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return [];
  }
}