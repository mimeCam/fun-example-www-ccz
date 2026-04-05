'use client';

import { useState, useEffect } from 'react';
import { generateQuoteCard, TEMPLATES, QuoteCardData, CardTemplate } from '@/lib/quote-cards/card-generator';
import { exportQuoteCard } from '@/lib/quote-cards/export-utils';

interface QuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: string;
  author: string;
  articleTitle: string;
  blogName?: string;
  url?: string;
}

/**
 * Quote Card Modal Component
 * Preview and download beautiful quote cards.
 *
 * Features:
 * - Live card preview
 * - Template selection
 * - Download or copy to clipboard
 * - Loading states
 * - Error handling
 */
export function QuoteCardModal({
  isOpen,
  onClose,
  quote,
  author,
  articleTitle,
  blogName = 'Blog',
  url,
}: QuoteCardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(TEMPLATES[0]);
  const [cardDataUrl, setCardDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Generate card when template changes
  useEffect(() => {
    if (isOpen && quote) {
      generateCard();
    }
  }, [isOpen, selectedTemplate, quote]);

  const generateCard = async () => {
    setIsGenerating(true);
    try {
      const data: QuoteCardData = {
        quote,
        author,
        articleTitle,
        blogName,
        url,
      };

      const dataUrl = await generateQuoteCard(data, selectedTemplate);
      setCardDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate quote card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!cardDataUrl) return;

    setIsExporting(true);
    try {
      await exportQuoteCard(cardDataUrl, 'download', {
        filename: `${blogName.toLowerCase().replace(/\s+/g, '-')}-quote.png`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!cardDataUrl) return;

    setIsExporting(true);
    try {
      await exportQuoteCard(cardDataUrl, 'clipboard');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">Quote Card</h2>
              <p className="text-sm text-gray-400 mt-1">
                Create a beautiful shareable image
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Preview */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>

                {isGenerating ? (
                  <div className="w-full aspect-square bg-surface/80 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin text-4xl mb-4">⏳</div>
                      <p className="text-gray-400">Generating card...</p>
                    </div>
                  </div>
                ) : cardDataUrl ? (
                  <div className="relative w-full">
                    <img
                      src={cardDataUrl}
                      alt="Quote card preview"
                      className="w-full rounded-lg shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-surface/80 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Failed to generate card</p>
                  </div>
                )}

                {/* Quote Text Preview */}
                <div className="mt-4 p-4 bg-surface/80 rounded-lg w-full">
                  <p className="text-sm text-gray-300 italic mb-2">
                    &ldquo;{quote.substring(0, 150)}{quote.length > 150 ? '...' : ''}&rdquo;
                  </p>
                  <p className="text-xs text-gray-500">
                    — {author}, {articleTitle}
                  </p>
                </div>
              </div>

              {/* Template Selection & Actions */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-4">Choose Style</h3>

                {/* Template Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      disabled={isGenerating}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${selectedTemplate.id === template.id
                          ? 'border-primary bg-primary/20'
                          : 'border-gray-600 hover:border-gray-500'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-500"
                          style={{
                            background: template.backgroundColor.includes('gradient')
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : template.backgroundColor,
                          }}
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {template.style}
                          </p>
                        </div>
                      </div>
                      <div
                        className="w-full h-2 rounded"
                        style={{
                          background: template.backgroundColor.includes('gradient')
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : template.backgroundColor,
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-auto space-y-3">
                  <button
                    onClick={handleDownload}
                    disabled={!cardDataUrl || isExporting || isGenerating}
                    className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        Download Card
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopy}
                    disabled={!cardDataUrl || isExporting || isGenerating}
                    className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Copying...
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        Copy to Clipboard
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
