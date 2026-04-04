# Persona Blog

## Philosophy
Anti-blog challenging ideas with minimal UI and maximal content. Features emerge when needed, respecting reader attention through calm technology principles.

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3, Server Actions, Zod validation

## Key Paths
`app/` - Next.js pages and API routes
`app/admin/editor-picks/` - Author-curated related posts management
`components/` - React components for challenges, notes, sharing, reading progress
`lib/` - Database layer, business logic, custom hooks
`lib/content/` - Content analysis (Jaccard similarity), editor picks merger
`lib/db/editor-picks.ts` - Author-curated recommendations CRUD

## Core Features
- **Timeless Score Engine**: Measures article longevity vs viral trends through engagement quality, sustained interest, and depth signals
- **Editor's Picks**: Author-curated related posts with context, prioritized over algorithmic recommendations
- **Content Discovery**: Jaccard similarity algorithm + manual curation
- **Reading Engagement**: Depth tracking, completion detection, notes system, comments
- **Reading Dashboard**: Personal stats, streaks, topic analysis, timeline
- **Challenge System**: Thoughtful article challenges with voting
