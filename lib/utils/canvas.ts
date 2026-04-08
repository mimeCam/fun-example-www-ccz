/**
 * Shared Canvas Utilities
 *
 * Extracted from quick-mirror-card-generator.ts and card-generator.ts
 * to eliminate the wrapLines() copy-paste. Mike's "shared code is king" rule.
 */

export interface CanvasHandle {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
}

/** Bootstrap an off-screen canvas at logical size × devicePixelRatio. */
export function initCanvas(w: number, h: number): CanvasHandle {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  return { ctx, canvas };
}

/** Greedy word-wrap: splits text into lines that fit within max pixels. */
export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  max: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur + (cur ? ' ' : '') + w;
    if (ctx.measureText(test).width > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
