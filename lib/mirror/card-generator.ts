/**
 * Mirror Card Generator
 * Renders a ReaderMirror archetype card as a PNG via Canvas API.
 * No external dependencies — reuses the native Canvas pattern from quote-cards.
 */

import type { ReaderMirror } from '@/types/mirror';
import { initCanvas, wrapLines } from '@/lib/utils/canvas';

const W = 1080;
const H = 1080;
const PAD = 80;
const BG_TOP = '#0f172a';
const BG_BOT = '#1e1b4b';
const ACCENT = '#38bdf8';
const TEXT = '#f1f5f9';
const MUTED = '#94a3b8';

export function generateMirrorCard(mirror: ReaderMirror): string {
  const { ctx, canvas } = initCanvas(W, H);

  drawBg(ctx);
  drawArchetype(ctx, mirror.archetypeLabel);
  drawWhisper(ctx, mirror.whisper);
  drawScores(ctx, mirror.scores);
  drawTopics(ctx, mirror.topicDNA);
  drawThemes(ctx, mirror.resonanceThemes);

  return canvas.toDataURL('image/png');
}

function drawBg(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, BG_TOP);
  g.addColorStop(1, BG_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawArchetype(ctx: CanvasRenderingContext2D, label: string): void {
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.fillText(label, W / 2, 180);
}

function drawWhisper(ctx: CanvasRenderingContext2D, whisper: string): void {
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'center';
  const lines = wrapLines(ctx, `"${whisper}"`, W - PAD * 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 250 + i * 40));
}

function drawScores(
  ctx: CanvasRenderingContext2D,
  scores: Record<string, number>
): void {
  const keys = Object.keys(scores);
  const startY = 420;
  const barH = 12;
  const barW = W - PAD * 2;

  keys.forEach((key, i) => {
    const y = startY + i * 60;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${scores[key]}%`, PAD, y);
    // bar bg
    ctx.fillStyle = '#334155';
    ctx.fillRect(PAD, y + 10, barW, barH);
    // bar fill
    const g = ctx.createLinearGradient(PAD, 0, PAD + barW, 0);
    g.addColorStop(0, '#818cf8');
    g.addColorStop(1, ACCENT);
    ctx.fillStyle = g;
    ctx.fillRect(PAD, y + 10, barW * (scores[key] / 100), barH);
  });
}

function drawTopics(
  ctx: CanvasRenderingContext2D,
  topics: { topic: string; weight: number }[]
): void {
  if (!topics.length) return;
  const y = 660;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'center';
  ctx.fillText('YOUR TOPICS', W / 2, y);

  const tags = topics.slice(0, 5).map(t => `${t.topic} ${t.weight}%`);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = ACCENT;
  ctx.fillText(tags.join('  ·  '), W / 2, y + 36);
}

function drawThemes(ctx: CanvasRenderingContext2D, themes: string[]): void {
  if (!themes.length) return;
  const y = 760;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('WHAT MOVES YOU', W / 2, y);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = TEXT;
  ctx.fillText(themes.join(' · '), W / 2, y + 30);
}

// wrapLines imported from @/lib/utils/canvas
