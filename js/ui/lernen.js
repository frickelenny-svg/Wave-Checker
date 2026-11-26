/* js/ui/lernen.js – Lernbereich: zeigt lernen/regelwerk-lernversion.md (mdToHtml, showLearn, learn, peek), Bild-Zoom.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- 5) Lernbereich: zeigt lernen/regelwerk-lernversion.md (die menschenlesbare Fassung des Regelwerks) 1:1 als Seite.
// Die Markdown-Datei ist die Quelle: Text nur dort ändern, die Seite liest sie bei jedem Öffnen neu.
// Unterstützt wird genau das, was die Datei nutzt: Überschriften, Absätze, fett/kursiv, Listen, Tabellen,
// Bilder mit kursiver Bildunterschrift in der Zeile darunter.
const LMD='lernen/regelwerk-lernversion.md';
// „Jetzt üben“ am Ende eines Kapitels: Anfang der Kapitelüberschrift (klein geschrieben) → Muster für „Chart durchzählen“
const UEBEN=[['der impuls',['imp']],['das zigzag',['zig']],['die flats',['fr','fe','fru']],['dreiecke',['trk','tre']],['diagonalen',['dl','db','de']],['komplexe korrekturen',['dz','tz']]];
// „Kapitel abfragen“: Anfang der Kapitelüberschrift → Quiz-Kategorie in quiz/fragen.json (gilt auch umgekehrt für „Kapitel lesen“)
const QUIZKAP=[['grundbegriffe','Grundbegriffe & Fibonacci'],['der impuls','Impuls'],['das zigzag','Zigzag'],['die flats','Flats'],['dreiecke','Dreiecke'],['diagonalen','Diagonalen'],['komplexe korrekturen','Komplexe Korrekturen']];
let LEARN=null; // gemerkte Ansicht (DOM-Knoten, Hauptmenü-Button, Scrollposition), zu der „Zurück“ führt
let PEEK=null;  // Quiz-Ansicht, zu der „← Zurück zum Quiz“ führt, während man im Regelwerk nachliest
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>');
// Listenpunkte, die mit „Regel“, „Warnsignal“ oder „Faustregel“ beginnen, werden Karten mit Stufen-Abzeichen.
// Der Text bleibt 1:1: Das Abzeichen zeigt genau das Anfangswort, ein folgender Doppelpunkt bleibt (unsichtbar) erhalten.
function lvLi(x){const m=x.match(/^(Regel|Warnsignal|Faustregel)(:?)/);if(!m)return '<li>'+inl(x)+'</li>';
 const s={Regel:'regel',Warnsignal:'warn',Faustregel:'faust'}[m[1]];
 return '<li class="lv '+{regel:'r',warn:'w',faust:'f'}[s]+'"><span class="stufe s-'+s+'">'+m[1]+(m[2]?'<span class="c">:</span>':'')+'</span>'+inl(x.slice(m[0].length).replace(/^ /,' '))+'</li>'}
// Kapitel-Reiter: der Reiter des Kapitels, das gerade oben steht, ist blau
// Kapitelleiste (Lenny, 26.10.2026): eine Zeile innerhalb der Textkanten. Sichtbar ist ein Fenster aufeinanderfolgender Kapitel,
// die vollständig hineinpassen; das aktuelle Kapitel ist immer dabei. Beim Scrollen nach unten wandert das Fenster nach rechts.
function tocWatch(v){const tabs=[...v.querySelectorAll('.toc a')],hs=[...v.querySelectorAll('.learn h2')],bar=v.querySelector('.toc');
 let s=0,wd=[],lastW=0;
 const measure=()=>{tabs.forEach(a=>a.classList.remove('out'));wd=tabs.map(a=>a.getBoundingClientRect().width);lastW=bar.clientWidth};
 const fits=(i,j)=>{let w=0;for(let x=i;x<=j;x++)w+=wd[x]+(x>i?6:0);return w<=bar.clientWidth+.5};
 const win=k=>{if(bar.clientWidth!==lastW)measure();
  if(k<s)s=k;while(s<k&&!fits(s,k))s++;                               // aktuelles Kapitel muss ins Fenster
  let e=s;while(e+1<tabs.length&&fits(s,e+1))e++;                      // nach rechts auffüllen
  while(s>0&&fits(s-1,e))s--;                                          // am Ende: Platz links nutzen
  tabs.forEach((a,i)=>a.classList.toggle('out',i<s||i>e))};
 measure();
 const upd=()=>{let k=0;hs.forEach((h,i)=>{if(h.getBoundingClientRect().top<120)k=i});tabs.forEach((a,i)=>a.classList.toggle('act',i===k));win(k)};
 window.onresize=()=>{if(!document.contains(bar))return window.onresize=null;measure();upd()};
 window.onscroll=()=>{if(!document.contains(v.querySelector('.toc')))return window.onscroll=null;upd()};upd();}
function mdToHtml(md){
 const L=md.replace(/\r/g,'').split('\n'),out=[],toc=[];let i=0,chap=null,title='';
 const ueben=()=>{const e=chap&&UEBEN.find(([p])=>chap.toLowerCase().startsWith(p)),q=chap&&QUIZKAP.find(([p])=>chap.toLowerCase().startsWith(p));
  if(e||q)out.push('<p class="ueben">'+(e?e[1].map(k=>'<button class="p" data-ueben="'+k+'" data-kap="lk-'+toc.length+'">Jetzt üben'+(e[1].length>1?': '+PAT[k].title:'')+'</button>').join(''):'')+
   (e?'<button data-blitz="'+e[0]+'" data-kap="lk-'+toc.length+'">Blitz-Training</button>':'')+(e?'<button class="p" data-progn="'+e[1].join(',')+'" data-kap="lk-'+toc.length+'">Prognose üben</button>':'')+(q?'<button data-quiz="'+esc(q[1])+'">Kapitel abfragen</button>':'')+'</p>')};
 const isBlock=l=>/^(#{1,3} |\||!\[|- |\d+\. )/.test(l);
 while(i<L.length){const l=L[i];
  if(!l.trim()){i++;continue}
  const h=l.match(/^(#{1,3}) (.*)/);
  if(h){i++;
   if(h[1].length===2){ueben();chap=h[2];toc.push(h[2]);out.push('<h2 id="lk-'+toc.length+'">'+inl(h[2])+'</h2>')}
   else if(h[1].length===1)title='<h1>'+inl(h[2])+'</h1>'; // Titel steht über dem Inhaltsverzeichnis
   else out.push('<h3>'+inl(h[2])+'</h3>');
   continue}
  if(l.startsWith('|')){const rows=[],cells=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
   while(i<L.length&&L[i].startsWith('|'))rows.push(L[i++]);
   out.push('<table><thead><tr>'+cells(rows[0]).map(c=>'<th>'+inl(c)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.slice(2).map(r=>'<tr>'+cells(r).map(c=>'<td>'+inl(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>');continue}
  const im=l.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
  if(im){i++;while(i<L.length&&!L[i].trim())i++;
   const c=i<L.length&&L[i].match(/^\*(.+)\*\s*$/);if(c)i++; // Bildunterschrift (z. B. „Chart erstellt mit TradingView“) gehört direkt unter das Bild
   out.push('<figure><img src="lernen/'+esc(im[2])+'" alt="'+esc(im[1])+'" loading="lazy">'+(c?'<figcaption>'+inl(c[1])+'</figcaption>':'')+'</figure>');continue}
  if(/^- /.test(l)||/^\d+\. /.test(l)){const ol=/^\d/.test(l),re=ol?/^\d+\. /:/^- /,it=[];
   while(i<L.length&&re.test(L[i]))it.push(L[i++].replace(re,''));
   out.push('<'+(ol?'ol':'ul')+'>'+it.map(lvLi).join('')+'</'+(ol?'ol':'ul')+'>');continue}
  const p=[];do p.push(L[i++]);while(i<L.length&&L[i].trim()&&!isBlock(L[i]));out.push('<p>'+inl(p.join(' '))+'</p>');
 }
 ueben();
 return{html:out.join(''),toc,title};
}
// Lernbereich betreten: die aktuelle Ansicht (z. B. ein laufender Modus) wird samt Zustand aufgehoben, nicht neu gestartet
function enterLearn(){const v=$('#view'),f=document.createDocumentFragment();
 LEARN={f,menu:$('#menu').hidden,tolearn:$('#tolearn').hidden,y:window.scrollY};
 while(v.firstChild)f.appendChild(v.firstChild);}
// kap: Kapitel-ID (lk-…) oder Abschnitt wie in quiz/fragen.json („Kapitel › Unterabschnitt“), zu dem gesprungen wird
async function learn(kap){
 if(LEARN&&$('.learn'))return jumpTo(kap); // Lernseite ist schon offen
 if(!LEARN)enterLearn();
 await showLearn(kap);
}
async function showLearn(kap){pathMark('learn');const v=$('#view');
 $('#tolearn').hidden=true;$('#menu').hidden=false;closeZoom();v.innerHTML='<p class="mut">Lädt …</p>';window.scrollTo(0,0);
 let md;
 try{const r=await fetch(LMD,{cache:'no-cache'});if(!r.ok)throw new Error(r.status);md=await r.text()}
 catch(_){if(LEARN)v.innerHTML='<div class="card"><p class="bad">Die Lernseite konnte nicht geladen werden.</p><button class="p" onclick="learnBack()">← Zurück</button></div>';return}
 if(!LEARN)return; // inzwischen woandershin gewechselt
 const {html,toc,title}=mdToHtml(md),back='<button onclick="learnBack()">'+(PEEK?'← Zurück zum Quiz':'← Zurück')+'</button>';
 v.innerHTML='<div class="learn">'+back+(PEEK?'':'<button class="p" onclick="quizMenu()">Quiz</button><button onclick="ranksOpen(true)">Meine Ränge</button>')+title+'<nav class="toc" aria-label="Kapitel">'+
  toc.map((t,j)=>{const k=t.replace(/\s*\(.*?\)/g,'').replace(/:.*$/,''); /* Handy: Kurzname ohne Klammern (Lenny, 26.10.2026) */return '<a href="#lk-'+(j+1)+'" data-j="'+(j+1)+'">'+(k===t?inl(t):'<span class="tl">'+inl(t)+'</span><span class="ts">'+inl(k)+'</span>')+'</a>'}).join('')+'</nav>'+html+'<p>'+back+'</p></div>';
 tocWatch(v); // aktiver Reiter folgt dem Kapitel, das man gerade liest
 v.querySelectorAll('[data-j]').forEach(a=>a.onclick=e=>{e.preventDefault();$('#lk-'+a.dataset.j).scrollIntoView({behavior:'smooth'})});
 v.querySelectorAll('.learn figure img').forEach(im=>im.onclick=()=>zoom(im));
 jumpTo(kap); // z. B. direkt zum Kapitel des Musters, von dem man kam
 v.querySelectorAll('[data-ueben]').forEach(b=>b.onclick=()=>{LEARN=PEEK=null;$('#menu').hidden=false;$('#tolearn').hidden=false;$('#tolearn').dataset.kap=b.dataset.kap;window.scrollTo(0,0);count(PAT[b.dataset.ueben])});
 v.querySelectorAll('[data-quiz]').forEach(b=>b.onclick=()=>quizStart(b.dataset.quiz,true));
 v.querySelectorAll('[data-blitz]').forEach(b=>b.onclick=()=>{LEARN=PEEK=null;$('#menu').hidden=false;$('#tolearn').hidden=false;$('#tolearn').dataset.kap=b.dataset.kap;window.scrollTo(0,0);blitzKap(b.dataset.blitz)});
 v.querySelectorAll('[data-progn]').forEach(b=>b.onclick=()=>{LEARN=PEEK=null;$('#menu').hidden=false;$('#tolearn').hidden=false;$('#tolearn').dataset.kap=b.dataset.kap;window.scrollTo(0,0);progn(b.dataset.progn)}); // „Kapitel abfragen“: ohne Lese-Hinweis
}
function jumpTo(kap){let el=kap&&document.getElementById(kap);
 if(kap&&!el){const [c,sub]=kap.split(' › '),lc=c.toLowerCase();
  el=[...document.querySelectorAll('.learn h2')].find(h=>h.textContent===c||h.textContent.toLowerCase().startsWith(lc));
  if(el&&sub)for(let n=el.nextElementSibling;n&&n.tagName!=='H2';n=n.nextElementSibling)if(n.textContent.trim().startsWith(sub)){el=n;break}}
 el?el.scrollIntoView():window.scrollTo(0,0);}
// Aus dem Quiz kurz im Regelwerk nachlesen: Quiz-Ansicht aufheben, „← Zurück zum Quiz“ setzt sie wieder ein
function peek(kap){const v=$('#view'),f=document.createDocumentFragment();while(v.firstChild)f.appendChild(v.firstChild);
 PEEK={f,y:window.scrollY};showLearn(kap);}
// Zurück dorthin, wo man vorher war (gemerkte Ansicht wieder einsetzen)
function learnBack(){closeZoom();
 if(PEEK){const p=PEEK;PEEK=null;const v=$('#view');v.innerHTML='';v.appendChild(p.f);window.scrollTo(0,p.y);return}
 const s=LEARN;LEARN=null;
 if(!s)return home();
 const v=$('#view');v.innerHTML='';v.appendChild(s.f);$('#menu').hidden=s.menu;$('#tolearn').hidden=s.tolearn;window.scrollTo(0,s.y);}
// Bild vergrößern: Vollbild mit Bildunterschrift, Tippen oder Escape schließt
function zoom(im){const fc=im.parentNode.querySelector('figcaption'),d=document.createElement('div');d.className='lb';d.id='lb';
 d.innerHTML='<button class="lbx">Schließen ✕</button><img src="'+esc(im.getAttribute('src'))+'" alt="'+esc(im.alt)+'">'+(fc?'<p>'+fc.innerHTML+'</p>':'');
 d.querySelector('.lbx').onclick=closeZoom;d.onclick=e=>{if(e.target===d)closeZoom()};document.body.appendChild(d);}
function closeZoom(){const d=$('#lb');if(d)d.remove()}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeZoom()});
