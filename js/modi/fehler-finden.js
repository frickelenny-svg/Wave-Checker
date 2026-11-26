/* js/modi/fehler-finden.js – Modus „Fehler finden“: Leicht (find), Schwer (findSub mit Freitext), beteiligte Wellen (FFPS, ffInv), Komplettprüfung
   einer Runde (roundFails, findOk), Tastatur am Handy (ffFit, ffTyping), Übersicht nicht erkannter Antworten (fehlerTexte).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Modus 2: Fehler finden
function find(P){
 const id=P.viol[Math.floor(Math.random()*P.viol.length)],R=makeRound(P,id,true),m={w:null,r:P.viol.length===1?id:null},rule=P.rules[id],wv=R.vwave||rule.wave;
 const render=(fb)=>{
  $('#view').innerHTML='<p class="kick">Fehler finden · '+P.title+'</p><p class="task">Diese Zählung enthält genau einen Regelverstoß. Wähle die fehlerhafte Welle und die verletzte Regel.</p><div class="chart">'+draw(R,[],true)+'</div>'+
  '<div class="card"><b>Welche Welle?</b><br>'+P.waves.map(w=>'<button data-w="'+w+'" class="'+(m.w===w?'on':'')+'" '+(fb?'disabled':'')+'>Welle '+w+'</button>').join('')+
  (P.viol.length>1&&m.w?'<br><b>Welche Regel?</b><br>'+P.viol.map(x=>'<button data-r="'+x+'" class="'+(m.r===x?'on':'')+'" '+(fb?'disabled':'')+'>'+mt(P.rules[x].name)+'</button>').join(''):'')+
  '</div><div class="dock"><button class="p" id="go" '+(m.w&&m.r&&!fb?'':'disabled')+'>Auswerten</button><button id="dk" '+(fb?'disabled':'')+'>Ich weiß nicht</button></div><div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>';
  if(fb)return;
  document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{m.w=b.dataset.w;render()});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{m.r=b.dataset.r;render()});
  $('#dk').onclick=()=>{pathMark('find');render('<p class="mut">Kein Problem, hier die Auflösung (keine Punkte, deine Serie bleibt).</p><p>Gesucht war: Welle '+wv+', Regel „'+mt(rule.name)+'“ ('+tag(P,id)+'). '+rule.ex+'</p><button class="p" id="nxt">Nächster Chart</button>');$('#nxt').onclick=()=>find(P);};
  $('#go').onclick=()=>{pathMark('find');const wOk=m.w===wv||!!(R.alt&&R.alt.includes(m.w)),rOk=m.r===id;
   if(wOk&&rOk){st.streak++;st.pts+=10;exSolved(P.key,0)}else st.streak=0;stats();
   render('<p class="'+(wOk&&rOk?'ok':'bad')+'">'+(wOk&&rOk?'Richtig! +10 Punkte':wOk?'Die Welle stimmt, die Regel nicht.':rOk?'Die Regel stimmt, die Welle nicht.':'Leider daneben.')+'</p><p>Gesucht war: Welle '+(R.alt?R.alt.join(' oder '):wv)+', Regel „'+mt(rule.name)+'“ ('+tag(P,id)+'). '+rule.ex+'</p><button class="p" id="nxt">Nächster Chart</button>');
   $('#nxt').onclick=()=>find(P);};
 };
 render();
}
// Komplettprüfung einer Runde (15.11.2026, Lenny): Hauptwellen und Subwellen durch alle harten Regeln. Liefert Befunde:
// 'main:ID' (Hauptebene, auch mit dem äußersten Punkt jeder Welle statt ihres Endpunkts, z. B. Welle A eines Dreiecks in X),
// 'teil:k' (Welle k hat die falsche Teilzahl), 'imp:k:ID' (fünfteilige Welle k verletzt eine Impulsregel),
// 'name:k:ID' (das beschriftete Muster der Welle k verletzt eine eigene Regel, z. B. DRE-7 beim Dreieck).
// „Fehler finden“ erzeugt so lange neu, bis nur der gewollte Verstoß übrig ist.
// Beteiligte Wellen je Regel (15.11.2026, Lenny): [Welle der Regel, Partner …]. Jede davon zählt als richtige Wellenwahl, in Leicht und Schwer.
// FFPS: mögliche Partner je Regel (für die Regelauswahl in Leicht, unabhängig von der Runde). Übersicht in CLAUDE.md.
const FFPS={'IMP-1':['1'],'IMP-2':['1','5'],'IMP-3':['1'],'DIAG-2':['1'],'DL-4':['1','5'],'DL-8':['3'],'DB-10':['3'],'DB-4':['1'],'DE-9':['3'],
 'ZZ-2':['A'],'FR-2':['A'],'FE-2':['A'],'FRU-2':['A'],'ZZ-3':['A'],'FR-3':['A'],'FE-3':['A'],'FRU-3':['A'],'WX-2':['W'],'WX-2b':['Y'],'W4-3':['2']};
function ffInv(P,R,o,wv){if(!o.main)return[wv];
 const v=R.mp.map(i=>R.pr[i]),L=k=>Math.abs(v[k]-v[k-1]),W=P.waves;
 switch(o.id){
  case 'IMP-2':return['3',L(1)<=L(5)?'1':'5'];                                  // Welle 3 und die kürzere Vergleichswelle
  case 'DL-4':return[wv,'1'].concat(['3','5'].filter(k=>k!==wv&&L(+k)>=L(1)));   // Welle 1 und jede Welle, die mindestens so lang ist
  case 'DE-3':return[wv,wv==='3'?'1':'3'];                                         // die Welle, die nicht länger wird, und ihre Vorgängerin
  case 'DRE-7':case 'DRE-8':return[wv,W[W.indexOf(wv)-1]];                         // die beiden Dreieckswellen mit falschem Längenverhältnis
  case 'W4-3':return['4','2'];
  default:return[wv].concat(FFPS[o.id]||[]);}}
// Erfüllt die Runde R genau den gewollten Verstoß der Option o aus findSub? (Folgeregeln der Diagonalen aus P.implied sind erlaubt)
const findWant=o=>o.main?'main:'+o.id:o.plan.viol?'imp:'+o.k+':'+o.plan.viol:'teil:'+o.k;
function findOk(P,R,o){const f=roundFails(P,R),w=findWant(o),al=new Set([w].concat(((o.main&&P.implied&&P.implied[o.id])||[]).map(x=>'main:'+x)));
 return f.includes(w)&&f.every(x=>al.has(x))}
function roundFails(P,R){
 const out=new Set(),pr=R.pr,mp=R.mp,nl=mp.length-1,nm=R.nm||{},v=mp.map(i=>pr[i]);
 const main=vv=>{const u=norm(P,vv);if(P.struct&&!P.struct(u))out.add('main:struct');hardFails(P,u).forEach(id=>out.add('main:'+id))};
 main(v);
 const ve=v.slice();for(let k=1;k<=nl;k++){const d=Math.sign(v[k]-v[k-1]);for(let i=mp[k-1];i<=mp[k];i++)if(d*(pr[i]-ve[k])>0)ve[k]=pr[i]}
 if(ve.some((x,k)=>x!==v[k]))main(ve);
 if(P.key==='imp'){if(nm[2]==='Dreieck')out.add('main:DRE-1');if(nm[2]&&nm[2]===nm[4])out.add('main:W4-3')}
 if(P.parts&&nm[1]==='Dreieck')out.add('main:DRE-1');
 for(let k=1;k<=nl;k++){const t=R.spAll&&R.spAll[k];if(!t)continue;
  const sv=[pr[mp[k-1]]].concat(t.map(i=>pr[i])),n=sv.length-1,Q=nm[k]?PAT[PARTK[nm[k]]]:null,want=Q?Q.labels.length-1:+P.subs[0][k-1];
  if(n!==want){out.add('teil:'+k);continue}
  const X=Q||(n===5?PAT.imp:null);if(!X)continue;const u=norm(X,sv),pre=Q?'name:'+k+':':'imp:'+k+':';
  if(X.struct&&!X.struct(u))out.add(pre+'struct');hardFails(X,u).forEach(id=>out.add(pre+id));}
 return[...out];
}
// Modus 5 (Fehler finden für Impuls, Zigzag und Flats): Alle Haupt- und Subpunkte sind beschriftet, genau ein Verstoß steckt im Count.
// Der Fehler liegt entweder auf Hauptebene (Regeln des Musters) oder in der Teilstruktur einer Welle: falsche Teilzahl (5 statt 3 oder umgekehrt)
// oder eine fünfteilige Welle verletzt IMP-1 bis IMP-3 in ihren Subwellen. Nach der Wahl der Welle zeigt die App nur die Regeln, die diese Welle betreffen.
const SUBOK=Object.keys(PAT); // alle Muster haben einen Subwellen-Aufbau
// Schwierigkeit (14.11.2026, Lenny): Leicht = Regel aus einer Auswahl, Schwer = Fehler in eigenen Worten (FFT). Gemerkt in waveChecker.findLvl.
const FLV=()=>{try{return localStorage.getItem('waveChecker.findLvl')==='schwer'?'schwer':'leicht'}catch(e){return 'leicht'}};
let FFJ=null; // fehler-schluesselwoerter.json, einmal geladen
async function ffLoad(){if(FFJ)return true;try{const r=await fetch('fehler-schluesselwoerter.json',{cache:'no-cache'});if(!r.ok)throw new Error(r.status);FFJ=await r.json();return true}catch(e){return false}}
// Nicht erkannte Antworten (nur auf diesem Gerät), Übersicht über #fehlertexte oder Umschalt+Alt+F
const FFLOG='waveChecker.fehlerTexte';
const ffLogGet=()=>{try{const a=JSON.parse(localStorage.getItem(FFLOG)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
const ffLogSet=a=>{try{localStorage.setItem(FFLOG,JSON.stringify(a.slice(-300)))}catch(e){}};
// Handy/iPad: Beim Tippen wird der Chart kompakter und rückt nach oben, damit die Tastatur ihn nicht verdeckt
const ffVVH=()=>document.documentElement.style.setProperty('--vvh',(window.visualViewport?visualViewport.height:innerHeight)+'px');
function ffFit(){const c=$('#view .chart');if(c&&$('#view').classList.contains('fft-typing'))c.scrollIntoView({block:'start'})}
function ffTyping(on){const v=$('#view');if(!v)return;v.classList.toggle('fft-typing',on);ffVVH();if(on){setTimeout(ffFit,60);setTimeout(ffFit,380)}}
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{ffVVH();ffFit()});
function fehlerTexte(){
 $('#menu').hidden=false;window.scrollTo(0,0);const a=ffLogGet().slice().reverse(),ent={offen:'ohne Entscheidung',meinte:'„Das meinte ich“',daneben:'„Lag daneben“'};
 $('#view').innerHTML='<div class="card"><h2>Nicht erkannte Antworten</h2><p class="mut">„Fehler finden“ Schwer, nur auf diesem Gerät gespeichert ('+a.length+'). Zum Ergänzen der Begriffe in fehler-schluesselwoerter.json nach dem Thema suchen.</p>'+
  (a.length?a.map(x=>'<div class="ffitem"><p class="mut">'+esc(new Date(x.d).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}))+' · '+esc(x.m||'')+' · Welle '+esc(x.w||'')+' · '+(ent[x.e]||'')+'</p><p><b>„'+esc(x.t||'')+'“</b></p><p class="mut">Gesucht: '+esc(x.th||'')+'</p></div>').join(''):'<p>Noch keine.</p>')+
  '<p><button class="p" id="ffcp" '+(a.length?'':'disabled')+'>Als Text kopieren</button><button id="ffcl" '+(a.length?'':'disabled')+'>Liste leeren</button><button onclick="home()">Zurück</button></p><p class="mut" id="ffmsg"></p></div>';
 $('#ffcp').onclick=()=>{const t=JSON.stringify(ffLogGet(),null,1);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>$('#ffmsg').textContent='Kopiert.',()=>{$('#ffmsg').innerHTML='<textarea rows="6" style="width:100%">'+esc(t)+'</textarea>'})};
 $('#ffcl').onclick=function(){if(!this.dataset.ok){this.dataset.ok=1;this.textContent='Wirklich leeren?';return}ffLogSet([]);fehlerTexte()};
}
addEventListener('hashchange',()=>{if(location.hash==='#fehlertexte')fehlerTexte()});
document.addEventListener('keydown',e=>{if(e.code==='KeyF'&&e.altKey&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();fehlerTexte()}});
function findSub(key,lvl){
 const hard=(lvl||FLV())==='schwer';
 if(hard&&!FFJ){$('#view').innerHTML='<p class="kick">Fehler finden · Schwer</p><p class="mut">Lädt …</p>';
  return ffLoad().then(ok=>ok?findSub(key,'schwer'):($('#view').innerHTML='<div class="card"><p class="bad">Die Begriffsliste für „Schwer“ konnte nicht geladen werden.</p><p>Prüfe die Internetverbindung oder spiele „Leicht“.</p><p><button class="p" id="ffl">Leicht spielen</button><button onclick="home()">Zurück</button></p></div>',$('#ffl').onclick=()=>findSub(key,'leicht')))}
 const P=PAT[key],IM=PAT.imp,sub5=['IMP-1','IMP-2','IMP-3'],imp=key==='imp';
 const SR={}; // alle möglichen Regeln: Hauptebene unter der Regel-ID, Teilstruktur mit Präfix „s:“
 P.viol.forEach(id=>SR[id]=P.rules[id]);
 if(key==='imp'){ // Alternation und Dreieck in Welle 2 (nur Impuls)
  SR['W4-3']={where:'Regelwerk, Abschnitt Welle 4',name:'Welle 2 und Welle 4 bilden dasselbe Korrekturmuster aus',hint:'Vergleiche die Muster, die an Welle 2 und Welle 4 stehen.',ex:'Alternation: Welle 4 muss ein anderes Korrekturmuster ausbilden als Welle 2 derselben Wellenebene.'};
  SR['DRE-1']={page:50,name:'Dreieck in Welle 2',hint:'Schau, welches Muster an Welle 2 steht. Gibt es ein Muster, das dort nie vorkommt?',ex:'Dreiecke treten niemals in Welle 2, C und W auf.'};}
 sub5.forEach(id=>SR['s:'+id]={...IM.rules[id],name:'Subwellen: '+IM.rules[id].name});
 Object.assign(SR,{
  's:IMP-4':{page:38,name:'Eine Impulswelle (1, 3 oder 5) ist nicht fünfteilig',hint:'Zähle die Subwellen der Wellen 1, 3 und 5.',ex:'Welle 1, 3 und 5 verlaufen in Trendrichtung und sind impulsiv (5-teilig).'},
  's:ZZ-1':{page:42,name:'Welle A oder C ist nicht fünfteilig',hint:'Zähle die Subwellen von A und C.',ex:'Die Wellen A und C werden impulsiv fünfteilig gebildet.'},
  's:ZZ-2':{page:42,name:'Welle B ist nicht dreiteilig',hint:'Zähle die Subwellen von Welle B.',ex:'Welle B besteht aus 3 Subwellen.'},
  's:FL-A':{page:46,name:'Welle A ist nicht dreiteilig',hint:'Zähle die Subwellen von Welle A.',ex:'Bei jeder Flat ist Welle A dreiteilig.'},
  's:WB-2':{where:'Regelwerk, Abschnitt Welle B',name:'Welle B ist nicht dreiteilig',hint:'Zähle die Subwellen von Welle B.',ex:'In Flats ist Welle B dreiteilig korrektiv.'},
  's:DRE-4':{page:50,name:'Eine Dreieckswelle ist nicht dreiteilig',hint:'Zähle die Subwellen jeder Welle des Dreiecks.',ex:'Ein Dreieck hat 5 Wellen (A-B-C-D-E), die jeweils dreiteilig ausgebildet werden.'},
  's:DL-2':{where:'Regelwerk, Abschnitt Diagonale',name:'Teilstruktur passt nicht zu 5-3-5-3-5 oder 3-3-3-3-3',hint:'Zähle die Subwellen aller fünf Wellen und vergleiche sie mit den erlaubten Mustern.',ex:'Die Leading Diagonale ist fünfteilig und bildet ein 5-3-5-3-5- oder ein 3-3-3-3-3-Muster.'},
  's:DB-2':{where:'Regelwerk, Abschnitt Diagonale',name:'Eine Welle der Diagonale ist nicht dreiteilig',hint:'Zähle die Subwellen aller fünf Wellen.',ex:'Die Beendende Diagonale bildet ein 3-3-3-3-3-Muster.'},
  's:DE-2':{where:'Regelwerk, Abschnitt Diagonale',name:'Eine Welle der Diagonale ist nicht dreiteilig',hint:'Zähle die Subwellen aller fünf Wellen.',ex:'Bei der Expandierenden Diagonale muss stets ein 3-3-3-3-3-Muster vorliegen.'},
  's:WC-2':{where:'Regelwerk, Abschnitt Welle C',name:'Welle C ist nicht fünfteilig',hint:'Zähle die Subwellen von Welle C.',ex:'In Flats ist Welle C ein klassischer Fünfteiler (oder eine Ending Diagonale).'}});
 // Optionen: {id, wave, plan}; plan = Umbau der Teilstruktur einer Welle (nur bei Subwellen-Fehlern)
 const opts=[],dyn=id=>key==='trk'||key==='tre'||id==='DE-3'; // bei diesen Regeln hängt die fehlerhafte Welle von der Runde ab
 const mainOpts=P.viol.map(id=>({id,wave:dyn(id)?'*':P.rules[id].wave,main:true}));
 if(key==='imp')mainOpts.push({id:'W4-3',wave:'4',alt:['2','4'],main:true},{id:'DRE-1',wave:'2',main:true});
 // Überlappung (IMP-3) ist nur dort ein Fehler, wo keine Diagonale möglich ist: Impuls Welle 3 (W3-1), Zigzag-A (ZZ-1). In Welle 1, 5 und C kann es eine Diagonale sein.
 const ok5=(id,k)=>id!=='IMP-3'||(imp&&k===3)||(key==='zig'&&k===1);
 const add=(id,k,plan)=>opts.push({id,wave:P.waves[k-1],k,plan});
 if(imp){for(const k of [1,3,5]){add('s:IMP-4',k,{parts:3});sub5.filter(id=>ok5(id,k)).forEach(id=>add('s:'+id,k,{parts:5,viol:id}))}}
 else if(key==='zig'){for(const k of [1,3]){add('s:ZZ-1',k,{parts:3});sub5.filter(id=>ok5(id,k)).forEach(id=>add('s:'+id,k,{parts:5,viol:id}))}add('s:ZZ-2',2,{parts:5})}
 else if(key==='fr'||key==='fe'||key==='fru'){add('s:FL-A',1,{parts:5});add('s:WB-2',2,{parts:5});add('s:WC-2',3,{parts:3});sub5.filter(id=>ok5(id,3)).forEach(id=>add('s:'+id,3,{parts:5,viol:id}))}
 else if(key==='trk'||key==='tre'){for(let k=1;k<=5;k++)add('s:DRE-4',k,{parts:5})} // jede Dreieckswelle ist dreiteilig
 else if(key==='dl'){for(let k=1;k<=5;k++)add('s:DL-2',k,{parts:k%2?3:5})} // 5-3-5-3-5 oder 3-3-3-3-3: eine abweichende Welle bricht das Muster
 else if(key==='db')for(let k=1;k<=5;k++)add('s:DB-2',k,{parts:5})
 else if(key==='de')for(let k=1;k<=5;k++)add('s:DE-2',k,{parts:5})
 // dz und tz: nur Hauptebene (Dehnung von X, Dreieck in W); die Muster der Teile stehen im Chart
 mainOpts.slice().forEach(x=>(FFPS[x.id]||[]).forEach(p=>{if(P.waves.includes(p)&&x.id!=='W4-3')mainOpts.push({...x,wave:p,partner:true})})); // Regelauswahl auch bei der Partnerwelle
 const all=mainOpts.concat(opts).concat(key==='imp'?[{id:'W4-3',wave:'2'}]:[]),pickFrom=a=>a[Math.floor(Math.random()*a.length)];
 // Genau ein Verstoß (15.11.2026, Lenny): die ganze Runde (Haupt- und Subwellen) prüfen, bei weiteren Verstößen neu erzeugen
 let o,R,tries=0;const mainO=mainOpts.filter(x=>!x.partner);
 for(;tries<4000;tries++){if(tries%200===0)o=(!opts.length||Math.random()<.4)?pickFrom(mainO):pickFrom(opts);
  R=o.main?makeSubRound(P,{},o.id,true):makeSubRound(P,{[o.k]:o.plan},null,true);if(findOk(P,R,o))break}
 const id=o.id,m={w:null,r:null},wv=o.main?(R.vwave||o.wave):o.wave,inv=ffInv(P,R,o,wv); // inv: alle beteiligten Wellen, jede zählt als richtig
 // Beschriftung: alle Hauptpunkte (weiter außen) und alle Subpunkte jeder Welle, einschließlich des letzten ((v) bzw. (c)); Subwellen in Größe 4 der Schreibweise (seit 27.11.2026)
 const pts=R.mp.map((i,q)=>({i,l:R.lab?R.lab[q]:P.labels[q],far:true}));
 Object.keys(R.spAll).forEach(q=>{const t=R.spAll[q],lab=t.length===5?(R.tri[q]?['(a)','(b)','(c)','(d)','(e)']:['(i)','(ii)','(iii)','(iv)','(v)']):R.wxy[q]?['(w)','(x)','(y)']:['(a)','(b)','(c)'];t.forEach((i,j)=>pts.push({i,l:lab[j],sub:true}))});
 const solution=()=>'Gesucht war: Welle '+inv.join(' oder ')+', Regel „'+mt(SR[id].name)+'“ ('+tag({rules:SR},id)+'). '+SR[id].ex;
 const FX={}; // aufgefüllte Regelauswahl je Welle
 const render=fb=>{
  let rl=m.w?[...new Set(all.filter(x=>x.wave===m.w||x.wave==='*').map(x=>x.id))]:[];
  if(m.w&&rl.length<3)rl=FX[m.w]||(FX[m.w]=shuffle(rl.concat(shuffle([...new Set(all.map(x=>x.id))].filter(x=>!rl.includes(x))).slice(0,3-rl.length))));
  $('#view').classList.remove('fft-typing');
  $('#view').innerHTML='<p class="kick">Fehler finden · '+(hard?'Schwer · ':'')+P.title+'</p><p class="task">Diese Zählung enthält genau einen Regelverstoß, auf Hauptebene oder in den Subwellen. '+(hard?'Wähle die fehlerhafte Welle und beschreibe in eigenen Worten, was falsch ist.':'Wähle die fehlerhafte Welle und die verletzte Regel.')+'</p><div class="chart">'+drawS(R,pts,null)+'</div>'+
   '<div class="card ffw"><b>Welche Welle?</b><br>'+P.waves.map(w=>'<button data-w="'+w+'" class="'+(m.w===w?'on':'')+'" '+(fb?'disabled':'')+'>Welle '+w+'</button>').join('')+
   (hard?(m.w?'<label class="fftl" for="fft"><b>Was ist falsch?</b> <span class="mut">(1–2 Sätze)</span></label><textarea id="fft" class="ffta" rows="2" maxlength="280" enterkeyhint="send" autocomplete="off" autocapitalize="sentences" placeholder="Beschreibe den Regelverstoß in eigenen Worten" '+(fb?'disabled':'')+'>'+esc(m.txt||'')+'</textarea>'+(fb?'':'<button class="p fftgo" id="fftgo" type="button">Auswerten</button>'):'<br><span class="mut">Tippe zuerst die Welle an, in der du den Fehler vermutest. Danach beschreibst du ihn in eigenen Worten.</span>')+
    '</div><div class="dock"><button class="p" id="go" '+(canGo()&&!fb?'':'disabled')+'>Auswerten</button><button id="dk" '+(fb?'disabled':'')+'>Ich weiß nicht</button></div><div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>':
   (m.w?'<br><b>Welche Regel?</b> <span class="mut">(Regeln zu Welle '+m.w+' und ihren Subwellen)</span><br>'+(rl.length?rl.map(x=>'<button data-r="'+x+'" class="'+(m.r===x?'on':'')+'" '+(fb?'disabled':'')+'>'+mt(SR[x].name)+'</button>').join(''):'<span class="mut">Zu dieser Welle gibt es in diesem Muster keinen Regelverstoß.</span>'):'<br><span class="mut">Klicke zuerst die Welle an, in der du den Fehler vermutest. Danach siehst du die Regeln zur Auswahl.</span>')+
   '</div><div class="dock"><button class="p" id="go" '+(m.w&&m.r&&!fb?'':'disabled')+'>Auswerten</button><button id="dk" '+(fb?'disabled':'')+'>Ich weiß nicht</button></div><div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>');
  if(fb)return;
  document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{m.w=b.dataset.w;if(!all.some(x=>(x.wave===m.w||x.wave==='*')&&x.id===m.r))m.r=null;render()});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{m.r=b.dataset.r;render()});
  $('#dk').onclick=()=>{pathMark('find');render('<p class="mut">Kein Problem, hier die Auflösung (keine Punkte, deine Serie bleibt).</p><p>'+(hard?hsol():solution())+'</p><button class="p" id="nxt">Nächster Chart</button>');$('#nxt').onclick=()=>findSub(key,lvl);};
  if(hard){const ta=$('#fft');if(!ta)return;
   const upd=()=>{m.txt=ta.value;$('#go').disabled=!canGo();const g=$('#fftgo');if(g)g.disabled=!canGo()};upd();
   ta.oninput=upd;ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(canGo())goHard()}};
   if(matchMedia('(pointer:coarse)').matches){ta.onfocus=()=>ffTyping(true);ta.onblur=()=>setTimeout(()=>{if(document.activeElement!==ta)ffTyping(false)},150)}
   $('#fftgo').onpointerdown=e=>e.preventDefault(); // Tastatur bleibt offen, bis ausgewertet ist
   $('#fftgo').onclick=$('#go').onclick=()=>{if(canGo())goHard()};return}
  $('#go').onclick=()=>{pathMark('find');const wOk=inv.includes(m.w),rOk=m.r===id,ok=wOk&&rOk;
   if(ok){st.streak++;st.pts+=10;exSolved(P.key,0)}else st.streak=0;stats();
   render('<p class="'+(ok?'ok':'bad')+'">'+(ok?'Richtig! +10 Punkte':wOk?'Die Welle stimmt, die Regel nicht.':rOk?'Die Regel stimmt, die Welle nicht.':'Leider daneben.')+'</p><p>'+solution()+'</p><button class="p" id="nxt">Nächster Chart</button>');
   $('#nxt').onclick=()=>findSub(key,lvl);};
 };
 // Schwer: Freitext prüfen. Richtung der Bezugswelle: Hauptebene = erste Welle des Musters, Subwellen = die Welle, in der sie liegen.
 function canGo(){return hard?!!(m.w&&(m.txt||'').trim().length>=3):!!(m.w&&m.r)}
 const einf=()=>(hard&&FFT.einfach(FFJ,id))||mt(SR[id].ex),wtxt=()=>inv.join(' oder ');
 // „Anders gesagt“ (15.11.2026): derselbe Verstoß aus dem Blickwinkel der anderen beteiligten Welle
 const anders=()=>{if(inv.length<2)return'';const h=m.w===wv,t=FFT.anders(FFJ,id,h?'haupt':'partner');
  return t?'<p class="mut">Anders gesagt: '+esc(t.split('{welle}').join(wv).split('{partner}').join(h?inv.slice(1).join(' bzw. '):m.w))+'</p>':''};
 const hsol=()=>'Gesucht war Welle '+wtxt()+'. <b>'+esc(einf())+'</b> <span class="mut">('+tag({rules:SR},id)+')</span>';
 function goHard(){
  const txt=(m.txt||'').trim();if(!txt||!m.w)return;pathMark('find');if(document.activeElement)document.activeElement.blur();
  const k0=o.main?1:o.k,dir=R.pr[R.mp[k0]]>R.pr[R.mp[k0-1]]?'auf':'ab',wOk=inv.includes(m.w);
  const ok=FFT.check(FFJ,id,txt,{welle:wv,partner:inv.slice(1),bezug:FFPS[id]||[],gewaehlt:m.w,dir}).ok,you='<p class="mut">Deine Antwort: „'+esc(txt)+'“</p>',nx='<button class="p" id="nxt">Nächster Chart</button>';
  const done=h=>{render(h);$('#nxt').onclick=()=>findSub(key,lvl)};
  if(!wOk){st.streak=0;stats();return done('<p class="bad">'+(ok?'Die Regel stimmt, die Welle nicht.':'Leider daneben.')+'</p>'+you+'<p>'+hsol()+'</p>'+nx)}
  if(ok){st.streak++;st.pts+=10;stats();exSolved(P.key,0);return done('<p class="ok">Richtig erkannt! +10 Punkte</p>'+you+'<p>Die Regel in einfachen Worten: <b>'+esc(einf())+'</b> <span class="mut">('+tag({rules:SR},id)+')</span></p>'+anders()+nx)}
  // nicht sicher zugeordnet: richtige Regel zeigen, der Spieler entscheidet selbst; die Antwort wird für die Begriffslisten gemerkt
  const log=ffLogGet(),e={d:new Date().toISOString(),m:P.title,w:m.w,id,th:FFT.thema(FFJ,id)||SR[id].name,t:txt,e:'offen'};log.push(e);ffLogSet(log);
  const mark=v=>{const a=ffLogGet(),x=a.find(q=>q.d===e.d&&q.t===e.t);if(x){x.e=v;ffLogSet(a)}};
  const ask='<p class="bad">Das konnte ich nicht sicher zuordnen.</p>'+you+'<p>Gesucht war in Welle '+wtxt()+': <b>'+esc(einf())+'</b> <span class="mut">('+tag({rules:SR},id)+')</span></p>';
  render(ask+'<p>Hast du das gemeint?</p><p class="ffb"><button class="p" id="ffy">Das meinte ich</button><button id="ffn">Lag daneben</button></p>');
  $('#ffy').onclick=()=>{mark('meinte');st.pts+=5;stats();done(ask+'<p class="ok">Halbe Punkte: +5</p>'+nx)};
  $('#ffn').onclick=()=>{mark('daneben');st.streak=0;stats();done(ask+'<p class="mut">Keine Punkte. Schau dir die Regel oben noch einmal an.</p>'+nx)};
 }
 window.FFS={id,wv,inv,hard,P,R,o,tries};tutCtx(hard?'find-schwer':'find',()=>findSub(key,lvl)); // Testzugriff (tests/fehler-schwer-ui.js): gesuchte Regel und Welle der laufenden Runde
 render();
}
