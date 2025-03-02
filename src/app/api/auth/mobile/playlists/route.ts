import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
      const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
  
      // Get user from session token
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      });
  
      if (!session?.user) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
  
      // Get user's playlists with songs
      const playlists = await prisma.playlist.findMany({
        where: { userId: session.user.id },
        include: {
          songs: {
            include: {
              song: true
            }
          }
        }
      });
  
      return new Response(JSON.stringify(playlists), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }