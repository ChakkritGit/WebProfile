import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { seedPosts, seedProjects } from '../src/content/seed'
import type { Prisma } from '../src/generated/prisma/client'

/**
 * Loads the bundled sample content into Supabase.
 *
 * Idempotent: every row is upserted on its (slug, locale) key, so running this
 * twice updates rather than duplicates.
 */

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error(
    '\n  DATABASE_URL is not set.\n\n' +
      '  Copy .env.example to .env and fill in your Supabase connection strings,\n' +
      '  then run `npm run db:push` before seeding.\n',
  )
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  let projects = 0
  for (const project of seedProjects) {
    const data = {
      title: project.title,
      locale: project.locale,
      translationKey: project.translationKey,
      summary: project.summary,
      coverImage: project.coverImage,
      content: project.content as unknown as Prisma.InputJsonValue,
      tags: project.tags,
      status: project.status,
      featured: project.featured,
      role: project.role,
      stack: project.stack,
      year: project.year,
      liveUrl: project.liveUrl,
      repoUrl: project.repoUrl,
      sortOrder: project.sortOrder,
      publishedAt: project.publishedAt ? new Date(project.publishedAt) : null,
    }
    await prisma.project.upsert({
      where: { slug_locale: { slug: project.slug, locale: project.locale } },
      create: { ...data, slug: project.slug },
      update: data,
    })
    projects++
  }

  let posts = 0
  for (const post of seedPosts) {
    const data = {
      title: post.title,
      locale: post.locale,
      translationKey: post.translationKey,
      summary: post.summary,
      coverImage: post.coverImage,
      content: post.content as unknown as Prisma.InputJsonValue,
      tags: post.tags,
      status: post.status,
      featured: post.featured,
      readingMinutes: post.readingMinutes,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    }
    await prisma.post.upsert({
      where: { slug_locale: { slug: post.slug, locale: post.locale } },
      create: { ...data, slug: post.slug },
      update: data,
    })
    posts++
  }

  console.log(`\n  Seeded ${projects} project rows and ${posts} post rows.\n`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('\n  Seeding failed:\n', error, '\n')
    await prisma.$disconnect()
    process.exit(1)
  })
