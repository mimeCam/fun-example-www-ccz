/**
 * Filter system types for THE FILTER feature
 *
 * This implements the core "Anti-Blog" filtering mechanism:
 * "A blog that tries to talk most people out of reading it"
 */

export type FilterType =
  | 'technical'
  | 'philosophical'
  | 'practical'
  | 'contrarian';

export interface FilterCriteria {
  id: string;
  type: FilterType;
  title: string;
  description: string;
  teaser: string; // "This post is for people who..."
  beliefs: string[]; // List of beliefs that should resonate
}

export interface FilterAnalytics {
  articleId: string;
  filterShown: boolean;
  filterAccepted: boolean;
  filterRejected: boolean;
  articleCompleted: boolean;
  timestamp: number;
}

export interface ArticleWithFilter {
  id: string;
  title: string;
  excerpt: string;
  filterCriteria: FilterCriteria;
  publishedAt: string;
}

/**
 * Filter criteria for different article types
 * These help readers self-select based on their worldview
 */
export const FILTER_TEMPLATES: Record<FilterType, Omit<FilterCriteria, 'id'>> = {
  technical: {
    type: 'technical',
    title: 'Deep Technical Dive',
    description: 'For those who love implementation details',
    teaser: 'This post is for people who believe...',
    beliefs: [
      'Implementation matters more than theory',
      'Code quality is a competitive advantage',
      'Technical debt is a strategic decision',
    ],
  },
  philosophical: {
    type: 'philosophical',
    title: 'Philosophical Exploration',
    description: 'For those who question assumptions',
    teaser: 'This post is for people who believe...',
    beliefs: [
      'First principles thinking beats best practices',
      'Most industry conventions are wrong',
      'Question everything, even your own beliefs',
    ],
  },
  practical: {
    type: 'practical',
    title: 'Practical Application',
    description: 'For those who ship products',
    teaser: 'This post is for people who believe...',
    beliefs: [
      'Done is better than perfect',
      'Shipping beats premature optimization',
      'Real-world feedback beats theoretical debates',
    ],
  },
  contrarian: {
    type: 'contrarian',
    title: 'Contrarian Viewpoint',
    description: 'For those who challenge the status quo',
    teaser: 'This post is for people who believe...',
    beliefs: [
      'Popular opinions are usually wrong',
      'Consensus is a red flag',
      'Being right matters more than being popular',
    ],
  },
};
