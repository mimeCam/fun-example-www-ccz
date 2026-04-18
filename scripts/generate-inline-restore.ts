/**
 * Build-Time Inline Restore Generator
 *
 * Reads thermal anchors from thermal-tokens.ts and thermal-score.ts,
 * generates the self-contained IIFE string for inline-restore.ts.
 *
 * One source of truth. Zero manual sync.
 * Run: npx tsx scripts/generate-inline-restore.ts
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Import anchors from the single source of truth ──────

import {
  BG, SURFACE, FOREGROUND, ACCENT, BORDER,
  LINE_HEIGHT, SHADOW_DEPTH, RADIUS_SOFT, ACCENT_OPACITY,
  FONT_WEIGHT, LETTER_SPACING, PARA_RHYTHM,
  SPACING_LIFT_MAX, SPACING_SCALE_REF, SPACING_THRESHOLD,
} from '../lib/thermal/thermal-tokens';

import { DIMENSIONS, STATE_THRESHOLDS } from '../lib/thermal/thermal-score';

// ─── Helpers ─────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function arr(a: [number, number, number]): string {
  return `[${a.join(',')}]`;
}

// ─── Generate the IIFE ───────────────────────────────────

function generate(): string {
  const bgD = arr(hexToRgb(BG.dormant));
  const bgW = arr(hexToRgb(BG.warm));
  const sfD = arr(hexToRgb(SURFACE.dormant));
  const sfW = arr(hexToRgb(SURFACE.warm));
  const fgD = arr(hexToRgb(FOREGROUND.dormant));
  const fgW = arr(hexToRgb(FOREGROUND.warm));
  const acD = arr(hexToRgb(ACCENT.dormant));
  const acW = arr(hexToRgb(ACCENT.warm));
  const bdD = arr(hexToRgb(BORDER.dormant));
  const bdW = arr(hexToRgb(BORDER.warm));

  // Build dimension scoring expression
  // Each dimension: min(raw/divisor, 1) * weight
  const dimVars = ['h.articleIds.length', 'avg', 'visitDays', 'resonanceCount', 'dwellMins'];
  const dimExprs = DIMENSIONS.map((d, i) =>
    `d(${dimVars[i]}/${d.divisor},1)*${d.weight}`
  ).join('+');

  // State thresholds
  const lumThr = STATE_THRESHOLDS[0][0];  // 80
  const warmThr = STATE_THRESHOLDS[1][0]; // 55
  const stirThr = STATE_THRESHOLDS[2][0]; // 25

  const boostExp = '0.66';
  const spacingThr = SPACING_THRESHOLD;
  const spacingMax = SPACING_LIFT_MAX;
  const spacingRef = SPACING_SCALE_REF;

  // Build the IIFE string
  return `(function(){`
  + `try{`
  + `var raw=localStorage.getItem('thermal-history');`
  + `if(!raw)return;`
  + `var h=JSON.parse(raw);`
  + `if(!h||!h.articleIds||h.articleIds.length<1)return;`
  + `var depths=[];`
  + `if(h.articleDepths){var ks=Object.keys(h.articleDepths);for(var i=0;i<ks.length;i++)depths.push(h.articleDepths[ks[i]]);}`
  + `var avg=0;if(depths.length){var s=0;for(var i=0;i<depths.length;i++)s+=depths[i];avg=s/depths.length;}`
  + `var visitDays=h.visitDays?h.visitDays.length:0;`
  + `var resonanceCount=h.resonanceCount||0;`
  + `var dwellMins=(h.totalDwellSecs||0)/60;`
  + `var d=Math.min,sc=${dimExprs};`
  + `sc=sc>100?100:sc<0?0:sc;`
  + `var t=sc/100,tp=Math.pow(t,${boostExp});`
  + `var st=sc>=${lumThr}?'luminous':sc>=${warmThr}?'warm':sc>=${stirThr}?'stirring':'dormant';`
  // HSL math (stable — identical to thermal-tokens.ts)
  + `function hx(c){var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return{h:0,s:0,l:l};var dd=mx-mn,s=l>.5?dd/(2-mx-mn):dd/(mx+mn),hh;if(mx===r)hh=((g-b)/dd+(g<b?6:0))*60;else if(mx===g)hh=((b-r)/dd+2)*60;else hh=((r-g)/dd+4)*60;return{h:hh,s:s,l:l};}`
  + `function th(h,s,l){var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}return'#'+[r,g,b].map(function(v){return Math.round((v+m)*255).toString(16).padStart(2,'0');}).join('');}`
  + `function lc(a,b,t){var dh=b.h-a.h;if(dh>180)dh-=360;if(dh<-180)dh+=360;return{h:(a.h+dh*t+360)%360,s:a.s+(b.s-a.s)*t,l:a.l+(b.l-a.l)*t};}`
  + `function lerp(a,b,t){return a+(b-a)*t;}`
  + `function col(c,w,t){var m=lc(hx(c),hx(w),t);return th(m.h,m.s,m.l);}`
  // Anchor arrays — generated from thermal-tokens.ts exports
  + `var BG=${bgD},BGW=${bgW},SF=${sfD},SFW=${sfW},FG=${fgD},FGW=${fgW},AC=${acD},ACW=${acW},BD=${bdD},BDW=${bdW};`
  // Apply tokens to DOM
  + `var el=document.documentElement.style;`
  + `el.setProperty('--token-bg',col(BG,BGW,tp));`
  + `el.setProperty('--token-surface',col(SF,SFW,tp));`
  + `el.setProperty('--token-foreground',col(FG,FGW,tp));`
  + `el.setProperty('--token-accent',col(AC,ACW,tp));`
  + `el.setProperty('--token-border',col(BD,BDW,tp));`
  // Glow — gold, only above threshold (matches SPACING_THRESHOLD / 100)
  + `var ga=t<.25?'none':'0 0 '+Math.round(40+t*60)+'px rgba(240,198,116,'+(t*.18).toFixed(3)+')';`
  + `el.setProperty('--token-glow',ga);`
  // Shadow — alpha interpolation
  + `var sa=(lerp(${SHADOW_DEPTH.dormant},${SHADOW_DEPTH.warm},t)).toFixed(2);`
  + `el.setProperty('--token-shadow','0 '+Math.round(1+t*7)+'px '+Math.round(2+t*30)+'px rgba(0,0,0,'+sa+')');`
  // Typography — boosted
  + `el.setProperty('--token-line-height',lerp(${LINE_HEIGHT.dormant},${LINE_HEIGHT.warm},tp).toFixed(3));`
  + `el.setProperty('--token-shadow-depth',sa);`
  + `el.setProperty('--token-radius-soft',lerp(${RADIUS_SOFT.dormant},${RADIUS_SOFT.warm},t).toFixed(2)+'rem');`
  + `el.setProperty('--token-accent-opacity',lerp(${ACCENT_OPACITY.dormant},${ACCENT_OPACITY.warm},t).toFixed(2));`
  + `el.setProperty('--token-font-weight',lerp(${FONT_WEIGHT.dormant},${FONT_WEIGHT.warm},tp).toFixed(1));`
  + `el.setProperty('--token-letter-spacing',lerp(${LETTER_SPACING.dormant},${LETTER_SPACING.warm},tp).toFixed(3)+'em');`
  + `el.setProperty('--token-para-rhythm',Math.round(lerp(${PARA_RHYTHM.dormant},${PARA_RHYTHM.warm},tp))+'px');`
  + `el.setProperty('--para-offset',Math.round(lerp(${PARA_RHYTHM.dormant},${PARA_RHYTHM.warm},tp)+t*14)+'px');`
  // Text glow — warm+ only
  + `el.setProperty('--token-text-glow',t<.5?'none':'0 0 40px rgba(240,198,116,'+Math.min(.12,t*.10).toFixed(3)+')');`
  // Spacing lift tokens
  + `var thr=${spacingThr},t2=sc<thr?0:(sc-thr)/(100-thr);`
  + `for(var n=1;n<=12;n++){var lift=t2*${spacingMax}*Math.sqrt(n/${spacingRef});el.setProperty('--token-space-lift-'+n,lift.toFixed(2)+'px');}`
  // Data attributes
  + `document.documentElement.setAttribute('data-thermal',st);`
  + `document.documentElement.setAttribute('data-thermal-score',sc);`
  + `document.documentElement.setAttribute('data-returning',h.visitDays&&h.visitDays.length>1?'true':'false');`
  + `}catch(e){}`
  + `})()`;
}

// ─── Emit ────────────────────────────────────────────────

function main(): void {
  const script = generate();
  const header = [
    '/**',
    ' * Inline thermal restore — blocking <script> that runs before first paint.',
    ' *',
    ' * AUTO-GENERATED by scripts/generate-inline-restore.ts — DO NOT EDIT.',
    ' * Anchor values are read from thermal-tokens.ts and thermal-score.ts.',
    ' * Run "npx tsx scripts/generate-inline-restore.ts" to regenerate.',
    ' */',
    '',
  ].join('\n');

  const output = `${header}export const INLINE_RESTORE_SCRIPT = \`${script}\`;\n`;

  const outPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../lib/thermal/inline-restore.ts',
  );

  writeFileSync(outPath, output, 'utf-8');
  console.log(`Generated: ${outPath} (${output.length} bytes)`);
}

main();
