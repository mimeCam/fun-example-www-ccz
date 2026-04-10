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

    paragraphVariants: {
      0: {
        'deep-diver': `The ability to challenge ideas is not a personality trait — it's a discipline. Cognitive science calls it "active open-mindedness": the practice of genuinely entertaining propositions you find intuitively wrong. Most people confuse skepticism with intelligence. True intellectual rigor runs deeper: it's the capacity to hold your most cherished beliefs up to the strongest counterarguments and follow the evidence wherever it leads.`,
        'explorer': `Everything connects through challenge. "Systems Thinking" shows how entrenched beliefs survive through feedback loops. "Deep Work" creates the focused space where genuine questioning becomes possible. And "Learning Strategies" reveals that the fastest learners are those who constantly test their assumptions. The thread is the same: growth lives on the other side of disagreement.`,
        'faithful': `You already know this feeling — the quiet discomfort when something doesn't add up but everyone around you seems satisfied. Trust that feeling. It's not cynicism or contrarianism. It's your mind asking for permission to look deeper. The most reliable compass for intellectual growth isn't agreement — it's that specific kind of unease that tells you an idea deserves more scrutiny than it's getting.`,
        'resonator': `Think about the last time you disagreed with someone you respected. Not a stranger on the internet — someone whose opinion matters to you. That tension you felt? It's not a problem to resolve. It's a space where real understanding lives. Most people either capitulate or entrench. The courageous move is to stay in that uncomfortable space long enough to find what neither of you could see alone.`,
        'collector': `Three books that changed how I think about disagreement: "The Scout Mindset" by Julia Galef (why updating your beliefs is strength, not weakness), "Thinking, Fast and Slow" by Daniel Kahneman (the cognitive biases that make disagreement necessary), and "The Righteous Mind" by Jonathan Haidt (why smart people disagree). Start with Galef — it's the shortest and the most actionable.`,
      },
      1: {
        'deep-diver': `The structure of effective challenge follows a pattern: steelmanning before critique. Before you reject an argument, you must be able to articulate its strongest form — stronger than its proponent would. Only then have you earned the right to disagree. Anything less is shadowboxing. This isn't politeness — it's rigor. The strongest ideas survive precisely because they've been forged in the fiercest disagreement.`,
        'explorer': `Notice how this principle appears across the corpus: "Communication for Technical Leaders" frames challenge as a bridge, not a weapon. "Design Principles" shows that the best tools were built by teams who challenged every assumption. And "Introduction to Systems Thinking" reveals that challenging the paradigm — not the parameters — is the highest-leverage intervention. The pattern is clear: challenge at the right level transforms everything.`,
        'faithful': `Here's what works in practice: when you encounter an idea that feels wrong, don't dismiss it immediately. Write it down. Sit with it for a day. Then ask yourself: "If this were true, what else would have to be true?" Follow that chain. Sometimes you'll find a contradiction that confirms your skepticism. Sometimes you'll discover that your objection was aesthetic, not logical — and the idea is more sound than it felt.`,
        'resonator': `There's a particular kind of courage in saying "I think you're wrong" to someone you care about — and an even rarer kind in saying "tell me why" afterward. The goal was never to win. It was always to arrive somewhere neither of you could reach alone. The deepest truths are forged in that space between disagreement and understanding.`,
        'collector': `Practical framework: when you disagree, use the "double crux" method. Find the single point where your beliefs diverge — the one claim that, if resolved, would resolve the entire disagreement. Then ask: "What evidence would change your mind on this point?" If the answer is "nothing," you're not having a discussion — you're performing one. Move on.`,
      },
      2: {
        'deep-diver': `Thomas Kuhn showed that paradigm shifts don't happen through persuasion — they happen when a generation of scientists raised on the old paradigm dies and a new generation, unburdened by the old assumptions, takes over. Individual minds rarely change. Intellectual fields transform through institutional replacement. The courage to challenge is not just personal — it's generational.`,
        'explorer': `Now re-read "Systems Thinking" and notice the meta-pattern: the leverage point for challenging ideas isn't more evidence or better arguments — it's shifting the paradigm that determines which arguments count as evidence. Every article in this corpus circles this truth. The question is never "is this idea right?" but "what would I have to see differently to even evaluate whether it's right?"`,
        'faithful': `Keep challenging. Not reflexively — deliberately. The ideas you never question are the ones that most need questioning. Not because they're wrong, but because unexamined ideas become invisible. You stop seeing them as ideas and start seeing them as reality itself. That's when growth stops. The practice of returning to challenge your own assumptions is the practice of staying awake.`,
        'resonator': `What idea are you protecting right now? Not the one you'd argue for — the one you wouldn't even think to question because it feels like the ground beneath your feet. That's the idea that's most worth challenging. Not to tear it down. To find out whether it's built on rock or on the accumulated weight of never having been asked to prove itself.`,
        'collector': `Quick test: name three beliefs you hold that you've changed your mind about in the last year. If you can't, that's not stability — that's stagnation. The healthiest minds update constantly. Keep a "belief changelog" — write down what you changed your mind about and why. Review it monthly. You'll notice patterns in what you're willing to reconsider and what you protect.`,
      },
    },
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
    paragraphVariants: {
      0: {
        'deep-diver': `Cal Newport's central insight is economic, not moral: deep work is becoming more valuable precisely because it's becoming more rare. As your peers fragment their attention across Slack, email, and meetings, your ability to sustain focus for two uninterrupted hours is not just a productivity hack — it's a structural competitive advantage. The market doesn't reward effort. It rewards scarcity.`,
        'explorer': `Open any other article here and you'll see focus hiding underneath. "Systems Thinking" describes how attention is a system with feedback loops. "Design Principles" explores how tools minimize cognitive load to enable flow states. "Learning Strategies" shows that deliberate practice — the most effective learning method — requires exactly the kind of sustained concentration that deep work protects. Everything connects.`,
        'faithful': `You don't need to become a monk. You need to protect ninety minutes. That's the threshold Cal Newport identified — the minimum window where your brain fully commits to a single task and stops carrying residue from whatever you were doing before. You don't have to quit social media or move to a cabin. Just pick one window tomorrow and guard it like it matters. Because it does.`,
        'resonator': `Think about the last thing you made that you were genuinely proud of. Not something adequate — something that surprised you with its quality. Were you multitasking? Were you checking messages? Or were you so absorbed that you forgot to eat? That state has a name: flow. It's not random luck. It's what happens when you protect enough silence for your best thinking to emerge.`,
        'collector': `The key number: 90 minutes. Below that, you never fully disengage from prior tasks — the "attention residue" effect (Sophie Leroy's research). Quick framework: block 90 minutes, disable all notifications, work on one thing, take a 20-minute break. Repeat. Two 90-minute blocks per day produces more high-quality output than ten hours of fragmented work.`,
      },
      1: {
        'deep-diver': `The neuroscience of sustained attention reveals a counter-intuitive finding: the feeling of productivity from multitasking is a cognitive illusion. Each context switch costs 23 minutes of recovery time (Mark et al., UC Irvine). The prefrontal cortex doesn't parallelize — it time-shares, and the switching overhead compounds throughout the day. By afternoon, a multitasker has lost not minutes but hours of deep processing capacity.`,
        'explorer': `Notice the shared structure: "Effective Communication" shows that clarity requires focused attention on your audience. "Art of Challenging" requires sustained engagement with opposing arguments. "Learning Strategies" shows spaced repetition works only if you protect the review windows. Every skill worth having demands the same prerequisite: protected, uninterrupted time.`,
        'faithful': `The routine matters more than the willpower. Don't try to "be more focused" — that's like trying to "be more tall." Instead, build a ritual: same time, same place, same trigger. Maybe it's closing your laptop, making tea, and opening only your editor. The ritual trains your brain to transition faster. Within two weeks, the ritual becomes the state.`,
        'resonator': `What would you create if nobody could interrupt you for three hours? Not "what would you work on" — what would you actually make? Most people can't answer this because they've never had the silence to find out. Deep work isn't just about productivity. It's about discovering what you're capable of when the noise stops and you're finally alone with your own thinking.`,
        'collector': `Three rituals that compound: (1) Shutdown ritual — at a fixed time, write tomorrow's tasks, say "shutdown complete," stop working. (2) Morning block — first 90 minutes, deep work only, no exceptions. (3) Environment design — close every tab not related to the current task. Willpower is finite but routines are free. Design the environment, don't fight the distraction.`,
      },
      2: {
        'deep-diver': `The compounding effect of deep work follows a power law, not a linear curve. The first hour produces modest results. The second hour produces twice as much. The third hour — if you can sustain it — produces more than the first two combined. Deep understanding builds on itself: each insight creates the foundation for the next, and the connections compound. Shallow work distributes effort evenly. Deep work concentrates it at the leverage point.`,
        'explorer': `This connects back to the whole corpus as a systems insight: your daily choices about attention are tiny flows feeding a massive stock. Every protected window adds to your "deep work capital." Every interruption subtracts from it. "Systems Thinking" predicts the outcome: reinforcing loops mean the rich get richer. The people who protect focus today find it easier to protect tomorrow.`,
        'faithful': `Keep showing up. The first week of deep work blocks feels uncomfortable — your brain will protest, invent reasons to check your phone, suddenly remember urgent emails. Push through. By week two, the resistance fades. By week three, you'll start to crave the silence. By week four, you'll look back at your fragmented days and wonder how you ever got anything done.`,
        'resonator': `Every notification you ignore is a small act of self-respect. Every distraction you decline is a quiet declaration that your thinking matters more than someone else's urgency. These aren't just productivity decisions — they're identity decisions. Each one answers the question: "Who is in charge of my attention — me, or the world?"`,
        'collector': `Bottom line: deep work is a skill, not a talent. Skills can be trained. Start with 25-minute Pomodoros (easy win), graduate to 90-minute blocks within a month. Track your deep hours weekly — aim for 15-20 per week. Books: "Deep Work" by Newport (the canonical text), "Make Time" by Knapp (daily tactics), "Indistractable" by Eyal (the psychology of distraction).`,
      },
    },
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
    paragraphVariants: {
      0: {
        'deep-diver': `Systems thinking begins where reductionism ends. Donella Meadows showed that the most powerful interventions in any system target not its parameters or buffers but its paradigm — the shared idea around which the system organizes itself. Most analysis stops at cause and effect. Systems thinking looks one level deeper: at the structure that makes certain causes inevitable.`,
        'explorer': `Everything is connected — your attention, your team, your morning coffee. Systems thinking is the discipline of seeing those connections before they become crises. A stock market crash isn't an event. It's the visible tip of a thousand reinforcing loops that have been compounding in silence. The interesting question isn't "what happened?" It's "what structure made this inevitable?"`,
        'faithful': `You've already noticed something most people miss: the same patterns keep showing up in different places. A team that can't ship, a relationship that keeps circling back, a habit you can't break — these aren't separate problems. They're the same structure wearing different clothes. Systems thinking gives you a name for what you've been sensing.`,
        'resonator': `There's a particular frustration that comes from solving the same problem three times. You fix the bug, you resolve the conflict, you patch the process — and it comes back. Always. That frustration isn't a sign of failure. It's a signal that you've been treating symptoms. The structure beneath is still there, still producing the same results, still waiting for you to look deeper.`,
        'collector': `Systems thinking in one sentence: every system produces exactly the results it's designed to produce, regardless of anyone's intentions. The mental model is simple — stocks accumulate, flows change them, feedback loops accelerate or dampen the change, and delays make everything harder to predict. The practice is lifelong.`,
      },
      1: {
        'deep-diver': `The twelve leverage points Meadows identified are ranked counter-intuitively. The weakest interventions adjust numbers — budgets, thresholds, standards. The strongest shift paradigms. Between them lie feedback loops, information flows, and rules. Most organizations spend ninety percent of their energy on the weakest three points, then wonder why nothing changes at the structural level.`,
        'explorer': `Open any article in this blog and you'll find the same idea wearing a different hat. "Deep Work" is your attention system. "Design Principles" is your tool system. "Learning Strategies" is your knowledge system. They're all connected by feedback loops — the better you focus, the more you learn, the better your tools become, the deeper you can focus again.`,
        'faithful': `Here's what I want you to know: the leverage point isn't always where it feels urgent. The meeting that's on fire isn't the system — it's the output. The leverage is upstream: the information that didn't flow, the delay nobody accounted for, the reinforcing loop that rewarded the wrong behavior. You already know this intuitively. Systems thinking just gives you a map for what your gut already sees.`,
        'resonator': `Think about the last time a well-meaning change made things worse. A new process that added bureaucracy. A feature that created technical debt. A rule that produced the behavior it was designed to prevent. That's not irony — it's a balancing loop. The system pushed back. When you feel that pushback, you've found the edge of the system. That's where the real intervention lives.`,
        'collector': `Actionable framework: stocks and flows in thirty seconds. A stock is anything that accumulates — knowledge, money, trust, technical debt. A flow is anything that changes the stock — learning, spending, keeping promises, cutting corners. Every leverage point is either a change to a flow rate or a change to the rules governing the feedback loop. Start there.`,
      },
      2: {
        'deep-diver': `The paradigm IS the system. Meadows again: "People who have managed to intervene in systems at the level of paradigm hit a leverage point that totally transforms systems." The invisible structure isn't hiding. It's what you see with. The shift from seeing events to seeing patterns to seeing structure to seeing paradigm — that's the entire journey of systems thinking, compressed into one sentence.`,
        'explorer': `Now look at the next article — "Design Principles." It's the same idea inverted. Systems thinking asks "what structure produced this behavior?" Design asks "what behavior do I want this structure to produce?" One reads the world. The other writes it. Read them back to back and you'll see the whole loop.`,
        'faithful': `Keep returning. The lens sharpens. The first time you look for feedback loops, you'll miss them. The second time, you'll catch them in other people's systems. The third time, you'll see them in your own. And once you see the structure in your own habits, your own team, your own career — you won't be able to unsee it. That's not a burden. That's the gift.`,
        'resonator': `What invisible structure is shaping your life right now? Not your goals — those are visible. Not your habits — those are downstream. The structure. The pattern of information flow, the delays you don't account for, the reinforcing loops that amplify your worst days and your best ones. That structure is writing the story. You're just reading it.`,
        'collector': `Books: "Thinking in Systems" by Donella Meadows (the essential primer). "The Fifth Discipline" by Peter Senge (organizations as systems). Exercise: pick one recurring frustration in your life and map it as a causal loop diagram. Draw the variables, draw the arrows, label the delays. You'll see it differently — permanently.`,
      },
    },
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
    paragraphVariants: {
      0: {
        'deep-diver': `The data is unambiguous: a Google study of 10,000 managers found that technical expertise ranked last among the eight factors that predict team effectiveness. Communication, listening, and empathy ranked first, second, and third. The mechanism isn't mysterious — clear communication reduces coordination overhead, eliminates rework caused by misunderstanding, and surfaces problems before they compound.`,
        'explorer': `Communication is the meta-skill that connects everything in this corpus. "Deep Work" without communication is isolated brilliance. "Systems Thinking" without communication is a model in a vacuum. "Design Principles" without communication is a tool nobody can use. Even "Art of Challenging" is really about communicating disagreement in a way that preserves the relationship and advances the truth.`,
        'faithful': `You already communicate better than you think. The gap isn't skill — it's awareness. Most technical people default to one mode: precise, detailed, exhaustive. That mode works beautifully for documentation and code reviews. But it fails in meetings, presentations, and one-on-ones where the audience needs a different kind of clarity. The trick isn't to become someone else — it's to add one more mode to your repertoire.`,
        'resonator': `Remember the last time someone explained something complex to you and you actually understood it — not nodded along, but genuinely grasped it? How did that feel? Like a door opening. That's what great communicators do: they open doors for other people. Not by dumbing things down, but by finding the perspective that makes the complexity click. Every time you communicate clearly, you give someone that gift.`,
        'collector': `Three frameworks that upgrade technical communication immediately: the Minto Pyramid (conclusion first, then supporting points, then details), the Situation-Behavior-Impact model for feedback (removes judgment, keeps facts), and the "So what?" test — after every paragraph you write, ask "so what?" If you can't answer it in one sentence, cut it.`,
      },
      1: {
        'deep-diver': `The distinction between simplification and clarification is critical. Simplification removes information — it makes things easier but less accurate. Clarification restructures information — it makes things equally accurate but more accessible. Richard Feynman was not a simplifier. He found analogies and frameworks that carried the full complexity of quantum electrodynamics without distortion. That's the standard.`,
        'explorer': `This principle appears in "Design Principles" as "good design disappears" — the interface doesn't simplify the task, it clarifies the path. It appears in "Learning Strategies" as the Feynman technique — teaching forces you to find the precise words. It appears in "Systems Thinking" as the difference between a model that captures feedback loops and one that ignores them. Clarification preserves structure. Simplification destroys it.`,
        'faithful': `The practical test for clarity is simple: can you explain it to someone outside your field in under two minutes? If not, you don't understand it well enough yet. That's not an insult — it's a diagnostic. The areas where you can't explain clearly are exactly the areas where your own understanding has gaps. Use communication as a learning tool. Try explaining your work to a non-technical friend. The parts where you stumble are the parts you need to revisit.`,
        'resonator': `The precise words matter more than the many words. One sentence that captures the truth cleanly does more work than five paragraphs that circle it. Finding that sentence is hard — it means cutting everything that almost says what you mean until only what you exactly mean remains. That discipline is a form of respect: respect for your idea, and respect for the person who will receive it.`,
        'collector': `Quick communication upgrades: (1) Replace "I think" with "the data suggests" or just state the point directly. (2) Replace "basically" and "essentially" with nothing — they add zero meaning. (3) Use the "inverted pyramid" — lead with what matters most, add context after. (4) For email: one idea per message, action items first. For presentations: make the audience curious before you make them informed.`,
      },
      2: {
        'deep-diver': `The amplification effect is multiplicative, not additive. If your technical skill is 9/10 and your communication is 3/10, your organizational impact isn't 12 — it's 27. The compound effect works in reverse too: brilliant work that nobody understands, nobody adopts, and nobody builds upon might as well not exist. The history of science is littered with simultaneous discoveries where the credit went not to the first discoverer but to the one who communicated it most clearly.`,
        'explorer': `Follow the thread: "Design Principles" says tools amplify their users' capabilities. "Systems Thinking" says feedback loops amplify initial conditions. "Learning Strategies" says teaching amplifies retention. Communication is the human amplifier — it takes what's inside your head and multiplies its impact by the number of people who understand it. The skill that amplifies every other skill is, itself, the most important skill to invest in.`,
        'faithful': `Keep practicing. Every conversation is a rep. Every email is an exercise in clarity. Every meeting where you choose to listen before speaking is a deposit in the trust account. The compound interest on communication practice is staggering — six months of deliberate effort and you'll be unrecognizable. Not because you became a different person, but because the person you already are can finally be heard clearly.`,
        'resonator': `Communication is the skill that makes your other skills visible. Your technical work might be brilliant. Your design sense might be extraordinary. Your strategic thinking might be years ahead. But if you can't make other people see what you see, you'll spend your career being underestimated by people who are less capable but more articulate. That's not their fault. It's a solvable problem.`,
        'collector': `The one book: "On Writing Well" by William Zinsser. It's about clarity, not literature, and it applies to emails, docs, and presentations as much as essays. The one exercise: rewrite your last three emails with half the words. The one habit: before hitting send on any message, read it aloud. If you stumble reading it, they'll stumble understanding it.`,
      },
    },
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
    paragraphVariants: {
      0: {
        'deep-diver': `The four strategies listed — deliberate practice, spaced repetition, interleaving, and teaching — share a common mechanism: they all force retrieval. Cognitive science calls it the "testing effect": the act of recalling information strengthens memory far more than re-reading or highlighting. Passive review creates the illusion of knowledge through recognition. Active retrieval creates genuine knowledge through reconstruction.`,
        'explorer': `Notice how learning strategies are the connective tissue of this corpus. "Deep Work" provides the focused time that deliberate practice requires. "Systems Thinking" provides the mental models that organize learning. "Communication" amplifies learning through teaching. And "Design Principles" is really applied learning — understanding your users deeply enough to build what they need.`,
        'faithful': `You don't need to master all four strategies at once. Start with one: teaching. The next time you learn something, explain it to someone — a colleague, a friend, a rubber duck on your desk. The act of articulating what you know reveals what you don't. That gap between "I understand this" and "I can explain this" is where real learning happens. Everything else builds from there.`,
        'resonator': `Think about something you know deeply — not from a book, but from experience. Maybe a programming language, a hobby, a relationship. How did you really learn it? Not by reading about it once. By returning to it, struggling with it, teaching it, forgetting and relearning it. The strategies aren't hacks — they're descriptions of how your brain naturally builds lasting knowledge when you stop fighting it.`,
        'collector': `The four strategies, compressed: (1) Deliberate practice — work at the edge of your ability, not your comfort zone. (2) Spaced repetition — review at increasing intervals (1 day, 3 days, 7 days, 21 days). (3) Interleaving — mix topics, don't block them. (4) Teaching — explain it, find the gaps, fill them. Tools: Anki for spaced repetition, Feynman technique for teaching. Book: "Make It Stick" for the science behind all four.`,
      },
      1: {
        'deep-diver': `The neuroscience distinguishes between recognition and recall. Recognition says "I've seen this before" — it's easy, feels good, and produces almost zero long-term retention. Recall says "I can reconstruct this from memory" — it's effortful, feels frustrating, and produces durable learning. The uncomfortable truth: if your studying feels easy, you're probably not learning. Productive struggle is the signal. Fluency is the noise.`,
        'explorer': `"Effective Communication" makes the same point about writing: the precise words matter more than the many words. "Design Principles" shows that reducing cognitive load doesn't mean reducing challenge — it means removing unnecessary friction so the learner can focus on productive difficulty. Every article in this corpus distinguishes between surface ease and genuine depth.`,
        'faithful': `Here's a simple test for whether you're learning: are you occasionally confused? If the answer is no, you're in your comfort zone, and your comfort zone is where learning goes to die. The transition from passive reading to active engagement feels like stepping from solid ground onto a moving walkway — slightly unstable, slightly uncomfortable. That's the feeling of your brain building new connections. Lean into it.`,
        'resonator': `The difference between someone who reads a hundred books and someone who transforms from one isn't about the books — it's about the willingness to be changed by what you read. Most people read to confirm what they already think. The rare ones read to discover what they didn't know they didn't know. That kind of reading is uncomfortable. It should be. You're remodeling the house while living in it.`,
        'collector': `Quick diagnostic: after you finish an article or chapter, close it and write three sentences summarizing the key idea. If you can't, you consumed without processing. The "Feynman notebook" technique: dedicate a notebook to explaining things simply. Every time you learn something, write an entry as if teaching a beginner. The gaps in your explanation are the gaps in your understanding.`,
      },
      2: {
        'deep-diver': `Mental models are the ultimate compression algorithm. A single model — like "feedback loops" from systems thinking, or "opportunity cost" from economics — can explain thousands of specific phenomena. Charlie Munger's "latticework of mental models" approach argues that 80-90 models from core disciplines provide more explanatory power than deep expertise in any single field. The models aren't just knowledge — they're the operating system that processes all future knowledge.`,
        'explorer': `This is the master pattern: every article in this corpus is itself a mental model. "Systems Thinking" is a lens for seeing structure. "Deep Work" is a framework for protecting attention. "Communication" is a model for translating between minds. The goal of reading all of them isn't accumulation — it's building a connected lattice where each model strengthens the others.`,
        'faithful': `Keep building. Every new model you learn connects to the ones you already have. "Feedback loops" connects to "deliberate practice" (reinforcing loop: practice improves skill, skill motivates practice). "Opportunity cost" connects to "deep work" (every hour in a meeting is an hour not in flow). The connections compound. After a year of collecting and connecting models, you'll see structure everywhere — in meetings, in relationships, in the news. Not because the world changed, but because your lens sharpened.`,
        'resonator': `The best learners don't memorize — they connect. They take an idea from economics and apply it to relationships. They see a pattern in nature and recognize it in their code. This isn't a talent — it's a practice. Every time you ask "what does this remind me of?" you're building a connection. Every time you ask "where else does this pattern appear?" you're strengthening the lattice. The framework isn't the knowledge. The framework is what makes the knowledge useful.`,
        'collector': `Start building your lattice: learn one model per week. Write it down, find three examples in your own life, teach it to someone. After six months, you'll have 25 models and dozens of connections between them. Resources: "Super Thinking" by Gabriel Weinberg (a curated collection), Farnam Street blog (free, daily models), and Charlie Munger's "Poor Charlie's Almanack" (the original argument for the latticework approach).`,
      },
    },

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
    paragraphVariants: {
      0: {
        'deep-diver': `Don Norman's framework of affordances, signifiers, and mappings provides the theoretical backbone. An affordance is a possible action — a button can be pressed, a handle can be pulled. A signifier communicates that affordance — the button's shadow, the handle's shape. The gap between what's possible and what's visible is where user frustration lives. Developer tools that fail usually fail not because they lack features but because their affordances are invisible.`,
        'explorer': `"Systems Thinking" shows up here in disguise: a tool IS a system, with inputs, outputs, feedback loops, and emergent behavior. "Deep Work" connects because tools that minimize cognitive load enable flow states. "Learning Strategies" is relevant because developers learn tools through the same mechanisms — deliberate practice, feedback, iteration. Every design principle is really a learning principle applied to interfaces.`,
        'faithful': `You already know good design when you feel it. It's the tool you reach for without thinking. The one where the first thing you try is usually the right thing. That's not an accident — it's the result of someone making hundreds of small decisions about what to show, what to hide, and what to make effortless. You don't need a design degree to build good tools. You need empathy, patience, and the willingness to watch someone use your creation and feel confused.`,
        'resonator': `Think of your favorite tool — the one you'd actually miss if it disappeared. What makes it different? Chances are, it never makes you feel stupid. It never surprises you with behavior you didn't expect. It never makes you hunt for something that should be obvious. That's not minimalism or aesthetic — that's respect. Good design is what happens when someone decided you were worth the effort of getting it right.`,
        'collector': `The three principles that matter most: (1) Immediate feedback — every action produces a visible response within 100ms. (2) Progressive disclosure — show the minimum first, reveal complexity on demand. (3) Error prevention over error handling — make the wrong action impossible or obviously wrong before the user commits. Books: "The Design of Everyday Things" by Don Norman (foundations), "Refactoring UI" by Adam Wathan (practical).`,
      },
      1: {
        'deep-diver': `The paradox of opinionated design is that constraints enable creativity. A blank canvas paralyzes; a canvas with three colors and a grid liberates. The Unix philosophy ("do one thing well") is the most successful opinionated design in computing history. Tools that try to be everything to everyone end up being nothing to anyone. The courage to exclude features is the hallmark of mature design thinking.`,
        'explorer': `This maps directly onto "Art of Challenging" — the best designers challenge the assumption that more features equals more value. It maps onto "Systems Thinking" — every added feature is a new node in the system, increasing complexity and the probability of emergent bugs. And it maps onto "Communication" — opinionated tools communicate a clear point of view, just like effective communicators do.`,
        'faithful': `In practice: pick three things your tool must do exceptionally well. Say no to everything else. Not forever — but until those three things are so smooth that users don't even notice them. "Making the right thing easy" means investing the vast majority of your design effort in the core workflow. "Making the wrong thing hard" means simply not building the distractions. The absence of features IS a feature.`,
        'resonator': `The best tools feel like they were made for you — not for everyone, for you. That feeling doesn't come from flexibility. It comes from a designer who made specific choices about how the tool should be used and had the conviction to commit. Every time a tool asks you to configure something that should have a sensible default, that's a designer who couldn't decide. Good design is opinionated. Great design is opinionated and right.`,
        'collector': `The opinionated design checklist: (1) Can a new user accomplish the primary task within 60 seconds of opening the tool? (2) Are there fewer than 5 configuration options visible by default? (3) Does the tool have a clear "happy path" that works for 80% of users? If yes to all three, you're on the right track. Example: GitHub's pull request flow — opinionated, collaborative, nearly zero configuration.`,
      },
      2: {
        'deep-diver': `The "architecture of understanding" framing is not metaphorical — it's literal. Cognitive load theory (Sweller, 1988) distinguishes intrinsic load (the complexity of the task itself) from extraneous load (the complexity imposed by poor presentation). Good design eliminates extraneous load so the user's full cognitive capacity is available for intrinsic load. This is why hot-reloading matters: it eliminates the extraneous load of context-switching between editor and browser.`,
        'explorer': `Every article in this corpus is an architecture of understanding. "Systems Thinking" builds a framework for seeing structure. "Deep Work" builds a framework for protecting attention. "Learning Strategies" builds frameworks for acquiring knowledge. "Communication" builds a bridge between minds. The design is never the decoration. It's always the structure that makes understanding possible.`,
        'faithful': `The next time you build something — a feature, a tool, a document — ask one question before you ship: "Does this help the user understand, or does it just look impressive?" If it's the latter, cut it. The most powerful design principle is also the simplest: get out of the user's way. Make the understanding effortless, and the decoration becomes irrelevant.`,
        'resonator': `Strip away the visuals for a moment and ask: what is this tool trying to help someone understand? Not "what does it do" — "what does someone come to understand by using it?" The best tools don't just solve problems — they change how users see the problem. After using a well-designed debugger, you don't just find the bug — you understand the system better. That's the architecture of understanding in action.`,
        'collector': `Quick design audit for your current project: (1) Count the clicks to complete the primary task — aim for fewer than 5. (2) Show it to someone without instructions — count the questions they ask. Each question is a design failure. (3) Remove one element from every screen. If the screen still works, the element was noise. The principle: if design is the architecture of understanding, every unnecessary element is a wall where there should be a door.`,
      },
    },
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

// TODO: WORLDVIEW_BEST was removed with WorldviewDoors.
// If worldview-specific article picking is needed later,
// add a curated map or use getArticlesByWorldview() + ranking.
