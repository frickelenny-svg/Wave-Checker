/* js/modi/fehler-text.js – „Fehler finden“ Schwer: Prüfung der Freitext-Antwort per Schlüsselwörtern (FFT), ohne Bezug auf den Rest der App.
   Begriffe: fehler-schluesselwoerter.json. tests/fehler-text.js führt den Block FFT-START … FFT-END direkt aus.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// ---- „Fehler finden“ Schwer (14.11.2026, Lenny): Freitext „Was ist falsch?“ per Schlüsselwörtern prüfen, ohne KI, alles hier im Code.
// Die Begriffe stehen in fehler-schluesselwoerter.json (Anleitung oben in der Datei). Der Test tests/fehler-text.js führt den Block
// zwischen FFT-START und FFT-END direkt aus, deshalb bleibt er ohne Bezug auf den Rest der App.
// FFT-START
const FFT=(()=>{
 // Umlaute (15.11.2026, Lenny): ä, ae und a gelten gleich (ebenso ö/oe/o, ü/ue/u). Antwort und Begriffe werden gleich vereinfacht.
 const st=s=>s.replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u');
 const FEST=new Set('unter ueber den dem das die der des als von vom zu ist hat in im ins an am auf aus mit nach vor bei bis nur wie so ein eine auch und'.split(' ').map(st)); // nur genau so
 const NUM={eins:'1',zwei:'2',drei:'3',dri:'3',drie:'3',vier:'4',funf:'5',funv:'5',i:'1',ii:'2',iii:'3',iv:'4',v:'5'} /* römisch (Subwellen (i)–(v), seit 27.11.2026) */,ORD=/^(erst|zweit|dritt|viert|funft)(e|er|en|es|em)?$/,ORDN={erst:'1',zweit:'2',dritt:'3',viert:'4',funft:'5'};
 const NUMF=[['erste','1'],['zweite','2'],['dritte','3'],['vierte','4'],['fuenfte','5'],['fuenf','5'],['zweiten','2'],['dritten','3'],['vierten','4'],['fuenften','5']].map(([w,d])=>[st(w),d]);
 const SPLIT=new Set('und aber sondern oder doch jedoch waehrend weil denn obwohl deshalb daher also'.split(' ').map(st)),STATT=new Set(['statt','anstatt','anstelle']);
 const NEG=t=>/^(nicht|kein)/.test(t)||/^(nie|niemals|weder|ohne|fehlt|fehlen|fehlend|fehlende|hochstens|maximal|max)$/.test(t)||(t.length>=4&&t.length<=6&&osa(t,'nicht')<=1);
 const MODAL=t=>/^(muss|soll|darf|durf)/.test(t)||/^(kann|kannst|konnen)$/.test(t);
 // Spiegeln (Chart in der Gegenrichtung zur Schreibweise der Begriffe): oben und unten tauschen
 const SW0={unter:'ueber',ueber:'unter',unterhalb:'oberhalb',oberhalb:'unterhalb',darunter:'darueber',darueber:'darunter',drunter:'drueber',drueber:'drunter',
  tief:'hoch',hoch:'tief',tiefer:'hoeher',hoeher:'tiefer',niedriger:'hoeher',tiefe:'hohe',hohe:'tiefe',tiefen:'hohen',hohen:'tiefen',tiefs:'hochs',hochs:'tiefs',
  unten:'oben',oben:'unten',abwaerts:'aufwaerts',aufwaerts:'abwaerts',faellt:'steigt',steigt:'faellt',sinkt:'steigt',fallen:'steigen',steigen:'fallen',fiel:'stieg',stieg:'fiel',
  gefallen:'gestiegen',gestiegen:'gefallen',top:'boden',spitze:'boden',gipfel:'boden',boden:'top'},SW={};for(const k in SW0)SW[st(k)]=st(SW0[k]);
 const SWP=[['unterschreit','ueberschreit'],['ueberschreit','unterschreit'],['unterbiet','ueberbiet'],['ueberbiet','unterbiet'],['tiefpunkt','hochpunkt'],['hochpunkt','tiefpunkt'],['tiefst','hoechst'],['hoechst','tiefst']].map(([a,b])=>[st(a),st(b)]);
 // Abstand mit Vertauschung (ein vertauschtes Buchstabenpaar zählt als ein Fehler)
 function osa(a,b){const m=a.length,n=b.length;if(Math.abs(m-n)>1)return 9;const d=[];for(let i=0;i<=m;i++){d[i]=[i];for(let j=1;j<=n;j++)d[i][j]=i?0:j}
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[m][n]}
 const base=s=>st(String(s).toLowerCase().replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss')).replace(/(\d)[.,](\d)/g,'$1 $2').replace(/%/g,' prozent ')
  .replace(/(\d)([a-z])/g,'$1 $2').replace(/([a-z])(\d)/g,'$1 $2').replace(/(eins|zwei|drei|drie|dri|vier|funf|funv)(teil|wellig|er\b|gliedr|schritt)/g,'$1 $2');
 const num=t=>{if(NUM[t])return NUM[t];const o=t.match(ORD);if(o)return ORDN[o[1]];if(t.length>=5)for(const[w,d]of NUMF)if(osa(t,w)<=1)return d;return t};
 const swap=t=>{if(SW[t])return SW[t];for(const[a,b]of SWP)if(t.startsWith(a))return b+t.slice(a.length);return t};
 // Antwort → Wörter mit Satzteil-Nummer; je Satzteil: Zahl der Verneinungen und ob eine Regel-Formulierung (muss, darf …) darin steht
 // Aufzählungen („Welle 1 und 4“, „A oder C“) trennen keine Satzteile. Regel-Formulierungen ohne muss/darf: „geht nicht“, „nicht erlaubt“,
 // „gibt es nie“, „kommt nie vor“, „jede Welle ist …“
 const ITEM=w=>/^\d+$/.test(w)||w.length===1,ITEM2=w=>ITEM(w)||/^(welle|wellen|subwelle|subwellen|unterwelle|unterwellen)$/.test(w);
 function prep(text,spiegel){const toks=[],cl=[];
  base(text).split(/[.;:!?,\n–—]+/).forEach(part=>{let c={neg:0,modal:false};cl.push(c);
   const ws=part.replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean).map(num);
   ws.forEach((w,i)=>{
    if((SPLIT.has(w)&&!((w==='und'||w==='oder')&&i&&ITEM(ws[i-1])&&ITEM2(ws[i+1]||'')))||STATT.has(w)){c={neg:STATT.has(w)?1:0,modal:false};cl.push(c);return} // „statt“: der Teil danach ist verneint
    const p=ws[i-1]||'',q=ws[i+1]||'';
    if(NEG(w)){c.neg++;
     if((/^(geht|gehen)$/.test(p)&&!q)||/^(erlaubt|zulassig|moglich|gestattet|regelkonform)/.test(q)||(/^(nie|niemals)$/.test(w)&&ws.some(x=>/^(gibt|gibts|kommt|kommen|tritt|treten|vorkommen|auftreten)$/.test(x))))c.modal=true}
    if(MODAL(w)||/^(jede|jeder|jedes|alle|stets)$/.test(w))c.modal=true;
    if(spiegel)w=swap(w);toks.push({w,c:cl.length-1})})});
  return{toks,cl}}
 const wm=(tw,tok)=>{if(tw===tok)return true;if(/^\d+$/.test(tw)||tw.length<=2||FEST.has(tw))return false;if(tok.startsWith(tw))return true;
  if(tw.length>=6&&tok.includes(tw))return true;
  if(tw.length>=5&&tok.length>=tw.length-1)for(const L of [tw.length-1,tw.length,tw.length+1])if(osa(tw,tok.slice(0,L))<=1)return true;return false};
 // Begriff → Wortliste (wie die Antwort aufbereitet, * = bis zu 3 beliebige Wörter)
 // {welle} = Welle der Regel, {partner} = jede andere beteiligte Welle (der Begriff gilt dann je Partner einmal)
 const terms=(list,J,O)=>{const out=[];(list||[]).forEach(t=>{if(t[0]==='@'){const l=J.listen&&J.listen[t.slice(1)];if(!l)console.warn('Liste fehlt: '+t);else out.push(...terms(l,J,O));return}
  if(t.includes('{partner}')){(O.partner||[]).forEach(p=>out.push(...terms([t.split('{partner}').join(p)],J,O)));return}
  if(t.includes('{welle}')){if(!O.welle)return;t=t.split('{welle}').join(O.welle)}
  const w=base(t).replace(/[^a-z0-9*]+/g,' ').trim().split(' ').filter(Boolean).map(x=>x==='*'?x:num(x));if(w.length)out.push(w)});return out};
 const LBL=w=>/^[1-5]$/.test(w)||/^[a-ez]$/.test(w)||w==='w'||w==='x'||w==='y';
 // Fundstellen eines Begriffs: [Anfang, Ende] im selben Satzteil, ohne gesperrte Wörter
 function find(tw,T,mask){const res=[];
  const go=(i,k,s)=>{if(k===tw.length)return res.push([s,i-1]);
   if(tw[k]==='*'){for(let g=0;g<=4;g++){if(g&&(i+g-1>=T.length||T[i+g-1].c!==T[s].c||LBL(T[i+g-1].w)))break;go(i+g,k+1,s)}return} // * springt nie über eine Wellenbezeichnung
   if(i<T.length&&T[i].c===T[s].c&&!(mask&&mask[i])&&wm(tw[k],T[i].w))go(i+1,k+1,s)};
  for(let s=0;s<T.length;s++)if(!(mask&&mask[s])&&wm(tw[0],T[s].w))go(s,0,s);
  const seen={};return res.filter(([a])=>seen[a]?false:(seen[a]=1))} // je Anfang eine Fundstelle
 // Varianten einer Regel einsammeln (wie, je_welle)
 function variants(J,id,welle,seen){seen=seen||{};if(seen[id])return[];seen[id]=1;const r=J.regeln&&J.regeln[id];if(!r)return[];const out=[];
  if(r.je_welle&&welle&&r.je_welle[welle])out.push(...variants(J,r.je_welle[welle],welle,seen));
  if(r.wie)out.push(...variants(J,r.wie,welle,seen));
  (r.varianten||(r.pflicht?[r]:[])).forEach(v=>out.push({pflicht:v.pflicht,sinn:v.sinn,richtung:v.richtung||r.richtung,welle:v.welle}));return out}
 function tryVar(v,P,J,welle){const T=P.toks; // welle: Platzhalter {welle}/{partner}
  for(let g=0;g<v.pflicht.length;g++){const s=v.sinn&&v.sinn.gruppe===g+1;
   if(!s){if(!terms(v.pflicht[g],J,welle).some(t=>find(t,T).length))return{ok:false,why:'Gruppe '+(g+1)+' fehlt'};continue}
   // Sinn: zuerst Gegenteil-Begriffe (sperren ihre Wörter), dann die übrigen; jede Fundstelle braucht die passende Verneinung
   const mask=[],geg=terms(v.sinn.gegenteil,J,welle),nor=terms(v.pflicht[g],J,welle),hit=[],ver=v.sinn.fehler==='verneint';
   geg.forEach(t=>find(t,T,mask).forEach(([a,b])=>{for(let i=a;i<=b;i++)mask[i]=1;hit.push([a,true])}));
   nor.forEach(t=>find(t,T,mask).forEach(([a,b])=>{for(let i=a;i<=b;i++)mask[i]=1;hit.push([a,false])}));
   if(!hit.length)return{ok:false,why:'Gruppe '+(g+1)+' fehlt'};
   let good=0,bad=0;hit.forEach(([a,isG])=>{const c=P.cl[T[a].c],N=(c.neg%2===1)!==c.modal;(N===(ver!==isG))?good++:bad++});
   if(good<=bad)return{ok:false,why:'Sinn in Gruppe '+(g+1)+' passt nicht ('+good+' passend, '+bad+' umgekehrt)'}}
  return{ok:true}}
 // opts: welle = Welle der Regel (für {welle} und je_welle), partner = die anderen beteiligten Wellen ({partner}), bezug = Wellen, die die Regel
 // außerdem nennt (z. B. 1 und 5 bei IMP-2, gelten nicht als unbeteiligt), gewaehlt = die Welle,
 // die der Spieler gewählt hat, dir = 'auf'/'ab': Richtung der Welle, auf die sich die Regel bezieht.
 // Nennt die Antwort die gewählte Welle nicht, ist sie der Satzgegenstand („nicht die längste“ bei Welle 1 = „Welle 1 nicht die längste“).
 // Varianten mit „welle“ gelten nur, wenn die gewählte Welle dazu passt (Blickwinkel).
 const lab=x=>base(x).replace(/[^a-z0-9]+/g,' ').trim();
 function check(J,id,text,opts){opts=opts||{};const O={welle:opts.welle?lab(opts.welle):'',partner:(opts.partner||[]).map(lab)},vs=variants(J,id,opts.welle),g=opts.gewaehlt?lab(opts.gewaehlt):'';
  if(!vs.length)return{ok:false,why:'Regel nicht in der Liste'};
    // Blickwinkel-Varianten nur für die passende gewählte Welle und nur, wenn die Antwort keine unbeteiligte Welle nennt.
  // Die gewählte Welle wird nur dann als Satzgegenstand ergänzt, wenn die Antwort sie nicht nennt und keine unbeteiligte Welle vorkommt.
  const own=new Set([O.welle].concat(O.partner,g,(opts.bezug||[]).map(lab)).filter(Boolean).map(x=>x.split(' ')[0])),T0=prep(text,false).toks,fremd=T0.some(t=>LBL(t.w)&&!own.has(t.w));
  if(g&&!fremd){const first=g.split(' ')[0];if(!T0.some(t=>t.w===first))text='Welle '+first+' '+text}
  const P={},why=[];
  for(const v of vs){if(v.welle&&(!g||fremd||!v.welle.some(x=>x==='{welle}'?g===O.welle:x==='{partner}'?O.partner.includes(g):lab(x)===g)))continue;
   const sp=!!(v.richtung&&opts.dir&&v.richtung!==opts.dir);P[sp]=P[sp]||prep(text,sp);const r=tryVar(v,P[sp],J,O);if(r.ok)return r;why.push(r.why)}
  return{ok:false,why:why.join('; ')||'keine passende Variante'}}
 // „Anders gesagt“: derselbe Verstoß aus dem Blickwinkel der anderen beteiligten Welle (rolle 'haupt' = Welle der Regel gewählt, sonst 'partner')
 const anders=(J,id,rolle)=>{const r=J.regeln&&J.regeln[id];if(!r)return'';return(r.anders&&r.anders[rolle])||(r.wie?anders(J,r.wie,rolle):'')};
 const einfach=(J,id)=>{const r=J.regeln&&J.regeln[id];return r?(r.einfach||(r.wie?einfach(J,r.wie):'')):''};
 const thema=(J,id)=>{const r=J.regeln&&J.regeln[id];return r&&r.thema||''};
 return{check,einfach,thema,prep,anders};
})();
// FFT-END
