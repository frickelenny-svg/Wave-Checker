/* js/modi/quiz.js – Lern-Quiz zum Regelwerk (quiz/fragen.json): quizMenu, quizStart, quizAsk, quizEnd; Speicher waveChecker.quiz (QKEY).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- 7) Lern-Quiz zum Regelwerk (im Lernbereich). Fragen: quiz/fragen.json, Quelle ausschließlich die Lernversion.
// Runden mit 5 Fragen aus einer Kategorie oder gemischt. Pro Kategorie gespeichert: beantwortet, richtig, letzte 10
// Ergebnisse (Grundlage für spätere Ränge). Falsch beantwortete Fragen kommen bevorzugt wieder, bis sie zweimal richtig waren.
const QKEY='waveChecker.quiz',QPTS=5; // Punkte je richtiger Antwort (gleiches Punktekonto wie die Spielmodi)
let QZ=null; // geladene Fragen
const qLoad=()=>{try{return JSON.parse(localStorage.getItem(QKEY))||{}}catch(_){return{}}}; // {cats:{Kategorie:{answered,correct,last:[1,0,…]}}, rep:{id:noch nötige richtige Antworten}, seen:{Kategorie:true}}
const qSave=o=>{try{localStorage.setItem(QKEY,JSON.stringify(o))}catch(_){}};
const QBEI={'Grundbegriffe & Fibonacci':'Bei den Grundbegriffen','Impuls':'Beim Impuls','Zigzag':'Beim Zigzag','Flats':'Bei den Flats','Dreiecke':'Bei Dreiecken','Diagonalen':'Bei Diagonalen','Komplexe Korrekturen':'Bei komplexen Korrekturen'};
const qChap=cat=>(QUIZKAP.find(x=>x[1]===cat)||[])[0]; // Kapitel der Lernseite zu einer Kategorie
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
// Quiz läuft im Lernbereich: Lernbereich betreten (falls nötig) und Fragen laden
async function qReady(){PEEK=null;closeZoom();if(!LEARN)enterLearn();$('#tolearn').hidden=true;$('#menu').hidden=false;window.scrollTo(0,0);
 try{if(!QZ){const r=await fetch('quiz/fragen.json',{cache:'no-cache'});if(!r.ok)throw new Error(r.status);QZ=await r.json()}return true}
 catch(_){$('#view').innerHTML='<div class="card"><p class="bad">Das Quiz konnte nicht geladen werden.</p><button onclick="showLearn()">← Zum Regelwerk</button></div>';return false}}
async function quizMenu(){if(!await qReady())return;
 const c=qLoad().cats||{},cats=[...new Set(QZ.map(q=>q.kategorie))];
 $('#view').innerHTML='<div class="card"><h2>Quiz zum Regelwerk</h2><p class="mut">Runden mit 5 Fragen. Wähle ein Kapitel oder „Gemischt“.</p>'+
  cats.map(k=>{const s=c[k];return '<p><button class="p" data-qc="'+esc(k)+'">'+esc(k)+'</button> <span class="mut">'+(s&&s.answered?s.correct+' von '+s.answered+' richtig':'noch nicht gespielt')+'</span></p>'}).join('')+
  '<p><button class="p" data-qc="">Gemischt</button></p><p><button onclick="showLearn()">← Zum Regelwerk</button></p></div>';
 document.querySelectorAll('[data-qc]').forEach(b=>{b.onclick=()=>quizStart(b.dataset.qc||null);lockTap(b)});}
// direct: von „Kapitel abfragen“ (man kommt gerade aus dem Kapitel), dann ohne Lese-Hinweis
async function quizStart(cat,direct){if(!await qReady())return;
 if(cat&&!direct&&!(qLoad().seen||{})[cat]){ // vor dem ersten Quiz einer Kategorie
  $('#view').innerHTML='<div class="card"><h2>'+esc(cat)+'</h2><p>Lies zuerst das Kapitel, dann festigst du es im Quiz.</p><button class="p" id="qkap">Kapitel lesen</button><button class="p" id="qlos">Quiz starten</button><p><button onclick="quizMenu()">← Andere Kategorie</button></p></div>';
  $('#qkap').onclick=()=>peek(qChap(cat));$('#qlos').onclick=()=>quizRound(cat);document.querySelectorAll('#view button').forEach(lockTap);return}
 quizRound(cat);}
function quizRound(cat){const o=qLoad(),rep=o.rep||{};o.seen=o.seen||{};if(cat)o.seen[cat]=true;qSave(o);
 const pool=QZ.filter(q=>!cat||q.kategorie===cat),due=shuffle(pool.filter(q=>rep[q.id])).slice(0,3); // Wiederholung: höchstens 3 je Runde
 const qs=shuffle([...due,...shuffle(pool.filter(q=>!due.includes(q)))].slice(0,5));
 quizAsk({cat,qs,i:0,res:[]});}
const quizKeep=(R,i)=>resSave({t:'quiz',cat:R.cat,ids:R.qs.map(q=>q.id),i,res:R.res.map(x=>({id:x.q.id,ok:x.ok}))});
function quizAsk(R){quizKeep(R,R.i);tutCtx('quiz',()=>{const o=resLoad();o&&o.t==='quiz'?resume():quizRound(R.cat)},{q:R.qs[R.i]});const q=R.qs[R.i],ord=q.typ==='mc'?shuffle(q.antworten.map((_,j)=>j)):q.antworten.map((_,j)=>j);let sel=null; // Multiple Choice: Antworten gemischt
 const render=fb=>{const done=fb!==undefined;
  $('#view').innerHTML='<p class="kick">Quiz · '+(R.cat?esc(R.cat):'Gemischt')+' · Frage '+(R.i+1)+' von '+R.qs.length+'</p><div class="card"><p><b>'+esc(q.frage)+'</b></p>'+
   ord.map(j=>'<button class="qa'+(done?(j===q.richtig?' qok':j===sel?' qbad':''):sel===j?' on':'')+'" data-a="'+j+'" '+(done?'disabled':'')+'>'+esc(q.antworten[j])+'</button>').join('')+'</div>'+
   (done?'<div class="card">'+fb+'</div>':'')+
   '<div class="dock">'+(done?'<button class="p" id="qn">'+(R.i<R.qs.length-1?'Weiter':'Runde auswerten')+'</button>':'<button class="p" id="qg" '+(sel===null?'disabled':'')+'>Antworten</button>')+'</div>';
  if(done){$('#qr').onclick=e=>{e.preventDefault();peek(q.abschnitt)};$('#qn').onclick=()=>{R.i++;R.i<R.qs.length?quizAsk(R):quizEnd(R)};return}
  document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{sel=+b.dataset.a;render()});
  $('#qg').onclick=()=>{const ok=sel===q.richtig,o=qLoad();o.cats=o.cats||{};o.rep=o.rep||{};
   const c=o.cats[q.kategorie]=o.cats[q.kategorie]||{answered:0,correct:0,last:[]};
   c.answered++;if(ok)c.correct++;c.last=c.last.concat(ok?1:0).slice(-30); // letzte 30 für die Ränge, die Schwäche nutzt die letzten 10
   if(!ok)o.rep[q.id]=2;else if(o.rep[q.id]&&!--o.rep[q.id])delete o.rep[q.id]; // bis zweimal richtig beantwortet
   qSave(o);if(ok){st.streak++;st.pts+=QPTS}else st.streak=0;stats();R.res.push({q,ok});quizKeep(R,R.i+1);rankCheck();
   render((ok?'<p class="ok">Richtig! +'+QPTS+' Punkte</p>':'<p class="bad">Leider falsch.</p><p>'+(q.typ==='rf'?'Die Aussage ist <b>'+esc(q.antworten[q.richtig]).toLowerCase()+'</b>.':'Richtig ist: <b>'+esc(q.antworten[q.richtig])+'</b>')+'</p>')+
    '<p>'+esc(q.erklaerung)+'</p><p><a href="#" id="qr" class="qlink">Im Regelwerk nachlesen →</a></p>');};
 };
 render();window.scrollTo(0,0);document.querySelectorAll('[data-a]').forEach(lockTap);}
// Rundenende. Schwäche: 2 Fehler einer Kategorie in dieser Runde oder unter 60 % in den letzten 10 Antworten (ab 5 Antworten)
function quizEnd(R){resDrop();pathMark('quiz');const o=qLoad(),n=R.res.filter(x=>x.ok).length,wrong={};
 R.res.forEach(x=>{if(!x.ok)wrong[x.q.kategorie]=(wrong[x.q.kategorie]||0)+1});
 const weak=[...new Set(R.res.map(x=>x.q.kategorie))].find(k=>{const l=(((o.cats||{})[k]||{}).last||[]).slice(-10);return (wrong[k]||0)>=2||(l.length>=5&&l.reduce((a,b)=>a+b,0)/l.length<.6)});
 $('#view').innerHTML='<div class="card"><h2>Runde geschafft</h2><p class="'+(n>=4?'ok':'')+'">'+n+' von '+R.res.length+' richtig · +'+n*QPTS+' Punkte</p></div>'+
  (weak?'<div class="card hint"><p><b>'+(QBEI[weak]||'Bei '+esc(weak))+' hakt es noch.</b> Lies das Kapitel nochmal, dann probier es erneut.</p><button class="p" id="qk">Zum Kapitel</button><button class="p" id="qw">Wiederholungsrunde</button></div>':'')+
  '<p><button class="p" id="qnr">Neue Runde</button><button onclick="quizMenu()">Andere Kategorie</button><button onclick="showLearn()">← Zum Regelwerk</button></p>';
 if(weak){$('#qk').onclick=()=>peek(qChap(weak));$('#qw').onclick=()=>quizRound(weak)}
 $('#qnr').onclick=()=>quizRound(R.cat);window.scrollTo(0,0);}
