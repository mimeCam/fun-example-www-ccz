/**
 * svg-to-png — rasterize an SVG string to a PNG blob on the client.
 *
 * Used by ThreadKeepsake for "Copy" (image) and "Save" (download PNG)
 * secondary actions — siblings of the "Share this thread" primary CTA.
 * No round-trip to the server — keeps copy instant on a café Wi-Fi.
 * DPR handling mirrors lib/quote-cards/card-generator for parity.
 */
'use client';

import { KEEPSAKE_DIMENSIONS } from './thread-render';

/** Load an SVG string into an <img> via a blob URL. */
function loadSvg(svg: string): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => resolve({ img, revoke: () => URL.revokeObjectURL(url) });
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function makeCanvas(width: number, height: number, dpr: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return canvas;
}

async function rasterize(svg: string): Promise<HTMLCanvasElement> {
  const dpr = Math.min(2, window.devicePixelRatio || 1); // cap 2× — keeps PNG < 80KB
  const { width, height } = KEEPSAKE_DIMENSIONS;
  const { img, revoke } = await loadSvg(svg);
  try {
    const canvas = makeCanvas(width, height, dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  } finally { revoke(); }
}

/** Convert an SVG string to a PNG Blob. */
export async function svgToPngBlob(svg: string): Promise<Blob> {
  const canvas = await rasterize(svg);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
  });
}

/** Trigger a browser download of the PNG. */
export async function downloadPng(svg: string, filename: string): Promise<void> {
  const blob = await svgToPngBlob(svg);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  // Safari queues the download async — defer revoke so the fetch isn't aborted.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Copy the PNG to the user's clipboard (where supported). */
export async function copyPngToClipboard(svg: string): Promise<boolean> {
  if (!navigator.clipboard || typeof (window as any).ClipboardItem !== 'function') {
    return false;  // graceful: caller will fall back to download
  }
  const blob = await svgToPngBlob(svg);
  // eslint-disable-next-line no-undef
  await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
  return true;
}
