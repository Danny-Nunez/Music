import { NextResponse } from 'next/server';
import { youtube } from 'scrape-youtube';

interface SearchResultMetadata {
  id: string;
  is_launched: boolean;
  type: string;
}

interface GoogleSearchResult {
  0: string;        // display text
  1: never[];      // empty array
  2: never[];      // empty array
  3: SearchResultMetadata;
}

interface GoogleSearchResponse {
  0: string;        // search query
  1: GoogleSearchResult[];
  2: {
    a: string;
    j: string;
    q: string;
  };
}

interface ArtistResult {
  text: string;
  id: string;
  type: 'artist';
  exactMatch?: boolean;
}

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  views: number;
  channel: {
    name: string;
    thumbnail: string;
  };
  type: 'video';
}

interface LiveResult {
  id: string;
  title: string;
  thumbnail: string;
  viewers: number;
  channel: {
    name: string;
    thumbnail: string;
  };
  type: 'live';
}

interface SearchResults {
  artists: ArtistResult[];
  videos: VideoResult[];
  live: LiveResult[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Fetch artists from Google's search completion API
    const artistResponse = await fetch(
      `https://clients1.google.com/complete/search?client=yt-music-charts&hl=en&gs_rn=64&gs_ri=yt-music-charts&cp=1&gs_id=1a&q=${encodeURIComponent(query)}&callback=google.sbox.p50&gs_gbg=Y2wJx159XKxjzmSF851UKOcgnI3411`
    );

    if (!artistResponse.ok) {
      throw new Error(`Failed to fetch artist results: ${artistResponse.statusText}`);
    }

    // Get the response text and parse the JSONP
    const jsonpText = await artistResponse.text();
    const jsonText = jsonpText.replace(/^[^(]+\(|\)$/g, '');
    const data = JSON.parse(jsonText) as GoogleSearchResponse;

    // Check if the query matches an ID format
    const isIdQuery = /^[0-9a-zA-Z_]+$/.test(query);
    console.log('Query analysis:', { query, isIdQuery });

    // Extract artist results
    const artistResults: ArtistResult[] = data[1]
      .filter((item) => item[3]?.type === 'ARTIST')
      .map((item) => {
        const idPart = item[3].id.split('/').pop();
        const isExactMatch = isIdQuery && idPart === query;

        return {
          text: item[0],
          id: item[3].id,
          type: 'artist' as const,
          exactMatch: isExactMatch
        };
      })
      .sort((a, b) => {
        if (a.exactMatch && !b.exactMatch) return -1;
        if (!a.exactMatch && b.exactMatch) return 1;
        return 0;
      });

    // Fetch video results using scrape-youtube
    const videoResults = await youtube.search(query);
    const liveResultsRaw = await youtube.search(query, { type: 'live' });
    const formattedVideoResults: VideoResult[] = videoResults.videos.map(video => ({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      durationString: video.durationString,
      views: video.views,
      channel: {
        name: video.channel.name,
        thumbnail: video.channel.thumbnail
      },
      type: 'video' as const
    }));

    const liveResults = liveResultsRaw.streams.map(live => ({
      id: live.id,
      title: live.title,
      thumbnail: live.thumbnail,
      link: `https://youtu.be/${live.id}`,
      watching: live.viewers,
      channel: {
        name: live.channel.name,
        thumbnail: live.channel.thumbnail,
        id: live.channel.id,
        handle: live.channel.handle,
        verified: live.channel.verified,
        link: `https://www.youtube.com/${live.channel.handle}`
      },
      type: 'live' as const
    }))

    // Combine results
    const results: SearchResults = {
      artists: artistResults,
      videos: formattedVideoResults,
      live: liveResults
    };

    console.log('Search results:', {
      query,
      artistCount: results.artists.length,
      videoCount: results.videos.length,
      liveCount: results.live.length
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
