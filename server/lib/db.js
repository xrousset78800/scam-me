let prisma = null;

try {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis;
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} catch {
  console.warn('[db] Prisma non disponible — les routes DB retourneront des données vides');
}

module.exports = { prisma };
