import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client in serverless
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize for serverless
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // @ts-ignore - Prisma doesn't expose these types but they work
  __internal: {
    engine: {
      connection_limit: 10,
      pool_timeout: 10,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper to disconnect after function execution
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
