// Test „Wellengrößen nachbessern“ (seit 26.11.2026 abends, Lenny, nach Video aus „Eigenen Chart prüfen“).
// Aufruf im Repo-Ordner: node tests/groessen-leiste.js [Runden je Gerät]   (Playwright; PWCH=msedge bzw. chrome). Handy, iPad, PC.
// Prüft:
//  1) Video-Fall: Eine laufende Zählung der feinsten Größe (Start, i, ii, iii in einer Welle der Zählung darüber) wird mit iv und v rechts
//     außerhalb dieser Welle fortgesetzt. Jeder Punkt wird gesetzt (vorher: „Mehr als fünf Wellengrößen …“, nichts gesetzt), die Zählung ist
//     danach nicht mehr Unterteilung dieser Welle (gleich groß oder größer), alle Größen bleiben 1–6. Einmal über PGS.fadd mit zufälliger
//     Verschachtelung, einmal mit echten Tipps im Chart.
//  1c) Nachbau mit Nachbar-Zählung (so entstand die Meldung im Video): Kette bis zur feinsten Größe (PGMAXL), die feinste Zählung läuft in der
//     letzten Welle ihrer Zählung darüber; rechts daneben liegt in der nächsten Welle eine gleich große Zählung wie diese, mit eigener Unterteilung.
//     iv und v rechts hinter dieser Nachbar-Zählung: Die Nachbar-Zählung liegt dann in einer Welle der laufenden Zählung und rückt eine Größe tiefer,
//     ihre Unterteilung bräuchte eine Größe mehr als es gibt. Vorher wurde der Punkt deshalb nicht gesetzt; jetzt immer, Hinweis erlaubt.
//  2) Mehr als sechs Größen: Start in einer Welle der Größe 6 setzt den Punkt, nur Hinweis, Größe höchstens 6.
//  3) Leiste am Chart: Im Werkzeug Auswählen erscheint nach dem Antippen eines Punkts eine kleine Leiste (Größer, Kleiner, Löschen) direkt
//     am gewählten Label im Bild, sie verdeckt weder das gewählte Label noch einen Punkt und steht in der Zeichenfläche. Echte Tipps auf
//     Kleiner/Größer ändern die ganze Zählung samt Unterteilungen um eine Stufe, die Labels stellen sich sofort um; Löschen entfernt die Zählung.
//     In der Karte unter dem Chart gibt es kein Größer/Kleiner mehr.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8816, N = +process.argv[2] || 4;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': require('./typ')(p), 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
(async () => {
  await new Promise(r => server.listen(PORT, r)); const T0 = Date.now();
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [], touch = !!opt.hasTouch;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(80); };
    // Hilfen in der Seite: Zählung über Zeiten setzen, Zeiten mit langer erster Welle (Platz für Unterteilungen)
    await page.evaluate(() => { window.__T = {
      P: t => PGS.R.c[Math.max(0, Math.min(PGS.R.c.length - 1, Math.round(t)))],
      tw: (a, b, n) => { const w = [0, 3]; for (let j = 2; j <= n; j++)w.push(w[j - 1] + 1); return w.map(x => Math.round(a + (b - a) * x / w[n])); },
      add(z, ts, upto) { const F = PGS.FR(); F.ac = null; F.i = 0; F.md = 'draw'; F.sel = null; F.pw = null; const c = PGS.fadd(z, 0, ts[0], this.P(ts[0]), 'neu'); if (c == null) return null;
        for (let j = 1; j < (upto || ts.length); j++)PGS.fadd(z, j, ts[j], this.P(ts[j])); return c; } }; });
    for (let r = 0; r < N; r++) {
      const tag = name + ' Runde ' + r + ': ';
      // ---- 1a) Video-Fall über PGS.fadd, zufällige Verschachtelung bis Größe 6
      const v = await page.evaluate(() => { progn('imp', 'schwer'); PGS.setTf(1); const T = __T, c0 = PGS.R.mp[PGS.cut], F = PGS.FR();
        const depth = 2 + Math.floor(Math.random() * 5); let par = T.add('N', T.tw(5, c0 - 5, 5)), ts = null, k = 1;
        const chain = [par];
        for (let L = 2; L < depth; L++) { const g = F.pts.filter(x => x.c === par).sort((a, b) => a.t - b.t); k = 1 + Math.floor(Math.random() * Math.min(3, g.length - 1)); if (g[k].t - g[k - 1].t < 40) k = 1;
          par = T.add(Math.random() < .5 ? 'N' : 'ABC', T.tw(g[k - 1].t, g[k].t, Math.random() < .5 ? 5 : 3)); chain.push(par); }
        // Geschwister in der nächsten Welle (wie im Video: Zählungen rechts der hervorgehobenen Welle)
        const g = F.pts.filter(x => x.c === par).sort((a, b) => a.t - b.t); k = 1; if (g.length > 2 && g[2].t - g[1].t > 12) T.add('ABC', T.tw(g[1].t, g[2].t, 3));
        // die feinste Zählung: Start, i, ii, iii in Welle 1 der Zählung darüber, läuft
        const a = g[0].t, b = g[1].t, cts = T.tw(a, b, 5).slice(0, 4), C = T.add('N', cts.concat([b + 1, b + 2]), 4), lv0 = PGS.levels(), max0 = Math.max(...Object.values(lv0));
        const end = F.pts.filter(x => x.c === par).sort((x, y) => x.t - y.t), right = Math.min(c0 - 2, Math.max(b + 4, b + (end.length > 2 ? (end[2].t - b) * (.3 + .6 * Math.random()) : 20)));
        const res = { lv0, max0, C, par, depth, ac: F.ac === C, n0: F.pts.length, add: [] };
        // iv und v rechts außerhalb der Welle (wie im Video): jeder Punkt muss gesetzt werden
        [Math.round(right), Math.round(right + 3 + Math.random() * 20)].forEach((t, j) => { const tt = document.querySelector('#toast'); if (tt) tt.className = ''; /* alter Hinweis der vorigen Runde */ const before = F.pts.length, c = PGS.fadd('N', 4 + j, t, T.P(t)); res.add.push({ c, plus: F.pts.length - before, toast: (document.querySelector('#toast.show') || {}).textContent || '' }); });
        const S = F.pts.filter(x => x.c === C).sort((x, y) => x.i - y.i); res.labels = S.map(x => x.i).join(''); res.lv = PGS.levels(); res.max = Math.max(...Object.values(res.lv)); res.lvC = res.lv[C]; res.lvPar = res.lv[par];
        return res; });
      ok(v.ac && v.add.every(x => x.c === v.C && x.plus === 1) && v.labels === '012345', tag + 'Video-Fall (Tiefe ' + v.depth + '): iv/v gesetzt? ' + JSON.stringify(v.add) + ', Labels ' + v.labels);
      ok(v.add.every(x => !/Mehr als (fünf|sechs)/.test(x.toast)) || v.max0 >= 6, tag + 'Video-Fall: Hinweis „zu viele Größen“ ohne mehr als sechs Größen: ' + v.add.map(x => x.toast).join(' | '));
      ok(v.max <= 6 && v.lvC <= v.lvPar, tag + 'Video-Fall: Größen ' + JSON.stringify(v.lv) + ' (Zählung ' + v.lvC + ', Welle darüber ' + v.lvPar + ')');
      // ---- 1c) Nachbau mit Nachbar-Zählung (siehe oben); Tiefe = PGMAXL, damit derselbe Test auch die alte Version (fünf Größen) prüft
      const nb = await page.evaluate(() => { progn('imp', 'schwer'); PGS.setTf(1); const T = __T, c0 = PGS.R.mp[PGS.cut], F = PGS.FR(), M = PGMAXL, pts = c => F.pts.filter(x => x.c === c).sort((a, b) => a.t - b.t);
        let par = T.add('N', T.tw(5, c0 - 5, 5)); for (let L = 2; L <= M - 2; L++) { const g = pts(par); par = T.add('N', T.tw(g[0].t, g[1].t, 5)); } // Q = par (Größe M−2)
        const q = pts(par), P = T.add('N', T.tw(q[0].t, q[1].t, 5)), p = pts(P); // P (Größe M−1) in Welle 1 von Q
        const S = T.add('ABC', T.tw(q[1].t, q[2].t, 3)), s = pts(S), U = T.add('ABC', T.tw(s[0].t, s[1].t, 3)); // Nachbar S (M−1) in Welle 2 von Q, mit Unterteilung U (M)
        const C = T.add('N', T.tw(p[4].t, p[5].t, 5), 4), lv0 = PGS.levels(); // laufende Zählung (Größe M): Start, i, ii, iii in Welle 5 von P
        const res = { M, lv0: JSON.stringify(lv0), sizes: [lv0[P], lv0[S], lv0[U], lv0[C]].join(''), add: [] };
        [s[s.length - 1].t + 3, s[s.length - 1].t + 9].forEach((t, j) => { const tt = document.querySelector('#toast'); if (tt) tt.className = ''; const n0 = F.pts.length, c = PGS.fadd('N', 4 + j, t, T.P(t)); res.add.push({ c: c === C, plus: F.pts.length - n0, toast: (document.querySelector('#toast.show') || {}).textContent || '' }); });
        res.lv = JSON.stringify(PGS.levels()); res.max = Math.max(...Object.values(PGS.levels())); res.labels = F.pts.filter(x => x.c === C).map(x => x.i).sort().join(''); return res; });
      ok(nb.add.every(x => x.c && x.plus === 1) && nb.labels === '012345' && nb.max <= nb.M, tag + 'Nachbau mit Nachbar-Zählung (Größen P/S/U/C ' + nb.sizes + '): ' + JSON.stringify(nb.add) + ', Labels ' + nb.labels + ', Größen ' + nb.lv);
      // ---- 2) mehr als sechs Größen: Kette 1–6, dann Start in Welle 1 der Größe 6
      const s7 = await page.evaluate(() => { progn('imp', 'schwer'); PGS.setTf(1); const T = __T, c0 = PGS.R.mp[PGS.cut], F = PGS.FR(); let par = T.add('N', T.tw(5, c0 - 5, 5));
        for (let L = 2; L <= 6; L++) { const g = F.pts.filter(x => x.c === par).sort((a, b) => a.t - b.t); par = T.add('ABC', T.tw(g[0].t, g[1].t, 3)); }
        const lv6 = PGS.levels(), g = F.pts.filter(x => x.c === par).sort((a, b) => a.t - b.t), before = F.pts.length, t = Math.round((g[0].t + g[1].t) / 2);
        const tt = document.querySelector('#toast'); if (tt) tt.className = ''; const c = T.add('ABC', [t, t + 1, t + 2], 1); return { lv6: Object.values(lv6).sort().join(''), c, plus: F.pts.length - before, toast: (document.querySelector('#toast.show') || {}).textContent || '', max: Math.max(...Object.values(PGS.levels())) }; });
      ok(s7.lv6 === '123456' && s7.c != null && s7.plus === 1 && /Mehr als sechs Wellengrößen/.test(s7.toast) && s7.max === 6, tag + 'Größe 7: ' + JSON.stringify(s7));
      // ---- 1b) Video-Fall mit echten Tipps: Start, i, ii, iii in Welle 1, dann iv und v rechts davon
      const vt = await page.evaluate(() => { progn('imp', 'schwer'); PGS.setTf(1); const T = __T, c0 = PGS.R.mp[PGS.cut], F = PGS.FR(), R = PGS.R, piv = R.mp.slice(0, PGS.cut + 1);
        const G = T.add('N', [...piv, ...[]].length >= 4 ? piv : T.tw(5, c0 - 5, 5)); const sub = R.piv.filter(q => q.lev === 2 && q.w1 === 1).sort((a, b) => a.t - b.t);
        F.ac = null; F.i = 0; F.md = 'draw'; return { G, w1: [piv[0], piv[1]], sub: sub.map(q => [q.t, q.p]), start: [piv[0], R.pr[piv[0]]], next: R.piv.filter(q => q.lev === 2 && q.w1 === 2).sort((a, b) => a.t - b.t).map(q => [q.t, q.p]) }; });
      if (vt.sub.length >= 4 && vt.next.length >= 2) {
        await page.evaluate(() => { document.querySelector('[data-fz="N"]').click(); });
        const pts = [vt.start, ...vt.sub.slice(0, 3), vt.next[0], vt.next[1]]; let got = [];
        for (let j = 0; j < pts.length; j++) { await page.waitForTimeout(380); const pos = await page.evaluate(([t, p]) => { PGS.show(t, p); document.querySelector('#pgc').scrollIntoView({ block: 'center' }); const b = document.querySelector('#svg').getBoundingClientRect(); return [b.left + PGS.X(t), b.top + PGS.Y(p)]; }, pts[j]);
          const before = await page.evaluate(() => PGS.FR().pts.length); await tap(pos[0], pos[1]); const after = await page.evaluate(() => ({ n: PGS.FR().pts.length, t: (document.querySelector('#toast.show') || {}).textContent || '' })); got.push(after.n - before + (after.t ? '(' + after.t.slice(0, 40) + ')' : '')); }
        ok(got.every(x => String(x).startsWith('1')), tag + 'Video-Fall mit Tipps: Punkte je Tipp ' + got.join(' '));
      }
      // ---- 3) Leiste am Chart mit echten Tipps
      const L0 = await page.evaluate(() => { progn('imp', 'schwer'); PGS.setTf(1); const T = __T, c0 = PGS.R.mp[PGS.cut], F = PGS.FR(), G = T.add('N', T.tw(5, c0 - 5, 5)), g = F.pts.filter(x => x.c === G).sort((a, b) => a.t - b.t);
        const K = T.add('N', T.tw(g[0].t, g[1].t, 5)), k = F.pts.filter(x => x.c === K).sort((a, b) => a.t - b.t), KK = T.add('ABC', T.tw(k[0].t, k[1].t, 3));
        F.ac = null; F.md = 'draw'; return { G, K, KK, q: k[3], lv: PGS.levels() }; });
      await page.waitForTimeout(450); // nach einem Tipp im Chart verschluckt die App 400 ms lang Clicks außerhalb des Charts (nachlaufende Touch-Clicks)
      await page.evaluate(() => document.querySelector('[data-md="sel"]').scrollIntoView({ block: 'center' }));
      { const b = await page.evaluate(() => { const r = document.querySelector('[data-md="sel"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); await tap(b[0], b[1]); await page.waitForTimeout(380); }
      const qpos = await page.evaluate(([t, p]) => { PGS.show(t, p); document.querySelector('#pgc').scrollIntoView({ block: 'center' }); const b = document.querySelector('#svg').getBoundingClientRect(); return [b.left + PGS.X(t), b.top + PGS.Y(p)]; }, [L0.q.t, L0.q.p]);
      await tap(qpos[0], qpos[1]); await page.waitForTimeout(380);
      const bar = await page.evaluate(id => { const F = PGS.FR(), e = document.querySelector('#svg .pgsb'), sv = document.querySelector('#svg').getBoundingClientRect(); if (!e) return { none: true, sel: F.sel };
        const r = e.getBoundingClientRect(), L = PGS.lbx(), q = F.pts.find(x => x.id === F.sel), mine = L.find(b => b.id === F.sel), inter = b => Math.max(0, Math.min(r.right, sv.left + b.x + b.w / 2) - Math.max(r.left, sv.left + b.x - b.w / 2)) * Math.max(0, Math.min(r.bottom, sv.top + b.y + b.h / 2) - Math.max(r.top, sv.top + b.y - b.h / 2));
        const px = sv.left + PGS.X(q.t), py = sv.top + PGS.Y(q.p), onPt = F.pts.filter(o => { const x = sv.left + PGS.X(o.t), y = sv.top + PGS.Y(o.p); return x > r.left - 3 && x < r.right + 3 && y > r.top - 3 && y < r.bottom + 3; }).length;
        return { sel: F.sel, c: q.c, inChart: r.left >= sv.left - .5 && r.right <= sv.right + .5 && r.top >= sv.top - .5 && r.bottom <= sv.bottom + .5, onMine: mine ? inter(mine) : 0, onOther: L.filter(b => b.id !== F.sel).reduce((s, b) => s + inter(b), 0), onPt,
          dist: Math.hypot((r.left + r.right) / 2 - px, (r.top + r.bottom) / 2 - py), btn: [...e.querySelectorAll('[data-sb]')].map(b => b.dataset.sb + (b.disabled ? '-' : '+')).join(' '), card: !!document.querySelector('.pgsel #fbig,.pgsel #fsmall') }; }, null);
      ok(!bar.none && bar.c === L0.K, tag + 'Leiste: nach dem Antippen von Punkt 3 der mittleren Zählung keine Leiste bzw. falsche Auswahl ' + JSON.stringify(bar));
      if (bar.none) continue;
      ok(bar.inChart && bar.onMine === 0 && bar.onPt === 0 && bar.dist < 120, tag + 'Leiste liegt schlecht: ' + JSON.stringify(bar));
      ok(bar.btn === 'big+ small+ del+' && !bar.card, tag + 'Leiste: Knöpfe ' + bar.btn + (bar.card ? ', Größer/Kleiner noch in der Karte' : ''));
      if (bar.onOther > 0) console.log('  Hinweis ' + tag + 'Leiste verdeckt andere Labels (' + Math.round(bar.onOther) + ' px²)');
      const press = async sb => { const b = await page.evaluate(sb => { const e = document.querySelector('#svg .pgsb [data-sb="' + sb + '"]'); if (!e || e.disabled) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sb); if (!b) return false; await tap(b[0], b[1]); await page.waitForTimeout(380); return true; };
      const labs = c => page.evaluate(c => { const lv = PGS.levels()[c]; return [...document.querySelectorAll('#svg text.lab.wt' + lv)].map(e => e.textContent).filter(t => /^[(]?[1-5ivx]+[)]?$/.test(t)).sort().join(' '); }, c);
      ok(await press('small'), tag + 'Kleiner nicht antippbar'); let lv = await page.evaluate(() => PGS.levels());
      ok(lv[L0.K] === L0.lv[L0.K] + 1 && lv[L0.KK] === L0.lv[L0.KK] + 1 && lv[L0.G] === L0.lv[L0.G], tag + 'Kleiner: ' + JSON.stringify(L0.lv) + ' → ' + JSON.stringify(lv));
      const lk = await labs(L0.K); ok(/^1 2 3 4/.test(lk) || /\b3\b/.test(lk), tag + 'Kleiner: Labels der Zählung nicht in Größe 3 (1 2 3 …): „' + lk + '“');
      ok(await page.evaluate(() => !!document.querySelector('#svg .pgsb')), tag + 'Leiste nach Kleiner verschwunden');
      ok(await press('big'), tag + 'Größer nicht antippbar'); lv = await page.evaluate(() => PGS.levels());
      ok(JSON.stringify(lv) === JSON.stringify(L0.lv), tag + 'Größer zurück: ' + JSON.stringify(lv) + ' statt ' + JSON.stringify(L0.lv));
      ok(await press('del'), tag + 'Löschen nicht antippbar'); const del = await page.evaluate(K => ({ gone: !PGS.FR().pts.some(x => x.c === K), t: (document.querySelector('#toast.show') || {}).textContent || '' }), L0.K);
      ok(del.gone && /Zählung gelöscht/.test(del.t), tag + 'Löschen über die Leiste: ' + JSON.stringify(del));
    }
    ok(!errs.length, name + ': Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    console.log(name.padEnd(6), 'fertig');
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log((bad ? bad + ' Fehler' : 'Alles in Ordnung (' + n + ' Prüfungen)') + ', ' + Math.round((Date.now() - T0) / 1000) + ' s'); process.exit(bad ? 1 : 0);
})();
