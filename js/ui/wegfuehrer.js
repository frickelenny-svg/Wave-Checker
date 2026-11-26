/* js/ui/wegfuehrer.js – Wegführer beim ersten Besuch (GUIDE, guideStart …), Intro, Hintergrund-Chart der Startseite, Fortschritt zurücksetzen.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- Wegführer (Guide) beim allerersten Besuch: dunkelt die Seite ab, hebt ein Modul hervor, Sprechblase daneben.
// Kommt ein neues Modul dazu, bekommt es hier ebenfalls einen Schritt (t = Titel der Insel, s = CSS-Selektor).
const GUIDE=[
 {t:'Elliott-Wellen lernen',x:'Hier findest du das komplette Regelwerk mit Beispielcharts. Lies es zuerst, dann fällt dir alles andere leichter.'},
 {t:'Quiz',x:'Teste dein Wissen in kurzen Runden. Hakt es irgendwo, schicken wir dich zum passenden Kapitel.'},
 {t:'Meine Ränge',x:'Sammle für jede Musterart Ränge von Bronze bis Platin.'},
 {s:'#view .daily',x:'Jeden Tag ein neuer Chart, für alle derselbe. Löse ihn und teile dein Ergebnis.'},
 {t:'Chart durchzählen',x:'Wähle ein Muster, setze die Wellenpunkte und lass deine Zählung prüfen.'},
 {t:'Fehler finden',x:'In diesem Count steckt ein Regelbruch. Finde die Welle und die Regel.'},
 {t:'Muster erkennen',x:'Welches Muster zeigt der Chart? Auf Schwer zählst du ihn zusätzlich selbst.'},
 {t:'Subwellen zählen',x:'Zähle in längeren Charts die Hauptwellen und ihre Subwellen.'},
 {t:'Blitz-Erkennen',x:'Charts blitzen nur kurz auf. Erkenne das Muster so schnell du kannst.'},
 {t:'Wie geht es weiter?',x:'Der Chart bricht ab. Zeichne nach den Regeln, wie es weitergeht.'},
 {t:'Eigenen Chart prüfen',x:'Lade einen Screenshot deines Charts hoch, zähle ihn selbst und lass die Zählung nach dem Regelwerk prüfen. Das Bild bleibt auf deinem Gerät.'}];
const GKEY='waveChecker.guide';let G=null;
const guideSeen=()=>{try{return !!localStorage.getItem(GKEY)}catch(_){return false}};
const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const guideTarget=st=>st.s?$(st.s):$('.wph')?[...document.querySelectorAll('.wph .stn')].find(e=>e.dataset.t===st.t):[...document.querySelectorAll('.home .isl')].find(e=>e.offsetParent&&(e.querySelector('b')||{}).textContent===st.t);
function guideStart(){if(G||!($('.home')||$('.wph')))return;
 const ov=document.createElement('div');ov.className='gd';
 ov.innerHTML='<div class="gd-catch"></div><div class="gd-spot"></div><div class="gd-bub" role="dialog" aria-modal="true" aria-labelledby="gdTxt"><span class="gd-arr"></span>'+
  '<p id="gdTxt"></p><div class="gd-row"><span class="gd-n"></span><button class="gd-skip">Überspringen</button><button class="p gd-next">Weiter</button></div></div>';
 document.body.appendChild(ov);G={i:0,ov,L:$('.wph')?[GUIDE.find(g=>g.s)].concat(STN.map(s=>GUIDE.find(g=>g.t===s.t)).filter(Boolean)):GUIDE}; // Handy-Pfad: Reihenfolge wie die Stationen
 ov.querySelector('.gd-next').onclick=guideNext;ov.querySelector('.gd-skip').onclick=guideEnd;
 G.key=e=>{if(e.key==='Escape'){e.preventDefault();guideEnd()}else if(e.key==='Enter'){e.preventDefault();guideNext()}}; // Enter = Weiter, Esc = Überspringen
 G.pos=()=>guidePlace();document.addEventListener('keydown',G.key);addEventListener('resize',G.pos);addEventListener('scroll',G.pos,{passive:true});
 guideShow();}
function guideShow(){const st=G.L[G.i],el=guideTarget(st),b=G.ov.querySelector('.gd-bub'),nx=G.ov.querySelector('.gd-next');
 if(!el)return guideNext(); // Modul gerade nicht sichtbar
 b.classList.remove('in');G.el=el;el.scrollIntoView({block:'center'}); // sofort, damit „Weiter“ nicht unter dem Finger wegwandert
 G.ov.querySelector('#gdTxt').textContent=st.x;G.ov.querySelector('.gd-n').textContent=(G.i+1)+' / '+G.L.length;
 nx.textContent=G.i===G.L.length-1?'Los geht\'s':'Weiter';
 guidePlace();requestAnimationFrame(()=>requestAnimationFrame(()=>b.classList.add('in')));nx.focus({preventScroll:true});}
function guideNext(){if(!G)return;if(G.i>=G.L.length-1)return guideEnd();G.i++;guideShow()}
function guideEnd(){if(!G)return;document.removeEventListener('keydown',G.key);removeEventListener('resize',G.pos);removeEventListener('scroll',G.pos);
 G.ov.remove();G=null;try{localStorage.setItem(GKEY,'1')}catch(_){}}
// Hervorhebung über das Modul legen, Sprechblase daneben (sonst darunter oder darüber), immer ganz im Bild
function guidePlace(){if(!G||!G.el)return;
 const r=G.el.getBoundingClientRect(),sp=G.ov.querySelector('.gd-spot'),b=G.ov.querySelector('.gd-bub'),a=b.querySelector('.gd-arr'),pad=6,M=16,vw=document.documentElement.clientWidth,vh=innerHeight,gap=16;
 const sl=Math.max(2,r.left-pad),sr=Math.min(vw-2,r.right+pad);
 Object.assign(sp.style,{left:sl+'px',top:r.top-pad+'px',width:sr-sl+'px',height:r.height+2*pad+'px',borderRadius:getComputedStyle(G.el).borderRadius});
 const bw=Math.min(340,vw-2*M);b.style.width=bw+'px';const bh=b.offsetHeight;let x,y,side;
 if(r.right+gap+bw<=vw-M){side='l';x=r.right+gap;y=r.top+r.height/2-bh/2}        // rechts daneben, Pfeil zeigt nach links
 else if(r.left-gap-bw>=M){side='r';x=r.left-gap-bw;y=r.top+r.height/2-bh/2}      // links daneben
 else if(r.bottom+gap+bh<=vh-M){side='t';y=r.bottom+gap;x=r.left+r.width/2-bw/2}  // darunter, Pfeil zeigt nach oben
 else{side='b';y=r.top-gap-bh;x=r.left+r.width/2-bw/2}                            // darüber
 x=Math.max(M,Math.min(vw-M-bw,x));y=Math.max(M,Math.min(vh-M-bh,y));
 b.style.left=x+'px';b.style.top=y+'px';a.className='gd-arr '+side;
 if(side==='l'||side==='r'){a.style.top=Math.max(16,Math.min(bh-16,r.top+r.height/2-y))+'px';a.style.left=''}
 else{a.style.left=Math.max(18,Math.min(bw-18,r.left+r.width/2-x))+'px';a.style.top=''}}
// Einflug nur beim ersten Öffnen der Startseite in einer Sitzung (nicht bei jeder Rückkehr aus einem Modus)
let INTRO=false;
function intro(){let first=!INTRO;INTRO=true;
 try{first=!sessionStorage.getItem('waveChecker.intro');sessionStorage.setItem('waveChecker.intro','1')}catch(_){}
 if(!guideSeen())setTimeout(()=>{if(($('.home')||$('.wph'))&&!G)guideStart()},first&&!calm()?1700:300); // Guide startet nach dem Einflug
 if(!first)return;
 const wp=$('#wp');if(wp){wp.classList.add('grow');setTimeout(()=>wp.classList.remove('grow'),2400);return} // Handy: der Pfad-Chart wächst von oben nach unten
 const h=$('.home'),mn=document.querySelector('main'),vis=s=>[...h.querySelectorAll(s)].filter(e=>e.offsetParent);
 const L=vis('.hl .isl'),R=vis('.hrr .isl');let n=0; // abwechselnd links und rechts, dann unten
 for(let i=0;i<Math.max(L.length,R.length);i++)[L[i],R[i]].forEach(e=>e&&e.style.setProperty('--i',n++));
 vis('.hb .isl').forEach(e=>e.style.setProperty('--i',n++));
 h.classList.add('intro');mn.classList.add('intro');
 setTimeout(()=>{h.classList.remove('intro');mn.classList.remove('intro')},3200);}
// Hintergrund-Chart: 5-Wellen-Impuls mit kleinen Zacken von unten links nach oben rechts, blass, nicht anklickbar
function bgChart(){const P=[[0,960],[380,610],[560,770],[1080,250],[1240,420],[1600,60]],pts=[];
 for(let w=0;w<5;w++){const [x1,y1]=P[w],[x2,y2]=P[w+1],n=7;
  for(let j=0;j<n;j++){const t=j/n,z=j%2?1:-1,a=j&&j<n-1?Math.abs(y2-y1)*.06*z:0;pts.push([x1+(x2-x1)*t,y1+(y2-y1)*t+a])}}
 pts.push(P[5]);const ps=pts.map(p=>p[0].toFixed(0)+','+p[1].toFixed(0)).join(' ');
 return '<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+
  '<polyline points="'+ps+'" fill="none" stroke="var(--accent)" stroke-width="26" stroke-linejoin="round" opacity=".06"/>'+
  '<polyline points="'+ps+'" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" opacity=".22"/>'+
  '<g class="wn" fill="var(--accent)" opacity=".12" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="56" text-anchor="middle">'+
  P.slice(1).map((p,i)=>'<text style="--d:'+Math.round(200+1800*(p[0]+60)/1720)+'ms" x="'+p[0]+'" y="'+(p[1]+(i%2?70:-26))+'">'+(i+1)+'</text>').join('')+'</g>'+
  '<rect class="wipe" x="-60" y="-60" width="1720" height="1120" fill="var(--bg)"/></svg>'} // Abdeckung, die beim ersten Öffnen nach rechts wegfährt (Linie „zeichnet“ sich)
// Fortschritt zurücksetzen: unauffälliger Button, Sicherheitsabfrage direkt auf der Seite (kein Browser-Popup)
const RSBTN='<button class="lnk" onclick="resetAsk()">Fortschritt zurücksetzen</button>';
function resetAsk(){$('#rs').innerHTML='<span class="mut">Punkte, Level und Serie wirklich auf 0 setzen? Das lässt sich nicht rückgängig machen.</span><br><button onclick="resetDo()">Ja, zurücksetzen</button><button class="p" onclick="$(\'#rs\').innerHTML=RSBTN">Abbrechen</button>'}
function resetDo(){st.pts=0;st.streak=0;stats();$('#rs').innerHTML='<span class="mut">Fortschritt zurückgesetzt.</span>'}
