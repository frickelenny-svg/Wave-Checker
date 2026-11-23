// Test der Hinweise auf neue Ränge (23.11.2026, Lenny). Echte Tipps: Finger am Handy und iPad, Maus am PC.
// Aufruf im Repo-Ordner: node tests/rangaufstieg.js [Runden]   (Playwright nötig; anderer Browser: PWCH=chrome bzw. PWCH=msedge)
// Prüft je Gerät:
//  1) Ohne neue Ränge kein Abzeichen, die Insel bzw. Station öffnet direkt „Meine Ränge“.
//  2) Ein Rangaufstieg (echt über gelöste Übungen): rotes Abzeichen „1“ an der Insel (PC/iPad) bzw. Station (Handy), Kontrast ≥ 4,5:1,
//     ploppt einmal auf, nach Neuladen noch da, aber ohne erneutes Aufploppen.
//  3) Antippen: Aufstiegs-Ansicht (alter → neuer Rang, Satz „Bronze im Impuls! Nächstes Ziel: Silber“), „Alle Ränge ansehen“ → Ränge-Seite
//     mit hervorgehobener Karte, Abzeichen weg, auch nach Neuladen.
//  4) Mehrere Aufstiege (zwei neue Kategorien und eine Verbesserung Bronze → Silber): Abzeichen „3“, Karten nacheinander per Wischen
//     (Handy, PC mit Maus) bzw. „Weiter“ (iPad), Zurück-Wischen, am Ende alle drei hervorgehoben, Abzeichen weg.
//  5) Ab 10 Aufstiegen „9+“. 6) „Bewegung reduzieren“: keine Animationen. 7) Keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8798, N = +process.argv[2] || 1;
const TYPES = { html: 'text/html; charset=utf-8', json: 'application/json; charset=utf-8', md: 'text/markdown; charset=utf-8', js: 'text/javascript' };
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': TYPES[p.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const lum = c => { const v = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(x => +x / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, checks = 0;
  for (const [name, opt] of DEV) for (let run = 0; run < N; run++) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { checks++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.path', JSON.stringify({ learn: 1 })); });
    const reload = async () => { await page.reload(); await page.waitForFunction(() => document.querySelector('.home,.wph')); await page.waitForTimeout(300); };
    await reload();
    const path_ = await page.evaluate(() => isPath()); ok(path_ === (name === 'Handy'), 'falsche Startseite (Pfad: ' + path_ + ')');
    const SEL = path_ ? '.stn.gold' : '.isl[onclick="ranksOpen()"]';
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
    const tapSel = async sel => { const b = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel); if (!b) return fail('nicht gefunden: ' + sel); await page.waitForTimeout(150); await tap(b[0], b[1]); await page.waitForTimeout(350); };
    const home = async () => { await page.evaluate(() => home()); await page.waitForTimeout(300); };
    const bdg = () => page.evaluate(s => { const e = document.querySelector(s); if (!e) return { el: 0 }; const b = e.querySelector('.nbdg'); if (!b) return { el: 1 };
      e.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(), cs = getComputedStyle(b), host = e.getBoundingClientRect();
      return { el: 1, txt: b.textContent, bg: cs.backgroundColor, fg: cs.color, pop: b.classList.contains('pop'), w: r.width, inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
        topRight: r.right > host.right - 14 && r.top < host.top + 4, label: e.getAttribute('aria-label') }; }, SEL);
    const rankUpView = () => page.evaluate(() => { const k = document.querySelector('#rku'); return k ? { t: k.querySelector('.rkt').textContent, h: k.querySelector('h2').textContent, badges: [...k.querySelectorAll('.rkft .badge')].map(b => b.textContent) } : null; });
    const swipe = async (dir) => { // dir -1 = nach links (weiter), +1 = nach rechts (zurück)
      const b = await page.evaluate(() => { const r = document.querySelector('#rku .card').getBoundingClientRect(); return [r.left + r.width / 2, r.top + 40]; });
      const x0 = b[0] - dir * 110, x1 = b[0] + dir * 110;
      if (touch) { const cdp = await ctx.newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: b[1] }] });
        for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 8, y: b[1] }] }); await page.waitForTimeout(16); }
        await page.waitForTimeout(80); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); }
      else { await page.mouse.move(x0, b[1]); await page.mouse.down(); await page.mouse.move(x1, b[1], { steps: 8 }); await page.mouse.up(); }
      await page.waitForTimeout(300); };

    // 1) Ohne neue Ränge
    let B = await bdg(); ok(B.el && B.txt === undefined, 'Abzeichen ohne neuen Rang');
    await tapSel(SEL); ok(await page.evaluate(() => !document.querySelector('#rku') && /Meine Ränge/.test(document.querySelector('#view h2').textContent)), 'ohne neue Ränge nicht direkt die Ränge-Seite');
    // 2) Ein Rangaufstieg über echte gelöste Übungen (10 Impulse = Bronze)
    await page.evaluate(() => { for (let i = 0; i < 10; i++) exSolved('imp', 0); });
    ok(await page.evaluate(() => /Neuer Rang: Bronze in Impulsen/.test(document.querySelector('#toast').textContent)), 'keine Rang-Meldung');
    await home(); B = await bdg();
    ok(B.txt === '1', 'Abzeichen zeigt nicht 1 (' + B.txt + ')'); ok(B.inView && B.w >= 20 && B.topRight, 'Abzeichen nicht sichtbar oben rechts ' + JSON.stringify(B));
    ok(contrast(B.bg, B.fg) >= 4.5, 'Kontrast ' + contrast(B.bg, B.fg).toFixed(2)); ok(/1 neuer Rangaufstieg/.test(B.label || ''), 'aria-label ohne Hinweis: ' + B.label);
    await page.waitForTimeout(400); B = await bdg(); ok(B.pop, 'Abzeichen ploppt nicht auf');
    await reload(); B = await bdg(); await page.waitForTimeout(400); B = await bdg(); ok(B.txt === '1' && !B.pop, 'nach Neuladen falsch (Zahl ' + B.txt + ', Plopp ' + B.pop + ')');
    // 3) Aufstiegs-Ansicht
    await tapSel(SEL); let V = await rankUpView();
    ok(V && V.h === 'Impuls' && V.t === 'Bronze im Impuls! Nächstes Ziel: Silber' && V.badges.join('>') === 'Noch kein Rang>Bronze', 'Aufstiegs-Ansicht falsch: ' + JSON.stringify(V));
    await tapSel('#rkall'); ok(await page.evaluate(() => { const h = [...document.querySelectorAll('.card.rkhl h2')].map(e => e.textContent); return h.length === 1 && /^Impuls/.test(h[0]); }), 'Impuls nicht hervorgehoben');
    await home(); B = await bdg(); ok(B.txt === undefined, 'Abzeichen nach dem Ansehen noch da');
    await reload(); B = await bdg(); ok(B.txt === undefined, 'Abzeichen nach Neuladen wieder da');
    // 4) Mehrere: Zigzag und Flats neu (Bronze), Impuls Bronze → Silber (30 Übungen, Quiz 70 %)
    await page.evaluate(() => { for (let i = 0; i < 10; i++) { exSolved('zig', 0); exSolved('fr', 1); } for (let i = 0; i < 20; i++) exSolved('imp', 0);
      const q = qLoad(); q.cats = q.cats || {}; q.cats.Impuls = { answered: 10, correct: 8, last: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0] }; localStorage.setItem('waveChecker.quiz', JSON.stringify(q)); rankCheck(); });
    await reload(); B = await bdg(); await page.waitForTimeout(400); B = await bdg();
    ok(B.txt === '3' && B.pop, 'Abzeichen bei drei Aufstiegen: ' + JSON.stringify(B));
    await tapSel(SEL); const seen = [];
    V = await rankUpView(); seen.push(V && V.h);
    if (touch && name === 'iPad') await tapSel('#rkn'); else await swipe(-1);
    V = await rankUpView(); seen.push(V && V.h);
    await swipe(1); V = await rankUpView(); ok(V && V.h === seen[0], 'Zurück-Wischen geht nicht (' + (V && V.h) + ')');
    if (touch && name === 'iPad') await tapSel('#rkn'); else await swipe(-1);
    if (touch && name === 'iPad') await tapSel('#rkn'); else await swipe(-1);
    V = await rankUpView(); seen.push(V && V.h);
    ok(seen.join(',') === 'Zigzag,Flats,Impuls', 'Reihenfolge der Karten (wie aufgestiegen): ' + seen.join(','));
    ok(V && V.badges.join('>') === 'Bronze>Silber' && V.t === 'Silber im Impuls! Nächstes Ziel: Gold', 'Verbesserung Impuls: ' + JSON.stringify(V));
    await swipe(-1); ok(await page.evaluate(() => !!document.querySelector('#rkall')), 'Wischen über die letzte Karte hinaus verlässt die Ansicht');
    await tapSel('#rkall'); ok(await page.evaluate(() => [...document.querySelectorAll('.card.rkhl h2')].map(e => e.textContent.split(' ')[0]).join(',') === 'Impuls,Zigzag,Flats'), 'nicht alle drei hervorgehoben');
    await home(); B = await bdg(); ok(B.txt === undefined, 'Abzeichen nach mehreren noch da'); await reload(); B = await bdg(); ok(B.txt === undefined, 'nach Neuladen wieder da');
    // Verbesserung Bronze → Silber als Karte
    await page.evaluate(() => { localStorage.setItem('waveChecker.rankNew', JSON.stringify({ l: [{ c: 'Impuls', f: 1, t: 2 }], pop: 0 })); }); await reload();
    await tapSel(SEL); V = await rankUpView(); ok(V && V.badges.join('>') === 'Bronze>Silber' && V.t === 'Silber im Impuls! Nächstes Ziel: Gold', 'Verbesserung: ' + JSON.stringify(V));
    // 5) 9+
    await page.evaluate(() => localStorage.setItem('waveChecker.rankNew', JSON.stringify({ l: Array.from({ length: 12 }, (_, i) => ({ c: RCATS[i % 7], f: 0, t: 1 })), pop: 0 }))); await reload(); B = await bdg();
    ok(B.txt === '9+', 'ab 10 nicht „9+“: ' + B.txt);
    await page.evaluate(() => localStorage.removeItem('waveChecker.rankNew'));
    if (errs.length) fail('Konsole: ' + errs.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 6) Bewegung reduzieren
  { const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 }, reducedMotion: 'reduce' }), page = await ctx.newPage();
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1');
      localStorage.setItem('waveChecker.rankNew', JSON.stringify({ l: [{ c: 'Impuls', f: 1, t: 2 }], pop: 0 })); }); await page.reload(); await page.waitForTimeout(500);
    const a = await page.evaluate(() => { const b = document.querySelector('.isl .nbdg'); const r = [getComputedStyle(b).animationName]; ranksOpen(); r.push(getComputedStyle(document.querySelector('.rkm')).animationName, getComputedStyle(document.querySelector('.rku .bar i')).animationName); return r; });
    checks++; if (a.some(x => x !== 'none')) { bad++; console.log('  FEHLER reduzierte Bewegung: ' + a.join(',')); }
    await ctx.close(); }
  await browser.close(); server.close();
  console.log((bad ? bad + ' Fehler' : 'Alles in Ordnung') + ' (' + checks + ' Prüfungen, ' + N + ' Runde(n) je Gerät)'); process.exit(bad ? 1 : 0);
})();
