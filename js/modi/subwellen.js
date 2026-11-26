/* js/modi/subwellen.js – Modus „Subwellen zählen“ (sub, pickSub, drawS: Chart mit Haupt- und Subwellen).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
function drawS(R,pts,band){
 chartSize();const N=R.pr.length-1,DXs=(W-2*X0)/N,lo=Math.min(...R.pr),hi=Math.max(...R.pr),Y=p=>46+(hi-p)/(hi-lo)*(H-90),X=i=>X0+i*DXs; // mehr Rand, damit die äußeren Hauptlabels nicht abgeschnitten werden
 let s='<svg id="svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Preischart">';
 if(band)s+='<rect x="'+X(band[0])+'" y="0" width="'+(X(band[1])-X(band[0]))+'" height="'+H+'" fill="var(--line)" opacity=".35"/>';
 for(let g=0;20+g*50<H;g++)s+='<line x1="0" x2="'+W+'" y1="'+(20+g*50)+'" y2="'+(20+g*50)+'" stroke="var(--line)" stroke-width=".6"/>';
 s+='<polyline fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" points="'+R.pr.map((p,i)=>X(i)+','+Y(p)).join(' ')+'"/>';
 pts.forEach(q=>{const i=q.i,up=R.pr[i]>=(R.pr[i-1]??-1e9)&&R.pr[i]>=(R.pr[i+1]??-1e9);
  if(q.set)s+='<circle cx="'+X(i)+'" cy="'+Y(R.pr[i])+'" r="'+(q.drag?8:6)+'" fill="'+(q.drag?'var(--accent)':'var(--text)')+'" stroke="var(--surface)" stroke-width="'+(q.drag?2.5:1.5)+'"/>'; // gezogener Punkt hervorgehoben (18.11.2026)
  if(q.l==='0'){if(!q.set)s+='<circle cx="'+X(i)+'" cy="'+Y(R.pr[i])+'" r="3.5" fill="var(--muted)"/>';return} // Start: Marker statt „0“
  s+='<text class="lab'+(q.drag?' drg':'')+'" '+(q.set?'style="font-size:20px;font-weight:800;paint-order:stroke;stroke:var(--surface);stroke-width:5px" ':q.sub?'style="font-size:12px;opacity:.85" ':'')+'x="'+labX(X(i),q.l,q.set?20:q.sub?12:LFS())+'" y="'+(Y(R.pr[i])+(up?(q.set?-11:-6)-(q.far?13:0):(q.set?24:14)+(q.far?13:0)))+'">'+q.l+'</text>';});
 return s+'</svg>';
}
function pickSub(){pick('sub')} // gleiche Musterliste wie bei den anderen Modi
function sub(key){
 const P=PAT[key||'imp'],R=makeSubRound(P),N=R.pr.length-1,IM=PAT.imp;let DXs=(W-2*X0)/N;
 const stages=[{labels:P.labels,lo:0,hi:N,truth:R.mp,t:'Zähle zuerst die Hauptwellen.'}];
 Object.keys(R.sp).forEach(k=>{k=+k;const t=R.sp[k],five=t.length===5,nm=P.waves[k-1];
  stages.push({w:k,nm,five,labels:five?['(1)','(2)','(3)','(4)','(5)']:['(a)','(b)','(c)'],lo:R.mp[k-1],hi:R.mp[k],truth:t,
   t:'Zähle jetzt die Subwellen von Welle '+nm+' (grau hinterlegt). Sie besteht aus '+(five?'fünf':'drei')+' Wellen, setze auch '+(five?'(5)':'(c)')+' an das Ende der Welle (die Hauptbeschriftung steht etwas weiter außen).'});});
 const m={s:0,sel:[],tips:0,failed:false,fixed:[],gain:0};tutCtx('sub',()=>sub(P.key),{R,m,stages});
 const fx=()=>m.fixed.map(q=>q.sub?q:{...q,far:m.s>0}); // Hauptbeschriftung rückt in den Subwellen-Schritten nach außen
 // alle Punkte des Schritts, auch beim Ziehen in voller Größe mit Markierung; nur der gezogene ist hervorgehoben (18.11.2026)
 const cur=g=>fx().concat(m.sel.map((i,k)=>({i,l:g.labels[k],sub:!!g.w,set:1,drag:k===DRAGK})));
 const render=fb=>{
  const g=stages[m.s],n=g.labels.length,idxOf=x=>Math.max(0,Math.min(N,Math.round((x-X0)/DXs)));
  $('#view').innerHTML='<p class="kick">Subwellen zählen · '+P.title+' · Schritt '+(m.s+1)+' von '+stages.length+'</p><p class="task">'+g.t+' Nächster Punkt: <span class="nextpt">'+(m.sel.length<n?L0(g.labels[m.sel.length]):'fertig')+'</span></p><div class="chart">'+
   drawS(R,cur(g),g.w?[g.lo,g.hi]:null)+'</div><div class="dock"><button class="p" id="chk" '+(m.sel.length<n||m.done?'disabled':'')+'>Prüfen</button><button id="und" '+(m.done?'disabled':'')+'>Zurück</button><button id="rst" '+(m.done?'disabled':'')+'>Neu setzen</button></div><div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>';
  DXs=(W-2*X0)/N; // drawS hat die Zeichenfläche gerade neu bestimmt (Handy/PC)
  const svg=$('#svg'),xAt=ev=>{const r=$('#svg').getBoundingClientRect();return (ev.clientX-r.left)/r.width*W};
  svg.style.touchAction='none';
  const top=g.w?Math.min(N,g.hi+TOL):N; // der letzte Subpunkt darf auf dem Hauptpunkt liegen
  const bounds=k=>[k>0?m.sel[k-1]+1:(g.w?g.lo+1:0),k<m.sel.length-1?m.sel[k+1]-1:top];
  svg.onpointerdown=e=>{if(m.done)return;e.preventDefault();
   const r=svg.getBoundingClientRect(),sc=r.width/W,px=e.clientX-r.left,py=e.clientY-r.top;let k=-1,best=m.sel.length<n?16:1e9; // solange Punkte fehlen: nur greifen, wenn der Finger sehr nah (16 px) dran ist; sind alle gesetzt: immer der nächste Punkt
   // Seit 18.11.2026 (Lenny): Treffer über die Lage jedes gesetzten Punkts und seines Labels (gleiche Geometrie wie drawS). Früher wurden
   // die Labels im SVG abgezählt; der Start hat aber kein Label, daher griff z. B. ein Tipp auf die 2 die 1 („springt zurück“, „aus 2 wird 1“).
   const lo_=Math.min(...R.pr),hi_=Math.max(...R.pr),Xv=i=>X0+i*DXs,Yv=p=>46+(hi_-p)/(hi_-lo_)*(H-90);
   if(m.sel.length&&!(m.sel.length<n&&idxOf(xAt(e))>m.sel[m.sel.length-1]))m.sel.forEach((i,j)=>{ // Tipp rechts vom letzten Punkt setzt immer einen neuen (am Handy liegen Punkte eng)
    const x=Xv(i),y=Yv(R.pr[i]),up=R.pr[i]>=(R.pr[i-1]??-1e9)&&R.pr[i]>=(R.pr[i+1]??-1e9),ly=y+(up?-18:17),lx=labX(x,g.labels[j],20);
    const d=Math.min(Math.hypot(x*sc-px,y*sc-py),Math.hypot(lx*sc-px,ly*sc-py)); // Punkt oder seine Beschriftung
    if(d<best){best=d;k=j}});
   if(k>=0){const mv=ev=>{const[lo,hi]=bounds(k),w=idxOf(xAt(ev)),nw=Math.max(lo,Math.min(hi,w));
     if(w!==nw)ordHint(); // stoppt an der Grenze, das Label bleibt
     if(nw!==m.sel[k]){m.sel[k]=nw;redraw(svg,drawS(R,cur(g),g.w?[g.lo,g.hi]:null));}};
    DRAGK=k;redraw(svg,drawS(R,cur(g),g.w?[g.lo,g.hi]:null));
    startDrag(svg,e,mv,()=>{DRAGK=-1;render()});
   }else if(m.sel.length<n){const i=idxOf(xAt(e)),lo=m.sel.length?m.sel[m.sel.length-1]+1:(g.w?g.lo+1:0);
    if(i<lo||i>top)return render('<span class="warn">'+(g.w?'Der Punkt muss innerhalb der grauen Welle und rechts vom vorherigen liegen.':'Der Punkt muss rechts vom vorherigen liegen.')+'</span>');
    m.sel.push(i);render();}};
  $('#und').onclick=()=>{m.sel.pop();render()};$('#rst').onclick=()=>{m.sel=[];render()};
  $('#chk').onclick=verify;
 };
 const fail=()=>{m.failed=true;if(st.streak)st.streak=0,stats()};
 const msg=h=>{fail();render('<p class="bad">Noch nicht ganz.</p>'+h)};
 const tipUI=f=>{const r=IM.rules[f[0]],pre='In den Subwellen von Welle '+stages[m.s].nm+': ';
  const lines=['Die Zählung ist noch nicht regelkonform.'];
  if(m.tips>=1)lines.push('Tipp 1: '+pre+mt(r.hint));
  if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „'+mt(r.name)+'“.');
  if(m.tips>=3)lines.push('Tipp 3: '+tag(IM,f[0])+'. '+r.ex);
  render('<p class="bad">Noch nicht ganz.</p>'+lines.map(tipLine).join('')+(m.tips<3?'<button id="tip">Tipp anzeigen</button>':''));
  const t=$('#tip');if(t)t.onclick=()=>{m.tips++;tipUI(f)};
 };
 const tipMain=f=>{const r=P.rules[f[0]];
  const lines=['Die Zählung ist noch nicht regelkonform.'];
  if(m.tips>=1)lines.push('Tipp 1: '+mt(r.hint));
  if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „'+mt(r.name)+'“.');
  if(m.tips>=3)lines.push('Tipp 3: '+tag(P,f[0])+'. '+r.ex);
  render('<p class="bad">Noch nicht ganz.</p>'+lines.map(tipLine).join('')+(m.tips<3?'<button id="tip">Tipp anzeigen</button>':''));
  const t=$('#tip');if(t)t.onclick=()=>{m.tips++;tipMain(f)};
 };
 const verify=()=>{
  const g=stages[m.s],n=g.labels.length,main=!g.w;
  // Platzierung ist eine App-Vorgabe: jeder Punkt muss am echten Wendepunkt sitzen (Toleranz TOL Kerzen)
  const bad=m.sel.findIndex((i,k)=>(main?k>0:true)&&Math.abs(i-g.truth[k])>TOL);
  if(bad>=0){
   if(main&&bad===n-1)return msg('<p>'+P.endMsg+'</p>');
   return msg('<p>Punkt '+g.labels[bad]+' sitzt nicht am relevanten Wendepunkt. Setze ihn an das Hoch bzw. Tief, wo die Bewegung wirklich dreht, nicht an eine kleinere Zwischenspitze.</p>');}
  let v,f=[],w='';
  if(main){v=norm(P,m.sel.map(i=>R.pr[i]));
   if(P.struct&&!P.struct(v))return msg('<p>'+P.structMsg+'</p>');
   f=hardFails(P,v);if(f.length){fail();return tipMain(f)}
   w=warns(P,v).map(id=>lvlNote(P,id)).join('')+P.info(v);
  }else{
   const pts=[g.lo].concat(m.sel),sg=Math.sign(R.pr[g.hi]-R.pr[g.lo]);v=pts.map(i=>sg*(R.pr[i]-R.pr[pts[0]])); // in Richtung der Welle gemessen
   // Diagonale möglich (Impuls Welle 1/5, Zigzag-/Flat-C): Überlappung IMP-3 ist dort kein Fehler, die Diagonalen-Regeln prüft diese Stufe noch nicht
   const diag=(key==='imp'?(g.w===1||g.w===5):key==='dl'?false:P.waves[g.w-1]==='C'),olap=!IM.rules['IMP-3'].ok(v);
   if(g.five){f=hardFails(IM,v).filter(id=>!(diag&&id==='IMP-3'));if(f.length){fail();return tipUI(f)}
    if(diag&&olap)w+='<p class="mut">Welle '+g.nm+' überlappt sich: Das wäre nur als Diagonale zulässig (Ending Diagonale in C bzw. Diagonale in Welle 1 oder 5). Die Diagonalen-Regeln prüft diese Stufe noch nicht.</p>';
    w+=warns(IM,v).map(id=>lvlNote(IM,id)).join('');}
   else if(!(v[1]>v[0]&&v[2]<v[1]&&v[3]>v[2]))return msg('<p>Eine dreiteilige Welle läuft a in Richtung der Welle, b dagegen und c wieder in Richtung der Welle. Prüfe die Richtung deiner Punkte.</p>');
  }
  m.done=true;const gain=Math.max(2,5-2*m.tips);m.gain+=gain;st.pts+=gain;stats();
  const last=m.s===stages.length-1;
  const done=(main?'Hauptwellen':'Subwellen von Welle '+g.nm)+' regelkonform! +'+gain+' Punkte';
  if(last&&!m.failed){st.streak++;stats();}
  if(last){exSolved(P.key,(m.tt||0)+m.tips);pathMark('sub')} // Rang: Tipps aller Stufen zusammen
  m.fixed=m.fixed.concat(m.sel.map((i,k)=>({i,l:g.labels[k],sub:!main})));
  render('<p class="ok">'+done+'</p>'+w+(last?'<p class="mut">Runde geschafft: '+m.gain+' Punkte.</p>':'')+'<button class="p" id="nxt">'+(last?'Nächster Chart':'Weiter')+'</button>');
  $('#nxt').onclick=()=>{if(last)return sub(P.key);m.s++;m.sel=[];m.tt=(m.tt||0)+m.tips;m.tips=0;m.done=false;render();};
 };
 render();
}
