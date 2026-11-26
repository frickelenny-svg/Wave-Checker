// Scroll-Test (seit 26.11.2026, Lenny, nach Video vom iPhone: „bei jedem Punkt springt die Seite nach oben“, „beim Runterscrollen wackelt es“).
// Aufruf im Repo-Ordner: node tests/scroll-stabil.js [Runden je Modus]   (Playwright; PWCH=msedge bzw. chrome; ENGINE=webkit für WebKit)
// Handy-Simulation (iPhone-Größe 390 × 844, Touch) und iPad. Spielt ganze Runden mit echten Tipps auf den Chart und auf die Knöpfe über dem Chart:
//  - „Wie geht es weiter?“ Leicht (Zählweise wählen, Prognose-Punkte) und Schwer (Zählweise, Punkte auf den Pivots der großen Welle),
//  - „Eigenen Chart prüfen“ (festes Bild, Punkte auf dem Verlauf), „Chart durchzählen“, „Muster erkennen – Schwer“, „Subwellen zählen“.
// Vor jeder Runde wird die Seite so gescrollt, dass der Chart mitten im Bild steht (Scrollposition > 0, wie im Video).
// Geprüft nach jedem Tipp: Chart an derselben Stelle im Bild (±1 px), Scrollposition unverändert (±1 px; Ausnahme nur, wenn der Bereich über dem
// Chart zum ersten Mal höher wird, dann gleicht die Scrollposition genau das aus), Seite nie kürzer, als dass die Scrollposition hält.
// Dazu: Seite auf Chart-Bildschirmen mindestens 40 px länger als die große Fensterhöhe (Safari-Leiste), keine vh-Höhen ohne svh/lvh/dvh.
const { chromium, webkit } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8798, N = +process.argv[2] || 3;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': require('./typ')(p), 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['iPhone', { viewport: { width: 390, height: 664 }, screen: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1050 }, screen: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }]];
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const eng = process.env.ENGINE === 'webkit' ? webkit : chromium;
  const browser = await eng.launch(process.env.ENGINE === 'webkit' || !process.env.PWCH ? { headless: true } : { channel: process.env.PWCH, headless: true }); let bad = 0; const t0 = Date.now();
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [], stat = {};
    const fail = m => { bad++; if (bad < 40) console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); localStorage.setItem('waveChecker.tutSeen', JSON.stringify(['count', 'find', 'find-schwer', 'recog', 'recog-schwer', 'daily', 'sub', 'blitz', 'progn', 'progn-schwer', 'quiz'])); localStorage.setItem('waveChecker.ocFade', '0'); }); await page.reload();
    const tap = async (x, y) => { await page.touchscreen.tap(x, y); await page.waitForTimeout(60); };
    const pos = () => page.evaluate(() => { const c = document.querySelector('#view .chart'), v = document.querySelector('#view'); return { sy: scrollY, ct: c ? c.getBoundingClientRect().top : null, top: c ? c.getBoundingClientRect().top - v.getBoundingClientRect().top : null, dh: document.documentElement.scrollHeight }; });
    // Chart mitten ins Bild (wie im Video: Seite ein Stück nach unten gescrollt)
    const center = () => page.evaluate(() => { const c = document.querySelector('#view .chart'), r = c.getBoundingClientRect(); window.scrollTo(0, Math.max(40, scrollY + r.top + r.height / 2 - innerHeight / 2)); });
    // ein Tipp und Prüfung danach. what = Text für die Meldung
    const step = async (mode, what, x, y) => { const a = await pos(); await tap(x, y); const b = await pos(); const s = stat[mode] = stat[mode] || { n: 0, sy: 0, grew: 0 }; s.n++;
      if (a.ct === null || b.ct === null) return;
      if (Math.abs(b.ct - a.ct) > 1) fail(mode + ', ' + what + ': Chart verrutscht um ' + (b.ct - a.ct).toFixed(1) + ' px (Scroll ' + a.sy + ' → ' + b.sy + ')');
      const dTop = b.top - a.top; if (dTop > 1) s.grew++;
      if (Math.abs(b.sy - a.sy - Math.max(0, dTop)) > 1) fail(mode + ', ' + what + ': Scrollposition ' + a.sy + ' → ' + b.sy + ' (Bereich über dem Chart ' + dTop.toFixed(1) + ' px)');
      if (Math.abs(b.sy - a.sy) > 1) s.sy++; };
    // an Bildschirmkoordinaten eines Elements tippen
    const tapEl = async (mode, sel) => { const r = await page.evaluate(s => { const e = document.querySelector(s); if (!e || e.disabled) return null; { const b = e.getBoundingClientRect(); if (b.top < 70) window.scrollBy(0, b.top - 70); else if (b.bottom > innerHeight - 230) window.scrollBy(0, b.bottom - innerHeight + 230); } /* wie ein Mensch: erst hinscrollen */ const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.top > 4 && b.bottom < innerHeight - 4]; }, sel);
      if (!r) return false; if (!r[2]) { fail(mode + ': Knopf ' + sel + ' nicht im Bild'); return false; } await page.waitForTimeout(400); await step(mode, 'Knopf ' + sel, r[0], r[1]); await page.waitForTimeout(400); return true; };
    const svgAt = (fx, fy) => page.evaluate(([fx, fy]) => { const r = document.querySelector('#svg').getBoundingClientRect(); return [r.left + fx * r.width, r.top + fy * r.height]; }, [fx, fy]);
    const ptAt = (t, p) => page.evaluate(([t, p]) => { const r = document.querySelector('#svg').getBoundingClientRect(); return [r.left + PGS.X(t), r.top + PGS.Y(p)]; }, [t, p]);
    const minLen = () => page.evaluate(() => { const lvh = (() => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;top:0;height:100lvh;width:1px'; document.body.appendChild(d); const h = d.offsetHeight || innerHeight; d.remove(); return h; })(); return { dh: document.documentElement.scrollHeight, lvh }; });
    const check = async mode => { const l = await minLen(); if (l.dh < l.lvh + 40) fail(mode + ': Seite nur ' + l.dh + ' px hoch, große Fensterhöhe ' + l.lvh + ' px (Safari-Leiste: Wackeln beim Scrollen)'); };
    for (let r = 0; r < N; r++) {
      // ---- Wie geht es weiter? Leicht
      { const M = 'Prognose Leicht'; await page.evaluate(() => progn(undefined, 'leicht')); await page.waitForTimeout(100); await check(M); await center();
        for (const w of await page.evaluate(() => PGS.truth())) {
          if (!await tapEl(M, '[data-ch="' + w.kind + '"]')) { fail(M + ': Zählweise-Knopf ' + w.kind + ' fehlt'); break; }
          for (const q of w.pts) { await page.evaluate(([t, p]) => { const S = PGS, r = document.querySelector('#svg').getBoundingClientRect(), x = r.left + S.X(t); if (x < r.left + 20 || x > r.right - 20) { const sy = scrollY; S.show(t, p); window.scrollTo(0, sy); } }, [q.t, q.p]);
            const [x, y] = await ptAt(q.t, q.p); await page.waitForTimeout(360); await step(M, 'Punkt', x, y); } } }
      // ---- Wie geht es weiter? Schwer
      { const M = 'Prognose Schwer'; await page.evaluate(() => progn(undefined, 'schwer')); await page.waitForTimeout(100); await check(M); await center();
        const z = await page.evaluate(() => Object.keys(PGZL).find(x => PAT[PGZL[x]].labels.join() === PGS.P.labels.join()));
        await tapEl(M, '[data-fz="' + z + '"]');
        const L = await page.evaluate(() => PGS.R.mp.slice(0, PGS.cut + 2).map(t => [t, PGS.R.pr[t]]));
        for (const [t, p] of L) { await page.evaluate(([t, p]) => { const S = PGS, r = document.querySelector('#svg').getBoundingClientRect(), x = r.left + S.X(t), y = r.top + S.Y(p); if (x < r.left + 30 || x > r.right - 30 || y < r.top + 60 || y > r.bottom - 40) { const sy = scrollY; S.show(t, p); window.scrollTo(0, sy); } }, [t, p]);
          const [x, y] = await ptAt(t, p); await page.waitForTimeout(400); await step(M, 'Punkt', x, y); }
        await tapEl(M, '[data-md="sel"]'); await tapEl(M, '[data-md="draw"]'); }
      // ---- Chart durchzählen
      { const M = 'Chart durchzählen'; await page.evaluate(() => { const k = Object.keys(PAT).filter(k => !PAT[k].noRecog); count(PAT[k[Math.floor(Math.random() * k.length)]]); }); await page.waitForTimeout(100); await check(M); await center();
                const n = 6;
        for (let k = 0; k < n; k++) { const i = 3 + k * 7, [x] = await svgAt(0, 0); const xx = await page.evaluate(i => { const r = document.querySelector('#svg').getBoundingClientRect(); return r.left + (X0 + i * DX) * r.width / W; }, i);
          const [, y] = await svgAt(0, .5); await page.waitForTimeout(360); await step(M, 'Punkt ' + (k + 1), xx, y); } }
      // ---- Muster erkennen – Schwer
      { const M = 'Muster erkennen Schwer'; await page.evaluate(() => recogHard()); await page.waitForTimeout(100); await check(M); await center();
        await tapEl(M, '[data-z="0"]');
        for (let k = 0; k < 6; k++) { const xx = await page.evaluate(i => { const r = document.querySelector('#svg').getBoundingClientRect(); return r.left + (X0 + i * DX) * r.width / W; }, 3 + k * 7); const [, y] = await svgAt(0, .5); await page.waitForTimeout(360); await step(M, 'Punkt ' + (k + 1), xx, y); } }
      // ---- Subwellen zählen
      { const M = 'Subwellen zählen'; await page.evaluate(() => { const k = Object.keys(PAT).filter(k => PAT[k].labels.length === 6 && !PAT[k].noRecog); sub(k[Math.floor(Math.random() * k.length)]); }); await page.waitForTimeout(100); await check(M); await center();
        for (let k = 0; k < 6; k++) { const xx = await page.evaluate(f => { const r = document.querySelector('#svg').getBoundingClientRect(); return r.left + (X0 + f * (W - 2 * X0)) * r.width / W; }, .05 + k * .17); const [, y] = await svgAt(0, .5); await page.waitForTimeout(360); await step(M, 'Punkt ' + (k + 1), xx, y); } }
      // ---- Eigenen Chart prüfen (festes Bild)
      if (r === 0) { const M = 'Eigenen Chart prüfen'; await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
        await page.setInputFiles('#ocfile', path.join(__dirname, 'faelle', 'paypal-preiskaestchen.png')); await page.waitForSelector('#occv'); await page.waitForTimeout(150);
        await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg'); await page.waitForTimeout(150); await check(M); await center();
        await tapEl(M, '[data-fz="N"]');
        for (let k = 0; k < 6; k++) { const [x, y] = await svgAt(.08 + k * .16, k % 2 ? .3 : .7); await page.waitForTimeout(400); await step(M, 'Punkt ' + (k + 1), x, y); } }
    }
    // keine vh-Höhen ohne svh/lvh/dvh-Gegenstück in den Styles
    const css = fs.readFileSync(path.join(ROOT, 'css', 'app.css'), 'utf8');
    for (const m of css.matchAll(/[^;{}]*\b\d+vh\b[^;{}]*/g)) { const decl = m[0].trim(), prop = decl.split(':')[0]; const after = css.slice(m.index, m.index + 400);
      if (!/var\(--vvh/.test(decl) && !new RegExp(prop.replace(/[-]/g, '\\-') + ':[^;{}]*\\d+(svh|lvh|dvh)').test(after)) fail('CSS: ' + decl + ' ohne svh/lvh/dvh'); }
    console.log(name.padEnd(7), Object.keys(stat).map(k => k + ' ' + stat[k].n + ' Tipps (Bereich darüber gewachsen ' + stat[k].grew + ', Scroll ausgeglichen ' + stat[k].sy + ')').join('; '), '|', errs.length, 'Konsolenfehler', errs.slice(0, 2).join(' | '));
    if (errs.length) bad++;
    await ctx.close();
  }
  await browser.close(); server.close(); console.log((bad ? bad + ' Fehler' : 'Alles in Ordnung') + ', ' + Math.round((Date.now() - t0) / 1000) + ' s'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ABBRUCH', e); process.exit(1); });
