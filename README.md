# Margin

Margin is a private, multi-page notebook for prose, snippets, and code. It keeps edits synchronized between open tabs and devices and protects every notebook with Netlify Identity.

## Technology

- TanStack Start and React 19
- Netlify Identity for accounts and sessions
- Netlify Database with Drizzle ORM for persistent pages
- Tailwind CSS and custom CSS for the editorial interface

## Local development

Install dependencies with `pnpm install`, then run `netlify dev --port 8889`. Database access is provided by Netlify automatically. Identity authentication requires a deployed Netlify URL, so use a deploy preview or production deploy to test account flows.

Schema changes belong in `db/schema.ts`; generate a migration with `pnpm drizzle-kit generate --name <change_name>`.
