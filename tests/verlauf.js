// Test „Eigenen Chart prüfen“: erkannter Kursverlauf auf festen Testbildern (seit 23.11.2026, Lenny). Handy (iPhone), iPad (Touch), PC (Maus).
// Aufruf im Repo-Ordner: node tests/verlauf.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Bilder und Erwartungen: tests/faelle/faelle.json.
// Prüft je Bild nach echtem Hochladen (ganzes Bild): kein Verlauf in der Legende oben bzw. der Zeitachse unten, keine senkrechten Ausschläge
// (Hoch einer Spalte mehr als 18 % der Bildhöhe über dem Median der Nachbarspalten), genug Verlauf (Anteil der 6 Spalten breiten Abschnitte), keine Fehler in der Konsole.
// Seit 23.11.2026 mit Kursfarbe (kurs): Der Verlauf folgt dem Kurs (oberstes und unterstes Kurspixel je Spalte, bis 3 px) und liegt nicht auf
// Zeichnungen oder Kästchen (mehr als 8 px über bzw. unter dem Kurs der Nachbarspalten); verboten: Rechtecke ohne Verlauf (Preisachse, Kästchen).
// Seit 25.11.2026: vorschlag = Zuschnitt-Vorschlag (ocSuggest) muss das Rechteck innen enthalten und darf höchstens bis rechts/unten bzw. erst ab oben
// reichen; hinweis = ob „Viele Zeichnungen im Bild, die Erkennung ist unsicher“ erscheint.
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
      if (c.vorschlag) { const v = c.vorschlag, sg = await page.evaluate(async d => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = '/tests/faelle/' + d; }); return ocSuggest(im); }, c.datei);
        if (!sg) fail(c.datei + ': kein Zuschnitt-Vorschlag'); else { const r = [sg.x, sg.y, sg.x + sg.w, sg.y + sg.h].map(Math.round); console.log('   Vorschlag ' + r);
          if (v.innen && !(r[0] <= v.innen[0] && r[1] <= v.innen[1] && r[2] >= v.innen[2] && r[3] >= v.innen[3])) fail(c.datei + ': Vorschlag schneidet Kurs ab (' + r + ' statt mind. ' + v.innen + ')');
          if ((v.rechts && r[2] > v.rechts) || (v.unten && r[3] > v.unten) || (v.oben && r[1] < v.oben) || (v.links && r[0] < v.links)) fail(c.datei + ': Vorschlag enthält Achse, Legende oder Leiste (' + r + ')'); } }
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' }); await page.setInputFiles('#ocfile', path.join(__dirname, 'faelle', c.datei));
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); /* ganzes Bild statt Zuschnitt-Vorschlag (seit 25.11.2026) */ await page.waitForSelector('#svg.pgsvg');
      const r = await page.evaluate(c => { const I = PGS.img, hi = Array.from(I.path.hi), lo = Array.from(I.path.lo), h = I.h, f = I.crop.f, [a, b] = c.bereich.map(v => Math.round(v * f));
        let cov = 0, top = 0, bot = 0, sp = []; for (let x = a; x <= b; x++) { if (hi[x] < 0) continue; cov++; if (hi[x] < c.oben * f) top++; if (lo[x] > c.unten * f) bot++;
          const nb = hi.slice(Math.max(0, x - 8), x + 9).filter(v => v >= 0).sort((p, q) => p - q), m = nb[nb.length >> 1]; if (m - hi[x] > .18 * h) sp.push(x); }
        let wn = 0, wc = 0; for (let x = a; x + 5 <= b; x += 6) { wn++; if (hi.slice(x, x + 6).some(v => v >= 0)) wc++; } // Abdeckung je 6 Spalten (dünne Kerzen haben Lücken)
        // Kurs nach Farbe: je Spalte oberstes und unterstes Pixel in Kursfarbe (Originalbild, ganzes Bild hochgeladen: f = 1 bzw. verkleinert)
        let nah = null, weg = [], verb = 0; if (c.kurs) { const Dd = I.data, K = c.kurs, isK = j => { const r = Dd[j * 4], g = Dd[j * 4 + 1], b = Dd[j * 4 + 2];
            return K.hell ? Math.min(r, g, b) >= K.hell : K.farben.some(q => Math.max(Math.abs(r - q[0]), Math.abs(g - q[1]), Math.abs(b - q[2])) <= K.tol); };
          // Seit 25.11.2026 zählt auch ein einzelnes Pixel als Kurs (Balken ohne Bewegung, Hoch = Tief), wenn keine 3 Kurspixel derselben Zeile innerhalb ±12 Spalten liegen (gepunktete Linie)
          const dot = (x, y) => { let k = 0; for (let q = x - 12; q <= x + 12; q++) if (q !== x && q >= 0 && q < I.w && isK(y * I.w + q) && !isK((y - 1) * I.w + q) && !isK((y + 1) * I.w + q)) k++; return k < 2; };
          const rt = new Array(I.w).fill(-1), rb = new Array(I.w).fill(-1); for (let x = a; x <= b; x++) for (let y = Math.ceil(c.oben * f); y < Math.min(h, c.unten * f); y++) if (isK(y * I.w + x) && (isK((y - 1) * I.w + x) || isK((y + 1) * I.w + x) || dot(x, y))) { if (rt[x] < 0) rt[x] = y; rb[x] = y; } // Teil eines senkrechten Strichs oder einzelner Balken (keine Punkte einer gepunkteten Linie)
          let n1 = 0, n2 = 0; for (let x = a; x <= b; x++) { if (hi[x] < 0) continue; if (rt[x] >= 0) { n1++; if (Math.abs(hi[x] - rt[x]) <= 3 && Math.abs(lo[x] - rb[x]) <= 3) n2++; }
            const nt = rt.slice(Math.max(0, x - 4), x + 5).filter(v => v >= 0), nb = rb.slice(Math.max(0, x - 4), x + 5).filter(v => v >= 0);
            if (!nt.length || hi[x] < Math.min(...nt) - 8 || lo[x] > Math.max(...nb) + 8) weg.push(x); }
          nah = n2 / Math.max(1, n1); }
        (c.verboten || []).forEach(([x0, y0, x1, y1]) => { for (let x = Math.round(x0 * f); x <= Math.min(I.w - 1, Math.round(x1 * f)); x++) if (hi[x] >= 0 && lo[x] >= y0 * f && hi[x] <= y1 * f) verb++; });
        return { cov: wc / Math.max(1, wn), top, bot, sp, nah, weg, verb, hinweis: !!document.querySelector('.ocq') }; }, c);
      if (c.hinweis !== undefined && r.hinweis !== c.hinweis) fail(c.datei + ': Hinweis „Erkennung unsicher“ ' + (c.hinweis ? 'fehlt' : 'erscheint ohne Grund'));
      console.log(name + ': ' + c.datei + ' Abdeckung ' + (100 * r.cov).toFixed(0) + ' %, in der Legende ' + r.top + ', in der Zeitachse ' + r.bot + ', Ausschläge ' + r.sp.length);
      if (r.cov < c.abdeckung) fail(c.datei + ': zu wenig Verlauf erkannt'); if (r.top || r.bot) fail(c.datei + ': Verlauf in Legende bzw. Zeitachse'); if (r.sp.length > (c.ausschlaege || 0)) fail(c.datei + ': senkrechte Ausschläge in Spalte ' + r.sp.slice(0, 5));
      if (r.nah !== null) { console.log('   am Kurs ' + (100 * r.nah).toFixed(1) + ' %, abseits (Zeichnung, Kästchen) ' + r.weg.length + ' Spalten'); if (r.nah < c.nah) fail(c.datei + ': Verlauf folgt dem Kurs zu selten'); if (r.weg.length > (c.bereich[1] - c.bereich[0]) * .005) fail(c.datei + ': Verlauf abseits des Kurses in Spalte ' + r.weg.slice(0, 8)); }
      if (r.verb) fail(c.datei + ': Verlauf in einem verbotenen Bereich (' + r.verb + ' Spalten)');
    }
    if (errs.length) fail('Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
