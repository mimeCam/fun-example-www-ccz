/**
 * ThreadKeepsake — pure SVG builder for the Golden Thread artifact.
 *
 * One renderer, two runtimes: this module must stay *pure* (no `window`,
 * no `document`, no React). It is imported by the client modal AND by the
 * /api/og/thread route running inside next/og. If they drift, the unfurl
 * stops matching what the reader just saw — and the invite engine lies.
 *
 * Design: reuses `lib/design/color-constants` (single source of truth)
 * and the same violet→gold accent interpolation used by GoldenThread.tsx.
 * No new colors, no new gradients, no new fonts. Mike's spec §3/§4.
 */
import { BRAND, THERMAL, THERMAL_WARM, ARCHETYPE } from '@/lib/design/color-constants';
import type { ArchetypeKey } from '@/types/content';

/** Thread accent endpoints — dormant violet → warm gold. Parallel to
 *  `ACCENT` in `lib/thermal/thermal-tokens.ts`, but sourced from the
 *  canvas-safe `color-constants` module so this file stays DOM-free. */
const ACCENT = { dormant: THERMAL.accent, warm: THERMAL_WARM.accent };

export const ARCHETYPE_KEYS: ArchetypeKey[] =
  ['deep-diver', 'explorer', 'faithful', 'resonator', 'collector'];

/** Frozen reader-specific state at ceremony time. URL-safe, short, stable. */
export interface ThreadSnapshot {
  slug: string;                  // article id
  title: string;                 // trimmed at capture
  depth: number;                 // 0..100 — how far the reader descended
  thermal: number;               // 0..1   — warmth at ceremony (drives gradient)
  archetype: ArchetypeKey | null;
  ts: number;                    // unix seconds — for cache-bust and date
}

/** Canvas size — OpenGraph 1200×630 (matches Twitter/FB/Mastodon unfurls). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Max title length in the keepsake — prevents SVG overflow on long posts. */
const TITLE_MAX = 60;

export function clampTitle(raw: string): string {
  const t = (raw ?? '').trim();
  if (t.length <= TITLE_MAX) return t;
  return t.slice(0, TITLE_MAX - 1).trimEnd() + '…';
}

/** Validate + coerce a raw snapshot (e.g. from a URL param). Returns null if unsalvageable. */
export function clampSnapshot(raw: Partial<ThreadSnapshot> | null | undefined): ThreadSnapshot | null {
  if (!raw || typeof raw.slug !== 'string' || !raw.slug) return null;
  return {
    slug: raw.slug.slice(0, 120),
    title: clampTitle(raw.title ?? ''),
    depth: clampNumber(raw.depth, 0, 100, 0),
    thermal: clampNumber(raw.thermal, 0, 1, 0),
    archetype: isValidArchetype(raw.archetype) ? raw.archetype : null,
    ts: clampNumber(raw.ts, 0, 1e11, Math.floor(Date.now() / 1000)),
  };
}

function clampNumber(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.max(min, Math.min(max, n));
}

export function isValidArchetype(v: unknown): v is ArchetypeKey {
  return typeof v === 'string' && (ARCHETYPE_KEYS as string[]).includes(v);
}

// ─── Color resolution ─────────────────────────────────────
// Keep the same violet→gold arc that GoldenThread uses via --token-accent.
// Gradient stop position tracks thermal warmth so cooler reads show less gold.

function accentFor(thermal: number): string {
  // 0 → violet (dormant), 1 → gold (warm). Matches thermal-tokens ACCENT.
  return thermal < 0.5 ? ACCENT.dormant : ACCENT.warm;
}

function archetypeHalo(key: ArchetypeKey | null): string {
  if (!key) return BRAND.mist;
  return ARCHETYPE[key] ?? BRAND.mist;
}

function archetypeLabel(key: ArchetypeKey | null): string {
  if (!key) return 'A Reader';
  const pretty: Record<ArchetypeKey, string> = {
    'deep-diver': 'A Deep Diver',
    explorer: 'An Explorer',
    faithful: 'The Faithful',
    resonator: 'A Resonator',
    collector: 'A Collector',
  };
  return pretty[key];
}

/** Local YYYY-MM-DD formatter (no Intl dependency, deterministic in node). */
export function formatDate(unix: number): string {
  const d = new Date(unix * 1000);
  const iso = d.toISOString();           // 2026-04-22T12:34:56.000Z
  return iso.slice(0, 10);               // 2026-04-22
}

// ─── SVG builder ──────────────────────────────────────────
// Kept small, composable, text-substitution based. Each helper returns a
// fragment that slot into the outer <svg>. No runtime DOM, no JSX.

function esc(raw: string): string {
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function backgroundLayer(): string {
  return `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BRAND.void}"/>`;
}

function threadDefs(accent: string): string {
  // Vertical gradient: mist at top → accent mid → accent bright at bottom.
  return `<defs>
    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND.mist}" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="${accent}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${BRAND.gold}" stop-opacity="1"/>
    </linearGradient>
    <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function threadFillHeight(depth: number): number {
  // Thread climbs from the bottom. 100% depth → full height minus padding.
  const padding = 64;
  return Math.round(((OG_HEIGHT - 2 * padding) * depth) / 100);
}

function threadShape(depth: number): string {
  const x = 96;           // left edge inset
  const w = 10;           // thread width — matches --sys-thread-width feel
  const bottom = OG_HEIGHT - 64;
  const height = threadFillHeight(depth);
  const top = bottom - height;
  return `<rect x="${x}" y="${top}" width="${w}" height="${height}" rx="${w / 2}"
    fill="url(#tg)" filter="url(#tglow)"/>`;
}

function threadTrack(): string {
  // Dormant companion line — so zero-depth snapshots still render.
  const x = 96, w = 10, top = 64, bottom = OG_HEIGHT - 64;
  return `<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" rx="${w / 2}"
    fill="${BRAND.fog}" fill-opacity="0.6"/>`;
}

function haloOrb(cx: number, cy: number, archetype: ArchetypeKey | null): string {
  // A soft circle that colors itself by archetype — the reader's fingerprint.
  const fill = archetypeHalo(archetype);
  return `<circle cx="${cx}" cy="${cy}" r="5" fill="${fill}" opacity="0.9"/>`;
}

function titleText(title: string): string {
  // Serif-ish system font — matches Space Grotesk feel without bundling fonts.
  const safe = esc(title || 'A thread formed here.');
  return `<text x="200" y="210" font-family="'Space Grotesk', 'Georgia', serif"
    font-size="56" font-weight="600" fill="${BRAND.gold}">${safe}</text>`;
}

function attributionLine(key: ArchetypeKey | null, ts: number): string {
  const who = esc(archetypeLabel(key));
  const when = esc(formatDate(ts));
  return `<text x="200" y="260" font-family="'Inter', system-ui, sans-serif"
    font-size="24" font-weight="400" fill="${BRAND.mist}" opacity="0.85">
    ${who} · ${when}</text>`;
}

function statsLine(snapshot: ThreadSnapshot): string {
  // Two stacked micro-stats: depth %, warmth %. Kept tiny so the thread leads.
  const d = Math.round(snapshot.depth);
  const w = Math.round(snapshot.thermal * 100);
  return `<text x="200" y="${OG_HEIGHT - 96}" font-family="'Inter', system-ui, sans-serif"
    font-size="18" fill="${BRAND.mist}" opacity="0.7">
    <tspan>depth ${d}%</tspan>
    <tspan dx="24">warmth ${w}%</tspan>
  </text>`;
}

function footer(): string {
  return `<text x="${OG_WIDTH - 48}" y="${OG_HEIGHT - 48}"
    font-family="'Inter', system-ui, sans-serif"
    font-size="16" fill="${BRAND.mist}" opacity="0.55" text-anchor="end">
    The blog that reads you back
  </text>`;
}

/**
 * Build a self-contained SVG string from a snapshot.
 * MUST be pure: no `document`, no `window`, no React. Server + client identical.
 */
export function buildThreadSVG(snapshot: ThreadSnapshot): string {
  const accent = accentFor(snapshot.thermal);
  const orbCy = OG_HEIGHT - 64 - threadFillHeight(snapshot.depth);
  // NOTE: we compose fragments top-down; layering is z-order from first to last.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}"` +
    ` width="${OG_WIDTH}" height="${OG_HEIGHT}" role="img" aria-label="${esc(snapshot.title)}">` +
    threadDefs(accent) +
    backgroundLayer() +
    threadTrack() +
    threadShape(snapshot.depth) +
    haloOrb(101, orbCy, snapshot.archetype) +
    titleText(snapshot.title) +
    attributionLine(snapshot.archetype, snapshot.ts) +
    statsLine(snapshot) +
    footer() +
    `</svg>`
  );
}

/** Dimensions exported for consumers (canvas sizing, OG meta tags). */
export const KEEPSAKE_DIMENSIONS = { width: OG_WIDTH, height: OG_HEIGHT } as const;
