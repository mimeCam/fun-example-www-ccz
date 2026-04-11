/**
 * ResonanceExport — Canvas-based PNG export of the reader's resonances.
 * Follows the pattern from quick-mirror-card-generator.ts: pure Canvas, zero deps.
 * Produces a 1080×1350 image (Instagram-portrait friendly).
 */
'use client';

import { useCallback } from 'react';
import type { ResonanceWithArticle } from '@/types/resonance-display';

const W = 1080;
const H = 1350;
const PAD = 80;
const ROSE = '#e88fa7';
const TEXT = '#f0f0f5';
const MUTED = '#9494b8';
const BG_START = '#1a1a2e';
const BG_END = '#16213e';
const GOLD = '#f0c674';

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

function drawBg(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, BG_START);
  g.addColorStop(1, BG_END);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = ROSE;
  ctx.font = '600 14px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR RESONANCES', W / 2, PAD);
  ctx.fillStyle = TEXT;
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.fillText('The Book of You', W / 2, PAD + 38);
}

function truncText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function drawEntry(ctx: CanvasRenderingContext2D, r: ResonanceWithArticle, y: number): number {
  const innerW = W - PAD * 2 - 40;
  // Quote
  if (r.quote) {
    ctx.fillStyle = `${TEXT}aa`;
    ctx.font = 'italic 16px "Inter", sans-serif';
    const q = truncText(ctx, `"${r.quote}"`, innerW);
    ctx.fillText(q, PAD + 20, y);
    y += 28;
  }
  // Note
  ctx.fillStyle = ROSE;
  ctx.font = 'italic 15px "Inter", sans-serif';
  const note = truncText(ctx, r.resonanceNote, innerW);
  ctx.fillText(note, PAD + 20, y);
  y += 24;
  // Article title
  ctx.fillStyle = MUTED;
  ctx.font = '12px "Inter", sans-serif';
  ctx.fillText(truncText(ctx, r.articleTitle, innerW), PAD + 20, y);
  return y + 16;
}

function drawBranding(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = `${MUTED}66`;
  ctx.font = '11px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('theanti.blog', W / 2, H - 40);
}

function generateImage(resonances: ResonanceWithArticle[]): string {
  const { ctx, canvas } = initCanvas();
  drawBg(ctx);
  drawHeader(ctx);
  let y = PAD + 80;
  const maxEntries = Math.min(resonances.length, 5);
  for (let i = 0; i < maxEntries; i++) {
    // Separator line
    ctx.strokeStyle = `${GOLD}44`;
    ctx.beginPath();
    ctx.moveTo(PAD + 20, y - 8);
    ctx.lineTo(PAD + 120, y - 8);
    ctx.stroke();
    y = drawEntry(ctx, resonances[i], y);
  }
  drawBranding(ctx);
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
        className="px-5 py-2.5 bg-surface border border-fog/40 text-mist text-sm
          rounded-lg hover:border-rose/40 hover:text-rose transition-all duration-enter">
        Export as Image
      </button>
    </div>
  );
}
