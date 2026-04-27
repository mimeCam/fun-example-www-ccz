/**
 * /admin/funnel — token-gated archetype-lift readout. Server-only, no JS.
 *
 * The cheapest possible mirror that lets us see whether the killer feature
 * (archetype-tuned copy on the same URL) is actually killer. One row per
 * archetype arm, four checkpoint rates, Wilson 95% CI flag, lift vs.
 * `'control'`.
 *
 * Discipline (Mike napkin §6.5):
 *  - **Server-only** — no `'use client'`, no React state, no fetch from
 *    the browser. The token never leaves the server.
 *  - **Token gate** — header `x-loop-funnel-token` OR `?token=` query
 *    param against `LOOP_FUNNEL_TOKEN`. Empty env ⇒ disabled (404-look).
 *  - **Reuse, don't fork** — every type face goes through the Typography
 *    ledger via `CaptionMetric` and `typo-*` classes; alpha goes through
 *    the Alpha ledger; this admin page is not an orphan.
 *  - **No design polish** — this is internal observability. No thermal
 *    tokens, no Golden Thread, no Mirror nudge. Plain table, monospace
 *    rates, big enough to read on a phone in a coffee shop at 7 a.m.
 *
 * Credits: Mike K. (napkin §4 file-5 + §6.5 — server-only, token gate,
 * reuse design ledgers, ~140 LOC budget), Paul K. (the four-checkpoint
 * funnel and the share-rate-as-only-KPI discipline this page exposes),
 * Elon M. (§3 + §7 — instrument first, polish later; this page is the
 * instrument), Tanya D. (the gentle reminder that the meter is invisible
 * to the reader — keeping the admin page off any reader nav surface).
 */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CaptionMetric } from '@/components/shared/CaptionMetric';
import { CHECKPOINT_NAMES } from '@/lib/engagement/loop-checkpoints';
import {
  getWeeklyFunnelByArchetype,
  totalsByArchetype,
  type FunnelByArchetypeRow,
} from '@/lib/engagement/funnel-by-archetype';
import {
  computeRates,
  computeLift,
  formatPercent,
  formatPp,
  type CheckpointLift,
  type CheckpointRates,
} from '@/lib/engagement/funnel-lift';
import { CONTROL_BUCKET } from '@/lib/engagement/archetype-bucket';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Funnel · Admin', robots: 'noindex,nofollow' };

const TOKEN_HEADER = 'x-loop-funnel-token';
const TOKEN_QUERY = 'token';
const DEFAULT_DAYS = 28;

interface PageSearch { token?: string; days?: string }

/** Verify the caller against `LOOP_FUNNEL_TOKEN` — empty env disables. */
function isAuthorized(search: PageSearch): boolean {
  const expected = process.env.LOOP_FUNNEL_TOKEN;
  if (!expected) return false;
  const headerToken = headers().get(TOKEN_HEADER);
  const provided = headerToken ?? search.token ?? '';
  return !!provided && provided === expected;
}

/** Clamp the `days` query param, default 28, max 365. Pure. */
function parseDays(raw?: string): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_DAYS;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DAYS;
  return Math.min(n, 365);
}

export default function AdminFunnelPage(
  { searchParams }: { searchParams: PageSearch },
): JSX.Element {
  if (!isAuthorized(searchParams)) notFound();
  const days = parseDays(searchParams.days);
  const rows = totalsByArchetype(getWeeklyFunnelByArchetype(days));
  const armRows = Array.from(rows.values());
  return (
    <main className="min-h-screen bg-background px-sys-4 py-sys-9 max-w-5xl mx-auto">
      <Header days={days} totalArms={armRows.length} />
      <LiftTable arms={armRows} />
    </main>
  );
}

// ─── Sub-components — each ≤ 10 LOC ───────────────────────────────────────

/** Page header — title + observation window caption. */
function Header({ days, totalArms }: { days: number; totalArms: number }): JSX.Element {
  return (
    <header className="mb-sys-9">
      <h1 className="font-display typo-heading text-mist text-sys-h2">Archetype Lift</h1>
      <CaptionMetric size="caption" className="mt-sys-2">
        last {days} days · {totalArms} arm{totalArms === 1 ? '' : 's'}
      </CaptionMetric>
    </header>
  );
}

/** The lift table — one row per arm, one column per checkpoint. */
function LiftTable({ arms }: { arms: ReadonlyArray<FunnelByArchetypeRow> }): JSX.Element {
  if (arms.length === 0) return <EmptyState />;
  const control = arms.find((r) => r.archetype === CONTROL_BUCKET);
  const controlRates = control ? computeRates(control) : zeroRates();
  return (
    <table className="w-full typo-body text-mist border-collapse">
      <TableHead />
      <tbody>
        {arms.map((arm) => (
          <ArmRow key={arm.archetype} arm={arm} controlRates={controlRates} />
        ))}
      </tbody>
    </table>
  );
}

/** Header row — one cell per checkpoint, plus arm label + sample size. */
function TableHead(): JSX.Element {
  return (
    <thead>
      <tr className="text-left">
        <th className="py-sys-2 pr-sys-4 typo-caption">arm</th>
        <th className="py-sys-2 pr-sys-4 typo-caption tabular-nums">n</th>
        {CHECKPOINT_NAMES.map((c) => (
          <th key={c} className="py-sys-2 pr-sys-4 typo-caption">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

/** Render one arm's row. Control arm gets a marker; treatment shows lift. */
function ArmRow({ arm, controlRates }: { arm: FunnelByArchetypeRow; controlRates: CheckpointRates }): JSX.Element {
  const lifts = computeLift(arm, controlRates);
  const isControl = arm.archetype === CONTROL_BUCKET;
  return (
    <tr className="border-t border-mist/10">
      <td className="py-sys-3 pr-sys-4 typo-body">
        {arm.archetype}{isControl ? ' (baseline)' : ''}
      </td>
      <td className="py-sys-3 pr-sys-4 tabular-nums">{arm.landed}</td>
      {CHECKPOINT_NAMES.map((c) => (
        <RateCell key={c} lift={lifts[c]} isControl={isControl} />
      ))}
    </tr>
  );
}

/** One rate cell — rate, lift pp, signal/noise verdict. ≤ 10 LOC. */
function RateCell({ lift, isControl }: { lift: CheckpointLift; isControl: boolean }): JSX.Element {
  return (
    <td className="py-sys-3 pr-sys-4 tabular-nums align-top">
      <div className="text-mist">{formatPercent(lift.rate)}</div>
      {!isControl && lift.ci.n > 0 ? <LiftLine lift={lift} /> : null}
    </td>
  );
}

/** "+3.4 pp · signal" / "−1.2 pp · noise". Pure visual, no thermal warm. */
function LiftLine({ lift }: { lift: CheckpointLift }): JSX.Element {
  return (
    <CaptionMetric size="micro" className="mt-sys-1">
      {formatPp(lift.absolute)} · {lift.verdict}
    </CaptionMetric>
  );
}

/** Empty-state — no rows yet. Reuses the typography + alpha ledger. */
function EmptyState(): JSX.Element {
  return (
    <p className="typo-body text-mist/70">
      No funnel rows yet for this window. Check back after a few sessions land.
    </p>
  );
}

/** Zero-baseline rates for the no-control case (rare; returns 0% baseline). */
function zeroRates(): CheckpointRates {
  return { resolved: 0, warmed: 0, keepsaked: 0, shared: 0 };
}
