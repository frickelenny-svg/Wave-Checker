/* js/modi/tagesaufgabe.js – Tagesaufgabe (daily): Muster und Chart des Tages (seeded, dailyKey, dailyRound), Ergebnis, Teilen, Countdown, Kalender.
   Speicher: js/speicher.js (DKEY).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- 6) Tagesaufgabe (wie Wordle): jeden Tag eine Aufgabe im Modus „Muster erkennen – Schwer“, für alle gleich.
// Tageswechsel um Mitternacht deutscher Zeit. Muster und Chart kommen aus einem Zufallsgenerator mit dem Datum als
// Startwert, darum sieht jeder am selben Tag denselben Chart. Der normale Zufall der anderen Modi bleibt unverändert.
const DAY0='2026-10-22'; // Tagesaufgabe #1
const berlinDate=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d); // „JJJJ-MM-TT“
const addDays=(s,n)=>new Date(Date.parse(s+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);
const dayNo=s=>Math.round((Date.parse(s+'T00:00:00Z')-Date.parse(DAY0+'T00:00:00Z'))/864e5)+1;
// Zufallsgenerator mit Startwert (mulberry32), Startwert = Hash des Textes: gleicher Text → gleiche Zahlenfolge
function seeded(text){let h=1779033703^text.length;
 for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19}
 let a=h>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const DW={imp:2.5,zig:2.5,dz:2.5}; // Gewichte der Musterauswahl, alle anderen Muster 1
// Muster des Tages s. Nie zweimal hintereinander dasselbe, darum wird ab Tag #1 Tag für Tag durchgerechnet.
function dailyKey(s){let prev=null,k=null;
 for(let d=DAY0;d<=s;d=addDays(d,1)){const r=seeded('muster '+d),c=Object.keys(PAT).filter(x=>!PAT[x].noRecog&&x!==prev),
  tot=c.reduce((t,x)=>t+(DW[x]||1),0);let v=r()*tot;k=c.find(x=>(v-=DW[x]||1)<0)||c[c.length-1];prev=k}
 return k}
// Chart des Tages: Math.random wird nur während des Erzeugens durch den Generator mit Startwert ersetzt
function dailyRound(s){const P=PAT[dailyKey(s)],r0=Math.random;Math.random=seeded('chart '+s);
 try{return{P,R:makeRound(P,null)}}finally{Math.random=r0}}
const tipTxt=n=>n===1?'1 Tipp':n+' Tipps';
// Nummer mit Datum, z. B. „1 · 22.10.26“ (angezeigt als „#1 · 22.10.26“, auch im Teilen-Text)
const dLabel=s=>dayNo(s)+' · '+s.slice(8,10)+'.'+s.slice(5,7)+'.'+s.slice(2,4);
const dAtt=d=>d.solved?d.tries+1:d.tries; // Versuche insgesamt
function daily(){
 const today=berlinDate(),o=dLoad();
 if(!o.day||o.day.date!==today)o.day={date:today,tries:0,tips:0,done:false};
 const {P,R}=dailyRound(today),no=dLabel(today);
 if(o.day.done)return dailyResult(o,P,R,no);
 const D={P,R,no,tries:o.day.tries,tips:o.day.tips,
  z:o.day.z,sel:o.day.sel,fb:o.day.fb,
  save(){o.day.tries=D.tries;o.day.tips=D.tips;o.day.z=D.z;o.day.sel=D.sel;o.day.fb=D.fb;dSave(o)}, // Fehlversuche bleiben auch nach dem Neuladen gezählt
  // Gelöst wird sofort bei der regelkonformen Zählung gespeichert, nicht erst nach der Bonusfrage
  // (sonst fehlte der Tag in Kalender und Serie, wenn man vor der Bonusfrage die Seite verlässt). bonus: null = nicht beantwortet.
  solvedNow(tips){if(o.day.done)return;Object.assign(o.day,{done:true,solved:true,bonus:null,tries:D.tries,tips});
   o.hist=o.hist||{};o.hist[today]='s';o.streak=o.last===addDays(today,-1)?(o.streak||0)+1:1;o.last=today;dSave(o)},
  finish(r){if(r.solved){D.solvedNow(r.tips);o.day.bonus=!!r.bonus;o.day.tips=r.tips}
   else{Object.assign(o.day,{done:true,solved:false,bonus:false,tries:D.tries,tips:r.tips});o.hist=o.hist||{};o.hist[today]='f';o.streak=0} // Verlauf für den Kalender
   dSave(o);dailyResult(o,P,R,no)}};
 recogHard(D,D.fb);
}
// Ergebnis: Lösung im Chart, Teilen, Countdown bis zur nächsten Aufgabe
function dailyResult(o,P,R,no){const d=o.day,s=dStreak(o,d.date);window.scrollTo(0,0);
 $('#view').innerHTML='<div class="card daily"><h2>Tagesaufgabe #'+no+'</h2><p class="'+(d.solved?'ok':'bad')+'">'+(d.solved?'Gelöst im '+dAtt(d)+'. Versuch':'Heute nicht gelöst ('+dAtt(d)+' Versuche)')+'</p>'+
  '<p>'+(d.solved?'Bonusfrage: '+(d.bonus===null?'nicht beantwortet':d.bonus?'richtig':'falsch')+' · ':'')+tipTxt(d.tips)+' · Tages-Serie: '+s+(s===1?' Tag':' Tage')+'</p>'+
  '<p><button class="p" id="share">Ergebnis teilen</button></p><p id="shareMsg" class="mut"></p><p>Nächste Aufgabe in <b id="cd">…</b></p></div>'+
  '<p class="mut">Die Lösung im Chart:</p><div class="chart">'+draw(R,[],true,P.tri?R.piv:null)+'</div><p>Generiert wurde: <b>'+P.title+'</b>. '+P.recog+'</p><p><button class="p" id="dkap">Im Regelwerk nachlesen: '+RCAT[P.key]+'</button></p><div class="card" id="cal"></div>';
  $('#dkap').onclick=()=>peek(qChap(RCAT[P.key]));$('#share').onclick=()=>shareResult(o,no);countdown(d.date);calendar($('#cal'));}
// Teilen-Text verrät das Muster nicht
function shareText(o,no){const d=o.day,s=dStreak(o,d.date);
 return 'Wave Checker Tagesaufgabe #'+no+'\n'+(d.solved?'✅ im '+dAtt(d)+'. Versuch · Bonus '+(d.bonus===null?'–':d.bonus?'✅':'❌'):'❌ nicht gelöst')+' · '+tipTxt(d.tips)+
  '\n🔥 Serie: '+s+(s===1?' Tag':' Tage')+'\n'+location.origin+'/'}
async function shareResult(o,no){shareOut(shareText(o,no),$('#shareMsg'))}
// Teilen: am Handy Teilen-Menü, sonst Zwischenablage, notfalls Text zum Selbstkopieren (auch für „Rang teilen“)
async function shareOut(t,msg){
 try{if(navigator.share&&matchMedia('(pointer:coarse)').matches){await navigator.share({text:t});return} // Handy: Teilen-Menü
  await navigator.clipboard.writeText(t);msg.textContent='Kopiert! Du kannst den Text jetzt einfügen.'}
 catch(e){if(e&&e.name==='AbortError')return; // Teilen-Menü abgebrochen
  msg.innerHTML='Kopieren hat nicht geklappt. Markiere den Text und kopiere ihn selbst:<br><textarea rows="4" style="width:100%">'+esc(t)+'</textarea>'}}
// Countdown bis Mitternacht deutscher Zeit (an den zwei Tagen der Zeitumstellung um eine Stunde ungenau)
let CD=null;
function countdown(day){clearInterval(CD);
 const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}),p2=n=>String(n).padStart(2,'0');
 const tick=()=>{const el=$('#cd');if(!el)return clearInterval(CD);
  if(berlinDate()!==day){clearInterval(CD);el.parentNode.innerHTML='<button class="p" onclick="daily()">Neue Tagesaufgabe spielen</button>';return}
  const t=Object.fromEntries(f.formatToParts(new Date()).map(x=>[x.type,+x.value])),left=86400-(t.hour*3600+t.minute*60+t.second);
  el.textContent=p2(Math.floor(left/3600))+':'+p2(Math.floor(left%3600/60))+':'+p2(left%60);};
 tick();CD=setInterval(tick,1000);}
// Karte ganz oben im Hauptmenü
function dailyCard(){const today=berlinDate(),o=dLoad(),d=o.day&&o.day.date===today?o.day:null,s=dStreak(o,today);
 return '<div class="card daily"><h2>Tagesaufgabe #'+dLabel(today)+'</h2><p class="mut">Jeden Tag ein Chart, für alle gleich: Zählweise wählen, Punkte setzen, Muster bestimmen. 3 Versuche.</p><p>'+
  (d&&d.done?(d.solved?'<b>✓ Heute gelöst</b>':'<b>✗ Heute nicht gelöst</b>'):'<b>Heute noch offen</b>'+(d&&d.tries?' · '+d.tries+' von 3 Versuchen verbraucht':''))+
  ' · Tages-Serie: '+s+(s===1?' Tag':' Tage')+'</p><button class="p" onclick="daily()">'+(d&&d.done?'Ergebnis ansehen':'Jetzt spielen')+'</button><button onclick="dailyCal()">Kalender</button></div>'}
// Kalender der Tagesaufgaben: ein Monat, Wochen von Montag bis Sonntag, je Tag gelöst / nicht gelöst / nicht gespielt.
// Verlauf in o.hist {Datum: 's'|'f'}; der heutige Tag kommt auch aus o.day (für Ergebnisse von vor dem Kalender).
const MONATE=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],WTAGE=['Mo','Di','Mi','Do','Fr','Sa','So'];
function dHist(o){const h={...(o.hist||{})};if(o.day&&o.day.done&&!h[o.day.date])h[o.day.date]=o.day.solved?'s':'f';
 if(o.last&&!h[o.last])h[o.last]='s';return h}
function calendar(el,y,m){const today=berlinDate(),h=dHist(dLoad());if(y===undefined){y=+today.slice(0,4);m=+today.slice(5,7)-1}
 const p2=n=>String(n).padStart(2,'0'),first=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7,days=new Date(Date.UTC(y,m+1,0)).getUTCDate(); // first: 0 = Montag
 const ym=y*12+m,min=+DAY0.slice(0,4)*12+ +DAY0.slice(5,7)-1,max=+today.slice(0,4)*12+ +today.slice(5,7)-1;let ok=0,bad=0,cells='';
 for(let i=0;i<first;i++)cells+='<span></span>';
 for(let d=1;d<=days;d++){const s=y+'-'+p2(m+1)+'-'+p2(d),wd=WTAGE[(first+d-1)%7],v=h[s];let c,t;
  if(s<DAY0){c='cx';t='vor dem Start der Tagesaufgabe'}else if(s>today){c='cx';t='kommt noch'}
  else if(v==='s'){c='cs';t='gelöst';ok++}else if(v==='f'){c='cf';t='nicht gelöst';bad++}else if(s===today){c='co';t='heute, noch offen'}else{c='cn';t='nicht gespielt'}
  cells+='<span class="'+c+(s===today?' ct':'')+'" title="'+wd+', '+p2(d)+'.'+p2(m+1)+'.'+y+': '+t+'">'+d+(v==='s'?'<i>✓</i>':v==='f'?'<i>✗</i>':'')+'</span>';}
 el.innerHTML='<div class="calh"><button data-cm="-1" '+(ym<=min?'disabled':'')+' aria-label="Vormonat">‹</button><b>'+MONATE[m]+' '+y+'</b><button data-cm="1" '+(ym>=max?'disabled':'')+' aria-label="Nächster Monat">›</button></div>'+
  '<div class="cal">'+WTAGE.map(w=>'<span class="wd">'+w+'</span>').join('')+cells+'</div>'+
  '<p class="mut">'+ok+' gelöst · '+bad+' nicht gelöst in diesem Monat.<br><span class="lgi"><span class="leg cs">✓</span> gelöst</span> <span class="lgi"><span class="leg cf">✗</span> nicht gelöst</span> <span class="lgi"><span class="leg cn"></span> nicht gespielt</span></p>';
 el.querySelectorAll('[data-cm]').forEach(b=>b.onclick=()=>{const n=ym+ +b.dataset.cm;calendar(el,Math.floor(n/12),n%12)});}
function dailyCal(){$('#view').innerHTML='<h2>Kalender der Tagesaufgaben</h2><div class="card" id="cal"></div><p><button class="p" onclick="daily()">Zur Tagesaufgabe</button></p>';calendar($('#cal'));window.scrollTo(0,0)}
