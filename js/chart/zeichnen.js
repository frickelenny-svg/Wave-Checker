/* js/chart/zeichnen.js – Kleiner Chart der Übungsmodi: Zeichenfläche (W, H, chartSize), Ziehen von Punkten (startDrag, DRAGK, ordHint),
   Labels (L0, labX) und draw().
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- 3) Zeichnen: nur kleine Zahlen an den Extremen, keine Punkte.
// Zeichenfläche: Desktop breit (720×340). Am Handy schmaler und höher (440×420), damit der Chart etwa doppelt so hoch
// erscheint (Lenny, 26.10.2026). Wird bei jedem Zeichnen neu bestimmt; Tippen rechnet mit denselben Werten.
let W=720,H=340,X0=30,DX=660/45;
const chartSize=()=>{const m=innerWidth<=600;W=m?440:720;H=m?420:340;X0=m?22:30;DX=(W-2*X0)/45};chartSize();
// Ziehen von Punkten (PC und Handy). Wichtig fürs Handy: Das SVG-Element bleibt während des Ziehens bestehen
// (nur sein Inhalt wird neu gezeichnet) und hält den Finger per Pointer-Capture fest. Früher wurde das ganze SVG ersetzt;
// dann kam auf dem Handy das "Loslassen" nicht mehr an, und der alte Punkt "klebte" am Finger.
let DRAG=null; // Aufräumfunktion der laufenden Ziehaktion
function startDrag(svg,e,move,end){
 if(DRAG)DRAG();
 try{svg.setPointerCapture(e.pointerId)}catch(_){}
 let on=true;
 const stop=()=>{if(!on)return;on=false;DRAG=null;['pointermove','pointerup','pointercancel','lostpointercapture'].forEach((t,i)=>svg.removeEventListener(t,i?up:move))};
 const up=()=>{if(!on)return;stop();end()};
 svg.addEventListener('pointermove',move);['pointerup','pointercancel','lostpointercapture'].forEach(t=>svg.addEventListener(t,up));
 DRAG=stop;
}
// Ziehen in allen Modi (18.11.2026, Lenny): Ein Punkt behält beim Ziehen immer sein Label und bleibt zwischen seinem Vorgänger und
// Nachfolger. Will man ihn weiter schieben, stoppt er an der Grenze, und es erscheint kurz dieser Hinweis (auch in der Übungsrunde).
// DRAGK = Index des gerade gezogenen Punkts (wird hervorgehoben, die anderen bleiben normal sichtbar), -1 = keiner.
let DRAGK=-1,ORDT=-1e9;
function ordHint(){const nw=performance.now();if(nw-ORDT<1500)return;ORDT=nw;
 let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}
 t.innerHTML='Punkte bleiben in ihrer Reihenfolge.';t.className='show';clearTimeout(t.tm);t.tm=setTimeout(()=>t.className='',2500);t.onclick=()=>t.className=''}
const redraw=(svg,html)=>{svg.innerHTML=html.slice(html.indexOf('>')+1,html.lastIndexOf('</svg>'))}; // nur den Inhalt tauschen
const TOL=2; // erlaubte Abweichung beim Setzen eines Punktes, in Kerzen
// Beschriftung (15.11.2026, Lenny): Der Start einer Zählung hat kein „0“ mehr, im Chart steht ein kleiner Marker, im Text „Start“.
// Labels bleiben ganz im Bild: nahe am Rand rücken sie nach innen (Breite grob aus Zeichenzahl und Schriftgröße).
const L0=l=>l==='0'?'Start':l;
const LFS=()=>innerWidth<=600?14:11;
const labX=(x,t,fs)=>{const w=String(t).length*fs*.6;return Math.max(w/2+3,Math.min(W-w/2-3,x))};
function draw(R,marks,showPiv,tl){ // tl: gesetzte Dreieckspunkte (0,A,B,C,D,E) für die Trendlinien, sonst null
 chartSize();const lo=Math.min(...R.pr),hi=Math.max(...R.pr),Y=p=>44+(hi-p)/(hi-lo)*(H-88),X=i=>X0+i*DX; // oben und unten Platz für die Punkt-Kreise
 let s='<svg id="svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Preischart">';
 for(let g=0;20+g*50<H;g++)s+='<line x1="0" x2="'+W+'" y1="'+(20+g*50)+'" y2="'+(20+g*50)+'" stroke="var(--line)" stroke-width=".6"/>';
 s+='<polyline fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" points="'+R.pr.map((p,i)=>X(i)+','+Y(p)).join(' ')+'"/>';
 if(tl&&tl.length===6){ // Trendlinien eines Dreiecks: A-C-E-Seite und B-D-Seite, gestrichelt, bis kurz hinter E verlängert
  const end=tl[5]+1.5,ln=(a,b)=>{const x1=X(tl[a]),y1=Y(R.pr[tl[a]]),x2=X(tl[b]),y2=Y(R.pr[tl[b]]),xe=X(end);
   return '<line x1="'+x1+'" y1="'+y1+'" x2="'+xe+'" y2="'+(y1+(y2-y1)/(x2-x1)*(xe-x1))+'" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4" opacity=".55"/>'};
  s+=ln(1,3)+ln(2,4);}
 const list=showPiv?R.piv.map((i,k)=>[i,k]):marks.map((i,k)=>[i,k]);
 const pr=innerWidth<=600?17:14; // gesetzte Punkte: blaue Kreise (ca. 28 px) mit weißer Beschriftung
 list.forEach(([i,k])=>{const up=R.pr[i]>=(R.pr[i-1]??-1e9)&&R.pr[i]>=(R.pr[i+1]??-1e9),l=R.lab?R.lab[k]:R.P.labels[k];
  if(l==='0'){s+=showPiv?'<circle cx="'+X(i)+'" cy="'+Y(R.pr[i])+'" r="3.5" fill="var(--muted)"/>':'<g class="pt'+(k===DRAGK?' drag':'')+'"><circle cx="'+X(i)+'" cy="'+Y(R.pr[i])+'" r="8"/></g>';return} // Start: Marker statt „0“
  if(showPiv)s+='<text class="lab" x="'+labX(X(i),l,LFS())+'" y="'+(Y(R.pr[i])+(up?-7:15))+'">'+l+'</text>';
  else s+='<g class="pt'+(k===DRAGK?' drag':'')+'"><circle cx="'+Math.max(pr+2,Math.min(W-pr-2,X(i)))+'" cy="'+(Y(R.pr[i])+(up?-pr-4:pr+4))+'" r="'+pr+'"/><text x="'+Math.max(pr+2,Math.min(W-pr-2,X(i)))+'" y="'+(Y(R.pr[i])+(up?-pr-4:pr+4))+'">'+l+'</text></g>';});
 return s+'</svg>';
}
