/* js/modi/eigener-chart-erkennung.js – Bilderkennung für „Eigenen Chart prüfen“: Kerzensuche (ocKerzen), Kursverlauf aus dem Bild (ocPath), Sicherheit
   der Erkennung (ocUnsR, ocQS, ocSure). Details: docs/eigener-chart.md.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- „Eigenen Chart prüfen“ (20.11.2026, Lenny): Bild hochladen, Chartbereich zuschneiden, dann zählen wie in „Wie geht es weiter?“ Schwer
// (progn mit {img}). Ohne KI und ohne Server: Das Bild wird nur im Browser gelesen und nie verschickt. Grundlage nur das Regelwerk (Version 15).
// Preise immer linear aus der Pixelhöhe. Kein Spielmodus: keine Punkte, keine Serie, keine Ränge.
// Kursverlauf aus dem Bild (23.11.2026, Lenny), ohne KI: je Bildspalte höchstes und tiefstes Pixel von Kerzen bzw. Linie.
// Hintergrund je Kachel (48 px, häufigste Farbe; weicht sie stark vom ganzen Bild ab, dessen häufigste Farbe), abweichend ab einer Schwelle
// nach dem Kontrast des Bilds. Herausgefiltert: dünne waagerechte bzw. senkrechte Linien über weite Strecken (Gitter, Preislinie, Fadenkreuz;
// wo eine Kerze sie kreuzt, bleibt sie ganz), Störpixel (unter 4 zusammen), kleine freistehende „Wörter“ (Text, schon eingezeichnete Labels,
// bis 110 × 44 px), gestrichelte Linien (höchstens 3 px hoch), breite Formen am unteren Rand neben dem Hauptchart (Volumen), Randbänder mit
// Schrift (Legende, Achsen) und je Spalte alles außer dem Strang, der zum Verlauf der Nachbarspalten passt (seit 23.11.2026). Blasse Dochtspitzen (Fotos) werden mit schwacher Schwelle um bis zu 6 px verlängert.
// Ergebnis: IMG.path = {hi, lo (Zeile, -1 = nichts erkannt), man (1 = nachgezeichnet)}, IMG.auto = erkannte Werte zum Wiederherstellen.
// Kerzensuche (25.11.2026, Lenny, nach Discord-Feedback CoreWeave: Treppen entlang von Fibonacci-Boxen): Kerzen finden statt „alles, was nicht
// Hintergrund ist“. 1. Hintergrund je 16-px-Kachel (häufigste Farbe nah am Charthintergrund, also auch die Füllung einer halbtransparenten Box).
// 2. Kerzenfarben aus der Form: Farben kräftiger Pixel in senkrechten Strichen, über die Breite verteilt; gibt es gefüllte Körper (ab 3 × 3 px),
// zählen nur Farben mit Körpern (keine Labels in Kreisen). 3. Ein Pixel ist Kerze, wenn sein Abstand zum lokalen Hintergrund in Richtung der
// Kerzenfarbe zeigt (Abstand = s × (Kerzenfarbe − Charthintergrund), s 0,5–1,35): Eine halbtransparente Box über der Kerze verschiebt beide gleich,
// die Kerze in der Box bleibt erkannt, die Box selbst nicht. 4. Nur Säulen: dünne waagerechte Stücke (Box-Kanten, Fib-Linien) und Ketten kleiner
// Formen auf einer Höhe (Beschriftungen in Kerzenfarbe) fallen weg, ebenso als Zeichnung entfernte Pixel und Legende/Achsen (ex).
// Ergebnis: {M (1 + Farbindex je Pixel), soft (schwacher Treffer für blasse Spitzen), Wb (Körperbreite), info} oder null (keine Kerzen, z. B.
// Linienchart: dann gilt der bisherige Weg).
function ocKerzen(k){const{D,w,h,n,AX,G,T,p98,ex,exG}=k,NZ=Math.min(20,k.n9||0) /* Rauschen des Hintergrunds (Fotos) */,Q=c=>(D[c]>>4)<<8|(D[c+1]>>4)<<4|D[c+2]>>4,md=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
 const TS=16,tw=Math.ceil(w/TS),th=Math.ceil(h/TS),TB=[],cnt=new Uint16Array(4096),touched=[];
 for(let ty=0;ty<th;ty++)for(let tx=0;tx<tw;tx++){const x0=tx*TS,y0=ty*TS,x1=Math.min(w,x0+TS),y1=Math.min(h,y0+TS);let bk=-1,bn=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const q=Q((y*w+x)*4);if(!cnt[q])touched.push(q);if(++cnt[q]>bn){bn=cnt[q];bk=q}}
  touched.forEach(q=>cnt[q]=0);touched.length=0;let r=0,g=0,b=0,c=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const j=(y*w+x)*4;if(Q(j)===bk){r+=D[j];g+=D[j+1];b+=D[j+2];c++}}
  // Fotos: Rauschen verteilt eine Fläche auf viele Farbstufen, daher zählen alle Pixel nahe der häufigsten Farbe (±10 + Rauschen)
  const c0=[r/c,g/c,b/c],TT=10+NZ;r=g=b=c=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const j=(y*w+x)*4;if(Math.abs(D[j]-c0[0])<=TT&&Math.abs(D[j+1]-c0[1])<=TT&&Math.abs(D[j+2]-c0[2])<=TT){r+=D[j];g+=D[j+1];b+=D[j+2];c++}}
  const col=[r/c,g/c,b/c];TB.push(c>=(x1-x0)*(y1-y0)*.3&&md(col,G)<=120?col:null)} // Kacheln in Kerzenfarbe (breite Körper) fallen unten wieder weg
 // Hintergrund-Kandidaten je Kachel: Charthintergrund und die Kacheln rundherum (Pixel am Rand einer Box liegen in der Nachbarkachel)
 let CB=[];const mkCB=()=>{CB=[];for(let ty=0;ty<th;ty++)for(let tx=0;tx<tw;tx++){const L=[G];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=ty+dy,xx=tx+dx;if(yy<0||xx<0||yy>=th||xx>=tw)continue;const c=TB[yy*tw+xx];if(c&&!L.some(o=>md(o,c)<=6))L.push(c)}CB.push(L)}};mkCB();
 const bgOf=j=>{const x=j%w,y=(j-x)/w;return CB[Math.floor(y/TS)*tw+Math.floor(x/TS)]},ins=j=>{const x=j%w,y=(j-x)/w;return x>=AX.l&&x<AX.r&&y>=AX.t+2&&y<AX.b-2}; // oberste und unterste 2 Zeilen: nur angeschnittene Labels
 const S=new Uint8Array(n);for(let j=0;j<n;j++){if(!ins(j)||ex(j))continue;const c=j*4,p=[D[c],D[c+1],D[c+2]];let m=1e9;for(const b of bgOf(j)){const d=md(p,b);if(d<m)m=d}if(m>=T)S[j]=1}
 const runs=(A,vert)=>{const R=new Uint8Array(n);if(vert){for(let x=0;x<w;x++){let y=0;while(y<h){if(!A[y*w+x]){y++;continue}let e=y;while(e+1<h&&A[(e+1)*w+x])e++;const L=Math.min(255,e-y+1);for(let q=y;q<=e;q++)R[q*w+x]=L;y=e+1}}}
   else for(let y=0;y<h;y++){let x=0;while(x<w){if(!A[y*w+x]){x++;continue}let e=x;while(e+1<w&&A[y*w+e+1])e++;const L=Math.min(255,e-x+1);for(let q=x;q<=e;q++)R[y*w+q]=L;x=e+1}}return R};
 // Kerzenfarben aus senkrechten Strichen, gruppiert nach der Richtung vom Charthintergrund aus (Winkel bis rund 10°): kräftige und blasse bzw.
 // unscharfe Pixel derselben Kerzenfarbe liegen auf einer Richtung, nur unterschiedlich weit. Bezug = 90 %-Wert der Entfernung (kräftige Farbe).
 let vr=runs(S,1),hr=runs(S,0);const cl=[],bn=new Map();let tot=0;const DC=Math.max(T,p98*.35);
 for(let j=0;j<n;j++){if(!S[j]||vr[j]<3||vr[j]<1.5*hr[j])continue;const c=j*4,d=[D[c]-G[0],D[c+1]-G[1],D[c+2]-G[2]];if(Math.max(...d.map(Math.abs))<DC)continue;const L=Math.hypot(d[0],d[1],d[2]),u=d.map(v=>v/L);
  const key=Math.round(u[0]*12)*625+Math.round(u[1]*12)*25+Math.round(u[2]*12);let o=bn.get(key);if(!o)bn.set(key,o={s:[0,0,0],n:0,sp:0,m:[]});
  o.n++;o.s[0]+=u[0];o.s[1]+=u[1];o.s[2]+=u[2];if(o.m.length<3000)o.m.push(L);o.sp|=1<<Math.min(23,Math.floor(j%w/w*24));tot++}
 // Richtungs-Fächer nach Häufigkeit zusammenfassen (die häufigsten zuerst; sonst belegte Rauschen auf Fotos die Gruppen, bevor die Kerzen kamen)
 [...bn.values()].sort((a,b)=>b.n-a.n).forEach(b=>{const l=Math.hypot(...b.s),u=b.s.map(v=>v/l);let o=cl.find(q=>q.u[0]*u[0]+q.u[1]*u[1]+q.u[2]*u[2]>=.985);
  if(!o){o={u,s:[0,0,0],n:0,sp:0,m:[]};cl.push(o)}o.n+=b.n;o.s[0]+=b.s[0];o.s[1]+=b.s[1];o.s[2]+=b.s[2];o.sp|=b.sp;for(const v of b.m)o.m.push(v)});
 const bits=v=>{let c=0;while(v){c+=v&1;v>>>=1}return c};
 cl.forEach(o=>{const L=Math.hypot(...o.s),m=o.m.sort((p,q)=>p-q),m9=m[Math.floor(m.length*.9)]||0;o.e=o.s.map(v=>v/L*m9);o.col=o.e.map((v,i)=>G[i]+v)});
 let cand=cl.filter(c=>tot>=100&&c.n>=tot*.03&&bits(c.sp)>=10&&Math.max(...c.e.map(Math.abs))>=50);if(!cand.length)return null;
 const dbg=cand.map(c=>({c:c.col.map(Math.round),n:c.n,sp:bits(c.sp)}));cand=cand.sort((a,b)=>b.n-a.n);{const un=c=>{const l=Math.hypot(...c.e);return c.e.map(v=>v/l)},a=cand[0],ua=un(a),b=cand.slice(1).find(c=>{const u=un(c);return u[0]*ua[0]+u[1]*ua[1]+u[2]*ua[2]<.95});cand=b?[a,b]:[a]} // zweite Farbe nur mit anderer Richtung (auf Fotos zerfällt eine Farbe in mehrere Gruppen)
 // Kerzenpixel relativ zum lokalen Hintergrund
 const E=cand.map(o=>{const e=o.e,ee=e[0]*e[0]+e[1]*e[1]+e[2]*e[2];return{e,ee,tol:10+.1*Math.max(...e.map(Math.abs))+NZ,sm:NZ<3&&Math.max(...e)-Math.min(...e)<=.15*Math.max(...e.map(Math.abs))?.42:.5}}); // 0,42 nur für unbunte Kerzen auf Screenshots (Fotos: Rauschen)
 // Kachelfarben, die selbst Kerzenfarbe sind (s ab 0,45 vom Charthintergrund aus; Box-Füllungen liegen bei 0,15–0,35): breite Kerzenkörper, kein Hintergrund
 {let ch=false;const T0=TB.slice();T0.forEach((c,i)=>{if(!c)return;const tx=i%tw,ty=(i-tx)/tw,R=[G];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=ty+dy,xx=tx+dx;if(yy<0||xx<0||yy>=th||xx>=tw)continue;const q=T0[yy*tw+xx];if(q&&md(q,G)<md(c,G))R.push(q)}
   for(const b of R){const d=[c[0]-b[0],c[1]-b[1],c[2]-b[2]];for(const{e,ee,tol}of E){const s=(d[0]*e[0]+d[1]*e[1]+d[2]*e[2])/ee;if(s>=.45&&Math.max(...d.map((v,k)=>Math.abs(v-s*e[k])))<=tol){TB[i]=null;ch=true;return}}}});if(ch)mkCB()} // auch von einer Box-Füllung daneben aus (Kerze in der Box)
 // Liegt das Pixel (fast) genau auf einer Hintergrundfarbe (auch der Füllung einer Box), ist es Hintergrund. Sonst passt es, wenn es von einem der
 // Hintergründe aus in Richtung einer Kerzenfarbe liegt (eine Kerze in der Box von der Füllung aus, eine Kerze daneben vom Charthintergrund aus).
 const BGT=Math.max(8,T*.4)+1.5*NZ,match=(j,s0,tf)=>{const c=j*4,L=bgOf(j);for(const q of L)if(Math.max(Math.abs(D[c]-q[0]),Math.abs(D[c+1]-q[1]),Math.abs(D[c+2]-q[2]))<=BGT)return 0;
  for(const b of L){const d0=D[c]-b[0],d1=D[c+1]-b[1],d2=D[c+2]-b[2];for(let i=0;i<E.length;i++){const{e,ee,tol,sm}=E[i],s=(d0*e[0]+d1*e[1]+d2*e[2])/ee;if(s<(s0===null?sm:s0)||s>1.35)continue;
   if(Math.max(Math.abs(d0-s*e[0]),Math.abs(d1-s*e[1]),Math.abs(d2-s*e[2]))<=tol*tf)return i+1}}return 0};
 const M=new Uint8Array(n);for(let j=0;j<n;j++)if(ins(j)&&!ex(j))M[j]=match(j,null,1); // s ab 0,5, bei unbunten Kerzenfarben ab 0,42 (26.11.2026): graue Abwärtskerzen neben weißen liegen bei 0,45–0,5
 // blasse, unscharfe Dochte (Fotos): von einem sicheren Kerzenpixel aus senkrecht weiter, solange das Pixel schwach in Kerzenfarbe liegt (s ab 0,25)
 const soft=j=>!ex(j)&&ins(j)&&match(j,.25,1.25)>0,softG=j=>!exG(j)&&ins(j)&&match(j,.25,1.25)>0; // softG: auch durch Pixel, die die Linienerkennung entfernt hat (Trendlinie berührt die Dochtspitze)
 for(let x=0;x<w;x++){for(let y=0;y<h-1;y++){const j=y*w+x;if(M[j]&&!M[j+w]){let q=j+w;while(q<n&&!M[q]&&softG(q)){M[q]=M[j];q+=w}}}
  for(let y=h-1;y>0;y--){const j=y*w+x;if(M[j]&&!M[j-w]){let q=j-w;while(q>=0&&!M[q]&&softG(q)){M[q]=M[j];q-=w}}}}
 // Farbsaum anderer Objekte (Fotos, JPEG: Randpixel eines blauen Labels in Kerzengrün): Kerzenpixel, die in ihrer 5 × 5-Umgebung von mehr als dreimal so
 // vielen kräftigen andersfarbigen Pixeln umgeben sind, fallen weg (ein Docht, den eine Linie kreuzt, bleibt)
 {const del=[];for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const j=y*w+x;if(!M[j])continue;let m=0,o=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const q=j+dy*w+dx;if(M[q])m++;else if(S[q])o++}if(o>3*m)del.push(j)}del.forEach(j=>M[j]=0)}
 // Linienchart statt Kerzen: Bei einer Linie ist der Strich je Spalte nur so lang wie der Anstieg zwischen den Nachbarspalten plus die Liniendicke;
 // Kerzen reichen weiter (Docht von Hoch bis Tief). Linie = eine Hauptfarbe (zweite unter 25 % davon), mindestens 85 % der Spalten belegt und Überschuss im Median höchstens 4 px: dann gilt
 // der bisherige Weg. Zwei kräftige Farben (steigend/fallend) sind immer Kerzen, auch stark gestauchte ohne Lücken.
 let el=0,sp=0,fa=-1,fb=-1;const RS=[],ML=j=>M[j]||(ex(j)&&!exG(j)&&ins(j)&&match(j,null,1)>0); /* auch Pixel, die die Linienerkennung entfernt hat: gerade Stücke einer Kurslinie (26.11.2026) */for(let x=0;x<w;x++){let r=null,m=0;if(x>=AX.l&&x<AX.r)for(let y=AX.t;y<AX.b;y++){if(!ML(y*w+x))continue;if(r&&y-r[1]<=3)r[1]=y;else{m++;r=[y,y]}}
  if(m){el++;sp|=1<<Math.min(23,Math.floor(x/w*24));if(fa<0)fa=x;fb=x}RS.push(m===1?r:null)}
 const ex2=[];for(let x=1;x<w-1;x++){const a=RS[x-1],r=RS[x],b=RS[x+1];if(a&&r&&b)ex2.push(r[1]-r[0]+1-Math.abs(b[0]+b[1]-a[0]-a[1])/4)}ex2.sort((p,q)=>p-q);const lx=ex2.length?ex2[ex2.length>>1]:0,fc=el/Math.max(1,fb-fa+1);
 // Körperbreite: Median der waagerechten Läufe in hohen Säulen; dünne waagerechte Stücke (bis 3 px hoch, ab 1,6 × Körperbreite + 3 lang) fallen weg
 vr=runs(M,1);hr=runs(M,0);const hh=new Uint32Array(256);let hn=0;for(let j=0;j<n;j++)if(vr[j]>=4){hh[hr[j]]++;hn++}
 let Wb=1;for(let a=0,i=0;i<256;i++){a+=hh[i];if(a>=hn/2){Wb=Math.max(1,Math.min(40,i));break}}const HL=Math.max(6,Math.round(Math.min(Wb,8)*1.6)+3); /* dichte Kerzen ohne Lücke ergeben lange Läufe: höchstens 15 px */
 const isLine=(cand.length===1||cand[1].n<cand[0].n*.25)&&fc>=.85&&ex2.length>=50&&(lx<=4+NZ||fc>=.97&&NZ>=3); // Fotos: unscharfe Linie ist dicker, lückenlos und einfarbig genügt
 const HZ=new Uint8Array(n);if(!isLine)for(let j=0;j<n;j++)if(M[j]&&vr[j]<=3&&hr[j]>=HL){M[j]=0;HZ[j]=1}
 // senkrechte Kanten einer Box: Säule, die oben und unten an einer entfernten waagerechten Kante endet (Ecken); ein Docht kreuzt Linien nur
 {const hz=(x,y)=>{for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&HZ[yy*w+xx])return true}return false};
  if(!isLine)for(let x=0;x<w;x++){let y=0;while(y<h){if(!M[y*w+x]){y++;continue}let e=y;while(e+1<h&&M[(e+1)*w+x])e++;if(e-y>=5&&hz(x,y)&&hz(x,e))for(let q=y;q<=e;q++)M[q*w+x]=0;y=e+1}}}
 // Formen (8er-Nachbarschaft)
 const cid=new Int32Array(n).fill(-1),C=[],st=[];for(let j=0;j<n;j++){if(!M[j]||cid[j]>=0)continue;const o={n:0,x0:1e9,x1:-1,y0:1e9,y1:-1,px:[]};cid[j]=C.length;st.push(j);
  while(st.length){const q=st.pop(),qx=q%w,qy=(q-qx)/w;o.n++;o.px.push(q);if(qx<o.x0)o.x0=qx;if(qx>o.x1)o.x1=qx;if(qy<o.y0)o.y0=qy;if(qy>o.y1)o.y1=qy;
   for(let ey=-1;ey<=1;ey++)for(let ex2=-1;ex2<=1;ex2++){const nx=qx+ex2,ny=qy+ey;if(nx<0||ny<0||nx>=w||ny>=h)continue;const r=ny*w+nx;if(M[r]&&cid[r]<0){cid[r]=C.length;st.push(r)}}}C.push(o)}
 // Gepunktete Linien (Preislinie des letzten Kurses): mindestens 5 winzige Punkte (bis 4 Pixel, höchstens 2 px hoch) auf einer Zeile (±1), Abstände bis 8 px
 // und gleichmäßig (±1). Einzelne Balken ohne Bewegung (1 Pixel) liegen nie so in einer Reihe.
 {const dt=C.filter(c=>c.n<=4&&c.y1-c.y0<=1&&c.x1-c.x0<=2).sort((a,b)=>a.y0-b.y0||a.x0-b.x0),by=new Map();dt.forEach(c=>{(by.get(c.y0)||by.set(c.y0,[]).get(c.y0)).push(c)});
  by.forEach((L0,y)=>{const L=[...L0,...(by.get(y+1)||[])].sort((a,b)=>a.x0-b.x0);let i=0;while(i<L.length){let k=i;while(k+1<L.length&&L[k+1].x0-L[k].x0<=8&&L[k+1].x0-L[k].x0>=2)k++;
   if(k-i+1>=5){const g=L.slice(i+1,k+1).map((c,t)=>c.x0-L[i+t].x0);if(Math.max(...g)-Math.min(...g)<=1)for(let t=i;t<=k;t++){L[t].px.forEach(j=>M[j]=0);L[t].txt=1}}i=k+1}})}
 // Labels in Kreisen und Zeichen mit Loch (o, 0, 8, ④ …): Form etwa so breit wie hoch (6–40 px), in mindestens 30 % ihrer Spalten mehrere Striche
 // übereinander (Lücke über 2 px). Kerzen haben je Spalte einen Strich. Formen, die mindestens zur Hälfte im Kreis liegen (Ziffer im Kreis), fallen mit weg.
 {const mr=c=>{const by=new Map();c.px.forEach(j=>{const x=j%w;(by.get(x)||by.set(x,[]).get(x)).push((j-x)/w)});let k=0;for(const v of by.values()){v.sort((p,r)=>p-r);for(let t=1;t<v.length;t++)if(v[t]-v[t-1]>2){k++;break}}return k/by.size};
  const rings=[];C.forEach(c=>{const cw=c.x1-c.x0+1,chh=c.y1-c.y0+1;if(cw>=6&&chh>=6&&cw<=40&&chh<=40&&cw>=chh*.5&&cw<=chh*2&&mr(c)>=.3){c.px.forEach(j=>M[j]=0);c.txt=1;rings.push(c)}});
  if(rings.length)C.forEach(c=>{if(c.txt||c.n>400)return;const inR=j=>{const x=j%w,y=(j-x)/w;return rings.some(r=>x>=r.x0-1&&x<=r.x1+1&&y>=r.y0-1&&y<=r.y1+1)};if(c.px.filter(inR).length>=c.n*.5){c.px.forEach(j=>M[j]=0);c.txt=1}})} // Formen, die zur Hälfte im Kreis liegen (Ziffer, auf kleinen Bildern mit dem Label darunter verschmolzen)
 // Verschmolzene Label-Stapel (kleine Bilder: Kreis, „(v)“, Kreis, darunter der Docht): in Formen mit Löchern fallen die Zeilen mit zwei getrennten Stücken auf Höhe der Löcher
 // (Kreisbögen) samt 2 Zeilen Rand weg; der Docht darunter bleibt.
 {const mr=c=>{const by=new Map();c.px.forEach(j=>{const x=j%w;(by.get(x)||by.set(x,[]).get(x)).push((j-x)/w)});let k=0;for(const v of by.values()){v.sort((p,r)=>p-r);for(let t=1;t<v.length;t++)if(v[t]-v[t-1]>2){k++;break}}return k/by.size};
  C.forEach(c=>{if(c.txt)return;const cw=c.x1-c.x0+1,chh=c.y1-c.y0+1;if(cw<6||chh<6||cw>40||chh>150||mr(c)<.3)return;const rows=new Map();c.px.forEach(j=>{const x=j%w,y=(j-x)/w;(rows.get(y)||rows.set(y,[]).get(y)).push(x)});
   const H=new Set(),by=new Map();c.px.forEach(j=>{const x=j%w;(by.get(x)||by.set(x,[]).get(x)).push((j-x)/w)});by.forEach(v=>{v.sort((p,q)=>p-q);for(let t=1;t<v.length;t++)if(v[t]-v[t-1]>2)for(let y=v[t-1];y<=v[t];y++)H.add(y)}); // Zeilen der Löcher (Kreis)
   const B=new Set();rows.forEach((xs,y)=>{if(!H.has(y))return;xs.sort((p,q)=>p-q);for(let t=1;t<xs.length;t++)if(xs[t]-xs[t-1]>2){for(let d=-2;d<=2;d++)B.add(y+d);break}});if(B.size>=6)c.px.forEach(j=>{const x=j%w;if(B.has((j-x)/w))M[j]=0})})}
 // Beschriftung in Kerzenfarbe: Kette von mindestens 4 kleinen Formen nebeneinander (Lücke bis 0,8 × Höhe), Mitte bzw. Ober- oder Unterkante auf einer Höhe
 // (Kommas: kleine Form an der Unterkante). Formen in festem Abstand (Mitten ±1,5 px bzw. ±12 %) sind Kerzen einer ruhigen Strecke, keine Schrift.
 {const TH=Math.max(16,h*.03),sm=C.map((c,i)=>i).filter(i=>{const c=C[i];return c.n>=2&&c.y1-c.y0+1<=TH&&c.x1-c.x0+1<=TH}).sort((a,b)=>C[a].x0-C[b].x0),used=new Set();
  const link=(A,B)=>{const ah=Math.max(A.y1-A.y0+1,B.y1-B.y0+1),gap=B.x0-A.x1-1;if(gap<-1||gap>Math.max(3,.8*ah))return false;const sA=A.y1-A.y0<=4||B.y1-B.y0<=4;
   return Math.abs(B.y0+B.y1-A.y0-A.y1)/2<=4&&(Math.abs(B.y0-A.y0)<=2||Math.abs(B.y1-A.y1)<=2)||sA&&Math.abs(B.y1-A.y1)<=3&&Math.abs(B.y0+B.y1-A.y0-A.y1)/2<=8};
  sm.forEach(i=>{if(used.has(i))return;const ch=[i];let cur=i;for(;;){let nx=-1;for(const q of sm){if(q===cur||used.has(q)||ch.includes(q))continue;if(C[q].x0>C[cur].x1+TH)break;if(link(C[cur],C[q])){nx=q;break}}if(nx<0)break;ch.push(nx);cur=nx}
   if(ch.length<4)return;const W=ch.map(q=>C[q].x1-C[q].x0+1),Gp=ch.slice(1).map((q,t)=>C[q].x0-C[ch[t]].x1-1),mh=Math.max(...ch.map(q=>C[q].y1-C[q].y0+1)),cw=C[ch[ch.length-1]].x1-C[ch[0]].x0+1;
   const cx=ch.map(q=>(C[q].x0+C[q].x1)/2),dc=cx.slice(1).map((v,t)=>v-cx[t]),dm=[...dc].sort((p,q)=>p-q)[dc.length>>1],reg=dc.every(v=>Math.abs(v-dm)<=Math.max(1.5,dm*.12))&&dm>=3; /* Kerzen stehen im festen Abstand */const mr=q=>{const by=new Map();C[q].px.forEach(j=>{const x=j%w;(by.get(x)||by.set(x,[]).get(x)).push((j-x)/w)});for(const v of by.values()){v.sort((p,r)=>p-r);for(let t=1;t<v.length;t++)if(v[t]-v[t-1]>1)return true}return false},mf=ch.filter(mr).length/ch.length;const hm=ch.map(q=>C[q].y1-C[q].y0+1).sort((p,q)=>p-q)[ch.length>>1];const wm=ch.map(q=>C[q].x1-C[q].x0+1).sort((p,q)=>p-q)[ch.length>>1];if((reg&&mf<.3)||cw<2*mh||hm<6&&wm<=3)return; /* Schrift ist mind. etwa 6 px hoch und breiter; kleinere, schmale Stücke sind dünne Balken auf kleinen Bildern (26.11.2026) */ /* Ziffern mit Löchern (0, 4, 6, 8, %) haben mehrere Striche in einer Spalte, Kerzen nie */ch.forEach(q=>{used.add(q);C[q].px.forEach(j=>M[j]=0);C[q].txt=1})})}
 const info={dbg,cols:cand.map(o=>o.col.map(Math.round)),Wb,el,lx,fc:+fc.toFixed(3),line:isLine};
 if(el<(AX.r-AX.l)*.12||bits(sp)<10)return{fail:info};
 // Kerzenabstand: Median der Abstände benachbarter Kerzen (Mitten der übrigen Formen)
 const cxs=C.filter(c=>!c.txt&&c.x1-c.x0<=3*Wb+4&&c.y1-c.y0>=2&&c.n>=3) /* ohne winzige Reste (Punkte, Splitter), sonst war der Abstand zu klein und OHLC-Balken wurden geteilt (26.11.2026) */.map(c=>(c.x0+c.x1)/2).sort((p,q)=>p-q),dd=cxs.slice(1).map((v,i)=>v-cxs[i]).filter(v=>v>=1).sort((p,q)=>p-q),P=dd.length?Math.max(2,Math.round(dd[dd.length>>1])):Math.max(2,Wb+1);info.P=P;if(!isLine&&(cand.length===1||cand[1].n<cand[0].n*.25)&&lx<=4+NZ&&ex2.length>=50&&P>=20)info.line=true; /* eine Farbe, linienartige Striche und kaum einzelne Formen: Linie (Legende in Linienfarbe drückte fc) */
 return{M,soft,Wb,P,info,line:info.line}}
// Unsichere Bereiche ohne nachgezeichnete Spalten, und wie sicher die Erkennung insgesamt ist (Anteil der Spalten zwischen erstem und letztem Kurs-Stück)
function ocUnsR(I){if(!I||!I.uns)return[];const o=[];I.uns.forEach(([a,b])=>{let s=-1;for(let x=a;x<=b+1;x++){const u=x<=b&&!I.path.man[x];if(u&&s<0)s=x;if(!u&&s>=0){o.push([s,x-1]);s=-1}}});return o}
// Satz unter den Knöpfen (25.11.2026): wie sicher die Kerzensuche ist, und wo man nachzeichnen sollte
function ocQS(I){const q=ocSure(I);if(q===null)return'';const u=ocUnsR(I).length;return'<p class="mut ocqs" id="ocqs"><span class="ocqsw"'+(u?'':' hidden')+'></span>Erkennung zu '+Math.floor(q*100)+' % sicher.'+(u?' Orange markierte Stellen: Prüf dort den Verlauf und zeichne ihn bei Bedarf nach.':'')+'</p>'}
function ocSure(I){if(!I||!I.kz||!I.kz.ok)return null;let a=-1,b=-1;for(let x=0;x<I.w;x++)if(I.auto.hi[x]>=0||I.path.hi[x]>=0){if(a<0)a=x;b=x}if(a<0)return null;let u=0;ocUnsR(I).forEach(([p,q])=>u+=q-p+1);return Math.max(0,1-u/(b-a+1))}
const Q_DRAW=.008; // Anteil der Bildfläche mit entfernten Zeichnungen, ab dem der Hinweis „Erkennung unsicher“ erscheint (25.11.2026)
function ocPath(IMG){IMG.lp=0;IMG.bp=0;const D=IMG.data,w=IMG.w,h=IMG.h,n=w*h,Q=c=>(D[c]>>4)<<8|(D[c+1]>>4)<<4|D[c+2]>>4,RMV=new Uint8Array(n); // RMV: als Zeichnung entfernte Pixel (Linien, Kästchen, Zonenrahmen), für die Kerzensuche (25.11.2026)
 const mode=(x0,y0,x1,y1,st)=>{const cnt=new Uint32Array(4096),sm=new Float64Array(12288);let bk=0;
  for(let y=y0;y<y1;y+=st)for(let x=x0;x<x1;x+=st){const c=(y*w+x)*4,k=Q(c);cnt[k]++;sm[k*3]+=D[c];sm[k*3+1]+=D[c+1];sm[k*3+2]+=D[c+2];if(cnt[k]>cnt[bk])bk=k}
  return cnt[bk]?[sm[bk*3]/cnt[bk],sm[bk*3+1]/cnt[bk],sm[bk*3+2]/cnt[bk]]:[0,0,0]};
 const G=mode(0,0,w,h,Math.max(1,Math.floor(Math.sqrt(n/250000)))),TS=48,tw=Math.ceil(w/TS),BG=[];
 // Rahmen (25.11.2026, Lenny, nach dem CoreWeave-Bild aus dem Discord): Leisten der Oberfläche am Bildrand (Zeilen bzw. Spalten, die zu weniger als
 // 35 % die Hintergrundfarbe des Charts haben, bis 25 % tief) zählen nie zum Kurs.
 const AX={l:0,t:0,r:w,b:h};{const isG=j=>Math.max(Math.abs(D[j*4]-G[0]),Math.abs(D[j*4+1]-G[1]),Math.abs(D[j*4+2]-G[2]))<=12;
  const rowG=y=>{let c=0;for(let x=0;x<w;x+=2)c+=isG(y*w+x);return c/Math.ceil(w/2)},colG=x=>{let c=0;for(let y=0;y<h;y+=2)c+=isG(y*w+x);return c/Math.ceil(h/2)};
  while(AX.t<h*.25&&rowG(AX.t)<.35)AX.t++;while(h-AX.b<h*.25&&rowG(AX.b-1)<.35)AX.b--;while(AX.l<w*.25&&colG(AX.l)<.35)AX.l++;while(w-AX.r<w*.25&&colG(AX.r-1)<.35)AX.r--}
 // Hintergrund je Kachel nur aus Pixeln innerhalb des Rahmens (sonst färbt die Leiste die Kachel, und der Chart daneben gilt als Inhalt)
 for(let ty=0;ty<Math.ceil(h/TS);ty++)for(let tx=0;tx<tw;tx++){const x0=Math.max(AX.l,tx*TS),y0=Math.max(AX.t,ty*TS),x1=Math.min(AX.r,w,tx*TS+TS),y1=Math.min(AX.b,h,ty*TS+TS);let c=x1-x0>=8&&y1-y0>=8?mode(x0,y0,x1,y1,2):G;
  if(Math.max(Math.abs(c[0]-G[0]),Math.abs(c[1]-G[1]),Math.abs(c[2]-G[2]))>60)c=G;BG.push(c)}
 const dv=new Uint8Array(n),dh=new Uint32Array(256);
 for(let y=0;y<h;y++){const row=Math.floor(y/TS)*tw;for(let x=0;x<w;x++){const i=y*w+x,c=i*4,b=BG[row+Math.floor(x/TS)],d=Math.round(Math.max(Math.abs(D[c]-b[0]),Math.abs(D[c+1]-b[1]),Math.abs(D[c+2]-b[2])));dv[i]=d;dh[d]++}}
 let acc=0,p98=0;for(let d=255;d>=0;d--){acc+=dh[d];if(acc>=n*.02){p98=d;break}}
 const T=Math.max(26,Math.min(80,p98*.3));let nb=0,n9=0;for(let d=0;d<T;d++)nb+=dh[d];for(let d=0,a=0;d<T;d++){a+=dh[d];if(a>=nb*.9){n9=d;break}}
 const TW=Math.min(T,Math.max(T*.6,n9*2+6)),on=new Uint8Array(n);for(let i=0;i<n;i++)on[i]=dv[i]>=T?1:0;
 // Gefüllte Zonen (25.11.2026): Fibonacci- und Zielzonen sind große gleichfarbige Flächen. Je Kachel (16 px) die häufigste Farbe; ist sie nicht der
 // Hintergrund, deckt mindestens 45 % der Kachel und kommt in mindestens 4 Kacheln nebeneinander vor, ist es eine Zone: Pixel in dieser Farbe (±14) zählen
 // als Hintergrund (Kerzen darin haben eine andere Farbe und bleiben). Sonst entstünden Treppen entlang der Zonenkanten.
 {const ZT=16,zw=Math.ceil(w/ZT),zh=Math.ceil(h/ZT),zc=[];for(let ty=0;ty<zh;ty++)for(let tx=0;tx<zw;tx++){const cnt=new Map();let tot=0,bk=-1,bn=0;
   for(let y=ty*ZT;y<Math.min(h,ty*ZT+ZT);y++)for(let x=tx*ZT;x<Math.min(w,tx*ZT+ZT);x++){const k=Q((y*w+x)*4);const v=(cnt.get(k)||0)+1;cnt.set(k,v);tot++;if(v>bn){bn=v;bk=k}}
   let col=null;if(bn>=tot*.45){let r=0,g=0,b=0,c=0;for(let y=ty*ZT;y<Math.min(h,ty*ZT+ZT);y++)for(let x=tx*ZT;x<Math.min(w,tx*ZT+ZT);x++){const j=(y*w+x)*4;if(Q(j)===bk){r+=D[j];g+=D[j+1];b+=D[j+2];c++}}
    col=[r/c,g/c,b/c];if(Math.max(Math.abs(col[0]-G[0]),Math.abs(col[1]-G[1]),Math.abs(col[2]-G[2]))<=12)col=null}zc.push(col)}
  const same=(a,b)=>a&&b&&Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]))<=10,zone=new Array(zw*zh).fill(null);
  for(let ty=0;ty<zh;ty++){let tx=0;while(tx<zw){const c=zc[ty*zw+tx];if(!c){tx++;continue}let e=tx;while(e+1<zw&&same(zc[ty*zw+e+1],c))e++;if(e-tx+1>=4)for(let k=tx;k<=e;k++)zone[ty*zw+k]=zc[ty*zw+k];tx=e+1}}
  let nz=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=y*w+x;if(!on[j])continue;const tx=Math.floor(x/ZT),ty=Math.floor(y/ZT);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const c=zone[(ty+dy)*zw+tx+dx];if(ty+dy<0||ty+dy>=zh||tx+dx<0||tx+dx>=zw||!c)continue;
    if(Math.max(Math.abs(D[j*4]-c[0]),Math.abs(D[j*4+1]-c[1]),Math.abs(D[j*4+2]-c[2]))<=14){on[j]=0;RMV[j]=2;nz++;dy=2;break}}}
  // kleinere Zonen pixelweise: gleichfarbige Fläche (±10), waagerecht mindestens 40 px (bzw. 3 % der Breite) und senkrecht mindestens 8 px am Stück.
  // Ihre geraden Ränder (dünne Linie entlang der Zone) fallen mit weg, Dochte, die durch die Zone laufen, bleiben (sie reichen über die Zone hinaus).
  const sc=(a,b)=>Math.max(Math.abs(D[a]-D[b]),Math.abs(D[a+1]-D[b+1]),Math.abs(D[a+2]-D[b+2]))<=10,HZ=Math.max(40,Math.round(w*.03)),hs=new Uint16Array(n),zm=new Uint8Array(n);
  for(let y=0;y<h;y++){let x=0;while(x<w){const j=y*w+x;if(!on[j]){x++;continue}let e=x;while(e+1<w&&on[j+e+1-x]&&sc((y*w+e+1)*4,j*4))e++;const L=e-x+1;for(let k=x;k<=e;k++)hs[y*w+k]=L;x=e+1}}
  for(let x=0;x<w;x++){let y=0;while(y<h){const j=y*w+x;if(hs[j]<HZ){y++;continue}let e=y;while(e+1<h&&hs[(e+1)*w+x]>=HZ&&sc(((e+1)*w+x)*4,j*4))e++;if(e-y+1>=8)for(let k=y;k<=e;k++)zm[k*w+x]=1;y=e+1}}
  for(let j=0;j<n;j++)if(zm[j]){on[j]=0;RMV[j]=2;nz++}
  // Ränder: in 3 px Abstand zur Zone dünne Pixel (senkrecht bzw. waagerecht höchstens 3 px dick)
  {const near=(x,y)=>{for(let d=1;d<=3;d++)for(const [dx,dy] of[[d,0],[-d,0],[0,d],[0,-d]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&zm[yy*w+xx])return true}return false};
   const thin=(x,y)=>{let a=0,b=0;for(let k=-3;k<=3;k++){if(y+k>=0&&y+k<h&&on[(y+k)*w+x])a++;if(x+k>=0&&x+k<w&&on[y*w+x+k])b++}return a<=3||b<=3};
   const del=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=y*w+x;if(on[j]&&near(x,y)&&thin(x,y)){let tall=0;for(let k=1;k<=12;k++){if(y-k>=0&&on[(y-k)*w+x]&&!near(x,y-k))tall++;if(y+k<h&&on[(y+k)*w+x]&&!near(x,y+k))tall++}if(tall<4)del.push(j)}}
   del.forEach(j=>on[j]=0)}
  IMG.nz=nz}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(y<AX.t||y>=AX.b||x<AX.l||x>=AX.r)on[y*w+x]=0;
 // dünne lange Linien: waagerecht ab 35 % der Breite, senkrecht ab 90 % der Höhe (Gitter, Fadenkreuz; ein echter langer Docht bleibt, seit
 // 23.11.2026), höchstens 5 px dick (unscharfe Linien auf Fotos); Kreuzungen mit Kerzen bleiben
 const lr=new Uint8Array(h),lc=new Uint8Array(w);
 for(let y=0;y<h;y++){let r=0;for(let x=0;x<w;x++){if(on[y*w+x]){if(++r>=.35*w){lr[y]=1;break}}else r=0}}
 for(let x=0;x<w;x++){let r=0;for(let y=0;y<h;y++){if(on[y*w+x]){if(++r>=.9*h){lc[x]=1;break}}else r=0}}
 for(let y=0;y<h;){if(!lr[y]){y++;continue}let e=y;while(e+1<h&&lr[e+1])e++;if(e-y<5)for(let x=0;x<w;x++){const up=y>0&&on[(y-1)*w+x],dn=e<h-1&&on[(e+1)*w+x];if(!(up&&dn))for(let yy=y;yy<=e;yy++)on[yy*w+x]=0}y=e+1}
 for(let x=0;x<w;){if(!lc[x]){x++;continue}let e=x;while(e+1<w&&lc[e+1])e++;if(e-x<5)for(let y=0;y<h;y++){const l=x>0&&on[y*w+x-1],r=e<w-1&&on[y*w+e+1];if(!(l&&r))for(let xx=x;xx<=e;xx++)on[y*w+xx]=0}x=e+1}
 // Gezeichnete gerade Linien (24.11.2026 → 23.11.2026, Lenny: Trendlinien, Kanäle, Fibonacci, gestrichelte Preislinie), waagerecht und schräg
 // bis 58°, auch in Kursfarbe. Dünne Pixel (senkrechter Lauf bis 5 px, mit Nachbarn links oder rechts) stimmen für Geraden ab (Hough); jede
 // Kandidatin wird nachgemessen: Treffer je Spalte (±2 px, nur „frei stehende“ Pixel, nicht an Kerzen hängend), Lücken bis 16 Spalten, Länge ab
 // 12 % der Breite (mindestens 50 px), mindestens 35 % der Spalten getroffen (gepunktet: 20 % bei mindestens 20 % der Breite). Entfernt wird sie nur,
 // wenn der Kurs in mindestens 60 % ihrer Spalten woanders liegt (sonst ist die Gerade selbst der Kurs, z. B. ein gerades Stück im Linienchart).
 // Ein echter Kurs ändert ständig die Richtung, eine Zeichnung nicht. Pixel, an denen Kerzen bzw. Balken hängen (längerer Lauf), bleiben.
 const vrun=()=>{const vr=new Uint8Array(n);for(let x=0;x<w;x++){let y=0;while(y<h){if(!on[y*w+x]){y++;continue}let e=y;while(e+1<h&&on[(e+1)*w+x])e++;const L=Math.min(255,e-y+1);for(let k=y;k<=e;k++)vr[k*w+x]=L;y=e+1}}return vr},
  hrun=()=>{const hr=new Uint8Array(n);for(let y=0;y<h;y++){let x=0;while(x<w){if(!on[y*w+x]){x++;continue}let e=x;while(e+1<w&&on[y*w+e+1])e++;const L=Math.min(255,e-x+1);for(let k=x;k<=e;k++)hr[y*w+k]=L;x=e+1}}return hr};
 // dünn = senkrechter Lauf bis 4 px, oder bis 8 px bei mindestens so langem waagerechtem Lauf (dicke, unscharfe Linien auf Fotos)
 {const vr=vrun(),hr=hrun(),thin=j=>on[j]&&(vr[j]<=4||(vr[j]<=8&&hr[j]>=vr[j])),side=(x,y)=>{for(const dx of[-1,1]){const xx=x+dx;if(xx<0||xx>=w)continue;for(let dy=-2;dy<=2;dy++){const yy=y+dy;if(yy>=0&&yy<h&&on[yy*w+xx])return true}}return false};
  const NA=291,A0=-58*Math.PI/180,DA=116*Math.PI/180/(NA-1),SN=[],CS=[];for(let a=0;a<NA;a++){SN.push(Math.sin(A0+a*DA));CS.push(Math.cos(A0+a*DA))}
  const DM=Math.ceil(w*.85)+2,ND=Math.ceil((h+2*DM)/1.5)+2,HV=new Int32Array(NA*ND),pts=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=y*w+x;if(thin(j)&&side(x,y))pts.push(x,y)}
  if(pts.length<4e5)for(let k=0;k<pts.length;k+=2){const x=pts[k],y=pts[k+1];for(let a=0;a<NA;a++)HV[a*ND+Math.round((y*CS[a]-x*SN[a]+DM)/1.5)]++}
  const LM=Math.max(40,Math.round(w*.06)),cand=[];
  for(let a=0;a<NA;a++)for(let d=1;d<ND-1;d++){const v=HV[a*ND+d];if(v<LM*.2)continue;let mx=true;for(let da=-1;da<=1&&mx;da++)for(let dd=-1;dd<=1;dd++){const aa=a+da;if((da||dd)&&aa>=0&&aa<NA&&HV[aa*ND+d+dd]>v){mx=false;break}}if(mx)cand.push([v,a,d])}
  cand.sort((p,q)=>q[0]-p[0]);const alone=(x,y,o)=>{for(const yy of[y-o,y+o])if(yy>=0&&yy<h&&on[yy*w+x]&&!thin(yy*w+x))return false;return true};
  const SEG=[];cand.slice(0,40).forEach(([v,a,d])=>{const sn=SN[a],cs=CS[a],D0=d*1.5-DM,yat=x=>(D0+x*sn)/cs;
   // nachmessen: Pixel nahe der Geraden, Ausgleichsgerade
   let sx=0,sy=0,sxx=0,sxy=0,m=0;for(let x=0;x<w;x++){const yc=Math.round(yat(x));for(let y=yc-3;y<=yc+3;y++)if(y>=0&&y<h&&thin(y*w+x)){sx+=x;sy+=y;sxx+=x*x;sxy+=x*y;m++}}
   if(m<LM*.2)return;const den=m*sxx-sx*sx;if(!den)return;const sl=(m*sxy-sx*sy)/den,b0=(sy-sl*sx)/m;if(Math.abs(sl)>1.7)return;const yf=x=>sl*x+b0;
   // Dicke der Linie: Median der senkrechten Läufe an der Geraden
   const tv=[];for(let x=0;x<w;x+=3){const y=Math.round(yf(x));if(y>=0&&y<h&&thin(y*w+x))tv.push(vr[y*w+x])}tv.sort((p,q)=>p-q);const hw=Math.max(2,(tv.length?tv[tv.length>>1]:2)/2+1),ao=Math.ceil(hw)+2;
   const hit=new Uint8Array(w);for(let x=0;x<w;x++){const yc=yf(x);for(let y=Math.round(yc-hw);y<=Math.round(yc+hw);y++)if(y>=0&&y<h&&thin(y*w+x)&&alone(x,Math.round(yc),ao)){hit[x]=1;break}}
   let x=0;while(x<w){if(!hit[x]){x++;continue}let e=x,c=1,g=0;for(let k=x+1;k<w;k++){if(hit[k]){e=k;c++;g=0}else if(++g>16)break}
    const L=e-x+1,cov=c/L;if(L>=LM&&(cov>=.35||(cov>=.2&&L>=w*.2))){
     /* entfernt wird, solange die Linie weiterläuft (auch unter Schrift, die sie berührt, Lücken bis 16 Spalten), dazu 8 Spalten Rand am Berührpunkt mit der Kerze */
     const h2=xx=>{const yc=yf(xx);for(let y=Math.round(yc-hw);y<=Math.round(yc+hw);y++)if(y>=0&&y<h&&thin(y*w+xx))return true;return false};let xa=x,xb=e;for(let g=0,k=x-1;k>=0&&g<=16;k--){if(h2(k)){xa=k;g=0}else g++}for(let g=0,k=e+1;k<w&&g<=16;k++){if(h2(k)){xb=k;g=0}else g++}
     SEG.push({yf,hw,x,e,xa,xb,L})}
    x=e+1}});
  // Erst alle Linien finden, dann je Linie prüfen, ob der Kurs woanders liegt (24.11.2026): Pixel auf anderen gefundenen Linien (z. B. der
  // gepunkteten Preislinie) zählen dabei nicht als Kurs, sonst verschwand ein gerades Kursstück im Linienchart
  const onSeg=(o,q,y)=>SEG.some(t=>t!==o&&q>=t.xa-8&&q<=t.xb+8&&Math.abs(y-t.yf(q))<=t.hw+1);
  SEG.forEach(o=>{const{yf,hw,x,e,xa,xb,L}=o;let el=0;
   for(let xx=x;xx<=e;xx++){const yc=yf(xx);let f=false;for(let q=Math.max(0,xx-3);q<=Math.min(w-1,xx+3)&&!f;q++)for(let y=Math.max(0,Math.round(yc-h*.5));y<Math.min(h,yc+h*.5);y++)if(on[y*w+q]&&Math.abs(y-yc)>hw+3&&!onSeg(o,q,y)){f=true;break}if(f)el++} /* nur in der Nähe (bis 50 % der Höhe): sonst zählte die Legende oben als Kurs */
     if(el>=L*.6)for(let xx=Math.max(0,xa-8);xx<=Math.min(w-1,xb+8);xx++){const yc=yf(xx);const y0=Math.round(yc-hw-.5),y1=Math.round(yc+hw+.5),O=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&on[y*w+x],wide=y=>O(xx,y)&&O(xx-1,y)&&O(xx+1,y);
       // liegt die Linie auf einem Kerzenkörper (direkt darunter bzw. darüber breit, auf der anderen Seite frei), fällt sie auch dort weg; ein 1 px breiter Docht bleibt
       const body=(wide(y1+1)&&!O(xx,y0-1))||(wide(y0-1)&&!O(xx,y1+1));for(let y=y0;y<=y1;y++){const j=y*w+xx;if(y>=0&&y<h&&on[j]&&(thin(j)||body)){on[j]=0;RMV[j]=1;IMG.lp++}}}})}
 // Kästchen (23.11.2026): Preis-Kästchen, Symbol-Kästchen und Hinweis-Kästchen sind Rechtecke (Rand oben, unten, links, rechts) mit Schrift
 // darin; sie fallen ganz weg, auch wenn sie den Kurs berühren. Ohne Schrift (hohle oder gefüllte Kerze) bleibt das Rechteck.
 {const RP=new Int32Array((w+1)*h);for(let y=0;y<h;y++){let a=0;for(let x=0;x<w;x++){a+=on[y*w+x];RP[y*(w+1)+x+1]=a}}const rc=(y,x0,x1)=>RP[y*(w+1)+x1+1]-RP[y*(w+1)+x0];
  const cc=(x,y0,y1)=>{let c=0;for(let y=y0;y<=y1;y++)c+=on[y*w+x];return c},del=[];
  const box=(x0,x1,y)=>{const bw=x1-x0+1;if(bw<12||bw>w*.35||rc(y-1,x0,x1)>bw*.3)return false; // Oberkante: darüber frei
    for(let y2=y+7;y2<=Math.min(h-2,y+44);y2++){if(rc(y2,x0,x1)<bw*.7||(rc(y2+1,x0,x1)>bw*.6&&!(y2+2<h&&rc(y2+2,x0,x1)<=bw*.3)))continue; /* Unterkante (auf Fotos unscharf: die Zeile darunter halb voll) */const bh=y2-y+1;if(bw<bh*.9)return false;
     let l=0,r=0;for(const dx of[0,1]){l=Math.max(l,cc(x0+dx,y,y2));r=Math.max(r,cc(x1-dx,y,y2))}if(l<bh*.7||r<bh*.7)return false; /* runde Ecken (TradingView-Kästchen): Seiten ab 70 % */
     // Schrift innen: hohles Kästchen 3–70 % Pixel innen; gefülltes Kästchen: andersfarbige Pixel (Schrift) ab 4 %
     let inn=0,tot=0,dif=0;const fc=(y+2)*w+x0+2;for(let yy=y+2;yy<=y2-2;yy++)for(let xx=x0+2;xx<=x1-2;xx++){const j=yy*w+xx;tot++;if(on[j])inn++;const c=j*4,f=fc*4;if(Math.max(Math.abs(D[c]-D[f]),Math.abs(D[c+1]-D[f+1]),Math.abs(D[c+2]-D[f+2]))>60)dif++}
     if(tot&&((inn>tot*.03&&inn<tot*.7)||(inn>=tot*.85&&dif>tot*.04))){del.push([x0,y,x1,y2]);return true}return false}
    // ohne sichtbare Unterkante (blasser Rand): beide Seiten gleich lang (±1, ab 7 px) und Schrift innen
    const sd=x=>{let k=0;while(y+k+1<h&&on[(y+k+1)*w+x])k++;return k},ls=Math.max(sd(x0),sd(x0+1)),rs=Math.max(sd(x1),sd(x1-1)),bh=Math.min(ls,rs)+1;
    if(bh>=7&&bh<=45&&Math.abs(ls-rs)<=1&&bw>=bh*.9){let inn=0,tot=0;for(let yy=y+2;yy<y+bh-1;yy++)for(let xx=x0+2;xx<=x1-2;xx++){tot++;if(on[yy*w+xx])inn++}if(tot&&inn>tot*.03&&inn<tot*.7){del.push([x0,y,x1,y+bh-1]);return true}}return false};
  // Zonen-Rahmen (25.11.2026): großes Rechteck (ab 60 px bzw. 5 % der Breite, bis 45 % der Höhe) mit Kanten oben, unten, links, rechts (je ab 70 %),
  // auch mit Kerzen darin. Weg fallen nur die dünnen Kanten; Kerzen, die sie kreuzen, bleiben. Sonst hielt die Linienerkennung die Unterkante einer
  // Zone, die über das Kursende hinausreicht, für ein Kursstück.
  const zdel=[],zbox=(x0,x1,y)=>{const bw=x1-x0+1;if(bw<Math.max(60,w*.05)||bw>w*.6||rc(y-1,x0,x1)>bw*.3)return false;
    for(let y2=y+8;y2<=Math.min(h-2,y+h*.45);y2++){if(rc(y2,x0,x1)<bw*.7)continue;const bh=y2-y+1;let l=0,r=0;for(const dx of[-1,0,1]){if(x0+dx>=0)l=Math.max(l,cc(x0+dx,y,y2));if(x1+dx<w)r=Math.max(r,cc(x1+dx,y,y2))}
     if(l>=bh*.7&&r>=bh*.7){zdel.push([x0,y,x1,y2]);return true}}return false};
  // Ränder des Kästchens: Anfang bzw. Ende des Laufs oder eine senkrechte Kante darin (das Kästchen berührt links bzw. rechts den Kurs, 23.11.2026)
  const ed=(x,y,d)=>{let a=0,b=0;for(let k=1;k<=6;k++){a+=on[(y+k)*w+x];const z=x+d;if(z>=0&&z<w)b+=on[(y+k)*w+z]}return a>=5&&b<=3};
  for(let y=1;y<h-8;y++){let x=0;while(x<w){if(!on[y*w+x]){x++;continue}let e=x;while(e+1<w&&on[y*w+e+1])e++;const rx0=x,rx1=e;x=e+1;if(rx1-rx0+1<12)continue;
    const L=[rx0],R=[rx1];if(rx0>0&&ed(rx0-1,y,-1))L.push(rx0-1);if(rx1<w-1&&ed(rx1+1,y,1))R.push(rx1+1); /* Ecke fehlt: Kante eine Spalte daneben */for(let k=rx0+1;k<=rx1-11&&L.length<5;k++)if(ed(k,y,-1))L.push(k);for(let k=rx1-1;k>=rx0+11&&R.length<5;k--)if(ed(k,y,1))R.push(k);
    let ok=false;for(const a of L){for(const b of R)if(b-a>=11&&(box(a,b,y)||zbox(a,b,y))){ok=true;break}if(ok)break}}}
  {const vr=vrun(),hr=hrun();zdel.forEach(([x0,y0,x1,y1])=>{for(const y of[y0-1,y0,y0+1,y1-1,y1,y1+1])if(y>=0&&y<h)for(let x=x0;x<=x1;x++){const j=y*w+x;if(on[j]&&vr[j]<=3){on[j]=0;RMV[j]=3;IMG.bp++}}
   for(const x of[x0-1,x0,x0+1,x1-1,x1,x1+1])if(x>=0&&x<w)for(let y=y0;y<=y1;y++){const j=y*w+x;if(on[j]&&hr[j]<=3&&vr[j]<=y1-y0+4){on[j]=0;RMV[j]=3;IMG.bp++}}})}
  del.forEach(([x0,y0,x1,y1])=>{for(let y=Math.max(0,y0-1);y<=Math.min(h-1,y1+1);y++)for(let x=Math.max(0,x0-1);x<=Math.min(w-1,x1+1);x++){RMV[y*w+x]=3;if(on[y*w+x]){on[y*w+x]=0;IMG.bp++}}})}
 // senkrechte Lücken bis 2 px schließen (dünne, unscharfe Dochte auf Fotos zerfallen sonst in Stücke)
 for(let x=0;x<w;x++)for(let y=1;y<h-1;y++){const j=y*w+x;if(!on[j]&&on[j-w]&&(on[j+w]||(y<h-2&&on[j+2*w]))){on[j]=1;if(!on[j+w])on[j+w]=1}}
 // zusammenhängende Formen (8er-Nachbarschaft)
 const cid=new Int32Array(n).fill(-1),C=[],stk=[];
 for(let j=0;j<n;j++){if(!on[j]||cid[j]>=0)continue;const c={n:0,x0:1e9,x1:-1,y0:1e9,y1:-1};cid[j]=C.length;stk.push(j);
  while(stk.length){const q=stk.pop(),qx=q%w,qy=(q-qx)/w;c.n++;if(qx<c.x0)c.x0=qx;if(qx>c.x1)c.x1=qx;if(qy<c.y0)c.y0=qy;if(qy>c.y1)c.y1=qy;
   for(let ey=-1;ey<=1;ey++)for(let ex=-1;ex<=1;ex++){const nx=qx+ex,ny=qy+ey;if(nx<0||ny<0||nx>=w||ny>=h)continue;const r=ny*w+nx;if(on[r]&&cid[r]<0){cid[r]=C.length;stk.push(r)}}}
  C.push(c)}
 // Achsen an ausgerichteter Schrift (25.11.2026): Preisachse = mindestens 5 kleine Formen (Ziffern) rechts im Bild mit gleicher linker bzw. rechter Kante
 // (±2 px) über mindestens 40 % der Höhe; Zeitachse = mindestens 5 kleine Formen unten mit gleicher Unterkante über mindestens 40 % der Breite.
 // Alles dahinter zählt nie zum Kurs, auch wenn der Rahmen sie einschließt.
 {const th=Math.max(16,h*.04),sm=C.map((c,k)=>k).filter(k=>{const c=C[k],ch=c.y1-c.y0+1,cw=c.x1-c.x0+1;return c.n>=4&&ch>=4&&ch<=th&&cw<=Math.max(30,w*.06)});
  const best=(ks,key,span,L)=>{const by=new Map();ks.forEach(k=>{const v=key(C[k]);for(const d of[-2,-1,0,1,2]){const b=v+d;(by.get(b)||by.set(b,[]).get(b)).push(k)}});
   // gleichmäßige Abstände (Achsenbeschriftung): Lagen zusammenfassen (näher als 2 % der Länge), Abstände höchstens ±35 % vom Median
   const reg=u=>{const v=[...u.map(k=>span(C[k]))].sort((p,q)=>p-q),c=[];v.forEach(x=>{if(!c.length||x-c[c.length-1]>L*.02)c.push(x)});if(c.length<4)return false;
    const d=c.slice(1).map((x,i)=>x-c[i]).sort((p,q)=>p-q),md=d[d.length>>1];return d.filter(x=>Math.abs(x-md)<=md*.35).length>=d.length*.75};
   let o=null;by.forEach((a,b)=>{const u=[...new Set(a)],sp=Math.max(...u.map(k=>span(C[k])))-Math.min(...u.map(k=>span(C[k])));if(u.length>=5&&sp>=L*.4&&reg(u)&&(!o||u.length>o.u.length))o={b,u}});return o};
  const even=o=>{if(!o)return null;const hs=o.u.map(k=>C[k].y1-C[k].y0).sort((p,q)=>p-q),m=hs[hs.length>>1];return hs.filter(v=>Math.abs(v-m)<=3).length>=hs.length*.8?o:null};
  const R1=sm.filter(k=>C[k].x0>w*.82),pa=best(R1,c=>c.x0,c=>c.y0,h)||best(R1,c=>c.x1,c=>c.y0,h);
  // dahinter nur Schrift (keine Form höher als th) und das Band höchstens 18 % breit bzw. 15 % hoch: sonst waren es Kerzen bzw. Balken gleicher Lage
  const onlyTxt=f=>C.every(c=>c.n<4||!f(c)||c.y1-c.y0+1<=th||(c.x1-c.x0<=2&&c.y1-c.y0>=h*.5)||(c.y1-c.y0<=2&&c.x1-c.x0>=w*.5)||c.n>=.5*(c.x1-c.x0+1)*(c.y1-c.y0+1)||c.x1-c.x0>w*.06); // lange dünne Rand- bzw. Achsenstriche, gefüllte Preis-Kästchen und breite Zonen (ab 6 % der Breite) zählen nicht (Kerzen sind schmal)
  // linke Kante der Zahlen: von jedem Gruppenmitglied nach links über direkt angrenzende Zeichen derselben Zeile (Lücke bis 8 px, z. B. Vorkommastellen)
  if(pa){let xl=Math.min(...pa.u.map(k=>C[k].x0));pa.u.forEach(k=>{let cur=C[k];for(let it=0;it<12;it++){const nx=sm.map(q=>C[q]).find(c=>c!==cur&&Math.abs(c.y0-cur.y0)<=3&&c.x1<cur.x0&&cur.x0-c.x1<=8);if(!nx)break;cur=nx}xl=Math.min(xl,cur.x0)});xl-=3;if(xl>w*.82&&onlyTxt(c=>c.x1>=xl))AX.r=Math.min(AX.r,xl)}
  // Achsenschrift ist gleich hoch (26.11.2026, Lenny): mind. 80 % der Formen der Gruppe ±3 px um die mittlere Höhe. Sonst hielt die Erkennung
  // Kerzenstücke, die alle an der gepunkteten Preislinie enden, für die Zeitachse und schnitt die Tiefs am Rand ab.
  const B1=sm.filter(k=>C[k].y0>h*.85),ta=even(best(B1,c=>c.y1,c=>c.x0,w));
  if(ta){const yt=Math.min(...ta.u.map(k=>C[k].y0))-3;if(yt>h*.85&&onlyTxt(c=>c.y1>=yt&&c.y1-Math.max(c.y0,yt)>th))AX.b=Math.min(AX.b,yt)} // unten zählt nur der Teil in der Datumszeile (Symbole und Zonen ragen von oben hinein)
  if(pa||ta)for(let j=0;j<n;j++){const x=j%w,y=(j-x)/w;if((x>=AX.r||y>=AX.b)&&cid[j]>=0)on[j]=0}
  C.forEach(c=>{if(c.x0>=AX.r||c.y0>=AX.b)c.n=0})} // Formen hinter den Achsen fallen weg
 IMG.ax={...AX};
 // Gruppen: Formen nebeneinander (gleiche Höhe, kleiner Abstand) wie Buchstaben eines Worts oder Kerzen einer Reihe
 const gp=C.map((_,k)=>k),root=k=>{while(gp[k]!==k)k=gp[k]=gp[gp[k]];return k},ord=C.map((_,k)=>k).sort((a,b)=>C[a].x0-C[b].x0);
 for(let i=0;i<ord.length;i++){const A=C[ord[i]];if(A.n<4)continue;for(let j=i+1;j<ord.length;j++){const B=C[ord[j]];if(B.x0>A.x1+Math.max(6,.8*(A.x1-A.x0+1)))break;
  if(B.n<4||A.y0>B.y1||B.y0>A.y1)continue;const gap=B.x0-A.x1-1;if(gap>=-2&&gap<=Math.max(6,.8*Math.min(A.x1-A.x0+1,B.x1-B.x0+1)))gp[root(ord[j])]=root(ord[i])}}
 const Gs={};C.forEach((c,k)=>{if(c.n<4)return;const r=root(k),g=Gs[r]=Gs[r]||{x0:1e9,x1:-1,y0:1e9,y1:-1,n:0,m:0,hmax:0};g.x0=Math.min(g.x0,c.x0);g.x1=Math.max(g.x1,c.x1);g.y0=Math.min(g.y0,c.y0);g.y1=Math.max(g.y1,c.y1);g.n+=c.n;g.m++;g.hmax=Math.max(g.hmax,c.y1-c.y0+1)});
 let main=null;Object.values(Gs).forEach(g=>{if(!main||g.n>main.n)main=g});
 // Seit 23.11.2026 (Lenny): Kleine Gruppen (bis 110 × 44 px) gelten nur dann als Label, wenn direkt unter bzw. über ihrer Mitte (4 bis 60 px)
 // der Kurs liegt: der Hauptchart oder eine größere Form über 44 px Höhe (nie eine Textzeile wie die Legende). Pauschal „klein = Schrift“ verwarf auf kleinen Bildern ganze Kerzenreihen; übrige Schrift erledigen
 // die Randbänder und die Strangwahl je Spalte.
 const lab=g=>{const mx=Math.round((g.x0+g.x1)/2),r=g.root;for(const dir of[1,-1])for(let st=1;st<=60;st++){const y=dir>0?g.y1+st:g.y0-st;if(y<0||y>=h)break;let hit=false;
   for(let x=Math.max(0,mx-3);x<=Math.min(w-1,mx+3);x++){const j=y*w+x;if(on[j]&&cid[j]>=0&&C[cid[j]].n>=4&&root(cid[j])!==r&&(Gs[root(cid[j])]===main||(Gs[root(cid[j])].n>g.n&&Gs[root(cid[j])].y1-Gs[root(cid[j])].y0>44))){hit=true;break}}if(hit){if(st>=4)return true;break}}return false};
 Object.keys(Gs).forEach(r=>Gs[r].root=+r);
 Object.values(Gs).forEach(g=>{const gw=g.x1-g.x0+1,gh=g.y1-g.y0+1;
  g.keep=g===main||!((gw<=110&&gh<=44&&lab(g))||(gh<=3&&gw>=20)||(g.y1>=h-2&&gw>=.15*w&&gh<=.3*h&&g.y0>main.y0))});
 const kept0=j=>on[j]&&C[cid[j]].n>=4&&Gs[root(cid[j])].keep;
 // Kursfarbe (seit 23.11.2026 aus der Form): Kerzen, Balken und Linien bestehen aus vielen kurzen senkrechten Strichen über die ganze Breite.
 // Farben der Pixel in senkrechten Läufen ab 3 px (mindestens 1,5 × so lang wie der waagerechte Lauf, also keine flache dicke Linie), zu Farbgruppen zusammengefasst (Abstand bis 48); Kursfarbe = Gruppe mit mindestens 3 % dieser
 // Pixel, verteilt über mindestens 10 von 24 Abschnitten der Breite (Labels stehen nur an wenigen Stellen). Ohne solche Striche (Linienchart): häufigste Farben der Hauptgruppe.
 // Decken die Kursfarben mindestens 60 % der Striche ab, zählen für Hoch/Tief nur Stränge mit Kursfarbe (Toleranz 56), sonst zählen sie doppelt.
 const pal=[];let palS=false;{const vr=vrun(),hr=hrun(),cnt=new Map();let tot=0;const add=j=>{const k=Q(j*4),c=j*4;let e=cnt.get(k);if(!e)cnt.set(k,e={n:0,r:0,g:0,b:0,sp:0});e.n++;e.r+=D[c];e.g+=D[c+1];e.b+=D[c+2];e.sp|=1<<Math.min(23,Math.floor(j%w/w*24));tot++};
  const DC=Math.max(T,p98*.55);for(let j=0;j<n;j++)if(vr[j]>=3&&vr[j]>=1.5*hr[j]&&dv[j]>=DC&&kept0(j))add(j); /* nur kräftige Kernpixel: unscharfe Ränder auf Fotos sind Mischfarben */
  if(tot<200&&main){cnt.clear();tot=0;for(let y=main.y0;y<=main.y1;y++)for(let x=main.x0;x<=main.x1;x++){const j=y*w+x;if(kept0(j)&&Gs[root(cid[j])]===main)add(j)}}
  const cl=[];[...cnt.values()].sort((a,b)=>b.n-a.n).forEach(e=>{const r=e.r/e.n,g=e.g/e.n,b=e.b/e.n,k=cl.find(c=>Math.max(Math.abs(c.r-r),Math.abs(c.g-g),Math.abs(c.b-b))<=48);
   if(k){k.n+=e.n;k.sp|=e.sp}else if(cl.length<12)cl.push({r,g,b,n:e.n,sp:e.sp})});
  const bits=v=>{let c=0;while(v){c+=v&1;v>>>=1}return c};let cov=0;cl.forEach(c=>{if(c.n>=tot*.03&&bits(c.sp)>=10){pal.push(c);cov+=c.n}});palS=pal.length>0&&cov>=tot*.6}
 const pcol=j=>{const c=j*4;return pal.some(p=>Math.max(Math.abs(D[c]-p.r),Math.abs(D[c+1]-p.g),Math.abs(D[c+2]-p.b))<=56)};
 // Ränder (23.11.2026): Legende oben (Symbol, OHLC-Werte, Indikatoren), Zeitachse unten, Preisachse rechts. Ein Randband reicht vom Bildrand
 // bis zu einer Lücke von mindestens 3 leeren Zeilen bzw. Spalten, höchstens 18 % der Höhe bzw. Breite, und enthält nur kleine Formen
 // (Schrift, Preis-Kästchen, höchstens 44 px hoch); oben die größte solche Grenze (Legende mit mehreren Zeilen), unten und rechts die nächste
 // am Rand. Formen darin in Kerzenfarbe bleiben, außer sie schließen oben und unten bündig mit Schrift ab; der Rest zählt nicht zum Kurs.
 const kept=j=>on[j]&&C[cid[j]].n>=4&&Gs[root(cid[j])].keep&&!C[cid[j]].band;
 const bands=(lim,emptyAt)=>{const o=[];let gap=0,last=-1;for(let i=0;i<lim;i++){if(emptyAt(i)){gap++;if(gap===3&&last>=0)o.push(last+1)}else{gap=0;last=i}}return o.reverse()}; // mögliche Grenzen, die größte zuerst (Legende mit mehreren Zeilen)
 const RL=2,CL=2;
 const rowE=y=>{let c=0;for(let x=0;x<w;x++)if(kept0(y*w+x)&&++c>RL)return false;return true},colE=x=>{let c=0;for(let y=0;y<h;y++)if(kept0(y*w+x)&&++c>CL)return false;return true}; // bis 2 Rauschpixel gelten als leer (mehr schnitt im Vergleich Kerzen ab, die in die Legende ragen)
 // je Form (nicht je Gruppe: auf Fotos verbindet Rauschen Buchstaben zu Gruppen, die über das Band hinausreichen): Formen ganz im Band; Formen in
 // Kerzenfarbe bleiben, außer sie stehen auf einer Zeile mit anderer Schrift (z. B. blaue Indikatorwerte in der Legende)
 const cut=(test,ax)=>{const ids=[];C.forEach((c,k)=>{if(c.n>=4&&Gs[root(k)].keep&&test(c))ids.push(k)});if(!ids.length||ids.some(k=>C[k].y1-C[k].y0>44&&C[k].x1-C[k].x0>2))return false; /* hohe Formen: abbrechen, außer dünne senkrechte Striche (Stück der Achsenlinie, 23.11.2026) */
  // Achse (23.11.2026): nur Schrift (Formen bis 16 px bzw. 4 % hoch) in mindestens 4 Zeilen bzw. Spalten über 40 % der Höhe bzw. Breite
  // verteilt: Preis- bzw. Zeitachse, auch wenn die Zahlen Kursfarbe haben. Dann fällt alles im Band weg.
  if(ax){const th=Math.max(16,h*.04),tk=k=>ax==='y'?C[k].x1-C[k].x0<=2&&C[k].y1-C[k].y0>=h*.25:C[k].y1-C[k].y0<=2&&C[k].x1-C[k].x0>=w*.25; /* lange dünne Striche (Achsenrand) zählen nicht */
   if(ids.every(k=>tk(k)||C[k].y1-C[k].y0+1<=th)&&ids.some(k=>!tk(k))){const v=ids.filter(k=>!tk(k)).map(k=>ax==='y'?(C[k].y0+C[k].y1)/2:(C[k].x0+C[k].x1)/2).sort((p,q)=>p-q),L=ax==='y'?h:w;let rows=1;
   for(let i=1;i<v.length;i++)if(v[i]-v[i-1]>th)rows++;if(rows>=4&&v[v.length-1]-v[0]>=L*.4){ids.forEach(k=>C[k].band=1);return'ax'}}}
  const ct={},cp={},S=new Set(ids);for(let j=0;j<n;j++)if(on[j]&&S.has(cid[j])){const k=cid[j];ct[k]=(ct[k]||0)+1;if(pcol(j))cp[k]=(cp[k]||0)+1}
  const pgC=k=>pal.length&&(cp[k]||0)>ct[k]*.5,txt=ids.filter(k=>!pgC(k)),th=Math.max(16,h*.04),cy=k=>(C[k].y0+C[k].y1)/2,
   // Textzeile (23.11.2026): mindestens 4 kleine Formen auf einer Höhe (Mitte ±5 px), etwa die Legende ganz in Kursfarbe
   line=k=>txt.some(t=>Math.abs(C[t].y0-C[k].y0)<=3&&Math.abs(C[t].y1-C[k].y1)<=3&&Math.abs(C[t].x0-C[k].x0)<300)||(C[k].y1-C[k].y0<th&&ids.filter(t=>C[t].y1-C[t].y0<th&&Math.abs(cy(t)-cy(k))<=5).length>=4);
  let any=false;ids.forEach(k=>{if(!pgC(k)||line(k)){C[k].band=1;any=true}});return any};
 let LT=0;bands(Math.round(h*.18),y=>rowE(y)).some(t=>{const r=cut(c=>c.y1<t);if(r)C.forEach(c=>{if(c.band&&c.y1<t)LT=Math.max(LT,c.y1+1)});return r}); // LT: Unterkante der Legendenschrift (für die Kerzensuche, 26.11.2026)
 // Textzeilen (23.11.2026): Legende ohne Lücke zum Chart, Beschriftungen von Fibonacci-Stufen und Zeichnungen neben den Kerzen. Mindestens 5
 // kleine Formen hintereinander (Abstand bis 0,8 × Höhe, mindestens 4 px), Mitte und Ober- oder Unterkante auf gleicher Höhe (±3 px): Schrift.
 {const th=Math.max(16,h*.04),S=[];const dens=c=>c.n/((c.x1-c.x0+1)*(c.y1-c.y0+1));
  C.forEach((c,k)=>{if(c.n>=4&&!c.band&&Gs[root(k)].keep&&c.y1-c.y0+1<=th&&(c.y1<h*.25||c.x1-c.x0+1<=1.2*(c.y1-c.y0+1)||dens(c)<=.6||c.y1-c.y0+1>=7))S.push(k)}); /* unten im Bild nur schmale Formen (Ziffern) oder lückenhafte (auf Fotos verschmolzene Wörter), keine vollen flachen Kerzen */S.sort((a,b)=>C[a].x0-C[b].x0);
  const used=new Set();S.forEach(k=>{if(used.has(k))return;const ch=[k];let cur=k;for(;;){const A=C[cur],ah=A.y1-A.y0+1;let nx=null;
     for(const q of S){if(used.has(q)||ch.includes(q))continue;const B=C[q],gap=B.x0-A.x1-1;if(gap<-1||gap>Math.max(4,.8*ah))continue;
      const cy=Math.abs((B.y0+B.y1)-(A.y0+A.y1))/2;if(cy<=3&&(Math.abs(B.y0-A.y0)<=3||Math.abs(B.y1-A.y1)<=3)){nx=q;break}}
     if(nx===null)break;ch.push(nx);cur=nx}
   // 5 Formen, oder (Foto: Buchstaben verschmelzen) eine Kette mindestens 4 × so breit wie hoch aus lückenhaften Formen (Dichte bis 0,6), ab 7 px hoch
   const cw=C[ch[ch.length-1]].x1-C[ch[0]].x0+1,chh=Math.max(...ch.map(q=>C[q].y1-C[q].y0+1));
   // oder (Foto, Buchstaben unscharf und gefüllt) mindestens 3 Formen, alle gleich hoch mit gleicher Ober- und Unterkante (±2 px, ab 7 px), eng (Abstand bis 0,5 × Höhe), zusammen 4 × so breit wie hoch
   const tC=ch.length>=3&&chh>=7&&cw>=4*chh&&ch.every((q,i)=>Math.abs(C[q].y0-C[ch[0]].y0)<=2&&Math.abs(C[q].y1-C[ch[0]].y1)<=2&&(!i||C[q].x0-C[ch[i-1]].x1-1<=Math.max(3,.5*chh)));
   if(ch.length>=5&&ch.every(q=>C[q].y1<h*.25||C[q].x1-C[q].x0+1<=1.2*(C[q].y1-C[q].y0+1))||(chh>=7&&cw>=4*chh&&ch.every(q=>dens(C[q])<=.6))||tC)ch.forEach(q=>{used.add(q);C[q].band=1;C[q].tl=1})})}
 // unten und rechts: die Grenze nächst am Rand (Lücken zwischen Kerzen sind auch leere Spalten); rechts seit 23.11.2026 weiter nach innen, solange es die
 // Achse ist (ein schmaler Streifen am Rand stoppte sonst vor der Preisachse); vor dem ersten Treffer wie bisher die nächste Grenze probieren
 bands(Math.round(h*.18),i=>rowE(h-1-i)).reverse().some(b=>cut(c=>c.y0>h-1-b,'x'));
 {let hit=false,stop=false;bands(Math.round(w*.18),i=>colE(w-1-i)).reverse().forEach(b=>{if(stop)return;const r=cut(c=>c.x0>w-1-b,'y');if(r==='ax'){hit=true;return}if(r){if(hit)stop=true;hit=true}else if(hit)stop=true})}
 // Strangwahl je Spalte (Kontinuität): zusammenhängende senkrechte Stränge (Lücken bis 3 px überbrückt; mehr verband Legende und Kerzen). Gewählt wird der
 // Strang auf dem günstigsten Weg durch alle Spalten (kräftige Stränge, kleine Sprünge; Pixel in
 // Kerzenfarbe zählen doppelt). Weit abseits (über 25 % der Höhe) und nur Schrift o. Ä.: die Spalte bleibt leer statt eines Ausreißers.
 const zoneN=()=>{let c=0;for(let j=0;j<n;j++)if(RMV[j]===2)c++;return c>n*.003};
 // Kerzensuche (25.11.2026): Findet ocKerzen Kerzen, bilden nur ihre Säulen die Stränge; sonst (Linienchart) wie bisher
 const KR=ocKerzen({D,w,h,n,AX,G,T,p98,n9,exG:j=>RMV[j]>1||(cid[j]>=0&&!!C[cid[j]].band&&(!C[cid[j]].tl||C[cid[j]].y1<h*.25)),ex:j=>RMV[j]||(cid[j]>=0&&!!C[cid[j]].band&&(!C[cid[j]].tl||C[cid[j]].y1<h*.25)) /* Textzeilen im Bild prüft die Kerzensuche selbst (die Regel hier hielt ruhige Kerzenreihen für Schrift); im oberen Viertel (Legende) gelten sie */}),KZ=KR&&KR.M&&!(KR.line&&!zoneN())?KR:null; /* Linienchart: nur mit gefüllten Zonen über die Farbmaske, sonst wie bisher (Trend- und Fib-Linien in Linienfarbe) */IMG.kz=KR?KR.info||KR.fail:null;if(IMG.kz)IMG.kz.ok=!!KZ;
 // Labels nach der alten Regel (kleine Gruppe direkt über bzw. unter dem Kurs), die überwiegend nicht Kerzenfarbe haben (blaue Wellen-Labels mit Farbsaum):
 // ihre Pixel fallen aus der Kerzenmaske. Kerzen, die die alte Regel für Labels hielt, bestehen fast ganz aus Kerzenfarbe und bleiben.
 // Legende in Kerzenfarbe (helle OHLC-Charts: schwarze Schrift wie die Balken, 26.11.2026): Säulen ganz über der Unterkante der Legende fallen weg
 if(KZ&&LT>0)for(let x=0;x<w;x++){let y=0;while(y<LT){if(!KZ.M[y*w+x]){y++;continue}let e=y;while(e+1<h&&KZ.M[(e+1)*w+x])e++;if(e<LT)for(let q=y;q<=e;q++)KZ.M[q*w+x]=0;y=e+1}}
 if(KZ){const tc=new Map();for(let j=0;j<n;j++){const k=cid[j];if(k<0||C[k].n<4)continue;const g=Gs[root(k)];if(g.keep)continue;let e=tc.get(g);if(!e)tc.set(g,e=[0,0,0]);e[0]++;if(KZ.M[j])e[1]++;else if(dv[j]>=Math.max(T,p98*.35))e[2]++}
  for(let j=0;j<n;j++){if(!KZ.M[j])continue;const k=cid[j];if(k<0||C[k].n<4)continue;const e=tc.get(Gs[root(k)]);if(e&&e[1]<e[0]*.5&&e[2]>e[1])KZ.M[j]=0}} // nur bei mehr kräftigen andersfarbigen Pixeln als Kerzenpixeln (26.11.2026: dünne graue Balken haben nur blasse Randpixel)
 const GAP=3,RU=[];
 if(KZ)for(let x=0;x<w;x++){const L=[];let cur=null;for(let y=0;y<h;y++){if(!KZ.M[y*w+x])continue;if(cur&&(y-cur.b-1<=GAP||y-cur.b-1<=20&&(()=>{const g=y-cur.b-1;let z=0;for(let q=cur.b+1;q<y;q++){const r=RMV[q*w+x];if(r===2)z++;else if(r!==1&&dv[q*w+x]<T*.5)return false}return g<=10||z>=g*.5})())){ /* Lücke bis 10 px ohne Hintergrund (eine Linie kreuzt den Balken, auf Fotos unscharf) bzw. bis 20 px überwiegend aus Zonenpixeln (Rand einer Zone, 26.11.2026): überbrücken; Abstand zu einem Label ist Hintergrund */cur.b=y;cur.n+=2}else{cur={a:y,b:y,n:2,p:1};L.push(cur)}}RU.push(L)}
 else for(let x=0;x<w;x++){let L=[];let cur=null;for(let y=0;y<h;y++){const j=y*w+x;if(!kept(j))continue;const pc=pcol(j),pw=pc?2:1;
   if(cur&&y-cur.b-1<=GAP){cur.b=y;cur.n+=pw;cur.p+=pc}else{cur={a:y,b:y,n:pw,p:+pc};L.push(cur)}}if(palS)L=L.filter(r=>r.p>0);RU.push(L)} // nur Stränge in Kursfarbe
 const WN=Math.max(10,Math.round(w/60)),med=a=>{const v=a.filter(q=>q!==null).sort((p,q)=>p-q);return v.length?v[v.length>>1]:null};
 // Weg durch alle Spalten (Viterbi, 23.11.2026): je Spalte ein Strang, kräftige Stränge leicht bevorzugt (bis 6 Pixel, Kerzenfarbe doppelt), jeder Sprung zwischen den Strängen benachbarter
 // Spalten kostet das Doppelte seiner Höhe. So bleibt der Verlauf auf einer dünnen, aber durchgehenden Linie statt kurz in Schrift zu springen.
 let pick=RU.map(()=>null);
 // Seit 23.11.2026 (Plausibilität): Eine Spalte darf auch ausgelassen werden (kostet 6, bis 24 Spalten mit Strängen am Stück). So springt der Weg
 // nicht auf eine Zeichnung, nur weil zwischen dünnen Balken in einigen Spalten nur sie liegt; jede gewählte Spalte hängt mit den Nachbarn zusammen.
 // Kerzensuche (25.11.2026): Lücken zwischen Kerzen sind normal (Auslassen kostet nur 2), lange Säulen zählen mehr (bis 30 Pixel): sonst gewann ein
 // Kreis-Label, das in jeder Spalte ein paar Pixel hat, gegen die dünnen Dochte daneben
 {const KM=KZ&&!KZ.line,SP=KM?2:6,RW=KM?30:6,KW=24,JC=g=>g<=3?0:.6*(g-3),NX=[];for(let x=0;x<w;x++)if(RU[x].length)NX.push(x);const cst=[],from=[];
  NX.forEach((x,k)=>{const L=RU[x];cst.push(L.map((r,i)=>{let bv=SP*k,bj=null;for(let q=Math.max(0,k-KW);q<k;q++){const P=RU[NX[q]],pc=cst[q],sk=SP*(k-q-1);
     P.forEach((o,j)=>{const v=pc[j]+sk+JC(Math.max(0,r.a-o.b,o.a-r.b));if(v<bv){bv=v;bj=[q,j]}})}from[k]=from[k]||[];from[k][i]=bj;return bv-Math.min(KM?r.b-r.a+1:r.n,RW)}))}); // Belohnung je Spalte begrenzt: sonst schlägt ein kräftiges Label den dünnen Docht
  let bv=1e18,bk=null;cst.forEach((c,k)=>c.forEach((v,i)=>{const t=v+SP*(NX.length-1-k);if(t<bv){bv=t;bk=[k,i]}}));
  while(bk){const [k,i]=bk;pick[NX[k]]=RU[NX[k]][i];bk=from[k][i]}}
 // Inseln: kurze Stücke ohne Anschluss nach links und rechts (Abstand über 10 % der Höhe, zusammen unter 5 % der Spalten), z. B. Schrift in
 // den leeren Spalten zwischen zwei Kerzen, fallen weg
 {const X=[];pick.forEach((r,x)=>{if(r)X.push(x)});const gapOf=(p,q)=>Math.max(0,p.a-q.b,q.a-p.b),GJ=Math.max(10,h*.1),U=new Map(X.map(x=>[x,x])),fd=x=>{while(U.get(x)!==x){U.set(x,U.get(U.get(x)));x=U.get(x)}return x};
  // verbunden ist, was innerhalb von 40 Spalten nahe genug liegt (so überbrückt die Kette eine Insel zwischen zwei Kerzen)
  X.forEach((x,i)=>{for(let j=i-1;j>=0&&x-X[j]<=40;j--)if(gapOf(pick[x],pick[X[j]])<=GJ){const p=fd(x),q=fd(X[j]);if(p!==q)U.set(p,q)}});
  const sz=new Map();X.forEach(x=>{const r=fd(x);sz.set(r,(sz.get(r)||0)+1)});if(sz.size>1)X.forEach(x=>{if(sz.get(fd(x))<X.length*.05)pick[x]=null})}
 // Ausreißer: liegt der gewählte Strang mehr als 25 % der Höhe neben dem Median der Nachbarspalten, bleibt die Spalte leer
 {const cen=pick.map(r=>r?(r.a+r.b)/2:null);pick=pick.map((r,x)=>{if(!r)return null;const m=med(cen.slice(Math.max(0,x-WN),x+WN+1));const d=m<r.a?r.a-m:m>r.b?m-r.b:0;return d>h*.25?null:r})}
 const hi=new Int16Array(w).fill(-1),lo=new Int16Array(w).fill(-1);
 for(let x=0;x<w;x++){const r=pick[x];if(!r)continue;hi[x]=r.a;lo[x]=r.b;
  if(KZ){for(let z=0;z<6&&hi[x]>AX.t&&KZ.soft((hi[x]-1)*w+x);z++)hi[x]--;for(let z=0;z<6&&lo[x]<AX.b-1&&KZ.soft((lo[x]+1)*w+x);z++)lo[x]++;continue} // blasse Spitze in Kerzenfarbe (nicht in die Füllung einer Box)
  for(let z=0;z<6&&hi[x]>AX.t&&dv[(hi[x]-1)*w+x]>=TW;z++)hi[x]--;for(let z=0;z<6&&lo[x]<AX.b-1&&dv[(lo[x]+1)*w+x]>=TW;z++)lo[x]++} // blasse Spitze
 // Kerzensuche: dünn besetzte Stellen fallen weg (im Fenster ±5 Kerzenabstände unter 30 % der mittleren Dichte des Kurses an Spalten mit Verlauf), z. B. Klammern einer
 // Fib-Beschriftung rechts hinter der letzten Kerze; Kerzen stehen dichter (auch am Rand des Kurses, dort zählt die eine Seite)
 if(KZ&&!KZ.line){const R=Math.max(10,5*KZ.P),cs=new Int32Array(w+1);for(let x=0;x<w;x++)cs[x+1]=cs[x]+(hi[x]>=0);
  const dd=x=>Math.max(cs[Math.min(w,x+R+1)]-cs[x],cs[x+1]-cs[Math.max(0,x-R)])/(R+1);let fa=-1,fb=-1;for(let x=0;x<w;x++)if(hi[x]>=0){if(fa<0)fa=x;fb=x}const D0=fa<0?0:cs[fb+1]/(fb-fa+1)*.3,drop=[];for(let x=0;x<w;x++)if(hi[x]>=0&&dd(x)<D0)drop.push(x);drop.forEach(x=>{hi[x]=-1;lo[x]=-1;pick[x]=null})}
 // Kerzenbreite im Original (24.11.2026, Lenny, für die Kerzen-Darstellung): Spalten je Kerze aus der Zahl der Stücke mit Verlauf (Kerzen und Balken
 // mit Lücke dazwischen); ohne solche Lücken (dichte Kerzen, Linie) etwa 250 Kerzen über die Breite
 {let runs=0,a=-1,b=-1;for(let x=0;x<w;x++)if(hi[x]>=0){if(a<0)a=x;b=x;if(x===0||hi[x-1]<0)runs++}const span=b-a+1,cw=runs>=20?span/runs:0;
  IMG.cw=cw>=2&&cw<=40?cw:Math.max(2,span/250)}
 // Lücken und unsichere Stellen (Kerzensuche, 25.11.2026): Fehlt mindestens eine Kerze (Lücke über 1,6 × Kerzenabstand, z. B. unter einem Label),
 // wird die Lücke zwischen den Nachbarkerzen ergänzt (Hoch und Tief linear, nie aus Box-Pixeln geraten; bis 14 Kerzen bzw. 5 % der Breite) und als
 // unsicher markiert (IMG.ip je Spalte, IMG.uns = Bereiche [von, bis]). Unsicher sind auch Stellen, an denen eine zweite Säule weit abseits liegt
 // (Konkurrenz für die Strangwahl). Größere Lücken bleiben leer, aber markiert.
 IMG.ip=null;IMG.uns=[];let unsA=0;
 if(KZ&&!KZ.line){const st=[];for(let x=0;x<w;x++)if(hi[x]>=0&&(x===0||hi[x-1]<0))st.push(x);const P=KZ.P; // Kerzenabstand aus der Kerzensuche
  const ip=new Uint8Array(w),un=new Uint8Array(w),GMX=Math.max(P*14,w*.05);let pv=-1,fa=-1,fb=-1;
  for(let x=0;x<w;x++){if(hi[x]<0)continue;if(fa<0)fa=x;fb=x;if(pv>=0){const g=x-pv-1;if(g>Math.max(P*1.6,P+2)){for(let q=pv+1;q<x;q++)un[q]=1;
     if(g<=GMX)for(let q=pv+1;q<x;q++){const t=(q-pv)/(x-pv);hi[q]=Math.round(hi[pv]+(hi[x]-hi[pv])*t);lo[q]=Math.round(lo[pv]+(lo[x]-lo[pv])*t);ip[q]=1}}}pv=x}
  const DJ=Math.max(8,h*.06),ct=new Uint8Array(w);for(let x=0;x<w;x++){const r=pick[x];if(r&&RU[x].some(o=>o!==r&&o.b-o.a+1>=Math.max(5,(r.b-r.a+1)*.5)&&Math.max(o.a-r.b,r.a-o.b)>DJ))ct[x]=1}
  for(let x=0;x<w;x++)if(ct[x]){let c=0;for(let q=Math.max(0,x-2*P);q<=Math.min(w-1,x+2*P);q++)c+=ct[q];if(c>=3)for(let q=Math.max(fa,x-P);q<=Math.min(fb,x+P);q++)un[q]=1}
  let a=-1;for(let x=0;x<=w;x++){if(x<w&&un[x]){if(a<0)a=x;continue}if(a>=0){const L=IMG.uns[IMG.uns.length-1];if(L&&a-L[1]<=2*P)L[1]=x-1;else IMG.uns.push([a,x-1]);a=-1}}
  IMG.uns.forEach(([p,q])=>unsA+=q-p+1);unsA/=Math.max(1,fb-fa+1);IMG.ip=ip}
 // Kerzenliste (26.11.2026, Lenny): jede erkannte Kerze genau einmal, für die Darstellung 1:1 zum Original und das Einrasten. Kerze = zusammen-
 // hängende Spalten mit Verlauf (ohne ergänzte), dicht an dicht stehende werden im Kerzenabstand geteilt. Hoch/Tief = Extrem der Spalten, Docht =
 // Spalte mit dem längsten Strich. Körper = Zeilen, in denen mindestens 2 Spalten Kerzenfarbe haben; OHLC-Balken: Eröffnung = Strich links,
 // Schluss = Strich rechts. Richtung: grünere Farbe steigend, rötere fallend; unbunt (weiß/grau bzw. schwarz/grau): die kräftigere steigend.
 IMG.cdl=null;
 if(KZ&&!KZ.line){const Mk=KZ.M,P=KZ.P,ipx=IMG.ip||new Uint8Array(w),E=KZ.info.cols.map(c=>[c[0]-G[0],c[1]-G[1],c[2]-G[2]]),mag=e=>Math.hypot(e[0],e[1],e[2]);
  const chrom=E.map(e=>Math.max(...e)-Math.min(...e)>.15*Math.max(...e.map(Math.abs))),upC=E.map((e,i)=>E.length>1&&(chrom[0]||chrom[1])?(e[1]-e[0])>=(E[1-i][1]-E[1-i][0]):true);
  // Kerzenabstand für dicht an dicht stehende Kerzen (26.11.2026, Lenny, PayPal-Bild): An jeder Kerzengrenze springen Hoch und Tief; diese Sprünge
  // wiederholen sich im festen Abstand. Abstand = kleinste Verschiebung (2–40 Spalten) mit mind. 85 % der stärksten Selbstähnlichkeit der Sprünge,
  // Lage der Grenzen = Rest mit den meisten Sprüngen. Ohne deutliche Regelmäßigkeit gilt der Abstand der Formen (KZ.P). Vorher wurden die Formen
  // gemessen: dicht stehende Kerzen hängen zu großen Formen zusammen, der Abstand war 39 statt 3 Spalten und wenige breite Sammelkerzen entstanden.
  const dj=new Float64Array(w);for(let x=1;x<w;x++)if(hi[x]>=0&&hi[x-1]>=0&&!ipx[x]&&!ipx[x-1])dj[x]=Math.abs(hi[x]-hi[x-1])+Math.abs(lo[x]-lo[x-1]);
  let s0=0;for(let x=0;x<w;x++)s0+=dj[x]*dj[x];const ac=[];for(let l=2;l<=40;l++){let v=0;for(let x=0;x+l<w;x++)v+=dj[x]*dj[x+l];ac[l]=s0?v/s0:0}
  const am=Math.max(...ac.slice(2)),mn=ac.slice(2).reduce((p,q)=>p+q,0)/39;let PL=0;for(let l=2;l<=40;l++)if(ac[l]>=am*.85&&ac[l]>(ac[l-1]||0)&&ac[l]>=(ac[l+1]||0)){PL=l;break}
  if(!(PL&&am>mn*1.5)||(P<=12&&PL>1.5*P))PL=0; // ein Vielfaches des plausiblen Formabstands gilt nicht
  // Dichter Chart (PayPal-Bild): Kerzen höchstens 1 Spalte breit, oft mehrere je Spalte; Hoch bzw. Tief ändern sich von fast jeder Spalte zur nächsten,
  // ohne Regelmäßigkeit. Dann schmale Kerzen fester Breite (DG = 2 Spalten) mit Docht (Extrem der Spalten, Hochs und Tiefs bleiben erhalten) und Körper
  // (Eröffnung = Mitte der ersten, Schluss = Mitte der letzten Spalte); nie breite Sammelkerzen über mehrere Wellen.
  if(!PL){let np=0,nc=0;for(let x=1;x<w;x++)if(hi[x]>=0&&hi[x-1]>=0&&!ipx[x]&&!ipx[x-1]){np++;if(dj[x]>0)nc++}const rl=[];let r0=-1;for(let x=0;x<=w;x++){const on=x<w&&hi[x]>=0&&!ipx[x];if(on&&r0<0)r0=x;if(!on&&r0>=0){rl.push(x-r0);r0=-1}}rl.sort((p,q)=>p-q);if(np>=50&&nc>=np*.75&&(rl[rl.length>>1]||0)>=6)PL=1}/* nur lückenlose Strecken (Median der Stücke ab 6 Spalten) */KZ.info.PL=PL;let ph=0;if(PL){let bv=-1;for(let f=0;f<PL;f++){let v=0;for(let x=f;x<w;x+=PL)v+=dj[x];if(v>bv){bv=v;ph=f}}}
  const L=[];let a=-1;for(let x=0;x<=w;x++){const on=x<w&&hi[x]>=0&&!ipx[x];if(on&&a<0)a=x;if(!on&&a>=0){const len=x-a;
    if(PL===1){for(let q=a;q<x;q+=2)L.push([q,Math.min(x-1,q+1),1])}
    else if(PL&&len>1.6*PL){let s=a;for(let q=a+1;q<x;q++)if(((q-ph)%PL+PL)%PL===0){if(q-s>=1)L.push([s,q-1]);s=q}L.push([s,x-1])}
    else{const k=len>1.6*P?Math.max(1,Math.round(len/P)):1;for(let i=0;i<k;i++)L.push([a+Math.round(i*len/k),a+Math.round((i+1)*len/k)-1])}a=-1}}
  const mags=[];const cd=L.map(([a,b,dn])=>{let H=1e9,Lo=-1,xc=a,best=-1;for(let x=a;x<=b;x++){H=Math.min(H,hi[x]);Lo=Math.max(Lo,lo[x]);if(lo[x]-hi[x]>best){best=lo[x]-hi[x];xc=x}}
   let bt=-1,bb=-1,lt=[],rt=[],cc=[0,0,0],mg=0,mn=0;for(let y=H;y<=Lo;y++){let k=0;for(let x=a;x<=b;x++){const j=y*w+x,m=Mk[j];if(!m)continue;k++;cc[m]++;const q=j*4;mg+=Math.hypot(D[q]-G[0],D[q+1]-G[1],D[q+2]-G[2]);mn++;if(x<xc)lt.push(y);else if(x>xc)rt.push(y)}
    if(b>a&&k>=2){if(bt<0)bt=y;bb=y}}
   const ci=cc[2]>cc[1]?1:0,mm=mn?mg/mn:0;mags.push(mm);let o=null,c=null,up=null;
   const avg=v=>v.reduce((p,q)=>p+q,0)/v.length,tick=lt.length&&rt.length&&lt.length<=4*(b-a+1)&&rt.length<=4*(b-a+1)&&(bt<0||bb-bt<=2);
   if(tick){o=avg(lt);c=avg(rt);up=c<=o}else if(bt>=0){up=E.length>1&&(chrom[0]||chrom[1])?upC[ci]:null;o=up===false?bt:bb;c=up===false?bb:bt}
   else up=E.length>1&&(chrom[0]||chrom[1])?upC[ci]:null;
   if(dn){o=(hi[a]+lo[a])/2;c=(hi[b]+lo[b])/2;up=c<=o} // dichter Chart: Körper aus erster und letzter Spalte
   return{a,b,xc,hi:H,lo:Lo,o,c,up,m:mm,...(dn?{d:1}:{})}});
  // unbunte Kerzen ohne Striche links/rechts: kräftiger als der Median = steigend
  const sm=mags.slice().sort((p,q)=>p-q),mdn=sm[sm.length>>1]||0;cd.forEach(k=>{if(k.up===null){k.up=k.m>=mdn;if(k.o!==null&&k.c!==null&&k.o!==k.c){const t=Math.min(k.o,k.c),u=Math.max(k.o,k.c);k.o=k.up?u:t;k.c=k.up?t:u}}delete k.m});
  IMG.cdl=cd}
 // Qualität (25.11.2026): Anteil der 6 Spalten breiten Abschnitte mit Verlauf zwischen erstem und letztem Kurs-Stück, dazu die Zahl entfernter
 // Zeichnungen als Anteil der Bildfläche (entfernte Pixel von Linien, Kästchen und Zonen). Unsicher, wenn unter 80 % abgedeckt oder Zeichnungen ab Q_DRAW.
 {let a=-1,b=-1;for(let x=0;x<w;x++)if(hi[x]>=0){if(a<0)a=x;b=x}let wn=0,wc=0;for(let x=a;a>=0&&x+5<=b;x+=6){wn++;for(let k=x;k<x+6;k++)if(hi[k]>=0){wc++;break}}
  const cov=wn?wc/wn:0,dr=(IMG.lp+IMG.bp+(IMG.nz||0))/n;IMG.q={cov:+cov.toFixed(3),draw:+dr.toFixed(4),sure:+(1-unsA).toFixed(3),low:cov<.8||dr>=Q_DRAW||unsA>.12}}
 IMG.path={hi,lo,man:new Uint8Array(w)};IMG.auto={hi:hi.slice(),lo:lo.slice()};return IMG.path}
