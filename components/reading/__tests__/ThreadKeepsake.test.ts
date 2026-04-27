/**
 * ThreadKeepsake · source-pin invariants for the modal action layout.
 *
 * Pattern lifted from `KeepsakePlate.test.ts` — `.ts` (no DOM render),
 * source-pin via `readFileSync`. Falsifiable claim per test: one shape
 * decision, one regex.
 *
 * What this suite locks down (Tanya UX §4.1 — the Recognition Crescendo
 * spec applied to the keepsake modal):
 *
 *   1. Single-primary CTA — exactly one `Pressable` with `variant="solid"`
 *      lives in the actions block (the share button); ghost siblings
 *      (Copy / Save / Link) cluster as secondary.
 *   2. Verb discipline — the primary names "Share this thread"; the three
 *      secondaries name single verbs ("Copy", "Save", "Link") so the
 *      icon + label balance reads (logic-driven UI principle #14).
 *   3. Picture Superiority — every action carries an icon from the
 *      shared `<Icons.tsx>` set (Tanya UX §4.1 — never rely on color
 *      alone, principle #7).
 *   4. SHARED checkpoint — the primary share path emits
 *      `CHECKPOINTS.SHARED` so the reader-loop funnel honors Paul's
 *      Tier-1 outcome (a stranger sends the thread).
 *   5. No bare-millisecond literals — motion ledger is sealed; the modal
 *      animation lives in `<Threshold>`, not in this file.
 *   6. Routes touch through `<Pressable>` — pressable-adoption guard
 *      mirrored locally so a future refactor cannot drift without
 *      flipping this test on the very first run.
 *
 * Credits: Tanya D. (UX §4.1 — single-primary layout, verb balance,
 * icon-led secondaries), Mike K. (KeepsakePlate.test source-pin pattern,
 * adoption-fence mirror), Paul K. (the SHARED checkpoint requirement —
 * "the reader sends a thread without being asked"), Sid (this fence).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC_PATH = join(__dirname, '..', 'ThreadKeepsake.tsx');
const SRC = readFileSync(SRC_PATH, 'utf8');

// ─── Tiny helpers — surgical regex carve-outs over the source text ──────

/**
 * Slice the source body of `function PrimaryShare(...) { ... }`. Splitting
 * on the bare token "PrimaryShare" hits the JSX call site too — this
 * version anchors on the `function PrimaryShare\b` declaration so we always
 * land inside the component body, never on the call site that wraps it.
 */
function primaryShareBody(): string {
  const start = SRC.search(/function\s+PrimaryShare\b/);
  if (start < 0) return '';
  const tail = SRC.slice(start);
  const next = tail.slice(1).search(/\bfunction\s+\w+\b/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}

// ─── 1 · Single primary + 3 secondaries ──────────────────────────────────

describe('ThreadKeepsake · single-primary action layout (Tanya UX §4.1)', () => {
  it('exactly one solid Pressable lives in the modal (the Share primary)', () => {
    const matches = SRC.match(/variant="solid"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the secondary cluster routes through ActionPressable (settled witness)', () => {
    // One shared `<SecondaryAction>` wraps `<ActionPressable>`; three mounts
    // paint the cluster. The ghost-variant chrome is owned by ActionPressable
    // (single grep-able home for the affordance — Mike #18 §4).
    expect(SRC).toMatch(/from\s+['"]@\/components\/shared\/ActionPressable['"]/);
    expect(SRC).toMatch(/<ActionPressable\b/);
    const calls = SRC.match(/<SecondaryAction\b/g) ?? [];
    expect(calls.length).toBe(3);
  });

  it('primary Share IS wrapped in ActionPressable variant="solid" (Mike #26 / Tanya #81)', () => {
    // Pillar Two — primary buttons are not exempt. The gold CTA wears the
    // same fingertip witness as the secondary row: glyph swap, verb tense
    // flip, sr-only PhaseAnnouncement peer. The room stops talking over
    // the gesture (Tanya #81 §2 — z-stack collapses to one receipt layer).
    const body = primaryShareBody();
    expect(body).toMatch(/<ActionPressable\b/);
    expect(body).toMatch(/variant="solid"/);
    expect(body).toMatch(/size="md"/);
  });

  it('primary Share pins its bounding box via swapWidthClassOf(3) (Tanya UX #41 §3, Mike #39 §3)', () => {
    // The 12-character shrink "Share this thread" → "Shared" must be a
    // content swap, not a box reshape. The rung-3 floor (14rem) is
    // composed through the canonical `swapWidthClassOf(3)` helper — a
    // future contributor cannot shrink the floor without flipping this
    // test red on first run, AND cannot quietly re-introduce a bespoke
    // `min-w-[Xrem]` literal without tripping the host-bound fence in
    // `components/shared/__tests__/label-swap-width-fence.test.ts`.
    expect(primaryShareBody()).toMatch(/swapWidthClassOf\s*\(\s*3\s*\)/);
  });

  it('one icon Pressable exists for the close affordance', () => {
    expect(SRC).toMatch(/variant="icon"/);
  });
});

// ─── 2 · Verb discipline — primary speaks, secondaries echo ──────────────

describe('ThreadKeepsake · verb discipline (logic principle #14)', () => {
  it('primary CTA names "Share this thread" verbatim', () => {
    expect(SRC).toMatch(/Share this thread/);
  });

  it('secondary verbs are single words: Copy, Save, Link', () => {
    expect(SRC).toMatch(/idleLabel="Copy"/);
    expect(SRC).toMatch(/idleLabel="Save"/);
    expect(SRC).toMatch(/idleLabel="Link"/);
  });

  it('settled verbs are past-tense witnesses (Tanya §5.2 — verb table)', () => {
    // Width discipline: ±1 ch of the idle siblings.
    // Copy → Copied, Save → Saved, Link → Copied.
    expect(SRC).toMatch(/settledLabel="Copied"/);
    expect(SRC).toMatch(/settledLabel="Saved"/);
  });

  it('header copy collapses to one sentence (Tanya §4 brief)', () => {
    expect(SRC).toMatch(/A mirror of what you just read\./);
  });
});

// ─── 3 · Picture Superiority — every action carries an icon ──────────────

describe('ThreadKeepsake · icon-led actions (Tanya UX §4.1, principle #7)', () => {
  it('imports the shared icon set from `@/components/shared/Icons`', () => {
    expect(SRC).toMatch(/from\s+['"]@\/components\/shared\/Icons['"]/);
  });

  it('mounts ShareIcon, CopyIcon, DownloadIcon, LinkIcon, CloseIcon', () => {
    expect(SRC).toMatch(/<ShareIcon\b/);
    expect(SRC).toMatch(/<CopyIcon\b/);
    expect(SRC).toMatch(/<DownloadIcon\b/);
    expect(SRC).toMatch(/<LinkIcon\b/);
    expect(SRC).toMatch(/<CloseIcon\b/);
  });
});

// ─── 4 · SHARED checkpoint — Paul's Tier-1 outcome ───────────────────────

describe('ThreadKeepsake · SHARED checkpoint (Paul §Tier-1)', () => {
  it('emits CHECKPOINTS.SHARED on every successful share path', () => {
    // Three honest share paths beyond clipboard-utils' built-in emit:
    //   1. copyPngToClipboard success  (Copy image)
    //   2. downloadPng                  (Save PNG)
    //   3. navigator.share success      (Share primary)
    const emits = SRC.match(/emitCheckpoint\(\s*CHECKPOINTS\.SHARED\s*\)/g) ?? [];
    expect(emits.length).toBeGreaterThanOrEqual(3);
  });

  it('still emits CHECKPOINTS.KEEPSAKED on first modal open', () => {
    expect(SRC).toMatch(/CHECKPOINTS\.KEEPSAKED/);
  });
});

// ─── 5 · Quiet-on-success contract (Mike #21 / Tanya #10 — Quiet Keepsake) ─

/**
 * Carve out the body of an `async function <name>(...)` declaration up to
 * the next `async function` (or end-of-file). Keeps the regex per-test
 * focused on the *function body* and not stray identifier references that
 * appear in `useCallback(...)` parameter lists.
 */
function bodyOf(name: string): string {
  const start = SRC.search(new RegExp(`async\\s+function\\s+${name}\\b`));
  if (start < 0) return '';
  const tail = SRC.slice(start);
  const next = tail.slice(1).search(/\basync\s+function\b/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}

describe('ThreadKeepsake · quiet-on-success contract (Mike #21 / Tanya #10)', () => {
  it("runCopyImage no longer emits a redundant toast on success — pulse alone is the receipt", () => {
    // Source-pin: the showCopyFeedback literal in runCopyImage (the
    // "Keepsake copied." / "Copy unsupported — try Save." line) is gone.
    // Same fingertip witness now governs success AND failure: the
    // ActionPressable.pulse(ok) glow + sr-only <PhaseAnnouncement>.
    expect(SRC).not.toMatch(/showCopyFeedback\s*\(/);
    expect(SRC).not.toMatch(/import\s*\{[^}]*showCopyFeedback[^}]*\}/);
  });

  it("runCopyLink uses the options-bag shape (default-quiet on success)", () => {
    // copyWithFeedback({ successMessage: ... }) — no positional args,
    // no announce: 'room'. Quiet-on-success is the default; failure
    // still escalates via the helper's failure path (warn intent toast).
    const linkBody = bodyOf('runCopyLink');
    expect(linkBody).toMatch(/copyWithFeedback\s*\(\s*deepLink\s*,\s*\{/);
    expect(linkBody).toMatch(/successMessage\s*:\s*['"]Link copied/);
    // The Link verb has a fingertip — must NOT opt into the room voice.
    expect(linkBody).not.toMatch(/announce\s*:\s*['"]room['"]/);
  });

  it("runShareFailover is the lone legitimate announce: 'room' site", () => {
    // The `navigator.share`-missing branch has NO fingertip witness to
    // speak from (the primary never enters busy/settled in that branch),
    // so the room voice is the only available organ — explicit opt-in.
    const failover = bodyOf('runShareFailover');
    expect(failover).toMatch(/announce\s*:\s*['"]room['"]/);
    // No OTHER function body in the file opts into the room voice.
    expect(bodyOf('runCopyImage')).not.toMatch(/announce\s*:\s*['"]room['"]/);
    expect(bodyOf('runDownload')).not.toMatch(/announce\s*:\s*['"]room['"]/);
    expect(bodyOf('runCopyLink')).not.toMatch(/announce\s*:\s*['"]room['"]/);
    expect(bodyOf('runNativeShare')).not.toMatch(/announce\s*:\s*['"]room['"]/);
    expect(bodyOf('runShare')).not.toMatch(/announce\s*:\s*['"]room['"]/);
  });

  it("runShare pulses on native success and stays silent on cancel (Tanya #81 §3)", () => {
    // Success branch must call pulse(true) — the fingertip glow + sr-only
    // peer is the entire receipt (no toast). The catch branch must NOT
    // pulse — a cancelled share is neither success nor failure; silence
    // is the correct witness (Mike #26 §7.1).
    const share = bodyOf('runShare');
    expect(share).toMatch(/pulse\s*\(\s*true\s*\)/);
    // Cancel branch is silent — comment marks it, and no pulse(false) is
    // emitted from the catch arm (the secondary verbs use pulse(false) as
    // their failure decay; share's catch is a user-cancel, not a failure).
    expect(share).toMatch(/cancelled/);
    const catchArm = share.match(/catch\s*\{[^}]*\}/);
    expect(catchArm?.[0] ?? '').not.toMatch(/pulse\s*\(/);
  });

  it("clipboard-utils import is shrunk to copyWithFeedback only", () => {
    // After the default-flip the keepsake no longer imports
    // showCopyFeedback — the symbol is dead from this surface.
    expect(SRC).toMatch(/import\s*\{\s*copyWithFeedback\s*\}\s*from\s*['"]@\/lib\/sharing\/clipboard-utils['"]/);
  });
});

// ─── 6 · Source-pin invariants — adoption fences mirrored locally ────────

describe('ThreadKeepsake · adoption fences mirrored locally', () => {
  it('does NOT import `framer-motion` (motion ledger sealed)', () => {
    expect(SRC).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('does NOT define a new motion duration literal (no Nms strings)', () => {
    // Motion belongs to MOTION/CEREMONY ledgers + Threshold's phase machine.
    expect(SRC).not.toMatch(/['"`]\d+ms['"`]/);
  });

  it('routes touch through `<Pressable>` (no raw <button> in source)', () => {
    expect(SRC).toMatch(/<Pressable\b/);
    expect(SRC).not.toMatch(/<button\b/);
  });

  it('mounts via `<Threshold>` (modal mechanics owned by the primitive)', () => {
    expect(SRC).toMatch(/<Threshold\b/);
  });

  it('preview SVG comes from `buildThreadSVG` (preview === unfurl)', () => {
    expect(SRC).toMatch(/buildThreadSVG/);
  });
});
