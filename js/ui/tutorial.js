/* js/ui/tutorial.js – Kurz-Tutorials „So geht's“ (TUTDEF, tutStart, tutTick, tutEnd), Texte aus tutorials.json. Siehe CLAUDE.md.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- Kurz-Tutorials „So geht's“ (18.11.2026, Lenny; DESIGN.md „Tutorial“). Texte: tutorials.json, hier nur die Technik.
// Startet nie von selbst, nur über den Knopf „So geht's“ oben rechts im Spielbildschirm jedes Modus (beim ersten Besuch pulsiert er einmal,
// gemerkt in waveChecker.tutSeen). Jeder Schritt zeigt auf ein echtes Element der App (TUTDEF). Fehlt es, wird der Schritt übersprungen.
// Schritte mit Handlung (done/click) zeigen einmal eine Hand und warten, bis der Spieler es selbst gemacht hat.
// Sandbox: Die Tutorial-Runde nutzt festen Zufall (seeded), am Ende werden Punkte, Serie und der ganze localStorage zurückgesetzt.
// Danach startet eine normale Runde (bei Quiz und Blitz die unterbrochene, falls vorhanden). Testzugriff: TUTS(), tests/tutorial.js.
let TUT=null,TUTCTX=null,TUTJ=null;
const TUTKEY='waveChecker.tutSeen',TUTFB={knopf:"So geht's",weiter:'Weiter',ueberspringen:'Überspringen',los:"Los geht's",jetzt_du:'Jetzt du.',
 fehler_laden:'Das Tutorial konnte nicht geladen werden. Prüfe die Internetverbindung.',keine_punkte:'keine Punkte (Übungsrunde)'}; // nur falls tutorials.json fehlt
const tutTxt=k=>(TUTJ&&typeof TUTJ[k]==='string'?TUTJ[k]:TUTFB[k]);
async function tutLoad(){if(TUTJ)return true;try{const r=await fetch('tutorials.json',{cache:'no-cache'});if(!r.ok)throw new Error(r.status);TUTJ=await r.json();
 document.querySelectorAll('.tutbtn span').forEach(s=>s.textContent=tutTxt('knopf'));return true}catch(_){return false}}
// Jeder Spielbildschirm meldet sich hier an: Tutorial-Schlüssel, normale neue Runde, Daten der Runde für die Ziele (R, m …)
function tutCtx(key,restart,data){TUTCTX={key,restart,data:data||{}}}
const TD=()=>(TUTCTX&&TUTCTX.data)||{},tutOn=s=>!!$('#view '+s);
const tutRes=()=>!!$('#view #fb:not([hidden]) .ok, #view #fb:not([hidden]) .bad'); // Ergebnis nach Prüfen/Auswerten steht da
// Bildschirmpunkt des Kurses an Kerze i (einfache Charts: erste Linie im SVG ist der Kurs)
function tutSvgPt(i){const s=$('#view #svg'),pl=s&&s.querySelector('polyline');if(!pl||i==null)return null;const q=pl.getAttribute('points').split(' ')[i];if(!q)return null;
 const [x,y]=q.split(',').map(Number),r=s.getBoundingClientRect(),vb=s.viewBox.baseVal;return{x:r.left+x/vb.width*r.width,y:r.top+y/vb.height*r.height}}
// „Wie geht es weiter?“: Zeit t (Stunden) und Preis p auf dem Bildschirm, im Chart gehalten
function tutPgPt(t,p){const s=$('#pgc #svg');if(!s||!PGS)return null;const r=s.getBoundingClientRect();
 return{x:Math.max(r.left+14,Math.min(r.right-14,r.left+PGS.X(t))),y:Math.max(r.top+14,Math.min(r.bottom-34,r.top+PGS.Y(p)))}}
function tutZone(){const s=$('#pgc #svg');if(!s||!PGS)return null;const r=s.getBoundingClientRect(),x=Math.max(r.left,Math.min(r.right-40,r.left+PGS.X(PGS.R.mp[PGS.cut]+.5)));
 return{left:x,top:r.top,right:r.right,bottom:r.bottom,width:r.right-x,height:r.height}}
const tutCard=s=>()=>{const e=$('#view '+s);return e&&e.closest('.card')};
const TUTZW=()=>ZW.findIndex(z=>z.pats.includes(TD().P.key));
// Ziele je Modus. mark: Element, an dem der Spielbildschirm erkannt wird; anchor: wohin der Knopf kommt (sonst oben rechts in #view).
// Schritt: el (Selektor, Funktion → Element oder Rechteck), hand (wohin die Hand tippt), done (Bedingung) bzw. click (Tipp aufs Ziel),
// allow (weitere erlaubte Elemente), opt (erscheint nur, wenn es passt), wait (ms, so lange auf das Element warten).
const TUTEASY={id:'einsteiger',name:'Einsteiger',keys:['imp','zig','fr','fe','fru']};
const tutRecogPts={el:'#view .chart',hand:()=>{const d=TD();return d.R&&tutSvgPt(d.R.piv[Math.min(d.m.sel.length,d.R.piv.length-1)])},
 done:()=>{const d=TD(),z=ZW[d.m.z];return !!z&&d.m.sel.length>=z.labels.length}};
const tutRecogSteps={zaehlweise:{el:tutCard('[data-z]'),hand:()=>'[data-z="'+TUTZW()+'"]',done:()=>tutOn('[data-z].on')},
 punkte:tutRecogPts,pruefen:{el:'#chk',hand:'#chk',done:tutRes},
 bonus:{el:()=>$('#view [data-b]')&&$('#view #fb'),opt:1,hand:()=>'[data-b="'+TD().P.key+'"]',done:()=>!tutOn('[data-b]')},
 ergebnis:{el:'#fb'}};
const TUTDEF={
 count:{mark:'#chk',start:()=>count(PAT.imp),steps:{
  punkt:{el:'#view .chart',hand:()=>tutSvgPt(TD().R.piv[0]),done:()=>TD().m.sel.length>=1},
  rest:{el:'#view .chart',hand:()=>{const d=TD();return tutSvgPt(d.R.piv[Math.min(d.m.sel.length,d.n-1)])},done:()=>TD().m.sel.length>=TD().n},
  pruefen:{el:'#chk',hand:'#chk',done:tutRes},
  tipp:{el:'#tip',opt:1,hand:'#tip',click:1},
  ergebnis:{el:'#fb'}}},
 find:{mark:'[data-w]',start:()=>findSub('imp','leicht'),steps:{
  chart:{el:'#view .chart'},
  welle:{el:'#view .ffw',hand:()=>'[data-w="'+FFS.wv+'"]',done:()=>tutOn('[data-w].on')},
  regel:{el:'#view .ffw',hand:()=>'[data-r="'+FFS.id+'"]',done:()=>tutOn('[data-r].on')},
  auswerten:{el:'#go',hand:'#go',done:tutRes},
  ergebnis:{el:'#fb'}}},
 'find-schwer':{mark:'[data-w]',start:()=>findSub('imp','schwer'),steps:{
  chart:{el:'#view .chart',wait:6000},
  welle:{el:'#view .ffw',hand:()=>'[data-w="'+FFS.wv+'"]',done:()=>tutOn('#fft')},
  text:{el:'#view .ffw',hand:'#fft',allow:'#go',done:tutRes},
  ergebnis:{el:'#fb'}}},
 recog:{mark:'[data-k]',start:()=>recogNormal('imp'),steps:{
  chart:{el:'#view .chart'},
  muster:{el:tutCard('[data-k]'),hand:()=>'[data-k="'+TD().P.key+'"]',done:()=>tutOn('[data-k].on')},
  antworten:{el:'#go',hand:'#go',done:()=>tutOn('#nxt')},
  ergebnis:{el:'#fb'}}},
 'recog-schwer':{mark:'[data-z]',start:()=>recogHard(null,undefined,'imp'),steps:tutRecogSteps},
 daily:{mark:'[data-z]',start:()=>tutDaily(),steps:{aufgabe:{el:'#view > .kick'},...tutRecogSteps}},
 sub:{mark:'#chk',start:()=>sub('imp'),steps:{
  haupt:{el:'#view .chart',hand:()=>{const d=TD();return tutSvgPt(d.R.mp[Math.min(d.m.sel.length,d.R.mp.length-1)])},done:()=>{const d=TD();return d.m.s>0||d.m.sel.length>=d.stages[0].labels.length}},
  pruefen:{el:'#chk',hand:'#chk',done:tutRes},
  tipp:{el:'#tip',opt:1,hand:'#tip',click:1},
  weiter:{el:()=>TD().m.s===0&&$('#view #nxt'),opt:1,hand:'#nxt',click:1},
  ende:{el:'#view .chart'}}},
 blitz:{mark:'#bz',anchor:'#bz .bzhead',start:()=>blitz(TUTEASY,'leicht'),steps:{
  chart:{el:'#view .bzc'},
  antwort:{el:'#view .bzans',hand:()=>'[data-bz="'+TD().P.key+'"]',done:()=>tutOn('[data-bz]:disabled')},
  ergebnis:{el:'#view .bzc'},
  runde:{el:'#view .bzhead'}}},
 progn:{mark:'#pgc',start:()=>progn('imp','leicht'),steps:{
  aufgabe:{el:'#view > .task'},
  zaehlweise:{el:'#view .pgk',hand:()=>{const t=PGS.truth()[0];return '[data-ch="'+(t?t.kind:'N')+'"]'},done:()=>Object.keys(PGS.m.ch).length>0},
  punkt:{el:'#pgc',hand:()=>{const t=PGS.truth()[0],q=t&&t.pts[0];return q&&tutPgPt(q.t,q.p)},done:()=>PGS.m.pts.length>=1},
  zeit:{el:'#pgc .pgtf'},
  pruefen:{el:'#view .dock'}}},
 'progn-schwer':{mark:'#pgc',start:()=>{try{localStorage.setItem('waveChecker.pgTools','1')}catch(_){}progn('imp','schwer')},steps:{
  zaehlweise:{el:'#view .pgbar',hand:'[data-fz="N"]',click:'[data-fz]'},
  punkt:{el:'#pgc',hand:()=>{const R=PGS.R,n=PGS.FR().pts.length,t=R.mp[Math.min(n,R.mp.length-1)];return tutPgPt(t,R.pr[t])},done:()=>PGS.FR().pts.length>=2},
  werkzeug:{el:'#pgc .pgtool',hand:'[data-md="sel"]',done:()=>PGS.mode()==='sel'},
  auswahl:{el:'#pgc',hand:()=>{const q=PGS.FR().pts[0];return q&&tutPgPt(q.t,q.p)},done:()=>PGS.FR().sel!=null},
  zeit:{el:'#pgc .pgtf'},
  zone:{el:tutZone}}},
 quiz:{mark:'[data-a]',start:async()=>{if(!await qReady())return;const qs=QZ.filter(q=>q.typ==='mc').slice(0,5);quizAsk({cat:null,qs:qs.length?qs:QZ.slice(0,5),i:0,res:[]})},steps:{
  antwort:{el:tutCard('[data-a]'),hand:()=>'[data-a="'+TD().q.richtig+'"]',done:()=>tutOn('[data-a].on')},
  antworten:{el:'#qg',hand:'#qg',done:()=>tutOn('#qn')},
  erklaerung:{el:tutCard('#qr')},
  runde:{el:'#view > .kick'}}}};
// Tagesaufgabe zum Üben: fester Beispielchart statt des echten Tages, nichts wird gespeichert
function tutDaily(){const P=PAT.imp,J=(TUTJ.modi.daily||{});
 recogHard({P,R:makeRound(P,null),no:'1',tries:0,tips:0,z:null,sel:null,fb:'',save(){},solvedNow(){},
  finish(r){$('#view').innerHTML='<p class="kick">'+esc(J.titel||'Tagesaufgabe')+'</p><div class="card" id="fb"><p class="'+(r.solved?'ok':'bad')+'">'+esc(r.solved?J.geloest||'Gelöst!':J.nicht_geloest||'Diesmal nicht gelöst.')+'</p><p class="mut">'+esc(J.abschluss||'')+'</p></div>'}})}
// Knopf „So geht's“ einsetzen, sobald ein Spielbildschirm steht (nach jedem Neuzeichnen von #view)
const TUTICO=ico('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.3h.01"/>');
function tutBtn(){const v=$('#view'),c=TUTCTX,d=c&&TUTDEF[c.key],ok=!!(d&&$('#view '+d.mark));
 v.classList.toggle('tutok',ok&&!d.anchor);if(!ok||TUT)return;
 const host=d.anchor?$(d.anchor):v;if(!host||[...host.children].some(e=>e.classList.contains('tutbtn')))return;
 const b=document.createElement('button');b.type='button';b.className='tutbtn';b.title='Kurz-Tutorial zu diesem Modus';
 b.innerHTML=TUTICO+'<span>'+esc(tutTxt('knopf'))+'</span>';b.onclick=tutStart;
 if(d.anchor)host.insertBefore(b,host.querySelector('#bzx'));else v.insertBefore(b,v.firstChild);
 let s={};try{s=JSON.parse(localStorage.getItem(TUTKEY))||{}}catch(_){} // beim ersten Besuch des Modus einmal pulsieren
 if(!s[c.key]){s[c.key]=1;try{localStorage.setItem(TUTKEY,JSON.stringify(s))}catch(_){}b.classList.add('pulse')}}
new MutationObserver(tutBtn).observe($('#view'),{childList:true});
async function tutStart(){if(TUT||!TUTCTX)return;const ctx=TUTCTX,d=TUTDEF[ctx.key];
 if(!await tutLoad()||!TUTJ.modi||!TUTJ.modi[ctx.key])return toast(esc(tutTxt('fehler_laden')));
 const J=TUTJ.modi[ctx.key],snap=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);snap.push([k,localStorage.getItem(k)])}}catch(_){}
 if(DRAG)DRAG();if(GEST)GEST();BZ++;$('#view').classList.remove('fft-typing');
 const ov=document.createElement('div');ov.className='tut';
 ov.innerHTML='<div class="tut-spot" hidden></div><div class="tut-rip"></div><div class="tut-hand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 9.5V4a2 2 0 0 0-4 0v10l-1.6-1.6a2 2 0 0 0-2.8 2.8l3.6 3.6C6.7 20.3 8.4 22 12 22h2a8 8 0 0 0 8-8v-3a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0V9a2 2 0 0 0-4 0z"/><path d="M14 10v1M18 11v1"/></svg></div>'+
  '<div class="gd-bub tut-bub" role="dialog" aria-live="polite" aria-labelledby="tutTxt" hidden><span class="gd-arr"></span><p class="tut-h"></p><p id="tutTxt"></p><p class="tut-do"></p>'+
  '<div class="gd-row"><span class="gd-n"></span><button type="button" class="gd-skip">'+esc(tutTxt('ueberspringen'))+'</button><button type="button" class="p gd-next">'+esc(tutTxt('weiter'))+'</button></div></div>';
 document.body.appendChild(ov);document.body.classList.add('tut-on');
 TUT={ctx,d,J,L:(Array.isArray(J.schritte)?J.schritte:[]).filter(s=>s&&d.steps[s.id]&&typeof s.text==='string'),i:-1,snap,pts:st.pts,streak:st.streak,rnd:Math.random,shown:0,ov,ids:[]};
 ov.querySelector('.tut-h').textContent=tutTxt('knopf')+' · '+(J.titel||'');
 ov.querySelector('.gd-next').onclick=()=>tutGo(TUT.i+1);ov.querySelector('.gd-skip').onclick=()=>tutEnd();
 ['pointerdown','mousedown','click','dblclick','contextmenu'].forEach(t=>addEventListener(t,tutBlock,true));addEventListener('keydown',tutKey,true);
 Math.random=seeded('tutorial '+ctx.key); // fester Beispielchart
 try{await d.start()}catch(e){console.error(e);return tutEnd()}
 if(!TUT)return;window.scrollTo(0,0);tutGo(0);TUT.iv=setInterval(tutTick,120);}
function tutGo(i){const T=TUT;if(!T)return;clearTimeout(T.nx);if(i>=T.L.length)return tutEnd();
 const s=T.L[i],d=T.d.steps[s.id];T.i=i;T.c={s,d,act:!!(d.done||d.click),t0:performance.now(),seen:false,hand:false,done:false,clk:false};
 T.ov.querySelector('.tut-bub').hidden=true;T.ov.querySelector('.tut-bub').classList.remove('in');T.ov.querySelector('.tut-spot').hidden=true;
 T.ov.querySelector('.tut-hand').classList.remove('go');T.ov.querySelector('.tut-rip').classList.remove('go');tutTick();}
function tutEl(e){try{e=typeof e==='function'?e():e;if(typeof e==='string')e=$(e.startsWith('#view')?e:'#view '+e)||$(e);
 if(!e)return null;if(e.getBoundingClientRect){const r=e.getBoundingClientRect();return r.width||r.height?e:null}return e}catch(_){return null}}
const tutRect=e=>e.getBoundingClientRect?e.getBoundingClientRect():e;
function tutPt(h){try{let v=typeof h==='function'?h():h;if(typeof v==='string')v=$('#view '+v)||$(v);if(!v)return null;
 if(v.getBoundingClientRect){const r=v.getBoundingClientRect();return r.width?{x:r.left+r.width/2,y:r.top+r.height/2}:null}return isFinite(v.x)&&isFinite(v.y)?v:null}catch(_){return null}}
function tutTick(){const T=TUT;if(!T||!T.c)return;const c=T.c,d=c.d,now=performance.now();tutPts();
 if(c.act&&c.seen&&!c.done&&(c.clk||(d.done&&(()=>{try{return !!d.done()}catch(_){return false}})()))){c.done=true;
  T.ov.querySelector('.tut-do').textContent='✓';T.nx=setTimeout(()=>{if(TUT===T&&T.c===c)tutGo(T.i+1)},550);}
 const el=tutEl(d.el);
 if(!el){if(!c.seen&&now-c.t0>(d.wait||(d.opt?300:2500)))tutGo(T.i+1);return}
 const b=T.ov.querySelector('.tut-bub'),nx=b.querySelector('.gd-next');
 if(!c.seen){c.seen=true;c.ts=now;T.shown++;T.ids.push(c.s.id);
  if(el.scrollIntoView){const r=el.getBoundingClientRect(),vh=innerHeight,dock=$('.dock');
   if(!(dock&&dock.contains(el))&&(r.top<60||r.bottom>vh-(dock?dock.offsetHeight:0)-10))el.scrollIntoView({block:r.height>vh*.55?'start':'center'})}
  b.querySelector('#tutTxt').textContent=c.s.text;
  const rest=T.L.slice(T.i+1).filter(s=>!T.d.steps[s.id].opt).length;b.querySelector('.gd-n').textContent=T.shown+' / '+(T.shown+rest);
  b.querySelector('.tut-do').textContent=c.act?tutTxt('jetzt_du'):'';b.querySelector('.tut-do').hidden=!c.act;
  nx.hidden=c.act;nx.textContent=T.i>=T.L.length-1?tutTxt('los'):tutTxt('weiter');
  b.hidden=false;T.ov.querySelector('.tut-spot').hidden=false;requestAnimationFrame(()=>b.classList.add('in'));
  if(!c.act)nx.focus({preventScroll:true});}
 const r=tutRect(el),hp=c.act&&d.hand?tutPt(d.hand):null;tutPlace(r,hp);
 if(c.act&&!c.hand&&!c.done&&hp&&now-c.ts>350){c.hand=true;tutHand(hp)}}
// Die Hand tippt einmal vor (bei reduzierter Bewegung: steht kurz still da)
function tutHand(p){const h=TUT.ov.querySelector('.tut-hand'),q=TUT.ov.querySelector('.tut-rip');
 h.style.left=(p.x-14)+'px';h.style.top=(p.y-3)+'px';q.style.left=p.x+'px';q.style.top=p.y+'px';
 [h,q].forEach(e=>{e.classList.remove('go');void e.offsetWidth;e.classList.add('go')});}
// Abdunkeln mit Aussparung, Sprechblase daneben (sonst darunter/darüber), immer ganz im Bild; passt sie nirgends, an den Rand weg vom Tipp-Punkt
function tutPlace(r,pt){const T=TUT,sp=T.ov.querySelector('.tut-spot'),b=T.ov.querySelector('.tut-bub'),a=b.querySelector('.gd-arr'),pad=6,M=12,gap=16,
  vv=window.visualViewport,vw=document.documentElement.clientWidth,vt=vv?vv.offsetTop:0,vh=vv?vv.height:innerHeight;
 const sl=Math.max(2,r.left-pad),sr=Math.min(vw-2,r.right+pad);
 Object.assign(sp.style,{left:sl+'px',top:(r.top-pad)+'px',width:Math.max(0,sr-sl)+'px',height:(r.height+2*pad)+'px'});
 const bw=Math.min(340,vw-2*M);b.style.width=bw+'px';const bh=b.offsetHeight,top=vt+M,bot=vt+vh-M,tall=r.height>vh*.7;let x,y,side;
 if(!tall&&r.right+gap+bw<=vw-M){side='l';x=r.right+gap;y=r.top+r.height/2-bh/2}
 else if(!tall&&r.left-gap-bw>=M){side='r';x=r.left-gap-bw;y=r.top+r.height/2-bh/2}
 else if(r.bottom+gap+bh<=bot){side='t';y=r.bottom+gap;x=r.left+r.width/2-bw/2}
 else if(r.top-gap-bh>=top){side='b';y=r.top-gap-bh;x=r.left+r.width/2-bw/2}
 else{side='';x=(vw-bw)/2;const fy=pt?pt.y:r.top+r.height/2;y=fy>vt+vh/2?top:bot-bh}
 x=Math.max(M,Math.min(vw-M-bw,x));y=Math.max(top,Math.min(bot-bh,y));b.style.left=x+'px';b.style.top=y+'px';
 a.className='gd-arr '+side;a.hidden=!side;
 if(side==='l'||side==='r'){a.style.top=Math.max(16,Math.min(bh-16,r.top+r.height/2-y))+'px';a.style.left=''}
 else{a.style.left=Math.max(18,Math.min(bw-18,r.left+r.width/2-x))+'px';a.style.top=''}}
// Nur die Sprechblase und (bei einer Handlung) das Ziel sind bedienbar
function tutBlock(e){const T=TUT;if(!T)return;const t=e.target;if(t&&t.closest&&t.closest('.tut'))return;const c=T.c;
 if(c&&c.act&&c.seen&&!c.done&&t&&t.closest){const el=tutEl(c.d.el),al=c.d.allow&&$(c.d.allow);
  if((el&&el.contains&&el.contains(t))||(al&&al.contains(t))){if(e.type==='click'&&c.d.click&&(c.d.click===1||t.closest(c.d.click)))c.clk=true;return}}
 e.stopPropagation();if(e.type!=='pointerdown'&&e.type!=='mousedown')e.preventDefault();}
function tutKey(e){const T=TUT;if(!T)return;const c=T.c;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();return tutEnd()}
 if(c&&c.act)return; // Handlung: Tasten wie gewohnt (Text tippen, Enter zum Auswerten …)
 if(e.key==='Enter'&&!e.target.closest('.tut')){e.preventDefault();e.stopPropagation();return tutGo(T.i+1)}
 if(e.key!=='Tab'&&!e.target.closest('.tut'))e.stopPropagation();}
// Punkte-Meldungen der Übungsrunde umschreiben (es gibt keine Punkte)
function tutPts(){const v=$('#view');if(!v)return;const w=document.createTreeWalker(v,NodeFilter.SHOW_TEXT),k=tutTxt('keine_punkte');let n;
 while((n=w.nextNode())){const t=n.nodeValue;if(t.indexOf('+')<0)continue;
  const u=t.replace(/\+\d+ Punkte/g,k).replace(/Halbe Punkte: \+\d+/g,k).replace(/Bonusfrage \(\+\d+\)/g,'Bonusfrage').replace(/Bonus \+\d+/g,'Bonus').replace(/^\+\d+/,k);if(u!==t)n.nodeValue=u}}
// Ende (Los geht's, Überspringen, Esc): alles zurücksetzen, dann eine normale Runde
function tutEnd(){const T=TUT;if(!T)return;clearInterval(T.iv);window.TUTLAST=T.ids.slice();clearTimeout(T.nx);
 ['pointerdown','mousedown','click','dblclick','contextmenu'].forEach(t=>removeEventListener(t,tutBlock,true));removeEventListener('keydown',tutKey,true);
 T.ov.remove();document.body.classList.remove('tut-on');Math.random=T.rnd;if(DRAG)DRAG();if(GEST)GEST();BZ++;
 try{localStorage.clear();T.snap.forEach(([k,v])=>localStorage.setItem(k,v))}catch(_){}
 TUT=null;st.pts=T.pts;st.streak=T.streak;stats();$('#view').classList.remove('fft-typing');
 if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();window.scrollTo(0,0);
 try{T.ctx.restart()}catch(e){console.error(e);home()}}
