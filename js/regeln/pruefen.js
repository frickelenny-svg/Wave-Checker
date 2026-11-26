/* js/regeln/pruefen.js – Prüffunktionen für alle Muster: check (verletzte Regeln), hardFails, warns, norm, tag (Fundstelle).
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Hilfsfunktionen: je Muster prüfen
const tag=(P,id)=>{const r=P.rules[id];return r.page?'Buch S.'+r.page:(r.where||'Regelwerk')};
const check=(P,v)=>Object.keys(P.rules).filter(id=>!P.rules[id].ok(v));
const hardFails=(P,v)=>check(P,v).filter(id=>P.rules[id].hard);
const warns=(P,v)=>check(P,v).filter(id=>!P.rules[id].hard);
const norm=(P,p)=>{const d=P.sign(p);return p.map(x=>d*(x-p[0]))};
