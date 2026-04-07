/**
 * Letter Card Generator — renders a Letter as 1080×1080 branded PNG via Canvas API.
 * Same pattern as quick-mirror-card-generator.ts but for Return Letters.
 * No external deps — pure client-side Canvas.
 */

import type { Letter } from '@/types/book-narration';

const W = 1080;
const H = 1080;
const PAD = 100;
const GOLD = '#f0c674';
const TEXT = '#f0f0f5';
const MUTED = '#9494b8';

/* ─── Public API ─────────────────────────────────────────── */

export function generateLetterCard(letter: Letter): string {
  const { ctx, canvas } = initCanvas();
  let y = drawBackground(ctx);
  y = drawLabel(ctx, y);
  y = drawSalutation(ctx, letter.salutation, y);
  y = drawParagraph(ctx, letter.opening, y);
  for (const para of letter.body) y = drawParagraph(ctx, para, y);
  y = drawDivider(ctx, y);
  drawClosing(ctx, letter.closing, y);
  drawSignOff(ctx, letter.signOff);
  drawBranding(ctx);
  return canvas.toDataURL('image/png');
}

/* ─── Canvas bootstrap ──────────────────────────────────── */

function initCanvas(): { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  return { ctx, canvas };
}

/* ─── Drawing helpers (each ≤ 10 lines) ─────────────────── */

function drawBackground(ctx: CanvasRenderingContext2D): number {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#16213e');
  g.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return 140;
}

function drawLabel(ctx: CanvasRenderingContext2D, y: number): number {
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = `${GOLD}99`;
  ctx.textAlign = 'center';
  ctx.fillText('BASED ON HOW YOU READ\u2026', W / 2, y);
  return y + 60;
}

function drawSalutation(ctx: CanvasRenderingContext2D, text: string, y: number): number {
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  return y + 60;
}

function drawParagraph(ctx: CanvasRenderingContext2D, text: string, y: number): number {
  ctx.font = '26px Georgia, serif';
  ctx.fillStyle = `${TEXT}E6`;
  ctx.textAlign = 'center';
  const lines = wrapLines(ctx, text, W - PAD * 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * 40));
  return y + lines.length * 40 + 36;
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number): number {
  const hw = 60;
  ctx.strokeStyle = 'rgba(240,198,116,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - hw, y);
  ctx.lineTo(W / 2 + hw, y);
  ctx.stroke();
  return y + 40;
}

function drawClosing(ctx: CanvasRenderingContext2D, text: string, y: number): void {
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillStyle = `${TEXT}CC`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
}

function drawSignOff(ctx: CanvasRenderingContext2D, text: string): void {
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, H - 120);
}

function drawBranding(ctx: CanvasRenderingContext2D): void {
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = `${MUTED}80`;
  ctx.textAlign = 'center';
  ctx.fillText('theanti.blog', W / 2, H - 80);
}

/* ─── Text utility ──────────────────────────────────────── */

function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur + (cur ? ' ' : '') + w;
    if (ctx.measureText(test).width > max && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
