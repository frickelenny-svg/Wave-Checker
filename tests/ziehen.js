// Zieh-Test für alle Modi mit Punkt-Setzen (seit 18.11.2026, Lenny). Echte Eingaben: Finger am Handy und iPad, Maus am PC.
// Aufruf im Repo-Ordner: node tests/ziehen.js [Runden je Gerät]   (Playwright nötig; PWCH=chrome bzw. PWCH=msedge für einen installierten Browser)
// Modi: Chart durchzählen, Muster erkennen – Schwer, Tagesaufgabe, Subwellen zählen (alle Muster), Wie geht es weiter? Leicht und Schwer.
// Punkte werden mit echten Tipps gesetzt, dann gezogen. Prüft:
//  1) Ziehen an eine gültige Stelle: Der Punkt bleibt nach dem Loslassen dort (springt nicht zurück), alle anderen Punkte bleiben stehen.
//  2) Ziehen über den Nachbarn hinaus: Der Punkt stoppt an der Grenze, behält sein Label, die Reihenfolge bleibt, Hinweis
//     „Punkte bleiben in ihrer Reihenfolge“ erscheint.
//  3) Während des Ziehens bleiben alle Punkte in normaler Größe mit Markierung sichtbar, nur der gezogene ist hervorgehoben.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8796, N = +process.argv[2] || 2;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, ok = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [];
    let mode = '';
    const fail = m => { bad++; console.log('  FEHLER ' + name + ' · ' + mode + ': ' + m); };
    const pass = () => ok++;
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); localStorage.setItem('waveChecker.tutSeen', JSON.stringify({ count: 1, sub: 1, daily: 1, 'recog-schwer': 1, progn: 1, 'progn-schwer': 1 })); }); await page.reload();
    const cdp = touch ? await ctx.newCDPSession(page) : null;
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(touch ? 420 : 60); };
    // Ziehen; mid() läuft, während der Finger bzw. die Maus noch gedrückt ist. Finger ruht vor dem Loslassen (sonst Schwung).
    const drag = async (x1, y1, x2, y2, mid) => { let m;
      if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] }); for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 8, y: y1 + (y2 - y1) * i / 8 }] });
        for (let i = 0; i < 3; i++) { await page.waitForTimeout(50); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x2, y: y2 }] }); } m = mid ? await mid() : 0; await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(450); return m; }
      await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 8 }); m = mid ? await mid() : 0; await page.mouse.up(); await page.waitForTimeout(80); return m; };
    const hint = () => page.evaluate(() => { const t = document.querySelector('#toast'); return !!t && t.className === 'show' && /Reihenfolge/.test(t.textContent); });
    const clearHint = () => page.evaluate(() => { const t = document.querySelector('#toast'); if (t) { t.className = ''; t.textContent = ''; } ORDT = -1e9; });

    // ---------- Modi mit Index-Punkten (bindPoints: Chart durchzählen, Muster erkennen Schwer, Tagesaufgabe; Subwellen zählen) ----------
    // geo(i): Bildschirmlage des Punkts an Kerze i (gleiche Geometrie wie draw bzw. drawS), sel(): gesetzte Punkte, vis(): sichtbare Punkte
    let idxMode = async (label, start, isSub) => {
      mode = label; await page.evaluate(start); await page.waitForTimeout(80);
      const geo = i => page.evaluate(([i, isSub]) => { const d = TUTCTX.data, R = d.R, s = document.querySelector('#svg'); s.scrollIntoView({ block: 'center' }); const b = s.getBoundingClientRect(), k = b.width / W, N = R.pr.length - 1;
        const lo = Math.min(...R.pr), hi = Math.max(...R.pr), x = isSub ? X0 + i * (W - 2 * X0) / N : X0 + i * DX, y = isSub ? 46 + (hi - R.pr[i]) / (hi - lo) * (H - 90) : 44 + (hi - R.pr[i]) / (hi - lo) * (H - 88);
        return { x: b.left + x * k, y: b.top + y * k, N }; }, [i, isSub]);
      const sel = () => page.evaluate(() => TUTCTX.data.m.sel.slice());
      const vis = () => page.evaluate(isSub => { const s = document.querySelector('#svg');
        if (isSub) { const c = [...s.querySelectorAll('circle')].filter(c => +c.getAttribute('r') >= 6), t = [...s.querySelectorAll('text.lab')].filter(t => /font-size:20px/.test(t.getAttribute('style') || ''));
          return { pts: c.length, big: t.length, drag: c.filter(c => +c.getAttribute('r') === 8).length }; }
        return { pts: s.querySelectorAll('g.pt').length, big: s.querySelectorAll('g.pt text').length, drag: s.querySelectorAll('g.pt.drag').length }; }, isSub);
      // Zählweise wählen (Muster erkennen Schwer, Tagesaufgabe): die passende, sonst die erste
      await page.evaluate(() => { const b = document.querySelector('[data-z]'); if (!b) return; const P = TUTCTX.data.P, i = ZW.findIndex(w => w.labels.join() === P.labels.join()); document.querySelector('[data-z="' + Math.max(0, i) + '"]').click(); });
      const n = await page.evaluate(isSub => { const d = TUTCTX.data; return isSub ? d.stages[0].labels.length : d.n || (ZW[d.m.z] ? ZW[d.m.z].labels.length : 0); }, isSub);
      const N = (await geo(0)).N, tr = await page.evaluate(isSub => isSub ? TUTCTX.data.R.mp.slice() : TUTCTX.data.R.piv.slice(), isSub);
      const want = tr.length === n ? tr : Array.from({ length: n }, (_, k) => Math.round(k * N / (n - 1)));
      for (let k = 0; k < n; k++) { const g = await geo(want[k]); await tap(g.x, g.y); }
      let S = await sel(); if (S.length !== n) return fail('Punkte setzen: ' + S.length + ' statt ' + n + ' gesetzt');
      if (S.some((v, k) => k && v <= S[k - 1])) return fail('Punkte nach dem Setzen nicht in Reihenfolge: ' + S);
      const ks = [...new Set([1, Math.floor(n / 2), n - 2, n - 1])].filter(k => k >= 1 && k < n);
      for (const k of ks) {
        S = await sel(); const lo = S[k - 1] + 1, hi = k < n - 1 ? S[k + 1] - 1 : (isSub ? N : 45);
        // 1) gültige Stelle: nimm eine andere Kerze zwischen den Nachbarn
        const cand = []; for (let i = lo; i <= hi; i++) if (i !== S[k]) cand.push(i);
        if (cand.length) { const tg = cand[Math.floor(Math.random() * cand.length)], a = await geo(S[k]), b = await geo(tg);
          const mid = await drag(a.x, a.y, b.x, a.y, vis); const T = await sel();
          if (T[k] !== tg) fail('Punkt ' + k + ' springt zurück bzw. landet falsch: ' + T[k] + ' statt ' + tg + ' (vorher ' + S[k] + ')');
          else if (T.some((v, j) => j !== k && v !== S[j])) fail('Ziehen von Punkt ' + k + ' verschiebt andere Punkte: ' + S + ' → ' + T);
          else pass();
          if (mid.pts !== n || mid.drag !== 1 || mid.big < n - 1) fail('während des Ziehens: ' + mid.pts + ' Punkte sichtbar (soll ' + n + '), ' + mid.big + ' große Labels, ' + mid.drag + ' hervorgehoben'); else pass(); }
        // 2) über den Nachbarn hinaus: stoppt an der Grenze, Hinweis erscheint
        S = await sel(); const right = k < n - 1, lim = right ? S[k + 1] - 1 : S[k - 1] + 1, far = right ? Math.min(N, S[k + 1] + 3) : Math.max(0, S[k - 1] - 3);
        if (far === (right ? S[k + 1] : S[k - 1])) continue; await clearHint();
        const a = await geo(S[k]), b = await geo(far); let h = false;
        await drag(a.x, a.y, b.x, a.y, async () => { h = await hint(); });
        const T = await sel();
        if (T.length !== n || T.some((v, j) => j && v <= T[j - 1])) fail('Reihenfolge nach Ziehen über den Nachbarn kaputt: ' + T);
        else if (T[k] !== lim) fail('Punkt ' + k + ' stoppt nicht an der Grenze: ' + T[k] + ' statt ' + lim);
        else if (T.some((v, j) => j !== k && v !== S[j])) fail('andere Punkte verschoben: ' + S + ' → ' + T);
        else pass();
        if (!h) fail('Hinweis „Punkte bleiben in ihrer Reihenfolge“ fehlt'); else pass();
      }
    };

    // ---------- Wie geht es weiter? Schwer (Werkzeug Auswählen, Punkte mit Zeit und Preis, Einrasten) ----------
    const at = (t, p) => page.evaluate(([t, p]) => { const S = PGS; S.show(t, p); document.querySelector('#pgc').scrollIntoView({ block: 'center' }); const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left + S.X(t), y: b.top + S.Y(p) }; }, [t, p]);
    let prognSchwer = async () => {
      mode = 'Wie geht es weiter? Schwer';
      const ok0 = await page.evaluate(() => { progn('imp', 'schwer'); const S = PGS, R = S.R; S.setTf(1); document.querySelector('[data-fz="N"]').click();
        const mp = R.mp.slice(0, S.cut + 1); if (mp.length < 4) return false; const up = R.pr ? null : null;
        mp.forEach((t, i) => { const hiP = i ? R.h[t] > R.h[mp[i - 1]] : R.h[t] < R.h[mp[1]]; S.fadd('N', i, t, hiP ? R.h[t] : R.l[t]); }); return true; });
      if (!ok0) return;
      const pts = () => page.evaluate(() => PGS.FR().pts.map(q => ({ id: q.id, c: q.c, i: q.i, t: q.t, p: q.p })));
      await page.waitForTimeout(420); await page.evaluate(() => document.querySelector('[data-md="sel"]').click());
      let P = await pts(); const c = P[0].c, cnt = P.filter(q => q.c === c).sort((a, b) => a.i - b.i); if (cnt.length < 4) return fail('Setup: zu wenige Punkte');
      // 2) Punkt 2 weit hinter Punkt 3 ziehen
      for (const [k, dir] of [[2, 1], [2, -1], [1, 1]]) {
        P = await pts(); const C = P.filter(q => q.c === c).sort((a, b) => a.i - b.i), q = C[k], nb = C[k + dir]; if (!nb) continue;
        // Ansicht: Mitte zwischen Punkt und Nachbar, Ziel hinter dem Nachbarn, aber im sichtbaren Chart (Finger und Maus bleiben im Bild)
        let a, b, inV = false;
        for (const tf of [1, 4, 24]) { await page.evaluate(tf => PGS.setTf(tf), tf); await at((q.t + nb.t) / 2, (q.p + nb.p) / 2); await clearHint();
        [a, b, inV] = await page.evaluate(([q, nb, dir]) => { const r = document.querySelector('#svg').getBoundingClientRect(), S = PGS, pl = S.plot(), xa = S.X(q.t), xn = S.X(nb.t);
          const xb = Math.max(12, Math.min(pl.W - 12, xn + dir * Math.max(30, Math.abs(xn - xa) * .6)));
          return [{ x: r.left + xa, y: r.top + S.Y(q.p) }, { x: r.left + xb, y: r.top + S.Y(nb.p) }, xa > 8 && xa < pl.W - 8 && xn > 8 && xn < pl.W - 8 && dir * (xb - xn) > 6]; }, [q, nb, dir]); if (inV) break; } // Zeiteinheit, in der Punkt, Nachbar und Ziel ins Bild passen
        if (!inV) { if (process.env.DBG) console.log('   übersprungen (nicht im Bild)', name, k, dir); continue; } const lb0 = await page.evaluate(() => PGS.lbx().length);
        const dbg = () => page.evaluate(() => JSON.stringify({ lbx: PGS.lbx().map(b => [b.id, Math.round(b.x)]), pts: PGS.FR().pts.map(q => [q.id, q.i, +q.t.toFixed(2)]), sel: PGS.FR().sel, W: PGS.plot().W }));
        if (process.env.DBG) console.log('   vorher', k, dir, await dbg(), JSON.stringify([a, b]));
        let h = false, lb = 0; await drag(a.x, a.y, b.x, b.y + (touch ? 34 : 0), async () => { h = await hint(); lb = await page.evaluate(() => PGS.lbx().length); if (process.env.DBG) console.log('   mittendrin', await dbg()); });
        const Q = await pts(), D = Q.filter(x => x.c === c).sort((x, y) => x.i - y.i), m = Q.find(x => x.id === q.id);
        if (!m || m.i !== q.i) fail('gezogener Punkt hat sein Label verloren');
        else if (D.some((x, j) => j && !(x.t > D[j - 1].t))) fail('Reihenfolge der Zählung nach dem Ziehen kaputt: ' + D.map(x => x.i + '@' + x.t).join(' '));
        else if (D.some(x => x.id !== q.id && (x.t !== C.find(y => y.id === x.id).t || x.p !== C.find(y => y.id === x.id).p))) fail('andere Punkte verschoben');
        else pass();
        if (!h) fail('Hinweis „Punkte bleiben in ihrer Reihenfolge“ fehlt (Punkt ' + k + ', Richtung ' + dir + ')'); else pass();
        if (lb < lb0) fail('während des Ziehens weniger Labels sichtbar: ' + lb + ' statt ' + lb0); else pass();
      }
      // 1) gültiges Ziehen: Punkt 2 ein Stück verschieben, er bleibt am Ring-Ziel
      P = await pts(); const C = P.filter(q => q.c === c).sort((a, b) => a.i - b.i), q = C[2], a = await at(q.t, q.p);
      const tm = q.t + (C[3].t - q.t) * .5, b = await page.evaluate(([t, p]) => { const r = document.querySelector('#svg').getBoundingClientRect(); return { x: r.left + PGS.X(t), y: r.top + PGS.Y(p) }; }, [tm, q.p]);
      const ring = await drag(a.x, a.y, b.x, b.y + (touch ? 34 : 0), () => page.evaluate(() => PGS.ring() && { t: PGS.ring().t, p: PGS.ring().p }));
      const m = (await pts()).find(x => x.id === q.id);
      if (!ring) fail('kein Ring beim Ziehen'); else if (m.t !== ring.t || m.p !== ring.p) fail('Punkt bleibt nicht am Einrast-Ziel: ' + m.t + '/' + m.p + ' statt ' + ring.t + '/' + ring.p); else if (m.t === q.t) fail('Punkt springt zurück an die alte Stelle'); else pass();
    };

    // ---------- Wie geht es weiter? Leicht (Prognose-Punkte in der Zukunftszone) ----------
    let prognLeicht = async () => {
      mode = 'Wie geht es weiter? Leicht';
      await page.evaluate(() => { progn('imp', 'leicht'); const b = document.querySelector('[data-ch]'); if (b) b.click(); });
      const z = await page.evaluate(() => { const S = PGS, v = S.view ? S.view() : null; const c0 = S.R.mp[S.cut]; return { c0 }; });
      const lp = () => page.evaluate(() => PGS.m.pts.map(q => ({ x: q.x, p: q.p })));
      for (let j = 1; j <= 3; j++) { const pos = await page.evaluate(([c0, j]) => { const S = PGS, p0 = S.R.pr ? 0 : 0; const r = document.querySelector('#svg'); r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(), pl = S.plot();
          const x0 = S.X(c0), x = x0 + (pl.W - x0) * j / 4.5; return { x: b.left + x, y: b.top + pl.H * (j % 2 ? .3 : .6) }; }, [z.c0, j]); await tap(pos.x, pos.y); }
      let P = await lp(); if (P.length < 3) return console.log('  Hinweis ' + name + ' · ' + mode + ': nur ' + P.length + ' Prognose-Punkte gesetzt, übersprungen');
      await clearHint();
      const g = q => page.evaluate(([t, p]) => { const r = document.querySelector('#svg').getBoundingClientRect(); return { x: r.left + PGS.X(t), y: r.top + PGS.Y(p) }; }, [q.x, q.p]);
      const a = await g(P[1]), b = await g({ x: P[2].x + (P[2].x - P[1].x), p: P[1].p }); let h = false;
      await drag(a.x, a.y, b.x, b.y, async () => { h = await hint(); });
      const Q = await lp();
      if (Q.length !== P.length || Q.some((q, j) => j && !(q.x > Q[j - 1].x))) fail('Reihenfolge der Prognose-Punkte kaputt');
      else if (Q[0].x !== P[0].x || Q[2].x !== P[2].x) fail('andere Prognose-Punkte verschoben'); else pass();
      if (!h) fail('Hinweis „Punkte bleiben in ihrer Reihenfolge“ fehlt'); else pass();
    };

    const ONLY = process.env.NUR; // z. B. NUR=progn: nur Modi, deren Name das enthält
    if (ONLY) { const f0 = idxMode, f1 = prognSchwer, f2 = prognLeicht, m = s => s.toLowerCase().includes(ONLY.toLowerCase());
      idxMode = (l, ...a) => m(l) ? f0(l, ...a) : 0; prognSchwer = () => m('Wie geht es weiter? Schwer') ? f1() : 0; prognLeicht = () => m('Wie geht es weiter? Leicht') ? f2() : 0; }
    for (let r = 0; r < N; r++) {
      await idxMode('Chart durchzählen', () => count(PAT[Object.keys(PAT)[Math.floor(Math.random() * Object.keys(PAT).length)]]), false);
      await idxMode('Muster erkennen Schwer', () => recogHard(), false);
      if (!r) await idxMode('Tagesaufgabe', () => daily(), false);
      for (const key of await page.evaluate(() => Object.keys(PAT))) await idxMode('Subwellen zählen ' + key, new Function('sub("' + key + '")'), true);
      await prognSchwer();
      await prognLeicht();
    }
    if (errs.length) { bad++; console.log('  FEHLER ' + name + ': Skriptfehler im Browser:\n   ' + [...new Set(errs)].slice(0, 5).join('\n   ')); }
    console.log(name + ': fertig'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log((bad ? 'FEHLGESCHLAGEN: ' + bad + ' Fehler' : 'Alles in Ordnung') + ' (' + ok + ' Prüfungen bestanden)'); process.exit(bad ? 1 : 0);
})();
