import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.split(' ')[1];
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Missing session token' },
        { status: 401 }
      );
    }

    // Find session and include user data
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Check if session exists and is valid
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    // Check if session has expired
    if (new Date() > session.expires) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      });
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
