import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    console.log('Received payload:', { token, password });

    if (!token || !password) {
      console.error('Missing token or password:', { token, password });
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gt: new Date(), // Ensure token has not expired
        },
      },
    });

    if (!user) {
      console.error('Invalid or expired token:', { token });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    console.log('Password reset successfully for user:', user.id);
    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);

    // Ensure valid JSON is always returned for unexpected errors
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
