/**
 * Letter Card Generator — renders a Letter as 1080×1080 branded PNG via Canvas API.
 * Same pattern as quick-mirror-card-generator.ts but for Return Letters.
 * No external deps — pure client-side Canvas.
 * Colors resolved from CSS design tokens at runtime — single source of truth.
 */

import type { Letter } from '@/types/book-narration';

const W = 1080;
const H = 1080;
const PAD = 100;

interface CanvasColors {
  gold: string;
  text: string;
  muted: string;
  bgStart: string;
  bgEnd: string;
}

function cssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveColors(): CanvasColors {
  return {
    gold: cssToken('--gold') || '#f0c674',
    text: cssToken('--token-foreground') || '#f0f0f5',
    muted: cssToken('--mist') || '#9494b8',
    bgStart: cssToken('--token-surface') || '#16213e',
    bgEnd: cssToken('--token-bg') || '#1a1a2e',
  };
}

/* ─── Public API ─────────────────────────────────────────── */

export function generateLetterCard(letter: Letter): string {
  const { ctx, canvas } = initCanvas();
  const c = resolveColors();
  let y = drawBackground(ctx, c);
  y = drawLabel(ctx, c, y);
  y = drawSalutation(ctx, c, letter.salutation, y);
  y = drawParagraph(ctx, c, letter.opening, y);
  for (const para of letter.body) y = drawParagraph(ctx, c, para, y);
  y = drawDivider(ctx, c, y);
  drawClosing(ctx, c, letter.closing, y);
  drawSignOff(ctx, c, letter.signOff);
  drawBranding(ctx, c);
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

function drawBackground(ctx: CanvasRenderingContext2D, c: CanvasColors): number {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.bgStart);
  g.addColorStop(1, c.bgEnd);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return 140;
}

function drawLabel(ctx: CanvasRenderingContext2D, c: CanvasColors, y: number): number {
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = hexToRgba(c.gold, 0.6);
  ctx.textAlign = 'center';
  ctx.fillText('BASED ON HOW YOU READ\u2026', W / 2, y);
  return y + 60;
}

function drawSalutation(ctx: CanvasRenderingContext2D, c: CanvasColors, text: string, y: number): number {
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = c.gold;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  return y + 60;
}

function drawParagraph(ctx: CanvasRenderingContext2D, c: CanvasColors, text: string, y: number): number {
  ctx.font = '26px Georgia, serif';
  ctx.fillStyle = hexToRgba(c.text, 0.9);
  ctx.textAlign = 'center';
  const lines = wrapLines(ctx, text, W - PAD * 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * 40));
  return y + lines.length * 40 + 36;
}

function drawDivider(ctx: CanvasRenderingContext2D, c: CanvasColors, y: number): number {
  const hw = 60;
  ctx.strokeStyle = hexToRgba(c.gold, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - hw, y);
  ctx.lineTo(W / 2 + hw, y);
  ctx.stroke();
  return y + 40;
}

function drawClosing(ctx: CanvasRenderingContext2D, c: CanvasColors, text: string, y: number): void {
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillStyle = hexToRgba(c.text, 0.8);
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
}

function drawSignOff(ctx: CanvasRenderingContext2D, c: CanvasColors, text: string): void {
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, H - 120);
}

function drawBranding(ctx: CanvasRenderingContext2D, c: CanvasColors): void {
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = hexToRgba(c.muted, 0.5);
  ctx.textAlign = 'center';
  ctx.fillText('theanti.blog', W / 2, H - 80);
}

/* ─── Text/color utility ─────────────────────────────────── */

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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
