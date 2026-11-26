/* js/modi/prognose.js – Modus „Wie geht es weiter?“ (progn, Leicht und Schwer) und die Zähl-Ansicht von „Eigenen Chart prüfen“ (progn({img})).
   Eine einzige große Funktion, weil alle Teile denselben Zustand teilen. Reihenfolge innen: Ansicht und Zoom (zoomAt, zoomX,
   clampSc), Bild (imFit, imClamp, ocG, ocCandles), Einrasten (imgSnap, snapPt, wantOf), Unterteilung prüfen (ocZig, ocFit,
   ocSub), Zeichnen (pic, render), Gesten (bindChart), Prüfung (frCheck, frSeries, imgVerify), Export (ocPng),
   Zählen (frAdd, frStartSub, frTap, frDel), Oberfläche (frRender, toolBar, tipUI, verify).
   Dazu Gestenzustand (PGS = Testzugriff, PGTAPT, GEST).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
let PGS=null; // Stand der laufenden Runde (liest der automatische Dauertest)
let PGTAPT=-1e9; // Zeitpunkt des letzten Touch-Tipps im Prognose-Chart. Der Browser schickt danach noch einen Click an das Element, das dann
// unter dem Finger liegt; nach dem Neuaufbau der Seite kann das ein Knopf sein. Solche Clicks (bis 400 ms danach, außerhalb des Charts) werden verschluckt.
addEventListener('click',e=>{if(performance.now()-PGTAPT<400&&e.isTrusted&&!(e.target.closest&&e.target.closest('#svg'))){e.stopPropagation();e.preventDefault()}},true);
let GEST=null; // Aufräumfunktion der laufenden Wisch-/Tipp-Geste im Prognose-Chart
// arg: leer = alle Muster; sonst ein Muster oder mehrere mit Komma (von „Prognose üben“ aus einem Kapitel). lvl: 'leicht' oder 'schwer'.
// Chart (DESIGN.md Abschnitt 11): groß, länger als der Bildschirm und seitlich verschiebbar, Kerzen in vier Zeiteinheiten, drei Wellenebenen.
// Wischen auf freier Fläche verschiebt, Tippen setzt einen Punkt, ein gesetzter Punkt wird nur verschoben, wenn man direkt auf ihm ansetzt.
// Leicht: der sichtbare Verlauf ist beschriftet, man setzt nur fort. Schwer: erst den sichtbaren Verlauf selbst zählen (Ebene 1 und 2), dann fortsetzen.
function progn(arg,lvl){
 if(lvl!=='leicht'&&lvl!=='schwer'){ // zuerst die Schwierigkeit wählen
  $('#view').innerHTML='<div class="card"><p class="kick">Wie geht es weiter?</p><h2>Wie schwer?</h2>'+
   '<p><button class="p" data-pl="leicht">Leicht</button> <span class="mut">Der sichtbare Verlauf ist in allen Wellengrößen beschriftet. Du setzt nur fort.</span></p>'+
   '<p><button class="p" data-pl="schwer">Schwer</button> <span class="mut">Keine Beschriftung: Du zählst frei, so grob oder fein du willst, und setzt mindestens die nächste Welle in die Zukunftszone. Die Wellengröße ergibt sich aus der Verschachtelung, in beliebiger Reihenfolge: Liegt eine Zählung in einer Welle einer anderen, ist sie eine Größe kleiner.</span></p></div>';
  document.querySelectorAll('[data-pl]').forEach(b=>{b.onclick=()=>progn(arg,b.dataset.pl);lockTap(b)});window.scrollTo(0,0);return}
 // „Eigenen Chart prüfen“ (20.11.2026, Lenny): arg = {img} → statt erzeugter Kerzen das zugeschnittene Bild. Zeit = Bildspalte (t = 0 … w-1),
 // Preis = Pixelhöhe von unten (p = h - Zeile - 0,5, immer linear). Keine Zukunftszone, keine Zeiteinheiten, keine Punkte oder Ränge.
 const IMG=arg&&typeof arg==='object'&&arg.img?arg.img:null;if(IMG&&!IMG.path)ocPath(IMG);
 const pool=IMG?['imp']:arg?String(arg).split(','):Object.keys(PAT),key=pool[Math.floor(Math.random()*pool.length)],P=PAT[key],R=IMG?{o:[],h:[],l:[],c:[],pr:[0,IMG.h],N:IMG.w-1,mp:[0,IMG.w-1],piv:[],tree:{kids:null},T0:0}:pgData(P);
 const cuts=P.waves.length===5?[2,3,4]:[2],cut0=cuts[Math.floor(Math.random()*cuts.length)],c0=IMG?IMG.w-1:R.mp[cut0],N=R.N;
 // Zählung des sichtbaren Teils: lab = Beschriftung der Ebene 1, t/p = Hauptpunkte, vk = Unterteilung je Welle, wp[w] = Punkte der Welle w
 // (Start, Teilpunkte, Ende), sub = Beschriftung der Ebenen 2 und 3. Leicht: die erzeugte Zählung. Schwer: die des Spielers, nach dem Prüfen.
 const truthCount=()=>{const L1=R.mp.slice(0,cut0+1),wp={};for(let w=1;w<=cut0;w++)wp[w]=[R.pr[L1[w-1]]].concat(R.piv.filter(q=>q.lev===2&&q.w1===w).sort((a,b)=>a.t-b.t).map(q=>q.p));
  return{lab:P.labels,key0:P.key,t:L1,p:L1.map(i=>R.pr[i]),vk:R.tree.kids?R.tree.kids.slice(0,cut0).map(x=>PGKOF[x.key]):[],cut:cut0,wp,
   sub:R.piv.filter(q=>q.lev>1&&q.t<=c0).map(q=>({lev:q.lev,t:q.t,p:q.p,l:pgTxt(q.lev,q.l),g:q.g,t0:q.t0}))}};
 let CNT=lvl==='leicht'?truthCount():null; // Schwer: keine Vorgabe, frei zählen (FR)
 // FR.pts: Punkte mit Zählung c; FR.ac = Zählung, die gerade fortgesetzt wird (null: das nächste Tippen beginnt eine neue), FR.cn = Zähler der Zählungen
 // FR.cm[c] = {lev, par, pk}: feste Wellengröße je Zählung (seit 12.11.2026), par/pk = gewählte übergeordnete Zählung und Welle (sonst aus der Lage)
 // FR.pw = {c,k}: ausgewählte übergeordnete Welle, die die nächste Zählweise unterteilt
 // FR.md: Werkzeug 'draw' (Zeichnen: jeder Tipp setzt einen Punkt) oder 'sel' (Auswählen: Punkte wählen, verschieben, löschen)
 const FR=lvl==='schwer'?{pts:[],n:0,cn:0,ac:null,z:'N',i:0,sel:null,pw:null,cm:{},md:'draw',err:{},errs:[],tips:0,done:false}:null;
 const fseed=Math.random()*1e4,hrn=i=>{const x=Math.sin((i+fseed)*12.9898)*43758.5453;return 2*(x-Math.floor(x))-1}; // fester Zufall je Stunde (Prognose-Kerzen)
 const m={ch:{},pts:[],tips:0,failed:false,done:false,chErr:false,shown:false,lines:[],cz:null,cs:null,cw:[],cfail:0,cntShown:false};
 const fam=()=>Object.keys(PAT).filter(k=>PAT[k].labels.join()===CNT.lab.join()).map(k=>PAT[k]); // Muster mit derselben Beschriftung
 const waves=()=>{const o=[];for(let k=CNT.cut+1;k<CNT.lab.length;k++)o.push(k);return o}; // fehlende Hauptwellen (1 = erste Welle)
 // Ansicht: W×H in Bildschirmpixeln, BW Pixel je Kerze, tf Stunden je Kerze, sc = wie weit der Chart nach links geschoben ist.
 // Die Zukunftszone endet bei Stunde ZE: Platz für gut das Anderthalbfache des echten Rests, mindestens die halbe Musterlänge.
 const mob=innerWidth<=600,TP=IMG?54:26,BP=IMG?26:30; /* Bild: unten ein Streifen zum Strecken/Stauchen (24.11.2026) */let BW=5,ZE=IMG?c0:c0+Math.round(Math.max(1.6*(N-c0),.5*(N-R.mp[0])));
 const pat=R.pr.slice(R.mp[0],c0+1),patLo=Math.min(...pat),patHi=Math.max(...pat),patRg=patHi-patLo; // sichtbarer Teil des Musters
 let W=0,H=0,sc=null,tf=24,yr=[0,1],fbLast,peek=null,FRVIS={}; // FRVIS: Sichtbarkeit je Zählung beim letzten Zeichnen (Test)
 const size=()=>{W=Math.max(280,$('#pgc').clientWidth);if(!H&&IMG){const ph=W*IMG.h/IMG.w; /* Bild füllt die Fläche (25.11.2026) */H=TP+BP+Math.round(Math.max(220,Math.min(ph,mob?innerHeight*.6:Math.min(700,innerHeight*.68))))} // Bild: Höhe nach Seitenverhältnis
  if(!H)H=mob?Math.max(340,Math.round(innerHeight*.52)):Math.max(380,Math.min(620,Math.round(innerHeight*.58)))};
 const EP=24; // Innenabstand links und rechts (px): Start-Ansicht beginnt nicht direkt am Rand
 const half=()=>(mob?.5:.45)*W,clampSc=x=>IMG?Math.max(0,Math.min(IMG.w*BW-W,x)) /* Bild: Kanten nie in der Fläche */:Math.max(-Math.max(EP,W/2-BW/2),Math.min(Math.max(0,(ZE+.5)*BW/tf-W/2),x)) /* seit 13.11.2026: jede Kerze lässt sich bis in die Mitte wischen */,homeSc=()=>clampSc((c0+.5)*BW/tf-half()); // Grundstellung: Ende des Verlaufs etwa in der Mitte
 // Ansicht je Zeiteinheit (seit 12.11.2026, Lenny): VW[tf] = {BW, sc, yr}. Die Preisachse ist fest (ganzes Muster + Luft für die Prognose)
 // und ändert sich nur durch Zoom oder wenn ein Punkt an den Rand gesetzt bzw. gezogen wird (grow). Wischen ändert den Maßstab nie.
 const VW={},tA=Math.max(0,R.mp[0]-Math.round(.04*(c0-R.mp[0]))); // tA: linker Rand der Start-Ansicht, kurz vor dem Muster
 // Bild (25.11.2026, Lenny): Die Startansicht füllt die Chartfläche ganz aus (Breite W, Höhe von TP bis H-BP; nur bei sehr hohen bzw. flachen Bildern
 // leicht gestreckt). Kleiner geht es nicht, verschieben nur, wo durch Zoom bzw. Strecken mehr Bild da ist; die Bildkanten rutschen nie in die Fläche.
 const imFit=()=>W/IMG.w; // Bildschirmpixel je Bildspalte in der Startansicht
 const imClamp=()=>{BW=Math.max(BW,imFit());sc=clampSc(sc);const sp=Math.min(yr[1]-yr[0],IMG.h),a=Math.max(0,Math.min(IMG.h-sp,yr[0]));yr=[a,a+sp]};
 const ocG=()=>IMG.G0||(IMG.G0=Math.max(1,Math.round(Math.max((IMG.cw||3)*imFit(),2)/imFit()))); // Bildspalten je gezeichneter Kerze für Rückfall und Nachgezeichnetes: fest aus der Startansicht
 // (seit 26.11.2026 nicht mehr je Zoom: die Anzahl der Kerzen ändert sich beim Strecken nie)
 // Seit 26.11.2026 (Lenny): erkannte Kerzen 1:1 (IMG.cdl: gleiche Stelle, Hoch, Tief, Körper, Richtung); Zoom ändert nur Breite und Abstand. Spalten-
 // gruppen mit fester Breite (ocG) nur im Rückfall (keine Kerzen gefunden) und für nachgezeichnete Stellen.
 const ocCandles=()=>{const PA=IMG.path,G=ocG(),Yr=r=>Y(IMG.h-r-.5),g0=Math.max(0,Math.floor(Tof(0)/G)-1),g1=Math.min(Math.floor((IMG.w-1)/G),Math.ceil(Tof(W)/G)+1);
  let wk='',up='',dn='',pc=null;const bw=Math.max(1,G*BW*.7),f1=v=>v.toFixed(1),CD=IMG.cdl,manIn=(a,b)=>{for(let x=a;x<=b;x++)if(PA.man[x])return true;return false};
  if(CD){const t0=Tof(0)-2,t1=Tof(W)+2;CD.forEach(k=>{if(k.b<t0||k.a>t1||manIn(k.a,k.b))return;const cx=X(k.xc);wk+='M'+f1(cx)+' '+f1(Yr(k.hi)-.5)+'V'+f1(Yr(k.lo)+.5);
    if(k.o===null||k.c===null)return;const kw=Math.max(1,(k.b-k.a+1)*BW),x0=X(k.a-.5),yt=Yr(Math.min(k.o,k.c)),yb=Yr(Math.max(k.o,k.c)),hh=Math.max(1,yb-yt),
     r='M'+f1(k.b>k.a?x0:cx-kw/2)+' '+f1(yt-(yb-yt<1?.5:0))+'h'+f1(kw)+'v'+f1(hh)+'h'+f1(-kw)+'z';if(k.up)up+=r;else dn+=r})}
  // Eröffnung der ersten sichtbaren Kerze: Schluss der letzten Spalte mit Verlauf davor
  for(let x=g0*G-1;x>=0;x--)if(PA.hi[x]>=0){pc=(PA.hi[x]+PA.lo[x])/2;break}
  for(let g=g0;g<=g1;g++){let h=1e9,l=-1,cl=null;for(let x=g*G;x<Math.min(IMG.w,g*G+G);x++)if(PA.hi[x]>=0&&(!CD||PA.man[x])){h=Math.min(h,PA.hi[x]);l=Math.max(l,PA.lo[x]);cl=(PA.hi[x]+PA.lo[x])/2}
   if(cl===null)continue;const op=pc===null?cl:Math.max(h,Math.min(l,pc)),cx=X((g*G+Math.min(IMG.w,g*G+G)-1)/2);pc=cl;
   wk+='M'+f1(cx)+' '+f1(Yr(h)-.5)+'V'+f1(Yr(l)+.5);
   const yt=Yr(Math.min(op,cl)),yb=Yr(Math.max(op,cl)),hh=Math.max(1,yb-yt),r='M'+f1(cx-bw/2)+' '+f1(yt-(yb-yt<1?.5:0))+'h'+f1(bw)+'v'+f1(hh)+'h'+f1(-bw)+'z';
   if(cl<=op)up+=r;else dn+=r} // Zeile kleiner = höher: steigend
  return'<g clip-path="url(#pgclip)" class="occ"><path class="occw" d="'+wk+'"/><path class="occu" d="'+up+'"/><path class="occd" d="'+dn+'"/></g>'};
 // Unsichere Stellen der Kerzensuche (25.11.2026, Lenny): orange hinterlegt, damit man dort gezielt nachzeichnet; Nachgezeichnetes gilt als geklärt
 const ocUns=()=>{let r='',m='';const yT=Y(IMG.h),yB=Y(0);ocUnsR(IMG).forEach(([a,b])=>{let x0=X(a-.5),x1=X(b+.5);if(x1-x0<6){const c=(x0+x1)/2;x0=c-3;x1=c+3}if(x1<0||x0>W)return;
   r+='<rect x="'+x0.toFixed(1)+'" y="'+yT.toFixed(1)+'" width="'+(x1-x0).toFixed(1)+'" height="'+(yB-yT).toFixed(1)+'"/>';m+='<rect class="ocunm" x="'+x0.toFixed(1)+'" y="'+(yB-6).toFixed(1)+'" width="'+(x1-x0).toFixed(1)+'" height="6"/>'});
  return r?'<g clip-path="url(#pgclip)" class="ocun">'+r+m+'</g>':''}; // ganze Bildhöhe blass, unten ein kräftiger Streifen; mindestens 6 px breit
 const bwFit=h=>IMG?imFit():(W-2*EP)/((ZE-tA)/h+2),bwMin=()=>IMG?imFit():Math.max(.5,W/(ZE/tf+2)),bwMax=()=>IMG?Math.max(8,imFit()*12):Math.max(60,bwFit(tf)*1.01);
 let baseY=null; // gemeinsame Grundachse: sichtbares Muster + Luft für die Prognose
 const yBase=()=>{if(!baseY){let lo=patLo-(FR?.8:.5)*patRg,hi=patHi+(FR?.8:.5)*patRg;room().forEach(p=>{lo=Math.min(lo,p);hi=Math.max(hi,p)});const pad=(hi-lo)*.04;baseY=[lo-pad,hi+pad]}return baseY.slice()};
 const startView=h=>{if(IMG){BW=imFit();sc=0;yr=[0,IMG.h];baseY=yr.slice();return} // Bild füllt die Fläche
  const bw=Math.min(40,bwFit(h));if(bw>=1){BW=bw;sc=clampSc((tA+.5)*BW/h-EP)}else{BW=2;sc=homeSc()}yr=yBase()};
 const saveV=()=>{VW[tf]={BW,sc,yr:yr.slice()}};
 const loadV=h=>{tf=h;const v=VW[h];if(v){BW=v.BW;sc=clampSc(v.sc);yr=v.yr.slice()}else startView(h)};
 // Achse so erweitern, dass Preis p mit etwas Rand im Bild liegt (alle Zeiteinheiten); verkleinert nie
 const grow=p=>{if(IMG)return;const f=v=>{const s=v[1]-v[0],m=.08*s;if(p>v[1]-m)v[1]=p+m;if(p<v[0]+m)v[0]=p-m};f(yr);Object.values(VW).forEach(v=>f(v.yr));if(baseY)f(baseY)};
 // Zoomen um Bildpunkt (px, py): Zeit und Preis unter dem Finger bzw. der Maus bleiben stehen
 const zoomAt=(f,px,py)=>{const nb=Math.max(bwMin(),Math.min(bwMax(),BW*f)),g=nb/BW;if(Math.abs(g-1)<1e-4)return;const t=Tof(px),p=Pof(py),sp=Math.min(6*(yBase()[1]-yBase()[0]),(yr[1]-yr[0])/g),r=(py-TP)/(H-TP-BP);
  BW=nb;sc=clampSc((t+.5)*BW/tf-px);yr=[p+r*sp-sp,p+r*sp]};
 // Nur die Zeitachse strecken/stauchen (seit 13.11.2026, Lenny): Kerzenbreite ändern, die Zeit unter px bleibt stehen, Preisachse unverändert
 // Seit 24.11.2026 auch im Bild (Lenny): Bild, Kerzen, Punkte und Labels hängen alle an X/Y und strecken sich gemeinsam
 const zoomX=(f,px)=>{const nb=Math.max(bwMin(),Math.min(bwMax(),BW*f));if(Math.abs(nb/BW-1)<1e-4)return;const t=Tof(px);BW=nb;sc=clampSc((t+.5)*BW/tf-px)};
 const resetX=()=>{if(IMG){startView(1);return}const bw=Math.min(40,bwFit(tf)),t=Tof(W/2);BW=Math.max(bwMin(),bw>=1?bw:2);sc=clampSc((t+.5)*BW/tf-W/2)}; // Doppeltipp auf die Zeitachse: Breite der Start-Ansicht
 const zoomedY=()=>yr[1]-yr[0]<.97*(yBase()[1]-yBase()[0]); // hineingezoomt: dann darf man auch senkrecht verschieben
 const panY=dy=>{const d=dy*(yr[1]-yr[0])/(H-TP-BP);yr=[yr[0]+d,yr[1]+d]};
 const X=t=>(t+.5)*BW/tf-sc,Tof=x=>(x+sc)*tf/BW-.5,Y=p=>TP+(yr[1]-p)/(yr[1]-yr[0])*(H-TP-BP),Pof=y=>yr[1]-(y-TP)/(H-TP-BP)*(yr[1]-yr[0]);
 // Kerzen der Zeiteinheit: aus den Stundenkerzen zusammengefasst (all = mit dem wahren Rest, sonst nur bis zum Abbruch)
 const AG={},agg=all=>{const id=tf+(all?'a':'v');if(AG[id])return AG[id];const n=all?N:c0,o=[],h=[],l=[],c=[];
  for(let i=0;i<=n;i++){const g=Math.floor(i/tf);if(o[g]===undefined){o[g]=R.o[i];h[g]=R.h[i];l[g]=R.l[i]}else{if(R.h[i]>h[g])h[g]=R.h[i];if(R.l[i]<l[g])l[g]=R.l[i]}c[g]=R.c[i]}
  return AG[id]={o,h,l,c}};
 // Prognose-Kerzen (seit 11.11.2026, Lenny): Stundenwerte von der letzten echten Kerze durch die eigenen Prognose-Punkte (zeitlich sortiert),
 // mit leichtem Rauschen (Brownsche Brücke, fester Zufall je Stunde, damit nichts flackert). Zwischen zwei Punkten bleibt der Kurs in deren
 // Preisspanne, so ist jeder Punkt das Hoch bzw. Tief seiner Kerze. Zusammengefasst wie agg, gezeichnet als gestrichelte Umrisse.
 const fcNodes=()=>FR?FR.pts.filter(q=>q.t>c0+.5).map(q=>({t:q.t,p:q.p})).sort((a,b)=>a.t-b.t):m.pts.map(q=>({t:q.x,p:q.p}));
 let FC={};
 const fcAgg=nodes=>{const id=tf+':'+nodes.map(q=>q.t.toFixed(2)+','+q.p).join(';');if(FC.id===id)return FC.a;
  const v=[],sl=[],sh=[];let pt={t:c0,p:R.c[c0]};
  nodes.forEach(q=>{const t1=Math.round(q.t);if(t1<=pt.t)return; // zweiter Punkt in derselben Stunde: übergehen
   const n=t1-pt.t,d=q.p-pt.p,lo=Math.min(pt.p,q.p),hi=Math.max(pt.p,q.p),w=[0];let s=0;
   for(let j=1;j<=n;j++){s+=hrn(pt.t+j);w.push(s)}
   const br=w.map((x,j)=>x-j/n*s),mx=Math.max(...br.map(Math.abs))||1,amp=.16*Math.abs(d);
   for(let j=1;j<=n;j++){const i=pt.t+j;v[i]=Math.max(lo,Math.min(hi,pt.p+d*j/n+br[j]/mx*amp));sl[i]=lo;sh[i]=hi}
   pt={t:t1,p:q.p}});
  const o=[],h=[],l=[],c=[];
  for(let i=c0+1;i<v.length;i++){const op=i>c0+1?v[i-1]:R.c[c0],cl=v[i],wk=Math.abs(hrn(i*7.3))*.04*(sh[i]-sl[i]);
   const hh=Math.min(sh[i],Math.max(op,cl)+wk),ll=Math.max(sl[i],Math.min(op,cl)-wk),g=Math.floor(i/tf);
   if(o[g]===undefined){o[g]=op;h[g]=hh;l[g]=ll}else{if(hh>h[g])h[g]=hh;if(ll<l[g])l[g]=ll}c[g]=cl}
  FC={id,a:{o,h,l,c}};return FC.a};
 // Preisachse fest (siehe VW); fitY erweitert nur, z. B. für eine Stelle, die PGS.show ins Bild holt
 const fitY=()=>{if(peek!==null){grow(peek);peek=null}};
 const truthPlan=()=>{const o=[];for(let k=cut0+1;k<P.labels.length;k++){const kid=R.tree.kids&&R.tree.kids[k-1];
  o.push({k,kind:kid?PGKOF[kid.key]:'ABC',pts:R.piv.filter(q=>q.lev===2&&q.w1===k).sort((a,b)=>a.t-b.t).map(q=>({t:q.t,p:q.p}))})}return o};
 PGS={vis:()=>({...FRVIS}),P,R,cut:cut0,m,lvl,img:IMG,ocG:()=>IMG?ocG():0,setOCF:v=>{OCF=v},X:t=>X(t),Y:p=>Y(p),plot:()=>({W,H:H-BP}),tf:()=>tf,setTf:h=>{const b=document.querySelector('[data-tf="'+h+'"]');if(b)b.click()},truth:truthPlan,FR:()=>FR,mode:()=>FR&&FR.md,fadd:(z,i,t,p,c)=>{const r=frAdd(z,i,t,p,c);frRender();return r},levels:()=>{const o={};frSeries().forEach(S=>o[S.c]=S.lev);return o},fc:()=>fcAgg(fcNodes()),lbx:()=>LBX.slice(),snapAt:(px,py,o)=>snapPt(px,py,o),ring:()=>SNAPR,
  view:()=>({BW,sc,yr:yr.slice(),tf,W,H}),Tof:x=>Tof(x),Pof:y=>Pof(y),zoom:(f,px,py)=>{zoomAt(f,px,py);saveV();redraw($('#svg'),pic())},
  show:(t,p)=>{sc=clampSc((t+.5)*BW/tf-W/2);peek=p===undefined?null:p;fitY();redraw($('#svg'),pic())}}; // show: Stelle (und Preis) ins Bild holen
 if(!IMG)tutCtx(lvl==='schwer'?'progn-schwer':'progn',()=>progn(arg,lvl));
 const segs=()=>{let o=0;return waves().filter(k=>m.ch[k]).map(k=>{const kind=m.ch[k],n=PGK[kind].l.length,g={k,kind,n,pts:m.pts.slice(o,o+n)};o+=n;return g})};
 const cur=()=>{for(const g of segs())if(g.pts.length<g.n)return{k:g.k,kind:g.kind,n:g.n,have:g.pts.length};const k=waves().find(k=>!m.ch[k]);return k?{k,needChar:true}:null};
 const mainP=()=>CNT.p.concat(segs().filter(g=>g.pts.length===g.n).map(g=>g.pts[g.n-1].p)); // Hauptpunkte: gezählt + fertig geplante Wellen
 const room=()=>{if(!CNT||m.done)return[];const c=cur();if(!c)return[];const mp=mainP(),k=c.k,Lj=j=>Math.abs(mp[j]-mp[j-1]),d=-Math.sign(mp[k-1]-mp[k-2])||1,b=fam()[0].key;
  const f=/^(imp|dl|db|de)$/.test(b)?[0,0,Lj(1),3.5*Lj(1),Lj(3),2.618*Math.abs(mp[3]-mp[0])][k]:/^(zig|fr|fe|fru)$/.test(b)?[0,0,1.618*Lj(1),2.618*Lj(1)][k]:
   /^tr/.test(b)?1.618*Lj(k-1):[0,0,Lj(1),2.618*Lj(1),Lj(3),1.618*Lj(1)][k];
  const F=f||Lj(k-1),s0=mp[k-1];
  // Ziel in Wellenrichtung, dazu etwas Platz gegen die Richtung (Teilwellen dürfen über den Start hinauslaufen, z. B. B eines Expanded Flat),
  // der Start selbst und alle schon geplanten Punkte, damit der Maßstab beim Weiterplanen nicht springt
  return[s0,s0+d*1.45*F,s0-d*.8*F] /* 45 % Reserve über die Zielzone hinaus, für überschießende Teilwellen */.concat(m.pts.map(q=>q.p),m.pts.slice(-1).map(q=>q.p+d*.3*F))};
 // Einrasten (Neubau 16.11.2026, Lenny): Ein Punkt springt beim Setzen und Ziehen auf das nächstgelegene Wendehoch bzw. Wendetief der
 // Kerzen der aktuellen Zeiteinheit (lokales Hoch/Tief: höchste bzw. tiefste Kerze in einem Fenster von ±K Kerzen, mindestens ±1 und
 // mindestens ca. 18 px am Handy bzw. 8 px am PC), nicht mehr auf irgendeine Kerze in der Nähe.
 // Reihenfolge: 1) bestehende Punkte (gemeinsame Pivots) im Fangbereich, 2) Zukunftszone: frei, 3) Wendepunkte im Fangbereich
 // (Handy 40 px, PC 15 px; want = 'h' nur Hochs, 'l' nur Tiefs, 'H'/'L' nur bevorzugt, sonst das nächste von beiden), 4) sonst Hoch bzw. Tief der Kerze unter dem
 // Finger. alt (PC, Alt gedrückt): frei platzieren. tmin: nur rechts davon. self: der Punkt, der gezogen wird (rastet nicht auf sich
 // selbst oder seine eigene Zählung ein). Ergebnis {t, p, kind: 'pt' | 'piv' | 'cdl' | 'free'}; t ist die Stunde des Extrems in der Kerze.
 const hourOf=(g,hi,tn)=>{let b=-1;const a=g*tf,e=Math.min(c0,a+tf-1);for(let i=a;i<=e;i++){if(b<0){b=i;continue}const v=hi?R.h[i]:-R.l[i],w=hi?R.h[b]:-R.l[b],ci=R.c[i]===(hi?R.h[i]:R.l[i]),cb=R.c[b]===(hi?R.h[b]:R.l[b]);if(v>w||(v===w&&(ci!==cb?ci:Math.abs(i-tn)<Math.abs(b-tn))))b=i}return b}; // gleich hoch: zuerst die Kerze, die am Extrem schließt (die Wendekerze), dann die nächste am Finger
 // Einrasten im Bild (Eigenen Chart prüfen; seit 23.11.2026 auf dem erkannten Kursverlauf IMG.path, Lenny), ohne KI: Profil je Bildspalte
 // (höchstes bzw. tiefstes Pixel von Kerzen oder Linie, siehe ocPath, nachgezeichnete Stellen eingeschlossen). Ein Docht-Hoch ist eine
 // Spalte, die in ±K Spalten (am Handy ca. 18 px, am PC 8 px) am höchsten reicht; gleich hohe Nachbarspalten zählen als eine (Mitte).
 // Wie beim Einrasten auf Kerzen: im Fangbereich (Handy/iPad 40 px, PC 15 px) das nächste Wendehoch bzw. -tief am Finger, markante
 // (über eine breite Strecke das Extrem) mit Bonus bis 27 px, Richtung aus wantOf. Kein Treffer: der Punkt bleibt, wo getippt.
 const imgSnap=(px,py,o)=>{const PA=IMG.path,w=IMG.w,h=IMG.h,rad=o.touch?40:15,R=Math.max(2,Math.round(rad/BW)),cx=Math.round(Tof(px)),
   free={t:Math.max(0,Math.min(c0,Tof(px))),p:Pof(Math.max(4,Math.min(H-BP-2,py))),kind:'free'};
  if(o.tmin!==undefined&&!(free.t>o.tmin))free.t=o.tmin+.02;if(o.tmax!==undefined&&!(free.t<o.tmax))free.t=o.tmax-.02;
  let x0=cx-R,x1=cx+R;if(o.tmin!==undefined)x0=Math.max(x0,Math.floor(o.tmin)+1);if(o.tmax!==undefined)x1=Math.min(x1,Math.ceil(o.tmax)-1);
  x0=Math.max(0,x0);x1=Math.min(w-1,x1);if(x0>x1)return free;
  const K=Math.max(1,Math.ceil((o.touch?18:8)/BW)),M2=Math.ceil(60/BW);
  const find=hi=>{const A=hi?PA.hi:PA.lo,val=x=>x<0||x>=w||A[x]<0?-1e9:hi?-A[x]:A[x],out=[];
   for(let x=x0;x<=x1;x++){if(A[x]<0)continue;const v=val(x);if(x>x0&&val(x-1)===v)continue; // nur der Anfang einer flachen Spitze
    let e=x;while(e+1<w&&val(e+1)===v)e++;let ok=true;for(let j=x-K;j<=e+K&&ok;j++)if(val(j)>v)ok=false;if(!ok)continue;
    let wl=0,wr=0;while(wl<M2&&x-wl-1>=0&&val(x-wl-1)<=v)wl++;while(wr<M2&&e+wr+1<w&&val(e+wr+1)<=v)wr++;
    const t=Math.round((x+e)/2);if((o.tmin!==undefined&&!(t>o.tmin))||(o.tmax!==undefined&&!(t<o.tmax)))continue;
    const p=h-A[x]-.5,d=Math.hypot(X(t)-px,Y(p)-py);if(d>rad*1.5)continue;
    out.push({t,p,kind:'img',hl:hi?'h':'l',s:d-.3*Math.min(90,((x-wl-1<0?M2:wl)+(e+wr+1>=w?M2:wr))*BW)-(o.want===(hi?'H':'L')?14:0)})}
   return out};
  const want=o.want,all=(want==='l'?[]:find(true)).concat(want==='h'?[]:find(false));
  IMG.cand=all; // Testzugriff: Kandidaten des letzten Einrastens
  if(!all.length)return free;all.sort((a,b)=>a.s-b.s);const r=all[0];
  // erkannte Kerze (26.11.2026): Punkt auf ihren Docht (Zeit) und ihr Hoch bzw. Tief; nachgezeichnete Stellen bleiben spaltengenau
  const k=IMG.cdl&&!PA.man[r.t]&&IMG.cdl.find(q=>q.a<=r.t&&r.t<=q.b);if(k&&!((o.tmin!==undefined&&!(k.xc>o.tmin))||(o.tmax!==undefined&&!(k.xc<o.tmax))))return{...r,t:k.xc,p:h-(r.hl==='h'?k.hi:k.lo)-.5};return r};
 // Nachzeichnen (23.11.2026): Strich glätten (gleitendes Mittel über 3 Messpunkte) und Spalte für Spalte in den Verlauf schreiben.
 // Mehrere Werte in einer Spalte (Hin und Her): oben und unten wie bei einer Kerze. Markiert als nachgezeichnet (man).
 const ocApply=S=>{if(S.length<2)return;const PA=IMG.path,w=IMG.w,h=IMG.h,sm=S.map((q,i)=>{const a=S[Math.max(0,i-1)],b=S[Math.min(S.length-1,i+1)];return{t:(a.t+q.t+b.t)/3,p:(a.p+q.p+b.p)/3}});
  sm[0]=S[0];sm[sm.length-1]=S[S.length-1];const hi={},lo={};
  for(let i=1;i<sm.length;i++){const a=sm[i-1],b=sm[i],xa=Math.round(Math.min(a.t,b.t)),xb=Math.round(Math.max(a.t,b.t));
   for(let x=Math.max(0,xa);x<=Math.min(w-1,xb);x++){const f=b.t===a.t?1:(x-a.t)/(b.t-a.t),p=a.p+(b.p-a.p)*Math.max(0,Math.min(1,f)),r=Math.max(0,Math.min(h-1,Math.round(h-p-.5)));
    hi[x]=hi[x]===undefined?r:Math.min(hi[x],r);lo[x]=lo[x]===undefined?r:Math.max(lo[x],r)}}
  Object.keys(hi).forEach(x=>{PA.hi[x]=hi[x];PA.lo[x]=lo[x];PA.man[x]=1})};
 let TRS=null; // Strich, der gerade nachgezeichnet wird
 // ---- Unterteilung prüfen (23.11.2026, Lenny): Für jede gezählte Welle ohne eigene Unterteilung sucht ein ZigZag-Filter die Wendepunkte im
 // erkannten Verlauf (feine Schwelle: 4 % der Wellenlänge). Daraus wird eine Auswahl gesucht, die eine Unterteilung ergibt, die die Welle laut
 // Regelwerk haben darf (PGSUB) und die die harten Regeln dieses Teilmusters erfüllt: Hoch und Tief wechseln sich ab, jede Teilwelle ist
 // mindestens 8 % der Welle lang, jeder gewählte Wendepunkt ist das Extrem seiner beiden Teilwellen (bis auf 3 % der Welle, ocFit). Gibt es keine, folgt ein
 // Warnsignal (keine harte Regel) mit den Wendepunkten des ZigZag-Filters (Schwellen 5 % bis 35 %) gestrichelt im Chart. Zeigt die Welle
 // weniger Schwünge, als ihre Unterteilung braucht (z. B. zu wenige Kerzen), wird sie nicht beurteilt.
 let OCF=1.5; // Größenordnung (ocFit): 1,5 = höchstens 5 % Fehlalarme im Strukturtest (Stand 23.11.2026)
 const OCZZ=[.05,.075,.1,.125,.15,.2,.25,.3,.35];
 const ocZig=(ta,tb,pa,pb,thr)=>{const PA=IMG.path,h=IMG.h,z=[{t:ta,p:pa}];let dir=Math.sign(pb-pa)||1,ex={t:ta,p:pa};
  const push=q=>{if(q.t===ta&&z.length===1)return;z.push(q)};
  for(let x=ta+1;x<tb;x++){if(PA.hi[x]<0)continue;const Hp=h-PA.hi[x]-.5,Lp=h-PA.lo[x]-.5;
   if(dir>0){if(Hp>ex.p)ex={t:x,p:Hp};else if(ex.p-Lp>=thr){push(ex);dir=-1;ex={t:x,p:Lp}}}
   else{if(Lp<ex.p)ex={t:x,p:Lp};else if(Hp-ex.p>=thr){push(ex);dir=1;ex={t:x,p:Hp}}}}
  if(ex.t!==ta&&ex.t!==z[z.length-1].t)z.push(ex);z.push({t:tb,p:pb});
  // aufräumen: Punkte ohne Richtungswechsel fallen weg, eine zu kleine letzte Gegenbewegung (unter halber Schwelle) ebenso
  for(let ch=true;ch;){ch=false;for(let i=1;i<z.length-1;i++){const a=z[i].p-z[i-1].p,b=z[i+1].p-z[i].p;if(!a||!b||Math.sign(a)===Math.sign(b)){z.splice(i,1);ch=true;break}}
   if(!ch&&z.length>2&&Math.abs(z[z.length-1].p-z[z.length-2].p)<thr*.5){z.splice(z.length-2,1);ch=true}}
  return z};
 // Toleranz der Messung (26.11.2026, Lenny, Screenshot: Expandierendes Dreieck, Welle B): Auf einem Bild sind Wendepunkte nur pixelgenau. Endet eine
 // Teilwelle genau auf Höhe eines anderen Punkts (z. B. (b) auf dem Start von (a)), scheiterten Regular Flat („unter dem Start“) und Expanded Flat
 // („über dem Start“) beide. Ein Muster passt, wenn seine harten Regeln mit den Punkten oder mit einem Punkt bis OCTOL px höher bzw. tiefer gelten.
 const OCTOL=1.5,ocFails=(D,q)=>{const t=u=>D.struct&&!D.struct(u)?['struct']:hardFails(D,u);let f=t(norm(D,q));if(!f.length)return f;
  for(let i=1;i<q.length;i++)for(const e of[OCTOL,-OCTOL]){const r=q.slice();r[i]+=e;const g=t(norm(D,r));if(!g.length)return g}return f};
 const ocFit=(z,allow,d,minL)=>{const q=z.map(x=>x.p),n0=q.length-1;
  const tl=minL*.375,clean=(i,j)=>{const lo=Math.min(q[i],q[j]),hi=Math.max(q[i],q[j]);for(let k=i+1;k<j;k++)if(q[k]<lo-tl||q[k]>hi+tl)return false;return true}; // Toleranz 3 % der Welle (Rauschen auf Fotos)
  // eine Größenordnung: jede nicht gewählte Gegenbewegung innerhalb einer Teilwelle ist höchstens OCF-mal so groß wie die kleinste gewählte
  // Korrekturwelle (sonst ließe sich aus fast jedem verrauschten Zigzag eine Fünfer-Unterteilung herauspicken)
  const inner=(i,j)=>{const up=q[j]>q[i];let ex=q[i],m=0;for(let k=i+1;k<j;k++){if(up?q[k]>ex:q[k]<ex)ex=q[k];else m=Math.max(m,Math.abs(ex-q[k]))}return m};
  const scale=sel=>{let cmin=1e18,imax=0;for(let j=1;j<sel.length;j++){const a=sel[j-1],b=sel[j];if(Math.sign(q[b]-q[a])!==d)cmin=Math.min(cmin,Math.abs(q[b]-q[a]));imax=Math.max(imax,inner(a,b))}return imax<=OCF*cmin};
  for(const key of allow){const D=PAT[key],m=D.labels.length-1,sel=[0];
   const dfs=(j,prev)=>{const lastStep=j===m-1;
    for(let idx=prev+1;idx<=n0;idx+=2){if(lastStep&&idx!==n0)continue;if(!lastStep&&idx===n0)break;
     if(Math.abs(q[idx]-q[prev])<minL||Math.sign(q[idx]-q[prev])!==(j%2?-d:d)||!clean(prev,idx))continue;
     sel.push(idx);let ok=false;
     if(lastStep){ok=!ocFails(D,sel.map(i=>q[i])).length&&scale(sel)}else ok=dfs(j+1,idx);
     sel.pop();if(ok)return true}
    return false};
   if(dfs(0,0))return true}
  return false};
 const ocSub=(S,all)=>{const ps=S.ps,pr=ps.map(q=>q.p),last=ps.length-1,out=[];
  const fams=Object.keys(PAT).filter(k=>PAT[k].labels.join()===frSeq(S.z).join()).map(k=>PAT[k]).filter(Q=>{const v=norm(Q,pr);
   return Object.keys(Q.rules).every(id=>{const r=Q.rules[id];if(!r.hard||pgRuleMax(r)>last)return true;try{return r.ok(v)}catch(_){return true}})});
  for(let k=1;k<=last;k++){
   if(all.some(C=>C.par===S&&C.pk===k&&C.ps&&C.ps.length>=2))continue; // selbst unterteilt: das prüft frCheck (nur der Start gesetzt zählt nicht, 26.11.2026)
   const allow=[...new Set(fams.flatMap(Q=>PGSUB[Q.key].flatMap(V=>V[k-1]||[])))];if(!allow.length)continue;
   const a=ps[k-1],b=ps[k],ta=Math.round(a.t),tb=Math.round(b.t),d=Math.sign(b.p-a.p);if(tb-ta<8||!d)continue;
   const L=Math.abs(b.p-a.p),zf=ocZig(ta,tb,a.p,b.p,.04*L);if(zf.length-1<3)continue; /* ohne Gegenbewegung: nicht beurteilen */IMG.subJ++;
   if(ocFit(zf,allow,d,.08*L))continue;
   // Befund je Schwelle (23.11.2026, Lenny): Zahl der Teilwellen; ist sie für die Welle erlaubt, das am besten passende Teilmuster
   // und seine verletzte Regel. Passt bei einer Schwelle genau eine regelkonforme Unterteilung, gibt es kein Warnsignal.
   const res=OCZZ.map(f=>ocZig(ta,tb,a.p,b.p,f*L)),ev=res.map((z,i)=>{const n=z.length-1,q=z.map(x=>x.p);if(n<1||Math.sign(q[1]-q[0])!==d)return{z,n,i,bad:true};let best=null;
    for(const key of allow){const D=PAT[key];if(D.labels.length!==n+1)continue;const f=ocFails(D,q);if(!f.length)return{z,n,i,ok:true};if(!best||f.length<best.f.length)best={D,f,q}}
    return{z,n,i,best}});
   if(ev.some(e=>e.ok))continue;
   const five=allow.every(key=>PAT[key].labels.length===6),three=allow.every(key=>PAT[key].labels.length===4),need=five?5:three?3:0;
   // Text je Befund (statt „keine Fünfer-Unterteilung, wirkt eher fünfteilig“): 1) Teilwellen in der passenden Zahl gefunden, aber eine Regel
   // verletzt; 2) die andere Zahl gefunden (3 statt 5 bzw. 5 statt 3): wirkt eher drei- bzw. fünfteilig; 3) sonst: unruhiger, mehr Teilwellen
   const rb=ev.filter(e=>e.best&&(!need||e.n===need)).sort((x,y)=>x.best.f.length-y.best.f.length||y.i-x.i)[0],
    other=need?ev.filter(e=>!e.bad&&e.n===(need===5?3:5)).sort((x,y)=>y.i-x.i)[0]:null;
   let kind,txt2,rule=null,z;
   // Seit 26.11.2026 (Lenny): Teilwellen mit ihrer Ebene benennen („Teilwelle (b) in Welle B …“) und jedes erlaubte Muster mit seinem Grund nennen
   const wk=frHtml(S.lev,S.z,k),sub=(D,q,id)=>subRule(D,q,id,S.lev,wk);
   const tried=allow.map(key=>{const D=PAT[key],m=D.labels.length-1;let bb=null;ev.forEach(e=>{if(e.bad||e.n!==m)return;const q=e.z.map(x=>x.p),f=ocFails(D,q);if(!bb||f.length<bb.f.length)bb={f,q}});
    return{key,t:D.title,why:!bb?'keine '+m+' Teilwellen gefunden':bb.f.length?sub(D,bb.q,bb.f[0]):'nicht in einer Größenordnung'}});
   if(rb){kind='regel';z=rb.z;rule=rb.best.f[0];txt2=': Die gefundenen '+rb.n+' Teilwellen verletzen eine Regel ('+sub(rb.best.D,rb.best.q,rule)+')'}
   else if(other){kind=other.n===3?'drei':'fuenf';z=other.z;txt2=', sie wirkt eher '+(other.n===3?'dreiteilig':'fünfteilig')}
   else{kind='unruhig';z=ev.filter(e=>!e.bad&&e.n>1).sort((x,y)=>Math.abs(x.n-(need||5))-Math.abs(y.n-(need||5)))[0];z=z?z.z:zf;txt2=', sie wirkt unruhiger, mit mehr Teilwellen'}
   out.push({k,need,n:z.length-1,kind,rule,t0:a.t,t1:b.t,pts:z.map(q=>({t:q.t,p:q.p})),
    tried,txt:'In Welle '+wk+' finde ich '+(five?'keine regelkonforme Fünfer-Unterteilung':three?'keine regelkonforme dreiteilige Unterteilung':'keine regelkonforme Unterteilung')+txt2+(tried.length>1||kind!=='regel'?'. Geprüft: '+tried.map(x=>'als '+x.t+' nicht ('+x.why+')').join('; '):'')+'. Prüf das mal genauer.'})}
  return out};
 const snapPt=(px,py,o)=>{o=o||{};const rad=o.touch?40:15,t=Tof(px),yc=Math.max(6,Math.min(H-BP-2,py));
  if(o.alt)return{t:Math.max(0,Math.min(ZE,t)),p:Pof(yc),kind:'free'};
  let best=null;const take=(tt,p,kind,x,hl,bon)=>{const d=Math.hypot(x-px,Y(p)-py),s=d-(bon||0);if(d<=rad&&(!best||s<best.s))best={t:tt,p,kind,d,s,hl}}; // hl: Hoch ('h') oder Tief ('l')
  if(FR)FR.pts.forEach(q=>{if(o.self?(q===o.self||q.c===o.self.c):(FR.ac!==null&&q.c===FR.ac))return;if(o.tmin!==undefined&&!(q.t>o.tmin+1e-6))return;if(o.tmax!==undefined&&!(q.t<o.tmax-1e-6))return;take(q.t,q.p,'pt',X(q.t),q.hl)});
  if(best)return best;
  if(IMG)return imgSnap(px,py,o);
  if(t>ZE)return null;const fut=t>c0+.5,free={t,p:Pof(yc),kind:'free'}; // Zukunftszone: frei; nur direkt an der Grenze rastet noch das letzte Pivot ein
  const a=agg(false),gm=Math.floor(c0/tf),K=Math.max(1,Math.ceil((o.touch?18:8)/BW)),g0=Math.max(0,Math.floor(Tof(px-rad)/tf)),g1=Math.min(gm,Math.floor(Tof(px+rad)/tf));
  for(let g=g0;g<=g1;g++)for(const hi of[true,false]){if((o.want==='h'||o.want==='l')&&(o.want==='h')!==hi)continue;const v=hi?a.h[g]:-a.l[g];let ok=true;
    for(let j=Math.max(0,g-K);j<=Math.min(gm,g+K)&&ok;j++){if(j===g)continue;const w=hi?a.h[j]:-a.l[j];if(w>v)ok=false}
    if(!ok)continue;
    // flache Spitze (mehrere Kerzen mit demselben Extrem): zuerst die Stunde, die am Extrem schließt (die Wendekerze), dann die nächste am Finger
    const val=hi?a.h[g]:a.l[g];let bi=-1,bc=false;for(let i=Math.max(0,(g-K)*tf),e=Math.min(c0,(g+K+1)*tf-1);i<=e;i++){if((hi?R.h[i]:R.l[i])!==val)continue;const ci=R.c[i]===val;if(bi<0||(ci!==bc?ci:Math.abs(i-t)<Math.abs(bi-t))){bi=i;bc=ci}}
    if(bi<0||(o.tmin!==undefined&&bi<=o.tmin)||(o.tmax!==undefined&&bi>=o.tmax))continue; // tmax (18.11.2026): beim Ziehen nicht hinter den Nachfolger// Markante Wendepunkte zählen mehr: Je breiter die Strecke (bis 60 px je Seite), über die diese Kerze links und rechts zusammen das Extrem ist, desto eher
    // gewinnt sie gegen einen kleinen Neben-Wendepunkt, der dem Finger zufällig näher liegt (Bonus bis 27 px).
    let wl=0,wr=0;const M=Math.ceil(60/BW);while(wl<M&&g-wl-1>=0&&(hi?a.h[g-wl-1]:-a.l[g-wl-1])<=v)wl++;while(wr<M&&g+wr+1<=gm&&(hi?a.h[g+wr+1]:-a.l[g+wr+1])<=v)wr++;
    take(bi,val,'piv',X(bi),hi?'h':'l',.3*Math.min(90,((g-wl-1<0?M:wl)+(g+wr+1>gm?M:wr))*BW)+((o.want==='H')===hi&&(o.want==='H'||o.want==='L')?14:0))}
  if(best)return best;if(fut)return free;
  for(let g=Math.max(0,Math.min(gm,Math.floor(t/tf)));g<=gm;g++){const hi=o.want==='h'||o.want==='l'?o.want==='h':Math.abs(Y(a.h[g])-py)<=Math.abs(Y(a.l[g])-py),i=hourOf(g,hi,t);
   if(o.tmin!==undefined&&i<=o.tmin)continue;if(o.tmax!==undefined&&i>=o.tmax)break;return{t:i,p:hi?R.h[i]:R.l[i],kind:'cdl',hl:hi?'h':'l'}}
  return null};
 // Erwartet die Zählung als Nächstes ein Hoch oder ein Tief? Aus den letzten beiden Punkten (Hoch und Tief wechseln sich ab); beim Start unklar.
 const wantOf=(c,i)=>{const a=FR.pts.filter(q=>q.c===c).sort((x,y)=>x.i-y.i),k=i===undefined?a.length:a.findIndex(q=>q.i===i);if(k<0)return null;
  const p1=a[k-1],p2=a[k-2],n1=a[k+1];if(p1&&p2&&p1.p!==p2.p)return p1.p>p2.p?'l':'h';if(p1&&!p2&&p1.hl)return p1.hl==='h'?'L':'H'; /* nach dem Start: war er ein Tief, kommt eher ein Hoch (Großbuchstabe = nur bevorzugt, nicht erzwungen) */if(i!==undefined&&p1&&a[k].p!==p1.p)return a[k].p>p1.p?'h':'l';if(i!==undefined&&n1&&a[k].p!==n1.p)return a[k].p>n1.p?'h':'l';return null};
 const buzz=()=>{try{if(navigator.vibrate)navigator.vibrate(8)}catch(_){}}; // kurze Vibration beim Einrasten (Handy, falls verfügbar)
 let SNAPR=null,EXP=false; // EXP: Zeichnen für den Bild-Export (Eigenen Chart prüfen) // Vorschau beim Ziehen: Stelle, an der der Punkt einrasten wird (kleiner Ring)
 // Zeitachse: Abstand der Beschriftung je Zeiteinheit (in Stunden), Datum bzw. Uhrzeit in deutscher Schreibweise (Zeiten in UTC, ohne Sommerzeit)
 const MON=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],p2=n=>(n<10?'0':'')+n;
 // Abstand der Beschriftung nach Pixeln (mindestens ca. 64 px), passend zum Zoom
 const axis=()=>{if(IMG)return'';const st=[1,2,3,6,12,24,48,96,168,336,672,1344,2184,4368,8736].find(h=>h>=tf&&h*BW/tf>=64)||8736,t0=Math.max(0,Tof(0)),t1=Tof(W);let s='';
  for(let t=Math.ceil(t0/st)*st;t<=t1;t+=st){const d=new Date(R.T0+t*36e5),x=X(t-.5),hr=d.getUTCHours();
   const txt=st>=1344?MON[d.getUTCMonth()]+' '+String(d.getUTCFullYear()).slice(2):st<24&&hr?p2(hr)+':00':p2(d.getUTCDate())+'.'+p2(d.getUTCMonth()+1)+'.';
   s+='<line x1="'+x+'" x2="'+x+'" y1="'+(H-BP+4)+'" y2="'+(H-BP+9)+'" stroke="var(--mut)" stroke-width="1"/><text class="lab ax" x="'+x+'" y="'+(H-8)+'">'+txt+'</text>'}
  return s};
 let LBX=[]; // Flächen der Labels im Schwer-Modus (Punkt-id, Mitte, Breite, Höhe): Antippen eines Labels wählt genau dieses
 const pic=()=>{if(IMG&&!EXP)imClamp(); // Bild: harte Grenzen nach jeder Änderung der Ansicht (Ziehen, Zoom, Strecken, zwei Finger)
  const t0=Math.max(0,Tof(0)),t1=Tof(W),bw=Math.max(1,BW-2);
  let s='<svg id="svg" class="pgsvg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Kerzenchart mit Zukunftszone, seitlich verschiebbar und zoombar"><defs><clipPath id="pgclip"><rect x="0" y="0" width="'+W+'" height="'+(H-BP)+'"/></clipPath></defs>';
  // Bild (Eigenen Chart prüfen): unverzerrt an Zeit und Preis gebunden, darüber eine weiße Fläche („Bild blasser“, seit 23.11.2026 0–100 %, Lenny;
  // bei 100 % ist die ganze Chartfläche weiß mit hellen Farben, Klasse .ocw). Beim Export (EXP) ohne Bild, das kommt direkt auf die Leinwand.
  if(IMG&&!EXP){const x0=X(-.5),y0=Y(IMG.h),iw=IMG.w*BW,ih=Y(0)-y0;s+='<g clip-path="url(#pgclip)"><image href="'+IMG.url+'" x="'+x0.toFixed(2)+'" y="'+y0.toFixed(2)+'" width="'+iw.toFixed(2)+'" height="'+ih.toFixed(2)+'" preserveAspectRatio="none" style="image-rendering:'+(BW>2.5?'pixelated':'auto')+'"/><rect id="ocfade" x="'+x0.toFixed(2)+'" y="'+y0.toFixed(2)+'" width="'+iw.toFixed(2)+'" height="'+ih.toFixed(2)+'" fill="#FFFFFF" opacity="'+IMG.fade+'"/></g>'}
  if(IMG&&FR&&FR.done&&m.ew)m.ew.forEach(w=>{const a=X(w.t0),b=X(w.t1);s+='<rect class="pgeb" x="'+Math.min(a,b).toFixed(1)+'" y="0" width="'+Math.abs(b-a).toFixed(1)+'" height="'+(H-BP)+'"/>'}); // Welle mit Regelverstoß in ihrer Unterteilung (26.11.2026)
  if(IMG&&FR&&FR.done&&m.zzw)m.zzw.forEach((w,i)=>{const a=X(w.t0),b=X(w.t1);s+='<rect class="pgwb" data-i="'+i+'" x="'+Math.min(a,b).toFixed(1)+'" y="0" width="'+Math.abs(b-a).toFixed(1)+'" height="'+(H-BP)+'"/>'}); // Welle mit Warnsignal zur Unterteilung
  const zx=Math.max(0,X(c0+.5)),zw=Math.min(W,X(ZE+.5))-zx;if(zw>0)s+='<rect x="'+zx+'" y="0" width="'+zw+'" height="'+(H-BP)+'" fill="var(--line)" opacity=".35"/>';
  const hl=EXP?null:focus();if(hl){const a=Math.max(0,X(hl[0])),b=Math.min(W,X(hl[1]));if(b>a)s+='<rect class="pgfoc" x="'+a+'" y="0" width="'+(b-a)+'" height="'+(H-BP)+'"/>'} // Welle, die gerade dran ist
  const cx=IMG?-1e9:X(c0+.5);if(cx>-2&&cx<W+2)s+='<line class="pgcut" x1="'+cx+'" x2="'+cx+'" y1="0" y2="'+(H-BP)+'"/>';
  if(!IMG)for(let y=20;y<H-BP;y+=50)s+='<line x1="0" x2="'+W+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)" stroke-width=".6"/>';
  if(IMG&&!EXP)s+='<g class="ocax"><line x1="0" x2="'+W+'" y1="'+(H-BP+.5)+'" y2="'+(H-BP+.5)+'"/><text x="'+W/2+'" y="'+(H-8)+'">↔ Zeitachse ziehen</text></g><rect class="pgax" x="0" y="'+(H-BP)+'" width="'+W+'" height="'+BP+'" fill="transparent" style="cursor:ew-resize"/>'; // Bild: Streifen zum Strecken/Stauchen
  if(!IMG)s+='<line x1="0" x2="'+W+'" y1="'+(H-BP+4)+'" y2="'+(H-BP+4)+'" stroke="var(--line)" stroke-width="1"/>'+axis()+'<rect class="pgax" x="0" y="'+(H-BP)+'" width="'+W+'" height="'+BP+'" fill="transparent" style="cursor:ew-resize"/>';
  // Kerzen: steigend blau gefüllt, fallend weiß mit blauem Rand (wie im Wellen-Pfad); der wahre Rest nach dem Auflösen blass
  const thin=BW<2.5; // sehr weit herausgezoomt: nur Dochte
  const candles=(a,g0,g1,cls)=>{let o='<g class="'+cls+'" clip-path="url(#pgclip)">';for(let g=Math.max(0,g0);g<=Math.min(a.c.length-1,g1);g++){if(a.c[g]===undefined)continue;const x=(g+.5)*BW-sc,up=a.c[g]>=a.o[g],yt=Y(Math.max(a.o[g],a.c[g])),yb=Y(Math.min(a.o[g],a.c[g]));
    o+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="'+Y(a.h[g]).toFixed(1)+'" y2="'+Y(a.l[g]).toFixed(1)+'"/>';if(thin)continue;o+='<rect class="'+(up?'u':'d')+'" x="'+(x-bw/2).toFixed(1)+'" y="'+yt.toFixed(1)+'" width="'+bw+'" height="'+Math.max(1,yb-yt).toFixed(1)+'"/>'}return o+'</g>'};
  const gc=Math.floor(c0/tf);s+=candles(agg(false),Math.floor(t0/tf),Math.min(gc,Math.floor(t1/tf)),'pgcd');
  s+=candles(fcAgg(fcNodes()),Math.max(gc+1,Math.floor(t0/tf)),Math.floor(t1/tf),'pgfc'); // Prognose: gestrichelte Kerzen
  if(m.shown)s+=candles(agg(true),gc+1,Math.floor(t1/tf),'pgcd fut'); // echter Verlauf darüber
  // Invalidierungslinien: gestrichelt ab dem Pivot nach rechts, kurzes Etikett an der Linie
  m.lines.forEach(z=>{const x1=X(z.t),y=Y(z.p),x2=Math.max(x1+40,X(ZE+.5));
   s+='<line class="pgil" x1="'+x1+'" x2="'+x2+'" y1="'+y+'" y2="'+y+'"/><circle cx="'+x1+'" cy="'+y+'" r="3.5" fill="var(--dn)"/>'+
    '<text class="lab pgilt" x="'+(x1+7)+'" y="'+(y+(z.below?14:-6))+'">'+esc(z.txt)+'</text>'});
  // Beschriftungen sammeln und so verschieben, dass sie sich nicht überlappen (nach außen, weg vom Punkt). c: Ebene 1 im Kreis.
  // Seit 12.11.2026 (Lenny): Labels an einem gemeinsamen Pivot (stk) bilden einen Stapel, die kleinste Welle steht innen am Punkt,
  // die größte außen (Hoch: größere darüber, Tief: größere darunter). Der Stapel wird als Ganzes platziert.
  // Große Wellen (c) kommen zuerst und sind immer sichtbar; kleinere Labels, die auch versetzt noch überlappen, werden ausgeblendet.
  LBX=[];
  const labs=[],lab=(x,py,up,t,st,c,stk,rank,gap,id,lv)=>{if(x>-30&&x<W+30)labs.push({x,py,up,t,st,c,stk,rank:rank||0,gap,id,lv})},put=()=>{const done=[],hit=(a,w)=>done.some(b=>Math.abs(b.x-a.x)<(w+b.w)/2+3&&Math.abs(b.y-a.y)<(a.c||b.c?22:17));
   const U={},ord=[];labs.forEach((a,i)=>{const k=a.stk!==undefined?'s'+a.stk:'#'+i;if(!U[k]){U[k]=[];ord.push(k)}U[k].push(a)});
   const units=ord.map(k=>U[k].sort((a,b)=>a.rank-b.rank)).sort((A,B)=>(B.some(a=>a.c)?1:0)-(A.some(a=>a.c)?1:0));
   const wOf=a=>a.c?24:String(a.t).replace(/<[^>]*>/g,'').length*7.6,inY=y=>y>=16&&y<=H-BP-4;
   // y-Werte eines Stapels in Richtung up, um sh weiter nach außen geschoben
   const lay=(A,up,sh)=>{let y=0;return A.map((a,i)=>{const g=a.gap||(a.c?[14,22]:[10,18]);y=i?y+(up?-1:1)*(a.c||A[i-1].c?19:15):a.py+(up?-g[0]:g[1]);return y+(up?-sh:sh)})};
   units.forEach(A0=>{let A=A0;const big=A[A.length-1];let up=big.up;
    for(let tries=0;tries<2;tries++){
     let ys=lay(A,up,0);if(!ys.every(inY)){const o=lay(A,!up,0);if(o.every(inY))up=!up;ys=up===big.up?ys:o}
     let ok=-1;for(let n=0;n<8;n++){const y2=lay(A,up,15*n);if(n&&!y2.every(inY))break;if(!A.some((a,i)=>hit({x:a.x,y:y2[i],c:a.c},wOf(a)))){ok=n;break}}
     if(ok<0&&A.some(a=>!a.c)){if(!A.some(a=>a.c))return;A=A.filter(a=>a.c);continue} // kleine Labels weglassen, große bleiben
     ys=lay(A,up,Math.max(0,ok));ys=ys.map(y=>Math.max(16,Math.min(H-BP-4,y)));
     A.forEach((a,i)=>{a.y=ys[i];a.w=wOf(a);done.push(a);const hs=a.id!==undefined&&FR&&FR.sel===a.id&&!FR.done; // gewähltes Label hervorgehoben
      if(a.id!==undefined)LBX.push({id:a.id,x:a.x,y:a.y-4,w:Math.max(20,a.w),h:a.c?20:16});
      if(a.c)s+='<circle class="pgc1'+(a.lv?' wlv1':'')+(hs?' pgls':'')+'" cx="'+a.x+'" cy="'+(a.y-4)+'" r="10"/>';else{if(a.lv)s+='<rect class="wlv'+a.lv+'" x="'+(a.x-a.w/2-4)+'" y="'+(a.y-15)+'" width="'+(a.w+8)+'" height="20" rx="6"/>';else if(IMG)s+='<rect class="pglbg" x="'+(a.x-a.w/2-4)+'" y="'+(a.y-15)+'" width="'+(a.w+8)+'" height="20" rx="6"/>';if(hs)s+='<rect class="pglsr" x="'+(a.x-a.w/2-4)+'" y="'+(a.y-15)+'" width="'+(a.w+8)+'" height="20" rx="6"/>'}s+='<text class="lab'+(a.c?' l1':'')+(a.lv?' wt'+a.lv:'')+'"'+(a.st?' style="'+a.st+'"':'')+' x="'+a.x+'" y="'+a.y+'">'+a.t+'</text>'});break}})};
  const upAt=(i,list)=>{const p=list[i].p,a=list[i-1],b=list[i+1];return a?p>=a.p:(b?p>b.p:true)};
  const dot=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="2.5" fill="var(--mut)"/>'; // Start einer Zählung bzw. zu schmale Welle: nur ein kleiner Marker
  if(m.shown)for(let k=cut0+1;k<R.mp.length;k++){const i=R.mp[k],up=R.pr[i]>=R.pr[R.mp[k-1]];lab(X(i),Y(R.pr[i]),up,pgLab(P.key,k),'fill:var(--mut)',1)}
  if(CNT){ // gezählter sichtbarer Teil: Ebene 1 im Kreis, darunter Ebenen 2 und 3 je nach Zeiteinheit. Start (0) nur als Marker.
   const L=CNT.t.map((t,k)=>({t,p:CNT.p[k]}));L.forEach((q,k)=>{const up=upAt(k,L);if(!k){s+=dot(X(q.t),Y(q.p));return}lab(X(q.t),Y(q.p),up,pgLab(CNT.key0,k),'',1,'t'+q.t,9,undefined,undefined,1)});
   // Sichtbarkeit je Zählung (Gruppe g), nicht je Label: alle Labels einer Unterteilung erscheinen gemeinsam, sobald ihre Wellen im
   // Schnitt breit genug sind. So folgt z. B. die (5) auf demselben Pivot wie ① derselben Regel wie (1) bis (4).
   const G={};CNT.sub.forEach(q=>{const o=G[q.g]=G[q.g]||{n:0,t0:q.t0,t1:q.t0,ps:[]};o.n++;o.t1=Math.max(o.t1,q.t);o.ps.push(q)});
   Object.values(G).forEach(o=>o.ps.sort((a,b)=>a.t-b.t));
   const upMain={};L.forEach((q,k)=>upMain[q.t]=upAt(k,L));
   CNT.sub.forEach(q=>{const o=G[q.g],big=(o.t1-o.t0)/o.n*BW/tf>=(q.lev===2?20:16);
    if(!big){s+=dot(X(q.t),Y(q.p));return}const j=o.ps.indexOf(q),nb=o.ps[j-1]||o.ps[j+1],up=upMain[q.t]!==undefined?upMain[q.t]:(!nb||(o.ps[j-1]?q.p>=nb.p:q.p>nb.p));
    lab(X(q.t),Y(q.p),up,q.l,LFZ(q.lev),0,'t'+q.t,6-q.lev,[8,16],undefined,q.lev)})}
   else if(FR){ // Schwer: frei gesetzte Punkte; Fehler rot, ausgewählter Punkt mit Ring.
    // Wellengröße (lev) je Zählung steht fest (FR.cm). Sichtbarkeit je Zählung: alle Labels einer Zählung oder keins (laufende und
    // ausgewählte Zählung immer). Gemeinsame Pivots: größte Welle außen.
    const lv={},vis={},ser=frSeries(),selQ=FR.sel&&FR.pts.find(x=>x.id===FR.sel);
    // Staffelung für fünf Größen (27.11.2026): je kleiner, desto breiter müssen die Wellen im Schnitt sein (18 … 24 px), und eine Unterteilung
    // erscheint erst, wenn die Zählung darüber sichtbar ist. Größe 1, laufende und ausgewählte Zählung immer.
    const TH=[0,0,18,20,22,24],sv={};FRVIS={};
    ser.slice().sort((a,b)=>a.lev-b.lev).forEach(S=>{const a=S.ps||S.own,n=Math.max(1,a.length-1),avg=a.length>1?(a[a.length-1].t-a[0].t)/n:1e9,pv=!S.par||sv[S.par.c]!==false;
     const v=S.lev===1||(pv&&avg*BW/tf>=TH[Math.min(5,S.lev)])||S.c===FR.ac||(selQ&&selQ.c===S.c);sv[S.c]=v;FRVIS[S.c]=v;S.pts.forEach(q=>{lv[q.id]=S.lev;vis[q.id]=v})});
    const selC=selQ&&selQ.c; // ausgewählte Zählung hervorheben
    const byT=FR.pts.map(q=>({...q,lev:lv[q.id]||1,o:q})).sort((a,b)=>a.t-b.t||a.lev-b.lev);
    const key=q=>q.t.toFixed(3)+','+q.p.toFixed(4),upK={};
    byT.forEach(q=>{const nb=byT.filter(o=>o.c===q.c&&o!==q).sort((a,b)=>Math.abs(a.t-q.t)-Math.abs(b.t-q.t))[0],up=!nb||q.p>=nb.p,k=key(q);if(q.i>0&&(!upK[k]||upK[k].lev>q.lev))upK[k]={lev:q.lev,up}});
    byT.forEach(q=>{const x=X(q.t),y=Y(q.p),er=FR.err[q.id],sl=FR.sel===q.id,big=vis[q.id];
     if(selC!==undefined&&q.c===selC&&!sl)s+='<circle cx="'+x+'" cy="'+y+'" r="8" fill="var(--accent)" opacity=".22"/>';
     s+='<circle class="'+(er?'':'wpt'+Math.min(5,q.lev||1))+'" cx="'+x+'" cy="'+y+'" r="'+(sl?7:big&&q.i?4.5:2.5)+'" fill="'+(er?'var(--dn)':'var(--accent)')+'" stroke="'+(sl?'var(--ink)':'var(--surface)')+'" stroke-width="'+(sl?2:1.5)+'"/>';
     if(er)s+='<circle cx="'+x+'" cy="'+y+'" r="11" fill="none" stroke="var(--dn)" stroke-width="2"/>';
     if(!q.i)return; // Start einer Zählung: kein Label (0), nur der Punkt
     const k=key(q),up=upK[k]?upK[k].up:true;
     if(big||er)lab(x,y,up,frTxt(q.lev,q.z,q.i),(er?'fill:var(--dn);':'')+LFZ(q.lev),q.lev===1?1:0,k,6-q.lev,[12,20],q.id,er?0:q.lev)})}
  // geplante Fortsetzung: grüne Punkte, Ebene 2 in Klammern, Ende der Hauptwelle im Kreis (außen am selben Pivot)
  if(CNT){const all=[{x:CNT.t[CNT.cut],p:CNT.p[CNT.cut]}].concat(m.pts);
   if(m.pts.length)s+='<polyline fill="none" stroke="var(--up)" stroke-width="2" stroke-dasharray="6 4" points="'+all.map(q=>X(q.x)+','+Y(q.p)).join(' ')+'"/>';
   let j=0;segs().forEach(g=>g.pts.forEach((q,t)=>{j++;const prv=all[j-1],nx=all[j+1],up=q.p>=prv.p&&(!nx||q.p>=nx.p)||(!nx&&q.p>=prv.p);
    s+='<circle cx="'+X(q.x)+'" cy="'+Y(q.p)+'" r="5" fill="var(--up)" stroke="var(--surface)" stroke-width="1.5"/>';lab(X(q.x),Y(q.p),up,PGK[g.kind].l[t],'',0,'m'+j,0,[10,20]);
    if(t===g.n-1)lab(X(q.x),Y(q.p),up,pgLab(fam()[0].key,g.k),'',1,'m'+j,1);}))}
  // erkannter bzw. nachgezeichneter Kursverlauf als Kerzen (24.11.2026, Lenny; vorher Zickzack aus Hoch und Tief, wirkte wie eine Doppelspur):
  // G Bildspalten je Kerze, so dass die Kerzen bei der Start-Ansicht etwa so breit sind wie im Original (IMG.cw, mindestens 2 Bildschirmpixel);
  // beim Hineinzoomen feiner, beim Herauszoomen gröber. Hoch/Tief = exaktes Extrem der Gruppe, Schluss = Mitte der letzten Spalte, Eröffnung =
  // Schluss der Kerze davor. Steigend gefüllt, fallend als Umriss. Das Einrasten nutzt weiter die einzelnen Spalten (imgSnap).
  // Bei „Bild blasser“ 100 % immer, auch im Ergebnis und im Export, sonst wäre die Fläche leer
  if(IMG&&!EXP&&!FR.done&&(IMG.show!==false||IMG.trace||IMG.fade>=1))s+=ocUns();
  if(IMG&&(IMG.fade>=1||!EXP&&(IMG.show!==false||IMG.trace)&&!FR.done))s+=ocCandles();
  if(IMG&&TRS&&TRS.length>1)s+='<polyline class="octrs" points="'+TRS.map(q=>X(q.t).toFixed(1)+','+Y(q.p).toFixed(1)).join(' ')+'"/>';
  if(IMG&&FR.done&&m.zz)m.zz.forEach(z=>{s+='<polyline class="pgzz" points="'+z.map(q=>X(q.t).toFixed(1)+','+Y(q.p).toFixed(1)).join(' ')+'"/>'+z.slice(1,-1).map(q=>'<circle class="pgzzp" cx="'+X(q.t).toFixed(1)+'" cy="'+Y(q.p).toFixed(1)+'" r="3"/>').join('')}); // gefundene Wendepunkte (Warnsignal Unterteilung)
  put();
  if(SNAPR&&!EXP)s+='<circle class="pgsnap" cx="'+X(SNAPR.t)+'" cy="'+Y(SNAPR.p)+'" r="10"/><circle cx="'+X(SNAPR.t)+'" cy="'+Y(SNAPR.p)+'" r="2.2" fill="var(--accent)"/>'; // Vorschau: hier rastet der Punkt ein
  // „Ab hier: deine Prognose“ an die erste Höhe, an der kein Label steht (sonst weglassen, die gestrichelte Linie bleibt)
  if(cx>-2&&cx<W+2){const right=cx+165<W,x0=right?cx+6:cx-150,lb=labs.filter(a=>a.w);for(let y=TP+44;y<H-BP-10;y+=20)if(!lb.some(a=>a.x+a.w/2+3>x0&&a.x-a.w/2-3<x0+146&&Math.abs(a.y-y)<(a.c?24:19))){
   s+='<text class="lab pgcutt" x="'+(right?cx+6:cx-6)+'" y="'+y+'"'+(right?'':' style="text-anchor:end"')+'>Ab hier: deine Prognose</text>';break}}
  return s+'</svg>';};
 const zoneMsg='Setze den Punkt in die graue Zone, rechts vom vorherigen Punkt.';
 // Zeitbereich der Welle, die gerade dran ist (leicht hinterlegt): beim Zählen ab ihrem Startpunkt bis zum Ende des sichtbaren Teils,
 // beim Planen ab ihrem Start bis zum Ende der Zukunftszone
 const focus=()=>{if(FR)return frBand();if(!CNT)return null;
  if(m.done)return null;const c=cur();if(!c)return null;const g=segs().filter(x=>x.k<c.k).pop();return[g?g.pts.slice(-1)[0].x:CNT.t[CNT.cut],ZE]};
 const C1=l=>'<span class="c1">'+l+'</span>'; // Beschriftung der Ebene 1 im Kreis (wie im Chart)
 const SUBS='Teilwellen: (1)–(5), (A)–(C), (A)–(E), (W)–(Y) oder (W)–(Z)';
 const tfBar=()=>(IMG?'':'<div class="pgtf" role="group" aria-label="Zeiteinheit">'+PGTF.map(([n,h])=>'<button data-tf="'+h+'" class="'+(h===tf?'on':'')+'" aria-pressed="'+(h===tf)+'">'+n+'</button>').join('')+'</div>')+
  '<div class="pgzm" role="group" aria-label="Zoom">'+(IMG?'<button data-zr aria-label="Ansicht zurücksetzen" title="Ansicht zurücksetzen">'+ICON.reset+'</button>':'')+'<button data-zm="-" aria-label="Herauszoomen">−</button><button data-zm="+" aria-label="Hineinzoomen">+</button></div>';
 // Legende der fünf Wellengrößen (seit 27.11.2026, Lenny): kompakt, auf dem Handy eingeklappt (Tipp auf „Wellengrößen“ klappt auf)
 const legend='<details class="pglg"'+(innerWidth>=600?' open':'')+'><summary>Wellengrößen</summary><span class="pglgl" aria-label="Beschriftung der Wellengrößen">'+[1,2,3,4,5].map(l=>'<span class="pglgi"><span class="wlg wlg'+l+'">'+pgTxt(l,'1')+'</span> '+['','sehr groß','groß','mittel','klein','sehr klein'][l]+'</span>').join('<span class="mut" aria-hidden="true"> · </span>')+'</span> <span class="mut">· kleinere Labels erscheinen beim Hineinzoomen</span></details>';
 const LFZ=lev=>lev>=4?'font-size:11px;':lev===3?'font-size:12px;':''; // Schriftgröße je Wellengröße (Größe 1 im Kreis, eigene Größe)
 const wn=k=>pgLab(fam()[0].key,k);
 // Ansicht einrichten (Breite am fertigen Rahmen messen; beim ersten Mal Zeiteinheit und Kerzenbreite wählen)
 const initView=()=>{size();
  if(sc===null){ // erste Anzeige: feinste Zeiteinheit (4h, D, W), in der sichtbarer Teil + Zukunftszone mit mindestens 4 px je Kerze die Breite füllen
   tf=IMG?1:[4,24,168].find(h=>bwFit(h)>=4)||168;startView(tf)}
  sc=clampSc(sc);if(!CNT||m.done)return;room().forEach(grow)}; // Leicht: Platz für die Welle, die gerade dran ist (erweitert nur)
 // keepView: kein Verrutschen beim Punktsetzen, der Chart rückt innerhalb einer Runde nie nach oben (26.11.2026, Lenny)
 const render=fb=>FR?frRender(fb):keepView(m,()=>render0(fb)),render0=fb=>{fbLast=fb;
  {const cu=cur(),ws=waves();
   const ltask=cu=>'Der Chart bricht nach Welle '+wn(CNT.cut)+' ab. Plane '+(ws.length>1?'die fehlenden Wellen '+ws.map(wn).join(', '):'die fehlende Welle '+wn(ws[0]))+' in der grauen Zone. '+
    (m.done?'':cu?(cu.needChar?'<b>Jetzt die Welle '+C1(wn(cu.k))+'.</b> Wie unterteilt sie sich ('+SUBS+')?':'Welle '+C1(wn(cu.k))+' als '+PGK[cu.kind].t+': Setze ihre Teilwellen rechts der Grenze. Nächster Punkt <span class="nextpt">'+PGK[cu.kind].l[cu.have]+'</span>'+(cu.have===cu.n-1?', er ist zugleich das Ende von Welle '+C1(wn(cu.k))+'.':'.')+' Tippen setzt den Punkt, Wischen verschiebt den Chart.'):'Alle Wellen gesetzt. Prüfe deine Planung.');
   $('#view').innerHTML='<p class="kick">Wie geht es weiter?'+(lvl==='schwer'?' · Schwer':'')+'</p><p class="task">'+ltask(cu)+'</p>'+
    '<div class="pgk" role="group" aria-label="Zählweise der Welle">'+Object.keys(PGK).map(k=>{const on=cu&&!cu.needChar&&cu.kind===k,ok=cu&&cu.needChar&&!m.done;return'<button data-ch="'+k+'"'+(on?' class="on" aria-pressed="true"':'')+(ok?'':' disabled')+'>'+PGK[k].t+'</button>'}).join('')+'</div>'+ // immer da, sonst ändert sich die Höhe über dem Chart (26.11.2026)
    '<div class="chart pgc" id="pgc"></div>'+legend+
    '<div class="dock">'+(m.done?'<button class="p" id="real" '+(m.shown?'disabled':'')+'>Tatsächlichen Verlauf zeigen</button><button class="p" id="nxt">Nächster Chart</button>':
     '<button class="p" id="chk" '+(cu?'disabled':'')+'>Prüfen</button><button id="und">Zurück</button><button id="rst">Neu setzen</button>')+'</div>'+
    '<div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>';
   // Höhe des längsten Aufgabentexts dieser Runde reservieren: je fehlende Welle die Frage nach der Zählweise und der Text beim letzten Punkt (26.11.2026)
   if(!m.done)taskMin(ws.flatMap(k=>[ltask({k,needChar:true})].concat(Object.keys(PGK).map(kind=>ltask({k,kind,n:PGK[kind].l.length,have:PGK[kind].l.length-1})))))}
  initView();
  $('#pgc').innerHTML=pic()+tfBar()+'<button id="pgend" class="pgend" hidden>Zum Ende springen</button>';
  bindChart();
  if(m.done){$('#real').onclick=()=>{m.shown=true;render(fb+'<p class="mut">Darübergelegt: der tatsächliche Verlauf, im selben Maßstab. Gestrichelt darunter: deine Prognose. Nur zum Vergleich: Punkte gibt es für regelkonformes Planen, nicht für Treffer.</p>')};$('#nxt').onclick=()=>progn(arg,lvl);return}
  const cu=cur();
  document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{m.ch[cu.k]=b.dataset.ch;render()});
  $('#und').onclick=()=>{const g=segs().pop();if(!g)return;if(g.pts.length)m.pts.pop();else delete m.ch[g.k];m.lines=[];render()};
  $('#rst').onclick=()=>{m.ch={};m.pts=[];m.lines=[];render()};
  $('#chk').onclick=verify;
 };
 // Tippen: beim Zählen rastet der Punkt am Chart ein; beim Planen setzt er den nächsten Punkt in der Zukunftszone
 const tap=(px,py,touch,alt)=>{
  if(FR)return frTap(px,py,touch,alt);
  const c=cur(),t=Tof(px),last=m.pts.length?m.pts[m.pts.length-1].x:CNT.t[CNT.cut];
  if(!c)return;
  if(c.needChar)return toast('Wähle zuerst die Zählweise von Welle '+wn(c.k)+'.');
  if(t<=last+.3||t>ZE)return toast(zoneMsg);
  m.pts.push({x:t,p:Pof(Math.max(6,Math.min(H-BP-2,py)))});if(py<TP+24||py>H-BP-24)grow(m.pts[m.pts.length-1].p);m.lines=[];render()}; // am Rand: Achse erweitern
 // Gesten trennen: auf einem Punkt ansetzen und ziehen = Punkt verschieben; auf freier Fläche bewegen = Chart verschieben; kurz tippen = Punkt setzen.
 const bindChart=()=>{const svg=$('#svg'),eb=$('#pgend');
  const loc=ev=>{const b=svg.getBoundingClientRect();return[ev.clientX-b.left,ev.clientY-b.top]};
  const endBtn=()=>{eb.hidden=!!IMG||X(c0)<=W-24};                         // Ende des Verlaufs nicht mehr im Bild
  const upd=()=>{fitY();redraw(svg,pic());endBtn()};
  endBtn();eb.onclick=()=>{sc=homeSc();upd()};
  // Zeiteinheit umschalten: die Bildmitte bleibt an derselben Stelle der Zeitachse, Punkte behalten Zeit und Preis
  document.querySelectorAll('[data-tf]').forEach(b=>b.onclick=()=>{saveV();loadV(+b.dataset.tf); // jede Zeiteinheit hat ihre eigene Ansicht (beim ersten Mal die Start-Ansicht)
   document.querySelectorAll('[data-tf]').forEach(x=>{const on=+x.dataset.tf===tf;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});upd()});
  const cur0=FR&&!FR.done?(FR.md==='draw'?'crosshair':'default'):'grab'; // Mauszeiger je Werkzeug
  svg.style.touchAction='none';svg.style.display='block';svg.style.cursor=cur0;
  if(FR&&!FR.done&&FR.md==='sel')svg.onpointermove=e=>{if(GEST||e.pointerType==='touch')return;const [x,y]=loc(e);svg.style.cursor=FR.pts.some(q=>Math.hypot(X(q.t)-x,Y(q.p)-y)<12)?'move':'default'};
  // Zoom-Knöpfe: um die Bildmitte
  document.querySelectorAll('[data-zm]').forEach(b=>b.onclick=()=>{zoomAt(b.dataset.zm==='+'?1.5:1/1.5,W/2,(H-BP)/2);saveV();redraw(svg,pic());endBtn()});
  // Bild (24.11.2026): Startansicht über den Knopf oder Doppelklick auf die freie Fläche (im Werkzeug Zeichnen setzt ein Klick einen Punkt,
  // daher nur beim Auswählen und im fertigen Ergebnis; seit 25.11.2026 auch nicht mehr auf dem Streifen, dort setzt ein Tipp jetzt einen Punkt)
  const rv=$('[data-zr]');if(rv)rv.onclick=()=>{startView(1);saveV();upd()};
  if(IMG)svg.ondblclick=e=>{const [px,py]=loc(e);if(FR&&!FR.done&&FR.md==='draw')return;if(FR&&FR.pts.some(q=>Math.hypot(X(q.t)-px,Y(q.p)-py)<14))return;startView(1);saveV();upd()};
  // Strg/Cmd + Mausrad bzw. Trackpad-Zoom: um die Mausposition. Sonst verschieben Mausrad und Trackpad den Chart; am Anschlag scrollt die Seite normal weiter
  // Mausrad (seit 13.11.2026): ohne Taste nur die Zeitachse strecken (nach oben) bzw. stauchen (nach unten), um die Mausposition;
  // Strg/Cmd + Mausrad zoomt in alle Richtungen; waagerechtes Wischen am Trackpad verschiebt. Über dem Chart scrollt die Seite nie.
  svg.onwheel=e=>{e.preventDefault();const [x,y]=loc(e),k=e.deltaMode===1?33:e.deltaMode===2?400:1,dx=e.deltaX*k,dy=e.deltaY*k;
   if(e.ctrlKey||e.metaKey){zoomAt(Math.exp(-Math.max(-60,Math.min(60,dy))*.004),x,y);saveV();redraw(svg,pic());endBtn();return}
   if(Math.abs(dx)>Math.abs(dy)){const n=clampSc(sc+dx);if(n!==sc){sc=n;upd()}return}
   zoomX(Math.exp(-Math.max(-120,Math.min(120,dy))*.002),x);saveV();upd()};
  svg.onpointerdown=e=>{if(e.button)return;
   if(GEST){const g=GEST;if(e.pointerType==='touch'&&g.touch&&!g.pinch){e.preventDefault();const a=g.pos();g();pinch(a,{id:e.pointerId,x:e.clientX,y:e.clientY})}else g();return} // zweiter Finger: Zwei-Finger-Zoom, nichts setzen
   // Fangradius: Finger größer als Maus. Läuft eine Zählung, wird ein Punkt nicht ausgewählt oder verschoben: Tippen setzt dann das
   // nächste Label genau auf diesen Pivot (sk), Ziehen verschiebt den Chart.
   e.preventDefault();const [px,py]=loc(e),touch=e.pointerType==='touch';
   // Verlauf nachzeichnen (23.11.2026): ein Finger bzw. die Maus zeichnet, ein zweiter Finger zoomt (Strich verworfen)
   if(IMG&&IMG.trace&&FR&&!FR.done){const id=e.pointerId,S=[{t:Tof(px),p:Pof(py)}];let lx=e.clientX,ly=e.clientY;TRS=S;
    const mv=ev=>{if(ev.pointerId!==id)return;lx=ev.clientX;ly=ev.clientY;const [x,y]=loc(ev);S.push({t:Math.max(0,Math.min(c0,Tof(x))),p:Pof(Math.max(TP,Math.min(H-BP,y)))});redraw(svg,pic())};
    const stop=()=>{GEST=null;TRS=null;removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up)};
    const up=ev=>{if(ev.pointerId!==id)return;stop();if(ev.type==='pointerup')ocApply(S);frRender(fbLast)};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);GEST=stop;stop.touch=touch;stop.pos=()=>({id,x:lx,y:ly});return}
   if(py>=H-BP&&!IMG)return axisDrag(e,px); // Bild: der Streifen unten streckt nur beim Ziehen (Modus 'ax'); ein Tipp dort wirkt wie im Chart (25.11.2026) // Zeitachse: ziehen staucht/streckt, Doppeltipp setzt zurück, nie einen Punkt setzen
   let k=-1,sk=-1,lk=-1,best=touch?28:12,grp=[],gs=[],mq=null;
   // Werkzeug (seit 13.11.2026, Lenny): Zeichnen = Tipp auf einen Punkt setzt den neuen Punkt genau auf diesen Pivot (sk), Ziehen verschiebt
   // nur den Chart; Auswählen = Tipp wählt aus, Ziehen auf einem Punkt verschiebt ihn (k). Kein Werkzeug tut, was das andere tut.
   if(FR&&!FR.done){const dr=FR.md==='draw';FR.pts.forEach((q,j)=>{if(dr&&FR.ac!==null&&q.c===FR.ac)return;const d=Math.hypot(X(q.t)-px,Y(q.p)-py);if(d<best){best=d;k=j}});
    if(k>=0){const q0=FR.pts[k];grp=FR.pts.filter(q=>q.t===q0.t&&q.p===q0.p);if(dr)k=-1} // grp: alle Punkte auf demselben Pivot
    // Seit 14.11.2026 (Lenny): Auswählen. Tipp direkt auf ein Label wählt genau dieses (lk). Am gemeinsamen Pivot: kleinste Welle zuerst,
    // erneutes Tippen die nächstgrößere. Ziehen verschiebt nur das gewählte Label (mq), die anderen auf dem Pivot bleiben stehen.
    if(!dr){const hitL=pad=>LBX.filter(b=>Math.abs(b.x-px)<=b.w/2+pad&&Math.abs(b.y-py)<=b.h/2+pad).sort((a,b)=>Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py))[0];
     const L=hitL(0)||(k<0?hitL(touch?8:3):null); // genau auf dem Label: immer dieses Label; knapp daneben nur, wenn dort kein Punkt liegt
     if(L)lk=FR.pts.findIndex(q=>q.id===L.id);
     if(lk>=0){k=-1;grp=[]}
     else if(k>=0){const lvc=c=>(FR.cm[c]||{lev:1}).lev;gs=grp.slice().sort((a,b)=>lvc(b.c)-lvc(a.c)||b.i-a.i);mq=gs.find(q=>q.id===FR.sel)||gs[0]}}}
   if(CNT&&!m.done)m.pts.forEach((q,j)=>{const d=Math.hypot(X(q.x)-px,Y(q.p)-py);if(d<best){best=d;k=j}}); // k: geplanter Punkt direkt unter dem Finger
   const x0=e.clientX,y0=e.clientY,s0=sc,B0=BW,ta=Tof(px),T0=performance.now(),id=e.pointerId,zy=zoomedY(),inAx=IMG&&py>=H-BP;let mode='',ly=y0,lx=x0,dw=null,lsn=null,lkey='',t00=0,p00=0;
   const stop=()=>{GEST=null;removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);svg.style.cursor=cur0;saveV()};
   const mv=ev=>{if(ev.pointerId!==id)return;const dx=ev.clientX-x0,dy=ev.clientY-y0;
    if(!mode&&Math.hypot(dx,dy)>(k>=0||!touch?5:8)){mode=inAx?'ax':k>=0?'p':touch&&!zy&&!IMG&&Math.abs(dy)>Math.abs(dx)?'v':'h'; /* Maus: ab 5 px ziehen statt klicken; Bild: ein Finger verschiebt in alle Richtungen */svg.style.cursor='grabbing';if(mode==='p'){m.lines=[];if(FR&&mq){FR.sel=mq.id;FR.pw={c:mq.c,k:Math.max(1,mq.i)};dw=wantOf(mq.c,mq.i);t00=mq.t;p00=mq.p}}}
    // nur das gewählte Label bewegt sich. Seit 16.11.2026: Der Punkt folgt dem Finger (am Handy 34 px darüber, damit man ihn sieht),
    // ein Ring zeigt, wo er einrasten wird (snapPt); wechselt das Ziel, vibriert das Handy kurz. Alt (PC): frei, ohne Einrasten.
    // Seit 18.11.2026 (Lenny): Der Punkt bleibt zwischen Vorgänger und Nachfolger seiner Zählung (gleiches Label, nie umsortiert).
    // Darüber hinaus stoppt er an der Grenze; eingerastet wird nur innerhalb (tmin/tmax), sonst bleibt das letzte gültige Ziel.
    if(mode==='p'&&FR){const [x,yf]=loc(ev),y=yf-(touch?34:0),nb=FR.pts.filter(q=>q.c===mq.c&&q!==mq),pv=nb.filter(q=>q.i<mq.i).sort((a,b)=>b.i-a.i)[0],nx=nb.filter(q=>q.i>mq.i).sort((a,b)=>a.i-b.i)[0];
     const t0=Tof(x),lo3=pv?pv.t+.02:0,hi3=nx?nx.t-.02:ZE,t=Math.max(lo3,Math.min(hi3,t0)),p=Pof(Math.max(6,Math.min(H-BP-2,y)));if(t0<lo3||t0>hi3)ordHint();mq.t=t;mq.p=p;
     let sn=snapPt(X(t),y,{touch,want:dw,alt:ev.altKey,self:mq,tmin:pv?pv.t:undefined,tmax:nx?nx.t:undefined});if(sn&&((pv&&!(sn.t>pv.t))||(nx&&!(sn.t<nx.t))))sn=null;if(!sn)sn=lsn||{t:t00,p:p00,hl:mq.hl,kind:'pt'};const key=sn&&sn.kind!=='free'?sn.t+','+sn.p:'';if(key&&key!==lkey&&touch)buzz();lkey=key;lsn=sn;SNAPR=key?sn:null;
     if(y<TP+24||y>H-BP-24)grow(p);redraw(svg,pic())}
    else if(mode==='p'){const [x,y]=loc(ev),lo2=(k?m.pts[k-1].x:CNT.t[CNT.cut])+.3,hi2=k<m.pts.length-1?m.pts[k+1].x-.3:ZE; // nur dieser Punkt bewegt sich; Punkte bleiben zeitlich in Reihenfolge
     if(Tof(x)<lo2||Tof(x)>hi2)ordHint();
     m.pts[k]={x:Math.max(lo2,Math.min(hi2,Tof(x))),p:Pof(Math.max(6,Math.min(H-BP-2,y)))};if(y<TP+24||y>H-BP-24)grow(m.pts[k].p);redraw(svg,pic())} // am Rand: Achse erweitern
    else if(mode==='h'){sc=clampSc(s0-dx);if(zy||IMG)panY(ev.clientY-ly);upd()}
    else if(mode==='ax'){BW=Math.max(bwMin(),Math.min(bwMax(),B0*Math.exp(dx*.006)));sc=clampSc((ta+.5)*BW/tf-px);redraw(svg,pic())} // Bild: Streifen ziehen streckt/staucht // waagerecht verschieben, hineingezoomt auch senkrecht; der Maßstab bleibt
    else if(mode==='v'){scrollBy(0,ly-ev.clientY)} // senkrecht wischen: die Seite scrollt
    ly=ev.clientY;lx=ev.clientX};
   // Loslassen ohne Bewegung = Tippen (auch dicht neben einem Punkt: dann entsteht der nächste Punkt, der alte bleibt, wo er ist)
   const up=ev=>{if(ev.pointerId!==id)return;stop();
    if(mode==='p'&&FR){SNAPR=null;if(lsn){mq.t=lsn.t;mq.p=lsn.p;mq.hl=lsn.hl}if(!frRelevel(mq.c))toast('Mehr als fünf Wellengrößen werden nicht unterstützt.');FR.err={};m.lines=[];return frRender()} // loslassen: der Punkt springt an die Stelle des Rings
    if(mode==='p')return render();
    if(ev.type==='pointerup'&&!mode&&performance.now()-T0<800){
     // doppelt ausgelöster Tipp (Touch): derselbe Fleck innerhalb von 350 ms zählt nur einmal
     const nw=performance.now();if(FR&&lastTap&&nw-lastTap.t<350&&Math.hypot(px-lastTap.x,py-lastTap.y)<12)return;lastTap={t:nw,x:px,y:py};
     if(touch)PGTAPT=nw; // der nachlaufende Click dieses Tipps darf keinen Knopf treffen (siehe PGTAPT)
     if(FR&&!FR.done&&lk>=0){const q=FR.pts[lk];FR.sel=q.id;FR.pw={c:q.c,k:Math.max(1,q.i)};return frRender(fbLast)} // Tipp direkt auf ein Label: genau dieses
     if(FR&&!FR.done&&k>=0){ // auswählen; mehrere Punkte auf demselben Pivot: erst die kleinste Welle, erneutes Tippen wechselt zur nächstgrößeren
      const cur=gs.findIndex(q=>q.id===FR.sel),q=gs[(cur+1)%gs.length];
      FR.sel=q.id;FR.pw={c:q.c,k:Math.max(1,q.i)};return frRender(fbLast)}
     if(!m.done)tap(px,IMG?Math.min(py,H-BP-1):py,touch,ev.altKey)}};
   addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);GEST=stop;stop.touch=touch;stop.pos=()=>({id,x:lx,y:ly})};
  // Zeitachse ziehen (alle Geräte): nach rechts strecken, nach links stauchen, um die Stelle, an der man ansetzt. Doppeltipp: zurücksetzen.
  let axLast=0,lastTap=null;
  const axisDrag=(e,px)=>{const id=e.pointerId,x0=e.clientX,B0=BW,s0=sc,t0=Tof(px),T0=performance.now();let moved=false;
   const mv=ev=>{if(ev.pointerId!==id)return;const dx=ev.clientX-x0;if(!moved&&Math.abs(dx)<4)return;moved=true;
    BW=Math.max(bwMin(),Math.min(bwMax(),B0*Math.exp(dx*.006)));sc=clampSc((t0+.5)*BW/tf-px);redraw(svg,pic());endBtn()};
   const end=()=>{GEST=null;removeEventListener('pointermove',mv);removeEventListener('pointerup',fin);removeEventListener('pointercancel',fin);saveV()};
   const fin=ev=>{if(ev.pointerId!==id)return;end();if(moved||ev.type!=='pointerup'||performance.now()-T0>500)return;
    const now=performance.now();if(now-axLast<400){axLast=0;resetX();saveV();upd()}else axLast=now};
   addEventListener('pointermove',mv);addEventListener('pointerup',fin);addEventListener('pointercancel',fin);GEST=end;end.touch=e.pointerType==='touch';end.pos=()=>({id,x:x0,y:e.clientY})};
  // Zwei Finger: Abstand ändert den Zoom (um die Mitte zwischen den Fingern), die Mitte verschiebt den Chart
  const pinch=(a,b)=>{const r0=svg.getBoundingClientRect(),V0={BW,sc,yr:yr.slice()},cur={[a.id]:{x:a.x,y:a.y},[b.id]:{x:b.x,y:b.y}},d0=Math.hypot(a.x-b.x,a.y-b.y)||1,mx0=(a.x+b.x)/2-r0.left,my0=(a.y+b.y)/2-r0.top;
   const mv=ev=>{if(!cur[ev.pointerId])return;ev.preventDefault();cur[ev.pointerId]={x:ev.clientX,y:ev.clientY};const A=cur[a.id],B=cur[b.id],d=Math.hypot(A.x-B.x,A.y-B.y)||1;
    BW=V0.BW;sc=V0.sc;yr=V0.yr.slice();zoomAt(d/d0,mx0,my0);sc=clampSc(sc-((A.x+B.x)/2-r0.left-mx0));panY((A.y+B.y)/2-r0.top-my0);redraw(svg,pic());endBtn()};
   const end=()=>{GEST=null;removeEventListener('pointermove',mv);removeEventListener('pointerup',fin);removeEventListener('pointercancel',fin);saveV()},fin=ev=>{if(cur[ev.pointerId])end()};
   addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',fin);addEventListener('pointercancel',fin);GEST=end;end.pinch=true};
 };
 // Fensterbreite geändert (z. B. Handy gedreht): neu zeichnen. Die Höhe bleibt, damit der Chart beim Scrollen am Handy nicht springt.
 const onRs=()=>{if(PGS.m!==m||!$('#svg.pgsvg'))return removeEventListener('resize',onRs);const w=W;size();if(W!==w&&!GEST)render(fbLast)};
 addEventListener('resize',onRs);
 const fail=()=>{m.failed=true;if(st.streak)st.streak=0,stats()};
 // Äußerster Punkt einer Welle in ihrer eigenen Richtung (Rohpreis). Gezählte Wellen: aus den Kerzen zwischen ihren Hauptpunkten.
 const extVis=w=>{const a=CNT.t[w-1],b=CNT.t[w],d=Math.sign(CNT.p[w]-CNT.p[w-1]);let e=CNT.p[w];for(let i=a;i<=b;i++)e=d>0?Math.max(e,R.h[i]):Math.min(e,R.l[i]);return e};
 // Wellengebiet prüfen (PGTER) mit Kerzen bzw. gezeichneten Punkten; gibt die verletzten Regeln zurück
 const terFails=(Q,v,mp,gs,upTo)=>{const s=Q.sign(mp);return(PGTER[Q.key]||[]).filter(([w,b,,must])=>{if(w>upTo)return false;
   let raw;const g=gs&&gs.find(x=>x.k===w);
   if(w<=CNT.cut)raw=extVis(w);else if(g){const ps=[mp[w-1]].concat(g.pts.map(q=>q.p)),d=Math.sign(mp[w]-mp[w-1]);raw=d>0?Math.max(...ps):Math.min(...ps)}else return false;
   const d=Math.sign(v[w]-v[w-1]);return !pgTerOk(d,s*(raw-mp[0]),v[b],must)}).map(x=>x[2])};
 // Passt eine Variante V des Musters zur Unterteilung der gezählten Wellen? (dreiteilige Wellen können A-B-C oder W-X-Y sein)
 const fitsK=(V,vk)=>vk.every((kd,i)=>V[i]&&V[i].some(d=>PGKOF[d]===kd||(kd==='ABC'&&PGKOF[d]==='WXY')||(kd==='WXY'&&PGKOF[d]==='ABC')));
 // Teilmuster einer Welle: Punkte ps (Start bis Ende) gegen die erlaubten Muster der Zählweise kind. ok = harte Regeln erfüllt.
 const reads=(list,kind,ps)=>list.filter(d=>PGKOF[d]===kind).map(d=>{const D=PAT[d],u=norm(D,ps),s=!(D.struct&&!D.struct(u));return{D,s,f:s?hardFails(D,u):[],w:s?warns(D,u):[]}});
 const subFail=(V,k,kind,ps)=>{ // null = passt; sonst Befund
  if(Math.sign(ps[1]-ps[0])!==Math.sign(ps[ps.length-1]-ps[0]))return{kind:'dir'}; // erste Subwelle läuft wie die Welle selbst
  const res=reads(V[k-1],kind,ps);if(res.some(x=>x.s&&!x.f.length))return null;
  const b=res.sort((a,c)=>(a.s?a.f.length:99)-(c.s?c.f.length:99))[0];return b?{kind:'sub',D:b.D,id:b.s?b.f[0]:null}:{kind:'unt'}};
 // Alternation (W4-3, nur Impuls): mögliche Muster von Welle 2 und Welle 4 nach den harten Regeln. Verstoß, wenn kein Paar verschieden ist.
 // Hinweis (Warnsignal), wenn ein verschiedenes Paar nur mit Warnsignal gelingt oder es zwei verschiedene Flat-Varianten sind.
 const altInfo=(Q,mp,gs)=>{if(Q.key!=='imp')return{};const g4=gs.find(x=>x.k===4);if(!g4||!CNT.wp[2])return{};
  const r2=reads(PGSUB.imp[0][1],CNT.vk[1],CNT.wp[2]).filter(x=>x.s&&!x.f.length),r4=reads(PGSUB.imp[0][3],g4.kind,[mp[3]].concat(g4.pts.map(q=>q.p))).filter(x=>x.s&&!x.f.length);
  if(!r2.length||!r4.length)return{};
  const pairs=[];r2.forEach(a=>r4.forEach(b=>{if(a.D!==b.D)pairs.push([a,b])}));
  if(!pairs.length)return{viol:true,t2:r2.map(x=>x.D.title).join(' oder ')};
  const clean=pairs.filter(([a,b])=>!a.w.length&&!b.w.length);
  if(!clean.length){const [a,b]=pairs[0];return{note:'Alternation: Welle 2 ist ein '+a.D.title+'. Deine Welle 4 ist nur als '+b.D.title+' ein anderes Muster, und das nur mit Warnsignal ('+mt((b.w.length?b:a).D.rules[(b.w.length?b:a).w[0]].name)+').'}}
  if(clean.every(([a,b])=>isFl(a.D.key)&&isFl(b.D.key)))return{note:'Alternation: Welle 2 und Welle 4 sind zwei verschiedene Flat-Varianten ('+clean[0][0].D.title+', '+clean[0][1].D.title+'). Das ist erlaubt, aber nicht ganz sauber.'};
  return{}};
 // Planung gegen ein Muster Q prüfen: null = regelkonform, sonst der Befund der Variante, die am weitesten kommt.
 // Reihenfolge: 1) Unterteilung je Welle erlaubt, 2) Richtung und harte Regeln der Hauptwellen inkl. Wellengebiet, 3) jede Unterteilung, 4) Alternation.
 const evalQ=(Q,gs,mp)=>{const v=norm(Q,mp);let best={st:0};
  for(const V of PGSUB[Q.key]){if(!fitsK(V,CNT.vk))continue;let r=null;
   const bad=gs.find(g=>!V[g.k-1].some(d=>PGKOF[d]===g.kind));
   if(bad)r={st:1,kind:'unt',g:bad};
   else if(Q.struct&&!Q.struct(v))r={st:2,kind:'struct'};
   else{const f=[...new Set(hardFails(Q,v).concat(terFails(Q,v,mp,gs,99)))];if(f.length)r={st:3,kind:'main',id:f[0]};
    else for(const g of gs){const x=subFail(V,g.k,g.kind,[mp[g.k-1]].concat(g.pts.map(q=>q.p)));if(x){r={st:4,...x,g};break}}}
   if(!r&&altInfo(Q,mp,gs).viol)r={st:5,kind:'alt',g:gs.find(g=>g.k===4),t2:altInfo(Q,mp,gs).t2};
   if(!r)return null;if(r.st>best.st)best=r}
  return best};
 // ---- Schwer (Neubau 11.11.2026, Lenny): frei zählen und prognostizieren. Die App gibt nichts vor und schließt nichts selbst ab.
 // Seit dem zweiten Umbau am selben Tag wählt man keine Ebene mehr: Man wählt nur die Zählweise und setzt Punkte. Jede Folge von Punkten,
 // die man hintereinander setzt, ist eine Zählung (FR.pts[].c). Welche Zählung die größere Welle ist, bestimmt frSeries aus der Lage:
 // Liegt eine Zählung ganz in einer Welle einer anderen, ist sie eine Wellengröße kleiner. Die Beschriftung folgt automatisch
 // (größte ①, mittlere (1), kleinste 1) und stellt sich um, wenn später eine größere Zählung dazukommt.
 const frSeq=z=>PAT[PGZL[z]].labels; // Labels 0..n einer Zählweise
 // Regelname eines Teilmusters mit Ebene (26.11.2026, Lenny): „Welle B überschreitet den Start von Welle A“ → „Teilwelle (b) in Welle B überschreitet
 // den Start von Teilwelle (a)“ (die erste Nennung mit der übergeordneten Welle)
 const subRule=(D,q,id,lev,wk)=>{if(id==='struct')return'die Richtungen der Teilwellen passen nicht';const fl=FLIP;FLIP=D.sign(q)<0;let first=true;
  const t=mt(D.rules[id].name).replace(/Welle[\s\u00a0]+([A-Z]|\d)\d?(?![\w])/g,(m0,l)=>{const r='Teilwelle '+pgTxt(Math.min(PGMAXL,lev+1),l)+(first?' in Welle '+wk:'');first=false;return r});FLIP=fl;return t};
 const frTxt=(lev,z,i)=>pgTxt(lev,pgLab(PGZL[z],i)),frHtml=(lev,z,i)=>!i?'Start':lev===1?C1(frTxt(lev,z,i)):frTxt(lev,z,i); // Start (0) ohne Label (seit 12.11.2026)
 const SIZE=PGSIZE; // Namen der fünf Wellengrößen
 // Zählungen mit Wellengröße. Je Zählung: own = eigene Punkte (nach Zeit), ps = Punkte ab Start 0 (fehlender Start bzw. fehlendes letztes Label
 // aus der Welle darüber ergänzt, impl), par/pk = Zählung und Welle darüber, lev = Wellengröße (1 = größte), bad = Labels folgen nicht aufeinander.
 // Seit 12.11.2026 (Lenny) feste Reihenfolge der Wellengrößen: Die Größe jeder Zählung wird beim Start festgelegt (FR.cm, siehe frMeta)
 // und nicht mehr aus der Lage erraten. frSeries sucht nur noch die übergeordnete Zählung: gewählt (par/pk) oder die Welle einer Zählung
 // genau eine Größe größer, in der die Zählung liegt.
 const frSeries=()=>{const by={};FR.pts.forEach(q=>(by[q.c]=by[q.c]||[]).push(q));
  const out=Object.keys(by).map(c=>{const pts=by[c].slice().sort((a,b)=>a.t-b.t||a.i-b.i),cm=FR.cm[c]||{lev:1};
   return{c:+c,z:pts[0].z,pts,own:pts.map(q=>({t:q.t,p:q.p,id:q.id})),par:null,pk:0,open:false,ps:null,endImpl:false,bad:null,lev:Math.max(1,Math.min(PGMAXL,cm.lev||1)),cm}});
  out.forEach(S=>{for(let j=1;j<S.pts.length;j++)if(S.pts[j].i!==S.pts[j-1].i+1){S.bad={a:S.pts[j-1],b:S.pts[j]};break}});
  const P_=S=>S.ps||S.own,i0=S=>S.ps?0:S.pts[0].i,len=S=>{const a=P_(S);return a[a.length-1].t-a[0].t};
  // Welle von S (Label-Index ihres Endes), in der C ganz liegt; 0 = keine. Beginnt C mit 0, darf C am Start der Welle beginnen, sonst danach.
  const waveOf=(C,S)=>{if(C===S)return 0;const P=P_(S),f=C.own[0].t,l=C.own[C.own.length-1].t,z0=C.pts[0].i===0;
   for(let j=1;j<P.length;j++){const a=P[j-1].t,b=P[j].t;if((z0?a<=f:a<f)&&l<=b&&(f>a||l<b||C.own.length>2))return i0(S)+j}return 0};
  // von groß nach klein: so steht die Zählung darüber (samt ergänztem Start bzw. Ende) schon fest
  [1,2,3,4,5].forEach(L=>out.filter(C=>C.lev===L).forEach(C=>{let best=null;
   const ex=C.cm.par!=null&&out.find(S=>S.c===C.cm.par&&S.lev===L-1);
   if(ex)best={S:ex,k:C.cm.pk,open:!P_(ex)[C.cm.pk-i0(ex)]};
   else if(L>1){out.forEach(S=>{if(S.lev!==L-1)return;const k=waveOf(C,S);if(!k)return;const P=P_(S),j=k-i0(S),d=P[j].t-P[j-1].t;if(!best||d<best.d)best={S,k,d}});
    if(!best&&!C.bad&&C.pts[0].i<=1){ // offene Welle: C unterteilt die nächste, noch nicht gesetzte Welle einer unfertigen Zählung eine Größe darüber
     const f=C.own[0].t;let o=null;
     out.forEach(S=>{if(S.lev!==L-1||S.bad||S.endImpl)return;const n=frSeq(S.z).length-1,li=S.pts[S.pts.length-1].i;if(li>=n)return;
      const P=P_(S),lt=P[P.length-1].t;if(C.pts[0].i?lt<f:Math.abs(lt-f)<1e-6)if(!o||lt>o.lt)o={S,lt,k:li+1}});
     if(o)best={...o,open:true}}}
   C.par=best?best.S:null;C.pk=best?best.k:0;C.open=!!(best&&best.open);
   const own=C.own,P=C.par&&P_(C.par),j=C.par&&C.pk-i0(C.par);let ps=null;
   if(C.pts[0].i===0)ps=own.slice();
   else if(C.pts[0].i===1&&C.par){const st=C.open?P[P.length-1]:P[j-1];if(st)ps=[{t:st.t,p:st.p,impl:1}].concat(own)}
   // letztes Label weggelassen: Die Zählung endet am Ende der Welle darüber
   if(ps&&C.par&&!C.open&&!C.bad&&P[j]&&C.pts[C.pts.length-1].i===frSeq(C.z).length-2&&own[own.length-1].t<P[j].t){ps=ps.concat({t:P[j].t,p:P[j].p,impl:1});C.endImpl=true}
   C.ps=ps}));
  out.forEach(C=>{C.depth=C.lev});
  // Nicht eindeutig: zwei Zählungen derselben Größe überschneiden sich, oder eine kleinere liegt nicht in einer Welle der größeren
  const sp=S=>{const a=P_(S);return[a[0].t,a[a.length-1].t]};
  out.conf=[];out.forEach((A,x)=>out.forEach((B,y)=>{if(y<=x||A.bad||B.bad)return;const[a0,a1]=sp(A),[b0,b1]=sp(B);if(Math.min(a1,b1)-Math.max(a0,b0)<=.5)return;
   if(A.lev===B.lev||(A.lev===B.lev-1&&B.par!==A&&!B.par)||(B.lev===A.lev-1&&A.par!==B&&!A.par))out.conf.push([A,B])}));
  out.i0=i0;out.P_=P_;out.waveOf=waveOf;
  return out};
 // Wellengröße einer neuen Zählung ohne gewählte Welle (erster Punkt bei Zeit t):
 // a) die erste Zählung ist die große Welle; b) beginnt sie in einer Welle einer bestehenden Zählung (auch an deren Start), ist sie
 // eine Größe kleiner; c) sonst (außerhalb aller Wellen, z. B. am Ende einer Zählung) dieselbe Größe wie die Zählung, an die sie anschließt.
 const frMeta=t=>{const all=frSeries();if(!all.length)return{lev:1,par:null,pk:0};let inn=null,near=null;
  all.forEach(S=>{const P=all.P_(S);for(let j=1;j<P.length;j++){const a=P[j-1].t,b=P[j].t;if(a-1e-6<=t&&t<b-1e-6){const d=b-a;if(!inn||d<inn.d||(d===inn.d&&S.lev>inn.S.lev))inn={S,d,k:all.i0(S)+j}}}
   const [a0,a1]=[P[0].t,P[P.length-1].t],dd=t>=a1?t-a1:a0-t;if(dd>=-1e-6&&(!near||dd<near.d))near={S,d:dd}});
  if(inn)return inn.S.lev>=PGMAXL?{lev:PGMAXL,par:null,pk:0,over:true}:{lev:inn.S.lev+1,par:inn.S.c,pk:inn.k}; // über: Größe 6 gibt es nicht
  return{lev:near?near.S.lev:1,par:null,pk:0}};
 // Wellengröße aus der Verschachtelung, Reihenfolge frei (seit 27.11.2026, Lenny). Nach jeder Änderung an Zählung c:
 // a) Läuft c über die Welle ihrer übergeordneten Zählung P hinaus (und ist nicht deren offene nächste Welle), überschneiden sich beide nur
 //    teilweise: c bekommt vorläufig dieselbe Größe wie P (Hinweis am Chart über out.conf).
 // b) Liegt eine bestehende Zählung S, die nicht kleiner als c ist, ganz in einer Welle von c, wird c größer: S rückt samt Unterteilungen unter c.
 // c) Normalisieren: die größte Zählung ist Größe 1. Mehr als fünf Größen: nichts ändern, false.
 const frDesc=(all,S)=>all.filter(x=>{let p=x.par;const seen=new Set();while(p&&!seen.has(p)){if(p===S)return true;seen.add(p);p=p.par}return false});
 const frNormLev=()=>{const v=Object.values(FR.cm);if(!v.length)return true;const mn=Math.min(...v.map(o=>o.lev));if(mn!==1)v.forEach(o=>o.lev-=mn-1);return Math.max(...v.map(o=>o.lev))<=PGMAXL};
 const frRelevel=c=>{const cm0=JSON.stringify(FR.cm);let all=frSeries(),C=all.find(S=>S.c===c);
  if(C&&!C.bad&&C.par&&!C.open&&!all.waveOf(C,C.par)&&C.own.length>1){const P=C.par,pc=FR.cm[P.c],d=P.lev-C.lev;
   [C,...frDesc(all,C)].forEach(x=>{FR.cm[x.c].lev+=d});FR.cm[c].par=pc.par!=null?pc.par:null;FR.cm[c].pk=pc.par!=null?pc.pk:0;all=frSeries();C=all.find(S=>S.c===c)}
  if(C&&!C.bad)all.forEach(S=>{if(S===C||S.bad||S.lev>C.lev||frDesc(all,S).includes(C))return;const k=all.waveOf(S,C);if(!k)return;
   const d=C.lev+1-S.lev;[S,...frDesc(all,S)].forEach(x=>{FR.cm[x.c].lev+=d});FR.cm[S.c].par=c;FR.cm[S.c].pk=k});
  if(!frNormLev()){FR.cm=JSON.parse(cm0);return false}return true};
 // Prüfen geht, sobald eine Zählung der größten Wellengröße mindestens einen Punkt in der Zukunftszone hat
 // Bild (25.11.2026, Lenny): Warum „Prüfen“ noch nicht geht, konkret (Nachzeichnen läuft, Werkzeug Auswählen, wie viele Labels fehlen)
 const ocWhy=()=>{const big=frSeries().filter(S=>S.lev===1),n=big.length?Math.max(...big.map(S=>S.pts.length)):0,need=3-n,nw=['','ein Label','zwei Labels'];
  if(IMG.trace)return'Du zeichnest gerade den Verlauf nach. Tippe auf „Nachzeichnen beenden“, dann kannst du Punkte setzen.';
  if(!FR.pts.length)return FR.md==='sel'?'Noch keine Punkte: Wähle links das Werkzeug Zeichnen (Fadenkreuz) und tippe auf den Chart, zuerst auf den Start.':'Noch keine Punkte: Tippe auf den Chart, zuerst auf den Start deiner Zählung.';
  return(n?'Setze noch '+(need===1?'mindestens ':'')+(nw[need]||need+' Labels')+' in deiner größten Zählung (Start und zwei Labels reichen zum Prüfen).':'Setze zuerst die große Zählung (Start und zwei Labels).')+(FR.md==='sel'?' Dafür links das Werkzeug Zeichnen (Fadenkreuz) wählen.':'')};
 const frReady=()=>FR.pts.length>0&&frSeries().some(S=>S.lev===1&&(IMG?S.pts.length>=3:S.pts.some(q=>q.t>c0+.5))); // Bild: eine Zählung mit mindestens drei Punkten
 // Eine Zählung gegen das Regelwerk prüfen: null = regelkonform, sonst der Befund (pid = betroffener Punkt) der Musterart, die am weitesten kommt
 const frCheck=(S,all)=>{const lab=frSeq(S.z),n=lab.length-1,nm=j=>frHtml(S.lev,S.z,j);
  if(S.bad)return{st:0,pid:S.bad.b.id,msg:'In einer Zählung folgt auf '+nm(S.bad.a.i)+' nicht '+nm(S.bad.a.i+1)+', sondern '+nm(S.bad.b.i)+'. Benenne den Punkt um, setze das fehlende Label oder beginne eine neue Zählung (Zählweise antippen).'};
  if(!S.ps){const f=S.pts[0];return{st:0,pid:f.id,msg:f.i>1?'Die Zählung beginnt mit '+nm(f.i)+', davor fehlt '+nm(f.i-1)+'. Eine Zählung beginnt mit ihrem Startpunkt oder mit '+nm(1)+'.':'Vor '+nm(1)+' fehlt der Startpunkt: Setze den Start (Label „Start“ in der Leiste), oder unterteile damit eine Welle einer größeren Zählung (Welle antippen, dann Zählweise).'}}
  const ps=S.ps,last=ps.length-1,pr=ps.map(q=>q.p),idOf=j=>ps[j].id||(ps[j+1]&&ps[j+1].id)||(ps[j-1]&&ps[j-1].id)||S.pts[0].id;
  for(let j=1;j<=last;j++){const d=Math.sign(pr[j]-pr[j-1]);if(!d||(j>1&&d===Math.sign(pr[j-1]-pr[j-2])))return{st:1,pid:idOf(j),msg:'Bei '+nm(j)+' wechselt die Richtung nicht. Hoch und Tief müssen sich abwechseln.'}}
  // Jeder sichtbare Punkt ist das Hoch bzw. Tief seiner Umgebung (je ein Fünftel der angrenzenden Wellen). Weiter weg darf eine Teilwelle
  // überschießen (z. B. B eines Expanded Flat über den Start hinaus), das ist regelkonform.
  for(let j=0;j<=last&&!IMG;j++){const q=ps[j];if(q.impl||q.t>c0)continue;/* Bild: keine Kerzendaten, nur die Punkte zählen */const a=j?Math.floor(q.t-.2*(q.t-ps[j-1].t)):q.t,b=Math.min(c0+1,j<last?Math.ceil(q.t+.2*(ps[j+1].t-q.t))+1:q.t),peak=j?q.p>pr[j-1]:(last?q.p>pr[1]:true);
   for(let t=a+(j?1:0);t<b;t++)if(t<=c0&&(peak?R.h[t]>q.p+1e-9:R.l[t]<q.p-1e-9))return{st:1,pid:q.id,msg:nm(j)+' sitzt nicht am '+(peak?'Hoch':'Tief')+' zwischen seinen Nachbarn. Setze ihn dorthin, wo die Bewegung wirklich dreht.'}}
  // Unterteilungen der Welle k: Zählungen eine Wellengröße kleiner, die in Welle k liegen und an ihrem Start beginnen
  // Seit 26.11.2026 (Lenny): nur Unterteilungen mit mindestens einer Teilwelle (nach Welle antippen + Zählweise steht zuerst nur der Start; das ist
  // keine erste Teilwelle, die Richtungsprüfung meldete trotzdem „falsche Richtung“)
  const kids=k=>all.filter(C=>C.par===S&&C.pk===k&&C.ps&&C.ps.length>=2&&ps[k-1]&&C.ps[0].t===ps[k-1].t).map(C=>({C,full:C.ps,complete:C.ps.length===frSeq(C.z).length}));
  const okKind=(V,k,z)=>V[k-1].some(d=>PGKOF[d]===z||(z==='ABC'&&PGKOF[d]==='WXY')||(z==='WXY'&&PGKOF[d]==='ABC'));
  const fam=Object.keys(PAT).filter(k=>PAT[k].labels.join()===lab.join()).map(k=>PAT[k]),Q0=PAT[PGZL[S.z]];let best=null,prim=null;
  for(const Q of fam){const v=norm(Q,pr),s=Q.sign(pr);
   for(const V of PGSUB[Q.key]){let e=null;
    const f=Object.keys(Q.rules).filter(id=>{const r=Q.rules[id],mx=pgRuleMax(r);return r.hard&&(mx<=last?!r.ok(v):!pgCanHold(r,v,last,mx))});
    if(f.length){const w=Math.min(last,Q.waves.indexOf(Q.rules[f[0]].wave)+1||last);e={st:3,pid:idOf(w),Q,id:f[0],w,S}}
    if(!e)for(const [w,b,id,must] of PGTER[Q.key]||[]){if(w>last)continue;const d=Math.sign(pr[w]-pr[w-1]);let ext;
     if(ps[w].t<=c0&&!IMG){ext=pr[w];for(let t=Math.ceil(ps[w-1].t);t<=ps[w].t;t++)ext=d>0?Math.max(ext,R.h[t]):Math.min(ext,R.l[t])}
     else{const pts=[pr[w-1],pr[w]].concat(...kids(w).map(x=>x.full.map(q=>q.p)));ext=d>0?Math.max(...pts):Math.min(...pts)}
     if(!pgTerOk(Math.sign(v[w]-v[w-1]),s*(ext-pr[0]),v[b],must)){e={st:3,pid:idOf(w),Q,id,w,S};break}}
    if(!e)for(let k=1;k<=Math.min(n,last+1)&&!e;k++)for(const x of kids(k)){const z=x.C.z,fp=x.full.map(q=>q.p),dk=k<=last?Math.sign(pr[k]-pr[k-1]):(last?-Math.sign(pr[last]-pr[last-1]):0);
     const wn2=nm(k),pid=x.C.pts[0].id,hl={S,k,sub:x.C,pids:x.C.pts.map(q=>q.id)}; // hl: Welle k von S und ihre Teilwellen im Chart hervorheben (26.11.2026)
     if(!okKind(V,k,z)){e={st:4,pid,msg:'Welle '+wn2+' kann sich nicht als '+PGK[z].t+' unterteilen.',unt:z,...hl};break}
     if(dk&&Math.sign(fp[1]-fp[0])!==dk){e={st:4,pid,msg:'Die Unterteilung von Welle '+wn2+' beginnt in die falsche Richtung: Die erste Teilwelle läuft gegen die Welle. Sie muss in dieselbe Richtung laufen wie die Welle selbst.',...hl};break}
     if(k<=last&&x.complete&&x.full[x.full.length-1].t!==ps[k].t){e={st:4,pid,msg:'Die Unterteilung von Welle '+wn2+' endet nicht am Ende dieser Welle.',...hl};break}
     // Seit 14.11.2026 (Lenny): Erreicht der letzte gesetzte Punkt einer Unterteilung das Ende der Welle darüber, muss sie vollständig sein
     // (alle Labels der Zählweise, z. B. ZZ-1/WC-1: Welle C fünfteilig). Hört sie vorher auf, bleibt sie als angefangene Zählung erlaubt.
     if(k<=last&&!x.complete){const lp=x.C.pts[x.C.pts.length-1],nC=frSeq(z).length-1,miss=[];for(let j=lp.i+1;j<=nC;j++)miss.push(frHtml(x.C.lev,z,j));
      if(lp.t>=ps[k].t-1e-6&&miss.length){e={st:4,pid:lp.id,msg:(lp.t>ps[k].t+1e-6?'Die Unterteilung von Welle '+wn2+' läuft über das Ende dieser Welle hinaus und ist noch nicht vollständig: Es '+(miss.length>1?'fehlen':'fehlt'):'Welle '+wn2+' endet hier, ihre Unterteilung braucht noch')+' Welle '+miss.join(miss.length===2?' und ':', ').replace(/, ([^,]*)$/,' und $1')+'. Eine Welle, die als '+PGK[z].t+' gezählt wird, ist erst mit dem letzten Label fertig.',...hl,pid:lp.id};break}}
     const lk=fp.length-1,cands=V[k-1].filter(d=>PGKOF[d]===z||(z==='ABC'&&PGKOF[d]==='WXY')),why=cands.map(d=>{const D=PAT[d],u=norm(D,fp),f=Object.keys(D.rules).find(id=>{const r=D.rules[id],mx=pgRuleMax(r);return r.hard&&(x.complete||mx<=lk?!r.ok(u):!pgCanHold(r,u,lk,mx))});return{t:D.title,f:f?subRule(D,fp,f,S.lev,wn2):null}}),good=why.some(q=>!q.f);
     if(!good){e={st:4,pid,msg:'Die Unterteilung von Welle '+wn2+' als '+PGK[z].t+' verletzt eine harte Regel des Teilmusters: '+why.map(q=>'als '+q.t+' nicht ('+q.f+')').join('; ')+'.',...hl};break}} // seit 26.11.2026 jedes erlaubte Muster mit Grund
    if(!e&&Q.key==='imp'){const a=kids(2).find(x=>x.complete),b=kids(4).find(x=>x.complete);
     if(a&&b){const r2=reads(V[1],a.C.z,a.full.map(q=>q.p)).filter(x=>x.s&&!x.f.length),r4=reads(V[3],b.C.z,b.full.map(q=>q.p)).filter(x=>x.s&&!x.f.length);
      if(r2.length&&r4.length&&!r2.some(p=>r4.some(q=>p.D!==q.D)))e={st:5,pid:b.C.pts[0].id,msg:'Alternation: Welle '+nm(4)+' bildet dasselbe Korrekturmuster wie Welle '+nm(2)+'. Welle 4 muss ein anderes Muster sein.'}}}
    if(!e){S.fitQ=Q;return null}if(Q===Q0&&(!prim||e.st>prim.st))prim=e;if(!best||e.st>best.st)best=e}}
  return prim||best};
 // Grenzlinien zu einem Regelbefund (Muster Q, Welle w) aus PGLINE
 const frLines=e=>{const S=e.S,ps=S.ps,pr=ps.map(q=>q.p),v=norm(e.Q,pr),s=e.Q.sign(pr),fl=FLIP;FLIP=s<0;
  const o=(PGLINE[e.Q.key]||[]).filter(z=>z.w===e.w).map(z=>{let p=null;try{p=z.j!==undefined?pr[z.j]:(z.f(v)===null?null:pr[0]+s*z.f(v))}catch(_){}
   if(p===null||isNaN(p)||!ps[z.j!==undefined?z.j:z.w-1])return null;return{t:ps[z.j!==undefined?z.j:z.w-1].t,p,txt:mt(z.t),below:Math.sign(pr[z.w]-pr[z.w-1])<0}}).filter(Boolean);
  FLIP=fl;return o};
 const frName=S=>{const a=S.pts[0],b=S.pts[S.pts.length-1];return frHtml(S.lev,S.z,a.i)+(b!==a?'–'+frHtml(S.lev,S.z,b.i):'')};
 const frErrs=all=>{const errs=[];
  // Zuordnung nicht eindeutig: freundlich darauf hinweisen, nicht raten
  all.conf.forEach(([A,B])=>errs.push({st:0,pids:[A.pts[0].id,B.pts[0].id],msg:'Die Zählungen '+frName(A)+' ('+PGK[A.z].t+') und '+frName(B)+' ('+PGK[B.z].t+') überschneiden sich'+(A.lev===B.lev?', sind aber gleich groß ('+SIZE[A.lev]+').':', aber die kleinere liegt nicht ganz in einer Welle der größeren.')+' Liegt eine Zählung ganz in einer Welle einer anderen, ist sie eine Größe kleiner. Passe die Punkte an, oder wähle die Zählung aus und stelle ihre Größe mit „Größer“ bzw. „Kleiner“ ein.'}));
  const deep=all.find(S=>S.depth>PGMAXL);if(deep)errs.push({st:0,pid:deep.pts[0].id,msg:'Mehr als fünf Wellengrößen werden nicht unterstützt. Lass die feinste Zählung weg.'});
  all.forEach(S=>{const e=frCheck(S,all);if(e)errs.push(e)});return errs};
 const frVerify=()=>{if(IMG)return imgVerify();const all=frSeries(),errs=frErrs(all);FR.err={};m.lines=[];
  if(errs.length){m.failed=true;if(st.streak)st.streak=0,stats();FR.errs=errs;errs.forEach(e=>{(e.pids||[e.pid]).forEach(id=>FR.err[id]=1);if(e.Q)m.lines.push(...frLines(e))});FR.tips=0;return frTips()}
  const lv=new Set(all.map(S=>S.lev)).size,gain=Math.min(40,4+FR.pts.length+3*(lv-1))-(m.failed?3:0);
  m.done=FR.done=true;if(!m.failed)st.streak++;st.pts+=gain;stats();exSolved(key,FR.tips||0);pathMark('progn');
  frRender('<p class="ok">Regelkonform! +'+gain+' Punkte</p><p>Deine Zählung: '+FR.pts.length+' Punkte in '+(lv>1?lv+' Wellengrößen':'einer Wellengröße')+'. Mehr korrekt gezählte Wellen und feinere Unterteilungen geben mehr Punkte. Generiert wurde übrigens: <b>'+P.title+'</b>.</p>')};
 // ---- Eigenen Chart prüfen (20.11.2026, Lenny): alle Befunde auf einmal, ohne Tipps, Punkte, Serie oder Ränge. Harte Regeln = Fehler
 // (rot markiert, Grenzlinien), Warnsignale und Faustregeln = Hinweise. Formulierung: regelkonform bzw. verstößt gegen, nie „richtige Zählung“.
 const plainName=S=>PGK[S.z].t+' ('+SIZE[S.lev]+')';
 const imgFaust=(Q,v,last)=>{const o=[],fr=(ok,txt)=>{if(!ok)o.push(txt)};
  if(Q.key==='imp'){if(last>=3){const r=L(v,3)/L(v,1);fr(r>=1.618-.02&&r<=2.618+.02,'Welle 3 erreicht '+pct(r)+' von Welle 1. Am häufigsten sind 161,8 % bis 261,8 %.')}
   if(last>=4){const r=L(v,4)/L(v,3);fr(Math.abs(r-.382)<=.02||Math.abs(r-.5)<=.02,'Welle 4 läuft '+pct(r)+' von Welle 3 zurück. Am häufigsten sind 38,2 % oder 50 %.')}
   if(last>=5){const r=L(v,5)/Math.abs(v[3]-v[0]);fr(r>=.618-.02&&r<=2.618+.02,'Welle 5 erreicht '+pct(r)+' (gemessen über Start von Welle 1 bis Ende von Welle 3). Am häufigsten sind 61,8 % bis 261,8 %.')}}
  if(Q.key==='zig'&&last>=3){const r=L(v,3)/L(v,1);fr(r>=.618-.02&&r<=1.618+.02,'Welle C erreicht '+pct(r)+' von Welle A. Üblich sind 61,8 % bis 161,8 %, am häufigsten 100 %.')}
  return o};
 // Grenzlinien des passenden Musters für eine regelkonforme große Zählung: alle Wellen bis zur nächsten, noch nicht gezählten
 const imgLines=(S,Q)=>{const ps=S.ps,pr=ps.map(q=>q.p),last=pr.length-1,v=norm(Q,pr),s=Q.sign(pr),fl=FLIP;FLIP=s<0;
  const dn=w=>w<=last?Math.sign(pr[w]-pr[w-1])<0:last>0&&Math.sign(pr[last]-pr[last-1])>0;
  const o=(PGLINE[Q.key]||[]).filter(z=>z.w<=last+1&&z.w<=Q.waves.length).map(z=>{const j=z.j!==undefined?z.j:z.w-1;if(!ps[j])return null;let p=null;
   try{p=z.j!==undefined?pr[z.j]:(z.f(v)===null?null:pr[0]+s*z.f(v))}catch(_){}if(p===null||isNaN(p))return null;return{t:ps[j].t,p,txt:mt(z.t),below:dn(z.w)}}).filter(Boolean);
  FLIP=fl;return o};
 const imgVerify=()=>{const all=frSeries(),errs=frErrs(all);FR.err={};m.lines=[];m.ew=[];
  const fam=S=>Object.keys(PAT).filter(k=>PAT[k].labels.join()===frSeq(S.z).join()).length;
  const eH=[],eT=[];errs.forEach(e=>{(e.pids||[e.pid]).forEach(id=>FR.err[id]=1);
   // Befund zu einer selbst gezählten Unterteilung (26.11.2026): die Welle rot hinterlegen, ihre Teilwellen-Punkte sind über pids markiert
   if(e.sub&&e.S&&e.S.ps&&e.S.ps[e.k-1]){const a=e.S.ps[e.k-1].t,b=e.S.ps[e.k]?e.S.ps[e.k].t:e.sub.ps[e.sub.ps.length-1].t;m.ew.push({t0:a,t1:Math.max(b,e.sub.ps[e.sub.ps.length-1].t)})}
   if(e.Q){m.lines.push(...frLines(e));const r=e.Q.rules[e.id],fl=FLIP;FLIP=e.Q.sign(e.S.ps.map(q=>q.p))<0;
    eH.push('<p class="rnote">'+stufe('regel')+'<b>'+frName(e.S)+'</b> verstößt als '+e.Q.title+' gegen „'+mt(r.name)+'“. '+mt(r.ex)+' <span class="mut">('+tag(e.Q,e.id)+(fam(e.S)>1?'; auch als anderes Muster mit dieser Beschriftung nicht regelkonform':'')+')</span></p>');
    eT.push(plainName(e.S)+': verstößt gegen „'+mt(r.name)+'“');FLIP=fl}
   else{eH.push('<p class="rnote">'+stufe('regel')+e.msg+'</p>');eT.push(e.msg.replace(/<[^>]*>/g,'').replace(/\s+/g,' '))}});
  const okS=all.filter(S=>S.fitQ&&S.ps&&!errs.some(e=>e.S===S||(e.pids||[e.pid]).some(id=>S.pts.some(q=>q.id===id))));
  // Hinweise sortiert (23.11.2026): Unterteilung zuerst, dann andere Warnsignale, dann Faustregeln (harte Fehler stehen davor, eH)
  const subN=[],warnN=[],faustN=[],oT=[],sub=[],subW=[];m.zz=[];m.zzw=[];IMG.trace=false;IMG.subJ=0;
  okS.forEach(S=>{const Q=S.fitQ,pr=S.ps.map(q=>q.p),last=pr.length-1,v=norm(Q,pr),fl=FLIP;FLIP=Q.sign(pr)<0;
   oT.push(plainName(S)+': keine harte Regel verletzt ('+Q.title+')');
   Object.keys(Q.rules).forEach(id=>{const r=Q.rules[id];if(r.hard||pgRuleMax(r)>last)return;let bad=false;try{bad=!r.ok(v)}catch(_){}
    if(bad){const f=r.lvl==='o';(f?faustN:warnN).push('<p class="rnote '+(f?'f':'w')+'">'+stufe(f?'faust':'warn')+'<b>'+frName(S)+'</b>: '+mt(r.ex)+' <span class="mut">('+tag(Q,id)+')</span></p>')}});
   imgFaust(Q,v,last).forEach(t=>faustN.push('<p class="rnote f">'+stufe('faust')+'<b>'+frName(S)+'</b>: '+t+'</p>'));
   FLIP=fl;if(S.lev===1)m.lines.push(...imgLines(S,Q));
   ocSub(S,all).forEach(x=>{const i=m.zz.length;subN.push('<p class="rnote w ocsubn" data-zz="'+i+'" role="button" tabindex="0" title="Welle im Chart zeigen">'+stufe('warn')+x.txt+' <span class="mut">(Automatisch erkannt, kein Regelverstoß. Gestrichelt: die gefundenen Wendepunkte. Antippen zeigt die Welle im Chart.)</span></p>');
    sub.push({c:S.c,k:x.k,need:x.need,n:x.n,kind:x.kind,rule:x.rule,txt:x.txt.replace(/<[^>]*>/g,'')});subW.push({h:frHtml(S.lev,S.z,x.k),p:frTxt(S.lev,S.z,x.k)});m.zz.push(x.pts);m.zzw.push({t0:x.t0,t1:x.t1})})});
  const notes=subN.concat(warnN,faustN),wl=a=>a.length>1?a.slice(0,-1).join(', ')+' und '+a[a.length-1]:a[0];
  // Überschrift: harter Verstoß rot (Vorrang), sonst bei Warnsignalen zur Unterteilung orange „Prüfe die Subwellen“, nur ohne sie grün
  const ok=!errs.length,state=!ok?'bad':sub.length?'warn':'ok',subS='Die Hauptwellen sind regelkonform, aber in Welle ';
  IMG.res={ok,state,head:state==='bad'?'Deine Zählung verstößt gegen das Regelwerk.':state==='warn'?'Prüfe die Subwellen.':'Deine Zählung ist regelkonform.',
   lines:(state==='warn'?[subS+wl([...new Set(subW.map(x=>x.p))])+' passt die innere Struktur nicht sicher.']:[]).concat(ok?oT:eT,notes.length?['Hinweise: '+notes.length+' (Warnsignale und Faustregeln)']:[])};
  PGS.res={ok,state,errs:errs.map(e=>e.id||'msg'),notes:notes.length,lines:m.lines.length,sub,subJ:IMG.subJ};
  FR.done=true;FR.sel=null;FR.pw=null;pathMark('own');
  frRender((ok?(state==='warn'?'<p class="ocwarn">'+ICON.warn+'<span>Prüfe die Subwellen</span></p><p>'+subS+wl([...new Set(subW.map(x=>x.h))])+' passt die innere Struktur nicht sicher.</p>':'<p class="ok">Deine Zählung ist regelkonform.</p>')+okS.map(S=>'<p><b>'+frName(S)+'</b> ('+PGK[S.z].t+', '+SIZE[S.lev]+') verletzt keine harte Regel des Musters „'+S.fitQ.title+'“'+(fam(S)>1?' (oder eines anderen Musters mit dieser Beschriftung)':'')+'.</p>').join('')
    :'<p class="bad">Deine Zählung verstößt gegen das Regelwerk.</p>'+eH.join('')+(okS.length?'<p class="mut">Regelkonform: '+okS.map(S=>frName(S)+' ('+S.fitQ.title+')').join(', ')+'.</p>':''))+
   (notes.length?'<p><b>Hinweise</b> <span class="mut">(kein Fehler)</span></p>'+notes.join(''):ok?'<p class="mut">Keine Warnsignale, und die geprüften Wellen liegen in den Faustregel-Bereichen.</p>':'')+
   (m.lines.length?'<p class="mut">Gestrichelte Linien: Grenzen aus den harten Regeln. Läuft der Kurs darüber hinaus, gilt die Zählung nicht mehr.</p>':'')+OCNOTE)};
 // Ergebnis als Bild (PNG): Bild in voller Ansicht, darüber Labels, Punkte und Linien (SVG mit eingesetzten Stilen), unten kurzes Fazit und „Wave Checker“
 const ocPng=()=>new Promise((res,rej)=>{const sv={BW,sc,yr:yr.slice(),SNAPR};SNAPR=null;startView(1);EXP=true;const str=pic();EXP=false;
  const tmp=document.createElement('div');tmp.style.cssText='position:absolute;left:-99999px;top:0;visibility:hidden';tmp.innerHTML=str;$('#pgc').appendChild(tmp);
  const sv0=tmp.firstChild,PR=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linejoin','stroke-linecap','opacity','font-family','font-size','font-weight','text-anchor','paint-order'];
  sv0.querySelectorAll('*').forEach(el=>{const cs=getComputedStyle(el);el.setAttribute('style',PR.map(p=>p+':'+cs.getPropertyValue(p)).join(';'))});
  sv0.setAttribute('xmlns','http://www.w3.org/2000/svg');sv0.removeAttribute('class');sv0.removeAttribute('id');
  const xml=new XMLSerializer().serializeToString(sv0);tmp.remove();
  const x0=X(-.5),y0=Y(IMG.h),iw=IMG.w*BW,ih=Y(0)-y0;BW=sv.BW;sc=sv.sc;yr=sv.yr;SNAPR=sv.SNAPR;
  // Ausschnitt: nur das Bild mit etwas Rand für Labels (ohne den Streifen mit Werkzeugen und Zoom)
  const css=getComputedStyle(document.documentElement),col=n=>css.getPropertyValue(n).trim(),k=Math.max(2,Math.min(3,IMG.w/iw)),T0=Math.max(0,Math.floor(y0-44)),PH=Math.min(H-BP,Math.ceil(y0+ih+8))-T0;
  const cv=document.createElement('canvas'),g=cv.getContext('2d'),F='"DM Sans",system-ui,sans-serif';
  // Fazit umbrechen (Breite W − 32)
  const wrap=(t,f)=>{g.font=f;const out=[];let ln='';t.split(' ').forEach(wd=>{const s=ln?ln+' '+wd:wd;if(g.measureText(s).width>W-32&&ln){out.push(ln);ln=wd}else ln=s});if(ln)out.push(ln);return out};
  const r=IMG.res||{ok:true,head:'',lines:[]},rst=r.state||(r.ok?'ok':'bad'),head=wrap((rst==='ok'?'✓ ':rst==='warn'?'! ':'✗ ')+r.head,'700 16px '+F),body=[].concat(...r.lines.slice(0,4).map(t=>wrap(t,'14px '+F))).slice(0,6),
   disc=wrap('Prüfung nach dem Regelwerk, keine Kursprognose oder Anlageempfehlung.','11px '+F),FH=18+head.length*21+6+body.length*19+14+disc.length*15+24;
  cv.width=Math.round(W*k);cv.height=Math.round((PH+FH)*k);g.scale(k,k);g.fillStyle=col('--surface');g.fillRect(0,0,W,PH+FH);
  g.save();g.beginPath();g.rect(0,0,W,PH);g.clip();g.translate(0,-T0);g.drawImage(IMG.cv,x0,y0,iw,ih);g.globalAlpha=IMG.fade;g.fillStyle='#FFFFFF';g.fillRect(x0,y0,iw,ih);g.restore();if(IMG.fade>=1){g.fillStyle='#FFFFFF';g.fillRect(0,0,W,PH)}
  const im=new Image();im.onload=()=>{g.save();g.beginPath();g.rect(0,0,W,PH);g.clip();g.translate(0,-T0);g.drawImage(im,0,0,W,H);g.restore();g.fillStyle=col('--line');g.fillRect(0,PH,W,1);
   let y=PH+18;g.textBaseline='alphabetic';g.font='700 16px '+F;g.fillStyle=rst==='ok'?col('--ok'):rst==='warn'?col('--warn-text'):col('--bad');head.forEach(t=>{y+=21;g.fillText(t,16,y)});y+=6;
   g.font='14px '+F;g.fillStyle=col('--text');body.forEach(t=>{y+=19;g.fillText(t,16,y)});y+=14;
   g.font='11px '+F;g.fillStyle=col('--muted');disc.forEach(t=>{y+=15;g.fillText(t,16,y)});
   g.font='700 12px '+F;g.fillStyle=col('--accent-text');g.textAlign='right';g.fillText('Wave Checker',W-16,PH+FH-9);
   cv.toBlob(b=>b?res(b):rej(new Error('png')),'image/png')};
  im.onerror=()=>rej(new Error('svg'));im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml)});
 const ocFile=b=>new File([b],'wave-checker-zaehlung.png',{type:'image/png'});
 const ocCanShare=()=>{try{return!!(navigator.canShare&&navigator.share&&matchMedia('(pointer:coarse)').matches&&navigator.canShare({files:[ocFile(new Blob(['x'],{type:'image/png'}))]}))}catch(_){return false}};
 const ocSave=async()=>{try{const b=await ocPng(),u=URL.createObjectURL(b),a=document.createElement('a');PGS.lastPng=b;a.href=u;a.download='wave-checker-zaehlung.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}catch(e){toast('Das Bild ließ sich nicht erzeugen.')}};
 const ocShare=async()=>{try{const b=await ocPng();PGS.lastPng=b;await navigator.share({files:[ocFile(b)],title:'Wave Checker'})}catch(e){if(e&&e.name==='AbortError')return;ocSave()}};
 // Befunde mit gestuften Tipps (Regelbefunde: Hinweis, Regelname, Quelle)
 const frTips=()=>{const e=FR.errs[0],more=FR.errs.length-1,lines=[e.msg||('Diese Zählung verletzt eine Regel'+(e.Q?' des Musters „'+e.Q.title+'“':'')+'.')];
  if(e.Q){const rl=e.Q.rules[e.id];if(FR.tips>=1)lines.push('Tipp 1: '+mt(rl.hint));if(FR.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „'+mt(rl.name)+'“.');if(FR.tips>=3)lines.push('Tipp 3: '+tag(e.Q,e.id)+'. '+mt(rl.ex))}
  else if(FR.tips>=1)lines.push('Tipp: Der rot markierte Punkt gehört zu der Stelle, die nicht passt. Ändere ihn, benenne ihn um oder lösche ihn.');
  frRender('<p class="bad">Noch nicht ganz.</p>'+lines.map(tipLine).join('')+(more?'<p class="mut">Dazu '+more+(more>1?' weitere Stellen':' weitere Stelle')+', ebenfalls rot markiert.</p>':'')+((e.Q?FR.tips<3:FR.tips<1)?'<button id="ftip">Tipp anzeigen</button>':''));
  const b=$('#ftip');if(b)b.onclick=()=>{FR.tips++;frTips()}};
 // Punkt setzen. c: Zahl = an diese Zählung anhängen, 'neu' = neue Zählung, sonst automatisch: Der Punkt setzt die laufende Zählung fort,
 // wenn er deren nächstes Label trägt und rechts von ihr liegt; sonst beginnt er eine neue (Wellengröße nach frMeta). Nach dem letzten Label endet die Zählung.
 // Seit 13.11.2026 (Lenny): Eine laufende Zählung vergibt die Labels strikt in ihrer Reihenfolge und nur vorwärts. Liegt der Punkt nicht
 // rechts vom letzten Punkt der Zählung, wird nichts gesetzt (vorher begann still eine neue Zählung, daher sprangen die Labels).
 const frLast=()=>{if(FR.ac===null)return null;const a=FR.pts.filter(q=>q.c===FR.ac);return a.length?a.reduce((x,y)=>y.i>x.i?y:x):null};
 const frAdd=(z,i,t,p,c,hl)=>{if(typeof c!=='number'){
   // Seit 14.11.2026 (Lenny): Das Label einer laufenden Zählung ist immer genau das nächste (lst.i+1), unabhängig von FR.i. Vorher galt
   // max(FR.i, lst.i+1): Stand die Leiste weiter vorn (Knopf der Label-Leiste, auch durch einen nachlaufenden Click nach einem Tipp, wenn
   // die Seite beim Neuaufbau verrutscht), wurden Labels übersprungen und die Zählung galt als fertig. Eine neue Zählung beginnt mit Start oder 1.
   if(c!=='neu'&&FR.ac!==null){const lst=frLast();if(lst){if(!(t>lst.t+1e-6)){toast('Punkte bitte von links nach rechts setzen.');return null}z=lst.z;i=lst.i+1}else i=Math.min(i,1);c=FR.ac}
   else{c=++FR.cn;i=Math.min(i,1)}}
  if(!FR.cm[c]){const mt=frMeta(t);if(mt.over){toast('Mehr als fünf Wellengrößen werden nicht unterstützt.');if(FR.ac===c){FR.ac=null;FR.i=0}return null}FR.cm[c]=mt}
  const cmB=JSON.stringify(FR.cm);FR.pts.push({id:++FR.n,c,z,i,t,p,hl,cm0:cmB}); // hl: beim Einrasten gemerkt, ob der Punkt ein Hoch oder Tief ist (Richtung des nächsten Labels); cm0: Größen davor (Zurück)
  if(!frRelevel(c)){FR.pts.pop();FR.cm=JSON.parse(cmB);if(!FR.pts.some(x=>x.c===c))delete FR.cm[c];toast('Mehr als fünf Wellengrößen werden nicht unterstützt.');return null}
  if(i>=frSeq(z).length-1){FR.ac=null;FR.i=0}else{FR.ac=c;FR.i=i+1}FR.z=z;
  FR.sel=null;FR.pw=null;FR.err={};m.lines=[];return c};
 // Unterteilung der gewählten Welle FR.pw beginnen: eine Größe kleiner, Start (0) automatisch am Start dieser Welle
 const frStartSub=z=>{const all=frSeries(),S=all.find(x=>x.c===FR.pw.c),k=FR.pw.k;FR.pw=null;FR.sel=null;if(!S)return;
  if(S.lev>=PGMAXL){FR.z=z;return toast('Mehr als fünf Wellengrößen werden nicht unterstützt.')}
  const P=all.P_(S),st=P[k-1-all.i0(S)],c=++FR.cn;FR.cm[c]={lev:S.lev+1,par:S.c,pk:k};FR.z=z;
  if(st){FR.pts.push({id:++FR.n,c,z,i:0,t:st.t,p:st.p,hl:(FR.pts.find(x=>x.id===st.id)||{}).hl});FR.ac=c;FR.i=1}else{FR.ac=c;FR.i=0}FR.err={};m.lines=[]};
 // Laufende Zählung beenden (sie bleibt unfertig stehen); danach lassen sich Punkte wieder auswählen
 const frEnd=()=>{FR.ac=null;FR.i=0;FR.pw=null};
 // Tippen auf freie Fläche: das markierte Label setzen (im sichtbaren Teil am nächsten Hoch oder Tief, in der Zukunftszone frei)
 const frTap=(px,py,touch,alt)=>{if(FR.done)return;const t=Tof(px);let q;
  if(FR.md==='sel'){if(FR.sel||FR.pw){FR.sel=null;FR.pw=null;frRender(fbLast)}return} // Auswählen: Tipp ins Leere hebt nur die Auswahl auf
  const lst=frLast();if(lst&&t<=lst.t)return toast('Punkte bitte von links nach rechts setzen.');
  // Einrasten (snapPt): bestehender Punkt, sonst Wendehoch/-tief in der erwarteten Richtung, sonst die Kerze unter dem Finger; Zukunftszone frei
  if(IMG&&(px<X(-.5)-(touch?40:15)||px>X(c0+.5)+(touch?40:15)))return toast('Setze den Punkt auf das Bild.'); // knapp neben dem Bildrand rastet er noch am Rand ein
  if(!IMG&&t>ZE)return toast('Setze den Punkt in den Chart oder in die graue Zone.');
  q=snapPt(px,py,{touch,alt,tmin:lst?lst.t:undefined,want:FR.ac!==null?wantOf(FR.ac):null});if(!q||(lst&&q.t<=lst.t))return toast('Punkte bitte von links nach rechts setzen.');
  if(touch&&q.kind!=='free')buzz();
  if(py<TP+24||py>H-BP-24)grow(q.p);frAdd(FR.z,FR.i,q.t,q.p,undefined,q.hl);frRender()};
 // Löschen (seit 12.11.2026): immer die ganze Zählung des ausgewählten Punkts. Ihre Unterteilungen bleiben stehen und rücken eine Größe auf.
 // Danach kurz „Zählung gelöscht · Rückgängig“.
 const frDel=()=>{const q=FR.pts.find(x=>x.id===FR.sel);if(!q||FR.done)return;const all=frSeries(),gone=FR.pts.filter(x=>x.c===q.c),st0={ac:FR.ac,z:FR.z,i:FR.i},cm0=JSON.parse(JSON.stringify(FR.cm));
  const anc=(S,c)=>{let x=S.par;const seen=new Set();while(x&&!seen.has(x)){if(x.c===c)return true;seen.add(x);x=x.par}return false};
  const desc=all.filter(S=>anc(S,q.c)),pm=FR.cm[q.c]||{};
  desc.forEach(S=>{const o=FR.cm[S.c]=FR.cm[S.c]||{lev:S.lev,par:null,pk:0};o.lev=Math.max(1,S.lev-1);if(S.par&&S.par.c===q.c){o.par=pm.par!=null?pm.par:null;o.pk=pm.par!=null?pm.pk:0}});
  delete FR.cm[q.c];frNormLev();FR.pts=FR.pts.filter(x=>x.c!==q.c);if(FR.ac===q.c){FR.ac=null;FR.i=0}FR.sel=null;FR.pw=null;FR.err={};m.lines=[];frRender();
  toast('Zählung gelöscht ('+gone.length+(gone.length>1?' Punkte':' Punkt')+')'+(desc.length?', Unterteilungen eine Größe größer':'')+' · <button id="fundel" class="tbtn">Rückgängig</button>');
  const b=$('#fundel');if(b)b.onclick=e=>{e.stopPropagation();if(PGS.m!==m||FR.done)return;const ids=new Set(FR.pts.map(x=>x.id));gone.forEach(x=>{if(!ids.has(x.id))FR.pts.push(x)});
   FR.cm=cm0;FR.ac=st0.ac;FR.z=st0.z;FR.i=st0.i;FR.sel=null;FR.err={};m.lines=[];$('#toast').className='';frRender()}};
 // Tasten (PC): Entf/Rücktaste löschen die ausgewählte Zählung (Auswählen), V = Auswählen, C = Zeichnen,
 // Esc = laufende Zählung beenden und zu Auswählen wechseln (sonst Auswahl aufheben)
 const onKey=e=>{if(PGS.m!==m)return removeEventListener('keydown',onKey);if(!FR||FR.done||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))return;
  if((e.key==='Delete'||e.key==='Backspace')&&FR.sel&&FR.md==='sel'){e.preventDefault();frDel();return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
  if(k==='v'&&FR.md!=='sel'){frMode('sel')}else if(k==='c'&&FR.md!=='draw'){frMode('draw')}
  else if(e.key==='Escape'){if(FR.ac!==null){frEnd();FR.md='sel';frRender(fbLast)}else if(FR.sel||FR.pw){FR.sel=null;FR.pw=null;frRender(fbLast)}else if(FR.md!=='sel')frMode('sel')}};
 // Werkzeug wechseln. Zeichnen hebt eine Auswahl auf (sonst bliebe unklar, was der nächste Tipp tut).
 const frMode=md=>{FR.md=md;if(md==='draw'){FR.sel=null;FR.pw=null}frRender(fbLast)};
 addEventListener('keydown',onKey);
 // Leiste: Zählweise (antippen = neue Zählung beginnen bzw. die ausgewählte Welle unterteilen) und nächstes Label.
 // Während eine Zählung läuft: kleiner Knopf „Zählung beenden“.
 const frBar=()=>{{const l=frLast();if(l)FR.i=l.i+1;else if(FR.i>1)FR.i=FR.ac!==null?1:0} // die Leiste zeigt immer genau das nächste Label
  const all=frSeries(),S=FR.ac!==null&&all.find(x=>x.c===FR.ac),lv=S?S.lev:(FR.ac!==null&&FR.cm[FR.ac]?FR.cm[FR.ac].lev:0),cont=S&&S.z===FR.z&&S.pts[S.pts.length-1].i===FR.i-1,
   pw=FR.pw&&all.find(x=>x.c===FR.pw.c),lb=i=>!i?'Start':lv?frHtml(lv,FR.z,i):pgLab(PGZL[FR.z],i);
  const stx=pw?'Zählweise antippen: unterteilt Welle '+frHtml(pw.lev,pw.z,FR.pw.k)+(pw.lev<PGMAXL?' ('+SIZE[pw.lev+1]+')':''):cont?'setzt die Zählung '+frName(S)+' fort ('+SIZE[lv]+')':FR.ac!==null&&lv?'neue Unterteilung ('+SIZE[lv]+')':'beginnt eine neue Zählung';
  return'<div class="pgbar"><div class="pgk" role="group" aria-label="Zählweise (antippen beginnt eine neue Zählung)">'+Object.keys(PGK).map(z=>'<button data-fz="'+z+'" class="'+(FR.z===z&&!pw?'on':'')+'" aria-pressed="'+(FR.z===z)+'">'+PGK[z].t+'</button>').join('')+'</div>'+
  '<div class="pgk pgnx" role="group" aria-label="Nächstes Label"><span class="mut">Nächstes Label:</span>'+frSeq(FR.z).map((_,i)=>'<button data-fi="'+i+'" class="'+(FR.i===i?'on':'')+'" aria-pressed="'+(FR.i===i)+'"'+((frLast()?i!==FR.i:i>1)?' disabled':'')+'>'+lb(i)+'</button>').join('')+
  '<span class="mut pgst">'+stx+'</span>'+(FR.ac!==null?' <button id="fend" class="pgendc" title="Esc">Zählung beenden</button>':'')+'</div></div>'};
 // Ausgewählte Welle (oder die Welle über der laufenden Unterteilung): Zeitbereich für die Hervorhebung im Chart
 const frBand=()=>{if(!FR||FR.done)return null;const all=frSeries();let S,k;
  if(FR.pw){S=all.find(x=>x.c===FR.pw.c);k=FR.pw.k}else if(FR.ac!==null){const C=all.find(x=>x.c===FR.ac),cm=FR.cm[FR.ac];if(C&&C.par){S=C.par;k=C.pk}else if(cm&&cm.par!=null){S=all.find(x=>x.c===cm.par);k=cm.pk}}
  if(!S)return null;const P=all.P_(S),j=k-all.i0(S),a=P[j-1];if(!a)return null;return[a.t,P[j]?P[j].t:ZE]};
 // Größe von Hand (seit 27.11.2026): Größer/Kleiner verschiebt die Zählung samt Unterteilungen um eine Stufe, nur innerhalb 1–5.
 // Kleiner geht nicht, wenn sie die einzige größte Zählung ist (die größte ist immer Größe 1).
 // Hinweis am Chart (27.11.2026): Zählungen überschneiden sich nur teilweise, die Größe ist unklar (keine Vermutung)
 const frConfNote=()=>{if(FR.done)return'';const all=frSeries();if(!all.conf.length)return'';const[A,B]=all.conf[0];
  return'<p class="ocq pgconf" role="note">'+ICON.warn+'<span>Die Zählungen '+frName(A)+' und '+frName(B)+' überschneiden sich nur teilweise, ihre Wellengröße ist unklar. Sie haben vorläufig dieselbe Größe. Verschiebe Punkte so, dass eine Zählung ganz in einer Welle der anderen liegt, oder stelle die Größe unter Auswählen mit „Größer“ bzw. „Kleiner“ ein.</span></p>'};
 const frSizeUI=S=>{if(!S)return'';const all=frSeries(),T=all.find(x=>x.c===S.c)||S,mx=Math.max(T.lev,...frDesc(all,T).map(x=>x.lev)),solo=T.lev===1&&all.filter(x=>x.lev===1).length===1;
  return'<button id="fbig"'+(T.lev<=1?' disabled':'')+' title="Wellengröße eine Stufe größer">Größer</button><button id="fsmall"'+(mx>=PGMAXL||solo?' disabled':'')+' title="Wellengröße eine Stufe kleiner">Kleiner</button>'}; // in der Zeile mit Löschen: die Karte wird nicht höher (sonst verrutscht die Seite beim Tippen)
 const frSelUI=()=>{const q=FR.pts.find(x=>x.id===FR.sel);if(!q)return'';const S=frSeries().find(x=>x.c===q.c),lv=S?S.lev:1,n=frSeq(q.z).length-1,top=S?S.pts[S.pts.length-1].i:q.i,k=FR.pw?FR.pw.k:Math.max(1,q.i);
  return'<div class="card pgsel"><p><b>Punkt '+(q.i?frHtml(lv,q.z,q.i):'Start')+'</b> <span class="mut">('+SIZE[lv]+', '+PGK[q.z].t+')</span></p>'+
   (lv>=PGMAXL?'<p class="mut">Mehr als fünf Wellengrößen werden nicht unterstützt: Diese Welle lässt sich nicht weiter unterteilen.</p>':'')+(lv<PGMAXL?'<p>Welle '+frHtml(lv,q.z,k)+' ist hervorgehoben. <b>Zählweise oben antippen</b>, um sie zu unterteilen ('+SIZE[lv+1]+'): Der Start wird automatisch an den Start dieser Welle gesetzt.'+
    (top<n&&q.i===top&&k===top?' <button id="fopen">Stattdessen die nächste Welle '+frHtml(lv,q.z,top+1)+' unterteilen</button>':'')+'</p>':'')+
   (top<n?'<p><button id="fcont">Diese Zählung ab '+frHtml(lv,q.z,top+1)+' fortsetzen</button></p>':'')+
   '<p><span class="mut">Umbenennen:</span> '+frSeq(q.z).map((_,i)=>'<button data-fren="'+i+'" class="'+(q.i===i?'on':'')+'">'+(i?frHtml(lv,q.z,i):'Start')+'</button>').join('')+'</p>'+
   '<p>'+frSizeUI(S)+'<button id="fdel">Ganze Zählung löschen</button><button id="fsx">Schließen</button></p></div>'};
 // Werkzeugleiste (DESIGN.md, Werkzeugleiste): Strich-Icons, aktives Werkzeug blau
 const MHKEY='waveChecker.pgTools',mhSeen=()=>{try{return!!localStorage.getItem(MHKEY)}catch(_){return true}};
 const toolBar=()=>FR.done?'':'<div class="pgtool" role="group" aria-label="Werkzeug">'+[['draw','Zeichnen (C)','<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>'],['sel','Auswählen (V)','<path d="M6 3l12 9-5.5 1.2L15.5 20l-2.6 1.1-2.6-6.6L6 18z"/>']]
  .map(([md,t,ic])=>'<button data-md="'+md+'" class="'+(FR.md===md?'on':'')+'" aria-pressed="'+(FR.md===md)+'" title="'+t+'" aria-label="'+t+'"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ic+'</svg></button>').join('')+'</div>';
 const frRender=fb=>keepView(m,()=>frRender0(fb)),frRender0=fb=>{fbLast=fb;const ready=frReady();
  $('#view').innerHTML='<p class="kick">'+(IMG?'Eigenen Chart prüfen':'Wie geht es weiter? · Schwer')+'</p><p class="task">'+(FR.done?(IMG?'Geprüft. Du kannst die Zählung weiter ändern oder das Ergebnis als Bild speichern.':'Geprüft.'):IMG&&IMG.trace?'<b>Verlauf nachzeichnen.</b> Fahre mit dem Finger oder der Maus den Kursverlauf entlang: Was du zeichnest, ersetzt dort den erkannten Verlauf, zum Nachbessern fährst du einfach noch einmal über die Stelle. Zwei Finger zoomen.':IMG&&!FR.pts.length?'<b>Zähle deinen Chart.</b> Die blaue Linie zeigt den erkannten Kursverlauf, darauf rasten die Punkte ein. Passt sie nicht, zeichne den Verlauf nach. Wähle eine Zählweise und tippe auf den Chart: Das markierte Label wird gesetzt, der Punkt rastet am Docht-Hoch bzw. -Tief in der Nähe ein'+(mob?'':' (mit gedrückter Alt-Taste frei)')+'. Die Wellengröße ergibt sich aus der Verschachtelung, in beliebiger Reihenfolge: Liegt eine Zählung in einer Welle einer anderen, ist sie eine Größe kleiner. Du kannst also auch erst die Teilwellen und dann die Welle darüber zählen.':FR.md==='sel'?'<b>Auswählen.</b> Tippe einen Punkt an: Seine Zählung wird hervorgehoben, du kannst ihn verschieben, umbenennen oder die Zählung löschen. Für eine Unterteilung wähle die übergeordnete Welle (ihren Endpunkt) und dann die Zählweise.':FR.ac!==null?'<b>Zeichnen, Zählung läuft.</b> Jeder Tipp setzt das nächste Label (im sichtbaren Teil am nächsten Hoch oder Tief), ein Tipp auf einen bestehenden Punkt setzt es genau auf diesen Pivot.':FR.pts.length?'<b>Zeichnen.</b> Der nächste Tipp beginnt eine neue Zählung, auch genau auf einem bestehenden Pivot. Sie ist so groß wie die Zählung, an die sie anschließt, und wird größer, sobald eine bestehende Zählung ganz in einer ihrer Wellen liegt. Für eine Unterteilung wechsle zu Auswählen, tippe die übergeordnete Welle an und dann die Zählweise.':'<b>Zähle frei und plane die Fortsetzung.</b> Wähle eine Zählweise und tippe auf den Chart: Das markierte Label wird gesetzt, danach springt die Leiste weiter. Im sichtbaren Teil rastet der Punkt am nächsten Hoch oder Tief ein, in der grauen Zone setzt du frei. Die Wellengröße ergibt sich aus der Verschachtelung, in beliebiger Reihenfolge: Liegt eine Zählung in einer Welle einer anderen, ist sie eine Größe kleiner. Du kannst also auch erst die Teilwellen und dann die Welle darüber zählen.')+'</p>'+
   (FR.done?'':frBar())+(FR.done||mhSeen()?'':'<p class="pgmh card"><span>Zwei Werkzeuge links am Chart: <b>Zeichnen</b> (Fadenkreuz) setzt mit jedem Tipp einen Punkt, <b>Auswählen</b> (Pfeil) wählt Punkte zum Verschieben, Umbenennen und Löschen.</span><button id="pgmhok">OK</button></p>')+'<div class="chart pgc'+(IMG?' ocimg'+(IMG.fade>=1?' ocw':''):'')+'" id="pgc"></div>'+frConfNote()+(IMG?'<p class="ocfd"><label for="ocfr">Bild blasser</label><input type="range" id="ocfr" min="0" max="100" step="5" value="'+Math.round(IMG.fade*100)+'" aria-valuetext="'+Math.round(IMG.fade*100)+' %"><output id="ocfv" for="ocfr">'+Math.round(IMG.fade*100)+' %</output></p>'+(FR.done?'':'<p class="ocfd ocpt"><label><input type="checkbox" id="ocsh"'+(IMG.show!==false||IMG.trace||IMG.fade>=1?' checked':'')+(IMG.trace?' disabled':'')+'> Erkannten Verlauf zeigen</label><button id="octr" class="'+(IMG.trace?'on':'')+'" aria-pressed="'+!!IMG.trace+'">'+(IMG.trace?'Nachzeichnen beenden':'Verlauf nachzeichnen')+'</button>'+(IMG.path.man.some(v=>v)?'<button id="ocrs">Erkannten Verlauf wiederherstellen</button>':'')+'</p>'+ocQS(IMG)):'')+legend+(IMG&&!FR.done&&IMG.q&&IMG.q.low?'<p class="ocq" role="note">'+ICON.warn+'<span>Viele Zeichnungen im Bild, die Erkennung ist unsicher. Tipp: In TradingView vorher alle Zeichnungen ausblenden (Augen-Symbol links) und nur den Chart abfotografieren. Passt der erkannte Verlauf an einer Stelle nicht, zeichne ihn dort nach.</span></p>':'')+(IMG&&!FR.done?OCNOTE:'')+(FR.sel&&!FR.done?frSelUI():'')+
   '<div class="dock">'+(FR.done&&IMG?'<button class="p" id="ocsave">Als Bild speichern</button>'+(ocCanShare()?'<button id="ocshare">Teilen</button>':'')+'<button id="ocedit">Zählung ändern</button><button id="ocnew">Neues Bild</button>':FR.done?'<button class="p" id="real" '+(m.shown?'disabled':'')+'>Tatsächlichen Verlauf zeigen</button><button class="p" id="nxt">Nächster Chart</button>':
    '<button class="p" id="fchk" '+(ready?'':'disabled')+'>Prüfen</button><button id="ftrash" class="pgtrash" '+(FR.sel&&FR.md==='sel'?'':'disabled')+' aria-label="Ausgewählte Zählung löschen" title="Ausgewählte Zählung löschen (Entf)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button id="fund">Zurück</button><button id="frst">Neu setzen</button>'+(ready?'':'<p class="mut pghint" id="pgwhy">'+(IMG?ocWhy():'Prüfen geht, sobald mindestens die nächste Welle deiner größten Zählung in der grauen Zone steht.')+'</p>'))+'</div>'+
   '<div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>';
  initView();$('#pgc').innerHTML=pic()+tfBar()+toolBar()+'<button id="pgend" class="pgend" hidden>Zum Ende springen</button>';bindChart();
  // Seit 14.11.2026: Ändert sich die Höhe von Text oder Leiste, bleibt der Chart an seiner Stelle im Bild; seit 26.11.2026 über keepView/topFix
  const osh=$('#ocsh');if(osh)osh.onchange=()=>{IMG.show=osh.checked;frRender(fbLast)};
  const otr=$('#octr');if(otr)otr.onclick=()=>{IMG.trace=!IMG.trace;if(!IMG.trace&&!FR.done)FR.md='draw';frRender(fbLast)}; // danach gleich wieder Punkte setzen (25.11.2026)
  const ors=$('#ocrs');if(ors)ors.onclick=()=>{IMG.path.hi.set(IMG.auto.hi);IMG.path.lo.set(IMG.auto.lo);IMG.path.man.fill(0);frRender(fbLast)};
  // Regler 0–100 % (23.11.2026): stufenlos zur weißen Fläche hin; ab 100 % weiße Chartfläche (.ocw), Verlauf wird eingeblendet
  const ofr=$('#ocfr');if(ofr)ofr.oninput=()=>{const w0=IMG.fade>=1;IMG.fade=+ofr.value/100;const r=$('#ocfade');if(r)r.setAttribute('opacity',IMG.fade);
   const fv=$('#ocfv');if(fv)fv.textContent=ofr.value+' %';ofr.setAttribute('aria-valuetext',ofr.value+' %');
   if(w0!==(IMG.fade>=1)){$('#pgc').classList.toggle('ocw',IMG.fade>=1);const sh=$('#ocsh');if(IMG.fade>=1&&sh&&!sh.checked){sh.checked=true;IMG.show=true}redraw($('#svg'),pic())}
   try{localStorage.setItem('waveChecker.ocFade',ofr.value)}catch(_){}};
  if(FR.done&&IMG)document.querySelectorAll('#fb [data-zz]').forEach(el=>{const go=()=>{const i=+el.dataset.zz,w=m.zzw[i];if(!w)return;
    if(X(w.t0)<0||X(w.t1)>W){sc=clampSc(((w.t0+w.t1)/2+.5)*BW/tf-W/2);redraw($('#svg'),pic())}
    $('#pgc').scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'});const r=document.querySelector('#svg .pgwb[data-i="'+i+'"]');
    if(r){r.classList.remove('blink');void r.getBoundingClientRect();r.classList.add('blink');setTimeout(()=>r.classList.remove('blink'),1700)}};
   el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  if(FR.done&&IMG){$('#ocsave').onclick=ocSave;const sh=$('#ocshare');if(sh)sh.onclick=ocShare;$('#ocedit').onclick=()=>{FR.done=false;FR.err={};m.lines=[];FR.md='sel';frRender()};$('#ocnew').onclick=()=>ownChart();return}
  if(FR.done){$('#real').onclick=()=>{m.shown=true;frRender(fb+'<p class="mut">Darübergelegt: der tatsächliche Verlauf mit der erzeugten Zählung der großen Welle. Gestrichelt darunter: deine Prognose. Nur zum Vergleich: Punkte gibt es für regelkonformes Zählen, nicht für Treffer.</p>')};$('#nxt').onclick=()=>progn(arg,lvl);return}
  document.querySelectorAll('[data-fz]').forEach(b=>b.onclick=()=>{if(FR.pw)frStartSub(b.dataset.fz);else{FR.z=b.dataset.fz;FR.ac=null;FR.i=0;FR.sel=null}FR.md='draw';frRender(fbLast)}); // Zählweise wählen: immer Zeichnen // Unterteilung der ausgewählten Welle bzw. neue Zählung
  const fe=$('#fend');if(fe)fe.onclick=()=>{frEnd();FR.md='sel';frRender(fbLast)};
  document.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>frMode(b.dataset.md));
  const hk=$('#pgmhok');if(hk)hk.onclick=()=>{try{localStorage.setItem(MHKEY,'1')}catch(_){}hk.parentNode.remove()};
  document.querySelectorAll('[data-fi]').forEach(b=>b.onclick=()=>{const v=+b.dataset.fi;if(frLast()||v>1)return;FR.i=v;frRender(fbLast)}); // läuft eine Zählung, zeigt die Leiste nur an (kein Springen); sonst Start oder 1
  const q=FR.pts.find(x=>x.id===FR.sel);
  if(q){
   const fc=$('#fcont');if(fc)fc.onclick=()=>{const top=FR.pts.filter(x=>x.c===q.c).reduce((a,b)=>Math.max(a,b.i),0);FR.ac=q.c;FR.z=q.z;FR.i=top+1;FR.sel=null;FR.pw=null;FR.md='draw';frRender(fbLast)};
   const fo=$('#fopen');if(fo)fo.onclick=()=>{const top=FR.pts.filter(x=>x.c===q.c).reduce((a,b)=>Math.max(a,b.i),0);FR.pw={c:q.c,k:top+1};frRender(fbLast)};
   document.querySelectorAll('[data-fren]').forEach(b=>b.onclick=()=>{q.i=+b.dataset.fren;FR.sel=null;FR.err={};m.lines=[];frRender()});
   const sz=d=>()=>{const all=frSeries(),S=all.find(x=>x.c===q.c);if(!S)return;[S,...frDesc(all,S)].forEach(x=>{(FR.cm[x.c]=FR.cm[x.c]||{lev:x.lev,par:null,pk:0}).lev+=d});FR.cm[q.c].man=1;
    if(d<0){FR.cm[q.c].par=null;FR.cm[q.c].pk=0}frNormLev();FR.err={};m.lines=[];frRender()};const fb2=$('#fbig'),fs2=$('#fsmall');if(fb2)fb2.onclick=sz(-1);if(fs2)fs2.onclick=sz(1);
   $('#fdel').onclick=frDel;$('#fsx').onclick=()=>{FR.sel=null;FR.pw=null;frRender(fbLast)}}
  $('#ftrash').onclick=frDel;
  $('#fund').onclick=()=>{const q=FR.pts.pop();if(q){FR.ac=q.c;FR.z=q.z;FR.i=q.i;FR.md='draw';if(q.cm0)FR.cm=JSON.parse(q.cm0);if(!FR.pts.some(x=>x.c===q.c))delete FR.cm[q.c]}FR.sel=null;FR.pw=null;FR.err={};m.lines=[];frRender()}; // Zurück: das Label kommt wieder dran
  $('#frst').onclick=()=>{FR.pts=[];FR.cm={};FR.ac=null;FR.i=0;FR.sel=null;FR.pw=null;FR.err={};m.lines=[];frRender()};
  $('#fchk').onclick=frVerify};
 // Faustregeln und Warnsignale für die gezeichneten Wellen (nur Hinweise, kein Fehler)
 const hints=(Q,v,gs)=>{const out=[];let inR=true,pc=x=>pct(x);const key=Q.key;
  const fr=(ok,txt)=>{if(!ok){inR=false;out.push('<p class="rnote f">'+stufe('faust')+txt.replace(' (Faustregel)','')+'</p>')}};
  gs.forEach(g=>{const k=g.k;
   if(key==='imp'&&k===3){const r=L(v,3)/L(v,1);if(r<1.236){inR=false;out.push('<p class="rnote w">'+stufe('warn')+'Welle 3 erreicht nur '+pc(r)+' von Welle 1, sie sollte mindestens 123,6 % erreichen.</p>')}
    fr(r>=1.618-.02&&r<=2.618+.02,'Welle 3 erreicht '+pc(r)+' von Welle 1. Am häufigsten sind 161,8 % bis 261,8 % (Faustregel).')}
   if(key==='imp'&&k===4){const r=L(v,4)/L(v,3);fr(Math.abs(r-.382)<=.02||Math.abs(r-.5)<=.02,'Welle 4 läuft '+pc(r)+' von Welle 3 zurück. Am häufigsten sind 38,2 % oder 50 % (Faustregel).')}
   if(key==='imp'&&k===5){const r=L(v,5)/Math.abs(v[3]-v[0]);if(r<.382){inR=false;out.push('<p class="rnote w">'+stufe('warn')+'Welle 5 erreicht nur '+pc(r)+' (gemessen über Start von Welle 1 bis Ende von Welle 3), sie sollte mindestens 38,2 % erreichen.</p>')}
    fr(r>=.618-.02&&r<=2.618+.02,'Welle 5 erreicht '+pc(r)+' (gemessen über Start von Welle 1 bis Ende von Welle 3). Am häufigsten sind 61,8 % bis 261,8 % (Faustregel).')}
   if(key==='zig'&&k===3){const r=L(v,3)/L(v,1);fr(r>=.618-.02&&r<=1.618+.02,'Welle C erreicht '+pc(r)+' von Welle A. Üblich sind 61,8 % bis 161,8 %, am häufigsten 100 % (Faustregel).')}});
  if(key!=='imp')warns(Q,v).forEach(id=>{inR=false;out.push(lvlNote(Q,id))}); // übrige Muster: Warnsignale und Faustregeln aus den Regeltabellen
  const al=altInfo(Q,mainP(),gs);if(al.note){inR=false;out.push('<p class="rnote w">'+stufe('warn')+al.note+'</p>')}
  return{html:out.join(''),inR}};
 // Planungs-Hinweis für Regeln, die erst mit der ganzen Zählung prüfbar sind (IMP-2)
 const plan=(Q,v)=>Q.key==='imp'&&waves().includes(5)&&L(v,3)<L(v,1)?'<p>Weil Welle 3 kürzer als Welle 1 ist, darf Welle 5 nicht länger als Welle 3 werden (Welle 3 ist nie die kürzeste).</p>':'';
 // Invalidierungslinien des angenommenen Musters Q, nur für geplante Wellen
 const lines=(Q,mp,gs)=>{const v=norm(Q,mp),s=Q.sign(mp),tOf=j=>j<=CNT.cut?CNT.t[j]:(gs.find(g=>g.k===j)||{pts:[{x:CNT.t[CNT.cut]}]}).pts.slice(-1)[0].x,fl=FLIP;FLIP=s<0;
  const o=(PGLINE[Q.key]||[]).filter(z=>z.w>CNT.cut&&z.w<mp.length).map(z=>{const p=z.j!==undefined?mp[z.j]:z.f(v)===null?null:mp[0]+s*z.f(v);if(p===null)return null;
   const t=z.j!==undefined?tOf(z.j):tOf(z.w-1),d=Math.sign(mp[z.w]-mp[z.w-1]);return{t,p,txt:mt(z.t),below:d<0}}).filter(Boolean);FLIP=fl;return o};
 const redoBtn=g=>'<button class="p" id="redo" data-k="'+g.k+'">Welle '+wn(g.k)+' neu zeichnen</button>';
 const tipUI=x=>{const lines=['Die Planung ist noch nicht regelkonform.'],r=x.r,w=r.g?wn(r.g.k):'';let extra='';
  if(r.kind==='unt'){const al=[...new Set(fam().flatMap(Q=>PGSUB[Q.key].filter(V=>fitsK(V,CNT.vk)).flatMap(V=>V[r.g.k-1].map(d=>PGKOF[d]))))].map(k=>PGK[k].t);
   if(m.tips>=1)lines.push('Tipp 1: Überlege, wie sich Welle '+w+' unterteilen darf. Läuft sie mit der Bewegung des Musters oder dagegen?');
   if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Welle '+w+' kann sich hier nicht als '+PGK[r.g.kind].t+' unterteilen.');
   if(m.tips>=3)lines.push('Tipp 3: Regelwerk. Für Welle '+w+' '+(al.length>1?'sind diese Zählweisen möglich: ':'ist nur diese Zählweise möglich: ')+al.join(', ')+'.');
   extra=redoBtn(r.g);
  }else if(r.kind==='alt'){
   if(m.tips>=1)lines.push('Tipp 1: Vergleiche das Muster deiner Welle 4 mit dem von Welle 2 ('+r.t2+').');
   if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „Welle 2 und Welle 4 bilden dasselbe Korrekturmuster aus“ (Alternation).');
   if(m.tips>=3)lines.push('Tipp 3: Regelwerk, Abschnitt Welle 4. Welle 4 muss ein anderes Korrekturmuster ausbilden als Welle 2 derselben Wellenebene.');
   extra=redoBtn(r.g);
  }else{const sub=r.kind==='sub',X=sub?r.D:x.Q,rl=X.rules[r.id];
   if(m.tips>=1)lines.push('Tipp 1: '+(sub?'In den Subwellen von Welle '+w+': ':'')+mt(rl.hint));
   if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „'+mt(rl.name)+'“.');
   if(m.tips>=3)lines.push('Tipp 3: '+tag(X,r.id)+'. '+mt(rl.ex));
   if(sub)extra=redoBtn(r.g);}
  render('<p class="bad">Noch nicht ganz.</p>'+lines.map(tipLine).join('')+(x.plan||'')+(m.tips<3?'<button id="tip">Tipp anzeigen</button>':'')+extra);
  const t=$('#tip');if(t)t.onclick=()=>{m.tips++;tipUI(x)};bindRedo()};
 const bindRedo=()=>{const rd=$('#redo');if(rd)rd.onclick=()=>{const gs=segs(),i=gs.findIndex(g=>g.k===+rd.dataset.k),keep=gs.slice(0,i).reduce((a,g)=>a+g.n,0); // diese und alle späteren Wellen neu
   gs.slice(i).forEach(g=>delete m.ch[g.k]);m.pts=m.pts.slice(0,keep);m.lines=[];render()}};
 const verify=()=>{const gs=segs(),mp=mainP(),res=fam().map(Q=>({Q,r:evalQ(Q,gs,mp)})),ok=res.filter(x=>!x.r);m.lines=[];
  if(!ok.length){ // Befund des Musters, das am weitesten kommt (bei Gleichstand das generierte)
   const x=res.sort((a,b)=>(b.r.st+(b.Q===P?.5:0))-(a.r.st+(a.Q===P?.5:0)))[0],r=x.r,v=norm(x.Q,mp);fail();
   if(r.kind==='unt')m.chErr=true;
   if(r.kind==='struct')return render('<p class="bad">Noch nicht ganz.</p><p>'+(x.Q.structMsg||'Die Hauptwellen wechseln von Welle zu Welle die Richtung. Prüfe, wo deine Wellen enden.')+'</p>');
   if(r.kind==='dir'||(r.kind==='sub'&&!r.id)){render('<p class="bad">Noch nicht ganz.</p><p>Welle '+wn(r.g.k)+' als '+PGK[r.g.kind].t+': Die erste Subwelle läuft in dieselbe Richtung wie Welle '+wn(r.g.k)+' selbst, danach wechselt die Richtung von Punkt zu Punkt. Prüfe die Richtung deiner Punkte.</p>'+redoBtn(r.g));return bindRedo()}
   return tipUI({Q:x.Q,r,plan:r.kind==='main'?plan(x.Q,v):''})}
  // angenommen: das Muster, zu dem die Planung passt (das generierte, wenn es passt). Die Grenzlinien gehören zu diesem Muster.
  const Q=(ok.find(x=>x.Q===P)||ok[0]).Q,v=norm(Q,mp);m.lines=lines(Q,mp,gs);
  const h=hints(Q,v,gs),gain=Math.max(4,10-3*m.tips)-(m.failed?2:0),bF=h.inR?5:0,bC=m.chErr?0:5;
  m.done=true;if(!m.failed)st.streak++;st.pts+=gain+bF+bC;stats();exSolved(key,m.tips);pathMark('progn'); // zählt für die Ränge
  render('<p class="ok">Regelkonform! +'+gain+' Punkte</p><p>Deine Fortsetzung passt zum Muster <b>'+Q.title+'</b>. Generiert wurde übrigens: '+P.title+'.</p>'+
   (bF?'<p class="ok">Bonus +5: Keine Warnsignale, alle gezeichneten Wellen liegen in den Faustregel-Bereichen.</p>':'')+(bC?'<p class="ok">Bonus +5: Zählweise aller Wellen beim ersten Versuch passend.</p>':'')+
   h.html+plan(Q,v)+(m.lines.length?'<p class="mut">Gestrichelte Linien: Grenzen aus den harten Regeln des Musters „'+Q.title+'“.</p>':''));
 };
 render();
}
