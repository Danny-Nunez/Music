import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.GOOGLE_EXPO_CLIENT_SECRET,
  undefined  // No redirect URI needed for mobile flow
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, redirectUri, idToken } = body;   // Accept either idToken or authorization code

    console.log('Received auth request:', {
      hasCode: !!code,
      hasIdToken: !!idToken,
      redirectUri,
      clientId: process.env.GOOGLE_IOS_CLIENT_ID
    });

    let userInfo;

    if (code) {
      // Authorization code flow
      try {
        console.log('Attempting token exchange with:', {
          code,
          redirect_uri: redirectUri,
          client_id: process.env.GOOGLE_IOS_CLIENT_ID
        });

        const { tokens } = await oauth2Client.getToken({
          code,
          redirect_uri: redirectUri
        });

        console.log('Token exchange successful, got tokens:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiryDate: tokens.expiry_date
        });

        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2('v2');
        const { data } = await oauth2.userinfo.get({ auth: oauth2Client });
        userInfo = data;

        console.log('Successfully got user info:', {
          hasEmail: !!userInfo.email,
          hasName: !!userInfo.name,
          hasPicture: !!userInfo.picture
        });

      } catch (error) {
        console.error('Google token exchange error:', error);
        return NextResponse.json(
          { error: 'Invalid authorization code' },
          { status: 401 }
        );
      }
    } else if (idToken) {
      // ID Token flow
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_IOS_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
          return NextResponse.json(
            { error: 'Invalid ID token' },
            { status: 401 }
          );
        }
        userInfo = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        };
      } catch (error) {
        console.error('Google ID token verification error:', error);
        return NextResponse.json(
          { error: 'Invalid ID token' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either authorization code or ID token is required' },
        { status: 400 }
      );
    }

    if (!userInfo?.email) {
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
            providerAccountId: userInfo.id || '',  // Ensure string type
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
