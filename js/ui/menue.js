/* js/ui/menue.js – Musterwahl nach Stufen (STUFEN, pick), Moduswahl (go), Knöpfe Hauptmenü und Logo.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Schwierigkeitsstufen sind nur eine Empfehlung: Jeder darf alles frei wählen. Die empfohlene Stufe folgt dem Level (alle 50 Punkte).
// Stufe 1: Impuls, Zigzag. Stufe 2: Flats, Dreiecke, Diagonalen. Stufe 3: Double Zigzag, Dreifache Form (Lenny, 26.10.2026: vorher „Stufe 4“).
// Interne Nummern für die Empfehlung: 3 = „Subwellen zählen“ (eigener Modus, ohne Stufennummer), 4 = Stufe 3 der Musterliste.
const STUFEN=[[1,'Stufe 1 · Einsteiger',[['imp','Impuls'],['zig','Zigzag']]],
 [2,'Stufe 2 · Fortgeschritten',[['fr','Regular Flat'],['fe','Expanded Flat'],['fru','Running Flat'],['trk','Kontrahierendes Dreieck'],['tre','Expandierendes Dreieck'],['dl','Leading Diagonale'],['db','Beendende Diagonale'],['de','Expandierende Diagonale']]],
 [4,'Stufe 3 · Profi',[['dz','Double Zigzag'],['tz','Dreifache Form']]]];
const recStage=()=>{const lv=Math.floor(st.pts/50)+1;return lv<2?1:lv<4?2:lv<6?3:4};
const STUFENNAME={1:'Stufe 1 (Impuls, Zigzag)',2:'Stufe 2 (Flats, Dreiecke, Diagonalen)',3:'Subwellen zählen',4:'Stufe 3 (Double Zigzag, Dreifache Form)'};
// Musterwahl, gruppiert nach Stufe; die empfohlene Stufe ist markiert
function pick(mode){
 const rec=recStage();
 const fl=FLV(); // Fehler finden: Schwierigkeit (14.11.2026, Lenny)
 $('#view').innerHTML='<div class="card"><h2>'+(mode==='count'?'Chart durchzählen':mode==='sub'?'Subwellen zählen':'Fehler finden')+'</h2>'+
  (mode==='find'?'<p><b>Schwierigkeit</b></p><p class="fflv">'+[['leicht','Leicht'],['schwer','Schwer']].map(([k,l])=>'<button data-fl="'+k+'" class="'+(fl===k?'on':'')+'" aria-pressed="'+(fl===k)+'">'+l+'</button>').join('')+'</p><p class="mut">'+(fl==='schwer'?'Du wählst die Welle und beschreibst in eigenen Worten, was falsch ist.':'Du wählst die Welle und die verletzte Regel aus einer Liste.')+'</p>':'')+
  '<p><b>Muster wählen</b></p>'+
  STUFEN.map(([n,t,items])=>'<p class="mut" style="margin:10px 0 0">'+t+(n===rec?' · <b>Empfohlen</b>':'')+'</p>'+items.map(([k,l])=>'<button class="p" onclick="go(\''+mode+'\',\''+k+'\')">'+l+'</button>').join('')).join('')+
  '<p><button onclick="home()">Zurück</button></p></div>';
 document.querySelectorAll('[data-fl]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('waveChecker.findLvl',b.dataset.fl)}catch(e){}pick('find')});
}
function go(mode,key){mode==='count'?count(PAT[key]):mode==='sub'?sub(key):SUBOK.includes(key)?findSub(key,FLV()):find(PAT[key])}
$('#menu').onclick=()=>home();
$('#home').onclick=()=>home();$('#home').onkeydown=e=>{if(e.key==='Enter')home()};
