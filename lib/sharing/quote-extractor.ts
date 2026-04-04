/**
 * Smart Content Extractor
 * Finds the best quotes from article content using heuristics.
 *
 * Scoring heuristics:
 * - Sentence length (prefer 50-150 characters)
 * - Contains keywords (but, however, therefore, etc.)
 * - Not too generic (avoids common phrases)
 * - Has context (surrounding paragraphs)
 * - Position in article (prefers middle sections)
 */

export interface ExtractedQuote {
  text: string;
  score: number;
  context: string;
  position: number;
}

export interface QuoteExtractionOptions {
  minLength?: number;
  maxLength?: number;
  maxQuotes?: number;
  includeContext?: boolean;
}

/**
 * High-impact keywords that signal valuable quotes.
 */
const IMPACT_KEYWORDS = [
  'however',
  'therefore',
  'fundamental',
  'essential',
  'critical',
  'important',
  'key',
  'principle',
  'insight',
  'discovery',
  'breakthrough',
  'paradox',
  'surprising',
  'counterintuitive',
  'remarkable',
  'notable',
  'significant',
  'transformative',
  'revolutionary',
];

/**
 * Generic phrases to avoid (too common).
 */
const GENERIC_PHRASES = [
  'in this article',
  'in conclusion',
  'in summary',
  'it is important to note',
  'it should be noted',
  'in order to',
  'due to the fact',
  'at the end of the day',
  'in today\'s world',
];

/**
 * Extract best quotes from article content.
 *
 * @param content - Full article content as text
 * @param options - Extraction options
 * @returns Array of extracted quotes sorted by score
 */
export function extractBestQuotes(
  content: string,
  options: QuoteExtractionOptions = {}
): ExtractedQuote[] {
  const {
    minLength = 50,
    maxLength = 300,
    maxQuotes = 5,
    includeContext = true,
  } = options;

  // Split content into sentences
  const sentences = splitIntoSentences(content);

  // Score and filter sentences
  const quotes: ExtractedQuote[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // Skip if too short or too long
    if (sentence.length < minLength || sentence.length > maxLength) {
      continue;
    }

    // Skip generic phrases
    if (isGenericPhrase(sentence)) {
      continue;
    }

    // Calculate score
    const score = scoreQuote(sentence, sentences, i, content.length);

    quotes.push({
      text: sentence.trim(),
      score,
      context: includeContext ? extractContext(sentences, i) : '',
      position: i,
    });
  }

  // Sort by score and return top quotes
  return quotes
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQuotes);
}

/**
 * Split content into sentences using regex.
 */
function splitIntoSentences(content: string): string[] {
  // Match sentence boundaries: . ! ? followed by space and capital letter
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)/g;
  const matches = content.match(sentenceRegex);

  return matches || [];
}

/**
 * Score a quote based on multiple heuristics.
 */
function scoreQuote(
  quote: string,
  allSentences: string[],
  index: number,
  totalLength: number
): number {
  let score = 0;

  // Length score (prefer 80-150 characters)
  const length = quote.length;
  if (length >= 80 && length <= 150) {
    score += 50;
  } else if (length >= 50 && length <= 200) {
    score += 30;
  }

  // Impact keyword score
  const lowerQuote = quote.toLowerCase();
  const keywordCount = IMPACT_KEYWORDS.filter(keyword =>
    lowerQuote.includes(keyword)
  ).length;
  score += keywordCount * 15;

  // Position score (prefer middle 60% of article)
  const position = index / allSentences.length;
  if (position >= 0.2 && position <= 0.8) {
    score += 20;
  }

  // Unique word score (avoid repetitive phrases)
  const words = quote.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;
  score += uniqueRatio * 20;

  // Sentence complexity (more clauses = more insight)
  const clauseCount = (quote.match(/[,;:]/g) || []).length;
  if (clauseCount > 0 && clauseCount <= 3) {
    score += clauseCount * 5;
  }

  return score;
}

/**
 * Check if sentence is too generic.
 */
function isGenericPhrase(sentence: string): boolean {
  const lower = sentence.toLowerCase().trim();
  return GENERIC_PHRASES.some(phrase => lower.startsWith(phrase));
}

/**
 * Extract context around a sentence.
 */
function extractContext(sentences: string[], index: string | number): string {
  const idx = typeof index === 'string' ? parseInt(index, 10) : index;
  const before = Math.max(0, idx - 1);
  const after = Math.min(sentences.length, idx + 2);

  return sentences
    .slice(before, after)
    .join(' ')
    .trim();
}

/**
 * Get a single best quote for quick sharing.
 *
 * @param content - Article content
 * @returns Best quote or null
 */
export function getBestQuote(content: string): ExtractedQuote | null {
  const quotes = extractBestQuotes(content, { maxQuotes: 1, includeContext: false });
  return quotes[0] || null;
}
