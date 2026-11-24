// Test „Eigenen Chart prüfen“: Steuerung wie in „Wie geht es weiter?“ (seit 24.11.2026, Lenny). Handy, iPad (Touch) und PC (Maus).
// Aufruf im Repo-Ordner: node tests/bild-steuerung.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Bild: tests/faelle/paypal-preiskaestchen.png
// PC: Mausrad ohne Taste streckt/staucht nur die Zeitachse um die Maus (Seite scrollt nicht), Strg + Mausrad zoomt in alle Richtungen,
//     Ziehen verschiebt waagerecht und senkrecht ohne Punkt, Klick (Bewegung unter 5 px) setzt einen Punkt, + und −, Doppelklick (Auswählen)
//     und Knopf „Ansicht zurücksetzen“ stellen die Startansicht her.
// Touch: ein Finger verschiebt (beide Richtungen, Seite scrollt nicht, kein Punkt), Ziehen am Streifen unten streckt/staucht, Tipp setzt einen Punkt,
//     + und −, Knopf zurücksetzen.
// Immer: Bild, Kerzen des Verlaufs und Punkte liegen deckungsgleich (Bildzeile des höchsten sichtbaren Hochs = Docht der Kerze; Punkte an X/Y).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8803;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 900 } }]];

// Zustand: Ansicht, Bildlage, Deckungsprüfung am höchsten Hoch (Bild, Kerze, Punkt)
const ST = () => { const I = PGS.img, v = PGS.view(), im = document.querySelector('#svg image'), PA = I.path; let best = -1;
  const xa = Math.max(0, Math.ceil(PGS.Tof(20))), xb = Math.min(I.w - 1, Math.floor(PGS.Tof(v.W - 20))); // nur sichtbare Spalten (Kerzen werden nur im Bild gezeichnet)
  for (let x = xa; x <= xb; x++) { if (PA.hi[x] < 0) continue; const y = PGS.Y(I.h - PA.hi[x] - .5); if (y < 60 || y > v.H - 30) continue; if (best < 0 || PA.hi[x] < PA.hi[best]) best = x; }
  const ix = +im.getAttribute('x'), iy = +im.getAttribute('y'), iw = +im.getAttribute('width'), ih = +im.getAttribute('height');
  // Bild: Mitte der Spalte best und Zeile hi auf dem Bildschirm
  const bx = ix + (best + .5) * iw / I.w, by = iy + (PA.hi[best] + .5) * ih / I.h, p = I.h - PA.hi[best] - .5;
  const d = [...document.querySelectorAll('#svg .occw')].map(e => e.getAttribute('d')).join(''), m = (d.match(/M-?[\d.]+ -?[\d.]+V-?[\d.]+/g) || []).map(s => s.slice(1).split(/[ V]/).map(Number));
  const wk = m.filter(q => Math.abs(q[0] - bx) <= Math.max(1.5, PGS.ocG() * v.BW / 2 + .6)).map(q => q[1] + .5); // Docht-Oberkante (ohne den halben Pixel Überstand)
  const pts = PGS.FR().pts.map(q => ({ t: q.t, p: q.p })), circ = [...document.querySelectorAll('#svg circle')].map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')]);
  return { BW: v.BW, sc: v.sc, yr: v.yr, span: v.yr[1] - v.yr[0], W: v.W, H: v.H, scrollY: window.scrollY, best, bx, by, X: PGS.X(best), Y: PGS.Y(p), wk: wk.length ? Math.min(...wk) : null, n: pts.length, pts, circ, fit: null };
};

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext({ ...opt, colorScheme: 'dark' }), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); localStorage.setItem('waveChecker.ocFade', '0'); }); await page.reload();
    await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
    await page.setInputFiles('#ocfile', path.join(__dirname, 'faelle', 'paypal-preiskaestchen.png'));
    await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg');
    await page.evaluate(() => { document.querySelector('#pgc').scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(150);
    const cdp = touch ? await ctx.newCDPSession(page) : null;
    const box = async () => page.evaluate(() => { const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left, y: b.top }; });
    const st = () => page.evaluate(ST);
    // deckungsgleich: Bild ↔ X/Y, Kerze ↔ Bild, Punkte ↔ X/Y
    const deck = async (was) => { const s = await st(); ok(Math.abs(s.bx - s.X) < .6 && Math.abs(s.by - s.Y) < .6, was + ': Bild und Achsen verrutscht (' + [s.bx, s.X, s.by, s.Y].map(v => v.toFixed(1)) + ')');
      ok(s.wk !== null && Math.abs(s.wk - s.Y) < .8, was + ': Kerze und Bild verrutscht (' + s.wk + ' / ' + s.Y.toFixed(1) + ')');
      const xy = await page.evaluate(() => PGS.FR().pts.map(q => [PGS.X(q.t), PGS.Y(q.p)]));
      ok(xy.every(([x, y]) => s.circ.some(c => Math.hypot(c[0] - x, c[1] - y) < 1)), was + ': Punkte und Achsen verrutscht'); return s; };
    const drag = async (x1, y1, x2, y2) => { const b = await box(); x1 += b.x; x2 += b.x; y1 += b.y; y2 += b.y;
      if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] }); for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 8, y: y1 + (y2 - y1) * i / 8 }] });
        for (let i = 0; i < 3; i++) { await page.waitForTimeout(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x2, y: y2 }] }); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(450); return; }
      await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(120); };
    const tap = async (x, y) => { const b = await box(); if (touch) await page.touchscreen.tap(b.x + x, b.y + y); else await page.mouse.click(b.x + x, b.y + y); await page.waitForTimeout(450); };
    const s0 = await deck('Start'), cx = s0.W / 2, cy = (s0.H - 26) / 2 + 20;
    if (!touch) {
      // Mausrad ohne Taste: nur Zeitachse, um die Maus, Seite scrollt nicht
      const b = await box(), mx = cx + 120, t0 = await page.evaluate(x => PGS.Tof(x), mx);
      await page.mouse.move(b.x + mx, b.y + cy); await page.mouse.wheel(0, -300); await page.waitForTimeout(150); let s = await deck('Mausrad hoch');
      ok(s.BW > s0.BW * 1.2 && Math.abs(s.span - s0.span) < 1e-6, 'Mausrad hoch streckt nicht nur waagerecht (' + [s0.BW, s.BW, s0.span, s.span] + ')');
      ok(Math.abs(await page.evaluate(x => PGS.Tof(x), mx) - t0) < .6, 'Mausrad: Mittelpunkt ist nicht die Mausposition'); ok(s.scrollY === s0.scrollY, 'Mausrad scrollt die Seite');
      const s1 = s; await page.mouse.wheel(0, 500); await page.waitForTimeout(150); s = await deck('Mausrad runter'); ok(s.BW < s1.BW * .8 && Math.abs(s.span - s0.span) < 1e-6, 'Mausrad runter staucht nicht');
      // Strg + Mausrad: alle Richtungen
      await page.keyboard.down('Control'); await page.mouse.wheel(0, -200); await page.keyboard.up('Control'); await page.waitForTimeout(150); const s2 = await deck('Strg + Mausrad');
      ok(s2.BW > s.BW * 1.1 && s2.span < s.span * .92, 'Strg + Mausrad zoomt nicht in alle Richtungen'); ok(s2.scrollY === s0.scrollY, 'Strg + Mausrad scrollt die Seite');
    }
    // + und −
    let a = await st(); await page.click('[data-zm="+"]'); await page.waitForTimeout(500); let s = await deck('+'); ok(s.BW > a.BW * 1.3 && s.span < a.span * .8, '+ zoomt nicht in alle Richtungen');
    a = s; await page.click('[data-zm="-"]'); await page.waitForTimeout(500); s = await deck('−'); ok(s.BW < a.BW * .8 && s.span > a.span * 1.3, '− zoomt nicht heraus');
    await page.click('[data-zm="+"]'); await page.waitForTimeout(500);
    // Ziehen verschiebt in beide Richtungen, ohne Punkt; Seite scrollt nicht
    a = await st(); await drag(cx, cy, cx - 90, cy + 60); s = await deck('Ziehen');
    ok(Math.abs(s.sc - a.sc - 90) < 3, 'Ziehen verschiebt nicht waagerecht (' + (s.sc - a.sc).toFixed(1) + ')'); ok(Math.abs(s.yr[0] - a.yr[0]) > 1, 'Ziehen verschiebt nicht senkrecht');
    ok(s.n === a.n, 'nach dem Verschieben wurde ein Punkt gesetzt'); ok(Math.abs(s.scrollY - a.scrollY) < 2, 'Ziehen scrollt die Seite');
    // kleine Bewegung = Klick bzw. Tipp setzt einen Punkt
    a = s; if (touch) await tap(cx, cy); else { const b = await box(); await page.mouse.move(b.x + cx, b.y + cy); await page.mouse.down(); await page.mouse.move(b.x + cx + 3, b.y + cy + 1); await page.mouse.up(); await page.waitForTimeout(450); }
    s = await deck('Klick'); ok(s.n === a.n + 1, (touch ? 'Tipp' : 'Klick mit 3 px Bewegung') + ' setzt keinen Punkt');
    // Zeitachsen-Streifen unten: strecken/stauchen, Preisachse bleibt, kein Punkt
    a = s; await drag(cx, s.H - 13, cx + 80, s.H - 13); s = await deck('Zeitachse ziehen');
    ok(s.BW > a.BW * 1.2 && Math.abs(s.span - a.span) < 1e-6 && s.n === a.n, 'Ziehen an der Zeitachse streckt nicht (nur waagerecht, ohne Punkt): ' + [a.BW, s.BW, a.span, s.span, a.n, s.n]);
    a = s; await drag(cx, s.H - 13, cx - 80, s.H - 13); s = await deck('Zeitachse stauchen'); ok(s.BW < a.BW * .8, 'Ziehen an der Zeitachse nach links staucht nicht');
    // Zurücksetzen: Knopf, am PC auch Doppelklick im Werkzeug Auswählen
    await page.click('[data-zr]'); await page.waitForTimeout(300); s = await deck('Zurücksetzen'); ok(Math.abs(s.BW - s0.BW) < 1e-6 && Math.abs(s.sc - s0.sc) < 1e-6 && Math.abs(s.span - s0.span) < 1e-6, 'Knopf „Ansicht zurücksetzen“ stellt die Startansicht nicht her');
    if (!touch) { await page.click('[data-md="sel"]'); await page.waitForTimeout(150); await page.click('[data-zm="+"]'); await page.waitForTimeout(300); const b = await box();
      await page.mouse.dblclick(b.x + 40, b.y + s.H - 60); await page.waitForTimeout(300); s = await deck('Doppelklick'); ok(Math.abs(s.BW - s0.BW) < 1e-6 && Math.abs(s.span - s0.span) < 1e-6, 'Doppelklick stellt die Startansicht nicht her'); }
    ok(!errs.length, 'Konsole: ' + errs.slice(0, 3).join(' | '));
    console.log(name + ': fertig'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler bei ' + n + ' Prüfungen' : 'Alles in Ordnung (' + n + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
