/**
 * Article data — static article store with stratified content support.
 * In production, this would come from a database or CMS.
 */

import { Article } from './ContentTagger';
import type { LayeredArticleContent } from '@/types/content';

export const SAMPLE_ARTICLES: Article[] = [
  {
    id: 'art-of-challenging',
    title: 'The Art of Challenging Ideas',
    content: `The ability to challenge ideas is fundamental to intellectual growth.
    When we encounter ideas that resonate with us, we should also be willing to question them.
    This is how we strengthen our understanding and avoid falling into echo chambers.
    Challenging ideas effectively requires more than just disagreement.
    It involves understanding the context, asking thoughtful questions,
    and providing evidence or alternative perspectives.`,
    tags: ['critical-thinking', 'intellectual-growth', 'innovation'],
    publishedAt: '2021-04-04T10:00:00Z',
    worldview: 'philosophical',
    questions: [
      'What ideas do you defend without evidence?',
      'When was the last time you changed your mind?',
      'Do you seek agreement or understanding?'
    ]
  },
  {
    id: 'deep-work',
    title: 'Deep Work in a Distracted World',
    content: `In our increasingly distracted world, the ability to perform deep work
    is becoming both rare and valuable. Deep work is the ability to focus without
    distraction on a cognitively demanding task. It's a skill that allows you to
    quickly master complicated information and produce better results in less time.
    To cultivate deep work, you must eliminate distractions and create routines
    that support sustained attention.`,
    tags: ['productivity', 'focus', 'professional-development'],
    publishedAt: '2022-08-15T14:30:00Z',
    worldview: 'practical',
    questions: [
      'What could you achieve with 4 hours of uninterrupted focus?',
      'Why is deep work becoming so rare?',
      'Are you busy or productive?'
    ]
  },
  {
    id: 'systems-thinking',
    title: 'Introduction to Systems Thinking',
    content: `Systems thinking is a holistic approach to analysis that focuses on
    the way that a system's constituent parts interrelate and how systems work
    over time and within the context of larger systems. Rather than breaking
    problems down into smaller parts, systems thinking looks at problems as
    interconnected wholes. This approach helps us understand complex issues
    and find leverage points for meaningful change.`,
    tags: ['systems-thinking', 'problem-solving', 'strategy'],
    publishedAt: '2023-11-22T09:15:00Z',
    worldview: 'philosophical',
    questions: [
      'What are you optimizing at the expense of the whole?',
      'Where can you find leverage in complex systems?',
      'Are you solving symptoms or root causes?'
    ]
  },
  {
    id: 'effective-communication',
    title: 'Communication for Technical Leaders',
    content: `Technical excellence alone is not enough for leadership success.
    Effective communication is the bridge between technical expertise and
    organizational impact. Great technical leaders communicate complex ideas
    clearly, listen actively to diverse perspectives, and adapt their message
    to their audience. They understand that communication is not just about
    transmitting information, but about building understanding and trust.`,
    tags: ['leadership', 'communication', 'soft-skills'],
    publishedAt: '2024-01-10T16:45:00Z',
    worldview: 'practical',
    questions: [
      'Does your expertise bridge or divide?',
      'When you speak, do you inform or impress?',
      'Who are you not listening to?'
    ]
  },
  {
    id: 'learning-strategies',
    title: 'Strategies for Lifelong Learning',
    content: `The most successful people are lifelong learners. They cultivate
    curiosity and embrace continuous growth. Effective learning strategies include
    deliberate practice, spaced repetition, interleaving topics, and teaching
    others what you've learned. The key is to move beyond passive consumption
    to active engagement with new knowledge. Learning is not a destination but
    a journey of constant discovery and refinement.`,
    tags: ['learning', 'personal-development', 'growth-mindset'],
    publishedAt: '2024-02-28T11:20:00Z',
    worldview: 'practical',
    questions: [
      'What did you learn this week?',
      'Are you consuming or creating knowledge?',
      'What skill would pay dividends forever?'
    ]
  },
  {
    id: 'design-principles',
    title: 'Design Principles for Developer Tools',
    content: `Great developer tools share common design principles: they respect
    the user's intelligence, provide clear feedback, and minimize cognitive load.
    Good design disappears, allowing developers to focus on their work rather
    than the tool itself. The best tools are opinionated about their domain but
    flexible in their application. They understand that developers are not just
    users but collaborators in the tool's evolution.`,
    tags: ['design', 'developer-experience', 'product-design'],
    publishedAt: '2024-04-04T08:00:00Z',
    worldview: 'technical',
    questions: [
      'Does your tool respect the user?',
      'What cognitive load are you imposing?',
      'Are you building for users or collaborators?'
    ]
  },
];

// ─── Stratified Content Layers ───────────────────────────────
// Keyed by article ID. Each article can have layered content.

const LAYERED_CONTENT: Record<string, LayeredArticleContent> = {
  'art-of-challenging': {
    core: `The ability to challenge ideas is fundamental to intellectual growth. When we encounter ideas that resonate with us, we should also be willing to question them. This is how we strengthen our understanding and avoid falling into echo chambers.

Challenging ideas effectively requires more than just disagreement. It involves understanding the context, asking thoughtful questions, and providing evidence or alternative perspectives. The goal is not to win an argument but to arrive at a deeper truth.

Every great breakthrough in science and philosophy began with someone willing to question the prevailing wisdom. The courage to challenge is the engine of progress.`,

    marginalia: `You've been here before — which means you care enough to return. That matters more than you think. The ideas below are ones I saved for readers who dig deeper than the surface.`,

    extensions: {
      'deep-diver': `The cognitive science behind challenging ideas reveals a paradox: the more expertise we develop in a domain, the harder it becomes to see its flaws. This is the "expertise trap" — our mental models become rigid frameworks that filter out contradictory evidence. Research by Philip Tetlock shows that experts are worse than dart-throwing chimpanzees at predicting outcomes in their own fields. The antidote is structured disagreement: forcing yourself to articulate the strongest version of an opposing argument before rejecting it.`,
      'explorer': `This connects to several threads across the corpus: "Systems Thinking" explores how feedback loops entrench beliefs; "Deep Work" examines how focused attention creates space for genuine reflection; and "Learning Strategies" touches on how deliberate practice requires constantly operating at the edge of your competence — where disagreement lives.`,
    },
  },
  // TODO: Add layered content for 'deep-work'
  // TODO: Add layered content for 'systems-thinking'
  // TODO: Add layered content for remaining articles
};

/**
 * Get the layered content for an article, if available.
 * Returns null if the article has no stratified layers yet.
 */
export function getLayeredContent(id: string): LayeredArticleContent | null {
  return LAYERED_CONTENT[id] ?? null;
}

/**
 * Get all articles (in production, this would query a database)
 */
export function getAllArticles(): Article[] {
  return SAMPLE_ARTICLES;
}

/**
 * Get article by ID (in production, this would query a database)
 */
export function getArticleById(id: string): Article | undefined {
  return SAMPLE_ARTICLES.find(article => article.id === id);
}
