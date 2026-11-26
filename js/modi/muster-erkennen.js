/* js/modi/muster-erkennen.js – Modus „Muster erkennen“: Leicht (recogNormal, recognize) und Schwer (recogHard, fitPts, ZW).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Modus 3: Muster erkennen – zufälliges Muster, ohne Beschriftung im Chart.
// Richtig ist jedes Muster, zu dem der Chart regelkonform ist (Entscheidung Lenny 21.10.2026), nicht nur das generierte.
const fmtSub=s=>s.split('').join('-');
// Passt der Chart R regelkonform zum Muster Q? Liefert null (passt) oder den Grund in Worten für den Nutzer (ohne Regel-IDs).
// Geprüft werden: gleiche Punktanzahl, Richtung/Struktur, alle HARTEN Regeln von Q an den Wendepunkten, Teilstruktur (subs).
function misfit(Q,R){
 const sel='beim Muster „'+Q.title+'“';
 if(Q.labels.length!==R.piv.length)return 'Der Chart hat '+(R.piv.length-1)+' Wellen, '+sel+' sind es '+(Q.labels.length-1)+'.';
 const v=norm(Q,R.piv.map(i=>R.pr[i]));
 if(Q.struct&&!Q.struct(v))return 'Die Richtung der Wellen passt nicht '+sel+'.';
 const f=hardFails(Q,v);
 if(f.length)return 'Verletzte Regel '+sel+': '+f.map(id=>'„'+mt(Q.rules[id].name)+'“ ('+tag(Q,id)+')').join(', ')+'.';
 if(!Q.subs.includes(R.P.subs[0]))return 'Die Teilwellen passen nicht: Hier sind sie '+fmtSub(R.P.subs[0])+' aufgebaut, '+sel+' '+Q.subs.map(fmtSub).join(' oder ')+'.';
 return null;
}
// Ein Satz, woran man zwei auf dem Chart gleich regelkonforme Muster unterscheidet
const diffMsg=(P,Q)=>P.ctx&&Q.ctx?'Unterschied: Auf dem Chart allein passen beide, entscheidend ist die Stelle im größeren Trend ('+P.title+': '+P.ctx+'; '+Q.title+': '+Q.ctx+').':'Unterschied: Vergleiche die beiden Beschreibungen unten.';
// Muster erkennen: zuerst den Schwierigkeitsgrad wählen
function recognize(){
 $('#view').innerHTML='<div class="card"><h2>Muster erkennen</h2><p class="mut">Wähle den Schwierigkeitsgrad.</p>'+
  '<p><button class="p" onclick="recogNormal()">Normal</button><br><span class="mut">Das Muster aus einer Liste wählen (+10 Punkte).</span></p>'+
  '<p><button class="p" onclick="recogHard()">Schwer: Chart selbst zählen</button><br><span class="mut">Zählweise wählen, Punkte setzen, dann das genaue Muster bestimmen (+20 Punkte, Bonus +10).</span></p>'+
  '<p><button onclick="home()">Zurück</button></p></div>';
}
function recogNormal(k0){ // k0: festes Muster (Tutorial)
 const keys=Object.keys(PAT).filter(k=>!PAT[k].noRecog),P=PAT[typeof k0==='string'&&PAT[k0]?k0:keys[Math.floor(Math.random()*keys.length)]],R=makeRound(P,null),m={sel:null};tutCtx('recog',recogNormal,{P,m});
 const render=(fb)=>{
  $('#view').innerHTML='<p class="kick">Muster erkennen · Normal</p><p class="task">Welches Muster zeigt dieser Chart? Schau dir die Teilbewegungen und die Lage der Wendepunkte an.</p><div class="chart">'+draw(R,[],!!fb,fb&&P.tri?R.piv:null)+'</div>'+(fb&&P.tri?'<p class="mut">Gestrichelt: die Trendlinien des Musters.</p>':'')+
  '<div class="card"><b>Muster</b><br>'+keys.map(k=>'<button data-k="'+k+'" class="'+(m.sel===k?'on':'')+'" '+(fb?'disabled':'')+'>'+PAT[k].title+'</button>').join('')+
  '</div><div class="dock">'+(fb?fb.v+'<button class="p" id="nxt">Nächster Chart</button>':'<button class="p" id="go" '+(m.sel?'':'disabled')+'>Antworten</button>')+'</div>'+(fb?'<div class="card" id="fb">'+fb.d+'</div>':'');
  if(fb)return;
  document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{m.sel=b.dataset.k;render()});
  $('#go').onclick=()=>{pathMark('recog');const Q=PAT[m.sel],same=m.sel===P.key,why=same?null:misfit(Q,R),ok=!why;
   if(ok){st.streak++;st.pts+=10;exSolved(P.key,0)}else st.streak=0;stats(); // Rang: zählt für das generierte Muster
   render({v:same?'<p class="ok">Richtig! +10 Punkte</p>':ok?'<p class="ok">Richtig! +10 Punkte. Alternativ passt auch: '+P.title+'.</p>':'<p class="bad">Nicht ganz. Das war ein '+P.title+'.</p>',
    d:(same?'':'<p>'+(ok?diffMsg(P,Q):why)+'</p>')+'<p>'+P.recog+'</p>'+(same?'':'<p class="mut">Deine Wahl war: '+Q.recog+'</p>')});
   $('#nxt').onclick=recogNormal;};
 };
 render();
}
// Muster erkennen – Schwer: Chart selbst zählen. Erst die Zählweise wählen, dann Punkte setzen wie in „Chart durchzählen“.
// Richtig ist die Zählung, wenn die Punkte für mindestens ein Muster dieser Zählweise alle harten Regeln erfüllen
// (inklusive Richtung und Teilstruktur, wie bei misfit). Danach Bonusfrage: welches Muster genau?
const ZW=[
 {name:'1-2-3-4-5',hint:'Impuls und Diagonalen',labels:PAT.imp.labels,pats:['imp','dl','db','de']},
 {name:'A-B-C',hint:'Zigzag und Flats',labels:PAT.zig.labels,pats:['zig','fr','fe','fru']},
 {name:'W-X-Y',hint:'Double Zigzag',labels:PAT.dz.labels,pats:['dz']},
 {name:'W-X-Y-X-Z',hint:'Dreifache Form',labels:PAT.tz.labels,pats:['tz']},
 {name:'A-B-C-D-E',hint:'Dreiecke',labels:PAT.trk.labels,pats:['trk','tre']}];
// Gesetzte Punkte (Kerzenindizes idx) des Charts R gegen Muster Q prüfen: null = regelkonform, sonst {kind:'subs'|'struct'|'rules', f}
function fitPts(Q,R,idx){
 if(!Q.subs.includes(R.P.subs[0]))return{kind:'subs'};
 const v=norm(Q,idx.map(i=>R.pr[i]));
 if(Q.struct&&!Q.struct(v))return{kind:'struct'};
 const f=hardFails(Q,v);return f.length?{kind:'rules',f}:null;
}
const fitWhy=(Q,r,P)=>r.kind==='subs'?'Die Teilwellen passen nicht: Hier sind sie '+fmtSub(P.subs[0])+' aufgebaut, beim Muster „'+Q.title+'“ '+Q.subs.map(fmtSub).join(' oder ')+'.':
 r.kind==='struct'?'Die Richtung der Wellen passt nicht zum Muster „'+Q.title+'“.':'Verletzte Regel beim Muster „'+Q.title+'“: '+r.f.map(id=>'„'+mt(Q.rules[id].name)+'“ ('+tag(Q,id)+')').join(', ')+'.';
function recogHard(D,fb0,k0){ // D: Tagesaufgabe (fester Chart, höchstens 3 Versuche, siehe Abschnitt 6), sonst zufällig; k0: festes Muster (Tutorial)
 const keys=Object.keys(PAT).filter(k=>!PAT[k].noRecog),P=D?D.P:PAT[typeof k0==='string'&&PAT[k0]?k0:keys[Math.floor(Math.random()*keys.length)]],R=D?D.R:makeRound(P,null),
  m={z:D&&D.z!=null?D.z:null,sel:D&&D.sel?D.sel.slice():[],tips:D?D.tips:0,failed:D?D.tries>0:false,done:false};
 const Z=()=>ZW[m.z],pic=()=>draw({...R,P:{labels:Z()?Z().labels:[]}},m.sel,false,null);tutCtx(D?'daily':'recog-schwer',D?daily:()=>recogHard(),{R,m,P}); // nackter Chart, Beschriftung nur an gesetzten Punkten
 const fail=html=>{m.failed=true;m.sig=JSON.stringify([m.z,m.sel]);if(st.streak)st.streak=0,stats();if(D){D.tries++;D.save()}return html}; // m.sig: Prüfen bleibt gesperrt, bis sich etwas ändert (Doppeltipp kostet keinen Versuch) // Tagesaufgabe: jeder Fehlversuch zählt
 const render=fb=>keepView(m,()=>render0(fb)),render0=(fb)=>{ // keepView: kein Verrutschen beim Punktsetzen (26.11.2026)
  const z=Z(),n=z?z.labels.length:0;
  if(D&&!m.done){D.z=m.z;D.sel=m.sel.slice();D.fb=(fb||'').replace(/<button id="tip">[^<]*<\/button>/,'');D.save()} // Stand der Tagesaufgabe merken
  $('#view').innerHTML='<p class="kick">'+(D?'Tagesaufgabe #'+D.no+' · Versuch '+Math.min(3,D.tries+1)+' von 3':'Muster erkennen · Schwer')+'</p><p class="task">'+(D?'':'Zähle den Chart selbst. ')+(z?'Zählweise '+z.name+': Tippe nacheinander die Punkte '+z.labels.map(L0).join(', ')+' auf den Chart. Gesetzte Punkte kannst du anfassen und verschieben. Nächster Punkt: <span class="nextpt">'+(m.sel.length<n?L0(z.labels[m.sel.length]):'fertig')+'</span>':'Wähle zuerst die Zählweise.')+'</p>'+
   '<div class="chart">'+pic()+'</div><div class="card"><b>Zählweise</b><br>'+ZW.map((w,i)=>'<button data-z="'+i+'" class="'+(m.z===i?'on':'')+'" '+(m.done?'disabled':'')+'>'+w.name+' · '+w.hint+'</button>').join('')+'</div>'+
   (z?'<div class="dock"><button class="p" id="chk" '+(m.sel.length<n||m.done||m.sig===JSON.stringify([m.z,m.sel])?'disabled':'')+'>Prüfen</button><button id="und" '+(m.done?'disabled':'')+'>Zurück</button><button id="rst" '+(m.done?'disabled':'')+'>Neu setzen</button></div>':'')+
   '<div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>';
  taskMin(ZW.map(w=>(D?'':'Zähle den Chart selbst. ')+'Zählweise '+w.name+': Tippe nacheinander die Punkte '+w.labels.map(L0).join(', ')+' auf den Chart. Gesetzte Punkte kannst du anfassen und verschieben. Nächster Punkt: <span class="nextpt">fertig</span>')); // Höhe des längsten Texts (26.11.2026)
  if(m.done)return;
  // Neue Zählweise: Punkte bleiben nur, wenn die Punktanzahl gleich bleibt
  document.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{const i=+b.dataset.z;if(!z||ZW[i].labels.length!==n)m.sel=[];m.z=i;render()});
  if(!z)return;
  bindPoints(m,n,pic,render);
  $('#und').onclick=()=>{m.sel.pop();render()};$('#rst').onclick=()=>{m.sel=[];render()};
  $('#chk').onclick=()=>{verify();if(D&&D.tries>=3&&!m.done)D.finish({solved:false,tips:m.tips})}; // 3. Fehlversuch beendet die Tagesaufgabe
 };
 const verify=()=>{
  const z=Z(),n=z.labels.length;
  if(n!==R.piv.length)return render(fail('<p class="bad">Noch nicht ganz.</p><p>Die Zählweise '+z.name+' passt nicht zu diesem Chart. Zähle die großen Wendepunkte: Wie viele Wellen hat der Chart? Wähle dann eine andere Zählweise.</p>'));
  // Passt die Zählweise grundsätzlich? Geprüft an den echten Wendepunkten, bevor es um einzelne Punkte geht (Lenny, 26.10.2026)
  if(!z.pats.some(k=>!fitPts(PAT[k],R,R.piv)))return render(fail('<p class="bad">Noch nicht ganz.</p><p>Die Zählweise '+z.name+' passt nicht zu diesem Chart. Achte auf den Aufbau der Wellen: Welche sind dreiteilig, welche fünfteilig? Wähle dann eine andere Zählweise.</p>'));
  // Platzierung wie in „Chart durchzählen“: jeder Punkt am echten Extrem (Toleranz TOL Kerzen)
  const bad=m.sel.findIndex((i,k)=>k>0&&Math.abs(i-R.piv[k])>TOL);
  if(bad===n-1)return render(fail('<p class="bad">Noch nicht ganz.</p><p>Der Chart endet im Extrem der letzten Welle. Setze Punkt '+z.labels[n-1]+' an das letzte Hoch bzw. Tief des Charts.</p>'));
  if(bad>0)return render(fail('<p class="bad">Noch nicht ganz.</p><p>Punkt '+z.labels[bad]+' sitzt nicht am relevanten Wendepunkt. Setze ihn an das Hoch bzw. Tief, wo die Bewegung wirklich dreht, nicht an eine kleinere Zwischenspitze.</p>'));
  const res=z.pats.map(k=>({Q:PAT[k],r:fitPts(PAT[k],R,m.sel)})),okQ=res.filter(x=>!x.r).map(x=>x.Q);
  if(!okQ.length){ // Tipps zum Muster, das am nächsten dran ist (zuerst Teilstruktur, dann Richtung, dann wenigste Regelverstöße)
   fail();const rank=x=>({subs:300,struct:200,rules:100})[x.r.kind]+(x.r.f?x.r.f.length:0)-(x.Q===P?.5:0);
   return tipUI(res.sort((a,b)=>rank(a)-rank(b))[0]);}
  m.done=true;m.ok=okQ;if(D)D.solvedNow(m.tips);const gain=Math.max(8,20-6*m.tips)-(m.failed?4:0);
  if(!m.failed)st.streak++;st.pts+=gain;stats();exSolved(P.key,m.tips,true);if(!D)pathMark('recog'); // Rang: Schwer bzw. Tagesaufgabe
  bonus('<p class="ok">Regelkonform! +'+gain+' Punkte</p>');
 };
 const tipUI=({Q,r})=>{const z=Z();
  if(r.kind==='struct')return render('<p class="bad">Noch nicht ganz.</p><p>'+(Q.structMsg||'Prüfe die Richtung deiner Punkte.')+'</p>');
  const lines=['Die Zählung ist noch nicht regelkonform.'];
  if(r.kind==='subs'){
   if(m.tips>=1)lines.push('Tipp 1: Achte auf die Teilwellen: Welche Wellen sind dreiteilig, welche fünfteilig?');
   if(m.tips>=2)lines.push('Tipp 2: Die Teilwellen dieses Charts sind '+fmtSub(P.subs[0])+' aufgebaut.');
   if(m.tips>=3){const g={};z.pats.forEach(k=>{const s=PAT[k].subs.map(fmtSub).join(' oder ');(g[s]=g[s]||[]).push(PAT[k].title)}); // Muster mit gleicher Teilstruktur zusammenfassen
    lines.push('Tipp 3: Bei der Zählweise '+z.name+' sind sie '+Object.entries(g).map(([s,t])=>s+' ('+t.join(', ')+')').join(', ')+' aufgebaut. Wähle eine andere Zählweise.');}
  }else{const id=r.f[0],x=Q.rules[id];
   if(m.tips>=1)lines.push('Tipp 1: '+mt(x.hint));
   if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „'+mt(x.name)+'“.');
   if(m.tips>=3)lines.push('Tipp 3: '+tag(Q,id)+'. '+mt(x.ex));}
  render('<p class="bad">Noch nicht ganz.</p>'+lines.map(tipLine).join('')+(m.tips<3?'<button id="tip">Tipp anzeigen</button>':''));
  const t=$('#tip');if(t)t.onclick=()=>{m.tips++;if(D){D.tips=m.tips;D.save()}tipUI({Q,r})}; // Tagesaufgabe: Tipps werden vermerkt
 };
 // Bonusfrage: Welches Muster genau? Gibt es in der Zählweise nur ein Muster, ist es eindeutig: Bonus ohne Frage.
 // Ein falscher Bonus kostet keine Serie, die Zählung selbst war ja richtig.
 const bonus=head=>{const z=Z();
  if(z.pats.length===1){st.pts+=10;stats();return end(head+'<p class="ok">Bonus +10: Die Zählweise '+z.name+' gehört nur zum Muster „'+PAT[z.pats[0]].title+'“.</p>',true)}
  render(head+'<p><b>Bonusfrage (+10): Welches Muster genau?</b></p>'+z.pats.map(k=>'<button data-b="'+k+'">'+PAT[k].title+'</button>').join(''));
  document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const Q=PAT[b.dataset.b],ok=m.ok.includes(Q);
   if(ok){st.pts+=10;stats()}
   end(head+(Q===P?'<p class="ok">Bonus richtig! +10 Punkte</p>':ok?'<p class="ok">Bonus richtig! +10 Punkte. Alternativ passt auch: '+P.title+'.</p><p>'+diffMsg(P,Q)+'</p>':'<p class="bad">Bonus leider falsch.</p><p>'+fitWhy(Q,fitPts(Q,R,m.sel),P)+'</p>'),ok);});
 };
 // Erst am Ende verraten, welches Muster generiert wurde (sonst wäre die Bonusfrage vorweggenommen)
 const end=(html,bonusOk)=>{if(D)return D.finish({solved:true,bonus:bonusOk,tips:m.tips});
  render(html+'<p>Generiert wurde: <b>'+P.title+'</b>. '+P.recog+'</p><button class="p" id="nxt">Nächster Chart</button>');$('#nxt').onclick=()=>recogHard()};
 render(fb0);
}
