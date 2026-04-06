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
    worldview: 'contrarian',
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
      'faithful': `Between us: the readers who keep returning to challenge their thinking are the ones who grow the most. It's not about being contrarian — it's about being honest. Every time you revisit an idea you previously dismissed, you're exercising the most important muscle in your intellectual toolkit. Most people defend their first position. You came back for a second look. That discipline compounds over time into something rare: genuine open-mindedness.`,
      'resonator': `Reflect on this: when was the last time an idea truly unsettled you? Not mildly disagreed with — genuinely made you uncomfortable? That discomfort is a signal. It means the idea has penetrated your defenses and found a gap in your mental model. The instinct is to retreat. The practice is to stay. Sit with the discomfort for a full minute before you decide whether to accept, reject, or hold the idea in suspension. That pause is where intellectual courage lives.`,
      'collector': `If you found this interesting, here's your reading list: "Thinking, Fast and Slow" by Daniel Kahneman (the definitive guide to cognitive biases), "The Scout Mindset" by Julia Galef (why updating your beliefs is a skill, not a weakness), and "Superforecasting" by Philip Tetlock (how to get better at changing your mind). Each one is a different angle on the same truth: your first thought is rarely your best one.`,
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
      'faithful': `Between us: the people who guard their attention consistently outperform the people who guard it intensely. It's not about one heroic four-hour session — it's about showing up for ninety minutes, day after day, until the compound interest of focused work becomes impossible to ignore. The difference between you and the distracted majority isn't talent. It's the quiet discipline of protecting the same window every single day.`,
      'resonator': `Reflect on this: think about the last time you lost track of time completely. Not scrolling, not watching — genuinely creating or understanding something. What were you doing? Who were you being? That state isn't random. It's the intersection of skill and challenge, where the task is hard enough to absorb you completely. The tragedy is that most people structure their days to make this state impossible, then wonder why they feel unfulfilled.`,
      'collector': `If you liked this: try the Pomodoro technique (25 min focus + 5 min break) as a starter ritual. The tool that matters most? Airplane mode. For deeper reading, "Deep Work" by Cal Newport is the canonical text, and "Make Time" by Jake Knapp offers a daily framework for choosing what deserves your attention. Quick win: block your first 90 minutes tomorrow. No meetings, no messages, no exceptions.`,
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
      'faithful': `Between us: systems thinking is not a framework you learn once and apply. It's a lens that sharpens with practice. The first dozen times you look for feedback loops, you'll miss them. Then one day you'll see a delay in a meeting, a reinforcing loop in a team dynamic, or a balancing mechanism in your own habits — and you won't be able to unsee it. That's the gift of returning: each pass reveals structure the previous one couldn't.`,
      'resonator': `Reflect on this: every system produces exactly the results it's designed to produce, even when those results are unintended. Your morning routine is a system. Your relationships are systems. Your career is a system. If you don't like the outputs, don't blame the outputs — look for the structure producing them. This is both the most empowering and most uncomfortable insight in systems thinking: the problem is never the people. It's always the system.`,
      'collector': `If you found this useful, grab these mental models: stocks and flows (accumulation vs. rate), feedback loops (reinforcing vs. balancing), delays (why causes don't match effects in time), and limits to growth (why everything that grows eventually slows). For a deeper dive, "Thinking in Systems" by Donella Meadows is the essential primer. Quick exercise: map one system in your life as a causal loop diagram — you'll see it differently forever.`,
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
      'faithful': `Between us: communication is the skill nobody promotes you for but everybody depends on you having. The engineers who advance fastest aren't the ones who write the best code — they're the ones who can explain why their code matters to someone who has never written a line. If you've been coming back to this idea, you already sense this truth. Trust that instinct. Invest in clarity the way you invested in your technical craft.`,
      'resonator': `Reflect on this: think of a time when someone truly listened to you — not waiting for their turn to speak, but genuinely hearing what you were saying and responding to the meaning behind the words. How did that feel? Most people can count those moments on one hand. Being that kind of listener is rare. Being that kind of communicator is a form of generosity. The best technical leaders aren't the loudest voices in the room. They're the ones who make everyone else feel heard.`,
      'collector': `If you want to level up fast: start with the "pyramid principle" (lead with the conclusion, support with evidence) — it transforms technical presentations. For listening, try the "mirror technique": repeat back what you heard before responding. For writing, "On Writing Well" by William Zinsser is the fastest upgrade. Quick win: in your next meeting, ask one question before making one statement.`,
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
      'faithful': `Between us: the real secret of lifelong learners isn't a clever technique — it's consistency. The person who studies thirty minutes every day will always outpace the person who crams for five hours once a month. The spacing effect only works if you show up for the spaced reviews. The interleaving only works if you keep rotating topics. The teaching only works if you keep finding people to teach. Every strategy in this article reduces to one thing: keep coming back.`,
      'resonator': `Reflect on this: what do you know now that you didn't know a year ago that genuinely changed how you see the world? Not a new fact — a new lens. A way of seeing that made old information suddenly meaningful. Those shifts don't come from reading more. They come from sitting with one idea long enough that it reorganizes your thinking. The best learners aren't the fastest readers. They're the most patient thinkers.`,
      'collector': `If you want to start today: grab Anki (free, spaced repetition flashcards) for retention, Feynman's technique (explain it to a 12-year-old) for understanding, and the 2-minute rule (if you can recall it after 2 minutes, you've begun to learn it) for quick wins. Bookmarks: "Make It Stick" by Peter Brown (the science of learning), "Ultralearning" by Scott Young (intensive self-directed projects). Quick exercise: teach the last thing you learned to someone — anyone — today.`,
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
      'faithful': `Between us: good design is a practice, not an event. The tools that feel effortless to use were iterated on dozens of times by someone who kept asking the same question: "Does this respect the user?" That question never gets old. Every time you return to your own work with fresh eyes, you see friction you missed before. The best designers aren't the ones with the most talent — they're the ones who keep polishing long after everyone else moved on.`,
      'resonator': `Reflect on this: think of a tool you love using. Not one that's merely useful — one that brings you a quiet satisfaction every time you interact with it. What makes it different? Chances are, it never interrupts your thinking. It never makes you feel stupid. It anticipates what you need next without being presumptuous. That's not an accident. Someone made a hundred small decisions so that your experience would feel effortless. Great design is invisible empathy.`,
      'collector': `If you're building tools, bookmark these: "The Design of Everyday Things" by Don Norman (affordances and signifiers), "Refactoring UI" by Adam Wathan (visual design for developers), and Bret Victor's "Inventing on Principle" talk (the case for immediate feedback). Quick principle to apply today: remove one thing from your current screen that doesn't directly help the user accomplish their task. If the screen still works, it was clutter.`,
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
