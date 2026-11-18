// Test der Kurz-Tutorials „So geht's“ (18.11.2026, Lenny). Echte Tipps: Finger am Handy und iPad, Maus am PC.
// Aufruf im Repo-Ordner: node tests/tutorial.js [Durchläufe je Tutorial]   (Playwright nötig; anderer Browser: PWCH=chrome bzw. PWCH=msedge)
// Prüft je Gerät und Modus:
//  1) Der Knopf „So geht's“ steht im Spielbildschirm, pulsiert beim ersten Besuch, danach nicht mehr. Kein Tutorial startet von selbst.
//  2) Durchspielen: Weiter bei Erklärungen, bei Handlungen tippt der Test dorthin, wo die Hand hinzeigt (Text: tippen und Enter).
//     Jeder Pflichtschritt erscheint, die Sprechblase liegt ganz im Bild, das Tutorial läuft bis zum Ende („Los geht's“).
//  3) Danach: normale Runde desselben Modus, Punkte, Serie und localStorage wie vorher (die Übungsrunde zählt nicht).
//  4) Überspringen und neu starten: beginnt wieder beim ersten Schritt, Esc (PC) bzw. Überspringen beendet sauber.
//  5) Keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8797, N = +process.argv[2] || 1;
const TYPES = { html: 'text/html; charset=utf-8', json: 'application/json; charset=utf-8', md: 'text/markdown; charset=utf-8', js: 'text/javascript' };
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': TYPES[p.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
// Spielbildschirm je Tutorial öffnen (normale Runde, wie ein Spieler)
const OPEN = {
  count: "count(PAT.zig)", find: "localStorage.setItem('waveChecker.findLvl','leicht');findSub('zig','leicht')", 'find-schwer': "findSub('zig','schwer')",
  recog: "recogNormal()", 'recog-schwer': "recogHard()", daily: "daily()", sub: "sub('zig')", blitz: "blitz('easy','leicht')",
  progn: "progn(undefined,'leicht')", 'progn-schwer': "progn(undefined,'schwer')", quiz: "quizStart(null)" };
// Schritte, die nur erscheinen, wenn es passt (siehe opt in TUTDEF)
const OPT = { count: ['tipp'], sub: ['tipp', 'weiter'], 'recog-schwer': ['bonus'], daily: ['bonus'] };
const TJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'tutorials.json'), 'utf8'));
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, runs = 0;
  // Datei: jede id muss es in der App geben, Texte höchstens zwei Sätze, keine Regel-IDs
  for (const [k, m] of Object.entries(TJ.modi)) { if (!OPEN[k]) { bad++; console.log('  FEHLER: Modus ohne Test: ' + k); }
    m.schritte.forEach(s => { const n = (s.text.match(/[.!?](\s|$)/g) || []).length; if (n > 2) { bad++; console.log('  FEHLER: mehr als zwei Sätze: ' + k + '/' + s.id); }
      if (/\b(IMP|ZZ|FR|FE|FRU|DRE|DL|DB|DE|WX|W4|KOM)-\d/.test(s.text)) { bad++; console.log('  FEHLER: Regel-ID im Text: ' + k + '/' + s.id); } }); }
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1');
      localStorage.setItem('waveChecker.progress', JSON.stringify({ pts: 37, streak: 4 })); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
    const tapSel = async sel => { const b = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; if (!e.closest('.tut,.dock')) e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return r.width ? [r.left + r.width / 2, r.top + r.height / 2] : null; }, sel); if (!b) return false; await tap(b[0], b[1]); return true; };
    const S = () => page.evaluate(() => window.TUTS && TUTS());
    const store = () => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== 'waveChecker.tutSeen') o[k] = localStorage.getItem(k); } // Weitermachen (Quiz, Blitz): ohne Zeitstempel, die normale Runde speichert ihn neu
      if (o['waveChecker.resume']) { const r = JSON.parse(o['waveChecker.resume']); delete r.at; o['waveChecker.resume'] = JSON.stringify(r); } return JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]])) + '|' + document.querySelector('#pt').textContent + '|' + document.querySelector('#sr').textContent; });
    const open = async k => { await page.evaluate(c => { window.scrollTo(0, 0); eval(c); }, OPEN[k]); await page.waitForFunction(k => { const b = document.querySelector('.tutbtn'); return b && TUTCTX && TUTCTX.key === k; }, k, { timeout: 15000 }).catch(() => fail(k + ': Knopf „So geht\'s“ fehlt')); await page.waitForTimeout(250); };
    const seen = () => page.waitForFunction(() => { const s = TUTS(); return !s || s.seen; }, null, { timeout: 15000 }).catch(() => null);
    for (const k of Object.keys(OPEN)) for (let run = 0; run < N; run++) {
      runs++;
      // 1) Knopf, Puls nur beim ersten Besuch, kein Auto-Start
      await page.evaluate(() => localStorage.removeItem('waveChecker.tutSeen')); await open(k);
      if (!await page.evaluate(() => document.querySelector('.tutbtn.pulse'))) fail(k + ': Knopf pulsiert beim ersten Besuch nicht');
      if (await S()) fail(k + ': Tutorial startet von selbst');
      await open(k); if (await page.evaluate(() => document.querySelector('.tutbtn.pulse'))) fail(k + ': Knopf pulsiert beim zweiten Besuch erneut');
      const kb = await page.evaluate(() => { const r = document.querySelector('.tutbtn').getBoundingClientRect(); return [r.top, r.right, r.height, innerWidth]; });
      if (kb[2] < 40 || kb[1] > kb[3] + 1) fail(k + ': Knopf zu klein oder außerhalb (' + kb.join(', ') + ')');
      const before = await store();
      // 2) Durchspielen
      await tapSel('.tutbtn'); await page.waitForFunction(() => TUTS(), null, { timeout: 15000 }).catch(() => fail(k + ': Tutorial startet nicht'));
      const all = (await S() || { steps: [] }).steps, req = TJ.modi[k].schritte.map(s => s.id).filter(id => all.includes(id) && !(OPT[k] || []).includes(id));
      let n = 0, last = '', same = 0;
      while (n++ < 120) { await seen(); const s = await S(); if (!s) break;
        const box = await page.evaluate(() => { const b = document.querySelector('.tut-bub'); if (!b || b.hidden) return null; const r = b.getBoundingClientRect(), v = window.visualViewport;
          return r.left >= 0 && r.top >= (v ? v.offsetTop : 0) - 1 && r.right <= document.documentElement.clientWidth + 1 && r.bottom <= (v ? v.offsetTop + v.height : innerHeight) + 1; });
        if (box === false) fail(k + '/' + s.id + ': Sprechblase nicht ganz im Bild');
        const key = s.id + s.i; same = key === last ? same + 1 : 0; last = key; if (same > 25) { fail(k + '/' + s.id + ': Schritt hängt'); break; }
        if (!s.act) { await page.waitForTimeout(touch ? 430 : 60); await tapSel('.tut .gd-next'); await page.waitForTimeout(200); continue; }
        if (s.done) { await page.waitForTimeout(250); continue; }
        if (s.id === 'text') { await tapSel('#fft'); await page.keyboard.type('Welle 4 ueberlappt Welle 1'); await page.keyboard.press('Enter'); await page.waitForTimeout(500); continue; }
        if (!s.hand) { await page.waitForTimeout(300); continue; }
        let { x, y } = s.hand; const vh = await page.evaluate(() => innerHeight);
        if (y < 10 || y > vh - 10) { await page.evaluate(d => window.scrollBy(0, d), y - vh / 2); await page.waitForTimeout(150); const h = (await S()).hand; if (!h) continue; ({ x, y } = h); }
        await tap(x, y); await page.waitForTimeout(touch ? 700 : 450);
      }
      const ids = await page.evaluate(() => window.TUTLAST || []); // gesehene Schritte des letzten Tutorials
      if (await S()) fail(k + ': Tutorial endet nicht');
      req.forEach(id => { if (!ids.includes(id)) fail(k + ': Schritt „' + id + '“ nicht erschienen (gesehen: ' + ids.join(', ') + ')'); });
      // 3) Danach normale Runde, nichts gespeichert
      await page.waitForTimeout(400);
      if (await page.evaluate(() => !!document.querySelector('.tut'))) fail(k + ': Abdunkelung bleibt stehen');
      if (!await page.evaluate(k => TUTCTX && TUTCTX.key === k && !!document.querySelector('.tutbtn'), k)) fail(k + ': danach keine normale Runde');
      const after = await store(); if (after !== before) fail(k + ': Übungsrunde hat Spielstand oder Speicher verändert\n    vorher:  ' + before.slice(0, 600) + '\n    nachher: ' + after.slice(0, 600));
      // 4) Überspringen und neu starten
      await tapSel('.tutbtn'); await page.waitForFunction(() => TUTS() && TUTS().seen, null, { timeout: 15000 }).catch(() => fail(k + ': Neustart klappt nicht'));
      const s1 = await S(); if (s1 && s1.i !== 0 && TJ.modi[k].schritte[0].id === s1.steps[0]) fail(k + ': Neustart beginnt nicht beim ersten Schritt');
      if (s1 && !s1.act) { await tapSel('.tut .gd-next'); await seen(); }
      if (!touch) await page.keyboard.press('Escape'); else await tapSel('.tut .gd-skip');
      await page.waitForTimeout(300);
      if (await S()) fail(k + ': Überspringen beendet das Tutorial nicht');
      if ((await store()) !== before) fail(k + ': Überspringen hat Spielstand oder Speicher verändert');
      await page.evaluate(() => { window.scrollTo(0, 0); home(); });
    }
    [...new Set(errs)].forEach(e => fail('Konsole: ' + e));
    console.log(name + ': ' + Object.keys(OPEN).length * N + ' Tutorials durchgespielt');
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung (' + runs + ' Durchläufe)'); process.exit(bad ? 1 : 0);
})();
