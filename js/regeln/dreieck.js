/* js/regeln/dreieck.js – Regeln für Dreiecke (kontrahierend, expandierend: DRE-), Muster PAT.trk/tre.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Dreiecke (Punkte 0, A, B, C, D, E): fünf dreiteilige Wellen. Kontrahierend oder expandierend.
const TRR={
 trk:{'DRE-7':{page:50,hard:1,wave:'B',name:'Eine Welle ist nicht kürzer als die vorangegangene',
  hint:'Vergleiche die Längen der fünf Wellen: Wird jede Welle kürzer als die davor?',
  ex:'Beim kontrahierenden Dreieck ist Welle A die längste der fünf Wellen, und jede Welle ist kürzer als die vorangegangene.',
  ok:u=>L(u,1)>L(u,2)&&L(u,2)>L(u,3)&&L(u,3)>L(u,4)&&L(u,4)>L(u,5)}},
 tre:{'DRE-8':{page:50,hard:1,wave:'B',name:'Eine Welle ist nicht länger als die vorangegangene',
  hint:'Vergleiche die Längen der fünf Wellen: Wird jede Welle länger als die davor?',
  ex:'Beim expandierenden Dreieck ist Welle A die kürzeste der fünf Wellen, und jede Welle ist länger als die vorangegangene.',
  ok:u=>L(u,1)<L(u,2)&&L(u,2)<L(u,3)&&L(u,3)<L(u,4)&&L(u,4)<L(u,5)}}
};
const triPat=(key,title,viol)=>({key,title,labels:['0','A','B','C','D','E'],waves:['A','B','C','D','E'],rules:TRR[key],viol,
 sign:p=>p[1]>=p[0]?1:-1,
 struct:u=>u[1]>u[0]&&u[2]<u[1]&&u[3]>u[2]&&u[4]<u[3]&&u[5]>u[4], // App-Vorgabe: die Richtung wechselt von Welle zu Welle
 structMsg:'Bei einem Dreieck wechselt die Richtung von Welle zu Welle: A, C und E laufen in eine Richtung, B und D dagegen. Prüfe die Richtung deiner Punkte.',
 endMsg:'Der Chart endet im Extrem von Welle E. Setze Punkt E an das letzte Hoch bzw. Tief des Charts.',
 info:v=>'<p class="mut">Orientierung: Dreiecke verlaufen meist flach und treten häufig in Welle 4 auf. Verhältnisse: B '+pct(L(v,2)/L(v,1))+' von A, C '+pct(L(v,3)/L(v,2))+' von B, D '+pct(L(v,4)/L(v,3))+' von C, E '+pct(L(v,5)/L(v,4))+' von D.</p><p class="mut">Hinweis: Dass jede der fünf Wellen dreiteilig ist, prüft die App erst in der späteren Subwellen-Stufe.</p>'});
PAT.trk=triPat('trk','Kontrahierendes Dreieck',['DRE-7']);
PAT.tre=triPat('tre','Expandierendes Dreieck',['DRE-8']);
