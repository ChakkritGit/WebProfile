import 'server-only'

import { listPosts, listProjects } from '@/lib/content'
import { prisma } from '@/lib/prisma'
import { createPublicApi } from '@/lib/public-api'

const database = prisma

export const publicApi = createPublicApi({
  listPosts,
  listProjects,
  checkDatabase: database ? () => database.$queryRaw`SELECT 1` : null,
})
