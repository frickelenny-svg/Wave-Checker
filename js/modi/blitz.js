/* js/modi/blitz.js – Modus „Blitz“ (blitz, bzCard, blitzKap), Speicher waveChecker.blitz*.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Modus 7: „Blitz-Erkennen“ (schnelles Mustererkennen nach dem Vorbild von Perceptual-Learning-Trainings).
// 20 Charts je Runde, jeder nur kurz sichtbar, dann 4 Antworten. Anzeigedauer passt sich an: nach 3 richtigen in Folge
// 0,5 s kürzer (mind. 1,5 s), nach einer falschen 0,5 s länger (höchstens 5 s). Falsch erkannte Muster kommen 1–2 Mal wieder.
// Richtig ist auch jede Antwort, zu der der Chart regelkonform ist (misfit, wie in „Muster erkennen“).
const BZCONF=[['fr','fe'],['fe','fru'],['fr','fru'],['trk','tre'],['dl','db'],['db','tz'],['zig','dz']]; // Verwechslungspaare
const bzPartners=k=>BZCONF.filter(p=>p.includes(k)).map(p=>p[0]===k?p[1]:p[0]);
const BZKEY='waveChecker.blitz',BZN=20,BZPTS=5,BZFAST=3; // Speicher, Charts je Runde, Punkte je richtige, Extra unter 2 s
const bzLoad=()=>{try{return JSON.parse(localStorage.getItem(BZKEY))||{}}catch(_){return{}}}; // {best:{Runden-Art:{pts,acc,minDur}}}
const bzSave=o=>{try{localStorage.setItem(BZKEY,JSON.stringify(o))}catch(_){}};
let BZ=0; // Nummer der laufenden Runde: alte Zeitgeber erkennen daran, dass sie nicht mehr gelten
// opt: {id: Art der Runde (Bestleistung), name, keys: Muster}
// Schwierigkeit (Lenny, 26.10.2026): Anzeigedauer am Start, kürzeste und längste Dauer, Rückmeldung in Sekunden (0 = bleibt, bis man „Weiter“ tippt).
const BZLV={leicht:{name:'Leicht',start:7,min:3,max:10,fb:0,txt:'Chart 7 Sekunden, die Lösung bleibt stehen, bis du weitertippst.'},
 mittel:{name:'Mittel',start:4,min:1.5,max:5,fb:1.2,txt:'Chart 4 Sekunden, wird schneller, wenn du gut bist.'},
 schwer:{name:'Schwer',start:2.5,min:1,max:3.5,fb:.8,txt:'Chart 2,5 Sekunden, bis hinunter zu 1 Sekunde.'}};
function blitz(opt,lvl,saved){
 if(typeof opt==='string')opt=opt==='easy'?{id:'einsteiger',name:'Einsteiger',keys:['imp','zig','fr','fe','fru']}:{id:'alle',name:'Alle Muster',keys:Object.keys(PAT).filter(k=>!PAT[k].noRecog)};
 if(!BZLV[lvl]){ // zuerst die Schwierigkeit wählen
  $('#view').innerHTML='<div class="card"><p class="kick">Blitz-Erkennen · '+esc(opt.name)+'</p><h2>Wie schwer?</h2>'+
   Object.entries(BZLV).map(([k,l])=>'<p><button class="p" data-lv="'+k+'">'+l.name+'</button> <span class="mut">'+l.txt+'</span></p>').join('')+'</div>';
  document.querySelectorAll('[data-lv]').forEach(b=>{b.onclick=()=>blitz(opt,b.dataset.lv);lockTap(b)});window.scrollTo(0,0);return}
 const LV=BZLV[lvl],bid=opt.id+(lvl==='mittel'?'':'-'+lvl); // Bestleistung je Stufe („Mittel“ behält die bisherigen Werte)
 const run=++BZ,pool=opt.keys,pick=a=>a[Math.floor(Math.random()*a.length)],q=saved?saved.q:[];
 if(!saved)for(let i=0;i<BZN;i++){let k;do k=pick(pool);while(pool.length>1&&k===q[i-1]);q.push(k)} // nie zweimal dasselbe direkt hintereinander
 const m=saved?{...saved.m,forced:new Set(saved.m.forced)}:{i:0,dur:LV.start,row:0,ok:0,pts:0,times:[],minDur:LV.start,conf:{},forced:new Set()};
 const alive=()=>run===BZ&&$('#bz');
 const head=()=>'<div id="bz"><div class="bzhead"><span class="kick">'+esc(opt.name)+' · '+LV.name+' · Chart '+(m.i+1)+'/'+BZN+' · Anzeige '+String(m.dur).replace('.',',')+' s</span><button id="bzx">Abbrechen</button></div><div class="bar"><i style="width:'+(m.i/BZN*100)+'%"></i></div>';
 const show=()=>{resSave({t:'blitz',opt,lvl,q,m:{...m,forced:[...m.forced]}});const P=PAT[q[m.i]],R=makeRound(P,null);tutCtx('blitz',()=>{const o=resLoad();o&&o.t==='blitz'?resume():blitz(opt,lvl)},{P});
  // Antworten: die richtige, mindestens ein Verwechslungspartner (falls es einen gibt), Rest aus der Runde, sonst aus allen Mustern
  const all=Object.keys(PAT).filter(k=>!PAT[k].noRecog),opts=[P.key],add=k=>{if(k&&!opts.includes(k))opts.push(k)};
  add(pick(bzPartners(P.key).length?bzPartners(P.key):[null]));
  shuffle(pool).forEach(k=>opts.length<4&&add(k));shuffle(all).forEach(k=>opts.length<4&&add(k));
  const ans=shuffle(opts);
  $('#view').innerHTML=head()+'<div class="chart bzc">'+draw(R,[],false,null)+'</div><div class="bztime"><i style="transition:width '+m.dur+'s linear"></i></div></div>'+
   '<div class="bzans"><p class="mut">Schau genau hin …</p></div>';
  $('#bzx').onclick=()=>{BZ++;resDrop();home()};
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const t=$('.bztime i');if(t)t.style.width='0%'})); // Zeitbalken läuft ab
  setTimeout(()=>{if(!alive())return;
   $('.bzc').innerHTML='<div class="bzq">?</div>';$('.bztime').style.visibility='hidden';
   $('.bzans').innerHTML=ans.map(k=>'<button class="p" data-bz="'+k+'">'+PAT[k].title+'</button>').join('');
   const t0=performance.now();
   document.querySelectorAll('[data-bz]').forEach(b=>b.onclick=()=>answer(P,R,b.dataset.bz,(performance.now()-t0)/1000));},m.dur*1000);
 };
 const answer=(P,R,sel,t)=>{if(!alive())return;
  const ok=sel===P.key||!misfit(PAT[sel],R),fast=ok&&t<2,gain=ok?BZPTS+(fast?BZFAST:0):0;m.times.push(t);
  document.querySelectorAll('[data-bz]').forEach(b=>{b.disabled=true;if(b.dataset.bz===sel)b.classList.add(ok?'qok':'qbad');if(b.dataset.bz===P.key)b.classList.add('qok')});
  if(ok){m.ok++;m.pts+=gain;st.streak++;st.pts+=gain;stats();exSolved(P.key,0); // zählt für die Ränge
   if(++m.row>=3){m.row=0;m.dur=Math.max(LV.min,m.dur-.5)}
   $('.bzc').innerHTML='<div class="bzq ok">✓ Richtig'+(sel!==P.key?'<br><small>Alternativ passt auch: '+P.title+'</small>':'')+'<br><small>+'+gain+(fast?' · schnell!':'')+'</small></div>';}
  else{st.streak=0;stats();m.row=0;m.dur=Math.min(LV.max,m.dur+.5);const c=P.title+' → als '+PAT[sel].title+' erkannt';m.conf[c]=(m.conf[c]||{n:0,k:P.key});m.conf[c].n++;
   // falsch erkanntes Muster kommt 1–2 Mal wieder (gemischt, nicht direkt danach)
   const free=j=>j>m.i+1&&j<BZN&&!m.forced.has(j)&&q[j-1]!==P.key&&q[j+1]!==P.key; // nie zweimal dasselbe Muster direkt hintereinander
   for(let n=1+(Math.random()<.5?1:0);n>0;n--){const s=shuffle([2,3,4,5,6,7].map(d=>m.i+d)).find(free);if(s!==undefined){q[s]=P.key;m.forced.add(s)}}
   $('.bzc').innerHTML=draw(R,[],true,P.tri?R.piv:null)+'<div class="bzq bad bzover">✗ Richtig wäre: '+P.title+'</div>';}
  m.minDur=Math.min(m.minDur,m.dur);
  const next=()=>{if(!alive())return;if(++m.i<BZN)show();else end()};
  if(LV.fb)setTimeout(next,LV.fb*1000); // Rückmeldung kurz stehen lassen
  else{$('.bzans').insertAdjacentHTML('beforeend','<button class="p" id="bzn">Weiter</button>');$('#bzn').onclick=next;lockTap($('#bzn'))} // Leicht: bleibt, bis man tippt
 };
 // Bestleistung: zuerst die Zahl der richtigen Antworten, bei gleicher Zahl entscheiden die Punkte (also das Tempo)
 const end=()=>{resDrop();pathMark('blitz');const o=bzLoad();o.best=o.best||{};const b=o.best[bid],acc=m.ok/BZN,avg=m.times.reduce((a,c)=>a+c,0)/m.times.length,
   bOk=b?(b.ok!==undefined?b.ok:Math.round(b.acc*BZN)):0,more=!b||m.ok>bOk,faster=b&&m.ok===bOk&&m.pts>b.pts,isBest=more||faster;
  const bestTxt=!b?'Deine erste Bestleistung in „'+esc(opt.name)+' · '+LV.name+'“.':more?'Neue Bestleistung: '+m.ok+' von '+BZN+' richtig (vorher '+bOk+').':
   faster?'Neue Bestleistung: gleich viele richtig, aber schneller ('+m.pts+' statt '+b.pts+' Punkte).':'Bestleistung „'+esc(opt.name)+'“: '+bOk+' von '+BZN+' richtig, '+b.pts+' Punkte.';
  if(isBest){o.best[bid]={ok:m.ok,pts:m.pts,acc,minDur:m.minDur};bzSave(o);if(b)toast(bestTxt)}
  const kap=k=>(UEBEN.find(e=>e[1].includes(k))||[])[0],list=Object.entries(m.conf).sort((a,c)=>c[1].n-a[1].n);
  $('#view').innerHTML='<div class="card"><h2>Blitz-Runde geschafft</h2><p class="'+(acc>=.8?'ok':'')+'">'+m.ok+' von '+BZN+' richtig ('+Math.round(acc*100)+' %) · +'+m.pts+' Punkte</p>'+
   '<p>Durchschnittliche Antwortzeit: '+avg.toFixed(1).replace('.',',')+' s · Kürzeste Anzeigedauer: '+String(m.minDur).replace('.',',')+' s</p>'+
   '<p class="'+(isBest&&b?'ok':'mut')+'">'+bestTxt+'</p></div>'+
   (list.length?'<div class="card"><b>Verwechselt</b>'+list.map(([c,v])=>'<p>'+c+': '+v.n+'× '+(kap(v.k)?'<a href="#" class="qlink" data-kap="'+kap(v.k)+'">Kapitel lesen →</a>':'')+'</p>').join('')+'</div>':'')+
   '<p><button class="p" id="bzagain">Neue Runde</button><button onclick="home()">Hauptmenü</button></p>';
  document.querySelectorAll('[data-kap]').forEach(a=>a.onclick=e=>{e.preventDefault();learn(a.dataset.kap)});
  $('#bzagain').onclick=()=>blitz(opt,lvl);window.scrollTo(0,0);};
 window.scrollTo(0,0);show();
}
// Karte im Hauptmenü mit den Bestleistungen
function bzCard(){const b=bzLoad().best||{},t=k=>(b[k].ok!==undefined?b[k].ok:Math.round(b[k].acc*BZN))+'/'+BZN;
 return isl('bolt','Blitz-Erkennen','Muster in Sekunden erkennen.'+(b.einsteiger||b.alle?' Beste: '+[b.einsteiger?'Einsteiger '+t('einsteiger'):'',b.alle?'Alle '+t('alle'):''].filter(Boolean).join(', '):''),null,
  '<span class="sb"><button class="p" onclick="blitz(\'easy\')">Einsteiger</button><button class="p" onclick="blitz(\'all\')">Alle Muster</button></span>')}
// Blitz-Training aus einem Kapitel: Muster des Kapitels plus ihre Verwechslungspartner
function blitzKap(prefix){const e=UEBEN.find(x=>x[0]===prefix),keys=[...new Set(e[1].concat(...e[1].map(bzPartners)))];
 blitz({id:'kap-'+prefix,name:'Blitz-Training: '+e[1].map(k=>PAT[k].title).join(', ').replace(/ \(.*?\)/g,''),keys});}
