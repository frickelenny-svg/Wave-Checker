/* js/ui/raenge.js – Ränge anzeigen: Abzeichen für neue Aufstiege (rnBadge, rnIsl, rnPop), Aufstiegs-Ansicht (rankUp), Seite „Meine Ränge“
   (ranks, ranksOpen). Berechnung und Speicher: js/speicher.js.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
const rnLabel=()=>{const n=rnCount();return n===1?'1 neuer Rangaufstieg':n+' neue Rangaufstiege'};
const rnBadge=()=>{const n=rnCount();return n?'<span class="nbdg" aria-hidden="true">'+(n>9?'9+':n)+'</span>':''};
// Insel „Meine Ränge“ im Hauptmenü (PC/iPad), mit Abzeichen
function rnIsl(){const nb=rnBadge(),s=isl('medal','Meine Ränge','Bronze bis Platin je Kapitel','ranksOpen()',nb);
 return nb?s.replace('aria-label="Meine Ränge: ','aria-label="Meine Ränge, '+rnLabel()+': '):s}
// Abzeichen ploppt einmal auf, wenn es erscheint (bzw. die Zahl steigt) und ins Bild kommt; danach ruhig
function rnPop(){const o=rnLoad(),n=o.l.length;if(n<=(o.pop||0)){if(o.pop>n){o.pop=n;rnSave(o)}return}
 const b=document.querySelector('.isl .nbdg,.stn .nbdg');if(!b)return;
 const go=()=>{b.classList.add('pop');const p=rnLoad();p.pop=p.l.length;rnSave(p)};
 if(!window.IntersectionObserver)return go();
 const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();setTimeout(go,calm()?0:200)}});io.observe(b);}
// Insel bzw. Station: mit neuen Aufstiegen erst die Aufstiegs-Ansicht, sonst direkt die Ränge-Seite
function ranksOpen(fromLearn){rankCheck(true);return rnCount()?rankUp(0,fromLearn):ranks(fromLearn)}
const RIM={'Grundbegriffe & Fibonacci':'bei Grundbegriffen & Fibonacci','Impuls':'im Impuls','Zigzag':'im Zigzag','Flats':'bei Flats','Dreiecke':'bei Dreiecken','Diagonalen':'bei Diagonalen','Komplexe Korrekturen':'bei komplexen Korrekturen'};
function rankUp(i,fromLearn){const L=rnLoad().l;if(!L.length)return ranks(fromLearn);i=Math.max(0,Math.min(L.length-1,i||0));
 if(fromLearn){PEEK=null;if(!LEARN)enterLearn();$('#tolearn').hidden=true;$('#menu').hidden=false}
 const e=L[i],m=e.c==='m',col=lv=>lv?'var(--r'+lv+')':'var(--muted)',bd=(lv,t)=>'<span class="badge r'+lv+'">'+(lv?ICON.medal:'')+(t||RNAME[lv])+'</span>';
 const last=i===L.length-1;
 const txt=m?'Elliott-Meister! Alle Kategorien mindestens Gold.':RNAME[e.t]+' '+RIM[e.c]+'! '+(e.t<4?'Nächstes Ziel: '+RNAME[e.t+1]:'Höchster Rang erreicht.');
 $('#view').innerHTML='<section class="rku" id="rku"><div class="card" role="group" aria-roledescription="Karte" aria-label="Rangaufstieg '+(i+1)+' von '+L.length+'">'+
  '<p class="kat">'+(L.length>1?'Rangaufstieg '+(i+1)+' von '+L.length:'Rangaufstieg')+'</p><h2>'+(m?'Gesamtrang':esc(e.c))+'</h2>'+
  '<div class="rkm" style="--a:'+col(e.f)+';--b:'+col(e.t)+'">'+ICON.medal+'</div>'+
  '<p class="rkft">'+(m?'':bd(e.f)+ico('<path d="M5 12h14M13 6l6 6-6 6"/>').replace('<svg','<svg class="ar"'))+bd(e.t,m?'Elliott-Meister':'')+'</p>'+
  '<div class="bar"><i></i></div><p class="rkt" aria-live="polite">'+txt+'</p>'+
  (L.length>1?'<div class="rkdots" aria-hidden="true">'+L.map((_,j)=>'<i'+(j===i?' class="on"':'')+'></i>').join('')+'</div>':'')+
  '<div class="rknav">'+(i?'<button id="rkb">Zurück</button>':'')+(last?'<button class="p" id="rkall">Alle Ränge ansehen</button>':'<button class="p" id="rkn">Weiter</button>')+'</div></div></section>';
 if(last){const hl=L.map(x=>x.c);rnSave({l:[],pop:0});$('#rkall').onclick=()=>ranks(fromLearn,hl)} // alle Karten gesehen: Abzeichen weg
 else $('#rkn').onclick=()=>rankUp(i+1,fromLearn);
 if(i)$('#rkb').onclick=()=>rankUp(i-1,fromLearn);
 // Wischen: nach links = weiter, nach rechts = zurück
 const box=$('#rku');let sx=null,sy=0;
 box.onpointerdown=ev=>{sx=ev.clientX;sy=ev.clientY};
 box.onpointerup=ev=>{if(sx===null)return;const dx=ev.clientX-sx,dy=ev.clientY-sy;sx=null;if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.5)return;
  if(dx<0&&!last)rankUp(i+1,fromLearn);else if(dx>0&&i)rankUp(i-1,fromLearn)};
 box.onpointercancel=()=>{sx=null};
 window.scrollTo(0,0);}
// „Rang verdienen“: Quiz der Kategorie und „Chart durchzählen“ mit ihren Mustern; vor Platin zusätzlich „Muster erkennen – Schwer“
function earnOpts(cat,lv){const keys=Object.keys(RCAT).filter(k=>RCAT[k]===cat);
 return '<p class="mut">Damit kommst du weiter:</p><p><button class="p" data-eq="'+esc(cat)+'">Quiz: '+esc(cat)+'</button>'+
  keys.map(k=>'<button data-ec="'+k+'">Chart durchzählen: '+PAT[k].title+'</button>').join('')+
  (keys.length&&lv===3?'<button data-ec="hard">Muster erkennen – Schwer</button>':'')+'</p>'+
  (keys.length?'<p class="mut">Auch Fehler finden, Muster erkennen, Subwellen zählen und die Tagesaufgabe zählen, wenn der Chart '+(keys.length>1?'eines dieser Muster':'dieses Muster')+' zeigt.'+
   (lv===3?' Für Platin zählen bei „schwer“ nur Muster erkennen – Schwer und die Tagesaufgabe.':'')+'</p>':'');}
// Seite „Meine Ränge“; fromLearn: aus dem Lernbereich geöffnet (Zurück führt zum Regelwerk)
function ranks(fromLearn,hl){hl=hl||[]; // hl: Kategorien, die gerade aufgestiegen sind (kurz hervorgehoben)
pathMark('ranks');rankCheck();const o=rLoad(),ex=o.ex||{},qc=qLoad().cats||{};
 if(fromLearn){PEEK=null;if(!LEARN)enterLearn();$('#tolearn').hidden=true;$('#menu').hidden=false}
 const badge=lv=>'<span class="badge r'+lv+'">'+(lv?ICON.medal:'')+RNAME[lv]+'</span>';
 $('#view').innerHTML='<h2>Meine Ränge</h2><p class="mut">Ränge gibt es pro Kategorie für Quiz und gelöste Übungen. Ein erreichter Rang bleibt. Übungen werden erst ab dem '+RSTART+' gezählt, Quiz-Antworten von vorher zählen mit.</p>'+
  '<div class="card'+(o.master?' daily':'')+(hl.includes('m')?' rkhl':'')+'"><b>Gesamtrang Elliott-Meister</b> '+(o.master?badge(4).replace('Platin','Elliott-Meister'):'<span class="mut">alle Kategorien mindestens Gold ('+RCATS.filter(c=>((o.rank||{})[c]||0)>=3).length+' von '+RCATS.length+')</span>')+
  (o.master?'<p><button data-share="m">Rang teilen</button></p>':'')+'</div>'+
  RCATS.map((c,i)=>{const lv=(o.rank||{})[c]||0,e=ex[c]||{solved:0,noTip:0,hard:0},q=qc[c]||{},l=q.last||[],nx=lv<4?rNeeds(c,lv+1):null;
   const prog=nx?(nx.or?Math.max(...nx.list.map(r=>Math.min(1,r.have/r.need))):nx.list.reduce((s,r)=>s+Math.min(1,r.have/r.need),0)/nx.list.length):1;
   const open=nx?nx.list.filter(r=>r.have<r.need).map(r=>r.txt):[];
   return '<div class="card'+(hl.includes(c)?' rkhl':'')+'"><h2>'+esc(c)+' '+badge(lv)+'</h2><p class="mut">Quiz: '+(q.correct||0)+' richtig'+(l.length?', '+Math.round(l.reduce((a,b)=>a+b,0)/l.length*100)+' % der letzten '+l.length:'')+
    (c==='Grundbegriffe & Fibonacci'?'':' · Übungen: '+e.solved+' gelöst, '+e.noTip+' ohne Tipp, '+e.hard+' schwer/Tagesaufgabe')+'</p>'+
    (nx?'<div class="bar"><i style="width:'+Math.round(prog*100)+'%"></i></div><p>Bis '+RNAME[lv+1]+': '+open.join(nx.or?' oder ':' und ')+'.</p>':'<p class="ok">Höchster Rang erreicht.</p>')+
    '<p>'+(lv<4?'<button class="p" data-earn="'+i+'">Rang verdienen</button>':'')+(lv?'<button data-share="'+i+'">Rang teilen</button>':'')+'</p>'+
    (lv<4?'<div id="earn-'+i+'" hidden>'+earnOpts(c,lv)+'</div>':'')+'</div>'}).join('')+
  '<p id="shareMsg" class="mut"></p>'+(fromLearn?'<p><button onclick="showLearn()">← Zum Regelwerk</button></p>':'');
 // „Rang verdienen“ klappt die passenden Übungen der Kategorie auf
 document.querySelectorAll('[data-earn]').forEach(b=>b.onclick=()=>{const d=$('#earn-'+b.dataset.earn);d.hidden=!d.hidden});
 document.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>quizStart(b.dataset.eq));
 document.querySelectorAll('[data-ec]').forEach(b=>b.onclick=()=>{LEARN=PEEK=null;$('#menu').hidden=false;$('#tolearn').hidden=true;window.scrollTo(0,0);
  b.dataset.ec==='hard'?recogHard():count(PAT[b.dataset.ec])});
 document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>{const s=b.dataset.share,c=RCATS[+s],lv=(o.rank||{})[c];
  shareOut(s==='m'?'Ich bin Elliott-Meister im Wave Checker 🏆 '+location.origin+'/':'Ich bin '+RNAME[lv]+' '+RIN[c]+' im Wave Checker '+REMO[lv]+' '+location.origin+'/',$('#shareMsg'))});
 window.scrollTo(0,0);
 const h=$('.card.rkhl');if(h)setTimeout(()=>h.scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'}),60);} // erste neue Rangkarte ins Bild
