/**
 * ResonanceExport — Canvas-based PNG export of the reader's resonances.
 * Follows the pattern from quick-mirror-card-generator.ts: pure Canvas, zero deps.
 * Produces a 1080×1350 image (Instagram-portrait friendly).
 * Colors resolved from CSS design tokens at runtime — single source of truth.
 */
'use client';

import { useCallback } from 'react';
import type { ResonanceWithArticle } from '@/types/resonance-display';
import { THERMAL, BRAND, cssOr } from '@/lib/design/color-constants';

const W = 1080;
const H = 1350;
const PAD = 80;

interface Colors {
  rose: string;
  text: string;
  muted: string;
  bgStart: string;
  bgEnd: string;
  gold: string;
}

function resolveColors(): Colors {
  return {
    rose: cssOr('--rose', BRAND.rose),
    text: cssOr('--token-foreground', THERMAL.foreground),
    muted: cssOr('--mist', BRAND.mist),
    bgStart: cssOr('--token-bg', THERMAL.bg),
    bgEnd: cssOr('--token-surface', THERMAL.surface),
    gold: cssOr('--gold', BRAND.gold),
  };
}

interface Props {
  resonances: ResonanceWithArticle[];
}

function initCanvas() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  return { ctx, canvas };
}

function drawBg(ctx: CanvasRenderingContext2D, c: Colors) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.bgStart);
  g.addColorStop(1, c.bgEnd);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawHeader(ctx: CanvasRenderingContext2D, c: Colors) {
  ctx.fillStyle = c.rose;
  ctx.font = '600 14px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR RESONANCES', W / 2, PAD);
  ctx.fillStyle = c.text;
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.fillText('The Book of You', W / 2, PAD + 38);
}

function truncText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function drawEntry(ctx: CanvasRenderingContext2D, c: Colors, r: ResonanceWithArticle, y: number): number {
  const innerW = W - PAD * 2 - 40;
  if (r.quote) {
    ctx.fillStyle = `${c.text}aa`;
    ctx.font = 'italic 16px "Inter", sans-serif';
    ctx.fillText(truncText(ctx, `"${r.quote}"`, innerW), PAD + 20, y);
    y += 28;
  }
  ctx.fillStyle = c.rose;
  ctx.font = 'italic 15px "Inter", sans-serif';
  ctx.fillText(truncText(ctx, r.resonanceNote, innerW), PAD + 20, y);
  y += 24;
  ctx.fillStyle = c.muted;
  ctx.font = '12px "Inter", sans-serif';
  ctx.fillText(truncText(ctx, r.articleTitle, innerW), PAD + 20, y);
  return y + 16;
}

function drawBranding(ctx: CanvasRenderingContext2D, c: Colors) {
  ctx.fillStyle = `${c.muted}66`;
  ctx.font = '11px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('theanti.blog', W / 2, H - 40);
}

function drawSeparator(ctx: CanvasRenderingContext2D, c: Colors, y: number) {
  ctx.strokeStyle = `${c.gold}44`;
  ctx.beginPath();
  ctx.moveTo(PAD + 20, y - 8);
  ctx.lineTo(PAD + 120, y - 8);
  ctx.stroke();
}

function generateImage(resonances: ResonanceWithArticle[]): string {
  const { ctx, canvas } = initCanvas();
  const c = resolveColors();
  drawBg(ctx, c);
  drawHeader(ctx, c);
  let y = PAD + 80;
  const maxEntries = Math.min(resonances.length, 5);
  for (let i = 0; i < maxEntries; i++) {
    drawSeparator(ctx, c, y);
    y = drawEntry(ctx, c, resonances[i], y);
  }
  drawBranding(ctx, c);
  return canvas.toDataURL('image/png');
}

export default function ResonanceExport({ resonances }: Props) {
  const handleExport = useCallback(() => {
    const dataUrl = generateImage(resonances);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'my-resonances.png';
    a.click();
  }, [resonances]);

  return (
    <div className="text-center">
      <button onClick={handleExport}
        className="px-sys-5 py-sys-3 bg-surface border border-fog/40 text-mist text-sys-caption
          rounded-sys-medium hover:border-rose/40 hover:text-rose transition-all duration-enter">
        Export as Image
      </button>
    </div>
  );
}
