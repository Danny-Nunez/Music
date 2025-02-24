import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';  // Using the @ alias, or use relative path '../../../../../lib/prisma'
import crypto from 'crypto';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  undefined  // No redirect URI needed for mobile flow
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken: code } = body;  // Frontend sends authorization code as idToken

    if (!code) {
      return NextResponse.json(
        { error: 'Google authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    let tokens;
    try {
      const { tokens: authTokens } = await oauth2Client.getToken(code);
      tokens = authTokens;
    } catch (error) {
      console.error('Google token exchange error:', error);
      return NextResponse.json(
        { error: 'Invalid authorization code' },
        { status: 401 }
      );
    }

    // Get user info using access token
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2('v2');
    const { data: userInfo } = await oauth2.userinfo.get({ auth: oauth2Client });

    if (!userInfo.email) {
      return NextResponse.json(
        { error: 'Could not get user email from Google' },
        { status: 400 }
      );
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {
        name: userInfo.name || null,
        image: userInfo.picture || null,
      },
      create: {
        email: userInfo.email,
        name: userInfo.name || null,
        image: userInfo.picture || null,
        accounts: {
          create: {
            type: 'oauth',
            provider: 'google',
            providerAccountId: userInfo.id,
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