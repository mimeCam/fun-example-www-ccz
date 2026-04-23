/**
 * reply-lexicon — pure mapping from reader archetype → tone bucket → phrase.
 *
 * The 6th primitive's voice contract. Five `ArchetypeKey` values fold to
 * three tone buckets; each bucket has a phrase table keyed by `ReplyKind`.
 *
 *   ArchetypeKey (5) → ToneBucket (3) → string per ReplyKind
 *
 * Two invariants live as code (and as tests):
 *  1. Every `ReplyKind` has a phrase for every `ToneBucket` (no missing cells).
 *  2. Every `confirm`-shaped phrase contains a recognisable copy/save verb
 *     (Elon §3.2 guardrail — Tanya §7.1 "semantic lock"). Tone may tint;
 *     it must NOT erase the verb.
 *
 * No React, no DOM, no state. The hook (`useToast`) reads `archetype` from
 * `useThermal()` and resolves the phrase here. The pure-TS callers
 * (`clipboard-utils`, `quote-cards/export-utils`) skip the hook and pass a
 * tone explicitly (defaults to `kinetic`, the neutral confirm).
 *
 * Credits: Mike K. (napkin §4 — five-rung archetype → three-bucket tone),
 * Tanya D. (UX §7 — phrase table + the under-tinting discipline), Elon M.
 * (the confirm-verb guardrail; "tone may tint, semantic must not"),
 * Paul K. (semantic-lock as a measurable acceptance, not vibes).
 */

import type { ArchetypeKey } from '@/types/content';

// ─── Tone bucket — the lexicon's only intermediate vocabulary ──────────────

/** Three tone buckets — fewer rungs than archetypes by design (Tanya §7.2). */
export type ToneBucket = 'reflective' | 'kinetic' | 'analytical';

/** Surfaces this lexicon speaks for. One phrase per surface per tone. */
export type ReplyKind =
  | 'copy-text'
  | 'copy-link'
  | 'copy-image'
  | 'download'
  | 'copy-failed'
  | 'download-failed'
  // ─── Empty-surface kinds (threshold rooms — invitational, not confirm) ──
  | 'empty-mirror'
  | 'empty-resonances'
  | 'threshold-404'
  | 'threshold-error';

/**
 * Subset of `ReplyKind` that speak for the four empty / threshold rooms.
 * Consumed by `emptyPhrase()` and the `empty-adoption` guard. These are
 * invitational by design — NOT part of `CONFIRM_KINDS`.
 */
export type EmptySurfaceKind =
  | 'empty-mirror'
  | 'empty-resonances'
  | 'threshold-404'
  | 'threshold-error';

// ─── Archetype → tone (single source of truth) ─────────────────────────────

const ARCHETYPE_TO_TONE: Readonly<Record<ArchetypeKey, ToneBucket>> = {
  'deep-diver': 'reflective',
  'faithful':   'reflective',
  'explorer':   'kinetic',
  'collector':  'kinetic',
  'resonator':  'analytical',
};

/** Default when archetype is unknown — neutral, non-tinted. */
export const DEFAULT_TONE: ToneBucket = 'kinetic';

/** Pure: archetype → tone. `null` (unknown) folds to `DEFAULT_TONE`. */
export function archetypeToTone(key: ArchetypeKey | null | undefined): ToneBucket {
  if (!key) return DEFAULT_TONE;
  return ARCHETYPE_TO_TONE[key];
}

// ─── Phrase table (pure data, no procedural generation) ────────────────────

/**
 * Every cell is curated. The under-tinting (Tanya §7.2) is on purpose:
 * Reflective gets the only real shift; Kinetic and Analytical converge on
 * the neutral default because the verb is already kinetic/analytical.
 */
const PHRASES: Readonly<Record<ReplyKind, Readonly<Record<ToneBucket, string>>>> = {
  'copy-text': {
    reflective: 'Copied, quietly.',
    kinetic:    'Copied.',
    analytical: 'Copied.',
  },
  'copy-link': {
    reflective: 'Link copied, quietly.',
    kinetic:    'Link copied.',
    analytical: 'Link copied.',
  },
  'copy-image': {
    reflective: 'Card copied.',
    kinetic:    'Card copied.',
    analytical: 'Image copied.',
  },
  'download': {
    reflective: 'Saved.',
    kinetic:    'Downloaded.',
    analytical: 'Downloaded (PNG).',
  },
  'copy-failed': {
    reflective: "Didn't land — try again.",
    kinetic:    'Copy failed.',
    analytical: 'Copy failed.',
  },
  'download-failed': {
    reflective: "Didn't land — try again.",
    kinetic:    'Download failed.',
    analytical: 'Download failed.',
  },

  // ─── Empty-surface cells (invitational — no confirm verb required) ──────
  // Under-tinting holds: reflective is the only column that shifts; kinetic
  // and analytical converge on the curious neutral (Tanya §7.2). Kinetic
  // IS the first-visit voice (null archetype → DEFAULT_TONE = 'kinetic').
  'empty-mirror': {
    reflective: "Your reflection hasn't formed yet.",
    kinetic:    "Your reflection hasn't formed yet.",
    analytical: 'No Mirror yet — read an article and one forms.',
  },
  'empty-resonances': {
    reflective: "Your chapter hasn't been written yet.",
    kinetic:    "Your chapter hasn't been written yet.",
    analytical: 'No resonances saved yet.',
  },
  'threshold-404': {
    reflective: "This page hasn't formed yet.",
    kinetic:    "This page hasn't formed yet.",
    analytical: 'Page not found.',
  },
  'threshold-error': {
    reflective: 'Something came undone.',
    kinetic:    'Something came undone.',
    analytical: 'An error occurred.',
  },
};

/** Pure: resolve the curated phrase. Pass `archetypeToTone(key)` for tone. */
export function phraseFor(kind: ReplyKind, tone: ToneBucket): string {
  return PHRASES[kind][tone];
}

// ─── Whisper table — second-line prose for the four empty / threshold rooms ─

/**
 * Empty surfaces speak in two lines: a headline (`phraseFor`) and a whisper
 * (`whisperFor`). The whisper is curated per (kind, tone) just like the
 * headline, keeps the under-tinting discipline, and is load-bearing for the
 * `empty-adoption` tone guard — raw `<p>` literals in the four surface files
 * fail CI unless routed here (or reviewed into `EMPTY_OVERRIDES`).
 *
 * Confirm kinds are one-line (the toast is the whole voice). Only
 * `EmptySurfaceKind` cells need whispers.
 */
const WHISPERS: Readonly<Record<EmptySurfaceKind, Readonly<Record<ToneBucket, string>>>> = {
  'empty-mirror': {
    reflective: 'Read an article to the end and the Mirror will find you.',
    kinetic:    'Read an article to the end and the Mirror will find you.',
    analytical: 'Depth signals accrue from one full read. Start there.',
  },
  'empty-resonances': {
    reflective: 'Read something that stops you. Capture it. Tell it why it matters.',
    kinetic:    'Read something that stops you. Capture it. Tell it why it matters.',
    analytical: 'Resonances begin with a highlight. Start with any article.',
  },
  'threshold-404': {
    reflective: "The Threshold doesn't have a page here. But the right page is waiting for you.",
    kinetic:    "The Threshold doesn't have a page here. But the right page is waiting for you.",
    analytical: 'The requested URL does not resolve. Return to the Threshold.',
  },
  'threshold-error': {
    reflective: 'The room is still here. Try going back.',
    kinetic:    'The room is still here. Try going back.',
    analytical: 'A render error was caught. Retry or return.',
  },
};

/** Pure: the whisper (second-line prose) for an empty / threshold room. */
export function whisperFor(kind: EmptySurfaceKind, tone: ToneBucket): string {
  return WHISPERS[kind][tone];
}

// ─── Invariants — locked by tests, exported for guardrails ─────────────────

/** All ReplyKinds enumerated (test-friendly; do not hand-edit). */
export const REPLY_KINDS: readonly ReplyKind[] = [
  'copy-text', 'copy-link', 'copy-image',
  'download', 'copy-failed', 'download-failed',
  'empty-mirror', 'empty-resonances',
  'threshold-404', 'threshold-error',
];

/** The four empty / threshold surfaces. Consumed by `emptyPhrase(kind)`. */
export const EMPTY_SURFACE_KINDS: readonly EmptySurfaceKind[] = [
  'empty-mirror', 'empty-resonances', 'threshold-404', 'threshold-error',
];

/** All ToneBuckets enumerated (test-friendly; do not hand-edit). */
export const TONE_BUCKETS: readonly ToneBucket[] = [
  'reflective', 'kinetic', 'analytical',
];

/** All ArchetypeKeys this lexicon recognises (test-friendly). */
export const ARCHETYPE_KEYS: readonly ArchetypeKey[] = [
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
];

/** Confirm-kinds (success surfaces) — the verb-guardrail applies here. */
export const CONFIRM_KINDS: readonly ReplyKind[] = [
  'copy-text', 'copy-link', 'copy-image', 'download',
];

/** Words a confirm phrase MUST contain (case-insensitive). One match suffices. */
export const CONFIRM_VERBS: readonly string[] = [
  'copied', 'saved', 'downloaded',
];

/** Semantic guard: every confirm cell carries one of CONFIRM_VERBS. Pure. */
export function confirmVerbInvariantHolds(): boolean {
  return CONFIRM_KINDS.every((k) => TONE_BUCKETS.every((t) =>
    CONFIRM_VERBS.some((v) => phraseFor(k, t).toLowerCase().includes(v)),
  ));
}
