/* js/regeln/flat.js – Regeln für Flats (Regular, Expanded, Running: FR-, FE-, FRU-), Muster PAT.fr/fe/fru.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Flats (Punkte 0, A, B, C): A und B dreiteilig, C fünfteilig. Drei Varianten, jede mit eigenen Regeln.
const MIR=' (bei steigenden Preisen spiegelbildlich)';
const FLR={
 fr:{ // Regular Flat
  'FR-2':{page:46,hard:1,wave:'B',name:'Welle B überschreitet den Start von Welle A',
   hint:'Schau, wo Welle B endet: Nähert sie sich dem Start von Welle A an oder schießt sie darüber?',
   ex:'Beim Regular Flat nähert sich Welle B dem Startpunkt der Welle A an, statt ihn zu überschreiten.'+MIR,ok:u=>u[2]<u[0]},
  'FR-3':{page:46,hard:1,wave:'C',name:'Welle C endet nicht unter dem Tief von Welle A',
   hint:'Vergleiche das Ende von Welle C mit dem Ende von Welle A.',
   ex:'Beim Regular Flat endet Welle C leicht unter dem Tief von Welle A.'+MIR,ok:u=>u[3]<u[1]}},
 fe:{ // Expanded Flat
  'FE-2':{page:46,hard:1,wave:'B',name:'Welle B überschreitet den Start von Welle A nicht',
   hint:'Schau, wo Welle B endet: Kommt sie über den Start von Welle A hinaus?',
   ex:'Beim Expanded Flat überschreitet Welle B den Startpunkt der Welle A.'+MIR,ok:u=>u[2]>u[0]},
  'FE-3':{page:46,hard:1,wave:'C',name:'Welle C endet nicht unter dem Tief von Welle A',
   hint:'Vergleiche das Ende von Welle C mit dem Ende von Welle A.',
   ex:'Beim Expanded Flat endet Welle C unterhalb des Tiefs von Welle A.'+MIR,ok:u=>u[3]<u[1]}},
 fru:{ // Running Flat
  'FRU-2':{page:46,hard:1,wave:'B',name:'Welle B überschießt den Start von Welle A nicht',
   hint:'Schau, wo Welle B endet: Schießt sie über den Start von Welle A hinaus?',
   ex:'Beim Running Flat überschießt Welle B den Startpunkt der Welle A.'+MIR,ok:u=>u[2]>u[0]},
  'FRU-3':{page:46,hard:1,wave:'C',name:'Welle C bildet ein neues Tief unter Welle A',
   hint:'Vergleiche das Ende von Welle C mit dem Ende von Welle A.',
   ex:'Beim Running Flat schafft es Welle C nicht, ein neues Tief unterhalb der Welle A auszubilden. Endet C genau auf dem Tief von A, ist das kein neues Tief.'+MIR,ok:u=>u[3]>=u[1]}}
};
// Gemeinsame harte Orientierung für Welle B in Flats
const WB2={page:null,hard:0,wave:'B',name:'Welle B liegt außerhalb von 88,7 % bis 161,8 % der Welle A',
 hint:'Vergleiche die Länge von Welle B mit Welle A.',
 ex:'Harte Orientierung: Welle B retraced mindestens 88,7 % bis maximal 161,8 % der Welle A. Das ist eine Warnung, kein sicherer Fehler.',
 ok:u=>{const r=L(u,2)/L(u,1);return r>=.887&&r<=1.618}};
const flatPat=(key,title,viol)=>({key,title,labels:['0','A','B','C'],waves:['A','B','C'],rules:{...FLR[key],'WB-2':WB2},viol,
 sign:PAT.zig.sign,struct:PAT.zig.struct,structMsg:PAT.zig.structMsg,
 endMsg:'Der Chart endet im Extrem von Welle C. Setze Punkt C an das letzte Tief (bei steigenden Preisen: Hoch) des Charts.',
 info:v=>'<p class="mut">Orientierung: Welle B lief '+pct(L(v,2)/L(v,1))+' von A zurück (Regelwerk: mindestens 88,7 %, höchstens 161,8 %). Welle C erreicht '+pct(L(v,3)/L(v,1))+' von A (häufig 100 %, bis 261,8 %).</p><p class="mut">Hinweis: Dass A und B dreiteilig und C fünfteilig sind, prüft die App erst in der späteren Subwellen-Stufe.</p>'});
PAT.fr=flatPat('fr','Regular Flat',['FR-2','FR-3']);
PAT.fe=flatPat('fe','Expanded Flat',['FE-2','FE-3']);
PAT.fru=flatPat('fru','Running Flat',['FRU-2','FRU-3']);
