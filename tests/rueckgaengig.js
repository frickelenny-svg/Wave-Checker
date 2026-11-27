// Test „Eigenen Chart prüfen“: Verschieben beim Nachzeichnen und Rückgängig/Wiederherstellen (seit 27.11.2026, Lenny, Video).
// Aufruf im Repo-Ordner: node tests/rueckgaengig.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy, iPad (Touch) und PC (Maus).
// Bild: tests/faelle/paypal-preiskaestchen.png. Geprüft wird mit echten Tipps, Strichen und Tasten:
//  1) Nachzeichnen: Hinweis zum Verschieben beim Start; zwischen zwei Strichen verschieben bzw. strecken, ohne den Modus zu verlassen:
//     Streifen unten ziehen (alle Geräte), zwei Finger ziehen (Handy/iPad), Leertaste + Ziehen, rechte Maustaste + Ziehen, Mausrad (PC).
//     Dabei ändert sich der Verlauf nicht und es entsteht kein Schritt; der zweite Strich landet dort, wo er nach dem Verschieben gezeichnet wurde.
//  2) Rückgängig/Wiederherstellen für jede Aktionsart: Strich, Punkt setzen (echter Tipp), verschieben (echtes Ziehen), umbenennen,
//     Unterteilung beginnen, Wellengröße ändern, Zählung löschen (auch „Rückgängig“ im Hinweis), Neu setzen, Verlauf wiederherstellen.
//     Nach Rückgängig genau der Stand davor, nach Wiederherstellen genau der Stand danach. Knöpfe in der Werkzeugleiste, ausgegraut ohne Schritt.
//  3) Tasten (PC): Strg+Z, Strg+Y, Strg+Umschalt+Z, Cmd+Z. 4) Mindestens 50 Schritte. 5) Neues Bild: Verlauf der Schritte leer. Kein „Zurück“ mehr.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8817;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': require('./typ')(p), 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 900 } }]];
const IMGF = path.join(__dirname, 'faelle', 'paypal-preiskaestchen.png');
(async () => {
  await new Promise(r => server.listen(PORT, r)); const T0 = Date.now();
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [], cdp = touch ? await ctx.newCDPSession(page) : null;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); localStorage.setItem('waveChecker.ocFade', '0'); }); await page.reload();
    const load = async () => { await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' }); await page.setInputFiles('#ocfile', IMGF); await page.waitForSelector('#occv'); await page.waitForTimeout(120);
      await page.click('#ocall'); await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg'); await page.waitForTimeout(150); };
    await load();
    // Stand (Punkte, Größen, Verlauf) als Text, Ansicht, Schritte
    const sig = () => page.evaluate(() => { const F = PGS.FR(), P = PGS.img.path; return JSON.stringify([F.pts.map(q => [q.id, q.c, q.z, q.i, +q.t.toFixed(3), +q.p.toFixed(3)]), F.cm, F.ac]) + '|' + Array.from(P.hi).join(',') + '|' + Array.from(P.man).join(','); });
    const view = () => page.evaluate(() => [+PGS.X(0).toFixed(1), +(PGS.X(100) - PGS.X(0)).toFixed(2), +PGS.Y(0).toFixed(1)]);
    const his = () => page.evaluate(() => PGS.his());
    const btns = () => page.evaluate(() => { const u = document.querySelector('[data-ur="u"]'), r = document.querySelector('[data-ur="r"]'); return { u: u ? !u.disabled : null, r: r ? !r.disabled : null, inBar: !!(u && u.closest('.pgtool')), zurueck: !!document.querySelector('#fund') }; });
    const box = () => page.evaluate(() => { const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    const center = () => page.evaluate(() => document.querySelector('#pgc').scrollIntoView({ block: 'center' }));
    const tapAt = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(450); };
    const tapEl = async sel => { await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); const r = await page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel); await tapAt(r[0], r[1]); };
    const undoBtn = () => tapEl('[data-ur="u"]'), redoBtn = () => tapEl('[data-ur="r"]');
    // Strich bzw. Ziehen mit einem Finger / der Maus (Punkte in Chart-Koordinaten)
    const stroke = async (pts, o = {}) => { await center(); const b = await box(), P = pts.map(([x, y]) => [b.x + x, b.y + y]);
      if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: P[0][0], y: P[0][1] }] }); for (const [x, y] of P.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
        await page.waitForTimeout(120); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: P[P.length - 1][0], y: P[P.length - 1][1] }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      else { await page.mouse.move(P[0][0], P[0][1]); await page.mouse.down({ button: o.button || 'left' }); for (const [x, y] of P.slice(1)) await page.mouse.move(x, y, { steps: 3 }); await page.mouse.up({ button: o.button || 'left' }); }
      await page.waitForTimeout(350); };
    const two = async (dx, dy) => { await center(); const b = await box(), cx = b.x + b.w / 2, cy = b.y + b.h * .45, A = [[cx - 60, cy], [cx + 60, cy]];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: A[0][0], y: A[0][1], id: 1 }] }); await page.waitForTimeout(30);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: A[0][0], y: A[0][1], id: 1 }, { x: A[1][0], y: A[1][1], id: 2 }] });
      for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: A[0][0] + dx * i / 8, y: A[0][1] + dy * i / 8, id: 1 }, { x: A[1][0] + dx * i / 8, y: A[1][1] + dy * i / 8, id: 2 }] });
      await page.waitForTimeout(100); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(350); };
    // Strich-Punkte über dem erkannten Verlauf zwischen Anteil a und b der Bildbreite (in der aktuellen Ansicht, sichtbar)
    const line = (a, b, off) => page.evaluate(([a, b, off]) => { const I = PGS.img, pl = PGS.plot(), o = []; for (let k = 0; k <= 10; k++) { const sx = pl.W * (a + (b - a) * k / 10), x = Math.round((sx - PGS.X(0)) / (PGS.X(1) - PGS.X(0))), r = I.path.hi[x] >= 0 ? I.path.hi[x] : I.h / 2;
        o.push([sx, Math.max(70, Math.min(pl.H - 10, PGS.Y(I.h - r - .5) + off))]); } return o; }, [a, b, off]);

    // ---- 1) Nachzeichnen mit Verschieben/Strecken zwischendurch ----
    ok((await btns()).inBar && !(await btns()).u && !(await btns()).r && !(await btns()).zurueck, 'Rückgängig/Wiederherstellen fehlen in der Werkzeugleiste, sind nicht ausgegraut oder „Zurück“ ist noch da ' + JSON.stringify(await btns()));
    await page.evaluate(() => { const b = document.querySelector('[data-zm="+"]'); b.click(); b.click(); }); // hineinzoomen, damit es etwas zu verschieben gibt
    const s0 = await sig(); await tapEl('#octr');
    const toast = await page.evaluate(() => (document.querySelector('#toast') || {}).textContent || '');
    ok(/Zum Verschieben: Leertaste halten bzw\. mit zwei Fingern ziehen\./.test(toast), 'Hinweis beim Start des Nachzeichnens fehlt: „' + toast + '“');
    await stroke(await line(.2, .45, -14)); const s1 = await sig(); let h = await his();
    ok(s1 !== s0 && h.u === 1, 'erster Strich ändert nichts bzw. kein Schritt (' + JSON.stringify(h) + ')');
    const moves = [];
    { const v0 = await view(); const b = await box(); // Streifen unten: strecken
      await stroke([[b.w * .5, b.h - 12], [b.w * .62, b.h - 12], [b.w * .75, b.h - 12]]); const v1 = await view(); moves.push(['Streifen', v0, v1, Math.abs(v1[1] - v0[1]) > .5]); }
    if (touch) { const v0 = await view(); await two(-90, 30); const v1 = await view(); moves.push(['zwei Finger', v0, v1, Math.abs(v1[0] - v0[0]) > 5 || Math.abs(v1[2] - v0[2]) > 5]); }
    else {
      { const v0 = await view(); const b = await box(); await page.keyboard.down('Space'); await stroke([[b.w * .5, b.h * .45], [b.w * .4, b.h * .4], [b.w * .3, b.h * .4]]); await page.keyboard.up('Space'); const v1 = await view(); moves.push(['Leertaste', v0, v1, Math.abs(v1[0] - v0[0]) > 5 || Math.abs(v1[2] - v0[2]) > 5]); }
      { const v0 = await view(); const b = await box(); await stroke([[b.w * .4, b.h * .45], [b.w * .5, b.h * .5], [b.w * .6, b.h * .5]], { button: 'right' }); const v1 = await view(); moves.push(['rechte Maustaste', v0, v1, Math.abs(v1[0] - v0[0]) > 5 || Math.abs(v1[2] - v0[2]) > 5]); }
      { const v0 = await view(); const b = await box(); await page.mouse.move(b.x + b.w * .5, b.y + b.h * .5); await page.mouse.wheel(0, -300); await page.waitForTimeout(200); const v1 = await view(); moves.push(['Mausrad', v0, v1, Math.abs(v1[1] - v0[1]) > .5]); }
    }
    for (const [what, v0, v1, mv] of moves) ok(mv, 'Nachzeichnen: ' + what + ' bewegt den Chart nicht (' + v0 + ' → ' + v1 + ')');
    const s2 = await sig(); h = await his(); ok(s2 === s1 && h.u === 1, 'Verschieben beim Nachzeichnen hat den Verlauf geändert oder einen Schritt erzeugt (' + JSON.stringify(h) + ')');
    ok(await page.evaluate(() => PGS.img.trace), 'Nachzeichnen wurde durch das Verschieben beendet');
    // zweiter Strich nach dem Verschieben: landet unter dem Finger (geänderte Spalten im Bereich des Strichs in der neuen Ansicht)
    const L2 = await line(.35, .6, -16), rng = await page.evaluate(L => { const t = L.map(([x]) => (x - PGS.X(0)) / (PGS.X(1) - PGS.X(0))); return [Math.floor(Math.min(...t)) - 3, Math.ceil(Math.max(...t)) + 3]; }, L2);
    const man1 = await page.evaluate(() => Array.from(PGS.img.path.hi)); await stroke(L2); const s3 = await sig(); h = await his();
    const ch = await page.evaluate(b => Array.from(PGS.img.path.hi).map((v, x) => v !== b[x] ? x : -1).filter(x => x >= 0), man1);
    ok(h.u === 2 && ch.length > 10 && ch.every(x => x >= rng[0] && x <= rng[1]), 'zweiter Strich nach dem Verschieben nicht an der gezeichneten Stelle (' + ch.length + ' Spalten, ' + (ch[0]) + '…' + ch[ch.length - 1] + ', erwartet ' + rng + ')');
    await undoBtn(); ok(await sig() === s1, 'Rückgängig nach dem zweiten Strich: nicht der Stand nach dem ersten');
    await undoBtn(); ok(await sig() === s0, 'Rückgängig nach dem ersten Strich: nicht der Ausgangsstand');
    ok(!(await btns()).u && (await btns()).r, 'Rückgängig nicht ausgegraut bzw. Wiederherstellen gesperrt ' + JSON.stringify(await btns()));
    await redoBtn(); ok(await sig() === s1, 'Wiederherstellen: erster Strich fehlt'); await redoBtn(); ok(await sig() === s3, 'Wiederherstellen: zweiter Strich fehlt');
    ok(!(await btns()).r, 'Wiederherstellen nicht ausgegraut, obwohl nichts mehr da ist');
    await tapEl('#octr'); await page.waitForTimeout(200);
    // Verlauf wiederherstellen (ein Schritt)
    if (await page.evaluate(() => !!document.querySelector('#ocrs'))) { const a = await sig(); await tapEl('#ocrs'); const b2 = await sig(); await undoBtn(); const c = await sig(); await redoBtn(); const d = await sig();
      ok(b2 !== a && c === a && d === b2, 'Rückgängig/Wiederherstellen bei „Erkannten Verlauf wiederherstellen“ falsch'); }

    // ---- 2) Aktionen der Zählung ----
    const piv = await page.evaluate(() => { const I = PGS.img, P = I.path, f = (a, b, hi) => { let best = -1; for (let x = a; x <= b; x++) { const v = hi ? P.hi[x] : P.lo[x]; if (v < 0) continue; if (best < 0 || (hi ? v < P.hi[best] : v > P.lo[best])) best = x; } return best; };
      return [f(Math.round(I.w * .05), Math.round(I.w * .2), false), f(Math.round(I.w * .25), Math.round(I.w * .45), true), f(Math.round(I.w * .55), Math.round(I.w * .7), false), f(Math.round(I.w * .75), Math.round(I.w * .9), true)].map(x => ({ x, lo: P.lo[x], hi: P.hi[x] })); });
    await page.evaluate(() => { const b = document.querySelector('[data-zr]'); if (b) b.click(); });
    const check = async (what, act) => { const a = await sig(), u0 = (await his()).u; await act(); await page.waitForTimeout(150); const b2 = await sig(), u1 = (await his()).u;
      if (b2 === a) { fail(what + ': Aktion hat nichts geändert'); return; } ok(u1 === u0 + 1, what + ': ' + (u1 - u0) + ' Schritte statt 1');
      await undoBtn(); const c = await sig(); ok(c === a, what + ': Rückgängig stellt den Stand davor nicht her' + (c === a ? '' : ' ' + [a, c].map(s => s.split('|')[0]).join(' ⇢ '))); await redoBtn(); const d = await sig(); ok(d === b2, what + ': Wiederherstellen stellt den Stand danach nicht her'); };
    // Punkt setzen mit echtem Tipp (Start, dann 1)
    const scr = async q => { await center(); const b = await box(); return page.evaluate(([q, b]) => { const I = PGS.img; return [b.x + PGS.X(q.x), b.y + PGS.Y(I.h - (q.lo >= 0 ? q.lo : I.h / 2) - .5)]; }, [q, b]); };
    await page.evaluate(() => document.querySelector('[data-fz="N"]').click()); await page.waitForTimeout(200);
    await check('Punkt setzen (Start)', async () => { const [x, y] = await scr(piv[0]); await tapAt(x, y); });
    await check('Punkt setzen (1)', async () => { const [x, y] = await page.evaluate(([q, b]) => { const I = PGS.img; return [b.x + PGS.X(q.x), b.y + PGS.Y(I.h - q.hi - .5)]; }, [piv[1], await box()]); await tapAt(x, y); });
    await page.evaluate(([a, b]) => { const I = PGS.img; PGS.fadd('N', 2, a.x, I.h - a.lo - .5); PGS.fadd('N', 3, b.x, I.h - b.hi - .5); }, [piv[2], piv[3]]); await page.waitForTimeout(100);
    // verschieben mit echtem Ziehen (Werkzeug Auswählen)
    await page.evaluate(() => document.querySelector('[data-md="sel"]').click()); await page.waitForTimeout(200);
    await check('Punkt verschieben', async () => { const q = await page.evaluate(() => { const F = PGS.FR(), q = F.pts.find(x => x.i === 2); return { t: q.t, p: q.p }; }); await center(); const b = await box();
      const [x, y] = [PGS_X = await page.evaluate(q => PGS.X(q.t), q), await page.evaluate(q => PGS.Y(q.p), q)]; await stroke([[x, y], [x - 20, y - 10], [x - 45, y - 25], [x - 60, y - 30]]); });
    // umbenennen über die Karte
    await check('Umbenennen', async () => { await page.evaluate(() => { const F = PGS.FR(), q = F.pts.find(x => x.i === 3); F.sel = q.id; F.pw = { c: q.c, k: 3 }; document.querySelector('[data-md="sel"]').click(); }); await page.waitForTimeout(150); await tapEl('[data-fren="2"]'); });
    // Unterteilung beginnen: Welle 1 auswählen, Zählweise antippen
    await check('Unterteilung beginnen', async () => { await page.evaluate(() => { const F = PGS.FR(), q = F.pts.find(x => x.i === 1); F.sel = q.id; F.pw = { c: q.c, k: 1 }; document.querySelector('[data-md="sel"]').click(); }); await page.waitForTimeout(150); await tapEl('[data-fz="ABC"]'); });
    await page.evaluate(([a]) => { const F = PGS.FR(), I = PGS.img, st = F.pts.find(x => x.i === 0 && x.z === 'ABC'); const s = F.pts.filter(x => x.c === st.c); const t1 = F.pts.find(x => x.z === 'N' && x.i === 1).t, t0 = st.t;
      PGS.fadd('ABC', 1, t0 + (t1 - t0) * .4, st.p + 3); PGS.fadd('ABC', 2, t0 + (t1 - t0) * .7, st.p + 1); }, [piv[0]]); await page.waitForTimeout(100);
    // Wellengröße ändern (Leiste am Label bzw. Funktion)
    // Auswahl vorher (gehört nicht zur Aktion): Punkt wählen, laufende Zählung beenden
    const pick = (z, i) => page.evaluate(([z, i]) => { const F = PGS.FR(), q = F.pts.find(x => x.z === z && x.i === i); F.ac = null; F.i = 0; F.sel = q.id; F.pw = { c: q.c, k: Math.max(1, i) }; document.querySelector('[data-md="sel"]').click(); }, [z, i]);
    await pick('ABC', 1); await page.waitForTimeout(150);
    await check('Wellengröße ändern', async () => { const b = await page.evaluate(() => !!document.querySelector('[data-sb="big"]:not([disabled])')); if (b) await tapEl('[data-sb="big"]'); else fail('Knopf „Größer“ nicht da'); });
    // „Rückgängig“ im Hinweis nach dem Löschen, dann Zählung löschen (Mülleimer) mit Rückgängig/Wiederherstellen
    { await pick('N', 1); await page.waitForTimeout(150); const a = await sig(); await tapEl('#ftrash');
      const und = await page.evaluate(() => { const b = document.querySelector('#fundel'); if (b) b.click(); return !!b; }); await page.waitForTimeout(150); ok(und && await sig() === a, '„Rückgängig“ im Hinweis nach dem Löschen stellt die Zählung nicht her'); }
    await pick('N', 1); await page.waitForTimeout(150);
    await check('Zählung löschen', async () => { await tapEl('#ftrash'); });
    // Neu setzen
    await check('Neu setzen', async () => { await tapEl('#frst'); });

    // ---- 3) Tasten (PC) ----
    if (!touch) { await page.evaluate(() => { PGS.FR().ac = null; }); const a = await sig(); await page.evaluate(() => { const F = PGS.FR(); PGS.fadd('N', 0, 50, 300, 'neu'); }); const b2 = await sig();
      await page.mouse.click(5, 5); // Fokus auf die Seite, nicht in ein Feld
      await page.keyboard.press('Control+z'); ok(await sig() === a, 'Strg+Z wirkt nicht'); await page.keyboard.press('Control+y'); ok(await sig() === b2, 'Strg+Y wirkt nicht');
      await page.keyboard.press('Control+z'); await page.keyboard.press('Control+Shift+z'); ok(await sig() === b2, 'Strg+Umschalt+Z wirkt nicht');
      await page.keyboard.press('Meta+z'); ok(await sig() === a, 'Cmd+Z wirkt nicht'); await page.keyboard.press('Meta+Shift+z'); ok(await sig() === b2, 'Cmd+Umschalt+Z wirkt nicht'); }

    // ---- 4) mindestens 50 Schritte ----
    { await page.evaluate(() => { PGS.FR().ac = null; }); const a = await sig(); await page.evaluate(() => { const F = PGS.FR(); for (let k = 0; k < 60; k++) { F.ac = null; PGS.fadd('ABC', 0, 20 + k * 3, 200 + k, 'neu'); } }); const u = (await his()).u;
      await page.evaluate(() => { for (let k = 0; k < 60; k++)PGS.undo(); }); ok(u >= 60 && await sig() === a, '60 Schritte lassen sich nicht alle rückgängig machen (Schritte ' + u + ')'); }

    // ---- 5) neues Bild: Schritte leer ----
    await load(); const h5 = await his(), b5 = await btns(); ok(h5.u === 0 && h5.r === 0 && !b5.u && !b5.r, 'neues Bild: Schritte nicht leer ' + JSON.stringify(h5));
    ok(!errs.length, 'Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    console.log(name + ': fertig (' + moves.map(m => m[0]).join(', ') + ')'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log((bad ? bad + ' Fehler bei ' + n + ' Prüfungen' : 'Alles in Ordnung (' + n + ' Prüfungen)') + ', ' + Math.round((Date.now() - T0) / 1000) + ' s'); process.exit(bad ? 1 : 0);
})();
