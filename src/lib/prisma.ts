import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/** True when a database is configured. Lets the site render from seed content otherwise. */
export const hasDatabase = Boolean(process.env.DATABASE_URL)

function createClient() {
  // Prisma 7 connects through a driver adapter rather than its own engine.
  // Supabase's pooled connection (port 6543) is the right target at runtime.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

/**
 * Prisma singleton. `null` when DATABASE_URL is unset so `next build` and local
 * previews work before Supabase is provisioned.
 */
export const prisma: PrismaClient | null = hasDatabase
  ? (globalForPrisma.prisma ?? createClient())
  : null

if (process.env.NODE_ENV !== 'production' && prisma) globalForPrisma.prisma = prisma
