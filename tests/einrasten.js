// Einrast-Test für „Wie geht es weiter?“ Schwer (seit 16.11.2026, Lenny). Echte Tipps (Finger am Handy und iPad, Maus am PC).
// Aufruf im Repo-Ordner: node tests/einrasten.js [Runden je Gerät]   (Playwright nötig; PWCH=chrome bzw. PWCH=msedge für einen installierten Browser)
// Prüft:
//  1) Grobes Tippen neben ein Pivot (zufälliger Versatz: Finger bis 22 px, Maus bis 9 px) landet in mindestens 95 % der Fälle genau auf dem
//     gewünschten Hoch bzw. Tief, in allen vier Zeiteinheiten.
//  2) Ziehen: Ein Ring zeigt das Ziel, nach dem Loslassen sitzt der Punkt genau auf dem Pivot (auch mit Versatz).
//  3) Zukunftszone: frei setzen; ein Tipp neben einen bestehenden Prognose-Punkt rastet genau auf ihm ein.
//  4) PC: Mit gedrückter Alt-Taste wird frei platziert (kein Einrasten).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8794, N = +process.argv[2] || 8;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const disc = r => { const a = Math.random() * 2 * Math.PI, d = r * Math.sqrt(Math.random()); return [d * Math.cos(a), d * Math.sin(a)]; };
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [], OFF = touch ? 22 : 9;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    const cdp = touch ? await ctx.newCDPSession(page) : null;
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(30); };
    // Stelle (t, p) plus Versatz ins Bild holen; null, wenn sie unter einem Knopf oder außerhalb liegt
    const at = (t, p, dx, dy) => page.evaluate(([t, p, dx, dy]) => { const S = PGS; S.show(t, p); document.querySelector('#pgc').scrollIntoView({ block: 'center' }); const b = document.querySelector('#svg').getBoundingClientRect(), dock = document.querySelector('.dock').getBoundingClientRect().top;
      const x = b.left + S.X(t) + dx, y = b.top + S.Y(p) + dy, e = document.elementFromPoint(x, y), pl = S.plot(); return y > 8 && y < dock - 8 && y - b.top < pl.H - 4 && e && e.closest('#svg') ? { x, y } : null; }, [t, p, dx, dy]);
    const pts = () => page.evaluate(() => PGS.FR().pts.map(q => ({ id: q.id, c: q.c, i: q.i, t: q.t, p: q.p })));
    const stat = {}; let hit = 0, tot = 0, far = 0;
    for (let r = 0; r < N; r++) for (const h of [168, 24, 4, 1]) {
      // ---- 1) grobes Tippen neben die Pivots der großen Welle ----
      const info = await page.evaluate(h => { const keys = Object.keys(PAT); progn(keys[Math.floor(Math.random() * keys.length)], 'schwer'); const S = PGS, R = S.R; S.setTf(h);
        const z = Object.keys(PGZL).find(x => PAT[PGZL[x]].labels.join() === S.P.labels.join()); document.querySelector('[data-fz="' + z + '"]').click();
        const c0 = R.mp[S.cut], ex = (g, hi) => { let m = hi ? -1e99 : 1e99; if (g < 0) return hi ? -1e99 : 1e99; for (let i = g * h; i <= Math.min(c0, g * h + h - 1); i++) m = hi ? Math.max(m, R.h[i]) : Math.min(m, R.l[i]); return m; };
        // „gewünschtes Pivot“: Wellenende, das in dieser Zeiteinheit das Hoch bzw. Tief seiner Kerze und der beiden Nachbarkerzen ist (im Wochen-Chart läuft sonst z. B. eine spätere Teilwelle darüber hinaus)
        const piv = R.mp.map((t, k) => { if (t > c0) return false; const p = R.pr[t], hi = k ? p > R.pr[R.mp[k - 1]] : p > R.pr[R.mp[1]], g = Math.floor(t / h); return ex(g, hi) === p && (hi ? ex(g - 1, hi) <= p && ex(g + 1, hi) <= p : ex(g - 1, hi) >= p && ex(g + 1, hi) >= p); });
        return { cut: S.cut, L: R.mp.map(t => [t, R.pr[t]]), c0, piv }; }, h);
      let n0 = 0;
      for (let k = 0; k <= info.cut; k++) { const [dx, dy] = disc(OFF), pos = await at(info.L[k][0], info.L[k][1], dx, dy); if (!pos) break;
        await tap(pos.x, pos.y); const P = await pts(), q = P[P.length - 1], set = P.length === n0 + 1; if (set) n0++;
        if (info.piv[k]) { tot++; stat[h] = stat[h] || [0, 0]; stat[h][1]++; if (set && q.p === info.L[k][1]) { hit++; stat[h][0]++; if (Math.abs(q.t - info.L[k][0]) > Math.max(24, 2 * h)) far++; } /* Treffer = genau der Preis des Hochs bzw. Tiefs; far: gleich hohe Kerze weiter weg (flache Spitze bzw. Doppelhoch) */ else if (process.env.DBG) console.log('   daneben', name, h + 'h', 'k=' + k, set ? 'dt=' + (q.t - info.L[k][0]) + ' dp=' + (q.p - info.L[k][1]).toFixed(2) : 'nicht gesetzt', 'Versatz', dx.toFixed(0), dy.toFixed(0)); }
        if (!set) break; }
      if (h !== 24) continue;
      // ---- 3) Zukunftszone: frei, und Einrasten auf einen bestehenden Prognose-Punkt ----
      const fut = await page.evaluate(() => { const S = PGS, F = S.FR(), lst = F.pts[F.pts.length - 1], v = S.view(); S.show(S.R.mp[S.cut]); document.querySelector('#pgc').scrollIntoView({ block: 'center' }); const b = document.querySelector('#svg').getBoundingClientRect();
        const t = S.R.mp[S.cut] + 30 * v.tf / v.BW, x = b.left + S.X(t), y = b.top + S.plot().H * (.35 + .3 * Math.random()); return { x, y, n: F.pts.length, ac: F.ac, py: S.Pof(y - b.top), e: !!document.elementFromPoint(x, y).closest('#svg') }; });
      if (fut.ac !== null && fut.e) { await tap(fut.x, fut.y); let P = await pts(); const q = P[P.length - 1];
        if (P.length !== fut.n + 1) fail('Zukunftszone: Tipp setzt keinen Punkt'); else if (Math.abs(q.p - fut.py) > .01 || q.t <= info.c0) fail('Zukunftszone: Punkt nicht frei gesetzt');
        else { // neue Zählung neben dem Prognose-Punkt beginnen: rastet genau auf ihm ein
          await page.evaluate(() => { const S = PGS; S.FR().ac = null; document.querySelector('[data-fz="ABC"]').click(); }); const [dx, dy] = disc(OFF), pos = await at(q.t, q.p, dx, dy);
          if (pos) { await page.waitForTimeout(380); /* sonst greift der Schutz gegen doppelte Tipps an derselben Stelle */ await tap(pos.x, pos.y); P = await pts(); const s = P[P.length - 1]; if (P.length !== fut.n + 2 || s.t !== q.t || s.p !== q.p) fail('Tipp neben einen Prognose-Punkt rastet nicht auf ihm ein'); } } }
      // ---- 2) Ziehen mit Ring: Punkt von Pivot 1 weg und (mit Versatz) wieder hin ----
      const P0 = (await pts()).filter(q => q.i === 1)[0]; if (!P0 || P0.p !== info.L[1][1] || !info.piv[1]) continue;
      await page.waitForTimeout(420); await page.evaluate(() => document.querySelector('[data-md="sel"]').click());
      const drag = async (x1, y1, x2, y2, mid) => { if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] }); for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 6, y: y1 + (y2 - y1) * i / 6 }] });
          for (let i = 0; i < 3; i++) { await page.waitForTimeout(50); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x2, y: y2 }] }); } const m = await mid(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300); return m; }
        await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 6 }); const m = await mid(); await page.mouse.up(); return m; };
      let a = await at(P0.t, P0.p, 0, 0); if (!a) continue;
      await drag(a.x, a.y, a.x + (a.x > 200 ? -90 : 90), a.y + (touch ? 34 : 0) + 25, async () => 0); // irgendwohin weg
      let moved = (await pts()).find(q => q.id === P0.id); if (moved.t === P0.t && moved.p === P0.p) { fail('Punkt ließ sich nicht wegziehen'); continue; }
      const [dx, dy] = disc(OFF), b = await at(moved.t, moved.p, 0, 0), tg = await page.evaluate(([t, p]) => { const b = document.querySelector('#svg').getBoundingClientRect(); return [b.left + PGS.X(t), b.top + PGS.Y(p)]; }, info.L[1]);
      if (!b) continue;
      const ring = await drag(b.x, b.y, tg[0] + dx, tg[1] + dy + (touch ? 34 : 0), () => page.evaluate(() => PGS.ring())); // am Handy liegt der Punkt 34 px über dem Finger
      moved = (await pts()).find(q => q.id === P0.id); tot++; stat.zieh = stat.zieh || [0, 0]; stat.zieh[1]++;
      if (!ring) fail('beim Ziehen fehlt der Ring für das Einrast-Ziel');
      if (moved.p === info.L[1][1]) { hit++; stat.zieh[0]++; } else if (process.env.DBG) console.log('   Ziehen daneben', name, 'dt=' + (moved.t - info.L[1][0]), 'dp=' + (moved.p - info.L[1][1]).toFixed(2));
      if (await page.evaluate(() => !!PGS.ring())) fail('Ring bleibt nach dem Loslassen stehen');
      // ---- 4) PC: Alt = frei platzieren ----
      if (!touch) { await page.evaluate(() => { document.querySelector('[data-md="draw"]').click(); PGS.FR().ac = null; document.querySelector('[data-fz="N"]').click(); }); const pos = await at(info.L[0][0], info.L[0][1], 6, 5);
        if (pos) { const n = (await pts()).length; await page.keyboard.down('Alt'); await page.mouse.click(pos.x, pos.y); await page.keyboard.up('Alt'); const P = await pts(), q = P[P.length - 1];
          if (P.length !== n + 1) fail('Alt + Klick setzt keinen Punkt'); else if (q.p === info.L[0][1]) fail('Alt + Klick rastet trotzdem ein'); } }
    }
    const pct = tot ? 100 * hit / tot : 0;
    console.log(name.padEnd(6), 'Treffer ' + hit + ' von ' + tot + ' = ' + pct.toFixed(1) + ' %', '(' + Object.keys(stat).map(k => (k === 'zieh' ? 'Ziehen' : k + 'h') + ' ' + stat[k][0] + '/' + stat[k][1]).join(', ') + ')', 'davon ' + far + ' auf gleich hoher Kerze weiter weg,', errs.length, 'Konsolenfehler', errs.slice(0, 2).join(' | '));
    if (pct < 95) fail('Trefferquote unter 95 %'); if (errs.length) bad++;
    await ctx.close();
  }
  await browser.close(); server.close(); console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ABBRUCH', e); process.exit(1); });
