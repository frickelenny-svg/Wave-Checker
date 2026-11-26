/* js/generator/subwellen.js – Generator für Runden mit Subwellen (makeSubRound, pickAlt: Muster der Wellen 2 und 4), für „Subwellen zählen“
   und „Fehler finden“.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Modus 4: Subwellen zählen. Längerer Chart; erst die Hauptpunkte, dann die Subwellen der Wellen einzeln.
// Impuls: Subwellen von Welle 1, 3, 5 (je 5-teilig). Zigzag: A (5), B (3), C (5). Flats: A (3), B (3), C (5).
// Fünfteilige Wellen sind selbst Impulse (W1-1, WA-1, WC-1): dafür gelten IMP-1 bis IMP-4. Dreiteilige Wellen: nur die App-Vorgabe zur Richtung,
// denn B einer Flat darf jedes Korrekturmuster sein (WB-2), A ein Zigzag, eine Flat oder ein Double-Zigzag (WA-2). Offen: Diagonalen in Welle 1/5 bzw. C kommen hier noch nicht vor.
// Muster der Wellen 2 und 4 im Impuls: Welle 2 nie ein Dreieck (DRE-1, W2-1), Welle 4 anders als Welle 2 (W4-3, Alternation).
// Dieselbe Flat-Variante in beiden Wellen ist ein Regelbruch. Zwei verschiedene Flat-Varianten wären nur ein Warnsignal
// (Lenny, 26.10.2026); diese Mischform kommt hier nicht vor, damit die Aufgabe eindeutig bleibt.
function pickAlt(violate){
 const pk=a=>a[Math.floor(Math.random()*a.length)],A2=['Zigzag','Regular Flat','Expanded Flat','Running Flat','Double Zigzag'],A4=A2.concat('Dreieck'),fl=a=>/Flat/.test(a);
 if(violate==='W4-3'){const x=pk(A2);return{2:x,4:x}}
 if(violate==='DRE-1')return{2:'Dreieck',4:pk(A2)};
 const w2=pk(A2);return{2:w2,4:pk(A4.filter(a=>a!==w2&&!(fl(a)&&fl(w2))))};
}
function makeSubRound(P,plan,violate,named){
 plan=plan||{};
 const imp=P.key==='imp',dir=Math.random()<.5?1:-1,B=600;FLIP=dir<0;
 const num=!P.parts||!violate||/^WX/.test(violate),names=(named&&P.parts)?pickNames(P,violate):null; // dz/tz: Muster der Teile (nur Fehler finden)
 const v=imp?genImp(/^IMP-[123]$/.test(violate)?violate:null):P.gen(num?(violate||null):null);
 const legNames=(imp&&named)?pickAlt(violate):null; // Impuls im Fehler-finden-Modus: Muster von Welle 2 und 4 (Alternation W4-3)
 // Länge (Kerzen) je Welle und Teilstruktur je Muster
 const LEN={imp:[20,10,28,12,30],zig:[28,16,32],fr:[22,22,34],fe:[22,22,34],fru:[22,22,34],trk:[16,16,16,16,16],tre:[16,16,16,16,16],dl:[22,12,22,12,24],db:[16,16,16,16,16],de:[16,16,16,16,16],dz:[30,26,30],tz:[18,16,18,16,18]};
 const base=LEN[P.key],frs=imp?[impF,abcF,impF,abcF,impF]:P.shape.fr;
 const len=base.map(l=>l+Math.round(rnd(-2,2))),mp=[0];len.forEach(l=>mp.push(mp[mp.length-1]+l));
 const x=[],sp={},spAll={},tri={},wxy={},nmk={}; // nmk: Muster des Teils je Welle (für die Komplettprüfung roundFails)
 for(let k=1;k<=len.length;k++){
  const pi=names?P.partLeg.indexOf(k-1):-1,sp0=plan[k],nm=(legNames&&legNames[k])||(pi>=0?names[pi]:null);if(nm)nmk[k]=nm;
  const fr=sp0?(sp0.parts===3?abcF():sp0.viol?(()=>{const g=genImp(sp0.viol);return g.map(q=>q/g[5])})():impF()):nm?partF(nm):frs[k-1]();
  const o=leg(v[k-1],v[k],len[k-1],fr);x.push(...o);
  spAll[k]=o.idx.slice(1,-1).map(i=>mp[k-1]+i).concat(mp[k]);tri[k]=nm==='Dreieck';wxy[k]=nm==='Double Zigzag'; // Double Zigzag: Teile heißen (w)(x)(y)
  if(!imp||k%2===1)sp[k]=spAll[k];} // sp: Wellen, die in „Subwellen zählen“ gezählt werden
 x.push(v[len.length]);
const lab=legNames?P.labels.map((l,k)=>legNames[k]?l+' '+legNames[k]:l):names?P.labels.map((l,k)=>{const pi=P.partLeg.indexOf(k-1);return pi>=0?l+' '+names[pi]:l}):null;
 return{P,dir,pr:x.map(y=>B+dir*y),mp,sp,spAll,tri,wxy,nm:nmk,lab,vwave:violate?P.lastVW:undefined};
}
