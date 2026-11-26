/* js/chart/punkte.js – Punkte setzen und verschieben im kleinen Chart (bindPoints), gemeinsam für „Chart durchzählen“,
   „Muster erkennen – Schwer“ und die Tagesaufgabe.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Punkte setzen und verschieben (Maus oder Finger), gemeinsam für „Chart durchzählen“ und „Muster erkennen – Schwer“.
// Antippen in der Nähe eines gesetzten Punktes greift ihn, sonst wird ein neuer Punkt gesetzt. pic() liefert das SVG mit den aktuellen Punkten.
function bindPoints(m,n,pic,render){
 const svg=$('#svg'),xAt=ev=>{const r=$('#svg').getBoundingClientRect();return (ev.clientX-r.left)/r.width*W};
 const idxOf=x=>Math.max(0,Math.min(45,Math.round((x-X0)/DX)));
 svg.style.touchAction='none';
 svg.onpointerdown=e=>{if(m.done)return;e.preventDefault();
  const f=(xAt(e)-X0)/DX;let k=-1,best=1.2;
  m.sel.forEach((i,j)=>{if(Math.abs(f-i)<=best){best=Math.abs(f-i);k=j}});
  if(k>=0){ // gesetzten Punkt verschieben, er bleibt zwischen seinen Nachbarpunkten
   const mv=ev=>{const lo=k>0?m.sel[k-1]+1:0,hi=k<m.sel.length-1?m.sel[k+1]-1:45,w=idxOf(xAt(ev)),nw=Math.max(lo,Math.min(hi,w));
    if(w!==nw)ordHint(); // stoppt an der Grenze, Label bleibt
    if(nw!==m.sel[k]){m.sel[k]=nw;redraw(svg,pic());}};
   DRAGK=k;redraw(svg,pic());
   startDrag(svg,e,mv,()=>{DRAGK=-1;render()});
  }else if(m.sel.length<n){
   const i=idxOf(xAt(e));
   if(m.sel.length&&i<=m.sel[m.sel.length-1])return render('<span class="warn">Der Punkt muss rechts vom vorherigen liegen.</span>');
   m.sel.push(i);render();
  }};
}
