// Test „Eigenen Chart prüfen“: Warnsignale zur Unterteilung, Text je Befund, Überschrift, Reihenfolge, Hervorhebung (seit 23.11.2026, Lenny).
// Aufruf im Repo-Ordner: node tests/subwellen.js [Durchläufe]   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy (iPhone), iPad (Touch), PC (Maus).
// Gezielt gebaute Charts (Linie, hell/dunkel, als Bild hochgeladen): ein regelkonformer Impuls, dessen Welle 3 je Fall anders unterteilt ist.
//  drei     Welle 3 hat nur 3 Teilwellen                → „Prüfe die Subwellen“ (orange), „… sie wirkt eher dreiteilig.“
//  regel    Welle 3 hat 5 Teilwellen, 4 überschneidet 1 → „… Die gefundenen 5 Teilwellen verletzen eine Regel (Welle 4 überschneidet Welle 1).“
//  unruhig  Welle 3 hat 9 Teilwellen                     → „… sie wirkt unruhiger, mit mehr Teilwellen.“
//  sauber   Welle 3 ist ein regelkonformer Impuls        → grün „Deine Zählung ist regelkonform“, kein Warnsignal
//  hart     Welle 4 läuft ins Gebiet von Welle 1         → rot „verstößt gegen …“ (Vorrang vor allem anderen)
// Außerdem: Reihenfolge der Hinweise (Unterteilung → andere Warnsignale → Faustregeln), Welle im Chart orange hinterlegt, Antippen eines
// Warnsignals bringt den Chart ins Bild und lässt die Welle blinken, Export-Bild mit „Prüfe die Subwellen“, keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8793, N = +process.argv[2] || 2;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const W3 = { drei: [0, 60, 35, 100], regel: [0, 40, 25, 70, 20, 100], unruhig: [0, 30, 5, 35, 10, 40, 15, 45, 20, 100], sauber: [0, 30, 15, 70, 55, 100], hart: [0, 30, 15, 70, 55, 100] };
const EXP = { drei: /sie wirkt eher dreiteilig\./, regel: /Die gefundenen 5 Teilwellen verletzen eine Regel \(Welle 4 überschneidet Welle 1\)/, unruhig: /sie wirkt unruhiger, mit mehr Teilwellen\./ };
// Chart zeichnen: Linie durch alle Wendepunkte, Dauer je Teilwelle nach ihrer Länge
const MKC = o => { const hard = o.fall === 'hart';
  const W = [[0, 20, 12, 34, 28, 40], [40, 28, 34, 24], o.w3.map(v => 24 + v), hard ? [124, 90, 105, 36] : [124, 108, 116, 100], hard ? [36, 60, 50, 95, 85, 120] : [100, 115, 108, 130, 122, 150]];
  const P = [W[0][0]], main = [0]; W.forEach(w => { w.slice(1).forEach(v => P.push(v)); main.push(P.length - 1); });
  const T = [0]; for (let i = 1; i < P.length; i++) T.push(T[i - 1] + 6 + Math.abs(P[i] - P[i - 1]) * 1.2);
  const W0 = 1100, H0 = 600, mn = Math.min(...P), mx = Math.max(...P), pad = (mx - mn) * .08, dark = o.theme === 'dark';
  const xOf = t => 30 + t / T[T.length - 1] * (W0 - 60), yOf = p => 20 + (mx + pad - p) / (mx - mn + 2 * pad) * (H0 - 40);
  const cv = document.createElement('canvas'); cv.width = W0; cv.height = H0; const g = cv.getContext('2d'); g.fillStyle = dark ? '#131722' : '#ffffff'; g.fillRect(0, 0, W0, H0);
  g.strokeStyle = dark ? '#1f2330' : '#f0f3fa'; for (let y = 50; y < H0; y += 80) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W0, y + .5); g.stroke(); }
  g.strokeStyle = '#2962FF'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(xOf(T[i]), yOf(p)) : g.moveTo(xOf(T[i]), yOf(p))); g.stroke();
  return { url: cv.toDataURL('image/png'), piv: main.map((i, k) => ({ x: xOf(T[i]), hl: k ? (P[i] > P[main[k - 1]] ? 'h' : 'l') : 'l' })) };
};

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext({ ...opt, acceptDownloads: true }), page = await ctx.newPage(), errs = [], touch = !!opt.hasTouch;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    for (let r = 0; r < N; r++) for (const fall of Object.keys(W3)) {
      const o = { fall, w3: W3[fall], theme: (r + fall.length) % 2 ? 'dark' : 'light' }, G = await page.evaluate(MKC, o), d = fall + ' (' + o.theme + ')';
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', { name: 'chart.png', mimeType: 'image/png', buffer: Buffer.from(G.url.split(',')[1], 'base64') });
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); /* ganzes Bild statt Zuschnitt-Vorschlag (seit 25.11.2026) */ await page.waitForSelector('#svg.pgsvg');
      const set = await page.evaluate(piv => { const I = PGS.img, P = I.path; piv.forEach((q, k) => { const x0 = Math.round(q.x * I.crop.f); let best = null;
        for (let x = Math.max(0, x0 - 3); x <= Math.min(I.w - 1, x0 + 3); x++) { const v = q.hl === 'h' ? P.hi[x] : P.lo[x]; if (v < 0) continue; if (!best || (q.hl === 'h' ? v < best.v : v > best.v)) best = { x, v }; }
        if (best) PGS.fadd('N', k, best.x, I.h - best.v - .5); }); return PGS.FR().pts.length === piv.length; }, G.piv);
      if (!set) { fail('Zählung nicht gesetzt: ' + d); continue; }
      await page.evaluate(() => document.querySelector('#fchk').click()); await page.waitForTimeout(100); n++;
      const res = await page.evaluate(() => { const fb = document.querySelector('#fb'), notes = [...fb.querySelectorAll('.rnote')].map(e => e.classList.contains('ocsubn') ? 'sub' : e.querySelector('.s-regel') ? 'regel' : e.querySelector('.s-warn') ? 'warn' : 'faust');
        return { ...PGS.res, html: fb.textContent, head: (fb.querySelector('.ocwarn,.ok,.bad') || {}).className, notes, wb: [...document.querySelectorAll('#svg .pgwb')].map(e => +e.dataset.i) }; });
      // Überschrift
      const st = fall === 'hart' ? 'bad' : fall === 'sauber' ? 'ok' : 'warn';
      if (res.state !== st) fail(d + ': Zustand ' + res.state + ' statt ' + st + ' ' + JSON.stringify(res.sub));
      if (st === 'warn' && !(res.head === 'ocwarn' && /Prüfe die Subwellen/.test(res.html) && /Die Hauptwellen sind regelkonform, aber in Welle 3 passt die innere Struktur nicht sicher\./.test(res.html))) fail(d + ': Überschrift „Prüfe die Subwellen“ fehlt oder falsch');
      if (st === 'warn' && /Deine Zählung ist regelkonform/.test(res.html)) fail(d + ': grünes „regelkonform“ trotz Warnsignal');
      if (st === 'ok' && !(res.head === 'ok' && !res.sub.length)) fail(d + ': grünes „regelkonform“ fehlt');
      if (st === 'bad' && !(res.head === 'bad' && !/Prüfe die Subwellen/.test(res.html))) fail(d + ': roter Regelverstoß hat keinen Vorrang');
      // Text je Befund, nur Welle 3
      if (EXP[fall]) { const w3 = res.sub.filter(x => x.k === 3); if (w3.length !== 1 || !EXP[fall].test(w3[0].txt)) fail(d + ': Text passt nicht: ' + JSON.stringify(res.sub.map(x => x.txt)));
        if (res.sub.some(x => x.k !== 3)) fail(d + ': Warnsignal in einer anderen Welle: ' + JSON.stringify(res.sub.map(x => x.k)));
        if (/wirkt eher fünfteilig/.test(res.html) && /Fünfer-Unterteilung/.test(res.html)) fail(d + ': widersprüchlicher Text');
        if (fall === 'regel' && res.sub[0].rule !== 'IMP-3') fail(d + ': Regel ' + res.sub[0].rule + ' statt IMP-3'); }
      // Reihenfolge: Regel-Fehler → Unterteilung → andere Warnsignale → Faustregeln
      const rank = { regel: 0, sub: 1, warn: 2, faust: 3 }; if (res.notes.some((x, i) => i && rank[x] < rank[res.notes[i - 1]])) fail(d + ': Reihenfolge der Hinweise ' + res.notes.join(','));
      // Hervorhebung und Antippen
      if (st === 'warn') { if (res.wb.length !== res.sub.length) fail(d + ': Welle nicht orange hinterlegt');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(150);
        const el = await page.$('#fb .ocsubn'); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(450); if (touch) { const b = await el.boundingBox(); await page.touchscreen.tap(b.x + 20, b.y + b.height / 2); } else await el.click();
        await page.waitForTimeout(700);
        const v = await page.evaluate(() => { const r = document.querySelector('#svg .pgwb.blink'), c = document.querySelector('#pgc').getBoundingClientRect(); return { blink: !!r, inView: c.top < innerHeight && c.bottom > 0 }; });
        if (!v.blink || !v.inView) fail(d + ': Antippen des Warnsignals zeigt die Welle nicht (' + JSON.stringify(v) + ')');
        if (r === 0 && fall === 'drei') { await page.waitForTimeout(450); const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.click('#ocsave')]);
          if (!dl) fail('Bild-Export fehlt'); else { const f = path.join(require('os').tmpdir(), 'wc-subwellen-' + name + '.png'); await dl.saveAs(f); console.log('   Bild gespeichert: ' + f); } } }
    }
    console.log(name + ': ' + n + ' Charts geprüft'); n = 0;
    if (errs.length) fail('Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
