/* js/modi/durchzaehlen.js – Modus „Chart durchzählen“ (count).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Modus 1: Chart durchzählen
function count(P){
 const R=makeRound(P,null),n=P.labels.length,m={sel:[],tips:0,failed:false,done:false};tutCtx('count',()=>count(P),{R,m,n}); // So geht's (18.11.2026)
 const render=fb=>keepView(m,()=>render0(fb)),render0=(fb)=>{ // keepView: kein Verrutschen beim Punktsetzen (26.11.2026)
  $('#view').innerHTML='<p class="kick">Chart durchzählen · '+P.title+'</p><p class="task">Tippe nacheinander die Punkte '+P.labels.map(L0).join(', ')+' auf den Chart. Gesetzte Punkte kannst du anfassen und verschieben. Nächster Punkt: <span class="nextpt">'+(m.sel.length<n?L0(P.labels[m.sel.length]):'fertig')+'</span></p><div class="chart">'+draw(R,m.sel,false,m.tl&&P.tri?m.sel:null)+'</div>'+(m.tl&&P.tri?'<p class="mut">Gestrichelt: Trendlinien durch '+(P.waves[0]==='A'?'A, C (bis E) und durch B, D.':'die Enden der Wellen 1, 3 (bis 5) und der Wellen 2, 4.')+'</p>':'')+'<div class="dock">'+
  '<button class="p" id="chk" '+(m.sel.length<n||m.done?'disabled':'')+'>Prüfen</button><button id="und" '+(m.done?'disabled':'')+'>Zurück</button><button id="rst" '+(m.done?'disabled':'')+'>Neu setzen</button></div><div class="card" id="fb" '+(fb?'':'hidden')+'>'+(fb||'')+'</div>';
  bindPoints(m,n,()=>draw(R,m.sel,false,m.tl&&P.tri?m.sel:null),render);
  $('#und').onclick=()=>{m.sel.pop();render()};$('#rst').onclick=()=>{m.sel=[];render()};
  $('#chk').onclick=verify;
 };
 const fail=html=>{m.failed=true;if(st.streak)st.streak=0,stats();return html};
 const verify=()=>{
  m.tl=true; // Trendlinien (nur Dreiecke) erscheinen ab dem ersten Prüfen
  // Platzierung und Richtung sind App-Vorgaben (keine Regelwerk-Regeln) und werden vor den Regeln geprüft.
  // Jeder Wendepunkt muss am echten Extrem sitzen (Toleranz TOL Kerzen), sonst ergibt die Zählung keinen Sinn (z. B. A zu früh gesetzt).
  const bad=m.sel.findIndex((i,k)=>k>0&&Math.abs(i-R.piv[k])>TOL);
  if(bad===n-1)return render(fail('<p class="bad">Noch nicht ganz.</p><p>'+P.endMsg+'</p>'));
  if(bad>0)return render(fail('<p class="bad">Noch nicht ganz.</p><p>Punkt '+P.labels[bad]+' sitzt nicht am relevanten Wendepunkt. Setze ihn an das Hoch bzw. Tief, wo die Bewegung wirklich dreht, nicht an eine kleinere Zwischenspitze.</p>'));
  const v=norm(P,m.sel.map(i=>R.pr[i]));
  if(P.struct&&!P.struct(v))return render(fail('<p class="bad">Noch nicht ganz.</p><p>'+P.structMsg+'</p>'));
  const f=hardFails(P,v);
  if(f.length){fail();return tipUI(f)}
  m.done=true;const gain=Math.max(4,10-3*m.tips)-(m.failed?2:0);
  if(!m.failed)st.streak++;st.pts+=gain;stats();exSolved(P.key,m.tips);pathMark('count'); // zählt für die Ränge
  const w=warns(P,v).map(id=>lvlNote(P,id)).join('');
  render('<p class="ok">Regelkonform! +'+gain+' Punkte</p><p class="mut">Die App prüft die Regeln. Die Wendepunkte müssen dafür an den echten Extremen sitzen.</p>'+w+P.info(v)+'<button class="p" id="nxt">Nächster Chart</button>');
  $('#nxt').onclick=()=>count(P);
 };
 const tipUI=f=>{const r=P.rules[f[0]];
  const lines=['Die Zählung ist noch nicht regelkonform.'];
  if(m.tips>=1)lines.push('Tipp 1: '+mt(r.hint));
  if(m.tips>=2)lines.push('Tipp 2: '+stufe('regel')+'Es geht um die Regel „'+mt(r.name)+'“.');
  if(m.tips>=3)lines.push('Tipp 3: '+tag(P,f[0])+'. '+r.ex);
  render('<p class="bad">Noch nicht ganz.</p>'+lines.map(tipLine).join('')+(m.tips<3?'<button id="tip">Tipp anzeigen</button>':''));
  const t=$('#tip');if(t)t.onclick=()=>{m.tips++;tipUI(f)};
 };
 render();
}
