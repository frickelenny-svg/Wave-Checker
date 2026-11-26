/* js/regeln/impuls-zigzag.js – Regeln für Impuls und Zigzag (jede Regel = Prüffunktion mit interner ID, z. B. IMP-1, ZZ-2),
   dazu die Grundlagen aller Regeln: Wellenlänge L, Regeltexte passend zur Chartrichtung (FLIP, mt), pct, Musterliste PAT.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
/* ===== Wave Checker – Prototyp: Impuls (S.38) und Zigzag (S.42) =====
   Aufbau: 1) Regeln je Muster (jede Regel = eine Prüffunktion mit interner ID)
           2) Chart-Generator  3) Zeichnen  4) Spielmodi.
   Alle Prüfungen laufen im Code, ohne KI. Regel-IDs sieht nur der Code, nie der Nutzer. */

// ---- 1) Regeln. Alle Werte u/v sind normalisiert: Punkt 0 = 0, Impuls zeigt nach oben, Zigzag-Welle A nach unten.
// hard=1: harte Regel (Zählung falsch). hard=0: harte Orientierung (nur Warnung).
const L=(v,k)=>Math.abs(v[k]-v[k-1]); // Länge der Welle zwischen Punkt k-1 und k
const IMPR={
 'IMP-1':{page:38,hard:1,wave:'2',name:'Welle 2 unter dem Start von Welle 1',
  hint:'Schau auf Welle 2: Wie weit läuft sie zurück?',
  ex:'Welle 2 darf den Startpunkt der Welle 1 nicht unterschreiten (im Abwärtstrend: nicht überschreiten).',
  ok:v=>v[2]>=v[0]},
 'IMP-2':{page:38,hard:1,wave:'3',name:'Welle 3 ist die kürzeste Impulswelle',
  hint:'Vergleiche die Längen der Wellen 1, 3 und 5.',
  ex:'Welle 3 darf nie die kürzeste der Impulswellen 1, 3 und 5 sein.',
  ok:v=>!(L(v,3)<L(v,1)&&L(v,3)<L(v,5))},
 'IMP-3':{page:38,hard:1,wave:'4',name:'Welle 4 überschneidet Welle 1',
  hint:'Prüfe, wie tief Welle 4 läuft. Berührt sie das Preisterritorium von Welle 1?',
  ex:'Welle 4 darf das Preisterritorium der Welle 1 nicht schneiden (Ausnahme: Diagonale). Schon eine Berührung zählt als Überlappung.',
  ok:v=>v[4]>v[1]},
 'IMP-4':{page:38,hard:1,wave:'1',name:'Falsche Richtung einer Welle',
  hint:'Prüfe die Richtung jeder Welle: 1, 3, 5 laufen mit dem Trend, 2 und 4 dagegen.',
  ex:'Welle 1, 3 und 5 verlaufen immer in Trendrichtung, die Wellen 2 und 4 sind Korrekturen dagegen.',
  ok:v=>v[1]>v[0]&&v[2]<v[1]&&v[3]>v[2]&&v[4]<v[3]&&v[5]>v[4]},
 'W3-4':{page:null,hard:0,wave:'3',name:'Welle 3 expandiert weniger als 123,6 %',
  hint:'Vergleiche Welle 3 mit Welle 1.',
  ex:'Harte Orientierung: Welle 3 sollte mindestens 123,6 % von Welle 1 erreichen. Das ist eine Warnung, kein sicherer Fehler.',
  ok:v=>L(v,3)>=1.236*L(v,1)},
 'W5-3':{page:null,where:'Regelwerk, Abschnitt Welle 5',hard:0,wave:'5',name:'Welle 5 erreicht weniger als 38,2 %',
  hint:'Miss Welle 5 mit der Fibonacci-Expansion über den Start von Welle 1 und die Enden von Welle 3 und 4.',
  ex:'Harte Orientierung: Welle 5 sollte mindestens 38,2 % erreichen (Expansion über den Start von Welle 1 sowie die Enden von Welle 3 und 4). Das ist eine Warnung, kein sicherer Fehler.',
  ok:v=>L(v,5)>=.382*(v[3]-v[0])}
};
const ZZR={ // Zigzag: Punkte 0, A, B, C (Abwärtskorrektur, im Aufwärtsfall spiegelbildlich)
 'ZZ-2':{page:42,hard:1,wave:'B',name:'Welle B überschreitet den Start von Welle A',
  hint:'Schau auf das Ende von Welle B: Wie weit läuft sie gegen Welle A zurück?',
  ex:'Welle B darf den Startpunkt der Welle A nicht überschreiten (bei steigenden Preisen: nicht unterschreiten).',
  ok:u=>u[2]<u[0]},
 'ZZ-3':{page:42,hard:1,wave:'C',name:'Welle C endet nicht jenseits vom Ende der Welle A',
  hint:'Vergleiche das Ende von Welle C mit dem Ende von Welle A.',
  ex:'Welle C muss unter dem Endpunkt der Welle A enden (bei steigenden Preisen: darüber).',
  ok:u=>u[3]<u[1]}
};
// Regeltexte passend zur Chartrichtung (Lenny, 26.10.2026): Klammern zur Gegenrichtung entfallen, und bei gespiegeltem Chart
// werden Richtungswörter getauscht (unter ↔ über, Tief ↔ Hoch …).
let FLIP=false;
const MSW=[['unterschreiten','überschreiten'],['unterschreitet','überschreitet'],['unterhalb','oberhalb'],['unter','über'],['Tiefs','Hochs'],['Tief','Hoch'],
 ['tiefer','höher'],['darunter','darüber'],['fallenden','steigenden'],['fallende','steigende'],['Abwärtstrend','Aufwärtstrend'],['abwärts','aufwärts']];
const MRX=new RegExp('(?<![\\wäöüÄÖÜß])('+MSW.flat().join('|')+')(?![\\wäöüÄÖÜß])','g'),MMAP=Object.fromEntries(MSW.flatMap(([a,b])=>[[a,b],[b,a]]));
const mt=s=>{if(typeof s!=='string')return s;
 s=s.replace(/ ?\((?:im (?:Abwärts|Aufwärts)trend|bei (?:steigenden|fallenden) Preisen)[^)]*\)/g,'');
 return FLIP?s.replace(MRX,w=>MMAP[w]):s};
const pct=x=>(Math.round(x*1000)/10).toString().replace('.',',')+' %';
const PAT={
 imp:{key:'imp',title:'Impuls',labels:['0','1','2','3','4','5'],waves:['1','2','3','4','5'],rules:IMPR,viol:['IMP-1','IMP-2','IMP-3'],
  sign:p=>p[1]>=p[0]?1:-1, // Richtung: Welle 1 bestimmt den Trend
  endMsg:'Der Chart endet im Extrem von Welle 5. Setze Punkt 5 an das letzte Hoch (im Abwärtstrend: Tief) des Charts.',
  info:v=>'<p class="mut">Orientierung: Welle 2 lief '+pct(L(v,2)/L(v,1))+' zurück (häufig 50, 61,8 oder 78,6 %), Welle 4 '+pct(L(v,4)/L(v,3))+' (häufig 38,2 oder 50 %).'+(v[5]<v[3]?' Welle 5 endet unter dem Hoch von Welle 3: eine Truncation, die in echten Charts selten vorkommt.':'')+'</p>'},
 zig:{key:'zig',title:'Zigzag',labels:['0','A','B','C'],waves:['A','B','C'],rules:ZZR,viol:['ZZ-2','ZZ-3'],
  sign:p=>p[1]<=p[0]?1:-1, // Richtung: Welle A bestimmt die Korrektur
  struct:u=>u[1]<u[0]&&u[2]>u[1]&&u[3]<u[2], // App-Vorgabe: A und C laufen in eine Richtung, B dagegen
  structMsg:'Bei einem Zigzag laufen A und C in dieselbe Richtung, B läuft dagegen. Prüfe die Richtung deiner Punkte.',
  endMsg:'Der Chart endet im Extrem von Welle C. Setze Punkt C an das letzte Tief (bei steigenden Preisen: Hoch) des Charts.',
  info:v=>'<p class="mut">Orientierung: Welle B lief '+pct(L(v,2)/L(v,1))+' von A zurück (maximal knapp unter 100 %), Welle C erreicht '+pct(L(v,3)/L(v,1))+' von A (häufig 100 %, zwischen 61,8 und 161,8 %).</p><p class="mut">Hinweis: Dass A und C fünfteilig sind, prüft die App erst in der späteren Subwellen-Stufe.</p>'}
};
