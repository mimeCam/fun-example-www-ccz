import { FILTER_TEMPLATES } from '@/types/filter';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Client-side only components to avoid hydration issues
const SearchBar = dynamic(() => import('@/components/SearchBar'), { ssr: false });
const ReturnVisitorGreeting = dynamic(
  () => import('@/components/return/ReturnVisitorGreeting').then(m => ({ default: m.ReturnVisitorGreeting })),
  { ssr: false }
);

export default function Home() {
  const filters = Object.entries(FILTER_TEMPLATES).map(([key, value]) => ({
    ...value,
    id: key,
  }));

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-white">
            The Anti-Blog
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            A blog that tries to talk most people out of reading it —
            <span className="text-accent font-semibold"> so the right people can&apos;t stop</span>
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Challenging ideas for those who question assumptions. Choose your perspective below.
          </p>

          {/* Return-visit recognition — archetype-aware for returning readers */}
          <ReturnVisitorGreeting />

          {/* Search Bar */}
          <div className="mt-8">
            <SearchBar />
          </div>
        </div>

        {/* Worldview selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {filters.map((filter) => (
            <Link
              key={filter.id}
              href={`/worldview/${filter.type}`}
              className="group block bg-surface border border-surface hover:border-primary rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="mb-4">
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">
                  {filter.type}
                </span>
                <h3 className="text-2xl font-display font-bold text-white mt-2 mb-3 group-hover:text-accent transition-colors">
                  {filter.title}
                </h3>
                <p className="text-gray-400 mb-4">
                  {filter.description}
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm text-gray-500 mb-2">If you believe...</p>
                <ul className="space-y-1">
                  {filter.beliefs.slice(0, 2).map((belief, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>{belief}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 text-primary font-medium group-hover:text-accent transition-colors">
                Explore {filter.type} ideas →
              </div>
            </Link>
          ))}
        </div>

        {/* Footer explanation */}
        <div className="text-center text-mist text-sm space-y-2">
          <p>
            No algorithms, no feeds. Just ideas for people who choose to engage with them.
          </p>
          <div className="flex justify-center gap-6 text-xs">
            <Link href="/mirror" className="text-[#f0c674]/60 hover:text-[#f0c674] transition-colors">
              Your Mirror
            </Link>
            <Link href="/resonances" className="text-rose/60 hover:text-rose transition-colors">
              Your Resonances
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
