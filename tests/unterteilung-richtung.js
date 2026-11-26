// Test „Eigenen Chart prüfen“: Richtung und Herkunft von Befunden zur Unterteilung (seit 26.11.2026, Lenny, nach Discord-Screenshot).
// Aufruf im Repo-Ordner: node tests/unterteilung-richtung.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy (iPhone), iPad (Touch), PC (Maus).
// Bild: tests/faelle/coreweave-original.png. Zählung wie im Screenshot: große W-X-Y, W als (a)(b)(c), X als (w)(x)(y), Y als (w)(x)(y);
// dazu zwei angefangene Unterteilungen, die nur aus dem Start bestehen (Welle antippen + Zählweise, dann nichts weiter): in (b) und in Y.
// Prüft:
//  1) Keine Meldung „beginnt in die falsche Richtung“ (die erste Teilwelle läuft jeweils in Richtung ihrer Welle), keine harte Regel aus
//     angefangenen Unterteilungen; Warnsignale aus automatisch gefundenen Teilwellen stehen nur unter „Hinweise“ mit „Automatisch erkannt“.
//  2) Gegenprobe: Unterteilung von X, deren erste Teilwelle nach unten läuft (X steigt): harte Regel mit dem richtigen Text („läuft gegen die
//     Welle … dieselbe Richtung“), die Welle X ist rot hinterlegt (.pgeb), alle Punkte der Unterteilung sind als Fehler markiert.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8811;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
// Wendepunkte (Bildspalte im Original 1921 × 1276, Hoch h bzw. Tief l), aus dem Screenshot übertragen
const BIG = [[447, 'h'], [811, 'l'], [1091, 'h'], [1510, 'l']], SW = [[522, 'l'], [674, 'h'], [811, 'l']], SX = [[891, 'h'], [1015, 'l'], [1091, 'h']], SY = [[1261, 'l'], [1293, 'h'], [1510, 'l']];
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    for (const fall of ['screenshot', 'gegenprobe']) {
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', path.join(__dirname, 'faelle', 'coreweave-original.png'));
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg');
      // Punkt am Hoch bzw. Tief des erkannten Verlaufs (±12 Spalten um die Vorgabe)
      const res = await page.evaluate(([BIG, SW, SX, SY, fall]) => {
        const I = PGS.img, P = I.path, FR = PGS.FR(), at = (x0, hl) => { let b = null; for (let x = x0 - 12; x <= x0 + 12; x++) { const v = hl === 'h' ? P.hi[x] : P.lo[x]; if (v < 0) continue; if (!b || (hl === 'h' ? v < b.v : v > b.v)) b = { x, v }; } return { t: b.x, p: I.h - b.v - .5 }; };
        const add = (z, i, q, c) => PGS.fadd(z, i, q.t, q.p, c);
        const sub = (c, k, z) => { FR.pw = { c, k }; document.querySelector('[data-fz="' + z + '"]').click(); return FR.ac; }; // Welle antippen + Zählweise (echter Knopf)
        const big = add('WXY', 0, at(...BIG[0]), 'neu'); BIG.slice(1).forEach((q, k) => add('WXY', k + 1, at(...q)));
        const w = sub(big, 1, 'ABC'); SW.forEach((q, k) => add('ABC', k + 1, at(...q)));
        sub(w, 2, 'ABC'); FR.ac = null; // angefangene Unterteilung von (b): nur der Start
        sub(big, 2, 'WXY');
        if (fall === 'gegenprobe') { const a = at(...SX[0]), wt = at(...BIG[1]); add('WXY', 1, { t: a.t, p: wt.p - 40 }); add('WXY', 2, { t: at(...SX[1]).t, p: wt.p + 60 }); add('WXY', 3, at(...SX[2])); }
        else SX.forEach((q, k) => add('WXY', k + 1, at(...q)));
        sub(big, 3, 'WXY'); FR.ac = null; // angefangene Unterteilung von Y: nur der Start
        sub(big, 3, 'WXY'); SY.forEach((q, k) => add('WXY', k + 1, at(...q)));
        document.querySelector('#fchk').click();
        const fb = document.querySelector('#fb'), rn = [...fb.querySelectorAll('.rnote')];
        return { counts: Object.keys(PGS.levels()).length, html: fb.textContent, regel: rn.filter(e => e.querySelector('.s-regel')).map(e => e.textContent), sub: rn.filter(e => e.classList.contains('ocsubn')).map(e => e.textContent),
          hinweisAb: fb.innerHTML.indexOf('Hinweise'), subPos: rn.filter(e => e.classList.contains('ocsubn')).map(e => fb.innerHTML.indexOf(e.outerHTML)),
          eb: document.querySelectorAll('#svg .pgeb').length, errPts: Object.keys(FR.err).length, state: PGS.res.state };
      }, [BIG, SW, SX, SY, fall]);
      await page.waitForTimeout(150);
      const d = name + ' ' + fall;
      ok(res.counts === 6, d + ': ' + res.counts + ' Zählungen statt 6');
      if (fall === 'screenshot') {
        ok(!/falsche Richtung/.test(res.html), d + ': Meldung „falsche Richtung“ trotz richtiger Richtung: ' + res.regel.join(' | '));
        ok(!res.regel.some(t => /Unterteilung/.test(t)), d + ': harte Regel zu einer Unterteilung: ' + res.regel.join(' | '));
        ok(!res.regel.some(t => /automatisch/i.test(t)), d + ': automatisch erkannte Teilwellen als harte Regel');
        ok(res.sub.every(t => /Automatisch erkannt/.test(t)), d + ': Warnsignal zur Unterteilung ohne „Automatisch erkannt“');
        ok(res.subPos.every(p => p > res.hinweisAb), d + ': Warnsignal zur Unterteilung nicht unter „Hinweise“');
        ok(res.eb === 0, d + ': rote Hinterlegung ohne Befund');
        console.log(d + ': Zustand ' + res.state + ', harte Regeln ' + res.regel.length + ', Warnsignale zur Unterteilung ' + res.sub.length);
      } else {
        ok(res.regel.some(t => /Die Unterteilung von Welle X beginnt in die falsche Richtung: Die erste Teilwelle läuft gegen die Welle\. Sie muss in dieselbe Richtung laufen wie die Welle selbst\./.test(t)), d + ': Meldung zur falschen Richtung fehlt: ' + res.regel.join(' | '));
        ok(!/läuft wie die Welle selbst/.test(res.html), d + ': alter, falscher Text');
        ok(res.eb >= 1, d + ': Welle X nicht rot hinterlegt');
        ok(res.errPts >= 4, d + ': Punkte der Unterteilung nicht markiert (' + res.errPts + ')');
        console.log(d + ': Zustand ' + res.state + ', Meldung erkannt, Hinterlegung ' + res.eb + ', markierte Punkte ' + res.errPts);
      }
    }
    ok(!errs.length, name + ': Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung (' + n + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
