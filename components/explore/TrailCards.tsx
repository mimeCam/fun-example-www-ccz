'use client';

import Link from 'next/link';
import { Trail } from '@/types/trail';

interface TrailCardsProps {
  trails: Trail[];
}

export default function TrailCards({ trails }: TrailCardsProps) {
  if (trails.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-foreground text-xl font-semibold">
          Curiosity Trails
        </h2>
        <div className="flex-1 h-px bg-fog/40" />
      </div>

      <div className="space-y-4">
        {trails.map((trail) => (
          <Link key={trail.id} href={`/trails/${trail.id}`} className="block group">
            <div className="bg-surface rounded-xl p-5 border-l-2 border-gold/40 shadow-void hover:shadow-rise transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-display text-foreground font-semibold group-hover:text-gold transition-colors">
                    {trail.name}
                  </h3>
                  <p className="text-mist text-sm mt-1">{trail.description}</p>
                </div>
                <div className="text-mist/60 text-xs whitespace-nowrap">
                  {trail.articleIds.length} articles · {trail.estimatedTime}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
