import { createServerFn } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { pages } from '../../db/schema.js'

async function requireUser() { const user = await getUser(); if (!user) throw new Error('Please sign in to open your notebook.'); return user }
export const listPages = createServerFn({ method: 'GET' }).handler(async () => { const user = await requireUser(); return db.select().from(pages).where(eq(pages.userId, user.id)).orderBy(desc(pages.updatedAt)) })
export const createPage = createServerFn({ method: 'POST' }).inputValidator((data: { title: string }) => { const title = data.title.trim(); if (!title || title.length > 80) throw new Error('Use a page name between 1 and 80 characters.'); return { title } }).handler(async ({ data }) => {
  const user = await requireUser()
  try { const [page] = await db.insert(pages).values({ id: crypto.randomUUID(), userId: user.id, title: data.title }).returning(); return page }
  catch { throw new Error('A page with that name already exists.') }
})
export const savePage = createServerFn({ method: 'POST' }).inputValidator((data: { id: string; title: string; content: string; version: number }) => {
  const title = data.title.trim(); if (!data.id || !title || title.length > 80 || data.content.length > 250_000 || !Number.isInteger(data.version)) throw new Error('This page could not be saved. Check its title and size.'); return { ...data, title }
}).handler(async ({ data }) => {
  const user = await requireUser()
  const [saved] = await db.update(pages).set({ title: data.title, content: data.content, version: data.version + 1, updatedAt: new Date() }).where(and(eq(pages.id, data.id), eq(pages.userId, user.id), eq(pages.version, data.version))).returning()
  if (saved) return { status: 'saved' as const, page: saved }
  const [latest] = await db.select().from(pages).where(and(eq(pages.id, data.id), eq(pages.userId, user.id)))
  return { status: 'conflict' as const, page: latest ?? null }
})
export const deletePage = createServerFn({ method: 'POST' }).inputValidator((data: { id: string }) => data).handler(async ({ data }) => { const user = await requireUser(); await db.delete(pages).where(and(eq(pages.id, data.id), eq(pages.userId, user.id))); return { success: true } })
