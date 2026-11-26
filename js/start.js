/* js/start.js – Start der App, als letztes Skript: Hauptmenü-Knopf um die Modus-Funktionen legen (braucht alle Dateien davor),
   Testzugriff TUTS, Tutorial-Texte laden, Startseite zeigen.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Hauptmenü-Button: erscheint, sobald ein Modus gestartet wird (pick, recognize, pickSub), und verschwindet im Hauptmenü
['pick','recognize','pickSub','daily','ranks','ranksOpen','dailyCal','progn','blitz','blitzKap','pathBlitz','ownChart'].forEach(n=>{const f=window[n];window[n]=function(){$('#menu').hidden=false;window.scrollTo(0,0);return f.apply(this,arguments)}});
{const h0=home;window.home=function(){TUTCTX=null;$('#menu').hidden=true;window.scrollTo(0,0);return h0()}}
{const h1=window.home;window.home=function(){LEARN=PEEK=null;$('#tolearn').hidden=true;return h1.apply(this,arguments)}} // Hauptmenü verlässt Lernseite und „Jetzt üben“ endgültig
window.TUTS=()=>TUT&&{key:TUT.ctx.key,i:TUT.i,id:TUT.c&&TUT.c.s.id,act:!!(TUT.c&&TUT.c.act),seen:!!(TUT.c&&TUT.c.seen),done:!!(TUT.c&&TUT.c.done),ids:TUT.ids.slice(),
 hand:TUT.c&&TUT.c.seen&&TUT.c.d.hand?tutPt(TUT.c.d.hand):null,steps:TUT.L.map(s=>s.id)}; // Testzugriff (tests/tutorial.js)
tutLoad();
stats();home();rankCheck(); // bisherige Quiz-Daten zählen mit
if(location.hash==='#fehlertexte')fehlerTexte(); // versteckte Übersicht der nicht erkannten Antworten (Fehler finden Schwer)
