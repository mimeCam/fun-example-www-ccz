/**
 * Quick Mirror Card Generator
 * Renders a QuickMirrorResult as a 1080×1080 branded PNG via Canvas API.
 * Same pattern as card-generator.ts but for the anonymous quick-synthesis path.
 * No external deps — pure client-side Canvas.
 */

import type { QuickMirrorResult } from './quick-synthesize';

const W = 1080;
const H = 1080;
const PAD = 100;
const GOLD = '#f0c674';
const TEXT = '#f0f0f5';
const MUTED = '#94a3b8';

/* ─── Public API ─────────────────────────────────────────── */

export function generateQuickMirrorCard(result: QuickMirrorResult): string {
  const { ctx, canvas } = initCanvas();
  drawBackground(ctx);
  drawLabel(ctx);
  drawArchetype(ctx, result.archetypeLabel);
  drawWhisper(ctx, result.whisper);
  drawDivider(ctx, 460);
  drawScoreBars(ctx, result.scores);
  drawDivider(ctx, 700);
  drawConfidence(ctx, result.confidence);
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

/* ─── Drawing helpers (each ≤ 8 lines) ──────────────────── */

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0f172a');
  g.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawLabel(ctx: CanvasRenderingContext2D): void {
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'center';
  ctx.fillText('BASED ON HOW YOU READ\u2026', W / 2, 200);
}

function drawArchetype(ctx: CanvasRenderingContext2D, label: string): void {
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText(label, W / 2, 280);
}

function drawWhisper(ctx: CanvasRenderingContext2D, whisper: string): void {
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = '#d1d5db';
  ctx.textAlign = 'center';
  const lines = wrapLines(ctx, `\u201C${whisper}\u201D`, W - PAD * 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 360 + i * 40));
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number): void {
  const hw = 120;
  ctx.strokeStyle = 'rgba(240,198,116,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - hw, y);
  ctx.lineTo(W / 2 + hw, y);
  ctx.stroke();
}

function drawScoreBars(ctx: CanvasRenderingContext2D, scores: QuickMirrorResult['scores']): void {
  const entries = Object.entries(scores) as [string, number][];
  entries.forEach(([key, val], i) => drawOneBar(ctx, key, val, 500 + i * 65));
}

function drawOneBar(ctx: CanvasRenderingContext2D, label: string, val: number, y: number): void {
  const barW = W - PAD * 2;
  const barH = 10;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText(`${cap(label)}: ${val}%`, PAD, y);
  ctx.fillStyle = '#334155';
  ctx.fillRect(PAD, y + 10, barW, barH);
  const g = ctx.createLinearGradient(PAD, 0, PAD + barW, 0);
  g.addColorStop(0, 'rgba(240,198,116,0.7)');
  g.addColorStop(1, GOLD);
  ctx.fillStyle = g;
  ctx.fillRect(PAD, y + 10, barW * (val / 100), barH);
}

function drawConfidence(ctx: CanvasRenderingContext2D, confidence: number): void {
  const y = 750;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('\u25CF  \u25CF  \u25CF', W / 2, y);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText(`${confidence}% confidence`, W / 2, y + 36);
}

function drawBranding(ctx: CanvasRenderingContext2D): void {
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.textAlign = 'center';
  ctx.fillText('theanti.blog', W / 2, H - 40);
}

/* ─── Text utility (same pattern as card-generator.ts) ──── */

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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
