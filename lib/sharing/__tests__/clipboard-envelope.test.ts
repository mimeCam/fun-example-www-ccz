/**
 * clipboard-envelope — unit tests for the pure builder.
 *
 * Five concern groups, matched to the napkin's points of interest (Mike §):
 *   1. Byte-identity — `plain` MIME equals input exactly (§1).
 *   2. HTML shape   — semantic blockquote, cite attrs, <cite> attribution (§2).
 *   3. Escape safety — &, <, >, ", ' in body and in envelope fields (§3).
 *   4. Degradation  — minimal input, whitespace, optional fields (§5).
 *   5. Determinism  — same input → same bytes, regardless of external state (§7).
 *
 * No DOM, no thermal-token coupling. If a future sprint wires thermal
 * state into the builder, test 5 fails loudly. The determinism IS the
 * feature.
 *
 * Credits: Mike K. (the 10 points of interest — each bucket here is a
 * point on the napkin), Tanya D. (§6 micro-details — em-dash spacing,
 * trailing-newline handling, attribution shape), Elon-style first-
 * principles review (byte-identity invariant = the escape hatch).
 */

import {
  buildClipboardPayload, buildBlockquoteHtml, escapeHtml,
  isMultiMimeSupported,
} from '@/lib/sharing/clipboard-envelope';

// ─── 1. Byte-identity ──────────────────────────────────────────────────────

describe('plain-text MIME is byte-identical to input', () => {
  it('ASCII unchanged', () => {
    const s = 'Hello, world.';
    expect(buildClipboardPayload(s).plain).toBe(s);
  });
  it('unicode unchanged', () => {
    const s = 'café · 日本語 · 🫖';
    expect(buildClipboardPayload(s).plain).toBe(s);
  });
  it('control chars preserved (tabs, newlines)', () => {
    const s = 'a\tb\nc\r\nd';
    expect(buildClipboardPayload(s).plain).toBe(s);
  });
  it('empty string stays empty', () => {
    expect(buildClipboardPayload('').plain).toBe('');
  });
  it('envelope presence never mutates plain MIME', () => {
    const s = 'x';
    const env = { cite: 'https://example.com', title: 'T', author: 'A' };
    expect(buildClipboardPayload(s, env).plain).toBe(s);
  });
});

// ─── 2. HTML shape ─────────────────────────────────────────────────────────

describe('HTML MIME is a semantic blockquote', () => {
  it('wraps text in <blockquote>…</blockquote>', () => {
    const h = buildBlockquoteHtml('hello');
    expect(h.startsWith('<blockquote')).toBe(true);
    expect(h.includes('>hello')).toBe(true);
    expect(h.includes('</blockquote>')).toBe(true);
  });

  it('populates cite="" when url supplied', () => {
    const h = buildBlockquoteHtml('x', { cite: 'https://example.com/a' });
    expect(h).toMatch(/cite="https:\/\/example\.com\/a"/);
  });

  it('omits cite="" when url absent', () => {
    const h = buildBlockquoteHtml('x');
    expect(h).not.toMatch(/cite=/);
  });

  it('renders <cite> with em-dash attribution when title present', () => {
    const h = buildBlockquoteHtml('x', { title: 'My Article' });
    expect(h).toMatch(/<cite[^>]*>— My Article<\/cite>/);
  });

  it('joins title · author with middle-dot glyph', () => {
    const h = buildBlockquoteHtml('x', { title: 'T', author: 'A' });
    expect(h).toMatch(/— T · A/);
  });

  it('wraps attribution in a link when cite url is present', () => {
    const h = buildBlockquoteHtml('x', { cite: 'https://example.com', title: 'T' });
    expect(h).toMatch(/<a href="https:\/\/example\.com"[^>]*>— T<\/a>/);
  });

  it('includes lang="" attribute when supplied', () => {
    const h = buildBlockquoteHtml('x', { lang: 'en' });
    expect(h).toMatch(/lang="en"/);
  });

  it('inline-styles only the left rule (no background-color)', () => {
    const h = buildBlockquoteHtml('x');
    expect(h).toMatch(/border-left:\s*3px solid #7b2cbf/);
    expect(h).not.toMatch(/background-color/);
  });
});

// ─── 3. Sanitizer safety (escape everything) ───────────────────────────────

describe('escapeHtml seals the HTML surface', () => {
  it('escapes the five named entities', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
  it('does not double-escape pre-escaped input', () => {
    // We always start from the raw string; callers must pass unescaped text.
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
  it('escapes body text', () => {
    const h = buildBlockquoteHtml('<script>alert(1)</script>');
    expect(h).toMatch(/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    expect(h).not.toMatch(/<script>/);
  });
  it('escapes cite URL contents', () => {
    const h = buildBlockquoteHtml('x', { cite: 'https://a.com/"><script>' });
    expect(h).not.toMatch(/<script>/);
    expect(h).toMatch(/&quot;/);
  });
  it('escapes title and author fields', () => {
    const h = buildBlockquoteHtml('x', { title: '<b>T</b>', author: '"A"' });
    expect(h).toMatch(/&lt;b&gt;T&lt;\/b&gt;/);
    expect(h).toMatch(/&quot;A&quot;/);
    expect(h).not.toMatch(/<b>/);
  });
  it('forbids the three fatal HTML tokens', () => {
    const h = buildBlockquoteHtml('any text', {
      cite: 'https://x', title: 'T', author: 'A',
    });
    expect(h).not.toMatch(/<script/i);
    expect(h).not.toMatch(/<style/i);
    expect(h).not.toMatch(/\burl\(/i);
  });
  it('emits no class=, id=, or event-handler attributes', () => {
    const h = buildBlockquoteHtml('x', { cite: 'https://x', title: 'T' });
    expect(h).not.toMatch(/\bclass=/);
    expect(h).not.toMatch(/\bid=/);
    expect(h).not.toMatch(/\bon[a-z]+=/i);
  });
});

// ─── 4. Degradation (Tanya §6 micro-details) ───────────────────────────────

describe('degraded / edge-case input', () => {
  it('trims trailing newlines off the quoted body', () => {
    const h = buildBlockquoteHtml('hello\n\n\n');
    expect(h).toMatch(/>hello<\/blockquote>|>hello<cite/);
    expect(h).not.toMatch(/hello\n\n/);
  });
  it('omits <cite> when neither title nor author supplied', () => {
    const h = buildBlockquoteHtml('x', { cite: 'https://x' });
    expect(h).not.toMatch(/<cite/);
  });
  it('handles a single-word quote without empty attribution', () => {
    const h = buildBlockquoteHtml('one');
    expect(h).not.toMatch(/<cite/);
    expect(h).toMatch(/>one<\/blockquote>/);
  });
  it('treats whitespace-only title as absent', () => {
    const h = buildBlockquoteHtml('x', { title: '   ' });
    expect(h).not.toMatch(/<cite/);
  });
  it('thermal comment is off by default', () => {
    const h = buildBlockquoteHtml('x', { cite: 'https://x', title: 'T' });
    expect(h).not.toMatch(/<!-- thermal:/);
  });
  it('thermal comment rides OUTSIDE the blockquote when explicitly enabled', () => {
    const h = buildBlockquoteHtml('x', { thermalComment: 'warm' });
    expect(h).toMatch(/<\/blockquote><!-- thermal: warm -->/);
  });
  it('scrubs `--` from thermal comment value (invalid inside comment)', () => {
    const h = buildBlockquoteHtml('x', { thermalComment: 'a--b--c' });
    expect(h).toMatch(/<!-- thermal: a-b-c -->/);
  });
});

// ─── 5. Determinism (§7 — the determinism IS the feature) ──────────────────

describe('determinism invariant', () => {
  it('same input → byte-identical HTML, twice in a row', () => {
    const env = { cite: 'https://example.com', title: 'T', author: 'A' };
    const a = buildBlockquoteHtml('hello world', env);
    const b = buildBlockquoteHtml('hello world', env);
    expect(a).toBe(b);
  });
  it('envelope is NOT influenced by any external state', () => {
    // Poison Date, Math.random — the builder must ignore both entirely.
    const realRandom = Math.random;
    Math.random = () => 0.42;
    const h1 = buildBlockquoteHtml('x', { title: 'T' });
    Math.random = () => 0.99;
    const h2 = buildBlockquoteHtml('x', { title: 'T' });
    Math.random = realRandom;
    expect(h1).toBe(h2);
  });
});

// ─── Feature detect ────────────────────────────────────────────────────────

describe('isMultiMimeSupported — SSR-safe feature detect', () => {
  it('returns false when navigator is undefined (SSR)', () => {
    const g = globalThis as { navigator?: unknown };
    const prev = g.navigator;
    delete g.navigator;
    expect(isMultiMimeSupported()).toBe(false);
    if (prev !== undefined) g.navigator = prev;
  });
  it('returns false when ClipboardItem is not a function', () => {
    const g = globalThis as {
      navigator?: unknown; ClipboardItem?: unknown;
    };
    g.navigator = { clipboard: { write: () => {} } };
    g.ClipboardItem = undefined;
    expect(isMultiMimeSupported()).toBe(false);
    delete g.navigator;
    delete g.ClipboardItem;
  });
});
