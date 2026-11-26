/* js/speicher.js – Spielstand im Browser (localStorage): Punkte und Serie (SAVE, st, saveProgress), unterbrochene Runde (RESKEY),
   Handy-Pfad (PKEY), Tagesaufgabe (DKEY, dLoad, dSave, dStreak), Ränge (RKEY, exSolved, rNeeds, rankCheck) und neue
   Rangaufstiege (RNKEY, rnPush). Schlüssel nie ändern, sonst gehen Spielstände verloren. Weitere Schlüssel stehen in den
   Modus-Dateien (Übersicht in CLAUDE.md).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- 4) Spiel
// Fortschritt (Punkte, Serie) bleibt lokal im Browser gespeichert, ohne Konto. Das Level ergibt sich aus den Punkten.
// Erlaubt der Browser kein Speichern (z. B. privates Fenster), läuft die App ohne Speichern normal weiter (try/catch).
const SAVE='waveChecker.progress';
const st=(()=>{try{const s=JSON.parse(localStorage.getItem(SAVE));
 if(s&&Number.isFinite(s.pts)&&Number.isFinite(s.streak))return{pts:Math.max(0,s.pts),streak:Math.max(0,s.streak)}}catch(_){}
 return{pts:0,streak:0}})();
const saveProgress=()=>{try{localStorage.setItem(SAVE,JSON.stringify({pts:st.pts,streak:st.streak}))}catch(_){}};
// Unterbrechung (Lenny, 26.10.2026): Eine angefangene Quiz- oder Blitz-Runde bleibt gespeichert (waveChecker.resume, höchstens 1 Tag)
// und kann auf der Startseite fortgesetzt werden. Die Tagesaufgabe merkt sich gesetzte Punkte selbst (dLoad).
const RESKEY='waveChecker.resume';
const resLoad=()=>{try{const o=JSON.parse(localStorage.getItem(RESKEY));return o&&Date.now()-o.at<864e5?o:null}catch(_){return null}};
const resSave=o=>{try{localStorage.setItem(RESKEY,JSON.stringify({...o,at:Date.now()}))}catch(_){}};
const resDrop=()=>{try{localStorage.removeItem(RESKEY)}catch(_){}};
// ---- Startseite Handy (unter 700 px): „Wellen-Pfad“ statt Inseln (Lenny, 26.10.2026; DESIGN.md Abschnitt 10).
// Ein gekippter Kerzenchart (Zeit nach unten, steigender Kurs nach rechts) bildet einen regelkonformen Impuls; die Modi sind Stationen darauf.
// Eine Station ist erledigt, sobald dort eine Runde abgeschlossen wurde (Lernbereich: geöffnet, Ränge: angesehen); gespeichert in waveChecker.path.
const PKEY='waveChecker.path';
const pLoad=()=>{try{return JSON.parse(localStorage.getItem(PKEY))||{}}catch(_){return{}}};
// Speicherung lokal im Browser: {last: letzter gelöster Tag, streak: Tages-Serie, day: {date, tries (Fehlversuche), tips, done, solved, bonus}}
const DKEY='waveChecker.daily';
const dLoad=()=>{try{return JSON.parse(localStorage.getItem(DKEY))||{}}catch(_){return{}}};
const dSave=o=>{try{localStorage.setItem(DKEY,JSON.stringify(o))}catch(_){}};
const dStreak=(o,today)=>o.last===today||o.last===addDays(today,-1)?o.streak||0:0; // zählt nur, wenn gestern oder heute gelöst
// ---- 8) Ränge pro Kategorie (Bronze, Silber, Gold, Platin) und Gesamtrang „Elliott-Meister“.
// Quelle: Quiz-Daten (waveChecker.quiz) und gelöste Übungen (waveChecker.ranks, gezählt ab RSTART).
// Ein erreichter Rang geht nicht verloren (gespeichert in rank).
const RKEY='waveChecker.ranks',RSTART='23.10.2026';
const RCATS=['Grundbegriffe & Fibonacci','Impuls','Zigzag','Flats','Dreiecke','Diagonalen','Komplexe Korrekturen'];
const RCAT={imp:'Impuls',zig:'Zigzag',fr:'Flats',fe:'Flats',fru:'Flats',trk:'Dreiecke',tre:'Dreiecke',dl:'Diagonalen',db:'Diagonalen',de:'Diagonalen',dz:'Komplexe Korrekturen',tz:'Komplexe Korrekturen'};
const RIN={'Grundbegriffe & Fibonacci':'in Grundbegriffen & Fibonacci','Impuls':'in Impulsen','Zigzag':'in Zigzags','Flats':'in Flats','Dreiecke':'in Dreiecken','Diagonalen':'in Diagonalen','Komplexe Korrekturen':'in komplexen Korrekturen'};
const RNAME=['Noch kein Rang','Bronze','Silber','Gold','Platin'],REMO=['','🥉','🥈','🥇','💎'];
const rLoad=()=>{try{return JSON.parse(localStorage.getItem(RKEY))||{}}catch(_){return{}}}; // {ex:{Kategorie:{solved,noTip,hard}}, rank:{Kategorie:1..4}, master:true}
const rSave=o=>{try{localStorage.setItem(RKEY,JSON.stringify(o))}catch(_){}};
// Eine richtig abgeschlossene Runde (alle Spielmodi), zugeordnet nach dem Muster des Charts
function exSolved(key,tips,hard){const cat=RCAT[key];if(!cat)return;const o=rLoad();o.ex=o.ex||{};
 const e=o.ex[cat]=o.ex[cat]||{solved:0,noTip:0,hard:0};e.solved++;if(!tips)e.noTip++;if(hard)e.hard++;rSave(o);rankCheck();}
// Anforderungen des nächsten Rangs als Liste {have, need, txt}; or=true: eine davon reicht (Bronze)
function rNeeds(cat,lv){const q=(qLoad().cats||{})[cat]||{},e=(rLoad().ex||{})[cat]||{solved:0,noTip:0,hard:0},l=q.last||[],
 rate=l.length?l.reduce((a,b)=>a+b,0)/l.length:0,qc=q.correct||0,pct=x=>Math.round(x*100)+' %',R=(have,need,txt)=>({have,need,txt});
 const quiz=n=>R(rate,n,'mind. '+pct(n)+' im Quiz (aktuell '+pct(rate)+')');
 if(cat==='Grundbegriffe & Fibonacci'){const n=[10,25,50,100][lv-1],a=[R(qc,n,'Noch '+(n-qc)+' richtige Quiz-Antworten')];if(lv>1)a.push(quiz([0,0,.7,.8,.9][lv]));return{list:a}}
 if(lv===1)return{or:true,list:[R(qc,10,'Noch '+(10-qc)+' richtige Quiz-Antworten'),R(e.solved,10,(10-e.solved)+' gelöste Übungen')]};
 const n=[0,0,30,50,100][lv],a=[R(e.solved,n,'Noch '+(n-e.solved)+' gelöste Übungen'),quiz([0,0,.7,.8,.9][lv])];
 if(lv===3)a.push(R(e.noTip,10,'noch '+(10-e.noTip)+' Übungen ohne Tipp'));
 if(lv===4)a.push(R(e.hard,20,'noch '+(20-e.hard)+' Übungen in „Muster erkennen – Schwer“ oder der Tagesaufgabe'));
 return{list:a};}
const rMet=x=>x.or?x.list.some(r=>r.have>=r.need):x.list.every(r=>r.have>=r.need);
function rCalc(cat){let lv=0;while(lv<4&&rMet(rNeeds(cat,lv+1)))lv++;return lv}
// Neue Ränge speichern und einblenden; quiet: ohne Einblendung
function rankCheck(quiet){const o=rLoad();o.rank=o.rank||{};const msgs=[];
 RCATS.forEach(c=>{const old=o.rank[c]||0,lv=Math.max(old,rCalc(c));if(lv>old){o.rank[c]=lv;rnPush(c,old,lv);msgs.push('Neuer Rang: '+RNAME[lv]+' '+RIN[c]+'!')}});
 if(!o.master&&RCATS.every(c=>(o.rank[c]||0)>=3)){o.master=true;rnPush('m',0,4);msgs.push('Neuer Gesamtrang: Elliott-Meister!')}
 rSave(o);if(msgs.length&&!quiet)toast(msgs.join('<br>'));}
// ---- Neue Rangaufstiege (23.11.2026, Lenny): Abzeichen an der Ränge-Insel bzw. Station, Aufstiegs-Ansicht vor der Ränge-Seite.
// localStorage waveChecker.rankNew = {l:[{c:Kategorie oder 'm' (Elliott-Meister), f:alter Rang, t:neuer Rang}], pop:Anzahl, die schon aufgeploppt ist}.
// Steigt eine Kategorie erneut, bevor man hingeschaut hat, wird ihr Eintrag erweitert (Bronze → Gold statt zwei Karten).
const RNKEY='waveChecker.rankNew';
const rnLoad=()=>{try{const o=JSON.parse(localStorage.getItem(RNKEY));if(o&&Array.isArray(o.l))return o}catch(_){}return{l:[],pop:0}};
const rnSave=o=>{try{localStorage.setItem(RNKEY,JSON.stringify(o))}catch(_){}};
function rnPush(c,f,t){const o=rnLoad(),e=o.l.find(x=>x.c===c);if(e)e.t=Math.max(e.t,t);else o.l.push({c,f,t});rnSave(o)}
const rnCount=()=>rnLoad().l.length;
