/**
 * Mirror Card Generator
 * Renders a ReaderMirror archetype card as a PNG via Canvas API.
 * Colors resolved from CSS design tokens at runtime — single source of truth.
 */

import type { ReaderMirror } from '@/types/mirror';
import { initCanvas, wrapLines } from '@/lib/utils/canvas';
import { THERMAL, BRAND, cssOr } from '@/lib/design/color-constants';

const W = 1080;
const H = 1080;
const PAD = 80;

function resolveColors() {
  return {
    bgTop: cssOr('--token-surface', THERMAL.surface),
    bgBot: cssOr('--token-bg', THERMAL.bg),
    accent: BRAND.cyan,
    text: cssOr('--token-foreground', THERMAL.foreground),
    muted: cssOr('--mist', BRAND.mist),
  };
}

export function generateMirrorCard(mirror: ReaderMirror): string {
  const { ctx, canvas } = initCanvas(W, H);
  const c = resolveColors();

  drawBg(ctx, c);
  drawArchetype(ctx, c, mirror.archetypeLabel);
  drawWhisper(ctx, c, mirror.whisper);
  drawScores(ctx, c, mirror.scores);
  drawTopics(ctx, c, mirror.topicDNA);
  drawThemes(ctx, c, mirror.resonanceThemes);

  return canvas.toDataURL('image/png');
}

function drawBg(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.bgTop);
  g.addColorStop(1, c.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawArchetype(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>, label: string): void {
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = c.accent;
  ctx.textAlign = 'center';
  ctx.fillText(label, W / 2, 180);
}

function drawWhisper(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>, whisper: string): void {
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'center';
  const lines = wrapLines(ctx, `"${whisper}"`, W - PAD * 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 250 + i * 40));
}

function drawScores(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>, scores: Record<string, number>): void {
  const keys = Object.keys(scores);
  const startY = 420;
  const barH = 12;
  const barW = W - PAD * 2;

  keys.forEach((key, i) => {
    const y = startY + i * 60;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'left';
    ctx.fillText(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${scores[key]}%`, PAD, y);
    drawBar(ctx, c, barW, y, barH, scores[key]);
  });
}

function drawBar(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>, barW: number, y: number, barH: number, pct: number): void {
  ctx.fillStyle = hexAlpha(BRAND.fog, 0.6);
  ctx.fillRect(PAD, y + 10, barW, barH);
  const g = ctx.createLinearGradient(PAD, 0, PAD + barW, 0);
  g.addColorStop(0, hexAlpha(c.accent, 0.5));
  g.addColorStop(1, c.accent);
  ctx.fillStyle = g;
  ctx.fillRect(PAD, y + 10, barW * (pct / 100), barH);
}

function drawTopics(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>, topics: { topic: string; weight: number }[]): void {
  if (!topics.length) return;
  const y = 660;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'center';
  ctx.fillText('YOUR TOPICS', W / 2, y);

  const tags = topics.slice(0, 5).map(t => `${t.topic} ${t.weight}%`);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = c.accent;
  ctx.fillText(tags.join('  \u00B7  '), W / 2, y + 36);
}

function drawThemes(ctx: CanvasRenderingContext2D, c: ReturnType<typeof resolveColors>, themes: string[]): void {
  if (!themes.length) return;
  const y = 760;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'center';
  ctx.fillText('WHAT MOVES YOU', W / 2, y);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = c.text;
  ctx.fillText(themes.join(' \u00B7 '), W / 2, y + 30);
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
