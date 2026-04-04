/**
 * Sample article data for content discovery
 * In production, this would come from a database or CMS
 */

import { Article } from './ContentTagger';

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
  },
];

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
