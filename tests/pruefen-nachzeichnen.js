// Test „Eigenen Chart prüfen“: Grund unter „Prüfen“, Prüfen nach dem Nachzeichnen, Tipp und Zuschnitt-Vorschlag (seit 25.11.2026, Lenny).
// Aufruf im Repo-Ordner: node tests/pruefen-nachzeichnen.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy, iPad (Touch) und PC (Maus).
// Bild: tests/faelle/paypal-preiskaestchen.png. Geprüft wird mit echten Tipps bzw. Klicks:
//  - beim Hochladen der Tipp „Zeichnungen ausblenden“, beim Zuschneiden ein Vorschlag (Rahmen ohne Preisachse), Weiter übernimmt ihn
//  - „Prüfen“ gesperrt mit konkretem Grund: keine Punkte (Zeichnen bzw. Auswählen), Nachzeichnen läuft, noch fehlende Labels
//  - Nachzeichnen ersetzt den Verlauf nur, wo gezeichnet wurde; danach ist wieder Zeichnen aktiv, Punkte setzen und Prüfen funktioniert
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8809;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 900 } }]];

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext({ ...opt, colorScheme: 'dark' }), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.ocFade', '0'); }); await page.reload();
    await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
    ok(/Zeichnungen ausblenden \(Augen-Symbol links\)/.test(await page.evaluate(() => document.querySelector('#view').textContent)), 'Tipp zum Ausblenden der Zeichnungen fehlt beim Hochladen');
    await page.setInputFiles('#ocfile', path.join(__dirname, 'faelle', 'paypal-preiskaestchen.png')); await page.waitForSelector('#occv'); await page.waitForTimeout(150);
    ok(/Der Rahmen ist ein Vorschlag/.test(await page.evaluate(() => document.querySelector('#view').textContent)), 'kein Zuschnitt-Vorschlag');
    await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg'); await page.waitForTimeout(150);
    const im = await page.evaluate(() => ({ ...PGS.img.crop, w: PGS.img.w, h: PGS.img.h }));
    ok(im.x + im.w <= 1170 && im.w > 900, 'Vorschlag übernommen? Ausschnitt ' + JSON.stringify(im) + ' (Preisachse ab 1170 muss draußen sein)');
    const why = () => page.evaluate(() => { const e = document.querySelector('#pgwhy'), b = document.querySelector('#fchk'); return { t: e ? e.textContent : '', dis: b ? b.disabled : null }; });
    const box = () => page.evaluate(() => { document.querySelector('#pgc').scrollIntoView({ block: 'center' }); const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left, y: b.top }; });
    const tap = async (x, y) => { const b = await box(); if (touch) await page.touchscreen.tap(b.x + x, b.y + y); else await page.mouse.click(b.x + x, b.y + y); await page.waitForTimeout(450); };
    if (!touch) await page.evaluate(() => { const b = document.querySelector('#pgmhok'); if (b) b.click(); });
    let w = await why(); ok(w.dis && /Noch keine Punkte: Tippe auf den Chart/.test(w.t), 'Grund ohne Punkte (Zeichnen) fehlt: ' + w.t);
    await page.click('[data-md="sel"]'); await page.waitForTimeout(200); w = await why(); ok(w.dis && /Werkzeug Zeichnen \(Fadenkreuz\)/.test(w.t), 'Grund im Werkzeug Auswählen fehlt: ' + w.t);
    // Nachzeichnen: Grund, Strich, nur dort ersetzt, danach Zeichnen aktiv
    await page.click('#octr'); await page.waitForTimeout(200); w = await why(); ok(w.dis && /Nachzeichnen beenden/.test(w.t), 'Grund beim Nachzeichnen fehlt: ' + w.t);
    const before = await page.evaluate(() => Array.from(PGS.img.path.hi));
    const pts = await page.evaluate(() => { const I = PGS.img, a = Math.round(I.w * .3), b = Math.round(I.w * .4), o = []; for (let x = a; x <= b; x += Math.round((b - a) / 8)) { const r = I.path.hi[x] >= 0 ? I.path.hi[x] : I.h / 2; o.push([PGS.X(x), PGS.Y(I.h - r - .5) - 12]); } return { o, a, b }; });
    { const b = await box(); if (touch) { const cdp = await ctx.newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + pts.o[0][0], y: b.y + pts.o[0][1] }] });
        for (const [x, y] of pts.o.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + x, y: b.y + y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      else { await page.mouse.move(b.x + pts.o[0][0], b.y + pts.o[0][1]); await page.mouse.down(); for (const [x, y] of pts.o.slice(1)) await page.mouse.move(b.x + x, b.y + y, { steps: 3 }); await page.mouse.up(); } await page.waitForTimeout(400); }
    const after = await page.evaluate(() => ({ hi: Array.from(PGS.img.path.hi), man: Array.from(PGS.img.path.man) }));
    const changed = after.hi.map((v, x) => v !== before[x] ? x : -1).filter(x => x >= 0), out = changed.filter(x => !after.man[x]);
    ok(changed.length > 20 && !out.length, 'Nachzeichnen ersetzt nicht nur die gezeichnete Stelle (' + changed.length + ' Spalten geändert, ' + out.length + ' außerhalb)');
    await page.click('#octr'); await page.waitForTimeout(300); ok(await page.evaluate(() => PGS.FR().md === 'draw'), 'nach dem Nachzeichnen ist nicht wieder Zeichnen aktiv');
    // drei Punkte mit echten Tipps auf deutliche Wendepunkte (Tief, Hoch, Tief), dazwischen der Grund
    const piv = await page.evaluate(() => { const I = PGS.img, P = I.path, f = (a, b, hiw) => { let best = -1; for (let x = a; x <= b; x++) { const v = hiw ? P.hi[x] : P.lo[x]; if (v < 0) continue; if (best < 0 || (hiw ? v < (hiw ? P.hi[best] : 0) : v > P.lo[best])) best = x; } return best; };
      const x1 = f(Math.round(I.w * .05), Math.round(I.w * .2), false), x2 = f(Math.round(I.w * .25), Math.round(I.w * .45), true), x3 = f(Math.round(I.w * .55), Math.round(I.w * .7), false);
      return [[x1, P.lo[x1]], [x2, P.hi[x2]], [x3, P.lo[x3]]].map(([x, r]) => [PGS.X(x), PGS.Y(I.h - r - .5)]); });
    await tap(piv[0][0], piv[0][1]); w = await why(); ok(w.dis && /Setze noch zwei Labels/.test(w.t), 'Grund nach dem Start fehlt: ' + w.t);
    await tap(piv[1][0], piv[1][1]); w = await why(); ok(w.dis && /Setze noch mindestens ein Label/.test(w.t), 'Grund nach einem Label fehlt: ' + w.t);
    await tap(piv[2][0], piv[2][1]); w = await why(); ok(w.dis === false, 'Prüfen nach Nachzeichnen und drei Punkten nicht frei (' + w.t + ', Punkte ' + (await page.evaluate(() => PGS.FR().pts.length)) + ')');
    if (w.dis === false) { await page.click('#fchk'); await page.waitForTimeout(400); ok(await page.evaluate(() => !!document.querySelector('#fb .ok, #fb .bad, #fb .ocwarn')), 'Prüfen liefert kein Ergebnis'); }
    ok(!errs.length, 'Konsole: ' + errs.slice(0, 3).join(' | '));
    console.log(name + ': fertig'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler bei ' + n + ' Prüfungen' : 'Alles in Ordnung (' + n + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
