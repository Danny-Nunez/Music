import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID // Your iOS client ID
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, image, accessToken, googleId } = body;

    if (!email || !accessToken) {
      return NextResponse.json(
        { error: 'Email and access token are required' },
        { status: 400 }
      );
    }

    // Verify Google token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: accessToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (payload?.email !== email) {
        return NextResponse.json(
          { error: 'Invalid Google token' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || null,
        image: image || null,
        accounts: {
          upsert: {
            where: {
              provider_providerAccountId: {
                provider: 'google',
                providerAccountId: googleId
              }
            },
            update: {},
            create: {
              type: 'oauth',
              provider: 'google',
              providerAccountId: googleId
            }
          }
        }
      },
      create: {
        email,
        name: name || null,
        image: image || null,
        accounts: {
          create: {
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleId
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        playlists: {
          include: {
            songs: {
              include: {
                song: true
              }
            }
          }
        }
      }
    });

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Create session
    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: thirtyDaysFromNow,
      },
    });

    // Return user data and session token
    return NextResponse.json({
      user,
      sessionToken: session.sessionToken,
    });
  } catch (error) {
    console.error('Google login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}