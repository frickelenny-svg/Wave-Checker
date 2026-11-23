// Test „Eigenen Chart prüfen“: erkannter Kursverlauf auf festen Testbildern (seit 23.11.2026, Lenny). Handy (iPhone), iPad (Touch), PC (Maus).
// Aufruf im Repo-Ordner: node tests/verlauf.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Bilder und Erwartungen: tests/faelle/faelle.json.
// Prüft je Bild nach echtem Hochladen (ganzes Bild): kein Verlauf in der Legende oben bzw. der Zeitachse unten, keine senkrechten Ausschläge
// (Hoch einer Spalte mehr als 18 % der Bildhöhe über dem Median der Nachbarspalten), genug Verlauf (Anteil der 6 Spalten breiten Abschnitte), keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8792, F = JSON.parse(fs.readFileSync(path.join(__dirname, 'faelle', 'faelle.json'), 'utf8')).faelle;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    for (const c of F) {
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' }); await page.setInputFiles('#ocfile', path.join(__dirname, 'faelle', c.datei));
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg');
      const r = await page.evaluate(c => { const I = PGS.img, hi = Array.from(I.path.hi), lo = Array.from(I.path.lo), h = I.h, f = I.crop.f, [a, b] = c.bereich.map(v => Math.round(v * f));
        let cov = 0, top = 0, bot = 0, sp = []; for (let x = a; x <= b; x++) { if (hi[x] < 0) continue; cov++; if (hi[x] < c.oben * f) top++; if (lo[x] > c.unten * f) bot++;
          const nb = hi.slice(Math.max(0, x - 8), x + 9).filter(v => v >= 0).sort((p, q) => p - q), m = nb[nb.length >> 1]; if (m - hi[x] > .18 * h) sp.push(x); }
        let wn = 0, wc = 0; for (let x = a; x + 5 <= b; x += 6) { wn++; if (hi.slice(x, x + 6).some(v => v >= 0)) wc++; } // Abdeckung je 6 Spalten (dünne Kerzen haben Lücken)
        return { cov: wc / Math.max(1, wn), top, bot, sp }; }, c);
      console.log(name + ': ' + c.datei + ' Abdeckung ' + (100 * r.cov).toFixed(0) + ' %, in der Legende ' + r.top + ', in der Zeitachse ' + r.bot + ', Ausschläge ' + r.sp.length);
      if (r.cov < c.abdeckung) fail(c.datei + ': zu wenig Verlauf erkannt'); if (r.top || r.bot) fail(c.datei + ': Verlauf in Legende bzw. Zeitachse'); if (r.sp.length) fail(c.datei + ': senkrechte Ausschläge in Spalte ' + r.sp.slice(0, 5));
    }
    if (errs.length) fail('Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
