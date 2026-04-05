/**
 * Evolution Engine — detects how a reader's archetype has changed over time.
 * Pure functions, no DB access. Takes current mirror + snapshot history.
 */

import type { ReaderMirror, MirrorSnapshot, MirrorEvolution, EvolutionShift } from '../../types/mirror';

export function detectEvolution(
  current: ReaderMirror,
  history: MirrorSnapshot[]
): MirrorEvolution {
  const prev = history.length > 1 ? history[1] : null; // [0] is current
  if (!prev) {
    return { previousArchetype: null, hasShifted: false, shifts: [], trajectory: 'stable' };
  }
  const hasShifted = prev.archetype !== current.archetype;
  const shifts = computeShifts(current.scores, prev.scores);
  return {
    previousArchetype: prev.archetype,
    hasShifted,
    shifts,
    trajectory: computeTrajectory(shifts),
  };
}

function computeShifts(
  curr: { depth: number; breadth: number; consistency: number },
  prev: { depth: number; breadth: number; consistency: number }
): EvolutionShift[] {
  return (['depth', 'breadth', 'consistency'] as const)
    .map(d => ({ dimension: d, delta: curr[d] - prev[d] }))
    .filter(s => Math.abs(s.delta) >= 5)
    .map(s => ({ ...s, direction: (s.delta > 0 ? 'up' : 'down') as 'up' | 'down' }));
}

function computeTrajectory(shifts: EvolutionShift[]): 'rising' | 'stable' | 'declining' {
  const up = shifts.filter(s => s.direction === 'up').length;
  const down = shifts.filter(s => s.direction === 'down').length;
  if (up > down) return 'rising';
  if (down > up) return 'declining';
  return 'stable';
}
