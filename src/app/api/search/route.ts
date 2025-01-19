import { NextResponse } from 'next/server';

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

interface SearchResult {
  text: string;
  id: string;
  type: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Fetch from Google's search completion API
    const response = await fetch(
      `https://clients1.google.com/complete/search?client=yt-music-charts&hl=en&gs_rn=64&gs_ri=yt-music-charts&cp=1&gs_id=1a&q=${encodeURIComponent(query)}&callback=google.sbox.p50&gs_gbg=Y2wJx159XKxjzmSF851UKOcgnI3411`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.statusText}`);
    }

    // Get the response text and parse the JSONP
    const jsonpText = await response.text();
    
    // Extract the JSON part from JSONP response
    // Remove 'google.sbox.p50 && google.sbox.p50(' from start and ')' from end
    const jsonText = jsonpText.replace(/^[^(]+\(|\)$/g, '');
    
    // Parse the JSON
    const data = JSON.parse(jsonText);
    
    // Extract search results from the response
    // data[1] contains the array of results
    const parsedData = data as GoogleSearchResponse;
    const results: SearchResult[] = parsedData[1]
      .filter((item) => item[3]?.type === 'ARTIST') // Only keep artist results
      .map((item) => ({
        text: item[0], // The display text
        id: item[3].id, // The artist ID
        type: item[3].type // The result type (ARTIST)
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search artists' },
      { status: 500 }
    );
  }
}
