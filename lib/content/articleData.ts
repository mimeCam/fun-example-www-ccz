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
  'deep-work': {
    core: `In our increasingly distracted world, the ability to perform deep work is becoming both rare and valuable. Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.

To cultivate deep work, you must eliminate distractions and create routines that support sustained attention. The most productive people don't work longer hours — they protect specific windows of uninterrupted focus and defend them fiercely.

Every notification you silence, every tab you close, every meeting you decline is a vote for the kind of thinker you want to become.`,
    marginalia: `You came back to this. That tells me you've been thinking about focus — not just reading about it. The passage below is what I wish someone had told me when I first started guarding my attention.`,
    extensions: {
      'deep-diver': `Cal Newport's research shows that the absolute minimum for deep work is 90 uninterrupted minutes. Below that threshold, your brain never fully disengages from the "attention residue" of prior tasks. The neuroscience is clear: context-switching doesn't just cost time — it costs depth. Each switch fragments your working memory, and full recovery takes 23 minutes on average.`,
      'explorer': `This connects directly to "Systems Thinking" — your attention is a system, and most people optimize for throughput (many tasks) at the expense of resonance (meaningful work). "Design Principles" also explores this: tools that minimize cognitive load enable deeper states, which is why great developer tools disappear during use.`,
    },
  },

  'systems-thinking': {
    core: `Systems thinking is a holistic approach to analysis that focuses on the way that a system's constituent parts interrelate and how systems work over time and within the context of larger systems. Rather than breaking problems down into smaller parts, systems thinking looks at problems as interconnected wholes.

This approach helps us understand complex issues and find leverage points for meaningful change. The most powerful interventions are rarely obvious — they emerge from understanding feedback loops, delays, and the unintended consequences of well-meaning actions.

The best systems thinkers learn to see the invisible structures that produce visible behavior.`,
    marginalia: `Welcome back. I saved something for you — a perspective on systems that only makes sense after you've spent time thinking about how things connect rather than just what things are.`,
    extensions: {
      'deep-diver': `Donella Meadows identified twelve leverage points for intervention in complex systems, ranked by effectiveness. Counter-intuitively, the most powerful leverage point is the paradigm out of which the system arises. Changing the goals of a system is more impactful than changing its parameters. Most organizations spend 90% of their effort on the weakest leverage points — adjusting numbers, buffers, and constants — while ignoring the mental models that created the system.`,
      'explorer': `Systems thinking weaves through everything in this corpus: "Deep Work" is really about optimizing your personal attention system; "Design Principles" is about creating systems that respect human cognition; and "Learning Strategies" treats learning as a feedback loop where teaching others accelerates your own understanding.`,
    },
  },

  'effective-communication': {
    core: `Technical excellence alone is not enough for leadership success. Effective communication is the bridge between technical expertise and organizational impact. Great technical leaders communicate complex ideas clearly, listen actively to diverse perspectives, and adapt their message to their audience.

They understand that communication is not just about transmitting information, but about building understanding and trust. The best communicators don't simplify — they clarify. They find the precise words that carry the full weight of an idea without unnecessary abstraction.

Communication is the one skill that amplifies every other skill you possess.`,
    marginalia: `The fact that you returned to this article tells me you're not just reading — you're reflecting. That's rare. Here's something I think about communication that I don't usually share in the main text.`,
    extensions: {
      'deep-diver': `Research on engineering leadership shows that communication ability predicts team performance more strongly than technical skill. A study of 1,200 tech leads found that teams led by strong communicators shipped 40% faster and had half the defect rate. The mechanism is psychological safety: when leaders communicate clearly and listen actively, team members surface problems earlier — and early problem detection is the highest-leverage intervention in any complex system.`,
      'explorer': `Communication threads through every article here: "Challenging Ideas" is really about communicating disagreement constructively; "Design Principles" explores how tool design is a form of communication with users; and "Learning Strategies" shows that teaching others — the ultimate form of communication — is the fastest path to mastery.`,
    },
  },

  'learning-strategies': {
    core: `The most successful people are lifelong learners. They cultivate curiosity and embrace continuous growth. Effective learning strategies include deliberate practice, spaced repetition, interleaving topics, and teaching others what you've learned.

The key is to move beyond passive consumption to active engagement with new knowledge. Learning is not a destination but a journey of constant discovery and refinement. The difference between someone who reads a hundred books and someone who transforms from reading one is how they process what they encounter.

The best learners don't just accumulate knowledge — they build mental models that connect disparate ideas into coherent frameworks.`,
    marginalia: `You're here again, which means the learning strategies are working — or at least intriguing enough to revisit. I'll let you in on a secret: the most powerful learning strategy isn't in the main text.`,
    extensions: {
      'deep-diver': `The spacing effect, first documented by Hermann Ebbinghaus in 1885, remains one of the most robust findings in cognitive science. Reviewing material at increasing intervals (1 day, 3 days, 7 days, 14 days) produces 200% better long-term retention than massed practice. Yet most learners still cram. The reason: spacing feels less effective in the moment. Metacognition misleads us — fluency during review is not the same as durable learning.`,
      'explorer': `Learning is the connective tissue of this entire corpus: "Deep Work" creates the conditions for learning; "Systems Thinking" provides the frameworks to organize what you learn; "Communication" gives you the tool to solidify learning through teaching; and "Design Principles" shows that good design is a form of applied learning about your users.`,
    },
  },

  'design-principles': {
    core: `Great developer tools share common design principles: they respect the user's intelligence, provide clear feedback, and minimize cognitive load. Good design disappears, allowing developers to focus on their work rather than the tool itself.

The best tools are opinionated about their domain but flexible in their application. They understand that developers are not just users but collaborators in the tool's evolution. A well-designed tool makes the right thing easy and the wrong thing hard — not through restrictions, but through affordances.

Design is not decoration. It is the architecture of understanding.`,
    marginalia: `You returned to read about design principles. That's telling — most people only think about design when it breaks. The note below is for people who care enough to see design as a practice, not an afterthought.`,
    extensions: {
      'deep-diver': `Bret Victor's "Inventing on Principle" argues that the most impactful developer tools follow a principle of immediate feedback: creators should see the effect of every change in real-time. This principle explains why hot-reloading transformed frontend development and why REPLs remain popular after 50 years. The cognitive cost of a context switch between "editing" and "observing" is the single biggest barrier to creative flow in technical work.`,
      'explorer': `Design principles echo throughout this corpus: "Deep Work" is fundamentally about designing your environment for focus; "Communication" is about designing your message for your audience; and "Systems Thinking" is about designing interventions at the right leverage points rather than treating symptoms.`,
    },
  },
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
