/**
 * Archetype-accents manifest — single typed home for the five archetype
 * voices the NextRead farewell chip paints.
 *
 * **Adopted policy (Tanya UX #22 §3.3, Mike napkin #96 §3).** Archetype
 * color is rendered exclusively by the NextRead farewell chip in this
 * sprint. No other surface adopts archetype hue. A second consumer
 * (Mirror result chip, Resonances header tint, ReturnLetter accent)
 * would graduate this manifest into a `Surface` row on
 * `lib/design/voice-ledger.ts` — rule-of-three. Until then, the typed
 * `Record<ArchetypeKey, …>` + adoption test is the right level of fence.
 *
 * Lifted from `components/reading/NextRead.tsx` per Mike napkin #96 and
 * Tanya UX #22 §4.1. The `Record<ArchetypeKey, string>` shape is the
 * compile-time guard: a sixth archetype added to `types/content.ts`
 * flips this file red on the same PR — the type system is the
 * centrality fence.
 *
 * Five exports:
 *   • ARCHETYPE_ACCENT_BORDER  — chip border Tailwind class per archetype
 *   • ARCHETYPE_ACCENT_TEXT    — chip text-color Tailwind class per archetype
 *   • ARCHETYPE_LABELS         — capitalized human-readable labels
 *   • ARCHETYPE_GLYPHS         — abstract leadin glyph (Tanya UX #22 §3.4)
 *   • ARCHETYPE_FALLBACK_*     — neutral fog/mist when archetype is absent
 *
 * Helpers:
 *   • archetypeAccentClass(k?)      — full `border-…/30 text-…` string
 *   • archetypeLabel(k?)            — capitalized label
 *   • archetypeAccentGlyph(k?)      — semiotic discriminator (principle #7)
 *   • archetypeAccentGlyphClass(k?) — base spacing + per-glyph optical lift
 *
 * **Posture diverges from worldview by one rung** (Tanya UX #22 §3.3 #1):
 * the worldview chip's *background* paints at hairline (0.10) — "what is
 * the room saying?". The archetype chip's *border* paints at muted (0.30)
 * — "who is the reader, that the room is saying it to?". A reader earns
 * the archetype voice across a session; the worldview hint merely
 * announces. The two surfaces play different attention roles, so they
 * sit on different rungs *by intent* — do not "harmonize."
 *
 * JIT-safety: every class string is emitted by `alphaClassOf` (a fixed-
 * table literal factory) or written verbatim — Tailwind's JIT cannot see
 * template interpolations like `border-${family}/${pct}`. See
 * `lib/design/alpha.ts:285`.
 *
 * Credits:
 *   • Mike K. — architect napkin #96 (the `Record<ArchetypeKey, …>` shape,
 *     the rule-of-three deferral on Surface promotion, the
 *     `alphaClassOf`-routing prereq that promoted `secondary` + `amber`).
 *   • Tanya D. — UX spec #22 §3.3 (the muted-rung divergence rationale),
 *     §3.4 (the glyph layer extending principle #7 to the farewell chip),
 *     §7 (the optical-baseline nudge for filled glyphs).
 *   • Elon M. — first-principles teardown that named "polymorphism is a
 *     killer" — the typed Record + helper closes the case at five voices.
 *   • Krystle C. / Jason F. — the mechanical scope this manifest delivers.
 */

import { alphaClassOf } from '@/lib/design/alpha';
import type { ArchetypeKey } from '@/types/content';

// ─── Chip borders — five voices at the muted rung (/30) ────────────────────

/**
 * Tailwind class for each archetype's chip BORDER — `border-<family>/30`.
 *
 * All five borders resolve to the `muted` (0.30) rung — one register, five
 * voices (atomic fail-path: Mike #95, Tanya UX #62 §2 — when the rung steps
 * for contrast in some future sprint, it steps in lockstep for all five).
 * Routes through `alphaClassOf` so the JIT-visible literal is owned by the
 * alpha ledger, not by handwritten strings.
 *
 * Family map (byte-identical to the prior inline `ARCHETYPE_ACCENT` map in
 * `components/reading/NextRead.tsx` — this is a STRUCTURAL refactor; the
 * rendered pixels are unchanged):
 *   deep-diver → cyan
 *   explorer   → accent
 *   faithful   → secondary
 *   resonator  → rose
 *   collector  → amber
 */
export const ARCHETYPE_ACCENT_BORDER: Record<ArchetypeKey, string> = {
  'deep-diver': alphaClassOf('cyan',      'muted', 'border'),
  'explorer':   alphaClassOf('accent',    'muted', 'border'),
  'faithful':   alphaClassOf('secondary', 'muted', 'border'),
  'resonator':  alphaClassOf('rose',      'muted', 'border'),
  'collector':  alphaClassOf('amber',     'muted', 'border'),
};

// ─── Chip text — default presence (1.0), voice carries the signal ──────────

/**
 * Tailwind class for each archetype's chip TEXT color. No alpha — the text
 * sits at default presence (1.00). *Geometry is the room (border at muted),
 * voice is the visitor (text at default).* Tanya UX #22 §7 last bullet.
 */
export const ARCHETYPE_ACCENT_TEXT: Record<ArchetypeKey, string> = {
  'deep-diver': 'text-cyan',
  'explorer':   'text-accent',
  'faithful':   'text-secondary',
  'resonator':  'text-rose',
  'collector':  'text-amber',
};

// ─── Chip labels — capitalized, human-readable (NextRead.tsx legacy) ───────

/**
 * Human-readable label for each archetype chip. Byte-identical to the
 * prior inline `ARCHETYPE_LABEL` map — including `'Faithful Reader'`
 * (the two-word form) which the legacy chip already shipped with. The
 * pixels are unchanged in this PR.
 */
export const ARCHETYPE_LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer':   'Explorer',
  'faithful':   'Faithful Reader',
  'resonator':  'Resonator',
  'collector':  'Collector',
};

// ─── Chip glyphs — semiotic discriminator (Tanya UX #22 §3.4) ──────────────

/**
 * Single-character abstract glyph leading the chip label. Lifted from the
 * worldview chip's `WORLDVIEW_GLYPHS` pattern (UX #10 §2.3) and extended
 * to the farewell beat — same pattern, same accessibility posture, no new
 * design vocabulary. The glyph is the non-color discriminator that
 * survives color-blindness, chip size, and screenshot-on-a-phone.
 *
 * Picks (matching the abstract-not-literal rule — archetype is a register,
 * not a topic):
 *   • `◉` deep-diver — *iris, the eye that goes deeper*
 *   • `→` explorer   — *the arrow, the one moving outward*
 *   • `✦` faithful   — *the small fixed star, returned to*
 *   • `≈` resonator  — *the wave, what answers back*
 *   • `❒` collector  — *the framed thing, set aside*
 *
 * Accessibility: the glyph is `aria-hidden` at the call site — a screen
 * reader hears `Deep Diver`, not "Deep Diver, iris."
 */
export const ARCHETYPE_GLYPHS: Record<ArchetypeKey, string> = {
  'deep-diver': '◉',
  'explorer':   '→',
  'faithful':   '✦',
  'resonator':  '≈',
  'collector':  '❒',
};

/** Fallback glyph — a centered dot, lowest visual weight, no register. */
const ARCHETYPE_FALLBACK_GLYPH = '·';

// ─── Fallback chrome — when archetype is absent (helper-safety only) ───────

/**
 * Border + text for the no-archetype case. Sits ONE rung lighter
 * (`hairline`) than the named voices so the absence-of-voice is felt as
 * space, not as a sixth voice pretending to be the seventh. Tanya UX #22
 * §3.3 #2.
 *
 * The call site (`NextRead.tsx`) gates the chip behind `if (label)` and
 * does not render the fallback in this sprint (Tanya UX §5 #5 — "the
 * fallback is silent"). The fallback exists in the helper anyway so a
 * forgetful future call site cannot ship a blank chip — Mike #51 §5 #4.
 */
export const ARCHETYPE_FALLBACK_BORDER: string =
  alphaClassOf('fog', 'hairline', 'border');

/** Fallback text color — neutral mist, no voice. */
export const ARCHETYPE_FALLBACK_TEXT = 'text-mist';

// ─── Helpers — fallback baked in so call sites cannot forget it ────────────

/**
 * Full chip class string for an archetype — `border-<family>/30 text-<voice>`.
 * Pure, ≤ 10 LOC.
 *
 * `archetypeAccentClass(undefined | null)` returns the fallback chrome —
 * the fallback lives INSIDE the helper so a forgetful call site cannot
 * ship a blank chip. Mike #51 §5 #4 — "one less footgun."
 */
export function archetypeAccentClass(k?: ArchetypeKey | null): string {
  if (k === undefined || k === null) {
    return `${ARCHETYPE_FALLBACK_BORDER} ${ARCHETYPE_FALLBACK_TEXT}`;
  }
  const border = ARCHETYPE_ACCENT_BORDER[k];
  const text = ARCHETYPE_ACCENT_TEXT[k];
  if (!border || !text) {
    return `${ARCHETYPE_FALLBACK_BORDER} ${ARCHETYPE_FALLBACK_TEXT}`;
  }
  return `${border} ${text}`;
}

/**
 * Chip text label for an archetype. Pure, ≤ 10 LOC.
 *
 * Falls back to an empty string when undefined — the call site already
 * gates on `if (label)` so a falsy return suppresses the chip entirely
 * (Tanya UX #22 §5 #5 — "the fallback is silent").
 */
export function archetypeLabel(k?: ArchetypeKey | null): string {
  if (k === undefined || k === null) return '';
  return ARCHETYPE_LABELS[k] ?? '';
}

/**
 * Chip glyph for an archetype — non-color discriminator (principle #7).
 * Falls back to a centered dot when undefined. Pure, ≤ 10 LOC.
 *
 * The glyph element MUST be marked `aria-hidden` at the call site
 * (Tanya UX #22 §3.4). Screen readers hear the label; sighted readers
 * register the shape.
 */
export function archetypeAccentGlyph(k?: ArchetypeKey | null): string {
  if (k === undefined || k === null) return ARCHETYPE_FALLBACK_GLYPH;
  return ARCHETYPE_GLYPHS[k] ?? ARCHETYPE_FALLBACK_GLYPH;
}

// ─── Glyph optical compensation (Tanya UX #22 §7) ──────────────────────────

/**
 * Per-glyph Tailwind nudge utilities. Filled / heavy-ink glyphs (`◉`, `❒`)
 * sit visibly LOWER than line glyphs (`→`, `≈`, `✦`) at `text-sys-micro`
 * because their ink density centres below the optical line. A 0.5px lift
 * brings them onto the same baseline rhythm as the others.
 *
 * `→`, `≈`, `✦` deliberately get no nudge — their ink sits on the
 * optical centre line at micro-text, no compensation needed.
 *
 * One Tailwind utility, no per-glyph component, no ceremony. The
 * `relative -top-[0.5px]` literal must appear verbatim in source for the
 * JIT scanner to emit it (no template interpolation).
 */
const ARCHETYPE_GLYPH_NUDGE: Partial<Record<ArchetypeKey, string>> = {
  'deep-diver': 'relative -top-[0.5px]',
  'collector':  'relative -top-[0.5px]',
};

/**
 * Glyph-span className for the chip leadin — base spacing + per-glyph
 * optical compensation. Pure, ≤ 10 LOC. The chip call site spreads
 * this onto the `<span aria-hidden>` that wraps the glyph character.
 */
export function archetypeAccentGlyphClass(k?: ArchetypeKey | null): string {
  const base = 'mr-sys-1';
  const nudge = k ? (ARCHETYPE_GLYPH_NUDGE[k] ?? '') : '';
  return nudge ? `${base} ${nudge}` : base;
}
