/**
 * ScrollDepthProvider — single IntersectionObserver for the whole page.
 *
 * BEFORE: each consumer created its own observer → race conditions.
 * AFTER:  one provider, one observer, one truth source via React Context.
 *
 * Consumers call useScrollDepth() to read depth from context.
 * Place <ScrollDepthProvider> around components that need scroll data.
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

// ─── Public Types ─────────────────────────────────────────────────

interface ScrollDepthState {
  depth: number;       // 0–100 current scroll percentage
  isReading: boolean;  // depth ≥ threshold
  isFinished: boolean; // depth ≥ 98
  maxDepth: number;    // peak depth reached in this session
}

// ─── Context ──────────────────────────────────────────────────────

const DEFAULTS: ScrollDepthState = {
  depth: 0, isReading: false, isFinished: false, maxDepth: 0,
};

const Ctx = createContext<ScrollDepthState>(DEFAULTS);

/** Read scroll depth from the nearest ScrollDepthProvider. */
export function useScrollDepth(): ScrollDepthState {
  return useContext(Ctx);
}

// ─── Internals ────────────────────────────────────────────────────

const NUM_CHECKPOINTS = 20;
const READING_THRESHOLD = 5;

function placeCheckpoints(spacing: number): Map<Element, number> {
  const map = new Map<Element, number>();
  for (let i = 0; i <= NUM_CHECKPOINTS; i++) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;width:1px;height:1px;pointer-events:none;';
    el.style.top = `${i * spacing}px`;
    el.dataset.idx = String(i);
    document.body.appendChild(el);
    map.set(el, i);
  }
  return map;
}

function removeCheckpoints(map: Map<Element, number>): void {
  map.forEach((_, el) => el.remove());
  map.clear();
}

// ─── Provider ─────────────────────────────────────────────────────

export function ScrollDepthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScrollDepthState>(DEFAULTS);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;

    if (scrollable <= 0) {
      setState({ depth: 100, isReading: true, isFinished: true, maxDepth: 100 });
      return;
    }

    const spacing = scrollable / NUM_CHECKPOINTS;
    const checkpoints = placeCheckpoints(spacing);

    const observer = new IntersectionObserver(
      (entries) => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
          let highest = 0;
          for (const e of entries) {
            if (e.isIntersecting) {
              const idx = parseInt((e.target as HTMLElement).dataset.idx || '0', 10);
              highest = Math.max(highest, idx);
            }
          }
          if (highest > 0) {
            const d = (highest / NUM_CHECKPOINTS) * 100;
            setState((prev) => ({
              depth: d,
              isReading: d >= READING_THRESHOLD,
              isFinished: d >= 98,
              maxDepth: Math.max(prev.maxDepth, d),
            }));
          }
          rafRef.current = null;
        });
      },
      { root: null, rootMargin: '0px', threshold: [0, 0.5, 1] },
    );

    checkpoints.forEach((_, el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      removeCheckpoints(checkpoints);
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
