/**
 * Quick Mirror Card Generator
 * Renders a QuickMirrorResult as a 1080×1080 branded PNG via Canvas API.
 * Colors resolved from CSS design tokens at runtime — single source of truth.
 */

import type { QuickMirrorResult } from './quick-synthesize';
import { ARCHETYPE_COLORS } from '@/lib/content/content-layers';
import type { ArchetypeKey } from '@/types/content';
import { initCanvas, wrapLines } from '@/lib/utils/canvas';
import { THERMAL, BRAND, cssOr } from '@/lib/design/color-constants';

const W = 1080;
const H = 1080;
const PAD = 100;

interface CanvasColors {
  text: string;
  muted: string;
  barBg: string;
  brand: string;
  bgStart: string;
  bgEnd: string;
}

function resolveColors(): CanvasColors {
  return {
    text: cssOr('--token-foreground', THERMAL.foreground),
    muted: cssOr('--mist', BRAND.mist),
    barBg: hexAlpha(BRAND.fog, 0.6),
    brand: hexAlpha(BRAND.mist, 0.5),
    bgStart: cssOr('--token-surface', THERMAL.surface),
    bgEnd: cssOr('--token-bg', THERMAL.bg),
  };
}

export function generateQuickMirrorCard(result: QuickMirrorResult): string {
  const { ctx, canvas } = initCanvas(W, H);
  const c = resolveColors();
  const ac = ARCHETYPE_COLORS[(result.archetype as ArchetypeKey) ?? 'collector'];
  drawBackground(ctx, c, ac);
  drawLabel(ctx, ac);
  drawArchetype(ctx, result.archetypeLabel, ac);
  drawWhisper(ctx, c, result.whisper);
  drawDivider(ctx, 460, ac);
  drawScoreBars(ctx, c, result.scores, ac);
  drawDivider(ctx, 700, ac);
  drawConfidence(ctx, c, result.confidence, ac);
  drawBranding(ctx, c);
  return canvas.toDataURL('image/png');
}

function drawBackground(ctx: CanvasRenderingContext2D, c: CanvasColors, ac: { hex: string }): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.bgStart);
  g.addColorStop(1, c.bgEnd);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawCornerGlow(ctx, ac);
}

function drawCornerGlow(ctx: CanvasRenderingContext2D, ac: { hex: string }): void {
  const g = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, 400);
  g.addColorStop(0, hexAlpha(ac.hex, 0.08));
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawLabel(ctx: CanvasRenderingContext2D, ac: { hex: string }): void {
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = hexAlpha(ac.hex, 0.7);
  ctx.textAlign = 'center';
  ctx.fillText('BASED ON HOW YOU READ\u2026', W / 2, 200);
}

function drawArchetype(ctx: CanvasRenderingContext2D, label: string, ac: { hex: string }): void {
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = ac.hex;
  ctx.textAlign = 'center';
  ctx.fillText(label, W / 2, 280);
}

function drawWhisper(ctx: CanvasRenderingContext2D, c: CanvasColors, whisper: string): void {
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = c.text;
  ctx.textAlign = 'center';
  const lines = wrapLines(ctx, `\u201C${whisper}\u201D`, W - PAD * 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 360 + i * 40));
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number, ac: { hex: string }): void {
  const hw = 120;
  ctx.strokeStyle = hexAlpha(ac.hex, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - hw, y);
  ctx.lineTo(W / 2 + hw, y);
  ctx.stroke();
}

function drawScoreBars(ctx: CanvasRenderingContext2D, c: CanvasColors, scores: QuickMirrorResult['scores'], ac: { hex: string }): void {
  const entries = Object.entries(scores) as [string, number][];
  entries.forEach(([key, val], i) => drawOneBar(ctx, c, key, val, 500 + i * 65, ac));
}

function drawOneBar(ctx: CanvasRenderingContext2D, c: CanvasColors, label: string, val: number, y: number, ac: { hex: string }): void {
  const barW = W - PAD * 2;
  const barH = 10;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'left';
  ctx.fillText(`${cap(label)}: ${val}%`, PAD, y);
  ctx.fillStyle = c.barBg;
  ctx.fillRect(PAD, y + 10, barW, barH);
  const g = ctx.createLinearGradient(PAD, 0, PAD + barW, 0);
  g.addColorStop(0, hexAlpha(ac.hex, 0.7));
  g.addColorStop(1, ac.hex);
  ctx.fillStyle = g;
  ctx.fillRect(PAD, y + 10, barW * (val / 100), barH);
}

function drawConfidence(ctx: CanvasRenderingContext2D, c: CanvasColors, confidence: number, ac: { hex: string }): void {
  const y = 750;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = ac.hex;
  ctx.textAlign = 'center';
  ctx.fillText('\u25CF  \u25CF  \u25CF', W / 2, y);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = c.muted;
  ctx.fillText(`${confidence}% confidence`, W / 2, y + 36);
}

function drawBranding(ctx: CanvasRenderingContext2D, c: CanvasColors): void {
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = c.brand;
  ctx.textAlign = 'center';
  ctx.fillText('theanti.blog', W / 2, H - 40);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
