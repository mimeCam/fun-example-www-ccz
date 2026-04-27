/**
 * first-paint-archetype — pure heuristic for "Provisional Tone on Visit One."
 *
 * The killer feature ("the blog that reads you back") is structurally invisible
 * to first-time visitors today: every consumer (`voice-ledger`, `clipboard-
 * envelope`, `RecognitionWhisper`) reads the Mirror snapshot from
 * `archetype-store`, and the Mirror snapshot only exists for readers who have
 * completed `/mirror`. The median visitor never sees the swap.
 *
 * This module fixes that without inventing a new surface, a new vocabulary,
 * or a new dependency. It proposes a low-confidence archetype from cheap,
 * server-side request signals (referrer host, entry path/tags, time of day,
 * user-agent class). The middleware layer writes the result to a short-lived
 * cookie; the existing layered-read in `archetype-store.ts` falls back to it
 * when the Mirror result is absent. Same single source of truth, just answers
 * `null` less often.
 *
 * Discipline (Mike napkin §2 + §4, AGENTS.md "stateless first, grow later"):
 *   - **PURE.** No React, no DOM, no DB, no `window`/`document`, no async.
 *     A function `(FirstPaintSignals) => ProvisionalTone | null`. SSR-safe by
 *     virtue of being a pure function.
 *   - **NO NEW DEPS.** `Math.imul`-style hashing precedent already lives in
 *     `lib/engagement/archetype-bucket.ts`; no `crypto`, no fetch.
 *   - **REUSES EXISTING TAXONOMY.** Output is `ArchetypeKey` from
 *     `types/content` — five keys, no expansion. (Elon §2 — abstraction count
 *     stays bounded by user-visible behaviors.)
 *   - **SILENCE IS A FEATURE.** The `null` return path is the most important
 *     branch — when signals are weak, when the visitor is a returner, when
 *     confidence floors out, the page reads in neutral. Paul §S4: "felt, not
 *     flagged."
 *   - **CONFIDENCE FLOOR.** A combined score below `CONFIDENCE_FLOOR` returns
 *     `null` rather than a wrong guess. A wrong guess is a worse experience
 *     than a vending-machine blog.
 *
 * Credits: Mike K. (`from-michael-koch-project-architect-76.md` §1-§7 — the
 * napkin diagram, the pure-module mandate, the cookie/store layered read,
 * the `CONFIDENCE_FLOOR=0.40` floor, the RETURNER short-circuit, the no-new-
 * deps rule), Elon M. (the "first-paint archetype guess" prescription that
 * fires the killer feature on visit one), Paul K. (the "felt, not flagged"
 * Tier S4 doctrine — the swap never announces itself), Tanya D. (the "killer
 * feature is the contrast between an immovable stage and words that move"
 * sentence — this module makes the words move on visit one).
 */

import type { ArchetypeKey } from '@/types/content';

// ─── Public types ──────────────────────────────────────────────────────────

/**
 * Which signal lane fired strongest in the blend. For telemetry/debugging
 * only; the consumer (`archetype-store`) does not branch on it. Kept on the
 * type so a future receipt or admin panel can show "why did we guess this?"
 */
export type ProvisionalSource =
  | 'referrer'
  | 'entry-tags'
  | 'time-of-day'
  | 'ua'
  | 'blended';

/**
 * Raw inputs the heuristic reads. The caller (middleware) assembles these
 * from `NextRequest` headers — keeping this module unaware of the framework.
 *
 * `hasReturnerCookie` collapses the "do not guess for someone we already
 * know" rule into a single boolean — the caller decides what counts as
 * "we know you" (Mirror result OR thermal-history active OR an explicit
 * returner sentinel cookie).
 */
export interface FirstPaintSignals {
  /** `Referer` header — full URL or `null` when absent / cross-origin. */
  readonly referrer: string | null;
  /** `User-Agent` header — `null` for CLI/bot/missing. */
  readonly userAgent: string | null;
  /** Request URL pathname (e.g. `/article/foo` or `/articles`). */
  readonly pathname: string;
  /** Local hour 0-23 (server-side approximation; UTC is fine for a hint). */
  readonly hourLocal: number;
  /** True if the reader carries Mirror history — short-circuit to `null`. */
  readonly hasReturnerCookie: boolean;
}

/**
 * The heuristic's verdict. `confidence` lives in `[0, 1]`. `source` names the
 * lane that contributed most; "blended" means two lanes agreed.
 */
export interface ProvisionalTone {
  readonly archetype: ArchetypeKey;
  readonly confidence: number;
  readonly source: ProvisionalSource;
}

// ─── Constants — the dials, kept small and named ───────────────────────────

/**
 * Combined-score floor. Below this we return `null` rather than guess — a
 * wrong guess is worse than a quiet page (Mike §7 mitigations).
 *
 * Tuned conservatively: a single weak signal lane (e.g. time-of-day alone)
 * never crosses this floor. Two agreeing lanes do. (See `combineSignals`.)
 */
export const CONFIDENCE_FLOOR = 0.40;

/** Maximum confidence we will ever emit — provisional means provisional. */
export const PROVISIONAL_CEILING = 0.65;

/**
 * Per-lane base weight. The blend sums lane scores then divides by total
 * weight; missing lanes contribute zero on both sides (no penalty for
 * silence).
 */
const LANE_WEIGHTS = {
  referrer: 0.45,
  entryTags: 0.35,
  timeOfDay: 0.10,
  ua: 0.10,
} as const;

// ─── Lane #1 · Referrer host → archetype affinity ──────────────────────────

/**
 * Affinity table — referrer host substring → archetype + lane confidence.
 * Pure data, easy to extend, no regex chains. Order doesn't matter; the
 * first match in `referrerLane` wins, so list specific hosts before generic.
 *
 * The entries are intentionally conservative — only sources where the host
 * itself is a strong tone signal (link-aggregators with their own audience).
 * Generic search/social referrers (`google.com`, `t.co`) deliberately omitted:
 * they carry no archetype hint, the table should not pretend otherwise.
 */
const REFERRER_AFFINITY: ReadonlyArray<{
  readonly host: string;
  readonly archetype: ArchetypeKey;
  readonly confidence: number;
}> = [
  // HN: deep-divers and explorers debate technical posts — lean deep-diver.
  { host: 'news.ycombinator.com', archetype: 'deep-diver', confidence: 0.55 },
  // Lobsters: same audience archetype as HN, smaller community.
  { host: 'lobste.rs',            archetype: 'deep-diver', confidence: 0.55 },
  // Mastodon instances: explorers — algorithmic-feed refugees, curious.
  { host: 'mastodon.social',      archetype: 'explorer',   confidence: 0.45 },
  { host: 'mas.to',               archetype: 'explorer',   confidence: 0.45 },
  // Reddit: mixed audience, mild explorer lean.
  { host: 'reddit.com',           archetype: 'explorer',   confidence: 0.40 },
  // Pinboard / Are.na: collectors by definition.
  { host: 'pinboard.in',          archetype: 'collector',  confidence: 0.55 },
  { host: 'are.na',               archetype: 'collector',  confidence: 0.55 },
  // Substack / readwise: faithful — long-form newsletter readers.
  { host: 'substack.com',         archetype: 'faithful',   confidence: 0.50 },
  { host: 'readwise.io',          archetype: 'faithful',   confidence: 0.50 },
];

/**
 * Extract the host from a referrer string. Pure, ≤ 10 LOC. Returns `null`
 * for malformed or empty input — the lane then contributes zero.
 */
export function hostOf(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Pick the affinity row whose host appears in the referrer. Pure, ≤ 10 LOC.
 * Returns the first match (table order); use specific hosts before generic.
 */
function referrerLane(referrer: string | null): { archetype: ArchetypeKey; confidence: number } | null {
  const host = hostOf(referrer);
  if (!host) return null;
  const hit = REFERRER_AFFINITY.find((row) => host.includes(row.host));
  return hit ? { archetype: hit.archetype, confidence: hit.confidence } : null;
}

// ─── Lane #2 · Entry path / tags → archetype affinity ──────────────────────

/**
 * Path-fragment affinity. Reuses the existing route taxonomy — no new
 * vocabulary. The entry surface itself is a tone hint:
 *   `/articles`          → explorers (browse landing)
 *   `/resonances`        → resonators (collected highlights)
 *   `/article/[id]`      → readers in flow — neutral lane (no add)
 *   `/mirror`            → already at the Mirror; returners short-circuit
 */
const PATH_AFFINITY: ReadonlyArray<{
  readonly prefix: string;
  readonly archetype: ArchetypeKey;
  readonly confidence: number;
}> = [
  // Confidences sit a hair above `CONFIDENCE_FLOOR` (0.40) so a single-
  // lane path hit clears the silence threshold without float drift —
  // `0.45 × weight / weight` survives the JS division round-trip cleanly.
  { prefix: '/resonances', archetype: 'resonator',  confidence: 0.55 },
  { prefix: '/articles',   archetype: 'explorer',   confidence: 0.45 },
  { prefix: '/trust',      archetype: 'faithful',   confidence: 0.45 },
];

/** Look up the path lane. Pure, ≤ 10 LOC. */
function entryPathLane(pathname: string): { archetype: ArchetypeKey; confidence: number } | null {
  if (!pathname) return null;
  const hit = PATH_AFFINITY.find((row) => pathname.startsWith(row.prefix));
  return hit ? { archetype: hit.archetype, confidence: hit.confidence } : null;
}

// ─── Lane #3 · Time-of-day → gentle bias ───────────────────────────────────
//
// Weak signal by design — never strong enough to push past the floor on its
// own. Late-night reading skews "deep" (slow, reflective), early-morning
// commute skews "explorer" (skim, queue). This is a hint, not a verdict.

/** Hour bucket → archetype lean. Pure, ≤ 10 LOC. Returns `null` for the
 *  daytime band where no lean is honest. */
function timeOfDayLane(hourLocal: number): { archetype: ArchetypeKey; confidence: number } | null {
  if (hourLocal < 0 || hourLocal > 23) return null;
  if (hourLocal >= 22 || hourLocal < 5) {
    return { archetype: 'deep-diver', confidence: 0.30 };
  }
  if (hourLocal >= 6 && hourLocal < 9) {
    return { archetype: 'explorer', confidence: 0.25 };
  }
  return null;
}

// ─── Lane #4 · User-agent class → archetype lean ───────────────────────────
//
// Cheapest signal — UA strings are a hint about device class, which loosely
// correlates with reading posture. Mobile = on-the-go = explorer; desktop =
// seated = deep-diver. Bots return `null` (we never guess for crawlers).

/** Detect a robot/crawler. Pure, ≤ 10 LOC. */
export function isBotUA(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /bot|crawl|spider|slurp|facebookexternalhit|preview/i.test(userAgent);
}

/** UA lane — desktop vs mobile lean. Pure, ≤ 10 LOC. */
function uaLane(userAgent: string | null): { archetype: ArchetypeKey; confidence: number } | null {
  if (!userAgent || isBotUA(userAgent)) return null;
  if (/Mobile|Android|iPhone/.test(userAgent)) {
    return { archetype: 'explorer', confidence: 0.20 };
  }
  return { archetype: 'deep-diver', confidence: 0.20 };
}

// ─── Combine — weighted vote across lanes ──────────────────────────────────

/** Tally row used by the blend. Pure data shape. */
interface LaneVote {
  readonly archetype: ArchetypeKey;
  readonly weighted: number;     // confidence × lane weight
  readonly weight: number;       // lane weight (for normalization)
}

/**
 * Build the votes array from the four lanes. Pure, ≤ 10 LOC. Missing lanes
 * are simply omitted — no zero-weighted ghost rows.
 */
function gatherVotes(signals: FirstPaintSignals): LaneVote[] {
  const votes: LaneVote[] = [];
  const ref = referrerLane(signals.referrer);
  if (ref) votes.push({ ...ref, weighted: ref.confidence * LANE_WEIGHTS.referrer, weight: LANE_WEIGHTS.referrer });
  const path = entryPathLane(signals.pathname);
  if (path) votes.push({ ...path, weighted: path.confidence * LANE_WEIGHTS.entryTags, weight: LANE_WEIGHTS.entryTags });
  const time = timeOfDayLane(signals.hourLocal);
  if (time) votes.push({ ...time, weighted: time.confidence * LANE_WEIGHTS.timeOfDay, weight: LANE_WEIGHTS.timeOfDay });
  const ua = uaLane(signals.userAgent);
  if (ua) votes.push({ ...ua, weighted: ua.confidence * LANE_WEIGHTS.ua, weight: LANE_WEIGHTS.ua });
  return votes;
}

/**
 * Reduce per-archetype tallies. Pure, ≤ 10 LOC. Returns a Map keyed by
 * archetype with summed `weighted` + `weight`.
 */
function tallyByArchetype(votes: LaneVote[]): Map<ArchetypeKey, { weighted: number; weight: number }> {
  const tally = new Map<ArchetypeKey, { weighted: number; weight: number }>();
  for (const v of votes) {
    const cur = tally.get(v.archetype) ?? { weighted: 0, weight: 0 };
    cur.weighted += v.weighted;
    cur.weight   += v.weight;
    tally.set(v.archetype, cur);
  }
  return tally;
}

/**
 * Pick the leading archetype by weighted score. Pure, ≤ 10 LOC. Returns
 * `null` when the tally is empty.
 */
function leader(
  tally: Map<ArchetypeKey, { weighted: number; weight: number }>,
): { archetype: ArchetypeKey; weighted: number; weight: number } | null {
  let best: { archetype: ArchetypeKey; weighted: number; weight: number } | null = null;
  for (const [archetype, t] of tally) {
    if (!best || t.weighted > best.weighted) best = { archetype, ...t };
  }
  return best;
}

/** Decide whether the lane mix counts as "blended" (≥2 contributing lanes). */
function sourceLabel(votes: LaneVote[], leadArch: ArchetypeKey): ProvisionalSource {
  const supporting = votes.filter((v) => v.archetype === leadArch);
  if (supporting.length >= 2) return 'blended';
  // Single-lane source — name it.
  const w = supporting[0]?.weight ?? 0;
  if (w === LANE_WEIGHTS.referrer)  return 'referrer';
  if (w === LANE_WEIGHTS.entryTags) return 'entry-tags';
  if (w === LANE_WEIGHTS.timeOfDay) return 'time-of-day';
  return 'ua';
}

/** Clamp helper — kept tiny + local. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Public — the one verb middleware (and tests) call ────────────────────

/**
 * Guess a provisional tone from request-level signals. Pure. Returns `null`
 * when the visitor is a known returner OR when the blended confidence falls
 * below `CONFIDENCE_FLOOR` (silence is a feature; Paul §S4).
 *
 * The output's `confidence` is the normalized weighted average across the
 * lanes that contributed, capped at `PROVISIONAL_CEILING`. The Mirror layer
 * always wins — provisional is a fallback, never an override.
 */
export function guessProvisionalTone(signals: FirstPaintSignals): ProvisionalTone | null {
  if (signals.hasReturnerCookie) return null;
  const votes = gatherVotes(signals);
  if (votes.length === 0) return null;
  const tally = tallyByArchetype(votes);
  const lead = leader(tally);
  if (!lead || lead.weight === 0) return null;
  const blendedConfidence = clamp(lead.weighted / lead.weight, 0, PROVISIONAL_CEILING);
  if (blendedConfidence < CONFIDENCE_FLOOR) return null;
  return {
    archetype: lead.archetype,
    confidence: blendedConfidence,
    source: sourceLabel(votes, lead.archetype),
  };
}

// ─── Cookie format — the wire shape the middleware writes ──────────────────

/** Cookie name the middleware sets. Read by `archetype-store`. */
export const PROVISIONAL_COOKIE = '__pt';

/**
 * Encode a tone as `<archetype>.<confidence-as-2dp>`. Pure, ≤ 10 LOC.
 * Cookie payload is small (≤ 25 bytes) and human-readable; no JSON, no
 * encoding tricks, no PII.
 */
export function encodeProvisionalCookie(tone: ProvisionalTone): string {
  const conf = clamp(tone.confidence, 0, 1).toFixed(2);
  return `${tone.archetype}.${conf}`;
}

/** Allowed archetype keys, sorted for stable scanning. Pure data. */
const ALLOWED_ARCHETYPES: ReadonlySet<ArchetypeKey> = new Set([
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
]);

/**
 * Decode `<archetype>.<conf>` back to a tone. Pure, ≤ 10 LOC. Returns `null`
 * for unknown archetypes, malformed strings, or out-of-range confidence —
 * a corrupt cookie folds to neutral, never throws.
 *
 * Splits on the *first* `.` only — the confidence half is `0.65`, which
 * itself contains a dot. A naive `.split('.')` would tear `0.65` into
 * `['0','65']` and round-trip a wrong number; the explicit `indexOf` keeps
 * the round-trip honest.
 */
export function decodeProvisionalCookie(raw: string | null | undefined): ProvisionalTone | null {
  if (!raw) return null;
  const dot = raw.indexOf('.');
  if (dot < 0) return null;
  const archetype = raw.slice(0, dot);
  if (!ALLOWED_ARCHETYPES.has(archetype as ArchetypeKey)) return null;
  const confidence = parseFloat(raw.slice(dot + 1));
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
  return { archetype: archetype as ArchetypeKey, confidence, source: 'blended' };
}
