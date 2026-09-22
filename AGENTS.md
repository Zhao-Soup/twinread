# Margin architecture

Margin is a TanStack Start application deployed on Netlify. The single index route renders either the authentication screen or the notebook based on Netlify Identity state.

## Key directories

- `src/routes/` contains the root document and notebook route.
- `src/lib/identity-context.tsx` owns browser authentication state and callback handling.
- `src/server/` contains authenticated server functions. Never import the database directly into client components.
- `db/` contains the Drizzle client and schema.
- `netlify/database/migrations/` contains deploy-time database migrations.

## Conventions

Use strict TypeScript, function components, and server functions for persistence. Every database query must be scoped to the authenticated Identity user. Mutations use optimistic version checks to prevent stale tabs from overwriting newer content. The client polls only while clean; it never replaces unsaved local edits.

The visual system is defined in `src/styles.css`: Newsreader for editorial copy, Plus Jakarta Sans for interface text, DM Mono for metadata, warm paper colors, and a responsive off-canvas page rail.

After Identity changes, rerun the Netlify Identity enable script. After schema changes, always generate a named Drizzle migration.
