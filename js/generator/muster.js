/* js/generator/muster.js – Chart-Generator: würfelt Wellenlängen je Muster (genImp, genZig, genFlat, genTri, genDiag, genCx), bis die Prüfung
   das gewünschte Ergebnis liefert; Teilstruktur und Beschreibung je Muster (PAT.*.gen/shape/recog/subs/ctx), partF, makeRound.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- 2) Generator: würfelt Wellenlängen, bis die Prüfung das gewünschte Ergebnis liefert.
const rnd=(a,b)=>a+Math.random()*(b-a);
function genImp(violate){ // violate=null: regelkonform; sonst genau diese Regel verletzen
 // Truncation ist selten: nur in ca. 4 % der regelkonformen Charts, nie in Fehler-Aufgaben.
 const allowTrunc=!violate&&Math.random()<.04;
 for(let n=0;n<6000;n++){
  // Profil: meist Welle 3 verlängert, manchmal Welle 5 verlängert, sonst ohne deutliche Verlängerung; Welle 2 und 4 mal flach, mal tief
  const pr=Math.random(),ext=pr<.55?3:pr<.75?5:0,deep2=Math.random()<.5,deep4=Math.random()<.4;
  const l1=rnd(.7,1.6)*100,p1=l1,p2=p1-(deep2?rnd(.6,1.3):rnd(.25,.65))*l1,l3=(ext===3?rnd(1.6,3.4):ext===5?rnd(1.24,1.8):rnd(.7,1.9))*l1,p3=p2+l3,
   p4=p3-(deep4?rnd(.45,.75):rnd(.15,.45))*l3,p5=p4+(ext===5?rnd(1.4,2.8):rnd(.4,1.6))*l1;
  const v=[0,p1,p2,p3,p4,p5],f=violate?hardFails(PAT.imp,v):check(PAT.imp,v); // Fehler-Aufgaben: nur harte Regeln zählen
  if(allowTrunc?!(p5<p3):p5<p3)continue;
  if(violate==='IMP-2'){const r=l3/Math.min(l1,p5-p4);if(r<.6||r>.85)continue} // Welle 3 klar, aber nicht übertrieben kürzer als die kürzere der Wellen 1 und 5
  if(violate?(f.length===1&&f[0]===violate):f.length===0) return v;
 }
}
function genZig(violate){
 for(let n=0;n<6000;n++){
  const LA=rnd(.8,1.6)*100,u1=-LA,rB=violate==='ZZ-2'?rnd(1.05,1.4):rnd(.3,.9),u2=u1+rB*LA,
   LC=violate==='ZZ-3'?rB*LA*rnd(.55,.95):rnd(.6,1.7)*LA,u3=u2-LC;
  const v=[0,u1,u2,u3],f=check(PAT.zig,v);
  if(violate?(f.length===1&&f[0]===violate):f.length===0) return v;
 }
}
function genFlat(kind,violate){
 const P=PAT[kind];
 for(let n=0;n<6000;n++){
  const LA=rnd(.8,1.6)*100,u1=-LA;
  // B über dem Start von A? (Regular: nein, Expanded/Running: ja; bei einer Verletzung genau umgekehrt)
  const bUp=kind==='fr'?violate==='FR-2':kind==='fe'?violate!=='FE-2':violate!=='FRU-2';
  // C unter dem Tief von A? (Regular/Expanded: ja, Running: nein; bei einer Verletzung umgekehrt)
  const cLow=kind==='fr'?violate!=='FR-3':kind==='fe'?violate!=='FE-3':violate==='FRU-3';
  const u2=u1+(bUp?rnd(1.03,1.35):rnd(.89,.99))*LA,
   u3=cLow?u1-(kind==='fr'?rnd(.03,.2):rnd(.1,.6))*LA:u1+rnd(.1,.5)*LA;
  const v=[0,u1,u2,u3];if(!P.struct(v))continue;
  const f=violate?hardFails(P,v):check(P,v);
  if(violate?(f.length===1&&f[0]===violate):f.length===0)return v;
 }
}
function genTri(kind,violate){
 const P=PAT[kind],con=kind==='trk',vj=violate?2+Math.floor(Math.random()*4):0; // vj = gebrochene Welle (2..5 = B..E)
 const Ls=[rnd(1,1.6)*100];
 for(let j=2;j<=5;j++){const broken=j===vj;
  Ls.push(Ls[j-2]*(con?(broken?rnd(1.05,1.35):rnd(.7,.92)):(broken?rnd(.7,.95):rnd(1.08,1.4))));}
 P.lastVW=violate?'ABCDE'[vj-1]:undefined; // die Welle, die gegen die Regel verstößt
 const u=[0,Ls[0],0,0,0,0];u[2]=u[1]-Ls[1];u[3]=u[2]+Ls[2];u[4]=u[3]-Ls[3];u[5]=u[4]+Ls[4];
 return u;
}
function genDiag(kind,violate){
 const P=PAT[kind],imp=P.implied||{};P.lastVW=undefined;
 for(let n=0;n<60000;n++){
  const L1=rnd(.8,1.6)*100,wide=!!violate;let L2,L3,L4,L5;
  if(kind==='de'){L2=L1*rnd(.3,.8);L3=L1*rnd(wide?.7:1.1,wide?1.8:2);L4=L3*(violate==='DE-9'?rnd(1.02,1.3):violate==='DIAG-2'?rnd(.3,.9):rnd(.5,.887));L5=L3*rnd(1.1,1.6);} // Welle 4 retraced 50 % bis 88,7 % der Welle 3 (DE-9)
  else{L2=L1*rnd(.3,.85);L3=L1*rnd(.4,wide?1.5:.98);L4=L1*rnd(.15,.9);L5=L1*rnd(.15,wide?1.3:.95);}
  const u=[0,L1,L1-L2,L1-L2+L3,L1-L2+L3-L4,L1-L2+L3-L4+L5];
  // Form: Hochs steigen (3 über 1, 5 über 3, Regel DIAG-5); Tiefs steigen (bei der Expandierenden Diagonale folgt das aus DE-9)
  if(!(u[3]>u[1]&&u[5]>u[3]&&u[4]>u[0]&&(kind==='de'?(u[4]>u[2]||violate==='DE-9'||violate==='DIAG-2'):u[4]>u[2])))continue;
  const f=hardFails(P,u),Ln=j=>Math.abs(u[j]-u[j-1]);
  if(violate){
   // genau die gewählte Regel verletzen (mitverletzte Folgeregeln sind in P.implied erlaubt)
   if(!(f.includes(violate)&&f.every(x=>x===violate||(imp[violate]||[]).includes(x))))continue;
   if(violate==='DL-4'&&!(Ln(4)<Ln(1)&&Ln(5)<Ln(1)))continue;
   if(violate==='DE-3'){if((Ln(3)<=Ln(1))===(Ln(5)<=Ln(3)))continue;P.lastVW=Ln(3)<=Ln(1)?'3':'5';}
   return u;
  }
  if(check(P,u).length===0)return u;
 }
}
function genCx(kind,violate){
 const P=PAT[kind],tz=kind==='tz',rare=tz&&!violate&&Math.random()<.05; // selten: Y oder Z ohne neues Tief (KOM-4 ist nur Warnung)
 for(let n=0;n<6000;n++){
  const LW=rnd(.8,1.6)*100,u1=-LW,u2=u1+(violate==="WX-2"?rnd(1.1,1.5):rnd(.4,.85))*LW,LY=LW*rnd(.6,1.8),u3=u2-LY,v=[0,u1,u2,u3];
  if(tz){const u4=u3+(violate==="WX-2b"?rnd(1.1,1.5):rnd(.4,.85))*LY;v.push(u4,u4-LW*rnd(.5,1.5));}
  if(!P.struct(v))continue;
  const f=violate?hardFails(P,v):check(P,v);
  if(rare){if(f.length===1&&f[0]==='KOM-4')return v;continue}
  if(violate?(f.length===1&&f[0]===violate):f.length===0)return v;
 }
}
// Ein Abschnitt a→b über n Kerzen mit Zwischenextremen (fr = Anteile der Strecke). Endpunkt b gehört zum nächsten Abschnitt.
function leg(a,b,n,fr){
 const k=fr.length-1,w=Array.from({length:k},()=>rnd(.8,1.4)),tot=w.reduce((x,y)=>x+y),idx=[0];let t=0;
 w.forEach(x=>{t+=x;idx.push(Math.round(t/tot*n))});
 for(let j=1;j<=k;j++)if(idx[j]<=idx[j-1])idx[j]=idx[j-1]+1;
 const out=[];
 for(let j=0;j<k;j++){const pa=a+(b-a)*fr[j],pb=a+(b-a)*fr[j+1],lo=Math.min(pa,pb),hi=Math.max(pa,pb);
  for(let i=idx[j];i<idx[j+1];i++){const s=(i-idx[j])/(idx[j+1]-idx[j]);let x=pa+(pb-pa)*s;
   if(i>idx[j])x+=(Math.random()-.5)*(hi-lo)*.3;out.push(Math.min(hi,Math.max(lo,x)));}}
 out.idx=idx; // Kerzenindex der Teilpunkte (für die Subwellen-Stufe)
 return out;
}
const impF=()=>{const f1=rnd(.2,.35),f3=rnd(.65,.85);return[0,f1,f1*rnd(.4,.6),f3,f3-rnd(.1,.18),1]}; // fünfteilig
const abcF=()=>{const f1=rnd(.5,.7);return[0,f1,f1*rnd(.45,.65),1]};                                   // dreiteilig
// Zeitliche Aufteilung und Teilstruktur je Korrekturmuster (Zigzag: 5-3-5, Flat: 3-3-5)
PAT.zig.gen=genZig;PAT.zig.shape={piv:[0,15,25,45],fr:[impF,abcF,impF]};
for(const k of ['fr','fe','fru']){PAT[k].gen=violate=>genFlat(k,violate);PAT[k].shape={piv:[0,12,24,45],fr:[abcF,abcF,impF]}}
// Kurzbeschreibung je Muster für die Auflösung im Modus „Muster erkennen“ (aus dem Regelwerk)
PAT.imp.recog='Impuls: fünf Wellen, die Wellen 1, 3 und 5 laufen mit dem Trend, die Wellen 2 und 4 korrigieren dagegen (Buch S.38).';
PAT.zig.recog='Zigzag: A und C sind fünfteilig, B ist dreiteilig und überschreitet den Start von A nicht, C endet unter dem Ende von A (Buch S.42).';
PAT.fr.recog='Regular Flat: A und B sind dreiteilig, B nähert sich dem Start von A an, C ist ein Impuls und endet leicht unter dem Tief von A (Buch S.46).';
PAT.fe.recog='Expanded Flat: A und B sind dreiteilig, B überschreitet den Start von A, C endet unterhalb des Tiefs von A (Buch S.46).';
PAT.fru.recog='Running Flat: A und B sind dreiteilig, B überschießt den Start von A, C schafft kein neues Tief unterhalb von A (Buch S.46).';
for(const k of ['trk','tre']){PAT[k].gen=violate=>genTri(k,violate);PAT[k].shape={piv:[0,9,18,27,36,45],fr:[abcF,abcF,abcF,abcF,abcF]}}
PAT.trk.tri=PAT.tre.tri=PAT.dl.tri=PAT.db.tri=PAT.de.tri=true; // Dreiecke: nach „Prüfen“ werden Trendlinien eingezeichnet
PAT.trk.recog='Kontrahierendes Dreieck: fünf dreiteilige Wellen A bis E, Welle A ist die längste und jede Welle ist kürzer als die vorangegangene (Buch S.50).';
PAT.tre.recog='Expandierendes Dreieck: fünf dreiteilige Wellen A bis E, Welle A ist die kürzeste und jede Welle ist länger als die vorangegangene (Buch S.50).';
PAT.dl.gen=v=>genDiag('dl',v);PAT.dl.shape={piv:[0,10,18,28,35,45],fr:[impF,abcF,impF,abcF,impF]}; // 5-3-5-3-5
for(const k of ['db','de']){PAT[k].gen=v=>genDiag(k,v);PAT[k].shape={piv:[0,9,18,27,36,45],fr:[abcF,abcF,abcF,abcF,abcF]}} // 3-3-3-3-3
PAT.dl.recog='Leading Diagonale (nur in Welle 1): fünf Wellen mit Überlappung von Welle 1 und 4, Welle 1 ist die längste, Welle 5 ist nie länger als Welle 3 (Regelwerk, Abschnitt Diagonale).';
PAT.db.recog='Beendende Diagonale (nur in Welle 5 und C): fünf dreiteilige Wellen mit Überlappung von Welle 1 und 4, Welle 3 ist kürzer als Welle 1 und nie die kürzeste, Welle 5 ist nie länger als Welle 3 (Regelwerk, Abschnitt Diagonale).';
PAT.de.recog='Expandierende Diagonale (äußerst selten, nur in Welle 1, 5 und C): fünf dreiteilige Wellen mit Überlappung von Welle 1 und 4, die Wellen werden länger, Welle 1 ist die kürzeste und Welle 5 die längste (Regelwerk, Abschnitt Diagonale).';
PAT.dz.recog='Double Zigzag (W-X-Y): drei Korrekturwellen, bei denen W, X und Y jeweils selbst Korrekturmuster sind (z. B. W als Zigzag, X als Dreieck, Y als Regular Flat). W und Y laufen in dieselbe Richtung, X dagegen und unter 100 % von W zurück (Regelwerk, Abschnitt Komplexe Korrekturen und Welle X).';
PAT.tz.recog='Dreifache Form (W-X-Y-X-Z): wie der Double Zigzag, aber mit einer zweiten X-Welle und einem dritten Korrekturmuster Z. W, Y und Z laufen in dieselbe Richtung, die beiden X dagegen und jeweils unter 100 % zurück (Regelwerk, Abschnitt Komplexe Korrekturen und Welle X).';
PAT.dz.gen=v=>genCx('dz',v);PAT.dz.shape={piv:[0,15,25,45],fr:[abcF,abcF,abcF]};
PAT.tz.gen=v=>genCx('tz',v);PAT.tz.shape={piv:[0,9,18,27,36,45],fr:[abcF,abcF,abcF,abcF,abcF]};
// Teilstruktur je Muster (Regelwerk, wie in den recog-Texten): 5 = fünfteilige, 3 = dreiteilige Teilwelle.
// Der erste Eintrag ist die Struktur, mit der der Chart gezeichnet wird. Die Leading Diagonale darf 5-3-5-3-5 oder 3-3-3-3-3 sein.
// Wird im Modus „Muster erkennen“ gebraucht: Ohne diesen Vergleich wären z. B. Zigzag (5-3-5) und Regular Flat (3-3-5) immer austauschbar.
PAT.imp.subs=['53535'];PAT.dl.subs=['53535','33333'];PAT.zig.subs=['535'];PAT.fr.subs=PAT.fe.subs=PAT.fru.subs=['335'];PAT.dz.subs=['333'];
PAT.trk.subs=PAT.tre.subs=PAT.db.subs=PAT.de.subs=PAT.tz.subs=['33333'];
// Wo das Muster im größeren Trend vorkommt (Regelwerk). Nur daran lassen sich Muster unterscheiden, zu denen derselbe Chart regelkonform ist.
PAT.trk.ctx=PAT.tre.ctx='nie in Welle 2, C und W';PAT.dl.ctx='nur in Welle 1';PAT.db.ctx='nur in Welle 5 und C';PAT.de.ctx='nur in Welle 1, 5 und C';PAT.tz.ctx='kann in Welle 2 und 4 vorkommen, auch in Welle B von Flats und in Welle 2 und 4 von Diagonalen';
// Teilmuster mit Namen (Fehler finden: Muster der Teile im Chart beschriftet). Seit 15.11.2026 (Lenny) aus den echten Generatoren
// (wie pgFr in „Wie geht es weiter?“), damit jedes Teil die harten Regeln seines Musters erfüllt. Vorher war das Dreieck fest
// [0,1,.5,.85,.65,1]: (e) länger als (d) und über (c), ein Verstoß gegen DRE-7; die Flats waren nur ein einfaches A-B-C.
// Dreieck = kontrahierend (DRE-7: |A| > |B| > |C| > |D| > |E|). Werte als Anteile der Strecke (Start 0, Ende 1); Welle A eines
// Dreiecks läuft dabei über das Ende hinaus (das Dreieck endet innerhalb von A).
const PARTK={Zigzag:'zig','Regular Flat':'fr','Expanded Flat':'fe','Running Flat':'fru',Dreieck:'trk','Double Zigzag':'dz'};
const partF=name=>{const k=PARTK[name];for(let n=0;n<40;n++){const f=pgFr(k);if(f&&f.every(x=>x>-.6&&x<1.6))return f}return pgFr(k)};
const triF=()=>partF('Dreieck'); // fünfteiliges Dreieck (Teil A-B-C-D-E), endet auf dem Teilziel
// Muster der Teile wählen (nur Fehler finden): frei wählbar, nur W darf kein Dreieck sein; mit DRE-1 steht ein Dreieck in W
function pickNames(P,violate){
 const pk=a=>a[Math.floor(Math.random()*a.length)],nonTri=ARTEN.filter(a=>a!=='Dreieck');
 return[violate==='DRE-1'?'Dreieck':pk(nonTri),pk(ARTEN),pk(ARTEN)]; // W nie Dreieck (DRE-1); X, Y und Z frei (Z darf seit 10.11.2026 wieder ein Dreieck sein, WZ-1)
}
// Zeitachse variieren: Jede Welle dauert zufällig 70 % bis 140 % ihrer Grundlänge, zusammen bleiben es 45 Kerzen.
// So sehen auch Charts desselben Musters jedes Mal anders aus (Lenny, 26.10.2026). Jede Welle behält mindestens mn Kerzen.
function jitPiv(piv,mn){
 for(let n=0;n<20;n++){const d=piv.slice(1).map((p,i)=>(p-piv[i])*rnd(.7,1.4)),f=45/d.reduce((a,b)=>a+b,0),out=[0];let acc=0;
  d.forEach((x,i)=>{acc+=x*f;out.push(i===d.length-1?45:Math.round(acc))});
  if(out.every((p,i)=>!i||p-out[i-1]>=mn))return out;}
 return piv;
}
function makeRound(P,violate,named){
 const dir=Math.random()<.5?1:-1,B=600;FLIP=dir<0;let x,piv,lab,vw,alt;
 if(P.key==='imp'){const v=genImp(violate),pv=jitPiv([0,9,18,27,36,45],6);x=[];
  for(let k=1;k<=5;k++){const a=v[k-1],b=v[k],S=pv[k]-pv[k-1];
   for(let s=0;s<S;s++){let y=a+(b-a)*s/S+(s?(Math.random()-.5)*Math.abs(b-a)*.28:0);
    x.push(Math.min(Math.max(y,Math.min(a,b)),Math.max(a,b)));}}
  x.push(v[5]);piv=pv;
 }else{const num=!P.parts||!violate||/^WX/.test(violate),v=P.gen(num?violate:null),q={...P.shape,piv:jitPiv(P.shape.piv,7)};x=[];piv=q.piv;
  const nl=q.piv.length-1,names=(named&&P.parts)?pickNames(P,violate):null;
  for(let k=0;k<nl;k++){const pi=names?P.partLeg.indexOf(k):-1;x.push(...leg(v[k],v[k+1],q.piv[k+1]-q.piv[k],pi>=0?partF(names[pi]):q.fr[k]()));}
  x.push(v[nl]);
  if(names){ // Beschriftung der Pivotpunkte mit dem Muster des Teils
   lab=P.labels.map((l,k)=>{const pi=P.partLeg.indexOf(k-1);return pi>=0?l+' '+names[pi]:l});
   if(violate==='DRE-1')vw='W';}}
 return{P,dir,pr:x.map(y=>B+dir*y),piv,violate,vwave:violate?(vw||P.lastVW):undefined,alt,lab};
}
