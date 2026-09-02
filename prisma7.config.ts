import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // CLI-only (migrate/db push/studio). Prefer Supabase's DIRECT connection
    // (port 5432) here — migrations cannot run over the pgbouncer pool.
    // The app itself connects via DATABASE_URL in src/lib/prisma.ts.
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
})
