/**
 * useActionPhase tests — pure reducer + phase composition + source-pin.
 *
 * jsdom is not configured; we exercise the pure boundary (`actionReducer`,
 * `composeActionPhase`) directly and source-pin the timer wiring so a
 * future "simplification" cannot silently drop the safety net.
 *
 * What this suite locks down (one falsifiable claim per test):
 *
 *   1. Reducer transitions — OK→settled, FAIL→idle, IDLE→idle. The fail
 *      path is the fail-quiet covenant: caller's pulse(false) returns the
 *      slot straight to idle (toast carries the bad news — Krystle/Tanya).
 *   2. Phase composition — external busy wins; resolved bubbles when busy
 *      releases. The two-layer split (mechanical vs. semantic) lives here.
 *   3. Source-pin — timer uses ACTION_HOLD_MS, safety net uses
 *      ACTION_HOLD_BUDGET_MS, reduced-motion flag flows through.
 *
 * Credits: Mike K. (#18 napkin §5 — reducer transitions, settle timer +
 * safety-net pin), Tanya D. (#11 UX §5.6 — reduced-motion contract,
 * fail-quiet covenant), Elon M. (mechanical-vs-semantic split).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  actionReducer,
  composeActionPhase,
  useActionPhase,
} from '../useActionPhase';

// ─── 1 · Reducer transitions ─────────────────────────────────────────────

describe('actionReducer — pure transitions', () => {
  it('idle + OK → settled (witness lands)', () => {
    expect(actionReducer('idle', { type: 'OK' })).toBe('settled');
  });

  it('idle + FAIL → idle (fail-quiet recovery; toast carries)', () => {
    expect(actionReducer('idle', { type: 'FAIL' })).toBe('idle');
  });

  it('settled + IDLE → idle (auto-decay after the timer fires)', () => {
    expect(actionReducer('settled', { type: 'IDLE' })).toBe('idle');
  });

  it('settled + OK → settled (re-pressing a settled slot is idempotent)', () => {
    expect(actionReducer('settled', { type: 'OK' })).toBe('settled');
  });

  it('settled + FAIL → idle (a subsequent failure cancels the witness)', () => {
    expect(actionReducer('settled', { type: 'FAIL' })).toBe('idle');
  });

  it('idle + IDLE → idle (no-op when already at rest)', () => {
    expect(actionReducer('idle', { type: 'IDLE' })).toBe('idle');
  });
});

// ─── 2 · Phase composition (external busy wins) ──────────────────────────

describe('composeActionPhase — busy ⊕ resolved → ActionPhase', () => {
  it('busy=true always returns "busy" regardless of resolved layer', () => {
    expect(composeActionPhase(true, 'idle')).toBe('busy');
    expect(composeActionPhase(true, 'settled')).toBe('busy');
  });

  it('busy=false returns the resolved layer verbatim', () => {
    expect(composeActionPhase(false, 'idle')).toBe('idle');
    expect(composeActionPhase(false, 'settled')).toBe('settled');
  });
});

// ─── 3 · Module surface ──────────────────────────────────────────────────

describe('useActionPhase — module surface', () => {
  it('exports the hook as a function', () => {
    expect(typeof useActionPhase).toBe('function');
  });

  it('takes one optional argument (the external busy flag)', () => {
    // Function.length counts up to first defaulted parameter.
    expect(useActionPhase.length).toBe(0);
  });
});

// ─── 4 · Source-pin (the timer wiring stays honest) ──────────────────────

const SRC_PATH = join(__dirname, '..', 'useActionPhase.ts');
const SRC = readFileSync(SRC_PATH, 'utf8');

describe('useActionPhase · source-pin invariants', () => {
  it('imports ACTION_HOLD_MS + ACTION_HOLD_BUDGET_MS (no bare ms literal)', () => {
    expect(SRC).toMatch(/ACTION_HOLD_MS/);
    expect(SRC).toMatch(/ACTION_HOLD_BUDGET_MS/);
  });

  it('imports useReducedMotionFlag (reduced-motion is non-negotiable)', () => {
    expect(SRC).toMatch(/useReducedMotionFlag/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/utils\/reduced-motion['"]/);
  });

  it('uses setTimeout for the settle timer (not requestAnimationFrame)', () => {
    expect(SRC).toMatch(/setTimeout/);
  });

  it('clears the timer on unmount (no orphan timeouts)', () => {
    expect(SRC).toMatch(/clearTimeout/);
  });

  it('mounts BOTH a settle timer and a safety-net (force-resolve)', () => {
    // Both useEffects gate on `resolved !== 'settled'` and dispatch IDLE.
    const settleHits = SRC.match(/ACTION_HOLD_MS\b/g) ?? [];
    const budgetHits = SRC.match(/ACTION_HOLD_BUDGET_MS\b/g) ?? [];
    expect(settleHits.length).toBeGreaterThanOrEqual(1);
    expect(budgetHits.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT define a new motion duration literal (no Nms strings)', () => {
    // Motion belongs to the MOTION ledger; this hook composes only.
    expect(SRC).not.toMatch(/['"`]\d+ms['"`]/);
  });

  it('uses the "use client" directive (required for React hooks)', () => {
    expect(SRC).toMatch(/^['"]use client['"];/m);
  });
});
