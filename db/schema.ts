import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const pages = pgTable('pages', {
  id: text().primaryKey(), userId: text('user_id').notNull(), title: text().notNull(),
  content: text().notNull().default(''), version: integer().notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('pages_user_updated_idx').on(table.userId, table.updatedAt), uniqueIndex('pages_user_title_unique').on(table.userId, table.title)])
