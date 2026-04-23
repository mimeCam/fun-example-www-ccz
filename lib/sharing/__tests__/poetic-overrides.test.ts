/**
 * poetic-overrides — shape tests.
 *
 * The allow-list is a reviewed Set of literal strings (Mike §5). This
 * test pins its shape so drift cannot re-enter silently:
 *  - it is a Set
 *  - every entry is a non-empty string
 *  - size stays under the six-entry smell threshold (Mike §11)
 *  - no entry is trimmable (accidental whitespace is not voice)
 *
 * Behavior lives in `toast-adoption.test.ts`; this file only guards
 * the data.
 */

import {
  POETIC_OVERRIDES,
  POETIC_OVERRIDES_MAX_ENTRIES,
} from '@/lib/sharing/poetic-overrides';

describe('poetic-overrides — shape', () => {
  it('is a Set', () => {
    expect(POETIC_OVERRIDES).toBeInstanceOf(Set);
  });

  it('every entry is a non-empty, trimmed string', () => {
    for (const entry of POETIC_OVERRIDES) {
      expect(typeof entry).toBe('string');
      expect(entry.length).toBeGreaterThan(0);
      expect(entry).toBe(entry.trim());
    }
  });

  it('stays within the six-entry smell threshold (Mike §11)', () => {
    expect(POETIC_OVERRIDES.size).toBeLessThanOrEqual(POETIC_OVERRIDES_MAX_ENTRIES);
  });

  it('exports a numeric max-entries constant', () => {
    expect(Number.isInteger(POETIC_OVERRIDES_MAX_ENTRIES)).toBe(true);
    expect(POETIC_OVERRIDES_MAX_ENTRIES).toBeGreaterThan(0);
  });
});
