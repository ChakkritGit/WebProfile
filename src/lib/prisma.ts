import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/** True when a database is configured. Lets the site render from seed content otherwise. */
export const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * Connections per process. The database is the VPS's Postgres (max_connections=40, shared with
 * Spent-Cost), and `next build` prerenders in several workers at once, each with its own pool: at
 * pg's default of 10 the build hit TooManyConnections. Two while building, five at run time.
 */
const POOL_MAX = process.env.NEXT_PHASE === 'phase-production-build' ? 2 : 5

function createClient() {
  // Prisma 7 connects through a driver adapter rather than its own engine.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: POOL_MAX })
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
