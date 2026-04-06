/**
 * Content Layers Tests — verify stratified content resolution for all 5 archetypes.
 *
 * Tests that:
 * - resolveVisibleLayers returns correct layers per archetype + readCount
 * - resolveVisibleContent returns correct blocks including new extensions
 * - All 6 articles have content for all 5 archetype extensions
 * - Locked layers are computed correctly
 */

import {
  resolveVisibleLayers,
  resolveVisibleContent,
  resolveLockedLayers,
  isReturningReader,
  getExtensionLabel,
  getExtensionBorderColor,
} from '../content-layers';
import { getLayeredContent } from '../articleData';
import type { ArchetypeKey } from '@/types/content';

const ARCHETYPES: ArchetypeKey[] = [
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
];

const ARTICLE_IDS = [
  'art-of-challenging', 'deep-work', 'systems-thinking',
  'effective-communication', 'learning-strategies', 'design-principles',
];

// ─── resolveVisibleLayers ────────────────────────────────────────

describe('resolveVisibleLayers', () => {
  test('anonymous reader (readCount=0) sees core only', () => {
    const layers = resolveVisibleLayers(null, 0);
    expect(layers).toEqual(['core']);
  });

  test('first-time reader (readCount=1) sees core only', () => {
    const layers = resolveVisibleLayers('deep-diver', 1);
    expect(layers).toEqual(['core']);
  });

  test('returning reader (readCount=2) without archetype sees core + marginalia', () => {
    const layers = resolveVisibleLayers(null, 2);
    expect(layers).toEqual(['core', 'marginalia']);
  });

  test('returning reader with archetype sees core + marginalia + extension', () => {
    ARCHETYPES.forEach((arch) => {
      const layers = resolveVisibleLayers(arch, 3);
      expect(layers).toContain('core');
      expect(layers).toContain('marginalia');
      expect(layers).toContain(arch);
      expect(layers).toHaveLength(3);
    });
  });
});

// ─── isReturningReader ───────────────────────────────────────────

describe('isReturningReader', () => {
  test('readCount < 2 is not returning', () => {
    expect(isReturningReader(0)).toBe(false);
    expect(isReturningReader(1)).toBe(false);
  });

  test('readCount >= 2 is returning', () => {
    expect(isReturningReader(2)).toBe(true);
    expect(isReturningReader(10)).toBe(true);
  });
});

// ─── All articles have 5 archetype extensions ───────────────────

describe('article archetype extensions', () => {
  ARTICLE_IDS.forEach((id) => {
    test(`${id} has all 5 archetype extensions`, () => {
      const content = getLayeredContent(id);
      expect(content).not.toBeNull();
      ARCHETYPES.forEach((arch) => {
        expect(content!.extensions[arch]).toBeDefined();
        expect(content!.extensions[arch]!.length).toBeGreaterThan(50);
      });
    });

    test(`${id} has marginalia`, () => {
      const content = getLayeredContent(id);
      expect(content!.marginalia).toBeDefined();
      expect(content!.marginalia!.length).toBeGreaterThan(20);
    });
  });
});

// ─── resolveVisibleContent ───────────────────────────────────────

describe('resolveVisibleContent', () => {
  test('anonymous reader sees only core paragraphs', () => {
    const content = getLayeredContent('deep-work')!;
    const { blocks } = resolveVisibleContent(content, null, 0);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].layer).toBe('core');
  });

  test('returning reader with archetype sees 3 blocks', () => {
    const content = getLayeredContent('deep-work')!;
    const { blocks } = resolveVisibleContent(content, 'faithful', 5);
    expect(blocks).toHaveLength(3);
    expect(blocks.map((b) => b.layer)).toEqual(
      expect.arrayContaining(['core', 'marginalia', 'faithful']),
    );
  });

  ARCHETYPES.forEach((arch) => {
    test(`returning ${arch} reader gets their extension`, () => {
      const content = getLayeredContent('art-of-challenging')!;
      const { blocks } = resolveVisibleContent(content, arch, 3);
      const layers = blocks.map((b) => b.layer);
      expect(layers).toContain(arch);
    });
  });
});

// ─── resolveLockedLayers ─────────────────────────────────────────

describe('resolveLockedLayers', () => {
  test('anonymous reader has marginalia + all extensions locked', () => {
    const content = getLayeredContent('deep-work')!;
    const locked = resolveLockedLayers(content, null, 0);
    expect(locked).toContain('marginalia');
    ARCHETYPES.forEach((arch) => {
      expect(locked).toContain(arch);
    });
  });

  test('returning reader with archetype has only non-matched extensions locked', () => {
    const content = getLayeredContent('deep-work')!;
    const locked = resolveLockedLayers(content, 'deep-diver', 5);
    expect(locked).not.toContain('core');
    expect(locked).not.toContain('marginalia');
    expect(locked).not.toContain('deep-diver');
    expect(locked).toContain('explorer');
    expect(locked).toContain('faithful');
    expect(locked).toContain('resonator');
    expect(locked).toContain('collector');
  });
});

// ─── Extension labels and colors ─────────────────────────────────

describe('extension metadata', () => {
  ARCHETYPES.forEach((arch) => {
    test(`${arch} has a label`, () => {
      expect(getExtensionLabel(arch).length).toBeGreaterThan(0);
    });

    test(`${arch} has a border color`, () => {
      const color = getExtensionBorderColor(arch);
      expect(color).toMatch(/^border-l-/);
    });
  });
});
