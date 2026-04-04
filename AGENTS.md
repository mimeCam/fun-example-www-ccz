# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3, Server Actions, Zod validation

## Key Paths
`app/` - Next.js pages and API routes
`components/` - React components
`lib/` - Database layer, business logic, custom hooks
`lib/content/` - Content analysis and curation logic
`lib/sharing/` - Text sharing and clipboard utilities
`lib/utils/scrollUtils.ts` - Smooth scroll animations and position calculations
`lib/insights.ts` - Insight Capture & Share CRUD operations
`lib/resonances.ts` - Resonance-First Bookmarking System service layer

## Core Features
- Search & Discovery (Client-side article search with API backend, snippet generation)
- Journey Context System (Article depth, DNA tags, outcome promises)
- Resonance-First Bookmarking (DB schema, types, CRUD operations, API routes, server actions, UI components)
- Insight Capture & Share (Foundation: DB schema, types, CRUD operations)
- Silent Highlights (Anonymous text highlighting)
- Reading Memory (Personal reading history)
- Reading Progress & Position Tracking (DepthBar, useScrollDepth, useReadingPosition)
- Quick Position Navigation (JumpToPositionButton for instant position restoration)
- Thoughtful Conversations (Comments with upvoting)
- Progressive Content Revelation (Session-based unlocks)
