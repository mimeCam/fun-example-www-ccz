# Persona Blog

## Tech Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
SQLite with better-sqlite3, Server Actions, Zod validation

## Key Paths
`app/` - Next.js pages and API routes
`components/` - React components
`lib/` - Database layer, business logic, custom hooks
`lib/content/` - Content analysis and curation logic
`lib/utils/milestoneUtils.ts` - Reading milestone tracking utilities
`lib/hooks/useMilestones.ts` - Milestone tracking hook
`lib/hooks/useScrollDepth.ts` - Scroll depth tracking with Intersection Observer

## Reading Commitment System
Time transparency and milestone celebrations to drive engagement:
- InsightPreview: Shows "what you'll learn" takeaways
- EnhancedProgressBar: Reading progress with time remaining
- MilestoneCard: Shareable milestone celebrations (50%, 100%)
- CommitmentNudges: Strategic encouragement during reading
- ReadingCommitmentSystem: Unified wrapper component

## Question-Based Content Discovery
Alternative content exploration through provocative questions:
- QuestionBrowser: Discover articles by exploring thought-provoking questions
- QuestionUtils: Content analysis and question matching utilities
- Questions API: Search and serendipity modes for discovery
- Article extension: Each post now includes 2-3 provocative questions
