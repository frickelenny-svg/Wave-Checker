/* js/modi/eigener-chart.js – „Eigenen Chart prüfen“: Hochladen (ownChart), Zuschnitt-Vorschlag (ocSuggest), Zuschneiden (ocCrop). Zählen und
   Prüfen laufen in progn({img}) (js/modi/prognose.js).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
const OCMAX=2000; // längste Seite des zugeschnittenen Bilds in Pixeln (größere werden verkleinert, damit Einrasten und Export flüssig bleiben)
const OCNOTE='<p class="mut ocnote">Die App prüft deine Zählung nach dem Regelwerk. Sie erkennt keine Wellen selbst und gibt keine Kursprognose oder Anlageempfehlung.</p>';
function ownChart(){TUTCTX=null;
 $('#view').innerHTML='<p class="kick">Eigenen Chart prüfen</p><p class="task">Lade einen Screenshot oder ein Foto deines Charts hoch (PNG oder JPG). Danach schneidest du den Chartbereich zu und zählst ihn selbst, so wie in „Wie geht es weiter?“ auf Schwer.</p>'+
  '<label class="ocdrop" id="ocdrop"><input type="file" id="ocfile" accept="image/png,image/jpeg"><span class="ico">'+ICON.image+'</span><b>Bild wählen</b><span class="mut">'+(matchMedia('(pointer:coarse)').matches?'aus deinen Fotos oder Dateien':'oder hierher ziehen')+'</span></label>'+
  '<p class="mut octip">Beste Ergebnisse: In TradingView vorher alle Zeichnungen ausblenden (Augen-Symbol links) und nur den Chart abfotografieren.</p>'+
  '<p class="mut">Das Bild bleibt auf deinem Gerät. Es wird nicht hochgeladen.</p>'+OCNOTE;
 const inp=$('#ocfile'),dz=$('#ocdrop');
 const load=f=>{if(!f)return;if(!/^image\/(png|jpe?g)$/i.test(f.type||'')&&!/\.(png|jpe?g)$/i.test(f.name||''))return toast('Bitte ein PNG- oder JPG-Bild wählen.');
  const u=URL.createObjectURL(f),im=new Image();im.onload=()=>ocCrop(im,u);im.onerror=()=>{URL.revokeObjectURL(u);toast('Das Bild ließ sich nicht öffnen.')};im.src=u};
 inp.onchange=()=>load(inp.files[0]);
 dz.ondragover=e=>{e.preventDefault();dz.classList.add('on')};dz.ondragleave=()=>dz.classList.remove('on');
 dz.ondrop=e=>{e.preventDefault();dz.classList.remove('on');load(e.dataTransfer.files[0])};
 window.scrollTo(0,0)}
// Zuschneiden: Rahmen um den Chartbereich ziehen (ohne Achsen und Menüs). Ziehen an einer Ecke oder Kante ändert den Rahmen, Ziehen im Rahmen
// verschiebt ihn, Ziehen außerhalb zieht einen neuen. Anfangs ist das ganze Bild gewählt; dann zieht jedes Ziehen einen neuen Rahmen.
// Vorschlag für den Zuschnitt (25.11.2026, Lenny): Rahmen der Oberfläche und Achsen weg (wie in ocPath), oben und unten bis kurz über bzw. unter den
// erkannten Kurs (Legende, Werkzeugleisten), links und rechts bis zum Kurs. Auf einer Kopie mit höchstens 1600 px (kleiner werden die Achsenziffern zu blass).
function ocSuggest(im){try{const iw=im.naturalWidth,ih=im.naturalHeight,f=Math.min(1,1600/Math.max(iw,ih)),w=Math.max(1,Math.round(iw*f)),h=Math.max(1,Math.round(ih*f));
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,w,h);
  const T={data:g.getImageData(0,0,w,h).data,w,h};ocPath(T);const ax=T.ax||{l:0,t:0,r:w,b:h},hi=T.path.hi,lo=T.path.lo,xs=[],tops=[],bots=[];
  // nur der Kurs selbst: Stücke des Verlaufs (Lücke über 1,5 % der Breite oder Sprung über 10 % der Höhe trennt), das größte Stück und weitere ab
  // 3 % der Breite in seiner Höhenspanne (Kurslücken); kleine Stücke abseits (Kästchen oben links, Logo unten) zählen nicht
  const sg=[];let cur=null,lx=-1e9;for(let x=0;x<w;x++){if(hi[x]<0)continue;const gap=lx>=0?Math.max(0,hi[x]-lo[lx],hi[lx]-lo[x]):0;if(!cur||x-lx>w*.015||gap>h*.1){cur={a:x,b:x,n:0,t:1e9,u:-1};sg.push(cur)}cur.b=x;cur.n++;cur.t=Math.min(cur.t,hi[x]);cur.u=Math.max(cur.u,lo[x]);lx=x}
  const mn=sg.reduce((p,q)=>!p||q.n>p.n?q:p,null),pad=mn?(mn.u-mn.t)*.05:0,keep=sg.filter(q=>q===mn||(q.n>=w*.03&&q.u>=mn.t-pad&&q.t<=mn.u+pad));
  keep.forEach(q=>{for(let x=q.a;x<=q.b;x++)if(hi[x]>=0){xs.push(x);tops.push(hi[x]);bots.push(lo[x])}});
  // oben/unten der 0,3-%-Wert statt des Extrems (seit 25.11.2026): ein Label über dem Hoch zieht den Rahmen nicht in die Legende, der Rand von 8 % deckt das Hoch
  let l=ax.l,t=ax.t,r=ax.r,b=ax.b;if(xs.length>w*.2){tops.sort((p,q)=>p-q);bots.sort((p,q)=>p-q);const q=(a,p)=>a[Math.min(a.length-1,Math.max(0,Math.round(p*(a.length-1))))];
   const top=q(tops,.003),bot=q(bots,.997),rg=Math.max(10,bot-top);t=Math.max(t,top-rg*.08);b=Math.min(b,bot+rg*.08);l=Math.max(l,q(xs,.003)-w*.01);r=Math.min(r,q(xs,.997)+w*.02)}
  if(r-l<w*.3||b-t<h*.3)return null;return{x:l/f,y:t/f,w:(r-l)/f,h:(b-t)/f}}catch(e){return null}}
function ocCrop(im,u){const iw=im.naturalWidth,ih=im.naturalHeight;let r={x:0,y:0,w:iw,h:ih},full=true;const sg=ocSuggest(im);let sug=!!sg;if(sg){r=sg;full=false}
 $('#view').innerHTML='<p class="kick">Eigenen Chart prüfen</p><p class="task"><b>Zuschneiden.</b> '+(sg?'Der Rahmen ist ein Vorschlag: nur der Chart, ohne Preis- und Zeitachse, Legende, Menüs und Werkzeugleisten. Passt er, tippe auf Weiter. Sonst Ecken und Kanten anpassen oder einen neuen Rahmen ziehen.':'Zieh einen Rahmen um den Chartbereich, ohne Preis- und Zeitachse, Menüs und Werkzeugleisten. An den Ecken und Kanten kannst du ihn anpassen.')+'</p>'+
  '<div class="occ" id="occ"><canvas id="occv"></canvas></div><p class="mut" id="ocsz"></p>'+
  '<div class="dock"><button class="p" id="ocok">Weiter</button><button id="ocall">Ganzes Bild</button><button id="ocback">Anderes Bild</button></div>';
 const cv=$('#occv'),box=$('#occ'),g=cv.getContext('2d');let S=1,dpr=1;
 const lay=()=>{const mw=box.clientWidth,mh=Math.max(240,innerHeight*.62);S=Math.min(mw/iw,mh/ih);dpr=devicePixelRatio||1;
  cv.style.width=Math.round(iw*S)+'px';cv.style.height=Math.round(ih*S)+'px';cv.width=Math.round(iw*S*dpr);cv.height=Math.round(ih*S*dpr);draw()};
 const draw=()=>{const k=S*dpr;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.drawImage(im,0,0,cv.width,cv.height);
  g.fillStyle='rgba(11,27,58,.55)';const a=r.x*k,b=r.y*k,c=r.w*k,d=r.h*k;g.fillRect(0,0,cv.width,b);g.fillRect(0,b+d,cv.width,cv.height-b-d);g.fillRect(0,b,a,d);g.fillRect(a+c,b,cv.width-a-c,d);
  g.strokeStyle='#1E5EFF';g.lineWidth=2*dpr;g.strokeRect(a,b,c,d);g.fillStyle='#fff';const hs=9*dpr;
  [[a,b],[a+c,b],[a,b+d],[a+c,b+d]].forEach(([x,y])=>{g.fillRect(x-hs/2,y-hs/2,hs,hs);g.strokeRect(x-hs/2,y-hs/2,hs,hs)});
  $('#ocsz').textContent='Ausschnitt: '+Math.round(r.w)+' × '+Math.round(r.h)+' Pixel'+(Math.max(r.w,r.h)>OCMAX?' (wird auf höchstens '+OCMAX+' Pixel verkleinert)':'')};
 lay();const onR=()=>{if(!document.body.contains(cv))return removeEventListener('resize',onR);lay()};addEventListener('resize',onR);
 cv.style.touchAction='none';
 cv.onpointerdown=e=>{if(e.button)return;e.preventDefault();const b=cv.getBoundingClientRect(),P=ev=>[Math.max(0,Math.min(iw,(ev.clientX-b.left)/S)),Math.max(0,Math.min(ih,(ev.clientY-b.top)/S))];
  const [x,y]=P(e),tol=(e.pointerType==='touch'?22:10)/S,r0={...r},nl=Math.abs(x-r.x)<tol,nr=Math.abs(x-r.x-r.w)<tol,nt=Math.abs(y-r.y)<tol,nb=Math.abs(y-r.y-r.h)<tol,
   inX=x>r.x-tol&&x<r.x+r.w+tol,inY=y>r.y-tol&&y<r.y+r.h+tol;
  let md=full?'new':(nl||nr)&&inY||(nt||nb)&&inX?'edge':!sug&&x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h?'move':'new'; /* Vorschlag: Kanten anpassen oder neu ziehen */
  const mv=ev=>{if(ev.pointerId!==e.pointerId)return;const [qx,qy]=P(ev);
   if(md==='new'){r={x:Math.min(x,qx),y:Math.min(y,qy),w:Math.abs(qx-x),h:Math.abs(qy-y)};full=false;sug=false}
   else if(md==='move'){r.x=Math.max(0,Math.min(iw-r0.w,r0.x+qx-x));r.y=Math.max(0,Math.min(ih-r0.h,r0.y+qy-y))}
   else{let x0=r0.x,x1=r0.x+r0.w,y0=r0.y,y1=r0.y+r0.h;if(nl)x0=qx;else if(nr)x1=qx;if(nt)y0=qy;else if(nb)y1=qy;r={x:Math.min(x0,x1),y:Math.min(y0,y1),w:Math.abs(x1-x0),h:Math.abs(y1-y0)}}
   draw()};
  const up=ev=>{if(ev.pointerId!==e.pointerId)return;removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
   if(r.w<20/S||r.h<20/S){r=r0;full=r0.w===iw&&r0.h===ih}draw()}; // versehentlicher Tipp: alter Rahmen bleibt
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)};
 $('#ocall').onclick=()=>{r={x:0,y:0,w:iw,h:ih};full=true;sug=false;draw()};
 $('#ocback').onclick=()=>{URL.revokeObjectURL(u);ownChart()};
 $('#ocok').onclick=()=>{const x=Math.round(r.x),y=Math.round(r.y),w0=Math.max(1,Math.round(r.w)),h0=Math.max(1,Math.round(r.h)),f=Math.min(1,OCMAX/Math.max(w0,h0)),w=Math.max(1,Math.round(w0*f)),h=Math.max(1,Math.round(h0*f));
  if(w<40||h<40)return toast('Der Ausschnitt ist zu klein.');
  const c=document.createElement('canvas');c.width=w;c.height=h;const cg=c.getContext('2d',{willReadFrequently:true});cg.imageSmoothingQuality='high';cg.drawImage(im,x,y,w0,h0,0,0,w,h);
  let data;try{data=cg.getImageData(0,0,w,h).data}catch(_){return toast('Das Bild ließ sich nicht lesen.')}
  URL.revokeObjectURL(u);let fade=.25;try{const v=localStorage.getItem('waveChecker.ocFade');if(v!==null)fade=+v/100}catch(_){}
  c.toBlob(b=>{const IMG={cv:c,data,w,h,url:URL.createObjectURL(b),fade,crop:{x,y,f}};ocPath(IMG);progn({img:IMG},'schwer')},'image/png')}}
