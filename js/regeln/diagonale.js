/* js/regeln/diagonale.js – Regeln für Diagonalen (Leading, Beendend, Expandierend: DIAG-, DL-, DB-, DE-), Muster PAT.dl/db/de.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Diagonalen (Punkte 0 bis 5): Überlappung von Welle 1 und 4 ist das Kennzeichen. Leading, Beendend, Expandierend.
const OVL={page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'4',name:'Welle 4 überlappt Welle 1 nicht',
 hint:'Prüfe, ob Welle 4 in das Preisterritorium von Welle 1 hineinläuft.',
 ex:'Bei einer Diagonale überlappen sich die Wellen 1 und 4: Welle 4 läuft in das Preisterritorium der Welle 1 hinein.',
 ok:u=>u[4]<u[1]};
// Fortschritt (DIAG-5, Lenny 21.10.2026): Ohne diese Regel erfüllte ein seitwärts laufendes Dreieck rechnerisch alle Diagonalen-Regeln.
const DPROG={page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'3',name:'Die Diagonale kommt nicht voran',
 hint:'Vergleiche die Enden der Wellen 1, 3 und 5: Endet jede höher als die davor?',
 ex:'Bei einer Diagonale endet Welle 3 über dem Ende der Welle 1 und Welle 5 über dem Ende der Welle 3 (im Abwärtstrend spiegelbildlich).',
 ok:u=>u[3]>u[1]&&u[5]>u[3]};
const W3KURZ=a=>({page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'3',name:'Welle 3 ist die kürzeste Impulswelle',
 hint:'Vergleiche die Längen der Wellen 1, 3 und 5.',ex:'Welle 3 darf bei der '+a+' niemals die kürzeste der Impulswellen sein.',
 ok:u=>!(L(u,3)<L(u,1)&&L(u,3)<L(u,5))});
const DIAG6={...IMPR['IMP-1'],page:null,where:'Regelwerk, Abschnitt Diagonale',
 ex:'Auch bei einer Diagonale darf Welle 2 den Startpunkt der Welle 1 nicht unterschreiten (im Abwärtstrend: nicht überschreiten).'};
const DRL={
 dl:{'IMP-1':DIAG6,'DIAG-2':OVL,'DIAG-5':DPROG,
  'DL-4':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'3',name:'Welle 1 ist nicht die längste Welle',
   hint:'Vergleiche Welle 1 mit Welle 3 und Welle 5: Ist sie die längste?',ex:'Bei der Leading Diagonale ist Welle 1 die längste der trendgebenden Wellen 1, 3 und 5.',
   ok:u=>L(u,1)>L(u,3)&&L(u,1)>L(u,5)},
  'DL-6':W3KURZ('Leading Diagonale'),
  'DL-8':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'5',name:'Welle 5 ist nicht kürzer als Welle 3',
   hint:'Vergleiche Welle 5 mit Welle 3.',ex:'Bei der Leading Diagonale muss Welle 5 kürzer als Welle 3 sein. Gleich lang reicht nicht.',
   ok:u=>L(u,5)<L(u,3)}},
 db:{'IMP-1':DIAG6,'DIAG-2':OVL,'DIAG-5':DPROG,
  'DB-8':W3KURZ('Beendenden Diagonale'),
  'DB-10':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'5',name:'Welle 5 ist nicht kürzer als Welle 3',
   hint:'Vergleiche Welle 5 mit Welle 3.',ex:'Bei der Beendenden Diagonale darf Welle 5 nicht länger als Welle 3 sein (maximal 99,9 % von Welle 3).',
   ok:u=>L(u,5)<L(u,3)},
  'DB-4':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'3',name:'Welle 3 ist nicht kürzer als Welle 1',
   hint:'Vergleiche Welle 3 mit Welle 1.',ex:'Bei der Beendenden Diagonale ist Welle 3 kürzer als Welle 1.',
   ok:u=>L(u,3)<L(u,1)}},
 de:{'IMP-1':DIAG6,'DIAG-2':OVL,'DIAG-5':DPROG,
  'DE-3':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'3',name:'Die Wellen 1, 3 und 5 werden nicht immer länger',
   hint:'Vergleiche die Längen der Wellen 1, 3 und 5: Wird jede länger als die davor?',
   ex:'Bei der Expandierenden Diagonale werden die Wellen immer länger: Welle 1 ist die kürzeste, Welle 5 die längste.',
   ok:u=>L(u,1)<L(u,3)&&L(u,3)<L(u,5)},
  // Welle-4-Retracement der Expandierenden Diagonale (Lenny, 20.10.2026), gemessen über Start- und Endpunkt der Welle 3
  'DE-9':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:1,wave:'4',name:'Welle 4 retraced mehr als 99,9 % der Welle 3',
   hint:'Miss, wie weit Welle 4 von Start bis Ende der Welle 3 zurückläuft.',
   ex:'Harte Grenze: Bei der Expandierenden Diagonale darf Welle 4 höchstens 99,9 % der Welle 3 retracen.',
   ok:u=>L(u,4)/L(u,3)<=.999},
  'DE-9o':{page:null,where:'Regelwerk, Abschnitt Diagonale',hard:0,lvl:'o',wave:'4',name:'Welle 4 retraced nicht zwischen 50 % und 88,7 %',
   hint:'Miss, wie weit Welle 4 von Start bis Ende der Welle 3 zurückläuft.',
   ex:'Meist retraced Welle 4 zwischen 50 % und 88,7 % der Welle 3, am häufigsten 61,8 % (Orientierung, kein Fehler).',
   ok:u=>{const r=L(u,4)/L(u,3);return r>=.5&&r<=.887}}}
};
const RET=v=>'Orientierung: Welle 2 lief '+pct(L(v,2)/L(v,1))+' zurück, Welle 4 '+pct(L(v,4)/L(v,3))+' (häufig 61,8 %).';
const diagPat=(key,title,viol,implied,info)=>({key,title,labels:['0','1','2','3','4','5'],waves:['1','2','3','4','5'],rules:DRL[key],viol,implied,
 sign:PAT.trk.sign,struct:PAT.trk.struct,structMsg:'Bei einer Diagonale laufen die Wellen 1, 3 und 5 in Trendrichtung, die Wellen 2 und 4 dagegen. Prüfe die Richtung deiner Punkte.',
 endMsg:PAT.imp.endMsg,info});
PAT.dl=diagPat('dl','Leading Diagonale',['DIAG-2','DL-4','DL-8'],{'DL-8':['DL-6']},
 v=>'<p class="mut">'+RET(v)+'</p><p class="mut">Hinweis: Dass die Wellen als 5-3-5-3-5 oder 3-3-3-3-3 aufgebaut sind, prüft die App erst in der späteren Subwellen-Stufe.</p>');
PAT.db=diagPat('db','Beendende Diagonale',['DIAG-2','DB-10','DB-4'],{'DB-10':['DB-8']},
 v=>'<p class="mut">'+RET(v)+(L(v,1)>=Math.max(L(v,2),L(v,3),L(v,4),L(v,5))?'':' Welle 1 ist meist die längste der fünf Wellen.')+'</p><p class="mut">Hinweis: Dass jede der fünf Wellen dreiteilig ist, prüft die App erst in der späteren Subwellen-Stufe.</p>');
PAT.de=diagPat('de','Expandierende Diagonale',['DIAG-2','DE-3','DE-9'],{},
 v=>'<p class="mut">'+RET(v)+'</p><p class="mut">Hinweis: Dass jede der fünf Wellen dreiteilig ist, prüft die App erst in der späteren Subwellen-Stufe.</p>');
