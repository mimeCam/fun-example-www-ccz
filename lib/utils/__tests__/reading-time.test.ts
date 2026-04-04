/**
 * Reading Time Calculator Tests
 *
 * Verify that code block weighting works correctly for accurate reading time estimation.
 */

import {
  calculateReadingTime,
  countWeightedWords,
  getReadingStats,
  getReadingTimeDisplay,
  parseCodeBlocks,
  formatReadingTime,
} from '../reading-time';

describe('Reading Time Calculator', () => {
  describe('parseCodeBlocks', () => {
    it('should extract code blocks from markdown', () => {
      const content = `Some text here

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

More text here`;

      const result = parseCodeBlocks(content);

      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].content).toContain('const x = 1;');
      expect(result.codeBlocks[0].wordCount).toBe(4); // const x = 1, const y = 2
      expect(result.contentWithoutCodeBlocks).not.toContain('```');
    });

    it('should handle multiple code blocks', () => {
      const content = `Text

\`\`\`js
code one
\`\`\`

Text

\`\`\`py
code two
\`\`\`

Text`;

      const result = parseCodeBlocks(content);
      expect(result.codeBlocks).toHaveLength(2);
    });

    it('should handle content without code blocks', () => {
      const content = 'Just plain text with no code blocks';
      const result = parseCodeBlocks(content);

      expect(result.codeBlocks).toHaveLength(0);
      expect(result.contentWithoutCodeBlocks).toBe(content);
    });
  });

  describe('countWeightedWords', () => {
    it('should weight code block words by 3x', () => {
      const content = `Hello world

\`\`\`javascript
const x = 1;
\`\`\``;

      const result = countWeightedWords(content, 3);

      expect(result.proseWordCount).toBe(2); // "Hello world"
      expect(result.codeWordCount).toBe(3); // "const x = 1"
      expect(result.weightedWordCount).toBe(11); // 2 + (3 * 3) = 11
    });

    it('should handle prose-only content', () => {
      const content = 'This is just plain text with many words here';
      const result = countWeightedWords(content, 3);

      expect(result.proseWordCount).toBe(9);
      expect(result.codeWordCount).toBe(0);
      expect(result.weightedWordCount).toBe(9);
      expect(result.codeBlockCount).toBe(0);
    });

    it('should handle code-only content', () => {
      const content = `\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
\`\`\``;

      const result = countWeightedWords(content, 3);

      expect(result.proseWordCount).toBe(0);
      expect(result.codeWordCount).toBe(9);
      expect(result.weightedWordCount).toBe(27); // 9 * 3
      expect(result.codeBlockCount).toBe(1);
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate longer time for code-heavy content', () => {
      const proseContent = 'word '.repeat(225); // 225 words = 1 minute
      const codeContent = `\`\`\`javascript
${'const x = '.repeat(75)} // 225 words in code = 3 minutes weighted
\`\`\``;

      const proseTime = calculateReadingTime(proseContent, 225, 3);
      const codeTime = calculateReadingTime(codeContent, 225, 3);

      expect(proseTime).toBe(1);
      expect(codeTime).toBe(3); // 3x longer due to code weighting
    });

    it('should calculate mixed content accurately', () => {
      const mixedContent = `${'word '.repeat(150)} // 150 prose words

\`\`\`javascript
${'const x = '.repeat(25)} // 75 code words
\`\`\``;

      const time = calculateReadingTime(mixedContent, 225, 3);

      // Weighted: 150 + (75 * 3) = 375 words
      // Expected: 375 / 225 = 1.67 → 2 minutes
      expect(time).toBe(2);
    });

    it('should return minimum 1 minute for any content', () => {
      const shortContent = 'Hi';
      const time = calculateReadingTime(shortContent, 225, 3);
      expect(time).toBe(1);
    });

    it('should return 0 for empty content', () => {
      const time = calculateReadingTime('', 225, 3);
      expect(time).toBe(0);
    });
  });

  describe('formatReadingTime', () => {
    it('should format single minute correctly', () => {
      expect(formatReadingTime(1)).toBe('1 min read');
    });

    it('should format multiple minutes correctly', () => {
      expect(formatReadingTime(5)).toBe('5 min read');
      expect(formatReadingTime(15)).toBe('15 min read');
    });

    it('should handle zero minutes', () => {
      expect(formatReadingTime(0)).toBe('No content');
    });
  });

  describe('getReadingStats', () => {
    it('should provide detailed breakdown', () => {
      const content = `${'word '.repeat(100)}

\`\`\`javascript
${'const x = '.repeat(20)}
\`\`\``;

      const stats = getReadingStats(content, 225, 3);

      expect(stats.proseWordCount).toBe(100);
      expect(stats.codeWordCount).toBe(60);
      expect(stats.codeBlockCount).toBe(1);
      expect(stats.weightedWordCount).toBe(280); // 100 + (60 * 3)
      expect(stats.wordCount).toBe(160); // 100 + 60
      expect(stats.formatted).toMatch(/\d+ min read/);
    });
  });

  describe('getReadingTimeDisplay', () => {
    it('should use custom reading time when provided', () => {
      const content = 'Some content';
      const customTime = '8 min to transform your workflow ⚡';

      const result = getReadingTimeDisplay(content, customTime);

      expect(result.display).toBe(customTime);
      expect(result.isCustom).toBe(true);
      expect(result.minutes).toBe(8);
    });

    it('should auto-calculate when no custom time provided', () => {
      const content = 'word '.repeat(225); // 1 minute worth
      const result = getReadingTimeDisplay(content);

      expect(result.display).toBe('1 min read');
      expect(result.isCustom).toBe(false);
      expect(result.minutes).toBe(1);
    });

    it('should extract minutes from custom message', () => {
      const content = 'Short content';
      const customTime = '15 min deep dive into APIs';

      const result = getReadingTimeDisplay(content, customTime);

      expect(result.display).toBe(customTime);
      expect(result.minutes).toBe(15);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle technical tutorial with code', () => {
      const tutorial = `# Introduction to React Hooks

In this tutorial, we'll explore React Hooks and how they can simplify your code.

## What are Hooks?

Hooks are functions that let you use state and other React features in functional components.

\`\`\`jsx
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

## Conclusion

Hooks make React development more intuitive and easier to understand.`;

      const stats = getReadingStats(tutorial, 225, 3);

      // Should account for the code block
      expect(stats.codeBlockCount).toBe(1);
      expect(stats.codeWordCount).toBeGreaterThan(0);
      expect(stats.minutes).toBeGreaterThan(0);
      expect(stats.formatted).toMatch(/\d+ min read/);
    });

    it('should handle prose-only blog post', () => {
      const blogPost = `# The Art of Productivity

Productivity is not about doing more things. It's about doing the right things.

When we focus on what truly matters, we achieve better results with less effort.
This is the essence of effective work.`;

      const stats = getReadingStats(blogPost, 225, 3);

      expect(stats.codeBlockCount).toBe(0);
      expect(stats.codeWordCount).toBe(0);
      expect(stats.proseWordCount).toBeGreaterThan(0);
    });
  });
});
