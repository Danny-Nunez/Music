import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});

const verifiedSender = process.env.MAILERSEND_API_KEY;
if (!verifiedSender) {
  throw new Error('MAILERSEND_VERIFIED_SENDER environment variable is required');
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  if (!user.email) {
    return NextResponse.json(
      { error: 'User email is invalid or missing' },
      { status: 400 }
    );
  }

  // Generate reset token
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExp = new Date(Date.now() + 3600000); // 1 hour from now

  // Update user with reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExp,
    },
  });

  // Send email with reset link
  const sentFrom = new Sender('no-reply@beatinbox.com', 'Beat Inbox Music');
  const recipients = [new Recipient(user.email, user.name || 'User')];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject('Password Reset Request')
    .setHtml(`
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
    `);

  try {
    await mailerSend.email.send(emailParams);
    return NextResponse.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Error sending password reset email' },
      { status: 500 }
    );
  }
}
