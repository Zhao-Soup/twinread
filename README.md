# Margin

Margin is a private, multi-page notebook for prose, snippets, and code. It saves edits automatically and protects every notebook with Netlify Identity. Press Update to fetch saved changes from other tabs and devices. Pages load once when the notebook opens; there is no background polling. The Update button is disabled while local edits are being saved, and edits made during an update request are preserved.

## Technology

- TanStack Start and React 19
- Netlify Identity for accounts and sessions
- Netlify Database with Drizzle ORM for persistent pages
- Tailwind CSS and custom CSS for the editorial interface

## Local development

Install dependencies with `pnpm install`, then run `netlify dev --port 8889`. Database access is provided by Netlify automatically. Identity authentication requires a deployed Netlify URL, so use a deploy preview or production deploy to test account flows.

Schema changes belong in `db/schema.ts`; generate a migration with `pnpm drizzle-kit generate --name <change_name>`.
