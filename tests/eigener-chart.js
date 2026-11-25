// Test „Eigenen Chart prüfen“ (20.11.2026, Lenny). Echte Tipps auf Handy (iPhone), iPad (Touch) und PC (Maus).
// Aufruf im Repo-Ordner: node tests/eigener-chart.js [Runden je Gerät]   (Playwright nötig; PWCH=chrome bzw. PWCH=msedge für einen installierten Browser)
// Die Testbilder entstehen im Browser (Canvas) nach dem Vorbild von TradingView-Screenshots, mit bekannten Preisen und Pixeln der Wendepunkte:
//  hell/dunkel, Kerzen/Linie, Preisachse linear/logarithmisch, mit Preis- und Zeitachse, Kopfzeile und Symbolname (werden weggeschnitten),
//  „Handyfoto vom Bildschirm“ (größer, unscharf, Rauschen, Moiré, ungleich hell, JPEG), teils mit schon eingezeichneten Wellen-Labels (Abpausen).
// Prüft:
//  1) Hochladen über das Dateifeld, Zuschneiden mit echtem Ziehen (Rahmen um den Chartbereich), Hinweistext ohne KI/Prognose.
//  2) Einrasten: grobes Tippen (Finger bis 22 px, Maus bis 9 px neben dem Docht) trifft in mindestens 95 % der Fälle das Docht-Hoch bzw. -Tief
//     (Kerzen ±1,2 px, Linie und Foto ±3 px im Bild). Beim Abpausen wird auf das vorhandene Label getippt: der Punkt landet trotzdem am Docht.
//  3) Prüfung: Ergebnis („regelkonform“ bzw. „verstößt gegen …“ samt Regel) stimmt mit den Regeln für die bekannten Preise überein
//     (linear: echte Preise; logarithmisch: Pixelhöhe, wie vorgegeben). Keine Punkte, keine Serie, kein „richtige Zählung“.
//  4) Ziehen (Auswählen): ins Leere bleibt der Punkt frei stehen, zurück neben den Docht rastet er wieder ein.
//  1b) Erkannter Verlauf an jeder Kerze; keine senkrechten Ausschläge, auch mit TradingView-Legende im Chart (Symbol, OHLC, Indikatoren),
//      gepunkteter Linie des letzten Kurses, Preis-Kästchen auf der mitgeschnittenen Preisachse; echte lange Dochte bleiben.
//  6) Verlauf nachzeichnen (echter Strich), Einrasten auf dem Strich, Wiederherstellen.
//  5) „Bild blasser“, Labels mit Hintergrund, Ergebnis als Bild (PNG-Download mit Fazit und „Wave Checker“), keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8797, N = +process.argv[2] || 4;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const disc = r => { const a = Math.random() * 2 * Math.PI, d = r * Math.sqrt(Math.random()); return [d * Math.cos(a), d * Math.sin(a)]; };
// Muster mit bekannten Preisen (Grundrichtung; dir -1 = gespiegelt)
const PATS = [
  { name: 'Impuls regelkonform', z: 'N', pr: [100, 150, 120, 230, 190, 260] },
  { name: 'Impuls abwärts regelkonform', z: 'N', pr: [300, 250, 280, 170, 210, 140] },
  { name: 'Impuls, Welle 3 die kürzeste', z: 'N', pr: [100, 160, 130, 180, 165, 240] },
  { name: 'Impuls, Welle 4 im Gebiet von 1', z: 'N', pr: [100, 160, 120, 210, 150, 230] },
  { name: 'Zigzag regelkonform', z: 'ABC', pr: [300, 220, 260, 180] },
  { name: 'Zigzag, C endet nicht unter A', z: 'ABC', pr: [300, 220, 270, 230] }];

// ---- Testbild im Browser zeichnen. Liefert dataURL, Größe, Plotbereich und die Pixel der Wendepunkte (Spitze des Dochts bzw. der Linie).
const MK = String.raw`(o)=>{let sd=o.seed;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647,rr=(a,b)=>a+(b-a)*rnd();
 const W0=1200,H0=720,PL=40,PT=58,PR=1090,PB=642,dark=o.theme==='dark';
 const C=dark?{bg:'#131722',grid:'#1f2330',up:'#089981',dn:'#f23645',tx:'#b2b5be',bar:'#1e222d',ln:'#2962FF'}:{bg:'#ffffff',grid:'#f0f3fa',up:'#089981',dn:'#f23645',tx:'#131722',bar:'#f8f9fd',ln:'#2962FF'};
 const P=o.pr,n=P.length-1,cand=[],piv=[],line=o.kind==='line';let last;
 // Kerze in einem Band [lo, hi]: Eröffnung = letzter Schluss, Schluss c, kleine Dochte, alles im Band
 const band=(c,lo,hi,wk)=>{const op=last===undefined?c:Math.max(lo,Math.min(hi,last));let h=Math.min(hi,Math.max(op,c)+rnd()*wk),l=Math.max(lo,Math.min(op,c)-rnd()*wk);const lw=rnd();if(o.legend&&lw<.04)h=h+(hi-h)*.45;else if(o.legend&&lw<.08)l=l-(l-lo)*.45; /* lange Dochte (bis 45 % des Abstands zum Rand der Spanne, sonst gäbe es ein fast gleich hohes Hoch neben dem Wendepunkt) */cand.push({o:op,c,h,l});last=c};
 // Wendekerze: ihr Extrem (Hoch bei up, sonst Tief) liegt genau auf dem Wendepunkt b, der Rest in der Spanne der Welle
 const pivot=(b,up,lo,hi,rg)=>{const op=last===undefined?b:last,c=line?b:up?b-rg*rr(0,.1):b+rg*rr(0,.1);cand.push(up?{o:op,c,h:b,l:Math.max(lo,Math.min(op,c)-rg*.03)}:{o:op,c,l:b,h:Math.min(hi,Math.max(op,c)+rg*.03)});last=c};
 const d1=Math.sign(P[1]-P[0]),A=Math.abs(P[1]-P[0]),s0=[P[0]+d1*A*.06,P[0]+d1*A*.34];
 for(let i=0;i<6;i++)band(P[0]+d1*A*rr(.1,.3),Math.min(...s0),Math.max(...s0),A*.03); // Vorlauf: der Start bleibt das Extrem
 pivot(P[0],d1<0,Math.min(...s0,P[0]),Math.max(...s0,P[0]),A);piv.push(cand.length-1);
 for(let k=1;k<=n;k++){const a=P[k-1],b=P[k],m=Math.round(rr(11,19)),lo=Math.min(a,b),hi=Math.max(a,b),g=(hi-lo)*.05;
  for(let i=1;i<m;i++){let c=a+(b-a)*i/m+(rnd()-.5)*(hi-lo)*.22;c=Math.max(lo+g,Math.min(hi-g,c));band(c,lo+g,hi-g,(hi-lo)*.05)}
  pivot(b,b>a,lo,hi,hi-lo);piv.push(cand.length-1)}
 const dn=Math.sign(P[n]-P[n-1]),An=Math.abs(P[n]-P[n-1]),s1=[P[n]-dn*An*.05,P[n]-dn*An*.32];
 for(let i=0;i<5;i++)band(P[n]-dn*An*rr(.1,.3),Math.min(...s1),Math.max(...s1),An*.03); // Nachlauf: kurz zurück, das Ende bleibt das Extrem
 const f=o.log?Math.log:(v=>v),all=cand.flatMap(k=>[k.h,k.l]).map(f),fmn=Math.min(...all),fmx=Math.max(...all),pad=(fmx-fmn)*.14,lo=fmn-pad,hi=fmx+pad;
 const yOf=p=>PT+(hi-f(p))/(hi-lo)*(PB-PT),N=cand.length,sp=(PR-PL-20)/N,bw=Math.max(3,Math.round(sp*.62)|1),xOf=i=>Math.round(PL+10+(i+.5)*sp);
 const cv=document.createElement('canvas');cv.width=W0;cv.height=H0;const g=cv.getContext('2d');g.fillStyle=C.bg;g.fillRect(0,0,W0,H0);
 g.fillStyle=C.bar;g.fillRect(0,0,W0,40);g.fillStyle=C.tx;g.font='13px sans-serif';g.fillText('BTCUSD  1D  ▾   Indikatoren   Alarm   Replay',14,25);
 g.strokeStyle=C.grid;g.lineWidth=1;for(let y=PT+25;y<PB;y+=62){g.beginPath();g.moveTo(PL,y+.5);g.lineTo(PR,y+.5);g.stroke()}for(let xx=PL+60;xx<PR;xx+=110){g.beginPath();g.moveTo(xx+.5,PT-10);g.lineTo(xx+.5,PB);g.stroke()}
 g.fillStyle=C.tx;g.font='12px sans-serif';for(let y=PT+25;y<PB;y+=62){const v=o.log?Math.exp(hi-(y-PT)/(PB-PT)*(hi-lo)):hi-(y-PT)/(PB-PT)*(hi-lo);g.fillText(v.toFixed(1),PR+12,y+4)}
 for(let xx=PL+60;xx<PR;xx+=110)g.fillText(['Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov'][Math.floor(xx/110)%9],xx-10,PB+22);
 g.strokeStyle=C.tx;g.globalAlpha=.4;g.strokeRect(PR+.5,PT-10,0,PB-PT+10);g.globalAlpha=1;
 g.fillStyle=C.tx;g.font='13px sans-serif';g.fillText('Bitcoin / US-Dollar · 1D · BITSTAMP',PL+8,PT-14);
 // TradingView-Legende oben im Chart (Symbol, OHLC-Werte farbig, Indikatorzeilen), gepunktete Linie des letzten Kurses, Preis-Kästchen auf der Achse
 if(o.legend){const lc=cand[cand.length-1],up=lc.c>=lc.o,vc=up?C.up:C.dn,f2=v=>v.toFixed(2);let x=PL+8;const tx=(s,c)=>{g.fillStyle=c;g.fillText(s,x,0);x+=g.measureText(s).width+6};
  g.save();g.font='13px sans-serif';g.translate(0,PT+16);tx('BTCUSD · 1D · BITSTAMP',C.tx);['O','H','L','C'].forEach((k,i)=>{tx(k,C.tx);tx(f2([lc.o,lc.h,lc.l,lc.c][i]),vc)});tx('+1,24 (+0,87 %)',vc);
  g.translate(0,18);x=PL+8;tx('Vol · BTC',C.tx);tx('12,34 K',vc);g.translate(0,18);x=PL+8;tx('RSI 14 close',C.tx);tx('54,21',C.ln);tx('MA 50',C.tx);tx(f2(lc.c*.97),'#ff9800');g.restore();
  const yl=Math.round(yOf(lc.c))+.5;g.strokeStyle=vc;g.setLineDash([1,3]);g.beginPath();g.moveTo(PL,yl);g.lineTo(PR,yl);g.stroke();g.setLineDash([]);
  g.fillStyle=vc;g.fillRect(PR+2,yl-9.5,72,19);g.fillStyle='#fff';g.font='12px sans-serif';g.fillText(f2(lc.c),PR+8,yl+4);
  g.fillStyle=C.ln;g.fillRect(PR+2,yl-30.5,72,17);g.fillStyle='#fff';g.fillText('03:12:44',PR+12,yl-17)}
 const tips=[],cdl=[]; // cdl: je Kerze Spalte und Zeilen von Hoch und Tief (Linie: Punkt der Linie, a = b)
 if(o.kind==='line'){g.strokeStyle=C.ln;g.lineWidth=2;g.lineJoin='round';g.beginPath();cand.forEach((k,i)=>{const X=xOf(i),Y=yOf(k.c);i?g.lineTo(X,Y):g.moveTo(X,Y)});g.stroke();cand.forEach((k,i)=>cdl.push({x:xOf(i),a:yOf(k.c),b:yOf(k.c)}));
  piv.forEach((i,k)=>{const up=k?P[k]>P[k-1]:P[0]>P[1];tips.push({x:xOf(i),y:yOf(cand[i].c)+(up?-1:1),hl:up?'h':'l'})})}
 else{const tk=Math.max(2,Math.round(sp*.32)),wc=dark?'#d1d4dc':'#131722';cand.forEach((k,i)=>{const X=xOf(i),yh=Math.round(yOf(k.h)),yl=Math.round(yOf(k.l)),yt=Math.round(yOf(Math.max(k.o,k.c))),yb=Math.round(yOf(Math.min(k.o,k.c))),up=k.c>=k.o;
   if(o.kind==='ohlc'){g.fillStyle=o.ohlcW?(up?wc:'#787b86'):up?C.up:C.dn;g.fillRect(X,yh,1,yl-yh+1);g.fillRect(X-tk,Math.round(yOf(k.o)),tk,1);g.fillRect(X+1,Math.round(yOf(k.c)),tk,1)} // OHLC-Balken: dünner Strich, Eröffnung links, Schluss rechts
   else{g.fillStyle=up?C.up:C.dn;g.fillRect(X,yh,1,yl-yh+1);g.fillRect(X-(bw-1)/2,yt,bw,Math.max(1,yb-yt))}cdl.push({x:X,a:yh,b:yl})});
  piv.forEach((i,k)=>{const up=k?P[k]>P[k-1]:P[0]>P[1];tips.push({x:xOf(i),y:Math.round(yOf(up?cand[i].h:cand[i].l)),hl:up?'h':'l'})})}
 // schon eingezeichnete Labels (wie das Elliott-Werkzeug von TradingView): blauer Text über dem Hoch bzw. unter dem Tief
 const labs=[];if(o.labels){g.fillStyle=C.ln;g.font='bold 15px sans-serif';g.textAlign='center';const L=o.z==='N'?['1','2','3','4','5']:['A','B','C'];
  tips.slice(1).forEach((q,k)=>{const t='('+L[k]+')',y=q.hl==='h'?q.y-9:q.y+22;g.fillText(t,q.x,y);labs.push({x:q.x,y:y-5})});g.textAlign='left'}
 // Zeichnungen (23.11.2026): Trendlinie durch zwei Hochs bzw. Tiefs, verlängert; Kanal (Parallele durch ein Wendepunkt der Gegenseite); Fibonacci-Stufen
 // (waagerecht vom Start bis zum rechten Rand, mit Beschriftung); Symbol-Kästchen links neben dem Preis-Kästchen. Farbe lila, blau, grau oder Kursfarbe.
 if(o.draw){const cols=['#7e57c2','#2196f3','#787b86',line?C.ln:o.kind==='ohlc'&&o.ohlcW?(dark?'#d1d4dc':'#131722'):C.up],pk=()=>cols[Math.floor(rnd()*cols.length)];
  const hs=tips.filter(q=>q.hl==='h'),ls=tips.filter(q=>q.hl==='l'),ln=(a,b,c,wd,ext)=>{const sl=(b.y-a.y)/(b.x-a.x),x2=Math.min(PR,b.x+(b.x-a.x)*ext);g.strokeStyle=c;g.lineWidth=wd;g.beginPath();g.moveTo(a.x,a.y-(a.hl==='h'?.5:-.5));g.lineTo(x2,a.y+sl*(x2-a.x)-(a.hl==='h'?.5:-.5));g.stroke();return sl};
  const two=a=>a.length>=2?[a[0],a[a.length-1]]:null,T1=rnd()<.5?two(hs):two(ls),touch=q=>{q.tt=1};
  if(T1&&rnd()<.8){T1.forEach(touch);const c=pk(),sl=ln(T1[0],T1[1],c,rnd()<.6?1:2,rr(.1,.6));const op=T1[0].hl==='h'?ls:hs;if(op.length&&rnd()<.5){/* Kanal: Parallele durch den äußersten Wendepunkt der Gegenseite */
    const q=op.reduce((p,v)=>(T1[0].hl==='h'?v.y-(T1[0].y+sl*(v.x-T1[0].x))>p.y-(T1[0].y+sl*(p.x-T1[0].x)):v.y-(T1[0].y+sl*(v.x-T1[0].x))<p.y-(T1[0].y+sl*(p.x-T1[0].x)))?v:p);
    touch(q);ln({...q,hl:q.hl},{x:q.x+100,y:q.y+sl*100,hl:q.hl},c,1,2)}}
  if(rnd()<.5&&tips.length>2){const a=tips[0],b=tips[tips.length-1],c=pk();touch(a);touch(b);g.font='11px sans-serif';[0,.236,.382,.5,.618,.786,1].forEach(v=>{const y=Math.round(a.y+(b.y-a.y)*v)+.5;g.strokeStyle=c;g.lineWidth=1;g.beginPath();g.moveTo(a.x,y);g.lineTo(PR,y);g.stroke();g.fillStyle=c;g.fillText(v+' ('+(100+v*50).toFixed(2)+')',a.x+4,y-3)})}
  if(o.legend&&rnd()<.7){const lc=cand[cand.length-1],yl=Math.round(yOf(lc.c)),bx0=PR-58,bx1=PR-4;g.fillStyle=C.bg;g.fillRect(bx0,yl-9,bx1-bx0,18);g.strokeStyle=C.tx;g.lineWidth=1;g.strokeRect(bx0+.5,yl-8.5,bx1-bx0-1,17);g.fillStyle=C.tx;g.font='11px sans-serif';g.fillText('BTCUSD',bx0+5,yl+4);
   cdl.forEach(q=>{if(q.x>=bx0-3&&q.x<=bx1+3&&q.b>=yl-12&&q.a<=yl+12)q.hid=1})}} // vom Kästchen verdeckte Kerzen werden nicht gewertet
 let out=cv,sc=1;
 if(o.photo){sc=o.big?2.1:1.4;const c2=document.createElement('canvas');c2.width=Math.round(W0*sc);c2.height=Math.round(H0*sc);const h2=c2.getContext('2d');h2.filter='blur(0.7px)';h2.imageSmoothingQuality='high';h2.drawImage(cv,0,0,c2.width,c2.height);h2.filter='none';
  const id=h2.getImageData(0,0,c2.width,c2.height),D=id.data,cw=c2.width,ch=c2.height;
  for(let y=0;y<ch;y++)for(let x2=0;x2<cw;x2++){const i=(y*cw+x2)*4,v=(1-.18*Math.hypot(x2/cw-.5,y/ch-.5))*(dark?1.15:.96),mo=6*Math.sin(x2*.83+y*.29)*Math.sin(y*.71),nz=(rnd()-.5)*16;
   for(let c=0;c<3;c++)D[i+c]=Math.max(0,Math.min(255,D[i+c]*v+(dark?14:0)+mo+nz))}
  h2.putImageData(id,0,0);out=c2}
 const T=(x,y)=>({x:(x+.5)*sc-.5,y:(y+.5)*sc-.5});
 return{url:out.toDataURL(o.photo?'image/jpeg':'image/png',.75),W:out.width,H:out.height,plot:{x0:PL*sc,y0:PT*sc,x1:PR*sc,y1:PB*sc},tips:tips.map(q=>({...T(q.x,q.y),hl:q.hl,tt:q.tt})),labs:labs.map(q=>T(q.x,q.y)),cdl:cdl.map(q=>({x:T(q.x,0).x,a:T(0,q.a).y,b:T(0,q.b).y,hid:q.hid})),
  fy:tips.map((q,k)=>H0-q.y),sc}}`;

module.exports = { MK, PATS };
if (require.main === module) (async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0;
  const DL = path.join(require('os').tmpdir(), 'wc-eigener-chart'); fs.mkdirSync(DL, { recursive: true });
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext({ ...opt, acceptDownloads: true }), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [], OFF = touch ? 22 : 9;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    const cdp = touch ? await ctx.newCDPSession(page) : null;
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(40); };
    const drag = async (x1, y1, x2, y2, hold) => { if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] }); for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 8, y: y1 + (y2 - y1) * i / 8 }] });
        for (let i = 0; i < 3; i++) { await page.waitForTimeout(50); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x2, y: y2 }] }); } if (hold) await hold(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(450); return; }
      await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 8 }); if (hold) await hold(); await page.mouse.up(); await page.waitForTimeout(80); };
    const pts = () => page.evaluate(() => PGS.FR().pts.map(q => ({ id: q.id, c: q.c, i: q.i, t: q.t, p: q.p })));
    let hitD = 0, totD = 0, pspikeD = 0, ptotD = 0, pspike = 0, traceDone = false, pok = 0, ptot = 0, pbad = 0, hit = 0, tot = 0, lhit = 0, ltot = 0, rounds = 0, dragDone = false, pngDone = false;
    const pts0 = await page.evaluate(() => JSON.stringify([localStorage.getItem('waveChecker'), localStorage.getItem('waveChecker.progress')]));
    for (let r = 0; r < N * PATS.length; r++) {
      const P = PATS[r % PATS.length], o = { seed: 1 + Math.floor(Math.random() * 2e9), pr: P.pr, z: P.z, theme: Math.random() < .5 ? 'dark' : 'light', kind: (k => k < .25 ? 'line' : k < .45 ? 'ohlc' : 'candle')(Math.random()), ohlcW: Math.random() < .5, draw: Math.random() < .5, log: Math.random() < .3, photo: Math.random() < .35, labels: Math.random() < .3 };
      o.big = o.photo && Math.random() < .3; o.legend = Math.random() < .6; o.axis = o.legend && Math.random() < .5; // Legende im Chart, Zuschnitt mit Preisachse
      const desc = P.name + ' [' + [o.theme, o.kind, o.log ? 'log' : 'linear', o.photo ? (o.big ? 'Foto groß' : 'Foto') : 'Screenshot', o.labels ? 'Labels' : '', o.draw ? 'Zeichnungen' : '', o.kind === 'ohlc' && o.ohlcW ? 'weiß' : '', o.legend ? 'Legende' : '', o.axis ? 'mit Preisachse' : ''].filter(Boolean).join(', ') + ']';
      const img = await page.evaluate(new Function('return ' + MK)(), o).catch(e => { fail('Testbild: ' + e.message); return null; }); if (!img) continue;
      // ---- 1) Hochladen und Zuschneiden ----
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      const txt = await page.evaluate(() => document.querySelector('#view').textContent);
      if (!/erkennt keine Wellen selbst/.test(txt) || !/keine Kursprognose oder Anlageempfehlung/.test(txt) || !/nicht hochgeladen/.test(txt)) fail('Hinweistext fehlt auf der Startseite des Bereichs');
      const buf = Buffer.from(img.url.split(',')[1], 'base64');
      await page.setInputFiles('#ocfile', { name: o.photo ? 'foto.jpg' : 'chart.png', mimeType: o.photo ? 'image/jpeg' : 'image/png', buffer: buf });
      await page.waitForSelector('#occv'); await page.waitForTimeout(150);
      const cb = await page.evaluate(() => { const c = document.querySelector('#occv'); c.scrollIntoView({ block: 'center', behavior: 'instant' }); const b = c.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
      const S = cb.w / img.W, m = 3 / S; // 3 Bildpixel innerhalb des Plotbereichs
      await page.click('#ocall'); // erst ganzes Bild, dann den Rahmen neu ziehen (der Zuschnitt-Vorschlag hat sonst Kanten, die man greift; seit 25.11.2026)
      await drag(cb.x + (img.plot.x0 + m) * S, cb.y + (img.plot.y0 + m) * S, cb.x + (img.plot.x1 + (o.axis ? 85 * img.sc : 0) - m) * S, cb.y + (img.plot.y1 - m) * S);
      await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg'); await page.waitForTimeout(200);
      const crop = await page.evaluate(() => ({ ...PGS.img.crop, w: PGS.img.w, h: PGS.img.h }));
      if (Math.abs(crop.x - img.plot.x0) > 4 / S + 3 || Math.abs(crop.y - img.plot.y0) > 4 / S + 3) fail('Zuschneiden: Rahmen nicht am gezogenen Ort (' + desc + ')');
      if (o.big && !(crop.f < 1 && Math.max(crop.w, crop.h) <= 2000)) fail('großes Foto wird nicht auf 2000 px verkleinert');
      // erwartete Lage im zugeschnittenen Bild
      const exp = img.tips.map(q => ({ t: (q.x - crop.x) * crop.f, p: crop.h - (q.y - crop.y) * crop.f - .5, hl: q.hl }));
      const tol = (o.kind === "line" ? 3.2 : 1.2) * (o.photo ? 3.3 : 1) * Math.max(1, crop.f), et = Math.max(tol, 1.2 * img.sc * crop.f);
      // ---- 1b) erkannter Verlauf: je Kerze Hoch und Tief in der Spalte des Dochts (Foto: ±1 Spalte), Linie: der Verlauf umfasst den Linienpunkt
      const pv = await page.evaluate(() => ({ hi: Array.from(PGS.img.path.hi), lo: Array.from(PGS.img.path.lo) })), ptol = (o.photo ? 3.5 : 1.5) * Math.max(1, crop.f * img.sc);
      img.cdl.forEach(q => { if (q.hid) return; const x = Math.round((q.x - crop.x) * crop.f); if (x < 2 || x > crop.w - 3) return; const a = (q.a - crop.y) * crop.f, b = (q.b - crop.y) * crop.f; if (a < 1 || b > crop.h - 2) return;
        const xs = o.photo ? [x - 1, x, x + 1] : [x], his = xs.map(c => pv.hi[c]).filter(v => v >= 0), los = xs.map(c => pv.lo[c]).filter(v => v >= 0); if (o.draw) ptotD++; else ptot++;
        const hi = his.length ? Math.min(...his) : -1, lo = los.length ? Math.max(...los) : -1;
        const ok = hi >= 0 && (o.kind === 'line' ? hi <= a + ptol && lo >= b - ptol : Math.abs(hi - a) <= ptol && Math.abs(lo - b) <= ptol);
        // senkrechte Ausschläge: Verlauf reicht über die Kerzen der Nachbarschaft hinaus (z. B. bis zur Legende)
        if (hi >= 0) { const nb = img.cdl.map(c => ({ x: (c.x - crop.x) * crop.f, a: (c.a - crop.y) * crop.f, b: (c.b - crop.y) * crop.f })).filter(c => Math.abs(c.x - x) <= Math.max(2, 1.6 * Math.abs(img.cdl[1].x - img.cdl[0].x) * crop.f)); if (nb.length && (hi < Math.min(...nb.map(c => c.a)) - 3 * ptol || lo > Math.max(...nb.map(c => c.b)) + 3 * ptol)) { if (o.draw) pspikeD++; else pspike++; if (process.env.DBG) console.log('   Ausschlag', name, desc, 'Spalte', x, hi, lo, 'o=' + JSON.stringify({ pi: r % PATS.length, seed: o.seed, theme: o.theme, kind: o.kind, log: o.log, photo: o.photo, big: o.big, labels: o.labels, legend: o.legend, axis: o.axis })); } }
        if (ok) pok++; else if (process.env.DBG && pbad++ < 8) console.log('   Verlauf', name, desc, 'Spalte', x, 'erwartet', a.toFixed(1), b.toFixed(1), 'erkannt', hi, lo); });
      // ---- 2) Zählen mit echten Tipps ----
      await page.evaluate(z => document.querySelector('[data-fz="' + z + '"]').click(), P.z); await page.waitForTimeout(60);
      let placed = 0;
      for (let k = 0; k < exp.length; k++) {
        // Start (k = 0): noch keine Richtung bekannt, Hoch oder Tief entscheidet die Nähe. Der Finger liegt dort auf oder jenseits des Extrems.
        const onLab = o.labels && k > 0 && img.labs[k - 1]; let [dx, dy] = disc(onLab ? (touch ? 8 : 4) : OFF); if (!k) dy = Math.abs(dy) * (exp[0].hl === 'h' ? -1 : 1);
        const pos = await page.evaluate(([t, p, lx, ly, dx, dy, cr]) => { const S = PGS; document.querySelector('#pgc').scrollIntoView({ block: 'center', behavior: 'instant' }); const b = document.querySelector('#svg').getBoundingClientRect();
          let x, y; if (lx !== null) { x = b.left + S.X((lx - cr.x) * cr.f) + dx; y = b.top + S.Y(cr.h - (ly - cr.y) * cr.f - .5) + dy; } else { x = b.left + S.X(t) + dx; y = b.top + S.Y(p) + dy; }
          const e = document.elementFromPoint(x, y); return e && e.closest('#svg') ? { x, y } : null; }, [exp[k].t, exp[k].p, onLab ? onLab.x : null, onLab ? onLab.y : null, dx, dy, crop]);
        if (!pos) { if (process.env.DBG) console.log('   verdeckt', name, k); break; }
        await page.waitForTimeout(touch ? 360 : 60); if (process.env.EVLOG) await page.evaluate(() => { window.EVL = []; ['pointerdown','pointerup','pointercancel','click'].forEach(t => addEventListener(t, e => EVL.push(t + ':' + (e.target.id || e.target.tagName) + ':' + Math.round(e.clientX) + ',' + Math.round(e.clientY) + ':' + (typeof GEST === 'function')), { capture: true, once: false })); }); await tap(pos.x, pos.y);
        const Q = await pts(), q = Q[Q.length - 1]; if (Q.length !== placed + 1) { fail('Tipp setzt keinen Punkt (k=' + k + ', ' + desc + ', Meldung: ' + (await page.evaluate(() => (document.querySelector('#toast') || {}).textContent)) + ', Ziel ' + pos.x.toFixed(0) + ',' + pos.y.toFixed(0) + ')' + (process.env.EVLOG ? ' EV ' + (await page.evaluate(() => JSON.stringify(window.EVL))) : '')); break; } placed++;
        const tk = img.tips[k].tt ? Math.max(tol, 3 * Math.max(1, crop.f * img.sc)) : tol; // eine Zeichnung berührt den Docht genau an der Spitze
        const okk = Math.abs(q.t - exp[k].t) <= Math.max(et, tk) && Math.abs(q.p - exp[k].p) <= tk;
        if (o.draw) { totD++; if (okk) hitD++; } else if (onLab) { ltot++; if (okk) lhit++; } else { tot++; if (okk) hit++; }
        if (!okk && process.env.DBG) console.log('   daneben', name, desc, 'k=' + k, onLab ? 'auf Label' : '', 'dt=' + (q.t - exp[k].t).toFixed(1), 'dp=' + (q.p - exp[k].p).toFixed(1), 'Versatz', dx.toFixed(0), dy.toFixed(0), 'seed', o.seed, 'Kandidaten', JSON.stringify(await page.evaluate(() => (PGS.img.cand || []).map(c => [c.t, +c.p.toFixed(1), c.hl, +c.s.toFixed(1)]).slice(0, 5))));
        // Punkt nicht am Docht: auf den erwarteten Pixel setzen, damit die Prüfung unten das Muster prüft, nicht den Fehlgriff
        if (!okk) await page.evaluate(([id, t, p]) => { const q = PGS.FR().pts.find(x => x.id === id); q.t = t; q.p = p; }, [q.id, Math.round(exp[k].t), exp[k].p]);
      }
      if (placed !== exp.length) continue; rounds++;
      // „Bild blasser“ und Label-Hintergrund
      const fd = await page.evaluate(() => { const r = document.querySelector('#ocfr'); r.value = 60; r.dispatchEvent(new Event('input')); return { op: +document.querySelector('#ocfade').getAttribute('opacity'), bg: document.querySelectorAll('#svg .pglbg,#svg .pgc1').length }; });
      if (Math.abs(fd.op - .6) > .01) fail('Regler „Bild blasser“ wirkt nicht'); if (!fd.bg) fail('Labels ohne Hintergrund');
      // ---- 6) Verlauf nachzeichnen (einmal je Gerät): Bogen über die Bildmitte ziehen, der Verlauf folgt dem Strich, ein Tipp neben die Spitze
      // rastet auf ihr ein, „Erkannten Verlauf wiederherstellen“ stellt alles zurück
      if (!traceDone) { traceDone = true; await page.waitForTimeout(450); await page.click('#octr'); await page.waitForTimeout(150);
        const g = await page.evaluate(() => { document.querySelector('#pgc').scrollIntoView({ block: 'center', behavior: 'instant' }); const b = document.querySelector('#svg').getBoundingClientRect(), I = PGS.img;
          const xa = b.left + PGS.X(I.w * .35), xb = b.left + PGS.X(I.w * .65), ym = b.top + PGS.Y(I.h * .5), A = (PGS.Y(0) - PGS.Y(I.h)) * .25; return { xa, xb, ym, A, top: b.top, left: b.left, BW: PGS.view().BW }; });
        const P = []; for (let i = 0; i <= 30; i++) { const u = i / 30; P.push([g.xa + (g.xb - g.xa) * u, g.ym - g.A * Math.sin(Math.PI * u)]); }
        if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: P[0][0], y: P[0][1] }] }); for (const [x, y] of P.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await page.waitForTimeout(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
        else { await page.mouse.move(P[0][0], P[0][1]); await page.mouse.down(); for (const [x, y] of P.slice(1)) await page.mouse.move(x, y); await page.mouse.up(); }
        await page.waitForTimeout(200);
        const tr = await page.evaluate(([P, top, left]) => { const I = PGS.img, PA = I.path; let n = 0, bad = 0, man = 0; for (let i = 2; i < P.length - 2; i++) { const t = Math.round(PGS.Tof(P[i][0] - left)), r = Math.round(I.h - PGS.Pof(P[i][1] - top) - .5); n++; if (PA.man[t]) man++; if (Math.abs(PA.hi[t] - r) * PGS.view().BW > 4 || Math.abs(PA.lo[t] - r) * PGS.view().BW > 4) bad++; } return { n, bad, man }; }, [P, g.top, g.left]);
        if (tr.man < tr.n || tr.bad > 1) fail('Nachzeichnen: Verlauf folgt dem Strich nicht (' + JSON.stringify(tr) + ')');
        const top = P[15], sn = await page.evaluate(([x, y, touch]) => { const F = PGS.FR(), keep = F.pts; F.pts = []; try { return PGS.snapAt(x, y, { touch, want: 'h' }); } finally { F.pts = keep; } }, [top[0] - g.left + 6, top[1] - g.top + 8, touch]); /* bestehende Punkte ausgeblendet: die hätten Vorrang */
        if (!sn || sn.kind !== 'img' || Math.abs((await page.evaluate(p => PGS.Y(p), sn.p)) - (top[1] - g.top)) > 4) fail('Nachzeichnen: Einrasten auf der Spitze des Strichs klappt nicht (' + JSON.stringify(sn) + ')');
        await page.waitForTimeout(450); await page.click('#ocrs'); await page.waitForTimeout(100);
        const back = await page.evaluate(() => { const I = PGS.img; return I.path.man.every(v => !v) && I.path.hi.every((v, i) => v === I.auto.hi[i]); }); if (!back) fail('„Erkannten Verlauf wiederherstellen“ stellt nicht zurück');
        await page.waitForTimeout(450); await page.click('#octr'); await page.waitForTimeout(100); }
      // ---- 4) Ziehen (einmal je Gerät): ins Leere frei, zurück neben den Docht rastet ein ----
      if (!dragDone && P.z === 'N' && !o.labels && !o.draw) { // ohne Zeichnungen: die leere Stelle soll wirklich leer sein
        await page.evaluate(() => document.querySelector('[data-md="sel"]').click()); await page.waitForTimeout(120);
        const q3 = (await pts())[3], a = await page.evaluate(([t, p]) => { document.querySelector('#pgc').scrollIntoView({ block: 'center', behavior: 'instant' }); const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left + PGS.X(t), y: b.top + PGS.Y(p), bt: b.top }; }, [q3.t, q3.p]);
        // freie Stelle suchen (kein Docht im Fangbereich), wohin der Punkt gezogen wird
        const fy = touch ? 34 : 0, fr = await page.evaluate(([x, y, touch, hl, up]) => { const b = document.querySelector('#svg').getBoundingClientRect(), H = PGS.plot().H;
          const F = PGS.FR().pts; for (const d of [60, 90, 120, 40, 150]) for (const dx of [0]) { const yy = y - b.top + up * d, xx = x - b.left + dx; if (yy < 60 || yy > H - 12) continue; const r = PGS.snapAt(xx, yy, { touch, want: hl, tmin: F[2].t, tmax: F[4].t }); if (r && r.kind === 'free') return { x: xx + b.left, y: yy + b.top }; } return null; }, [a.x, a.y, touch, exp[3].hl, exp[3].hl === 'h' ? -1 : 1]);
        const ty = fr && fr.y;
        if (fr && fr.y + fy < (await page.evaluate(() => document.querySelector('.dock').getBoundingClientRect().top)) - 8) { await drag(a.x, a.y, fr.x, ty + fy);
          let q = (await pts())[3]; const pf = await page.evaluate(y => PGS.Pof(y - document.querySelector('#svg').getBoundingClientRect().top), ty);
          if (Math.abs(q.p - pf) > 2 / (await page.evaluate(() => PGS.view().BW))) fail('Ziehen ins Leere: Punkt bleibt nicht frei stehen (' + desc + ')');
          const b2 = await page.evaluate(([t, p]) => { const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left + PGS.X(t), y: b.top + PGS.Y(p) }; }, [q.t, q.p]), [dx, dy] = disc(touch ? 10 : 5);
          const tg = await page.evaluate(([t, p]) => { const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left + PGS.X(t), y: b.top + PGS.Y(p) }; }, [exp[3].t, exp[3].p]);
          let ring = null; await drag(b2.x, b2.y + (touch ? 0 : 0), tg.x + dx, tg.y + dy + fy, async () => { ring = await page.evaluate(() => PGS.ring()); });
          q = (await pts())[3];
          if (!ring) fail('Ziehen: kein Ring am Einrastziel');
          if (!(Math.abs(q.t - exp[3].t) <= et && Math.abs(q.p - exp[3].p) <= tol)) fail('Ziehen zurück neben den Docht rastet nicht ein (dt=' + (q.t - exp[3].t).toFixed(1) + ' dp=' + (q.p - exp[3].p).toFixed(1) + ', ' + desc + ')');
          dragDone = true; await page.evaluate(([i, t, p]) => { const q = PGS.FR().pts[i]; q.t = t; q.p = p; }, [3, Math.round(exp[3].t), exp[3].p]); }
      }
      // ---- 3) Prüfen und mit den bekannten Preisen vergleichen ----
      await page.evaluate(() => { const b = document.querySelector('#fchk'); b.scrollIntoView({ block: 'center', behavior: 'instant' }); }); await page.waitForTimeout(80);
      const fb0 = await page.$('#fchk'); if (await fb0.isDisabled()) { fail('Prüfen gesperrt trotz vollständiger Zählung (' + desc + ')'); continue; }
      await page.waitForTimeout(450); /* Klicks bis 400 ms nach einem Touch-Tipp verschluckt die App absichtlich (PGTAPT) */ await page.click('#fchk'); await page.waitForTimeout(120);
      const want = await page.evaluate(([pr, z]) => { const fam = Object.keys(PAT).filter(k => PAT[k].labels.join() === PAT[PGZL[z]].labels.join()).map(k => PAT[k]);
        const ok = fam.some(Q => { const v = norm(Q, pr); return hardFails(Q, v).length === 0; }), Q0 = PAT[PGZL[z]]; return { ok, f0: hardFails(Q0, norm(Q0, pr)) }; }, [o.log ? img.fy : P.pr, P.z]);
      const got = await page.evaluate(() => ({ ...PGS.res, html: document.querySelector('#fb').textContent }));
      if (process.env.SHOTS && r < 6) await page.screenshot({ path: path.join(process.env.SHOTS, name + '-' + r + '.png'), fullPage: true });
      if (got.ok !== want.ok) fail('Prüfung weicht ab: App ' + (got.ok ? 'regelkonform' : 'verstößt (' + got.errs + ')') + ', erwartet ' + (want.ok ? 'regelkonform' : 'Verstoß ' + want.f0) + ' (' + desc + ')');
      else if (!want.ok && !want.f0.some(id => got.errs.includes(id))) fail('Prüfung nennt eine andere Regel: ' + got.errs + ' statt ' + want.f0 + ' (' + desc + ')');
      if (want.ok && !(got.state === 'ok' ? /Deine Zählung ist regelkonform/.test(got.html) : got.state === 'warn' && /Prüfe die Subwellen/.test(got.html) && /Die Hauptwellen sind regelkonform/.test(got.html))) fail('Überschrift passt nicht (' + got.state + ')'); // seit 23.11.: Warnsignale zur Unterteilung ergeben „Prüfe die Subwellen“
      if (!want.ok && !/verstößt/.test(got.html)) fail('Text „verstößt gegen …“ fehlt');
      if (/richtige Zählung|Punkte\b.*\+|\+\d+ Punkte/.test(got.html)) fail('Formulierung oder Punkte im Ergebnis: ' + got.html.slice(0, 120));
      if (!/keine Kursprognose oder Anlageempfehlung/.test(got.html)) fail('Hinweistext fehlt im Ergebnis');
      if (!o.log && P.pr && want.ok && !got.lines && P.z === 'N') fail('keine Invalidierungslinien');
      // ---- 5) Ergebnis als Bild ----
      if (!pngDone) { const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.waitForTimeout(450).then(() => page.click('#ocsave'))]);
        if (!dl) fail('Als Bild speichern: kein Download'); else { const f = path.join(DL, name + '.png'); await dl.saveAs(f); const b = fs.readFileSync(f);
          if (b.length < 20000 || b.readUInt32BE(0) !== 0x89504e47) fail('PNG fehlerhaft (' + b.length + ' Byte)'); else { const w = b.readUInt32BE(16), h = b.readUInt32BE(20); if (w < 600) fail('PNG zu klein: ' + w + '×' + h); console.log('   Bild gespeichert: ' + f + ' (' + w + '×' + h + ')'); }
          pngDone = true; } }
      // Zählung ändern geht wieder zum Bearbeiten
      if (r === 0) { await page.waitForTimeout(450); await page.click('#ocedit'); if (!(await page.$('#fchk'))) fail('„Zählung ändern“ führt nicht zurück'); }
    }
    const pts1 = await page.evaluate(() => JSON.stringify([localStorage.getItem('waveChecker'), localStorage.getItem('waveChecker.progress')]));
    if (pts0 !== pts1) fail('Spielstand (Punkte/Serie) hat sich geändert');
    const rate = tot ? hit / tot : 1, lr = ltot ? lhit / ltot : 1;
    console.log(name + ': ' + rounds + ' Runden, Einrasten ' + hit + '/' + tot + ' (' + (100 * rate).toFixed(1) + ' %)' + (ltot ? ', auf vorhandenes Label getippt ' + lhit + '/' + ltot + ' (' + (100 * lr).toFixed(1) + ' %)' : ''));
    console.log(name + ': erkannter Verlauf ' + pok + '/' + (ptot + ptotD) + ' Kerzen (' + (100 * pok / Math.max(1, ptot + ptotD)).toFixed(1) + ' %)'); if (pok < .95 * (ptot + ptotD)) fail('Verlauf an weniger als 95 % der Kerzen richtig erkannt'); if (pspike > .004 * ptot) fail(pspike + ' senkrechte Ausschläge im erkannten Verlauf'); else if (pspike) console.log('   ' + pspike + ' einzelne Ausschlag-Spalten (Toleranz 0,4 % der Kerzen: Schrift der Legende nah an den Kerzen auf Fotos)');
    // mit Zeichnungen (Trendlinie, Kanal, Fibonacci, Symbol-Kästchen; seit 23.11.2026): Linien berühren Dochte genau an der Spitze, auf Fotos verschmelzen
    // Beschriftungen mit Kerzen, daher eigene Schwellen: Einrasten ab 88 %, Ausschläge bis 2 % der Kerzen (gemessen 23.11.: rund 89–100 % bzw. 0–1,5 %)
    const rD = totD ? hitD / totD : 1; console.log(name + ': mit Zeichnungen Einrasten ' + hitD + '/' + totD + ' (' + (100 * rD).toFixed(1) + ' %), Ausschläge ' + pspikeD + ' bei ' + ptotD + ' Kerzen');
    if (totD >= 10 && rD < .88) fail('Einrasten mit Zeichnungen unter 88 %'); if (pspikeD > .02 * ptotD) fail(pspikeD + ' senkrechte Ausschläge mit Zeichnungen');
    if (rate < .95) fail('Einrasten unter 95 %'); if (ltot >= 5 && lr < .9) fail('Abpausen: Tipp auf Label trifft den Docht zu selten');
    if (!rounds) fail('keine einzige vollständige Runde');
    if (errs.length) fail('Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
