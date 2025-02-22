import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'Google ID token is required' },
        { status: 400 }
      );
    }

    // Verify Google ID token
    let payload;
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error('Google token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid Google ID token' },
        { status: 401 }
      );
    }
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google ID token' },
        { status: 401 }
      );
    }

    const { email, name, picture: image, sub: googleId } = payload;

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: email || '' },
      update: {
        name: name || null,
        image: image || null,
      },
      create: {
        email: email || '',
        name: name || null,
        image: image || null,
        accounts: {
          create: {
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
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
    console.error('Google sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
