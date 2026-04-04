'use client';

import { useState, useEffect } from 'react';

interface Section {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  sections: Section[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const [currentSection, setCurrentSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for header

      // Find the current section based on scroll position
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setCurrentSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  // TODO: Add smooth scroll to section when clicking links
  // TODO: Add progress indicator showing how far into each section

  if (sections.length === 0) return null;

  return (
    <div className="border border-border rounded-lg p-4 sticky top-4">
      <h3 className="text-sm font-semibold mb-3 text-primary">On this page</h3>
      <ul className="space-y-2 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block py-1 px-2 rounded transition-colors ${
                currentSection === section.id
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
