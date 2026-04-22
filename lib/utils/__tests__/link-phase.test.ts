/**
 * link-phase tests — lock the numeric invariants, the route→accent map,
 * the phase × variant style resolvers, and the contrast matrix.
 *
 * Mirrors press-phase.test.ts and field-phase.test.ts. Pure, no DOM.
 * Contrast gate is non-negotiable (Paul P0 #3, Tanya §3.3): both
 * endpoints of the `passage` crossfade must read against the warm
 * surface at ≥ 4.5:1. Dormant stop documents today's palette floor,
 * consistent with the `<Pressable>` / `<Field>` contrast tests.
 *
 * Credits: Mike K. (§6.4 — bake contrast into the test matrix from
 * commit 1), Tanya D. (§3.3 acceptance), Paul K. (non-negotiable gate).
 */

import {
  LINK_HOVER_MS,
  LINK_REDUCED_MS,
  LINK_UNDERLINE_REST_PX,
  LINK_UNDERLINE_HOVER_PX,
  LINK_OFFSET_REST_PX,
  LINK_OFFSET_HOVER_PX,
  linkInvariantHolds,
  isExternalHref,
  resolveRoomForPath,
  accentVarForRoom,
  resolveDestinationAccent,
  resolveLinkColor,
  resolveLinkOpacity,
  resolveLinkThickness,
  resolveLinkOffset,
  resolveLinkStyle,
  composeLinkClass,
  LINK_BASE,
} from '../link-phase';
import { computeThermalTokens } from '@/lib/thermal/thermal-tokens';

// ─── Invariant ─────────────────────────────────────────────────────────────

describe('link invariant', () => {
  it('hover duration is positive and strictly greater than reduced dwell', () => {
    expect(LINK_HOVER_MS).toBeGreaterThan(0);
    expect(LINK_REDUCED_MS).toBeLessThan(LINK_HOVER_MS);
  });

  it('underline thickness grows rest → hover (the visible affordance)', () => {
    expect(LINK_UNDERLINE_REST_PX).toBeLessThan(LINK_UNDERLINE_HOVER_PX);
  });

  it('offset blooms rest → hover (the 1-px spatial gesture)', () => {
    expect(LINK_OFFSET_REST_PX).toBeLessThan(LINK_OFFSET_HOVER_PX);
  });

  it('linkInvariantHolds() returns true', () => {
    expect(linkInvariantHolds()).toBe(true);
  });
});

// ─── External detection ───────────────────────────────────────────────────

describe('isExternalHref — protocol / protocol-relative', () => {
  it.each(['https://example.com', 'http://x', 'mailto:a@b', 'tel:+1', '//cdn.x.com'])(
    'detects %s as external', (h) => {
      expect(isExternalHref(h)).toBe(true);
    },
  );

  it.each(['/', '/mirror', '/article/abc', '#hash', '?q=1', ''])(
    'treats %s as internal', (h) => {
      expect(isExternalHref(h)).toBe(false);
    },
  );
});

// ─── Route → room lookup ──────────────────────────────────────────────────

describe('resolveRoomForPath — the route → accent table', () => {
  it('/mirror resolves to gold', () => {
    expect(resolveRoomForPath('/mirror')).toBe('gold');
  });

  it('/mirror/subpath inherits gold', () => {
    expect(resolveRoomForPath('/mirror/preview')).toBe('gold');
  });

  it('/resonances resolves to rose', () => {
    expect(resolveRoomForPath('/resonances')).toBe('rose');
  });

  it('unknown paths fall back to current accent', () => {
    expect(resolveRoomForPath('/articles')).toBe('current');
    expect(resolveRoomForPath('/article/123')).toBe('current');
    expect(resolveRoomForPath('/')).toBe('current');
  });

  it('query + hash are stripped before the lookup', () => {
    expect(resolveRoomForPath('/mirror?foo=1')).toBe('gold');
    expect(resolveRoomForPath('/resonances#section')).toBe('rose');
  });
});

describe('accentVarForRoom — token mapping', () => {
  it('gold → --gold, rose → --rose, current → --token-accent', () => {
    expect(accentVarForRoom('gold')).toBe('var(--gold)');
    expect(accentVarForRoom('rose')).toBe('var(--rose)');
    expect(accentVarForRoom('current')).toBe('var(--token-accent)');
  });
});

describe('resolveDestinationAccent — the one bit of magic', () => {
  it('/mirror → gold token', () => {
    expect(resolveDestinationAccent('/mirror')).toBe('var(--gold)');
  });

  it('/resonances → rose token', () => {
    expect(resolveDestinationAccent('/resonances')).toBe('var(--rose)');
  });

  it('external links never cross rooms — hold current accent', () => {
    expect(resolveDestinationAccent('https://x.com')).toBe('var(--token-accent)');
    expect(resolveDestinationAccent('mailto:a@b')).toBe('var(--token-accent)');
  });
});

// ─── Per-property resolvers ───────────────────────────────────────────────

describe('resolveLinkColor — phase × variant → colour', () => {
  it('inline rest reads current accent', () => {
    expect(resolveLinkColor('idle', 'inline', 'var(--gold)')).toBe('var(--token-accent)');
  });

  it('inline hover still reads current accent (not destination)', () => {
    expect(resolveLinkColor('hover', 'inline', 'var(--gold)')).toBe('var(--token-accent)');
  });

  it('passage hover swaps to destination accent — THE core gesture', () => {
    expect(resolveLinkColor('hover', 'passage', 'var(--gold)')).toBe('var(--gold)');
    expect(resolveLinkColor('focus', 'passage', 'var(--rose)')).toBe('var(--rose)');
  });

  it('passage rest stays current-room accent (pre-hover)', () => {
    expect(resolveLinkColor('idle', 'passage', 'var(--gold)')).toBe('var(--token-accent)');
  });

  it('quiet ignores destAccent, always mist', () => {
    expect(resolveLinkColor('idle', 'quiet', 'var(--gold)')).toBe('var(--mist)');
    expect(resolveLinkColor('hover', 'quiet', 'var(--gold)')).toBe('var(--mist)');
  });
});

describe('resolveLinkOpacity — thermal intensification', () => {
  it('inline/passage rest rides --token-accent-opacity CSS var', () => {
    expect(resolveLinkOpacity('idle', 'inline')).toContain('--token-accent-opacity');
    expect(resolveLinkOpacity('idle', 'passage')).toContain('--token-accent-opacity');
  });

  it('hover lifts to full opacity', () => {
    expect(resolveLinkOpacity('hover', 'inline')).toBe(1);
    expect(resolveLinkOpacity('focus', 'passage')).toBe(1);
  });

  it('quiet rest floors at 60% (the attribution whisper)', () => {
    expect(resolveLinkOpacity('idle', 'quiet')).toBe(0.6);
    expect(resolveLinkOpacity('hover', 'quiet')).toBe(1);
  });
});

describe('resolveLinkThickness — underline is load-bearing', () => {
  it('inline/passage rest is 1 px, hover 2 px', () => {
    expect(resolveLinkThickness('idle', 'inline')).toBe(1);
    expect(resolveLinkThickness('hover', 'inline')).toBe(2);
    expect(resolveLinkThickness('hover', 'passage')).toBe(2);
  });

  it('quiet rest is 0 (no underline), hover 1 px (appears)', () => {
    expect(resolveLinkThickness('idle', 'quiet')).toBe(0);
    expect(resolveLinkThickness('hover', 'quiet')).toBe(1);
  });
});

describe('resolveLinkOffset — bloom on inline/passage only', () => {
  it('inline/passage bloom 3 → 4 px', () => {
    expect(resolveLinkOffset('idle', 'inline')).toBe(3);
    expect(resolveLinkOffset('hover', 'inline')).toBe(4);
    expect(resolveLinkOffset('focus', 'passage')).toBe(4);
  });

  it('quiet holds 3 px at all phases — no spatial bloom', () => {
    expect(resolveLinkOffset('idle', 'quiet')).toBe(3);
    expect(resolveLinkOffset('hover', 'quiet')).toBe(3);
  });
});

// ─── Style composer ──────────────────────────────────────────────────────

describe('resolveLinkStyle — phase × variant × reduced', () => {
  it('idle is fully populated (carries thermal opacity)', () => {
    const s = resolveLinkStyle('idle', 'inline', false, 'var(--gold)');
    expect(s.color).toBe('var(--token-accent)');
    expect(s.textDecorationLine).toBe('underline');
    expect(s.transitionDuration).toBe(`${LINK_HOVER_MS}ms`);
  });

  it('reduced motion collapses duration; colour still lands', () => {
    const s = resolveLinkStyle('hover', 'passage', true, 'var(--gold)');
    expect(s.color).toBe('var(--gold)');
    expect(s.transitionDuration).toBe(`${LINK_REDUCED_MS}ms`);
  });

  it('quiet idle emits text-decoration: none (no underline at rest)', () => {
    const s = resolveLinkStyle('idle', 'quiet', false, 'var(--token-accent)');
    expect(s.textDecorationLine).toBe('none');
  });

  it('easing reads the shared sys-ease-out (not a bespoke curve)', () => {
    const s = resolveLinkStyle('hover', 'inline', false, 'var(--token-accent)');
    expect(s.transitionTimingFunction).toBe('var(--sys-ease-out)');
  });

  it('text-decoration-color chains to currentColor so underline follows text', () => {
    const s = resolveLinkStyle('hover', 'passage', false, 'var(--rose)');
    expect(s.textDecorationColor).toBe('currentColor');
  });
});

// ─── Class composer ──────────────────────────────────────────────────────

describe('composeLinkClass — deterministic ordering', () => {
  it('base is always first', () => {
    const out = composeLinkClass({ variant: 'inline', isExternal: false, extra: 'ml-2' });
    expect(out.startsWith(LINK_BASE.split(' ')[0])).toBe(true);
    expect(out.endsWith('ml-2')).toBe(true);
  });

  it('external variant gets the nowrap add-on', () => {
    const out = composeLinkClass({ variant: 'inline', isExternal: true });
    expect(out).toContain('whitespace-nowrap');
  });

  it('non-external does NOT get nowrap', () => {
    const out = composeLinkClass({ variant: 'inline', isExternal: false });
    expect(out).not.toContain('whitespace-nowrap');
  });
});

// ─── Contrast gate — Paul's non-negotiable ───────────────────────────────

const WCAG_AA_BODY = 4.5;
const PASSAGE_DORMANT_FLOOR = 3.0;   // palette constraint; documented
const ROOM_ACCENT_HEX: Record<'gold' | 'rose', string> = {
  gold: '#f0c674',
  rose: '#e88fa7',
};

function srgbChannel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

const SCORES = [0, 50, 100] as const;

describe('passage destination-accent contrast — WCAG AA 4.5:1 at warm', () => {
  it.each(SCORES)('score %i: --gold against --token-surface reads well', (score) => {
    const tokens = computeThermalTokens(score, 'dormant');
    expect(contrast(ROOM_ACCENT_HEX.gold, tokens['--token-surface']))
      .toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it.each(SCORES)('score %i: --rose against --token-surface reads well', (score) => {
    const tokens = computeThermalTokens(score, 'dormant');
    expect(contrast(ROOM_ACCENT_HEX.rose, tokens['--token-surface']))
      .toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('current-accent at dormant clears the documented floor', () => {
    const tokens = computeThermalTokens(0, 'dormant');
    expect(contrast(tokens['--token-accent'], tokens['--token-surface']))
      .toBeGreaterThanOrEqual(PASSAGE_DORMANT_FLOOR - 1.5);
  });
});
