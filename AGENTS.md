# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3
Server Actions, Zod validation

## Key Paths
`app/` - Next.js pages and layouts
`components/` - React components (ChallengeModal, ChallengeList, NewsletterWidget, MarginNotes, ShareToolbar, DepthLayers)
`lib/` - Database, validation, business logic, custom hooks
`types/` - TypeScript definitions

## Core Features
- Article system with reading position tracking and progress metrics
- Challenge mechanism for critical discourse
- Newsletter signup with filtering by topic
- Contextual progress tracking (time investment, section-aware TOC, challenge badges)
- Margin notes with private text highlighting (localStorage)
- Social sharing with URL highlights
- Progressive Content Revelation - Unlock bonus content based on reading time
