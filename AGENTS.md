# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3, Server Actions, Zod validation, Fuse.js

## Key Paths
`app/` - Next.js pages and API routes
`components/` - React components  
`lib/content/` - Content analysis and curation logic
`lib/search/` - Fuzzy search engine with Fuse.js integration
`lib/hooks/` - Custom hooks for milestones, scroll depth, etc.

## Core Features
Enhanced search with fuzzy matching, worldview content feeds (technical/philosophical/practical/contrarian), challenge system, notes/highlights, reading progress tracking, content discovery, curiosity trails with discovery interface

## Error Logging System
Winston-based logging system with file persistence and Docker volume mounts for capturing errors (404s, API errors) and request metrics. Logs stored in /app/logs with volume mount "persona-blog-logs" for persistence across deployments.

## Deployment
Docker containerized Next.js app running on port 7200 with automated deployment script (deploy.sh). Uses Docker volumes for database (persona-blog-db) and logs (persona-blog-logs) persistence.
