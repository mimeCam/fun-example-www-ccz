/**
 * QuoteKeepsake · source-pin invariants for the second-host action layout.
 *
 * Pattern lifted from `ThreadKeepsake.test.ts` (which lifted it from
 * `KeepsakePlate.test.ts`): `.ts` (no DOM render), source-pin via
 * `readFileSync`. One falsifiable claim per test, one regex.
 *
 * Why a parallel suite (Mike #81 §1, Tanya #75 §4.2): host #1
 * (ThreadKeepsake) and host #2 (QuoteKeepsake) speak the same dialect.
 * Two suites locking the same shape make drift impossible — the next
 * contributor cannot quietly re-introduce a success toast on either host
 * without flipping a test red on first run.
 *
 * What this suite locks down:
 *
 *   1. Single-primary CTA — exactly one solid `<ActionPressable>` (the
 *      Share button); ghost siblings (Copy / Save / Link) cluster as
 *      secondary. Mirrors ThreadKeepsake §1.
 *   2. Verb discipline — primary names "Share this card"; secondaries
 *      name single verbs ("Copy", "Save", "Link"). Width pinned via
 *      `min-w-[14rem]` on the primary (Tanya §6).
 *   3. Picture Superiority — every action carries an icon from the
 *      shared `<Icons.tsx>` set (Tanya UX §4.1, principle #7).
 *   4. SHARED checkpoint — the three honest share paths
 *      (copy / download / native-share) emit `CHECKPOINTS.SHARED`.
 *   5. Quiet-on-success contract — no `toastShow` import, no
 *      `intent: 'confirm'` literal, no `showExportFeedback`.
 *      The fingertip is the receipt; failure escalates via
 *      `showExportError` (warn) only.
 *   6. Adoption fences mirrored locally — no framer-motion, no bare
 *      Nms literals, no raw `<button>`, mounts via `<Threshold>`.
 *
 * Credits: Tanya D. (#75 §4.2 — host #2 layout spec, byte-for-byte
 * inheritance from ThreadKeepsake), Mike K. (#81 §1 — N=2 native
 * speakers, the two-suite shape), Sid (this fence).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC_PATH = join(__dirname, '..', 'QuoteKeepsake.tsx');
const SRC = readFileSync(SRC_PATH, 'utf8');

// ─── Tiny helpers — surgical regex carve-outs over the source text ──────

/** Slice the body of `function PrimaryShare(...)` (declaration, not call). */
function primaryShareBody(): string {
  const start = SRC.search(/function\s+PrimaryShare\b/);
  if (start < 0) return '';
  const tail = SRC.slice(start);
  const next = tail.slice(1).search(/\bfunction\s+\w+\b/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}

/** Slice an `async function <name>(...)` body up to the next `async function`. */
function bodyOf(name: string): string {
  const start = SRC.search(new RegExp(`async\\s+function\\s+${name}\\b`));
  if (start < 0) return '';
  const tail = SRC.slice(start);
  const next = tail.slice(1).search(/\basync\s+function\b/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}

// ─── 1 · Single primary + 3 secondaries ──────────────────────────────────

describe('QuoteKeepsake · single-primary action layout (Tanya §75 §4.2)', () => {
  it('exactly one solid Pressable lives in the modal (the Share primary)', () => {
    const matches = SRC.match(/variant="solid"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the secondary cluster routes through ActionPressable (settled witness)', () => {
    expect(SRC).toMatch(/from\s+['"]@\/components\/shared\/ActionPressable['"]/);
    expect(SRC).toMatch(/<ActionPressable\b/);
    const calls = SRC.match(/<SecondaryAction\b/g) ?? [];
    expect(calls.length).toBe(3);
  });

  it('primary Share IS wrapped in ActionPressable variant="solid" (Mike #26 / Tanya #81)', () => {
    const body = primaryShareBody();
    expect(body).toMatch(/<ActionPressable\b/);
    expect(body).toMatch(/variant="solid"/);
    expect(body).toMatch(/size="md"/);
  });

  it('primary Share pins its bounding box via min-w-[14rem] (Tanya #81 §4)', () => {
    expect(primaryShareBody()).toMatch(/min-w-\[14rem\]/);
  });

  it('one icon Pressable exists for the close affordance', () => {
    expect(SRC).toMatch(/variant="icon"/);
  });
});

// ─── 2 · Verb discipline — primary speaks, secondaries echo ──────────────

describe('QuoteKeepsake · verb discipline (logic principle #14)', () => {
  it('primary CTA names "Share this card" verbatim', () => {
    expect(SRC).toMatch(/Share this card/);
  });

  it('secondary verbs are single words: Copy, Save, Link', () => {
    expect(SRC).toMatch(/idleLabel="Copy"/);
    expect(SRC).toMatch(/idleLabel="Save"/);
    expect(SRC).toMatch(/idleLabel="Link"/);
  });

  it('settled verbs are past-tense witnesses (Tanya §5.2 — verb table)', () => {
    expect(SRC).toMatch(/settledLabel="Copied"/);
    expect(SRC).toMatch(/settledLabel="Saved"/);
  });

  it('header copy collapses to one sentence (Tanya §75 §1)', () => {
    expect(SRC).toMatch(/A line worth carrying\./);
  });
});

// ─── 3 · Picture Superiority — every action carries an icon ──────────────

describe('QuoteKeepsake · icon-led actions (Tanya UX §4.1, principle #7)', () => {
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

describe('QuoteKeepsake · SHARED checkpoint (Paul §Tier-1)', () => {
  it('emits CHECKPOINTS.SHARED on every successful share path', () => {
    // Three honest share paths:
    //   1. copyQuoteCardToClipboard success  (Copy image)
    //   2. downloadQuoteCard success         (Save PNG)
    //   3. navigator.share success           (Share primary)
    // Plus copyWithFeedback's internal SHARED emit on the Link verb.
    const emits = SRC.match(/emitCheckpoint\(\s*CHECKPOINTS\.SHARED\s*\)/g) ?? [];
    expect(emits.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── 5 · Quiet-on-success contract (Mike #81 / Tanya #75 — Quote Keepsake) ─

describe('QuoteKeepsake · quiet-on-success contract (Mike #81 / Tanya #75 §4)', () => {
  it("does NOT import the retired showExportFeedback helper", () => {
    expect(SRC).not.toMatch(/\bshowExportFeedback\b/);
  });

  it("does NOT speak the success voice via toastShow / confirm intent", () => {
    // The room is silent on success. Failure escalates via showExportError
    // (warn) and copyWithFeedback's default failure path. Both are honest.
    expect(SRC).not.toMatch(/\btoastShow\s*\(/);
    expect(SRC).not.toMatch(/intent:\s*['"]confirm['"]/);
  });

  it("imports showExportError for the failure path (asymmetry holds)", () => {
    // Failure must escalate one level — the reader needs to know when the
    // contract breaks (Tanya §75 §4.1, Mike #81 §8.3). showExportError is
    // the only legitimate room-voice site on this surface aside from
    // copyWithFeedback's built-in default warn.
    expect(SRC).toMatch(/\bshowExportError\b/);
  });

  it("runCopyImage's success branch pulses(true) and emits SHARED, no toast", () => {
    const body = bodyOf('runCopyImage');
    expect(body).toMatch(/pulse\s*\(\s*ok\s*\)/);
    expect(body).toMatch(/CHECKPOINTS\.SHARED/);
    expect(body).not.toMatch(/intent:\s*['"]confirm['"]/);
  });

  it("runShareFailover is the lone legitimate announce: 'room' site", () => {
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
    const share = bodyOf('runShare');
    expect(share).toMatch(/pulse\s*\(\s*true\s*\)/);
    expect(share).toMatch(/cancelled/);
    const catchArm = share.match(/catch\s*\{[^}]*\}/);
    expect(catchArm?.[0] ?? '').not.toMatch(/pulse\s*\(/);
  });
});

// ─── 6 · Adoption fences mirrored locally ────────────────────────────────

describe('QuoteKeepsake · adoption fences mirrored locally', () => {
  it('does NOT import `framer-motion` (motion ledger sealed)', () => {
    expect(SRC).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('does NOT define a new motion duration literal (no Nms strings)', () => {
    expect(SRC).not.toMatch(/['"`]\d+ms['"`]/);
  });

  it('routes touch through `<Pressable>` (no raw <button> in source)', () => {
    expect(SRC).toMatch(/<Pressable\b/);
    expect(SRC).not.toMatch(/<button\b/);
  });

  it('mounts via `<Threshold>` (modal mechanics owned by the primitive)', () => {
    expect(SRC).toMatch(/<Threshold\b/);
  });

  it('renders the preview from the lib-generated dataUrl (preview === artifact)', () => {
    expect(SRC).toMatch(/generateQuoteCard/);
  });
});
