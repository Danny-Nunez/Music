import { NextResponse } from 'next/server';
import { youtube } from 'scrape-youtube';

interface LiveRadioResult {
  id: string;
  title: string;
  thumbnail: string;
  link: string;
  watching: number;
  channel: {
    id: string;
    name: string;
    link: string;
    handle: string;
    verified: boolean;
    thumbnail: string;
  };
}

interface RadioLiveResults {
  [key: string]: LiveRadioResult | null;
}

const RADIO_SEARCH_TERMS = [
  "Fox News",
  "CNN News",
  "NBC News",
  "ABC News",
  "Telemundo Noticias"
];

export async function GET() {
  try {
    const liveResults: RadioLiveResults = {};

    // Loop through each radio term and fetch live streams
    for (const term of RADIO_SEARCH_TERMS) {
      try {
        const liveSearch = await youtube.search(term, { type: 'live' });

        // Get the first available live result
        const liveStream = liveSearch.streams[0];
        if (liveStream) {
          liveResults[term] = {
            id: liveStream.id,
            title: liveStream.title,
            thumbnail: liveStream.thumbnail,
            link: `https://youtu.be/${liveStream.id}`,
            watching: liveStream?.watching || 0,
            channel: {
              id: liveStream.channel.id,
              name: liveStream.channel.name,
              link: `https://www.youtube.com/${liveStream.channel.handle || ""}`,
              handle: liveStream.channel.handle || "",
              verified: liveStream.channel.verified,
              thumbnail: liveStream.channel.thumbnail
            }
          };
        } else {
          liveResults[term] = null; // No live stream found for this term
        }
      } catch (error) {
        console.error(`Error fetching live radio for ${term}:`, error);
        liveResults[term] = null; // Handle failures gracefully
      }
    }

    return NextResponse.json(liveResults);
  } catch (error) {
    console.error('Radio live search error:', error);
    return NextResponse.json({ error: 'Failed to fetch live radio streams' }, { status: 500 });
  }
}
