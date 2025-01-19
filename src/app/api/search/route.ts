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
  exactMatch?: boolean;
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
    
    // Parse and log the raw data
    const parsedData = data as GoogleSearchResponse;
    console.log('Search query:', query);
    console.log('Raw search results:', parsedData[1].map(item => ({
      text: item[0],
      metadata: item[3]
    })));

    // First check if the query matches an ID format (e.g. "11h0mdlyks")
    const isIdQuery = /^[0-9a-zA-Z_]+$/.test(query);
    console.log('Query analysis:', { query, isIdQuery });

    // Extract artist results and their full IDs
    const results: SearchResult[] = parsedData[1]
      .filter((item) => {
        const isArtist = item[3]?.type === 'ARTIST';
        if (isArtist) {
          console.log('Found artist:', {
            name: item[0],
            fullId: item[3].id,
            idPart: item[3].id.split('/').pop()
          });
        }
        return isArtist;
      })
      .map((item) => {
        // If searching by ID, put exact matches first
        const idPart = item[3].id.split('/').pop();
        const isExactMatch = isIdQuery && idPart === query;

        const result = {
          text: item[0],
          id: item[3].id, // Keep the full ID with prefix (e.g. "/g/11h0mdlyks")
          type: item[3].type,
          exactMatch: isExactMatch
        };

        console.log('Mapped result:', {
          name: result.text,
          fullId: result.id,
          isExactMatch
        });

        return result;
      })
      .sort((a, b) => {
        // Sort exact matches first
        if (a.exactMatch && !b.exactMatch) return -1;
        if (!a.exactMatch && b.exactMatch) return 1;
        return 0;
      });

    console.log('Final results:', {
      query,
      isIdQuery,
      results: results.map(r => ({
        name: r.text,
        fullId: r.id,
        exactMatch: r.exactMatch
      }))
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search artists' },
      { status: 500 }
    );
  }
}
