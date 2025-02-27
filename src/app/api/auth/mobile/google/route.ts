import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { google } from 'googleapis';

// Create a function to get the appropriate OAuth client based on the client ID
const getOAuth2Client = (clientId?: string) => {
  // Check if this is the iOS client ID (which doesn't use a client secret)
  const isIosClientId = clientId?.includes('g0g2t71ei8aroin55ahhtcq491tk2ts8');
  
  // Use the provided client ID or fall back to the Expo client ID
  const useClientId = clientId || process.env.GOOGLE_EXPO_CLIENT_ID;
  
  // For iOS client ID, don't use a client secret
  const clientSecret = isIosClientId ? '' : process.env.GOOGLE_EXPO_CLIENT_SECRET;
  
  return new google.auth.OAuth2(
    useClientId,
    clientSecret,
    undefined  // No redirect URI needed for mobile flow
  );
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, redirectUri, idToken, codeVerifier, clientId } = body;   // Accept client ID from request

    // Check if this is the iOS client ID
    const isIosClientId = clientId?.includes('g0g2t71ei8aroin55ahhtcq491tk2ts8');

    console.log('Received auth request:', {
      hasCode: !!code,
      hasIdToken: !!idToken,
      redirectUri,
      clientId: clientId || process.env.GOOGLE_EXPO_CLIENT_ID,
      isIosClientId,
      hasCodeVerifier: !!codeVerifier 
    });

    // Get the appropriate OAuth client based on the request
    const oauth2Client = getOAuth2Client(clientId);

    let userInfo;

    if (code) {
      // Authorization code flow
      try {
        console.log('Attempting token exchange with:', {
          code,
          redirect_uri: redirectUri,
          client_id: clientId || process.env.GOOGLE_EXPO_CLIENT_ID,
          isIosClientId,
          codeVerifier  // Use camelCase
        });
    
        // Get token response
        const tokenResponse = await oauth2Client.getToken({
          code,
          redirect_uri: redirectUri,
          codeVerifier  // Use camelCase here too
        });
    
        // Check if we have tokens
        if (!tokenResponse.tokens) {
          throw new Error('No tokens received from Google');
        }
    
        console.log('Token exchange successful, got tokens:', {
          hasAccessToken: !!tokenResponse.tokens.access_token,
          hasRefreshToken: !!tokenResponse.tokens.refresh_token,
          expiryDate: tokenResponse.tokens.expiry_date
        });
    
        oauth2Client.setCredentials(tokenResponse.tokens);
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
          audience: clientId || process.env.GOOGLE_EXPO_CLIENT_ID,
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
