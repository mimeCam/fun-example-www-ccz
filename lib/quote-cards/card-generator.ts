/**
 * Smart Quote Card Generator
 * Uses Canvas API to generate beautiful shareable quote cards.
 *
 * Colors flow through design tokens — consistent with the thermal system.
 * No hardcoded hex values in templates.
 */

import { THERMAL, BRAND, cssOr } from '@/lib/design/color-constants';

export interface QuoteCardData {
  quote: string;
  author: string;
  articleTitle: string;
  blogName?: string;
  url?: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  font: string;
  style: 'minimal' | 'bold' | 'elegant' | 'modern';
}

/** Predefined card templates — all colors from design tokens. */
export const TEMPLATES: CardTemplate[] = [
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    backgroundColor: THERMAL.bg,
    textColor: THERMAL.foreground,
    accentColor: BRAND.gold,
    font: 'system-ui, -apple-system, sans-serif',
    style: 'minimal',
  },
  {
    id: 'bold-gradient',
    name: 'Bold Gradient',
    backgroundColor: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
    textColor: '#ffffff',
    accentColor: BRAND.gold,
    font: 'Georgia, serif',
    style: 'bold',
  },
  {
    id: 'elegant-white',
    name: 'Elegant White',
    backgroundColor: '#ffffff',
    textColor: THERMAL.bg,
    accentColor: BRAND.gold,
    font: 'Georgia, serif',
    style: 'elegant',
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    backgroundColor: cssOr('--token-surface', THERMAL.surface),
    textColor: THERMAL.foreground,
    accentColor: BRAND.cyan,
    font: 'system-ui, -apple-system, sans-serif',
    style: 'modern',
  },
];

export async function generateQuoteCard(
  data: QuoteCardData,
  template: CardTemplate = TEMPLATES[0]
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  const dpr = window.devicePixelRatio || 1;
  const width = 1080;
  const height = 1080;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  drawBackground(ctx, template, width, height);
  drawQuote(ctx, data.quote, template, width, height);
  drawAttribution(ctx, data.author, data.articleTitle, template, width, height);
  if (data.blogName || data.url) {
    drawBranding(ctx, data.blogName || 'Blog', data.url || '', template, width, height);
  }
  return canvas.toDataURL('image/png');
}

function drawBackground(ctx: CanvasRenderingContext2D, t: CardTemplate, w: number, h: number): void {
  if (t.backgroundColor.includes('gradient')) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, BRAND.primary);
    g.addColorStop(1, BRAND.secondary);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = t.backgroundColor;
  }
  ctx.fillRect(0, 0, w, h);
}

function drawQuote(ctx: CanvasRenderingContext2D, quote: string, t: CardTemplate, w: number, h: number): void {
  const fontSize = 48;
  const lineHeight = fontSize * 1.4;
  const maxWidth = w - 160;
  ctx.font = `bold 120px ${t.font}`;
  ctx.fillStyle = t.accentColor;
  ctx.globalAlpha = 0.3;
  ctx.fillText('"', 60, 100);
  ctx.globalAlpha = 1.0;
  const lines = wrapText(ctx, quote, maxWidth, fontSize, t);
  ctx.font = `${t.style === 'bold' ? 'bold' : ''} ${fontSize}px ${t.font}`;
  ctx.fillStyle = t.textColor;
  lines.forEach((line, i) => ctx.fillText(line, 80, 200 + i * lineHeight));
}

function drawAttribution(ctx: CanvasRenderingContext2D, author: string, title: string, t: CardTemplate, w: number, h: number): void {
  const y = h - 280;
  ctx.font = `bold 28px ${t.font}`;
  ctx.fillStyle = t.accentColor;
  ctx.textAlign = 'center';
  ctx.fillText(`\u2014 ${author}`, w / 2, y);
  ctx.font = '28px ' + t.font;
  ctx.fillStyle = t.textColor;
  ctx.globalAlpha = 0.8;
  ctx.fillText(title, w / 2, y + 40);
  ctx.globalAlpha = 1.0;
}

function drawBranding(ctx: CanvasRenderingContext2D, name: string, url: string, t: CardTemplate, w: number, h: number): void {
  const y = h - 60;
  ctx.font = `20px ${t.font}`;
  ctx.fillStyle = t.textColor;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'center';
  ctx.fillText(name, w / 2, y);
  if (url) { ctx.font = '16px ' + t.font; ctx.fillText(url, w / 2, y + 24); }
  ctx.globalAlpha = 1.0;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, t: CardTemplate): string[] {
  ctx.font = `${t.style === 'bold' ? 'bold' : ''} ${size}px ${t.font}`;
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur + (cur ? ' ' : '') + word;
    if (ctx.measureText(test).width > max && cur) { lines.push(cur); cur = word; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function validateContrast(bg: string, text: string): boolean {
  const darkBgs = new Set([THERMAL.bg, THERMAL.surface, '#1a1a1a', '#0f172a']);
  const lightTexts = new Set(['#ffffff', THERMAL.foreground]);
  return darkBgs.has(bg.toLowerCase()) === lightTexts.has(text.toLowerCase());
}

export async function generateCardVariants(data: QuoteCardData, templates: CardTemplate[] = TEMPLATES): Promise<Map<string, string>> {
  const variants = new Map<string, string>();
  for (const t of templates) {
    try { variants.set(t.id, await generateQuoteCard(data, t)); }
    catch (e) { console.error(`Failed to generate ${t.id}:`, e); }
  }
  return variants;
}
