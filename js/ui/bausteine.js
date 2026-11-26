/* js/ui/bausteine.js – Design-Bausteine (DESIGN.md): $, Strich-Icons (ico, ICON), Regelstufen-Abzeichen (stufe, lvlNote), Tipp-Zeilen,
   Weiter-Knopf in die Leiste unten (MutationObserver), Kopfzeile (stats), Insel (isl), Einblendung (toast).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
const $=q=>document.querySelector(q);
// Neuaufbau eines Spielbildschirms ohne Verrutschen (26.11.2026, Lenny, nach Video vom iPhone: „bei jedem Punkt springt die Seite nach oben“).
// Ursache: #view wird bei jedem Punkt neu geschrieben; dabei ist die Seite kurz kürzer (der Chart wird erst danach gezeichnet bzw. Knöpfe
// über dem Chart fallen weg), und der Browser schneidet die Scrollposition ab. keepView(key, fn) hält #view während fn mindestens so hoch
// wie vorher und stellt danach die Scrollposition so her, dass der Chart an derselben Stelle im Bild steht. key = Runde: nur innerhalb
// derselben Runde wird ausgeglichen, ein neuer Bildschirm beginnt normal. Scrollt nie von selbst woandershin.
// Dazu Mindesthöhe über dem Chart: Der Abstand des Charts vom Anfang von #view wächst innerhalb einer Runde nur (Text, Knöpfe und Leisten darüber
// ändern ihre Höhe je Zustand). Wird es darüber kürzer, füllt ein leerer Abstandshalter (.kvsp) die Lücke, statt dass der Chart nach oben springt
// und die Scrollposition sich ändert. Neue Breite (Handy gedreht): neu messen.
// Ebenso wird die Seite innerhalb einer Runde nie kürzer (KVH): Wird es unter dem Chart kürzer (Rückmeldung, Leiste), füllt ein Abstandshalter
// am Ende von #view (.kvsp) auf. Sonst schneidet Safari die Scrollposition ab, wenn man ganz unten ist (im WebKit-Test 24 bzw. 76 px Sprung).
let KVKEY=null,KVTOP=0,KVW=0,KVH=0;
// Mindesthöhe des Aufgabentexts (#view .task) für alle Texte, die in dieser Runde vorkommen können (der längste zählt). So reserviert der Text
// seine Höhe von Anfang an, und der Chart darunter springt auch beim ersten längeren Text nicht (26.11.2026, Lenny).
function taskMin(variants){const t=$('#view .task');if(!t||!variants.length)return;const c=t.cloneNode(false);c.removeAttribute('id');
 c.style.cssText='position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:'+t.getBoundingClientRect().width+'px;min-height:0';t.parentNode.appendChild(c);
 let h=0;variants.forEach(v=>{c.innerHTML=v;h=Math.max(h,c.getBoundingClientRect().height)});c.remove();if(h>t.getBoundingClientRect().height+.5)t.style.minHeight=h+'px'}
function keepView(key,fn){const v=$('#view'),same=KVKEY===key&&v&&KVW===innerWidth,c0=same&&v.querySelector('.chart'),t0=c0?c0.getBoundingClientRect().top:null;
 const dh=()=>document.documentElement.scrollHeight;
 if(!same)KVTOP=KVH=0;else KVH=Math.max(KVH,dh());
 if(same)v.style.minHeight=v.offsetHeight+'px';
 try{return fn()}finally{KVKEY=key;KVW=innerWidth;
  const c1=v&&v.querySelector('.chart');
  if(c1){const off=()=>c1.getBoundingClientRect().top-v.getBoundingClientRect().top;let tp=off();
   if(KVTOP>tp+.5){const sp=document.createElement('div');sp.className='kvsp';sp.setAttribute('aria-hidden','true');sp.style.height=(KVTOP-tp)+'px';c1.before(sp);
    const d=off()-KVTOP;if(Math.abs(d)>.5)sp.style.height=Math.max(0,KVTOP-tp-d)+'px';tp=off()} // Außenabstände: einmal nachmessen
   KVTOP=Math.max(KVTOP,tp)}
  if(v)v.style.minHeight='';
  if(v&&same&&dh()<KVH-.5){const sp=document.createElement('div');sp.className='kvsp';sp.setAttribute('aria-hidden','true');v.appendChild(sp); // Seite nicht kürzer als vorher
   for(let i=0;i<2&&dh()<KVH-.5;i++)sp.style.height=((parseFloat(sp.style.height)||0)+KVH-dh())+'px'}
  if(c1&&t0!==null){const y=scrollY+c1.getBoundingClientRect().top-t0; /* vom aktuellen Wert aus: Safari verschiebt die Scrollposition schon beim Neuaufbau */if(Math.abs(scrollY-y)>.5)window.scrollTo(0,Math.max(0,y))}}}
// ---- Design-Bausteine (DESIGN.md): Strich-Icons (2 px, runde Enden), Regelstufen-Abzeichen, Tipp-Zeilen
const ico=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const ICON={
 book:ico('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>'),
 quiz:ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>'),
 medal:ico('<circle cx="12" cy="14" r="6"/><path d="M8 3l2.5 5M16 3l-2.5 5"/><path d="M12 11.5v5"/>'),
 bolt:ico('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
 count:ico('<polyline points="3,17 8,8 12,13 17,5 21,10"/><circle cx="8" cy="8" r="1.2"/><circle cx="17" cy="5" r="1.2"/>'),
 search:ico('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
 eye:ico('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 layers:ico('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
 trend:ico('<polyline points="3,17 9,11 13,15 21,7"/><path d="M15 7h6v6"/>'),
 cal:ico('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
 image:ico('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 20"/>'),
 warn:ico('<path d="M12 3.5L22 20.5H2z"/><path d="M12 10v5M12 17.8h.01"/>'),
 reset:ico('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>'),
 bulb:ico('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>')};
const tipLine=t=>t.startsWith('Tipp')?'<p class="tip">'+ICON.bulb+'<span>'+t+'</span></p>':'<p>'+t+'</p>'; // Tipps mit Glühbirne
const stufe=s=>'<span class="stufe s-'+s+'">'+{regel:'Regel',warn:'Warnsignal',faust:'Faustregel'}[s]+'</span>';
const lvlNote=(X,id)=>{const o=X.rules[id].lvl==='o';return '<p class="rnote '+(o?'f':'w')+'">'+stufe(o?'faust':'warn')+'('+tag(X,id)+') '+mt(X.rules[id].ex)+'</p>'};
// „Nächster Chart“/„Weiter“ wandert in die feste Leiste unten, damit es am Handy ohne Scrollen erreichbar ist
// Neu erscheinende Weiter-Buttons sind kurz gesperrt, damit ein schnelles Doppeltippen die Rückmeldung nicht überspringt
const lockTap=b=>{if(!b||b.dataset.lk)return;b.dataset.lk=1;b.style.pointerEvents='none';setTimeout(()=>b.style.pointerEvents='',450)};
let lastFb='';
new MutationObserver(()=>{const n=$('#view #nxt'),d=$('#view .dock');
 if(n&&d&&!d.contains(n)){d.querySelectorAll('button:disabled').forEach(b=>b.hidden=true);d.prepend(n)}
 lockTap(n);lockTap($('#view #qn'));
 const f=$('#view #fb'),h=f&&!f.hidden?f.innerHTML:'';if(h!==lastFb){lastFb=h;if(h&&f.querySelector('.ok,.bad'))f.scrollIntoView({block:'nearest'})}}).observe(document.getElementById('view'),{childList:true,subtree:true});
function stats(){if(TUT)return;saveProgress(); // Tutorial: Anzeige bleibt (Punkte zählen dort nicht)
const lv=Math.floor(st.pts/50)+1;$('#lv').textContent=lv;$('#pt').textContent=st.pts;$('#sr').textContent=st.streak;$('#pb').style.width=(st.pts%50)*2+'%';}
// Startseite (DESIGN.md, Abschnitt 4 und 5): Modi als Inseln an den Bildschirmrändern, in der Mitte Leitsatz und Tagesaufgabe,
// dahinter der impulsive Hintergrund-Chart. Links Lernen, Quiz, Ränge (Handy: auch Blitz), rechts die Übungsmodi, unten die Prognose
// (Desktop: auch Blitz). Neue Modi bekommen ebenfalls eine Insel.
const isl=(icon,title,desc,act,extra)=>(act?'<button class="isl" aria-label="'+title+': '+desc+'" onclick="'+act+'">':'<div class="isl">')+'<span class="ico">'+ICON[icon]+'</span><b>'+title+'</b><span class="d">'+desc+'</span>'+(extra||'')+(act?'</button>':'</div>');
function toast(html){if(TUT)return; // keine Rang-Meldungen aus der Übungsrunde
let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}
 t.innerHTML=html;t.className='show';clearTimeout(t.tm);t.tm=setTimeout(()=>t.className='',4500);t.onclick=()=>t.className='';}
