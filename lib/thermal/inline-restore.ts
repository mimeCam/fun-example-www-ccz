/**
 * Inline thermal restore — blocking <script> that runs before first paint.
 *
 * Reads thermal-history from localStorage, computes score + tokens,
 * writes CSS vars to <html> so the very first frame is warm for returning readers.
 *
 * This is a plain JS string — no imports, no modules, no React.
 * The scoring and token math is a minimal inline copy of the full engine.
 * Full recomputation happens in ThermalProvider after hydration (live updates).
 */

export const INLINE_RESTORE_SCRIPT = `(function(){
try{
var raw=localStorage.getItem('thermal-history');
if(!raw)return;
var h=JSON.parse(raw);
if(!h||!h.articleIds||h.articleIds.length<1)return;
var depths=[];
if(h.articleDepths){var ks=Object.keys(h.articleDepths);for(var i=0;i<ks.length;i++)depths.push(h.articleDepths[ks[i]]);}
var avg=0;if(depths.length){var s=0;for(var i=0;i<depths.length;i++)s+=depths[i];avg=s/depths.length;}
var d=Math.min,sc=d(h.articleIds.length/6,1)*25+d(avg/100,1)*30+d((h.visitDays?h.visitDays.length:0)/7,1)*20+d((h.resonanceCount||0)/3,1)*15+d((h.totalDwellSecs||0)/60/30,1)*10;
sc=sc>100?100:sc<0?0:sc;
var t=sc/100,tp=Math.pow(t,0.66);
var st=sc>=80?'luminous':sc>=50?'warm':sc>=18?'stirring':'dormant';
function hx(c){var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return{h:0,s:0,l:l};var d=mx-mn,s=l>.5?d/(2-mx-mn):d/(mx+mn),hh;if(mx===r)hh=((g-b)/d+(g<b?6:0))*60;else if(mx===g)hh=((b-r)/d+2)*60;else hh=((r-g)/d+4)*60;return{h:hh,s:s,l:l};}
function th(h,s,l){var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}return'#'+[r,g,b].map(function(v){return Math.round((v+m)*255).toString(16).padStart(2,'0');}).join('');}
function lc(a,b,t){var dh=b.h-a.h;if(dh>180)dh-=360;if(dh<-180)dh+=360;return{h:(a.h+dh*t+360)%360,s:a.s+(b.s-a.s)*t,l:a.l+(b.l-a.l)*t};}
function lerp(a,b,t){return a+(b-a)*t;}
function col(c,w,t){return th(lc(hx(c),hx(w),t).h,lc(hx(c),hx(w),t).s,lc(hx(c),hx(w),t).l);}
var BG=[26,26,46],BGW=[56,34,56],SF=[22,33,62],SFW=[30,42,62],FG=[232,232,240],FGW=[245,237,224],AC=[123,44,191],ACW=[240,198,116],BD=[34,34,68],BDW=[46,46,80];
var el=document.documentElement.style;
el.setProperty('--token-bg',col(BG,BGW,tp));
el.setProperty('--token-surface',col(SF,SFW,tp));
el.setProperty('--token-foreground',col(FG,FGW,tp));
el.setProperty('--token-accent',col(AC,ACW,tp));
el.setProperty('--token-border',col(BD,BDW,tp));
var ga=t<.18?'none':'0 0 '+Math.round(40+t*60)+'px rgba(240,198,116,'+(t*.18).toFixed(3)+')';
el.setProperty('--token-glow',ga);
var sa=(lerp(.3,.5,t)).toFixed(2);
el.setProperty('--token-shadow','0 '+Math.round(1+t*7)+'px '+Math.round(2+t*30)+'px rgba(0,0,0,'+sa+')');
el.setProperty('--token-line-height',lerp(1.75,1.95,tp).toFixed(3));
el.setProperty('--token-shadow-depth',sa);
el.setProperty('--token-radius-soft',lerp(0,.5,t).toFixed(2)+'rem');
el.setProperty('--token-accent-opacity',lerp(.5,1,t).toFixed(2));
el.setProperty('--token-font-weight',lerp(400,500,tp).toFixed(1));
el.setProperty('--token-letter-spacing',lerp(-.01,.02,tp).toFixed(3)+'em');
el.setProperty('--token-para-rhythm',Math.round(lerp(0,12,tp))+'px');
el.setProperty('--para-offset',Math.round(lerp(0,12,tp)+t*14)+'px');
el.setProperty('--token-text-glow',t<.5?'none':'0 0 40px rgba(240,198,116,'+Math.min(.12,t*.10).toFixed(3)+')');
el.setProperty('--token-spacing-breath',Math.round(t*14)+'px');
var thr=18,t2=sc<thr?0:(sc-thr)/(100-thr);
for(var n=1;n<=12;n++){var lift=t2*5.66*Math.sqrt(n/6);el.setProperty('--token-space-lift-'+n,lift.toFixed(2)+'px');}
document.documentElement.setAttribute('data-thermal',st);
document.documentElement.setAttribute('data-thermal-score',sc);
document.documentElement.setAttribute('data-returning',h.visitDays&&h.visitDays.length>1?'true':'false');
}catch(e){}
})()`;
