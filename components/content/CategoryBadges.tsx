/**
 * Category Badges Component
 *
 * Displays article categories as colorful badges
 */

'use client';

import { Category } from '@/types/category';
import Link from 'next/link';

interface CategoryBadgesProps {
  categories: Category[];
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryBadges({ categories, size = 'md' }: CategoryBadgesProps) {
  if (categories.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className={`
            inline-flex items-center gap-2 rounded-full
            transition-all hover:opacity-80 hover:scale-105
            ${sizeClasses[size]}
          `}
          style={{
            backgroundColor: category.color
              ? `${category.color}20`
              : 'rgba(99, 102, 241, 0.2)',
            color: category.color || '#6366f1',
            border: `1px solid ${category.color || '#6366f1'}40`,
          }}
        >
          {category.color && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          )}
          <span className="font-medium">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}

/**
 * Single category badge variant
 */
interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  linked?: boolean;
}

export function CategoryBadge({
  category,
  size = 'md',
  linked = true,
}: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const badge = (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full
        transition-all hover:opacity-80 hover:scale-105
        ${sizeClasses[size]}
        ${linked ? 'cursor-pointer' : ''}
      `}
      style={{
        backgroundColor: category.color
          ? `${category.color}20`
          : 'rgba(99, 102, 241, 0.2)',
        color: category.color || '#6366f1',
        border: `1px solid ${category.color || '#6366f1'}40`,
      }}
    >
      {category.color && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      )}
      <span className="font-medium">{category.name}</span>
    </span>
  );

  if (linked) {
    return <Link href={`/categories/${category.slug}`}>{badge}</Link>;
  }

  return badge;
}
