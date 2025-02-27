import { PrismaClient } from '@prisma/client';

declare global {
  // Using var here is necessary for global augmentation in TypeScript
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}