/* js/ui/bausteine.js – Design-Bausteine (DESIGN.md): $, Strich-Icons (ico, ICON), Regelstufen-Abzeichen (stufe, lvlNote), Tipp-Zeilen,
   Weiter-Knopf in die Leiste unten (MutationObserver), Kopfzeile (stats), Insel (isl), Einblendung (toast).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
const $=q=>document.querySelector(q);
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
