/**
 * Alpha Ledger — the 7th ledger, role-in-attention presence vocabulary.
 *
 * CSS (`app/globals.css`) is canonical. TypeScript mirrors it.
 * `lib/design/__tests__/alpha-sync.test.ts` enforces kinship. If a number
 * changes in one place it must change in the other — or the test fails.
 *
 * Four rungs, named by **UX role the element plays in the reader's
 * attention**, not by volume or intimacy (no "silent/hush/whisper" ladder
 * — that collides with Color=warmth and Typography=voice):
 *
 *   hairline (0.10) — "This is a line, not content." — dividers, ghost strokes.
 *   muted    (0.30) — "Ambient chrome; skip past it."  — skeletons, disabled rest.
 *   recede   (0.50) — "Context around the subject."     — meta, attribution.
 *   quiet    (0.70) — "Content, but not THE content."  — secondary copy.
 *
 * NOT in the ledger — owned by Motion:
 *   α = 0.0  (opacity-0)   — fade-out endpoint
 *   α = 1.0  (opacity-100) — fade-in endpoint / motion-reduce baseline
 *
 * And α = 1.0 as *default presence* is the subject — headings, body, any
 * element the reader is supposed to meet head-on. No ledger entry needed;
 * it's just the default render.
 *
 * IMPORTANT: if you change a value in globals.css, change it here too.
 * The test in __tests__/alpha-sync.test.ts catches drift.
 *
 * Credits: Tanya D. (UIX spec #80 — role-based 4-rung vocabulary, first-
 * scroll shape test, loading-skeleton collapse, layer-audit deletions),
 * Mike K. (architect napkin #24 — CSS-canonical + sync-test + adoption-
 * guard pattern, scope fence, snap-not-preserve migration, explicit Motion
 * carve-out), Elon M. (first-principles teardown that produced the 4-rung
 * number and the Motion-endpoint ownership split), Paul K. (business
 * outcome — body gains authority because everything around it steps back
 * the same amount).
 */

// ─── Rung vocabulary — mirrors --sys-alpha-* in app/globals.css ────────────

/**
 * Four rungs, named by UX role, ordered lightest → heaviest presence.
 *
 * Naming is by *what the reader does with the element*, not by how loud it
 * "feels." A divider USES `hairline`; a footnote USES `recede`. Do NOT add
 * rungs like `divider-alpha` or `footnote-alpha` — those are uses, not atoms.
 */
export const ALPHA = {
  hairline: 0.10, // --sys-alpha-hairline
  muted:    0.30, // --sys-alpha-muted
  recede:   0.50, // --sys-alpha-recede
  quiet:    0.70, // --sys-alpha-quiet
} as const;

export type AlphaRung = keyof typeof ALPHA;

/**
 * Felt-sentence calibration (Tanya UX §2 vocabulary). When a reviewer asks
 * "is `text-mist/60` recede or quiet?" they need a sentence, not a number.
 * Use these one-liners during snap-to-rung review:
 *
 *   hairline (0.10) → "It's geometry. The eye registers it as space, not surface."
 *   muted    (0.30) → "It exists, the eye skims past. Receipts. Background metadata."
 *   recede   (0.50) → "The frame around the subject. Bylines, captions, attribution."
 *   quiet    (0.70) → "Content, but not THE content. Subheads, annotations, the closing of a letter."
 *   default  (1.00) → "Meet head-on. Headings, body prose, the archetype keyword."
 *
 * Vocabulary calibration only — no code change, no test change. One scroll
 * up; one less argument per PR. (Vision: "polish what we have — AAA.")
 */

/** Ordered lightest → heaviest presence. Used by the invariant + guard msg. */
export const ALPHA_ORDER: readonly AlphaRung[] =
  ['hairline', 'muted', 'recede', 'quiet'] as const;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Numeric alpha for a named rung. Pure. */
export const alphaOf = (r: AlphaRung): number => ALPHA[r];

/** CSS custom-property reference for a named rung. Pure. */
export const cssVarOf = (r: AlphaRung): string => `var(--sys-alpha-${r})`;

/** Tailwind class fragment (e.g. "opacity-muted"). Pure. */
export const classOf = (r: AlphaRung): string => `opacity-${r}`;

/**
 * Snap an arbitrary 0..1 alpha to the nearest ledger rung. Pure.
 *
 * Used by the migration review to answer "this was `opacity-60`, which
 * rung?" — whichever `snapToRung(0.6)` returns. Ties pick the lower rung
 * (more step-back = more conservative voice).
 */
export function snapToRung(alpha: number): AlphaRung {
  const a = Math.min(1, Math.max(0, alpha));
  const [best] = ALPHA_ORDER.map(
    (r) => [r, Math.abs(ALPHA[r] - a)] as const,
  ).sort(([, da], [, db]) => da - db);
  return best[0];
}

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: every rung in `ALPHA_ORDER` is in `ALPHA`, values are strictly
 * ascending (lightest → heaviest), every value is in the open interval
 * (0, 1) — because 0 and 1 are Motion's endpoints, not rungs. Pure.
 */
export function alphaInvariantHolds(): boolean {
  if (ALPHA_ORDER.length !== Object.keys(ALPHA).length) return false;
  if (!ALPHA_ORDER.every((r) => r in ALPHA)) return false;
  if (!ALPHA_ORDER.every((r) => ALPHA[r] > 0 && ALPHA[r] < 1)) return false;
  return ALPHA_ORDER.every(
    (r, i) => i === 0 || ALPHA[r] > ALPHA[ALPHA_ORDER[i - 1]],
  );
}

// ─── Allow-list token for explicit exemptions ──────────────────────────────

/**
 * Inline `// alpha-ledger:exempt — <reason>` comment marks a line as an
 * honest exception. The only well-known reason is "motion fade endpoint"
 * (`opacity-0` / `opacity-100` used as transition endpoints, owned by
 * Motion). Reviewer-visible tokens beat invisible drift — same rule as
 * Elevation's ELEVATION_LEDGER_EXEMPT_TOKEN.
 *
 * Usage in source:
 *   return 'opacity-0 translate-y-enter-sm'; // alpha-ledger:exempt — motion fade endpoint
 */
export const ALPHA_LEDGER_EXEMPT_TOKEN = 'alpha-ledger:exempt';

/**
 * Path-allow-list for Motion's endpoint-owning module. This file is the ONE
 * home for `opacity-0` / `opacity-100` without per-line exemption comments.
 * Any other file using those classes must earn an inline exempt token.
 *
 * The adoption test reads this; change it here and the test updates.
 */
export const ALPHA_MOTION_ENDPOINT_PATHS: readonly string[] = [
  'lib/utils/animation-phase.ts',
] as const;

// ─── Color-alpha shorthand (Phase II) ─────────────────────────────────────
//
// The third dialect: `(bg|text|border|shadow)-<color>/<N>`. Until Phase II
// the ledger owned `opacity-<rung>` and `style={{opacity:N}}`; the Tailwind
// shorthand drifted outside the fence. This section:
//
//   • enumerates the color families the helper covers,
//   • maps (kind × color × rung) → a JIT-visible string LITERAL (no
//     template interpolation — Tailwind's JIT can't see dynamic class
//     strings; write them out so the compile step picks them up),
//   • provides `snapPctToRung(N)` — integer-percent → rung (or null),
//     the exact shape the adoption test consults,
//   • lists legal integer percents admitted by the guard (ledger × 100,
//     plus 100 itself — the Motion fade-endpoint carve-out, same spirit
//     as `opacity-100`).
//
// Credits: Mike K. napkin #38 §4 (helper shape, "JIT-safe, no template
// interpolation"), §5.2 (legal rungs + Motion carve-out for `/100`),
// §5.5 (widen to shadow-<color>/N), Tanya D. UX spec §2 / §4.1 (one
// ambient-chrome voice on the Portal — the thing this enforces).

/** Color families reachable via `alphaClassOf`. Lowercase kebab, stable.
 *
 *  `primary` and `cyan` were promoted in Mike napkin #51 §3 (Tanya UX #58 §6)
 *  to close the worldview-chip drift: the four worldview voices now route
 *  through `alphaClassOf` uniformly, no raw `bg-primary/30` / `bg-cyan/30`
 *  literals scattered across components. Pinned in
 *  `lib/design/__tests__/worldview.test.ts`.
 *
 *  `secondary` and `amber` promoted in Mike napkin #96 §3 (Tanya UX #22 §3.3)
 *  to close the NextRead farewell-chip drift: the five archetype voices
 *  (`deep-diver`/`explorer`/`faithful`/`resonator`/`collector`) now route
 *  through `alphaClassOf` uniformly. Pinned in
 *  `lib/design/__tests__/archetype-accents.test.ts`. */
export const ALPHA_COLOR_FAMILIES = [
  'fog', 'mist', 'rose', 'gold',
  'accent', 'surface', 'foreground', 'background',
  'primary', 'cyan',
  'secondary', 'amber',
] as const;

export type ColorFamily = (typeof ALPHA_COLOR_FAMILIES)[number];

/** Tailwind property-prefix the color-alpha shorthand can appear under. */
export type ColorAlphaKind = 'bg' | 'text' | 'border' | 'shadow';

/**
 * Legal integer percents the color-alpha guard admits. Ledger × 100
 * plus 100 itself — the Motion fade-endpoint carve-out (Mike §5.2).
 * Anything else is drift: snap to the nearest rung or earn an exempt
 * token. Readonly Set because the guard consults it hot-path per match.
 */
export const ALPHA_COLOR_SHORTHAND_LEGAL_PCTS = new Set<number>([
  10, 30, 50, 70, 100,
]);

/**
 * Grandfathered drift inventory — files that already contained color-alpha
 * shorthand outside the legal rungs before Phase II shipped. This list is
 * drift-in-progress, not policy: each entry is a micro-PR receipt waiting
 * to be redeemed. Removing a file from this list is how a future PR says
 * "this file now snaps to the ledger." The list should ONLY shrink.
 *
 * Why a path-allow-list rather than per-line inline tokens: ~66 drift
 * occurrences across 24 files. Peppering 66 `// alpha-ledger:exempt`
 * comments is noise that dilutes the token's meaning (the token means
 * "honest, reasoned exception" — not "migration backlog"). One reviewable
 * list here keeps each grandfather visible and auditable at the file level.
 *
 * When migrating a file off this list, either:
 *   (a) snap each N ∈ {10,30,50,70,100}, or
 *   (b) route the call through `alphaClassOf(color, rung, kind)`.
 */
export const ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS: readonly string[] = [
  // Ghost Sweep (Mike #41 + Elon empirical verification): `app/error.tsx`
  // and `app/not-found.tsx` retired with zero hits — both compose
  // `<EmptySurface />` and never carried color-alpha drift in the first
  // place. Removed in this PR.
  // Live drifter retired (Tanya UX §4.1): `RecognitionWhisper.tsx` snapped
  // text-gold/60 → text-gold/50 (recede; the room remembers, gently).
  // Live drifter retired (Tanya UX #63 §3, Mike napkin #27 §4):
  //   `ReturnLetter.tsx` — six drift sites snapped to the ledger
  //   (label /60 → recede; opening + body /90 → default 1.00; divider /20 →
  //   hairline; closing /80 → quiet; settled + un-settled border → hairline).
  //   The recognition pair (Letter + Whisper) now share rung tokens by intent
  //   at the surfaces where they speak the same line; the closing of the
  //   letter and the whisper-quote register both resolve to `quiet`. Pinned
  //   in `components/return/__tests__/ReturnLetter.alpha.test.ts`.
  // Live drifter retired (Mike napkin #47 §3, mirroring napkin #19 §4.2):
  //   `QuickMirrorCard.tsx` — five drift sites were snapped to the ledger
  //   (dismissed-divider /20 → hairline; whisper-quote /80 → quiet;
  //   shimmer + reveal + rest border /20 → muted, the pair-rule rung the
  //   sibling MirrorRevealCard already paints with). The file itself was
  //   later RETIRED (Sid, Tanya UX "One Mirror, One Room") — `app/mirror/
  //   page.tsx` adapts the quick-mirror result onto `MirrorRevealCard`
  //   for both branches, so the orphan ceased to ship; the receipt now
  //   lives only on the surviving sibling
  //   (`components/mirror/MirrorRevealCard.tsx`). The list ONLY shrinks.
  // Live drifter retired (Mike napkin #50, Tanya UX #58):
  //   `ExploreArticleCard.tsx` — nine drift sites snapped to the ledger
  //   (curated rest /20 → muted; organic rest /15 → hairline; organic
  //   hover /40 → recede; four worldview-chip backgrounds /20 → muted;
  //   worldview fallback /20 → muted). The pair-invariant edge — curated
  //   hover ≡ organic hover at the `recede` rung — is now structural
  //   (different family, same alpha): hue carries category, the rung
  //   carries interactivity. Pinned in
  //   `components/explore/__tests__/ExploreArticleCard.alpha.test.ts`.
  // Follow-on redeemed (Mike napkin #51, Tanya UX #58 §6):
  //   `primary` and `cyan` promoted into `ALPHA_COLOR_FAMILIES`; the
  //   four worldview chip styles now route through `alphaClassOf`
  //   uniformly. The chip-class manifest moved to
  //   `lib/design/worldview.ts` — single typed home keyed by `FilterType`.
  //   Pinned in `lib/design/__tests__/worldview.test.ts`.
  // Follow-on redeemed (Mike napkin #96, Tanya UX #22 §3.3):
  //   `secondary` and `amber` promoted into `ALPHA_COLOR_FAMILIES`; the
  //   five archetype farewell-chip styles now route through `alphaClassOf`
  //   uniformly. The accent-class manifest moved to
  //   `lib/design/archetype-accents.ts` — single typed home keyed by
  //   `ArchetypeKey`. `components/reading/NextRead.tsx` retired off this
  //   list (rule-of-three twin to napkin #51). Pinned in
  //   `lib/design/__tests__/archetype-accents.test.ts` +
  //   `components/reading/__tests__/NextRead.adoption.test.ts`.
  // Live drifter retired (Mike napkin #90 + Tanya UX #42, Sid 2026-04-27):
  //   `GemHome.tsx` graduated to the Voice Ledger via the new resolver in
  //   `lib/design/nav-paint.ts`. Four state classes now route through
  //   `alphaClassOf` and snap to ledger rungs:
  //     quiet/dormant — `text-mist/20` → `text-mist/10`  (hairline)
  //     stirring      — `text-gold/30` (no change)        (muted)
  //     warm          — `text-gold/60` → `text-gold/50`  (recede)
  //     luminous      — `text-gold/80` → `text-gold/70`  (quiet)
  //   The asymmetric move (mist/20 → mist/10) is deliberate (Tanya UX #42
  //   §1): "on article pages the gem is waypoint, not lantern" — the
  //   `hairline` rung's felt sentence ("it's geometry") matches the intent
  //   exactly. The gold rungs step BACK to honour Krystle's pair-rule for
  //   sister gold surfaces (Mike #92): the Golden Thread paints at full
  //   presence at its tide-mark crest; the gem at every state sits at
  //   least one rung lower. The list ONLY shrinks. Pinned in
  //   `lib/design/__tests__/nav-voice-adoption.test.ts`.
  // Live drifters retired — `border-fog/20|15 → /30` chrome-muted register
  //   (Mike napkins #92 / #110 / #112 / chrome-paint-kernel, Tanya UIX
  //   #43 / #87 / "five edges, one hand", Sid). The four prior `border-
  //   fog/<N>` snaps (`QuoteKeepsake`, `ThreadKeepsake`, `AmbientNav`
  //   chassis hairline, `Toast`) plus the two raw-literal migrations
  //   (`Threshold` center-shape, `KeepsakePlate` thumbnail) all route
  //   through `chromeMutedBorder()` in `lib/design/chrome-paint.ts` —
  //   one paint can, six chrome edges, byte-identical grep parity.
  //   Active SSOT lives at the kernel; the per-file `*.alpha.test.ts`
  //   pins the wire format and the `chrome-paint-fence.test.ts` pins
  //   the call-site rhythm. The chassis scrim's `bg-void/80` exempt
  //   token still lives inside `navBarChassis()` (Elon #80 option (a)
  //   — `void` ∉ ALPHA_COLOR_FAMILIES; `/80` ∉ legal rungs).
  //   ThreadKeepsake's secondary `text-mist/60 → /50` snap is unrelated
  //   to chrome-paint; the `mist`-recede route through `alphaClassOf`
  //   stays its own one-line audit trail.
  // Live drifter retired (Mike napkin #111, Tanya UIX #80, Krystle drift-
  //   density pick, Sid 2026-04-27): `app/resonances/ResonanceEntry.tsx`
  //   — the `alive ↔ dimmed` pair-rule graduates to the role-based 4-rung
  //   vocabulary. Two literal snaps + eight ledger routings:
  //     SURFACE pair (Tanya §4 + §10 row A — "two registers, one rung apart"):
  //       alive   /60  → `alphaClassOf('surface','recede','bg')` (= /50;
  //                       step DOWN — body in repose, the reader's
  //                       rose-italic note gains free authority).
  //       dimmed  /30  → `alphaClassOf('surface','muted','bg')`   (= /30,
  //                       same wire string, now ledger-sourced).
  //       (`ALPHA_ORDER.indexOf('recede') - ALPHA_ORDER.indexOf('muted') === 1`.)
  //     RIBBON: dimmed `border-rose/30` → `alphaClassOf('rose','muted','border')`.
  //     GEM family-anchor (Tanya §4, visited-launcher precedent): both gems
  //       at the `quiet` rung; family carries the temperature, rung anchors.
  //         alive   `text-rose/70` → `alphaClassOf('rose','quiet','text')`
  //         dimmed  `text-mist/30` → `alphaClassOf('mist','quiet','text')`
  //                                   (= /70 — rung jump, family swap;
  //                                   recognition grammar already in use
  //                                   by `resolveLauncherPaint`).
  //     META + CLOSING + QUOTED routed through `alphaClassOf` for audit:
  //       quoted line     `/70` → `alphaClassOf('foreground','quiet','text')`
  //       article meta    `/50` → `alphaClassOf('mist','recede','text')`
  //       closing line    `/50` → `alphaClassOf('gold','recede','text')`
  //     DIVIDERS: two raw `<div h-px …>` retire to `<Divider.Static
  //       spacing="sys-4" />` (Tanya §5; geometry-only kernel auto-resolves
  //       to `bg-gold/10` via `alphaClassOf('gold','hairline','bg')`).
  //       The `bg-gold/20` drift on line 117 and the raw `bg-fog` divider
  //       on line 119 both die — one dialect, two utterances.
  //   The visited-launcher contrast audit's `CARD_SURFACE_ALPHA` updated
  //   0.6 → 0.5 in lockstep so the WCAG floor stays measured against the
  //   *actual* alive surface composition. `gold/70` still clears the
  //   text-tier floor over both anchors. Pinned in
  //   `app/resonances/__tests__/ResonanceEntry.alpha.test.ts`.
  //   The list ONLY shrinks.
  //   (Toast's `/15 → /30` snap is part of the consolidated chrome-paint
  //   note above — sister-surface symmetry with the AmbientNav top-edge
  //   hairline. Pinned in `components/shared/__tests__/Toast.alpha.test.ts`.)
  // Live drifter retired (Mike napkin #30 — Quote-Frame Const, Grandfather
  //   Shrink — + Tanya UIX #12 §1 — The Echo Frame, Sid 2026-04-27):
  //   `components/resonances/ResonanceDrawer.tsx` — the duplicated quoted-
  //   line frame ("the Echo Frame" — the single surface where "the blog
  //   reads you back" becomes literal pixels) graduates off the alpha
  //   grandfather list. Two drift sites snapped + literal hoisted to a
  //   module-scope `QUOTE_FRAME_CLASS` const so the form-preview and
  //   ceremony render paths paint byte-identical chrome:
  //     surface — `bg-background/60` → `alphaClassOf('background','recede',
  //                'bg')` (= `bg-background/50`; "context around the
  //                subject" — the line floats on the page, not in a
  //                pulled-out card).
  //     ribbon  — `border-rose/40`   → `alphaClassOf('rose','muted',
  //                'border')` (= `border-rose/30`; the reader's voice
  //                marker, ambient-chrome rung — siblings the
  //                `ResonanceEntry` dimmed ribbon at the same `muted`
  //                rung; one register, two surfaces).
  //   Plan A snap from Mike napkin #30 §PoI #2 — half a rung in each
  //   direction, both arrive on the ledger; Path B (hoist + grandfather)
  //   was the fallback if UX rejected the snap (it didn't — Tanya UIX
  //   #12 §1.1 ratifies the rung anchors). Three callers across the
  //   project now sit on `border-rose/30` (`ResonanceEntry` dimmed,
  //   `ResonanceDrawer` form, `ResonanceDrawer` ceremony) — the rose
  //   ribbon speaks at one rung site-wide. No kernel-lift to
  //   `lib/design/`: two callers in one file is a const, not a kernel
  //   (Mike #30 §PoI #1 / Elon §2). Pinned in
  //   `components/resonances/__tests__/ResonanceDrawer.alpha.test.ts`.
  //   The list ONLY shrinks.
  // Live drifter retired (Mike napkin #113 — One Filament, Ledger-Routed,
  //   Fenced — + Tanya UIX #54 §1, Sid 2026-04-27):
  //   `app/resonances/EvolutionThread.tsx` — the single off-ledger literal
  //   on the whisper-line carrier graduates to the role-based 4-rung
  //   vocabulary. ONE drift site snapped + module-scope handle planted:
  //     hairline — `border-gold/20` → `alphaClassOf('gold','hairline',
  //                'border')` (= `border-gold/10`; "it's geometry; the eye
  //                registers it as space, not surface."). The whisper line
  //                and the section dividers above/below it now paint at
  //                the same rung — the reader's eye no longer sees the
  //                frame trying to introduce the words. The `HAIRLINE_BORDER`
  //                handle joins `Divider.HAIRLINE_BG`, `MirrorRevealCard.
  //                BORDER_HAIRLINE`, and `StratifiedRenderer.HAIRLINE_BORDER`
  //                as sister surfaces — N=4 callers of `alphaClassOf('gold',
  //                'hairline','border'|'bg')` route through the resolver
  //                directly (no `goldHairlineBorder()` kernel-lift; the
  //                resolver IS the kernel — Mike #113 §6 PoI #4 / Elon §3).
  //   The four-site rhythm fence (`ViaWhisper`, `RecognitionWhisper`,
  //   `GemHome`, `EvolutionThread`) now shares the rung anchor: one
  //   filament, one voice. Pinned per-file in `app/resonances/__tests__/
  //   EvolutionThread.alpha.test.ts`; pinned site-wide by `components/
  //   shared/__tests__/divider-fence.test.ts` Axis F (no raw `border-
  //   gold/<N>` outside the kernel + ledger + print domain + JIT-mirror
  //   carve-out).
  // Live drifter retired (Mike napkin #113 §6 PoI ride-along, Sid
  //   2026-04-27): `app/resonances/ResonancesClient.tsx` — the chapter
  //   break marker graduates onto the `Divider.Centered` kernel. ONE
  //   drift site retired with the snap:
  //     hairline — `<div className="h-px bg-gold/20 max-w-divider mx-auto" />`
  //                + sibling label `<p>` → `<Divider.Centered label={brk.
  //                label} />`. The kernel resolves the geometry to
  //                `bg-gold/10` via alphaClassOf, the label sits below
  //                the line as italic micro-caption (Tanya UIX #28 §3.4
  //                "the comma between chapters"). The duplicated
  //                hand-rolled-hairline + label-below pair retires; one
  //                primitive, one address. Divider-fence Axis A goes
  //                green for this file as a side effect.
  //   Remaining literals on the file are all on-ledger (`text-gold/70`
  //   = quiet, `text-mist/50` = recede); the file leaves the grandfather
  //   list with zero off-ledger drift.
  // Live drifter retired (Mike napkin #114 — graduate ViaWhisper to /70
  //   (gold-whisper voice, 5→4) — + Tanya UIX #94 §2, Sid 2026-04-27):
  //   `components/home/ViaWhisper.tsx` — the arrival whisper graduates
  //   onto the role-based 4-rung vocabulary. ONE drift site snapped +
  //   module-scope handle planted:
  //     quiet — `text-gold/80` → `alphaClassOf('gold','quiet','text')`
  //             (= `text-gold/70`; "content, but not THE content"). The
  //             only loud sibling in the four-site rhythm fence steps
  //             back one rung and joins its peers (`RecognitionWhisper`
  //             at /50 archetype-label/intentional pair-rule exception,
  //             `GemHome` at luminous /70 via `gemPaint`, `EvolutionThread`
  //             at /70). The arrival, return, wayfinding, and memory
  //             surfaces now share the rung anchor: one voice, four
  //             locations. The `WHISPER_TEXT` handle joins the family of
  //             module-scope alpha tokens already surfaced via
  //             `__testing__` on the sister sites — N=4 callers of
  //             `alphaClassOf('gold','quiet','text')`/`text-gold/70` route
  //             through the resolver directly (no `goldWhisper()` kernel-
  //             lift; the resolver IS the kernel — Mike #114 §PoI #4 /
  //             Elon §3). Pinned per-file in
  //             `components/home/__tests__/ViaWhisper.alpha.test.ts`;
  //             pinned site-wide by `lib/design/__tests__/
  //             alpha-adoption.test.ts` (`/80` is no longer a legal rung).
  //   The grandfather list shrinks 5 → 4. The list ONLY shrinks.
  // Live drifter retired (Mike napkin #115 — graduate ResonanceSectionHeader
  //   to /50 (rung-mate pair: gold ≡ mist on `recede`) — + Tanya UIX #80
  //   §2 / UIX #90 §3.1, Sid 2026-04-27): `components/resonances/
  //   ResonanceSectionHeader.tsx` — the section-label primitive graduates
  //   onto the role-based 4-rung vocabulary. Two literals snapped + module-
  //   scope handles planted + same-rung pair-fence licensed:
  //     gold — `text-gold/40` → `alphaClassOf('gold','recede','text')`
  //             (= `text-gold/50`; the shaped chapter steps onto the same
  //             rung as `ResonanceEntry`'s alive surface — header is a
  //             sibling of the body, not a louder cousin).
  //     mist — `text-mist/60` → `alphaClassOf('mist','recede','text')`
  //             (= `text-mist/50`; the carrying chapter steps DOWN one
  //             half-rung onto the same `recede` step — both tones differ
  //             by hue, not by volume).
  //   `mist` gains its first real call-site in this same sprint
  //   (`ResonancesClient.tsx` — the carrying subtitle is promoted into the
  //   primitive; Tanya UIX #90 §1 — "give the second tone a real surface
  //   or delete it"); the dormant branch was Schrödinger's tone before, the
  //   per-file §4 fence is now load-bearing. The `GOLD_RUNG` / `MIST_RUNG`
  //   handles join the family of module-scope alpha tokens already surfaced
  //   via `__testing__` on the sister sites — N=2 callers in one file is
  //   a const, not a kernel (Mike §6 / Elon §2.2; no `sectionHeaderToneClass`
  //   kernel-lift, the resolver IS the kernel). No `pair-rule` rename
  //   ceremony in `AGENTS.md`: the per-file §4 same-rung pin is the doctrine
  //   that earns ink. A third call-site licenses graduation. Pinned per-
  //   file in `components/resonances/__tests__/ResonanceSectionHeader.alpha
  //   .test.ts`; pinned site-wide by `lib/design/__tests__/alpha-adoption
  //   .test.ts` (`/40` and `/60` are no longer legal rungs).
  //   The grandfather list shrinks 4 → 3. The list ONLY shrinks.
  'components/articles/ArticlesPageClient.tsx',
  'components/content/StratifiedRenderer.tsx',
  'components/shared/Threshold.tsx',
] as const;

// ─── Helpers — JIT-safe color-alpha class-string factories ────────────────
//
// Each emits a STRING LITERAL Tailwind's JIT can see in source. Do NOT
// template-interpolate these — `` `bg-${color}/${N}` `` is invisible to the
// compiler and the class falls out of the bundle. Written as nested objects
// of literals so every (kind × color × rung) tuple is reachable from grep.

/** Alpha percent for a rung — the integer form the shorthand takes. */
export const alphaPctOf = (r: AlphaRung): number => Math.round(ALPHA[r] * 100);

/**
 * Snap an arbitrary integer percent to a rung IFF it is ON the ledger
 * (10/30/50/70). Pure, ≤ 10 LOC. Returns `null` for anything else — which
 * the guard reads as "this isn't on the ledger; snap it or exempt it."
 * Contrast with `snapToRung` (which rounds to the nearest rung).
 */
export function snapPctToRung(pct: number): AlphaRung | null {
  if (!Number.isInteger(pct)) return null;
  const hit = ALPHA_ORDER.find((r) => alphaPctOf(r) === pct);
  return hit ?? null;
}

/** Background-kind lookup. JIT-visible literal strings, one per cell. */
const BG_ALPHA: Record<ColorFamily, Record<AlphaRung, string>> = {
  fog:        { hairline: 'bg-fog/10',        muted: 'bg-fog/30',        recede: 'bg-fog/50',        quiet: 'bg-fog/70' },
  mist:       { hairline: 'bg-mist/10',       muted: 'bg-mist/30',       recede: 'bg-mist/50',       quiet: 'bg-mist/70' },
  rose:       { hairline: 'bg-rose/10',       muted: 'bg-rose/30',       recede: 'bg-rose/50',       quiet: 'bg-rose/70' },
  gold:       { hairline: 'bg-gold/10',       muted: 'bg-gold/30',       recede: 'bg-gold/50',       quiet: 'bg-gold/70' },
  accent:     { hairline: 'bg-accent/10',     muted: 'bg-accent/30',     recede: 'bg-accent/50',     quiet: 'bg-accent/70' },
  surface:    { hairline: 'bg-surface/10',    muted: 'bg-surface/30',    recede: 'bg-surface/50',    quiet: 'bg-surface/70' },
  foreground: { hairline: 'bg-foreground/10', muted: 'bg-foreground/30', recede: 'bg-foreground/50', quiet: 'bg-foreground/70' },
  background: { hairline: 'bg-background/10', muted: 'bg-background/30', recede: 'bg-background/50', quiet: 'bg-background/70' },
  primary:    { hairline: 'bg-primary/10',    muted: 'bg-primary/30',    recede: 'bg-primary/50',    quiet: 'bg-primary/70' },
  cyan:       { hairline: 'bg-cyan/10',       muted: 'bg-cyan/30',       recede: 'bg-cyan/50',       quiet: 'bg-cyan/70' },
  secondary:  { hairline: 'bg-secondary/10',  muted: 'bg-secondary/30',  recede: 'bg-secondary/50',  quiet: 'bg-secondary/70' },
  amber:      { hairline: 'bg-amber/10',      muted: 'bg-amber/30',      recede: 'bg-amber/50',      quiet: 'bg-amber/70' },
};

/** Text-color-kind lookup. */
const TEXT_ALPHA: Record<ColorFamily, Record<AlphaRung, string>> = {
  fog:        { hairline: 'text-fog/10',        muted: 'text-fog/30',        recede: 'text-fog/50',        quiet: 'text-fog/70' },
  mist:       { hairline: 'text-mist/10',       muted: 'text-mist/30',       recede: 'text-mist/50',       quiet: 'text-mist/70' },
  rose:       { hairline: 'text-rose/10',       muted: 'text-rose/30',       recede: 'text-rose/50',       quiet: 'text-rose/70' },
  gold:       { hairline: 'text-gold/10',       muted: 'text-gold/30',       recede: 'text-gold/50',       quiet: 'text-gold/70' },
  accent:     { hairline: 'text-accent/10',     muted: 'text-accent/30',     recede: 'text-accent/50',     quiet: 'text-accent/70' },
  surface:    { hairline: 'text-surface/10',    muted: 'text-surface/30',    recede: 'text-surface/50',    quiet: 'text-surface/70' },
  foreground: { hairline: 'text-foreground/10', muted: 'text-foreground/30', recede: 'text-foreground/50', quiet: 'text-foreground/70' },
  background: { hairline: 'text-background/10', muted: 'text-background/30', recede: 'text-background/50', quiet: 'text-background/70' },
  primary:    { hairline: 'text-primary/10',    muted: 'text-primary/30',    recede: 'text-primary/50',    quiet: 'text-primary/70' },
  cyan:       { hairline: 'text-cyan/10',       muted: 'text-cyan/30',       recede: 'text-cyan/50',       quiet: 'text-cyan/70' },
  secondary:  { hairline: 'text-secondary/10',  muted: 'text-secondary/30',  recede: 'text-secondary/50',  quiet: 'text-secondary/70' },
  amber:      { hairline: 'text-amber/10',      muted: 'text-amber/30',      recede: 'text-amber/50',      quiet: 'text-amber/70' },
};

/** Border-color-kind lookup. */
const BORDER_ALPHA: Record<ColorFamily, Record<AlphaRung, string>> = {
  fog:        { hairline: 'border-fog/10',        muted: 'border-fog/30',        recede: 'border-fog/50',        quiet: 'border-fog/70' },
  mist:       { hairline: 'border-mist/10',       muted: 'border-mist/30',       recede: 'border-mist/50',       quiet: 'border-mist/70' },
  rose:       { hairline: 'border-rose/10',       muted: 'border-rose/30',       recede: 'border-rose/50',       quiet: 'border-rose/70' },
  gold:       { hairline: 'border-gold/10',       muted: 'border-gold/30',       recede: 'border-gold/50',       quiet: 'border-gold/70' },
  accent:     { hairline: 'border-accent/10',     muted: 'border-accent/30',     recede: 'border-accent/50',     quiet: 'border-accent/70' },
  surface:    { hairline: 'border-surface/10',    muted: 'border-surface/30',    recede: 'border-surface/50',    quiet: 'border-surface/70' },
  foreground: { hairline: 'border-foreground/10', muted: 'border-foreground/30', recede: 'border-foreground/50', quiet: 'border-foreground/70' },
  background: { hairline: 'border-background/10', muted: 'border-background/30', recede: 'border-background/50', quiet: 'border-background/70' },
  primary:    { hairline: 'border-primary/10',    muted: 'border-primary/30',    recede: 'border-primary/50',    quiet: 'border-primary/70' },
  cyan:       { hairline: 'border-cyan/10',       muted: 'border-cyan/30',       recede: 'border-cyan/50',       quiet: 'border-cyan/70' },
  secondary:  { hairline: 'border-secondary/10',  muted: 'border-secondary/30',  recede: 'border-secondary/50',  quiet: 'border-secondary/70' },
  amber:      { hairline: 'border-amber/10',      muted: 'border-amber/30',      recede: 'border-amber/50',      quiet: 'border-amber/70' },
};

/** Shadow-color-kind lookup. */
const SHADOW_ALPHA: Record<ColorFamily, Record<AlphaRung, string>> = {
  fog:        { hairline: 'shadow-fog/10',        muted: 'shadow-fog/30',        recede: 'shadow-fog/50',        quiet: 'shadow-fog/70' },
  mist:       { hairline: 'shadow-mist/10',       muted: 'shadow-mist/30',       recede: 'shadow-mist/50',       quiet: 'shadow-mist/70' },
  rose:       { hairline: 'shadow-rose/10',       muted: 'shadow-rose/30',       recede: 'shadow-rose/50',       quiet: 'shadow-rose/70' },
  gold:       { hairline: 'shadow-gold/10',       muted: 'shadow-gold/30',       recede: 'shadow-gold/50',       quiet: 'shadow-gold/70' },
  accent:     { hairline: 'shadow-accent/10',     muted: 'shadow-accent/30',     recede: 'shadow-accent/50',     quiet: 'shadow-accent/70' },
  surface:    { hairline: 'shadow-surface/10',    muted: 'shadow-surface/30',    recede: 'shadow-surface/50',    quiet: 'shadow-surface/70' },
  foreground: { hairline: 'shadow-foreground/10', muted: 'shadow-foreground/30', recede: 'shadow-foreground/50', quiet: 'shadow-foreground/70' },
  background: { hairline: 'shadow-background/10', muted: 'shadow-background/30', recede: 'shadow-background/50', quiet: 'shadow-background/70' },
  primary:    { hairline: 'shadow-primary/10',    muted: 'shadow-primary/30',    recede: 'shadow-primary/50',    quiet: 'shadow-primary/70' },
  cyan:       { hairline: 'shadow-cyan/10',       muted: 'shadow-cyan/30',       recede: 'shadow-cyan/50',       quiet: 'shadow-cyan/70' },
  secondary:  { hairline: 'shadow-secondary/10',  muted: 'shadow-secondary/30',  recede: 'shadow-secondary/50',  quiet: 'shadow-secondary/70' },
  amber:      { hairline: 'shadow-amber/10',      muted: 'shadow-amber/30',      recede: 'shadow-amber/50',      quiet: 'shadow-amber/70' },
};

/** Map `ColorAlphaKind` → its lookup table. Pure, ≤ 10 LOC. */
function tableOf(kind: ColorAlphaKind): Record<ColorFamily, Record<AlphaRung, string>> {
  if (kind === 'text')   return TEXT_ALPHA;
  if (kind === 'border') return BORDER_ALPHA;
  if (kind === 'shadow') return SHADOW_ALPHA;
  return BG_ALPHA;
}

/**
 * Color-alpha class for a (color, rung, kind) tuple — e.g.
 * `alphaClassOf('fog', 'muted')` → `"bg-fog/30"`. The one legitimate way
 * to spell a translucent colored surface on this ledger. Pure, ≤ 10 LOC.
 *
 * JIT-SAFETY: returns a literal from a fixed table. Do not replace with a
 * template string — Tailwind's JIT will not see the class and your surface
 * loses its bg/border/text at runtime. Traps solved once here.
 */
export function alphaClassOf(
  color: ColorFamily,
  rung: AlphaRung,
  kind: ColorAlphaKind = 'bg',
): string {
  return tableOf(kind)[color][rung];
}
