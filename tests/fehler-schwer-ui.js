// Oberflächen-Test für „Fehler finden“ Schwer (seit 14.11.2026, Lenny). Echte Tipps (Finger am Handy und iPad, Maus am PC).
// Aufruf im Repo-Ordner: node tests/fehler-schwer-ui.js [Runden je Gerät]   (Playwright nötig; anderer Browser: PWCH=chrome bzw. PWCH=msedge)
// Prüft: Auswahl Schwer im Menü, Welle wählen, Textfeld (am Handy/iPad wird der Chart beim Tippen kompakter und bleibt mit dem Feld sichtbar),
// Auswerten per Knopf und Enter, die drei Ausgänge (erkannt +10, nicht erkannt mit „Das meinte ich“ +5 / „Lag daneben“ 0, falsche Welle),
// Speichern nicht erkannter Antworten und die versteckte Übersicht #fehlertexte.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8794, N = +process.argv[2] || 4;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
// richtige Antwort je Regel (Impuls), unabhängig von der Richtung des Charts
const OK = { 'IMP-1': 'Welle 2 korrigiert mehr als 100 % von Welle 1', 'IMP-2': 'Welle 3 ist die kürzeste', 'IMP-3': 'Welle 4 überlappt Welle 1', 'W4-3': 'Welle 2 und Welle 4 sind gleich',
  'DRE-1': 'Hier steht ein Dreieck', 's:IMP-1': 'Die (2) retraced mehr als 100 % der (1)', 's:IMP-2': 'Die (3) ist die kürzeste', 's:IMP-3': 'Die (4) überlappt die (1)', 's:IMP-4': 'Die Welle ist nur dreiteilig' };
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = []; let checks = 0;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); }); await page.reload();
    const tap = async sel => { await page.waitForTimeout(470); const b = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
      if (!b) { fail('Element fehlt: ' + sel); return false; } if (touch) await page.touchscreen.tap(b[0], b[1]); else await page.mouse.click(b[0], b[1]); await page.waitForTimeout(touch ? 380 : 120); return true; };
    const pts = () => page.evaluate(() => st.pts), fbText = () => page.evaluate(() => (document.querySelector('#fb:not([hidden])') || {}).textContent || '');
    // Menü: Schwer wählen und merken
    await page.evaluate(() => pick('find')); await tap('[data-fl="schwer"]');
    if (await page.evaluate(() => localStorage.getItem('waveChecker.findLvl')) !== 'schwer') fail('Schwer wird im Menü nicht gemerkt'); checks++;
    const seen = { ok: 0, meinte: 0, daneben: 0, welle: 0, enter: 0 };
    for (let r = 0; r < N * 4; r++) {
      const kind = ['ok', 'meinte', 'daneben', 'welle'][r % 4];
      await page.evaluate(() => pick('find')); await tap('button[onclick*="go(\'find\',\'imp\')"]'); await page.waitForSelector('#svg');
      const S = await page.evaluate(() => FFS); if (!S.hard) { fail('Runde läuft nicht im Schwer-Modus'); break; }
      if (await page.$('#fft')) fail('Textfeld erscheint schon vor der Wahl der Welle');
      const wave = kind === 'welle' ? ['1', '2', '3', '4', '5'].find(w => w !== S.wv && !(S.alt || []).includes(w)) : S.wv;
      await tap('[data-w="' + wave + '"]');
      if (!(await page.$('#fft'))) { fail('kein Textfeld nach der Wahl der Welle'); continue; }
      if (!(await page.evaluate(() => document.querySelector('#go').disabled))) fail('Auswerten ist ohne Text schon frei');
      await tap('#fft');
      if (touch) { // kompakter Chart, Feld und Chart im Bild, Leiste unten weg, Knopf unter dem Feld da
        await page.waitForTimeout(450);
        const L = await page.evaluate(() => { const v = document.querySelector('#view'), c = document.querySelector('#view .chart').getBoundingClientRect(), t = document.querySelector('#fft').getBoundingClientRect(), g = document.querySelector('#fftgo').getBoundingClientRect(), vh = visualViewport.height;
          return { typing: v.classList.contains('fft-typing'), ch: c.height, ctop: c.top, tbot: t.bottom, gbot: g.bottom, gh: g.height, vh, dock: getComputedStyle(document.querySelector('#view .dock')).display }; });
        checks++;
        if (!L.typing) fail('Chart wird beim Tippen nicht kompakter');
        else { if (L.ch > L.vh * .4) fail('Chart beim Tippen zu hoch (' + Math.round(L.ch) + ' px bei ' + Math.round(L.vh) + ' px)'); if (L.ctop < -2 || L.ctop > 40) fail('Chart beim Tippen nicht oben im Bild (top ' + Math.round(L.ctop) + ')');
          // Tastatur belegt die halbe Höhe: der Chart schrumpft mit der sichtbaren Höhe, der Rest (Knöpfe, Feld) bleibt gleich hoch
          const kb = L.vh * .5, need = Math.max(0, L.ctop) + L.ch * .5 + (L.gbot - L.ctop - L.ch);
          if (need > kb) fail('Mit Tastatur passen Chart, Feld und Knopf nicht ins Bild (' + Math.round(need) + ' px nötig, ' + Math.round(kb) + ' px frei)'); if (L.dock !== 'none') fail('Leiste unten bleibt beim Tippen'); if (!L.gh) fail('kein Knopf unter dem Feld'); }
      }
      const txt = kind === 'ok' || kind === 'welle' ? (OK[S.id] || 'unbekannt') : 'Irgendwas mit Fibonacci stimmt nicht';
      await page.keyboard.type(txt, { delay: 5 });
      if (await page.evaluate(() => document.querySelector('#go').disabled)) fail('Auswerten bleibt nach dem Tippen gesperrt');
      const p0 = await pts();
      if (r % 3 === 0) { await page.keyboard.press('Enter'); seen.enter++; } else await tap(touch ? '#fftgo' : '#go');
      await page.waitForTimeout(300); const fb = await fbText(); checks++;
      if (!fb) { fail('keine Rückmeldung nach dem Auswerten (' + kind + ')'); continue; }
      if (touch && await page.evaluate(() => document.querySelector('#view').classList.contains('fft-typing'))) fail('Chart bleibt nach dem Auswerten kompakt');
      if (kind === 'ok') { if (!/Richtig erkannt! \+10 Punkte/.test(fb) || (await pts()) !== p0 + 10) fail('erkannte Antwort „' + txt + '“ (' + S.id + '): ' + fb.slice(0, 90)); else seen.ok++; }
      if (kind === 'welle') { if (!/Die Regel stimmt, die Welle nicht\.|Leider daneben\./.test(fb) || (await pts()) !== p0) fail('falsche Welle: ' + fb.slice(0, 90)); else seen.welle++; }
      if (kind === 'meinte' || kind === 'daneben') {
        if (!/Das konnte ich nicht sicher zuordnen\./.test(fb) || !(await page.$('#ffy')) || !(await page.$('#ffn'))) { fail('nicht erkannte Antwort ohne Rückfrage: ' + fb.slice(0, 90)); continue; }
        if (/IMP-|DRE-|W4-|s:/.test(fb)) fail('Regel-Kürzel in der Oberfläche: ' + fb.slice(0, 120));
        await tap(kind === 'meinte' ? '#ffy' : '#ffn'); const p1 = await pts(), log = await page.evaluate(() => JSON.parse(localStorage.getItem('waveChecker.fehlerTexte') || '[]'));
        const last = log[log.length - 1] || {};
        if (p1 !== p0 + (kind === 'meinte' ? 5 : 0)) fail(kind + ': Punkte ' + p0 + ' → ' + p1);
        else if (last.t !== txt || last.e !== kind || last.id !== S.id) fail('nicht erkannte Antwort falsch gespeichert: ' + JSON.stringify(last));
        else seen[kind]++;
        if (!(await page.$('#view .dock #nxt'))) fail('kein „Nächster Chart“ nach der Entscheidung');
      }
    }
    // versteckte Übersicht
    await page.evaluate(() => { location.hash = '#fehlertexte'; }); await page.waitForTimeout(200);
    const ov = await page.evaluate(() => ({ h: (document.querySelector('#view h2') || {}).textContent, n: document.querySelectorAll('.ffitem').length, t: document.querySelector('#view').textContent }));
    if (ov.h !== 'Nicht erkannte Antworten' || ov.n < seen.meinte + seen.daneben) fail('Übersicht #fehlertexte: ' + JSON.stringify({ h: ov.h, n: ov.n }));
    if (/IMP-|DRE-|W4-|s:IMP/.test(ov.t)) fail('Regel-Kürzel in der Übersicht'); checks++;
    await page.evaluate(() => { location.hash = ''; home(); });
    if (!touch) { await page.keyboard.press('Shift+Alt+KeyF'); await page.waitForTimeout(150); if ((await page.evaluate(() => (document.querySelector('#view h2') || {}).textContent)) !== 'Nicht erkannte Antworten') fail('Umschalt+Alt+F öffnet die Übersicht nicht'); checks++; }
    if (errs.length) fail('Fehler im Browser: ' + [...new Set(errs)].join(' | '));
    for (const k of Object.keys(seen)) if (!seen[k]) fail('Fall „' + k + '“ nie geprüft');
    console.log(name + ': ' + checks + ' Prüfungen, ' + JSON.stringify(seen));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
