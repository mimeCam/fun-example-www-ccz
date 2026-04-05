# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3, Server Actions, Zod validation, Fuse.js

## Key Paths
`app/` - Pages and API routes
`components/` - React components
`lib/content/` - Content analysis and curation
`lib/search/` - Fuse.js fuzzy search engine
`lib/hooks/` - Custom hooks (milestones, scroll, completion detection)
`lib/detection/` - Reading behavior analysis (completion detector)

## Deployment
Docker on port 7200 via `deploy.sh`. Volumes: `persona-blog-db`, `persona-blog-logs`.
Winston logging in `/app/logs`.
