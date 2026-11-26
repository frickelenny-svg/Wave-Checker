/* js/ui/startseite.js – Startseite: Fortsetzen-Karte (resume), Handy-Pfad mit Stationen (STN, wpDraw, pathHome), Inseln am Desktop, home().
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
function resumeCard(){const o=resLoad();if(!o)return '';
 const what=o.t==='quiz'?'Quiz '+esc(o.cat||'Gemischt')+' · Frage '+Math.min(o.i+1,o.ids.length)+' von '+o.ids.length:'Blitz-Erkennen '+esc(o.opt.name)+' · Chart '+(o.m.i+1)+' von '+BZN;
 return '<div class="card rsm"><p><b>Weitermachen?</b> '+what+'</p><p><button class="p" onclick="resume()">Weitermachen</button><button onclick="resDrop();home()">Verwerfen</button></p></div>'}
async function resume(){const o=resLoad();if(!o)return home();
 if(o.t==='quiz'){if(!await qReady())return;const f=id=>QZ.find(q=>q.id===id),R={cat:o.cat,qs:o.ids.map(f).filter(Boolean),i:o.i,res:o.res.map(r=>({q:f(r.id),ok:r.ok})).filter(r=>r.q)};
  return R.i<R.qs.length?quizAsk(R):quizEnd(R)}
 blitz(o.opt,o.lvl,o);}
function pathMark(id){const o=pLoad();if(o[id])return;o[id]=1;try{localStorage.setItem(PKEY,JSON.stringify(o))}catch(_){}}
const STN=[ // w: Welle, f: Lage innerhalb der Welle (0 bis 1)
 {w:1,f:.5,wn:'Verstehen',id:'learn',t:'Elliott-Wellen lernen',d:'Das Regelwerk mit Beispielcharts',ic:'book',act:'learn()'},
 {w:2,f:.5,wn:'Festigen',id:'quiz',t:'Quiz',d:'Kapitel abfragen',ic:'quiz',act:'quizMenu()'},
 {w:3,f:.13,wn:'Üben',id:'count',t:'Chart durchzählen',d:'Wellenpunkte setzen',ic:'count',act:"pick('count')"},
 {w:3,f:.38,id:'find',t:'Fehler finden',d:'Den Regelverstoß finden',ic:'search',act:"pick('find')"},
 {w:3,f:.63,id:'recog',t:'Muster erkennen',d:'Normal oder schwer',ic:'eye',act:'recognize()'},
 {w:3,f:.88,id:'sub',t:'Subwellen zählen',d:'Haupt- und Subwellen',ic:'layers',act:'pickSub()'},
 {w:4,f:.5,wn:'Tempo',id:'blitz',t:'Blitz-Erkennen',d:'Muster in Sekunden',ic:'bolt',act:'pathBlitz()'},
 {w:5,f:.2,wn:'Meistern',id:'progn',t:'Wie geht es weiter?',d:'Fehlende Wellen planen',ic:'trend',act:'progn()'},
 {w:5,f:.56,id:'own',t:'Eigenen Chart prüfen',d:'Deine Zählung nach dem Regelwerk',ic:'image',act:'ownChart()'}, // 20.11.2026
 {w:5,f:.9,id:'ranks',t:'Meine Ränge',d:'',ic:'medal',act:'ranksOpen()',gold:true}]; // 23.11.2026: erst neue Rangaufstiege, dann Ränge
// Der Pfad-Chart: Hauptpunkte eines regelkonformen Impulses (Welle 2 bleibt über dem Start, Welle 3 ist die längste,
// Welle 4 bleibt über dem Ende von Welle 1, Welle 3 ≥ 123,6 % von Welle 1, Welle 5 ≥ 38,2 %) und Kerzen je Welle.
const WPV=[0,1,.45,2.6,1.9,3.3],WPN=[12,8,26,10,16],WPS=13;
function wpCandles(){ // feste Kerzen (gleicher Chart bei jedem Öffnen): Subwellen 5-teilig bzw. 3-teilig, dazu kleine Zacken
 let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647,c=[];let prev=0;
 WPN.forEach((n,w)=>{const a=WPV[w],b=WPV[w+1],fr=w%2?[.62,.36,1]:[.38,.2,.8,.58,1],m=fr.length,piv=fr.map(f=>a+(b-a)*f);
  for(let i=1;i<=n;i++){const q=i/n*m,k=Math.min(m-1,Math.floor(q-1e-9)),p0=k?piv[k-1]:a,p1=piv[k],u=q-k;
   let cl=p0+(p1-p0)*u;if(i<n&&Math.abs(u-1)>1e-6)cl+=(r()-.5)*Math.abs(b-a)*.06; // kleine Zacken, nie über die Wendepunkte hinaus
   cl=Math.min(Math.max(cl,Math.min(a,b)),Math.max(a,b));if(i===n)cl=b;
   const o=prev,hi=Math.max(o,cl)+r()*.035,lo=Math.min(o,cl)-r()*.035;c.push({o,c:cl,hi:Math.min(hi,Math.max(a,b)),lo:Math.max(lo,Math.min(a,b)),w}) /* Dochte bleiben innerhalb der Welle: die Wendepunkte sind die echten Extreme */;prev=cl}});
 return c}
function wpRank(){const o=rLoad();if(o.master)return 'Elliott-Meister';const m=Math.max(0,...RCATS.map(c=>(o.rank||{})[c]||0));return m?'Bester Rang: '+RNAME[m]:RNAME[0]}
function pathHome(){
 const done=pLoad(),cur=STN.findIndex(s=>!done[s.id]);
 $('#view').innerHTML='<section class="wph"><h1>Dein Impuls zum Elliott-Profi</h1><p class="lead2">Fünf Wellen, vom ersten Kapitel bis zum Meister. Folge dem Chart nach unten.</p>'+
  dailyCard()+resumeCard()+'<div class="wp" id="wp"></div>'+
  '<p class="hreset"><button class="lnk" onclick="guideStart()">Einführung erneut ansehen</button></p><p id="rs" class="hreset">'+RSBTN+'</p></section>';
 wpDraw(cur,done);intro();
 if(guideSeen()&&cur>0)setTimeout(()=>{const e=$('.stn.cur');if(e)e.scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'})},250); // „Hier weitermachen“ ins Bild holen
}
function wpDraw(cur,done){const box=$('#wp');if(!box)return;
 const c=wpCandles(),n=c.length,Wd=box.clientWidth,ML=30,MR=30,lo=Math.min(...c.map(k=>k.lo)),hi=Math.max(...c.map(k=>k.hi)),T=30;
 const X=p=>ML+(p-lo)/(hi-lo)*(Wd-ML-MR),Y=i=>T+i*WPS+WPS/2,H=T+n*WPS+40,start=[0];WPN.forEach(k=>start.push(start[start.length-1]+k));
 const sIdx=STN.map(s=>start[s.w-1]+Math.max(0,Math.min(WPN[s.w-1]-1,Math.round(WPN[s.w-1]*s.f)-1)));
 const lim=cur<0?n:sIdx[cur],dt=1500/n; // bis zur aktuellen Station kräftig, danach blass
 let s='<svg class="wc" width="'+Wd+'" height="'+H+'" viewBox="0 0 '+Wd+' '+H+'" aria-hidden="true"><g class="grid">';
 for(let y=T;y<H;y+=52)s+='<line x1="0" x2="'+Wd+'" y1="'+y+'" y2="'+y+'"/>';
 for(let x=ML;x<=Wd-MR+1;x+=(Wd-ML-MR)/4)s+='<line x1="'+x+'" x2="'+x+'" y1="0" y2="'+H+'"/>';
 s+='</g>';
 c.forEach((k,i)=>{const y=Y(i),x0=X(Math.min(k.o,k.c)),x1=X(Math.max(k.o,k.c));
  s+='<g class="cd '+(k.c>=k.o?'up':'dn')+(i>lim?' late':'')+'" style="--d:'+Math.round(i*dt)+'ms"><line x1="'+X(k.lo)+'" x2="'+X(k.hi)+'" y1="'+y+'" y2="'+y+'"/>'+
   '<rect x="'+x0+'" y="'+(y-4.5)+'" width="'+Math.max(1.5,x1-x0)+'" height="9" rx="1.5"/></g>'});
 for(let w=1;w<=5;w++){const i=start[w]-1,top=w%2===1,x=X(c[i].c)+(top?18:-18); // Wellenzahl am Wendepunkt: Hochs rechts, Tiefs links
  s+='<g class="wl'+(i>lim?' late':'')+'" style="--d:'+Math.round(i*dt)+'ms"><circle cx="'+x+'" cy="'+Y(i)+'" r="12"/><text x="'+x+'" y="'+Y(i)+'">'+w+'</text></g>'}
 s+='</svg>';
 STN.forEach((st,j)=>{const i=sIdx[j],x=X(c[i].c),y=Y(i),isCur=j===cur,lft=x>Wd/2,gap=isCur?46:36,d=Math.round(i*dt);
  const sub=st.gold?wpRank():st.d,nb=st.id==='ranks'?rnBadge():'';
  s+='<button class="stn'+(done[st.id]?' done':'')+(isCur?' cur':'')+(st.gold?' gold':'')+'" data-t="'+st.t+'" aria-label="'+st.t+(done[st.id]?' (erledigt)':'')+(nb?', '+rnLabel():'')+'" style="left:'+x+'px;top:'+y+'px;--d:'+d+'ms" onclick="'+st.act+'">'+ICON[st.ic]+nb+'</button>'+
   '<div class="stl'+(lft?' lft':'')+(st.gold?' gold':'')+'" style="'+(lft?'right:'+(Wd-x+gap):'left:'+(x+gap))+'px;top:'+y+'px;max-width:'+Math.max(120,Math.round(lft?x-gap-6:Wd-x-gap-6))+'px;--d:'+d+'ms" onclick="'+st.act+'">'+
   (st.wn?'<small>Welle '+st.w+' · '+st.wn+'</small>':'')+'<b>'+st.t+'</b>'+(sub?'<span>'+sub+'</span>':'')+(isCur?'<span class="here">Hier weitermachen</span>':'')+'</div>'});
 box.style.height=H+'px';box.innerHTML=s;rnPop();}
// Station mit Auswahl: Blitz (welche Muster)
function pathBlitz(){$('#view').innerHTML='<div class="card"><h2>Blitz-Erkennen</h2><p class="mut">Muster in Sekunden erkennen. Welche Muster?</p><p><button class="p" onclick="blitz(\'easy\')">Einsteiger</button><button class="p" onclick="blitz(\'all\')">Alle Muster</button></p></div>';window.scrollTo(0,0)}
const isPath=()=>innerWidth<700;let HOMEW=isPath();
addEventListener('resize',()=>{const p=isPath();if(p!==HOMEW&&($('.home')||$('.wph'))&&!G){HOMEW=p;home()}else if(p&&$('#wp')&&!G){const done=pLoad();wpDraw(STN.findIndex(s=>!done[s.id]),done)}HOMEW=p});
function home(){if(isPath())return pathHome();
 const blitzIsl=cls=>bzCard().replace('class="isl"','class="isl '+cls+'"');
 $('#view').innerHTML='<section class="home"><div class="hbg">'+bgChart()+'</div>'+
  '<div class="hc"><p class="lead">Elliott-Wellen <span>lernen</span></p>'+dailyCard()+resumeCard()+
   '<p class="mut rec">Du kannst alles frei wählen. Empfehlung für dein Level: <b>'+STUFENNAME[recStage()]+'</b>.</p><p class="hreset"><button class="lnk" onclick="guideStart()">Einführung erneut ansehen</button></p><p id="rs" class="hreset">'+RSBTN+'</p></div>'+
  '<div class="hl">'+isl('book','Elliott-Wellen lernen','Das Regelwerk mit Beispielcharts','learn()')+
   isl('quiz','Quiz','Kapitel abfragen in kurzen Runden','quizMenu()')+
   rnIsl()+blitzIsl('mob')+'</div>'+
  '<div class="hrr">'+isl('count','Chart durchzählen','Wellenpunkte setzen und prüfen','pick(\'count\')')+
   isl('search','Fehler finden','Ein Regelverstoß steckt in der Zählung','pick(\'find\')')+
   isl('eye','Muster erkennen','Normal per Auswahl oder schwer selbst zählen','recognize()')+
   isl('layers','Subwellen zählen','Erst Hauptwellen, dann Subwellen','pickSub()')+'</div>'+
  '<div class="hb">'+isl('trend','Wie geht es weiter?','Plane die fehlenden Wellen nach den Regeln',null,
    '<span class="sb"><button class="p" onclick="progn()">Starten</button></span>')+isl('image','Eigenen Chart prüfen','Screenshot hochladen, selbst zählen, nach dem Regelwerk prüfen','ownChart()')+blitzIsl('desk')+'</div>'+
  '</section>';
 intro();rnPop();
}
