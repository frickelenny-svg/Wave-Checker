/* js/regeln/kombination.js – Regeln für komplexe Korrekturen (Double Zigzag W-X-Y, Dreifache Form W-X-Y-X-Z: WX-, KOM-, DRE-1), Muster PAT.dz/tz.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Komplexe Korrekturen: Double Zigzag (0, W, X, Y) und Dreifache Form (0, W, X1, Y, X2, Z). Aufbau je Teil als eigenes Korrekturmuster.
const WXW='Regelwerk, Abschnitt Welle X';
const wx2=(a,b,wave,name,wname)=>({page:null,where:WXW,hard:1,wave,name,hint:'Schau, wie weit '+name.split(' retraced')[0].replace(/^Die/,'die')+' gegen '+wname+' zurückläuft.',
 ex:'Welle X muss unter 100 % der vorangegangenen Welle bleiben. Eine überschießende Welle X lässt das Regelwerk nicht zu. Bis knapp unter 100 % (z. B. 99,9 %) ist erlaubt, aber ein starkes Warnsignal.',
 ok:u=>L(u,a)/L(u,b)<1});
// Starkes Warnsignal (kein Regelbruch): X läuft fast bis zum Start der Vorwelle zurück. Grenze 88,7 % laut WX-2 (von Lenny bestätigt).
const wx2w=(a,b,wave,name)=>({page:null,where:WXW,hard:0,wave,name,hint:'Schau, wie nah Welle X am Start der vorangegangenen Welle endet.',
 ex:'Starkes Warnsignal: Ein Rücklauf von Welle X über 88,7 % bis knapp unter 100 % ist erlaubt, spricht aber deutlich gegen die Zählung. Das ist kein sicherer Fehler.',ok:u=>L(u,a)/L(u,b)<=.887});
const wx3=(a,b,wave,name)=>({page:null,hard:0,wave,name,hint:'Vergleiche die Länge der Welle X mit der vorangegangenen Welle.',
 ex:'Harte Orientierung: Welle X sollte mindestens 38,2 % der vorangegangenen Welle erreichen. Das ist eine Warnung, kein sicherer Fehler.',
 ok:u=>L(u,a)/L(u,b)>=.382});
const CXR={
 dz:{'WX-2':wx2(2,1,'X','Welle X retraced 100 % oder mehr der Welle W','Welle W'),'WX-2w':wx2w(2,1,'X','Welle X retraced über 88,7 % der Welle W'),'WX-3':wx3(2,1,'X','Welle X erreicht weniger als 38,2 % der Welle W')},
 tz:{'WX-2':wx2(2,1,'X1','Die erste Welle X retraced 100 % oder mehr der Welle W','Welle W'),
     'WX-2b':wx2(4,3,'X2','Die zweite Welle X retraced 100 % oder mehr der Welle Y','Welle Y'),
     'WX-2w':wx2w(2,1,'X1','Die erste Welle X retraced über 88,7 % der Welle W'),'WX-2wb':wx2w(4,3,'X2','Die zweite Welle X retraced über 88,7 % der Welle Y'),
     'WX-3':wx3(2,1,'X1','Die erste Welle X erreicht weniger als 38,2 % der Welle W'),
     'WX-3b':wx3(4,3,'X2','Die zweite Welle X erreicht weniger als 38,2 % der Welle Y')}
};
// Regel auf Ebene der Teilmuster (nur im Modus „Fehler finden“, dort sind die Muster der Teile im Chart beschriftet). ok ist hier immer wahr, geprüft wird über nameFails.
const DRE1={page:50,hard:1,wave:'W',name:'Dreieck in Welle W',hint:'Schau, welches Muster in Welle W steht. Gibt es ein Muster, das dort nie vorkommt?',
 ex:'Dreiecke treten niemals in Welle 2, C und W auf.',ok:()=>true};
CXR.dz['DRE-1']=DRE1;CXR.tz['DRE-1']=DRE1;
// Welle Z darf (selten) ein Dreieck sein (WZ-1, Lenny 10.11.2026, Regelwerk Version 15). Die Regel „Dreieck in Welle Z“ vom 20.10.2026 entfällt.
// Fortschritt (KOM-4): Y sollte unter W enden, Z unter Y. Seit 22.10.2026 nur harte Orientierung (Lenny: in seltenen Fällen
// bilden Y und Z kein neues Tief), also Warnung statt Fehler. Der Generator (genCx) erzeugt solche Charts selten (ca. 5 %).
CXR.tz['KOM-4']={page:null,where:'Regelwerk, Abschnitt Komplexe Korrekturen',hard:0,wave:'Y',name:'Die Dreifache Form kommt nicht voran',
 hint:'Vergleiche die Enden der Wellen W, Y und Z: Endet jede tiefer als die davor?',
 ex:'Harte Orientierung: Bei W-X-Y-X-Z sollte Welle Y unter dem Ende der Welle W und Welle Z unter dem Ende der Welle Y enden (bei steigenden Preisen spiegelbildlich). In seltenen Fällen bilden Y und Z kein neues Tief. Das ist eine Warnung, kein sicherer Fehler.',
 ok:u=>u[3]<u[1]&&u[5]<u[3]};
// KOM-5 (Lenny 22.10.2026): Y und Z dürfen nicht beide versagen, mindestens eine bildet ein neues Tief. Harte Regel.
// genCx verwirft solche Charts automatisch (check enthält KOM-5); der seltene KOM-4-Fall hat daher nur eine versagende Welle.
CXR.tz['KOM-5']={page:null,where:'Regelwerk, Abschnitt Komplexe Korrekturen',hard:1,wave:'Z',name:'Y und Z bilden beide kein neues Tief',
 hint:'Vergleiche die Enden der Wellen W, Y und Z: Schafft mindestens eine der Wellen Y und Z ein neues Tief?',
 ex:'Bei W-X-Y-X-Z dürfen Y und Z nicht beide versagen: Mindestens eine muss ein neues Tief bilden (Y unter dem Ende von W oder Z unter dem Ende von Y, bei steigenden Preisen spiegelbildlich).',
 ok:u=>u[3]<u[1]||u[5]<u[3]};
const ARTEN=['Zigzag','Regular Flat','Expanded Flat','Running Flat','Dreieck']; // mögliche Muster der Teile; dasselbe Muster darf mehrfach vorkommen (KOM-1 laut Klarstellung von Lenny)
// Muster der Teile prüfen: liefert die verletzten Regel-IDs

const HCX='<p class="mut">Hinweis: Dass jeder Teil seine eigene innere Struktur hat, siehst du im Modus „Fehler finden“, dort sind die Muster der Teile beschriftet.</p>';
PAT.dz={key:'dz',title:'Double Zigzag (W-X-Y)',labels:['0','W','X','Y'],waves:['W','X','Y'],rules:CXR.dz,viol:['WX-2','DRE-1'],parts:['W','X','Y'],partLeg:[0,1,2],
 sign:PAT.zig.sign,struct:PAT.zig.struct,structMsg:'Bei W-X-Y laufen W und Y in dieselbe Richtung, X läuft dagegen. Prüfe die Richtung deiner Punkte.',
 endMsg:'Der Chart endet im Extrem von Welle Y. Setze Punkt Y an das letzte Tief (bei steigenden Preisen: Hoch) des Charts.',
 info:v=>'<p class="mut">Orientierung: Welle X lief '+pct(L(v,2)/L(v,1))+' von W zurück (häufig 61,8 %, mindestens 38,2 %, unter 100 %). Welle Y erreicht '+pct(L(v,3)/L(v,1))+' von W (häufig 100 %, zwischen 61,8 % und 261,8 %).</p>'+HCX};
PAT.tz={key:'tz',title:'Dreifache Form (W-X-Y-X-Z)',labels:['0','W','X1','Y','X2','Z'],waves:['W','X1','Y','X2','Z'],rules:CXR.tz,viol:['WX-2','WX-2b','DRE-1'],parts:['W','Y','Z'],partLeg:[0,2,4],
 sign:PAT.zig.sign,struct:u=>u[1]<u[0]&&u[2]>u[1]&&u[3]<u[2]&&u[4]>u[3]&&u[5]<u[4],
 structMsg:'Bei W-X-Y-X-Z laufen W, Y und Z in eine Richtung, die beiden X dagegen. Prüfe die Richtung deiner Punkte.',
 endMsg:'Der Chart endet im Extrem von Welle Z. Setze Punkt Z an das letzte Tief (bei steigenden Preisen: Hoch) des Charts.',
 info:v=>'<p class="mut">Orientierung: Die erste Welle X lief '+pct(L(v,2)/L(v,1))+' von W zurück, die zweite '+pct(L(v,4)/L(v,3))+' von Y (häufig 61,8 %, mindestens 38,2 %, unter 100 %). Welle Y erreicht '+pct(L(v,3)/L(v,1))+' von W (häufig 100 %, zwischen 61,8 % und 261,8 %).</p>'+HCX};
