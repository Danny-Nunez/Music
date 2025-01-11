import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { token, password } = await request.json()
  
  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and password are required' },
      { status: 400 }
    )
  }

  // Find user with matching reset token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: {
        gt: new Date()
      }
    }
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 }
    )
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Update user with new password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExp: null
    }
  })

  return NextResponse.json({ message: 'Password reset successfully' })
}