/* js/generator/prognose-kurs.js – Kursdaten für „Wie geht es weiter?“: Zählweisen (PGK, PGKOF), erlaubte Unterteilungen je Welle (PGSUB, Regelwerk),
   Zeiteinheiten (PGTF), verschachtelter Kursverlauf aus Stundenkerzen (pgData, pgNode, pgFr), Linien (PGLINE).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Modus 6: „Wie geht es weiter?“ (Prognose-Training). Umbau vom 10.11.2026 (Lenny), Grundlage: Regelwerk Version 15.
// Zufälliges Muster, zufälliger Schnittpunkt, kein Mustername. Für jede fehlende Welle wählt man die Zählweise ihrer Unterteilung
// (1-2-3-4-5, A-B-C, A-B-C-D-E, W-X-Y, W-X-Y-X-Z) und setzt die Wendepunkte in die graue Zukunftszone; der letzte ist das Ende der Hauptwelle.
// Richtig ist jede Fortsetzung, die zu irgendeinem Muster mit derselben Beschriftung regelkonform ist (z. B. nach A-B: Zigzag oder eine Flat).
// Geprüft wird nur nach dem Regelwerk: erlaubte Unterteilung je Welle, Richtung der Subwellen, harte Regeln der Haupt- und der Teilmuster.
const PGK={N:{t:'1-2-3-4-5',l:['(1)','(2)','(3)','(4)','(5)']},ABC:{t:'A-B-C',l:['(a)','(b)','(c)']},TRI:{t:'A-B-C-D-E',l:['(a)','(b)','(c)','(d)','(e)']},
 WXY:{t:'W-X-Y',l:['(w)','(x)','(y)']},TZ:{t:'W-X-Y-X-Z',l:['(w)','(x)','(y)','(x)','(z)']}};
const PGKOF={imp:'N',dl:'N',db:'N',de:'N',zig:'ABC',fr:'ABC',fe:'ABC',fru:'ABC',trk:'TRI',tre:'TRI',dz:'WXY',tz:'TZ'}; // Zählweise je Muster
// Welche Teilmuster darf eine Welle ausbilden? Je Muster eine oder mehrere Varianten (Leading Diagonale: 5-3-5-3-5 oder 3-3-3-3-3), je Welle eine Liste.
// Quelle: Impuls W1-1 bis W5-2 (Welle 2 kein Dreieck, Welle 4 auch Dreieck, 1 und 5 auch Diagonale), Zigzag WA-1/WB-1/WC-1, Flats WA-2/WB-2/WC-2,
// Dreieck DRE-4/DRE-5, Diagonalen DL-2/5/7/9, DB-5/7/9/10, DE-4/5/6, komplexe Korrekturen WW-1/WX-1/WY-1/WZ-1, Dreifache Form KOM-2.
// Seit Regelwerk Version 16 (Lenny, 11.11.2026) ausdrücklich erlaubt: W-X-Y-X-Z in Welle B einer Flat und in Welle 2/4 einer Diagonale, W-X-Y in einer Dreieckswelle.
const PGSUB=(()=>{const F=['zig','fr','fe','fru'],T=['trk','tre'],K=[...F,'dz'],K2=[...K,'tz'],KT=[...K,...T],M5=['imp','db','de'],Z=['zig'],I=['imp'];
 const flat=[[K,[...KT,'tz'],M5]],tri=[[K,K,K,K,K]],diag=[[Z,K2,Z,[...K2,...T],Z]];
 return{imp:[[['imp','dl','de'],K2,I,[...K2,...T],M5]],zig:[[I,KT,M5]],fr:flat,fe:flat,fru:flat,trk:tri,tre:tri,
  dl:[[I,K2,I,K2,I],[Z,K2,Z,K2,Z]],db:diag,de:diag,dz:[[K,KT,KT]],tz:[[K,KT,KT,KT,KT]]}})();
// ---- Kursdaten für „Wie geht es weiter?“ (Umbau 11.11.2026, Lenny): ein langer Verlauf aus Stundenkerzen (1h), verschachtelt in Wellenebenen.
// Ebene 1 ist das große Muster, jede seiner Wellen ist selbst ein regelkonformes Muster (Ebene 2), und Impulse der Ebene 2 sind noch einmal
// unterteilt (Ebene 3). Erlaubt ist je Welle nur, was PGSUB nach dem Regelwerk zulässt. 4h, D und W fassen die Stundenkerzen zusammen.
const PGTF=[['W',168],['D',24],['4h',4],['1h',1]]; // Zeiteinheiten: Name und Stunden je Kerze
const PGLEN={imp:[20,10,28,12,30],zig:[28,16,32],fr:[22,22,34],fe:[22,22,34],fru:[22,22,34],trk:[16,16,16,16,16],tre:[16,16,16,16,16],
 dl:[22,12,22,12,24],db:[16,16,16,16,16],de:[16,16,16,16,16],dz:[30,26,30],tz:[18,16,18,16,18]}; // Dauer der Wellen im Verhältnis zueinander
const PGZL={N:'imp',ABC:'zig',TRI:'trk',WXY:'dz',TZ:'tz'}; // Zählweise → Muster mit dieser Beschriftung
const pgLab=(key,j)=>{const l=PAT[key].labels[j];return /^X\d$/.test(l)?'X':l}; // X1/X2 heißen im Chart beide X
const pgTxt=(lev,l)=>lev===1?l:lev===2?'('+l.toLowerCase()+')':l.toLowerCase(); // Ebene 1 im Kreis, Ebene 2 in Klammern, Ebene 3 klein
const PGW={imp:10,dl:1.2,db:1,de:.6,zig:6,fr:3,fe:3,fru:1,trk:2,tre:1,dz:2.5,tz:1}; // wie oft ein Teilmuster gewählt wird
const pgPick=a=>{let r=Math.random()*a.reduce((x,k)=>x+(PGW[k]||1),0);for(const k of a){r-=PGW[k]||1;if(r<=0)return k}return a[a.length-1]};
// Ohne Truncation (W5-4): sonst wäre Punkt 3 extremer als das Ende, und das Ende der Welle kein echtes Hoch bzw. Tief.
const pgFr=key=>{for(let n=0;n<12;n++){const v=key==='imp'?genImp(null):PAT[key].gen(null);if(v&&key==='imp'&&!(v[5]>v[3]))continue;if(v&&v.length&&Math.abs(v[v.length-1])>1e-6){const e=v[v.length-1];return v.map(x=>x/e)}}return null};
const isFl=k=>/^f/.test(k);
// Wellengebiet laut Regelwerk: Welle w darf mit keinem Teilpunkt über Pivot b hinauslaufen (must: muss darüber hinaus).
// IMP-1/DIAG-6 Welle 2 nicht über den Start von 1, IMP-3 Welle 4 nicht ins Gebiet von 1, DIAG-2 Welle 4 muss hinein,
// ZZ-2/FR-2 Welle B nicht über den Start von A, WX-2 Welle X nicht über den Start von W bzw. Y.
const PGTER={imp:[[2,0,'IMP-1'],[4,1,'IMP-3']],dl:[[2,0,'IMP-1'],[4,1,'DIAG-2',1]],db:[[2,0,'IMP-1'],[4,1,'DIAG-2',1]],de:[[2,0,'IMP-1'],[4,1,'DIAG-2',1]],
 zig:[[2,0,'ZZ-2']],fr:[[2,0,'FR-2']],dz:[[2,0,'WX-2']],tz:[[2,0,'WX-2'],[4,2,'WX-2b']]};
// e = äußerster Teilpunkt der Welle in ihrer eigenen Richtung d; liegt er auf der richtigen Seite von Grenze g?
const pgTerOk=(d,e,g,must)=>must?d*(e-g)>0:d*(e-g)<0;
// Zufälliger Pfad von a nach b in n Stundenkerzen (der erste Wert ist a, b gehört zur nächsten Strecke). Alle Werte bleiben zwischen a und b.
function pgWalk(a,b,n,S){const lo=Math.min(a,b),hi=Math.max(a,b),amp=(hi-lo)*.22,w=[0],sd=Math.sqrt(n)/7||1;
 for(let i=1;i<=n;i++)w.push(w[i-1]+Math.random()-.5);
 for(let i=0;i<n;i++){const s=i/n,x=a+(b-a)*s+(i?(w[i]-w[n]*s)/sd*amp:0);S.c.push(Math.min(hi,Math.max(lo,x)));S.lo.push(lo);S.hi.push(hi)}}
// Unbeschriftete Strecke (Vorgeschichte) mit Teilung fr und bis zu lev Ebenen darunter
function pgLeg(a,b,n,fr,lev,S){const k=fr.length-1,w=fr.slice(1).map((_,j)=>rnd(.8,1.3)*(j%2?.7:1)),tot=w.reduce((x,y)=>x+y),idx=[0];let t=0;
 w.forEach(x=>{t+=x;idx.push(Math.round(t/tot*n))});
 for(let j=1;j<=k;j++)if(idx[j]<=idx[j-1])idx[j]=idx[j-1]+1;
 for(let j=0;j<k;j++){const pa=a+(b-a)*fr[j],pb=a+(b-a)*fr[j+1],nj=idx[j+1]-idx[j];
  if(lev>0&&nj>=24)pgLeg(pa,pb,nj,j%2?abcF():impF(),lev-1,S);else pgWalk(pa,pb,nj,S)}}
// Ein Muster als Baum: fr = Hauptpunkte als Anteile (Start 0, Ende 1), kids = Teilmuster je Welle (Ebene 1 immer, Ebene 2 nur Impulse).
// Ebene 3 nutzt nur einfache Muster. Alternation (W4-3) beim Impuls: Welle 4 ein anderes Muster als Welle 2, nie zwei Flats.
function pgNode(key,lev){
 for(let n=0;n<30;n++){const fr=pgFr(key);if(!fr)continue;
  if(lev===3&&!fr.every((f,i)=>i===fr.length-1||(f>=0&&f<1)))continue; // Ebene 3: kein Teilpunkt über Start oder Ende hinaus (sonst wäre der Punkt der Ebene 2 kein echtes Extrem)
  const node={key,fr,kids:null};if(!(lev===1||(lev===2&&key==='imp')))return node;
  const V=PGSUB[key][Math.floor(Math.random()*PGSUB[key].length)],kids=[];let ok=true;
  for(let k=1;k<fr.length;k++){let o=V[k-1];
   if(lev===2)o=o.filter(d=>['imp','zig','fr','dz'].includes(d)); // Ebene 3: nur Muster ohne Überschießen, damit jeder Punkt der Ebene 2 ein echtes Hoch bzw. Tief bleibt
   if(key==='imp'&&k===4&&kids[1])o=o.filter(d=>d!==kids[1].key&&!(isFl(d)&&isFl(kids[1].key)));
   const kid=o.length?pgNode(pgPick(o),lev+1):null;if(!kid){ok=false;break}kids.push(kid)}
  if(!ok)continue;node.kids=kids;
  const pts=w=>{const a=fr[w-1],b=fr[w];return kids[w-1].fr.slice(1).map(f=>a+(b-a)*f)}; // Teilpunkte der Welle w
  if((PGTER[key]||[]).every(([w,b,,must])=>{const p=pts(w),d=Math.sign(fr[w]-fr[w-1]);return pgTerOk(d,d>0?Math.max(...p):Math.min(...p),fr[b],must)}))return node}
 return null}
// Baum in Stundenkerzen umsetzen. out sammelt die Wendepunkte: lev (Ebene), t (Kerze), p (Preis), l (Beschriftung), w1 (Welle der Ebene 1)
function pgBuild(node,a,b,n,lev,w1,S,out){const gid=S.gid=(S.gid||0)+1,t0=S.c.length,fr=node.fr,k=fr.length-1,w=(PGLEN[node.key]||fr.slice(1).map(()=>1)).map(x=>x*rnd(.85,1.15)),tot=w.reduce((x,y)=>x+y),idx=[0];let acc=0;
 w.forEach(x=>{acc+=x;idx.push(Math.round(acc/tot*n))});for(let j=1;j<=k;j++)if(idx[j]<idx[j-1]+2)idx[j]=idx[j-1]+2;
 for(let j=0;j<k;j++){const pa=a+(b-a)*fr[j],pb=a+(b-a)*fr[j+1],nj=idx[j+1]-idx[j],kid=node.kids&&node.kids[j],ww=lev===1?j+1:w1;
  if(kid)pgBuild(kid,pa,pb,nj,lev+1,ww,S,out);else pgWalk(pa,pb,nj,S);
  out.push({lev,t:S.c.length,p:pb,l:pgLab(node.key,j+1),key:node.key,j:j+1,w1:ww,g:gid,t0})}} // g/t0: Zählung (Gruppe) und ihr Start
// Daten einer Runde: o/h/l/c Stundenkerzen, mp = Kerzen der Hauptpunkte (Ebene 1), piv = alle Wendepunkte, tree = Musterbaum, T0 = erste Kerze (Montag 0 Uhr)
function pgData(P){let tree=null;for(let n=0;n<20&&!tree;n++)tree=pgNode(P.key,1);
 if(!tree)tree={key:P.key,fr:pgFr(P.key)||[0,1],kids:null};
 const dir=Math.random()<.5?1:-1,M=rnd(250,450),p0=1000,HT=Math.round(rnd(60,110)*24),S={c:[],lo:[],hi:[]},out=[];
 // Vorgeschichte aus vier Strecken, zusammen länger als das Muster; sie läuft gegen Welle 1 auf Punkt 0 zu
 const w1=p0+dir*M*tree.fr[1],d1=Math.sign(w1-p0)||1,A=Math.abs(w1-p0),a1=p0+d1*A*rnd(.9,1.5),a0=a1-d1*A*rnd(.4,.8),b1=a0+d1*A*rnd(.6,1.2),b0=b1-d1*A*rnd(.5,1);
 [[b0,b1,.3,impF],[b1,a0,.3,abcF],[a0,a1,.3,abcF],[a1,p0,.45,impF]].forEach(([a,b,f,F])=>pgLeg(a,b,Math.round(HT*f),F(),2,S));
 out.push({lev:1,t:S.c.length,p:p0,l:'0',key:P.key,j:0,w1:0});
 pgBuild(tree,p0,p0+dir*M,HT,1,0,S,out);
 const e=p0+dir*M;S.c.push(e);S.lo.push(e);S.hi.push(e);
 const mn=Math.min(...S.lo);if(mn<50){const d=50-mn;['c','lo','hi'].forEach(k=>S[k]=S[k].map(x=>x+d));out.forEach(q=>q.p+=d)} // Preise bleiben über 0
 // Kerzen: Eröffnung = Schluss der Kerze davor, Dochte klein und nie über den Wendepunkt der Strecke hinaus
 const c=S.c,o=c.map((x,i)=>i?c[i-1]:x),h=[],l=[];
 c.forEach((x,i)=>{const up=Math.max(o[i],x),dn=Math.min(o[i],x),wk=(up-dn)*.6+(S.hi[i]-S.lo[i])*.012;
  h.push(Math.max(up,Math.min(S.hi[i],up+Math.random()*wk)));l.push(Math.min(dn,Math.max(S.lo[i],dn-Math.random()*wk)))});
 const L1=out.filter(q=>q.lev===1).sort((a,b)=>a.t-b.t);
 return{o,h,l,c,pr:c,N:c.length-1,mp:L1.map(q=>q.t),piv:out,tree,T0:Date.UTC(2024,0,1)+Math.floor(rnd(0,130))*6048e5}}
// Invalidierungslinien (nur harte Regeln, Regelwerk Version 16): w = Welle, für die die Grenze gilt; j = Pivot, an dem die Linie beginnt
// (sein Preis ist die Grenze), oder f(v) = Grenze im normierten Maß, dann beginnt die Linie am Start von Welle w.
// Texte in der Grundrichtung (Impulse und Diagonalen aufwärts, Korrekturen abwärts); mt() spiegelt sie bei umgekehrtem Chart.
const PGD6={w:2,j:0,t:'Welle 2 darf nicht unter den Start von Welle 1'},PGD5=[{w:3,j:1,t:'Welle 3 muss über dem Hoch von Welle 1 enden'},{w:4,j:1,t:'Welle 4 muss unter das Hoch von Welle 1 laufen (Überlappung)'},{w:5,j:3,t:'Welle 5 muss über dem Hoch von Welle 3 enden'}];
const PGLINE={
 imp:[{w:2,j:0,t:'Welle 2 darf nicht unter den Start von Welle 1'},{w:4,j:1,t:'Welle 4 darf nicht unter das Hoch von Welle 1'},
  {w:5,f:v=>L(v,3)<L(v,1)?v[4]+L(v,3):null,t:'Welle 5 darf nicht über diese Linie (sonst wäre Welle 3 die kürzeste)'}],
 dl:[PGD6,...PGD5,{w:3,f:v=>v[2]+L(v,1),t:'Welle 3 darf nicht über diese Linie (Welle 1 ist die längste)'},{w:5,f:v=>v[4]+L(v,3),t:'Welle 5 darf nicht über diese Linie (kürzer als Welle 3)'}],
 db:[PGD6,...PGD5,{w:3,f:v=>v[2]+L(v,1),t:'Welle 3 darf nicht über diese Linie (kürzer als Welle 1)'},{w:5,f:v=>v[4]+L(v,3),t:'Welle 5 darf nicht über diese Linie (kürzer als Welle 3)'}],
 de:[PGD6,...PGD5,{w:3,f:v=>v[2]+L(v,1),t:'Welle 3 muss über diese Linie laufen (länger als Welle 1)'},{w:5,f:v=>v[4]+L(v,3),t:'Welle 5 muss über diese Linie laufen (länger als Welle 3)'},
  {w:4,j:2,t:'Welle 4 darf nicht unter den Start von Welle 3'}],
 zig:[{w:2,j:0,t:'Welle B darf nicht über den Start von Welle A'},{w:3,j:1,t:'Welle C muss unter dem Tief von Welle A enden'}],
 fr:[{w:2,j:0,t:'Welle B darf nicht über den Start von Welle A'},{w:3,j:1,t:'Welle C muss unter dem Tief von Welle A enden'}],
 fe:[{w:2,j:0,t:'Welle B muss über den Start von Welle A laufen'},{w:3,j:1,t:'Welle C muss unter dem Tief von Welle A enden'}],
 fru:[{w:2,j:0,t:'Welle B muss über den Start von Welle A laufen'},{w:3,j:1,t:'Welle C darf nicht unter das Tief von Welle A laufen'}],
 trk:[2,3,4,5].map(k=>({w:k,j:k-2,t:'Welle '+'ABCDE'[k-1]+' muss kürzer als Welle '+'ABCDE'[k-2]+' bleiben'})),
 tre:[2,3,4,5].map(k=>({w:k,j:k-2,t:'Welle '+'ABCDE'[k-1]+' muss länger als Welle '+'ABCDE'[k-2]+' werden'})),
 dz:[{w:2,j:0,t:'Welle X darf nicht über den Start von Welle W'}],
 tz:[{w:2,j:0,t:'Welle X darf nicht über den Start von Welle W'},{w:4,j:2,t:'Die zweite Welle X darf nicht über den Start von Welle Y'}]};
// Höchster Punkt-Index, den eine Regel prüft (für Teilzählungen: nur Regeln, deren Punkte schon gezählt sind). 99 = nicht erkennbar.
// Kann eine Regel, die auch noch nicht gezählte Punkte braucht, mit irgendeiner Fortsetzung noch erfüllt werden? Probiert für jeden
// fehlenden Punkt einige Wellenlängen (sehr kurz bis sehr lang, Richtung abwechselnd). Nein = die Regel ist schon jetzt verletzt.
const pgCanHold=(rule,v,last,mx)=>{if(mx>=99||last<1)return true;const ref=Math.max(...v.slice(1).map((x,i)=>Math.abs(x-v[i])))||1,F=[.03,.4,.9,1.4,2.5,5];
 const rec=(u,i)=>{if(i>mx)return rule.ok(u);const d=-Math.sign(u[i-1]-u[i-2])||1;for(const f of F){u[i]=u[i-1]+d*f*ref;if(rec(u,i+1))return true}return false};
 return rec(v.slice(0,last+1),last+1)};
const pgRuleMax=r=>{if(r._mx!==undefined)return r._mx;const s=String(r.ok),re=/\b[uv]\[(\d)\]|L\([uv],(\d)\)/g;let mx=-1,mm;while((mm=re.exec(s)))mx=Math.max(mx,+(mm[1]||mm[2]));return r._mx=mx<0?99:mx};
