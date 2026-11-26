// Test „Eigenen Chart prüfen“: automatische Prüfung der Unterteilung mit allen erlaubten Mustern (seit 26.11.2026, Lenny, Discord-Screenshot).
// Aufruf im Repo-Ordner: node tests/unterteilung-muster.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy (iPhone), iPad (Touch), PC (Maus).
// Gebaute Linien-Charts mit bekannter innerer Struktur, gezählt wird nur die große Welle; die Unterteilungen sucht die App selbst (ocSub).
//  gleich    Expandierendes Dreieck, Welle B als Flat, deren (b) genau auf dem Start von (a) endet (Screenshot): kein Warnsignal (vorher:
//            „Welle B überschreitet den Start von Welle A“, weil Regular Flat „unter“ und Expanded Flat „über“ verlangen; seit 26.11. 1,5 px Toleranz)
//  dreieck   Expandierendes Dreieck, Welle B als Expanded Flat: kein Warnsignal
//  zig2      Impuls, Welle 2 als Zigzag: kein Warnsignal
//  flat4     Impuls, Welle 4 als Regular Flat: kein Warnsignal
//  dreieck4  Impuls, Welle 4 als kontrahierendes Dreieck: kein Warnsignal
//  regel3    Impuls, Welle 3 fünfteilig, (4) überschneidet (1): Warnsignal mit Ebene „Teilwelle (4) in Welle 3 überschneidet Teilwelle (1)“
//  drei1     Impuls, Welle 1 nur dreiteilig: Warnsignal „Geprüft: als Impuls nicht (…); als Leading Diagonale nicht (…); als Expandierende Diagonale nicht (…)“
//            (Korrekturwellen finden fast immer ein erlaubtes Muster, z. B. Double Zigzag; das ist nach dem Regelwerk richtig)
// Außerdem: Warnsignale nur unter „Hinweise“ mit „Automatisch erkannt“, nie als harte Regel; Farben der Wellengrößen (große Welle Kreis #1E5EFF,
// Schrift weiß; Legende mit drei Farbfeldern); keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8812;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const IMP0 = [[0, 20, 12, 34, 28, 40], [40, 30, 35, 24], [24, 50, 40, 90, 80, 110]];
const F = {
  gleich: { z: 'TRI', W: [[95, 98.5, 97, 100], [100, 94, 100, 90], [90, 99, 95, 106], [106, 96, 101, 84], [84, 100, 92, 112]], warn: false },
  dreieck: { z: 'TRI', W: [[100, 96, 98, 94], [94, 99, 93, 102], [102, 96, 99, 91], [91, 98.5, 95, 105], [105, 97, 101, 88]], warn: false },
  zig2: { z: 'N', W: [...IMP0.slice(0, 1), [40, 30, 35, 24], IMP0[2], [110, 100, 106, 98, 104, 92], [92, 110, 102, 130, 122, 140]], warn: false },
  flat4: { z: 'N', W: [...IMP0, [110, 100, 109, 92], [92, 110, 102, 130, 122, 140]], warn: false },
  dreieck4: { z: 'N', W: [...IMP0, [110, 96, 106, 99, 104, 100], [100, 115, 108, 130, 122, 150]], warn: false },
  regel3: { z: 'N', W: [[0, 20, 12, 34, 28, 40], [40, 28, 34, 24], [24, 64, 49, 94, 44, 124], [124, 108, 116, 100], [100, 115, 108, 130, 122, 150]], warn: /Teilwelle \(4\) in Welle 3 überschneidet Teilwelle \(1\)/ },
  drei1: { z: 'N', W: [[0, 30, 15, 40], [40, 30, 35, 24], [24, 50, 40, 90, 80, 110], [110, 100, 106, 98, 104, 92], [92, 110, 102, 130, 122, 140]], warn: /Geprüft: als Impuls nicht \(keine 5 Teilwellen gefunden\); als Leading Diagonale nicht \(keine 5 Teilwellen gefunden\); als Expandierende Diagonale nicht/ },
};
const MKC = C => { const W = C.W, P = [W[0][0]], main = [0]; W.forEach(w => { w.slice(1).forEach(v => P.push(v)); main.push(P.length - 1); });
  const T = [0]; for (let i = 1; i < P.length; i++) T.push(T[i - 1] + 6 + Math.abs(P[i] - P[i - 1]) * 1.2 * 100 / (Math.max(...P) - Math.min(...P)));
  const W0 = 1100, H0 = 600, mn = Math.min(...P), mx = Math.max(...P), pad = (mx - mn) * .08, xOf = t => 30 + t / T[T.length - 1] * (W0 - 60), yOf = p => 20 + (mx + pad - p) / (mx - mn + 2 * pad) * (H0 - 40);
  const cv = document.createElement('canvas'); cv.width = W0; cv.height = H0; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W0, H0);
  g.strokeStyle = '#2962FF'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(xOf(T[i]), yOf(p)) : g.moveTo(xOf(T[i]), yOf(p))); g.stroke();
  return { url: cv.toDataURL('image/png'), piv: main.map((i, k) => ({ x: xOf(T[i]), hl: k ? (P[i] > P[main[k - 1]] ? 'h' : 'l') : (P[0] > P[main[1]] ? 'h' : 'l') })) }; };
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [];
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    for (const [fall, C] of Object.entries(F)) {
      const G = await page.evaluate(MKC, C);
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', { name: 'c.png', mimeType: 'image/png', buffer: Buffer.from(G.url.split(',')[1], 'base64') });
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); await page.waitForSelector('#svg.pgsvg');
      const r = await page.evaluate(([piv, z]) => { const I = PGS.img, P = I.path; piv.forEach((q, k) => { const x0 = Math.round(q.x * I.crop.f); let best = null;
          for (let x = Math.max(0, x0 - 3); x <= Math.min(I.w - 1, x0 + 3); x++) { const v = q.hl === 'h' ? P.hi[x] : P.lo[x]; if (v < 0) continue; if (!best || (q.hl === 'h' ? v < best.v : v > best.v)) best = { x, v }; }
          if (best) PGS.fadd(z, k, best.x, I.h - best.v - .5, k ? undefined : 'neu'); });
        const leg = [...document.querySelectorAll('.pglg .wlg')].map(e => getComputedStyle(e).backgroundColor);
        const c1 = document.querySelector('#svg circle.pgc1.wlv1'), t1 = document.querySelector('#svg text.lab.wt1'), cls = '', c1f = c1 && getComputedStyle(c1).fill, t1f = t1 && getComputedStyle(t1).fill; // vor dem Prüfen lesen (danach wird neu gezeichnet)
        document.querySelector('#fchk').click(); const fb = document.querySelector('#fb'), rn = [...fb.querySelectorAll('.rnote')];
        return { state: PGS.res.state, errs: PGS.res.errs, sub: rn.filter(e => e.classList.contains('ocsubn')).map(e => e.textContent), regel: rn.filter(e => e.querySelector('.s-regel')).map(e => e.textContent),
          hin: fb.innerHTML.indexOf('Hinweise'), pos: rn.filter(e => e.classList.contains('ocsubn')).map(e => fb.innerHTML.indexOf(e.outerHTML)), leg,
          cls, c1: c1f, t1: t1f }; }, [G.piv, C.z]);
      const d = name + ' ' + fall;
      ok(!r.errs.length && !r.regel.length, d + ': harte Regel statt Warnsignal: ' + r.regel.join(' | '));
      if (!C.warn) ok(!r.sub.length && r.state === 'ok', d + ': Warnsignal, obwohl ein erlaubtes Muster passt: ' + r.sub.join(' | '));
      else { ok(r.sub.some(t => C.warn.test(t)), d + ': erwarteter Text fehlt: ' + r.sub.join(' | '));
        ok(r.sub.every(t => /Automatisch erkannt/.test(t)) && r.pos.every(p => p > r.hin), d + ': Warnsignal nicht als „Automatisch erkannt“ unter „Hinweise“');
        ok(!r.sub.some(t => /\(Welle \d überschneidet|Welle B überschreitet den Start von Welle A/.test(t)), d + ': Regel ohne Ebene genannt'); }
      if (fall === 'gleich') { ok(r.leg.join() === 'rgb(30, 94, 255),rgb(111, 151, 255),rgb(201, 216, 255)', d + ': Legende ohne Farben der Wellengrößen (' + r.leg.join(' / ') + ')');
        ok(r.c1 === 'rgb(30, 94, 255)' && r.t1 === 'rgb(255, 255, 255)', d + ': große Welle nicht #1E5EFF mit weißer Schrift (' + r.c1 + ' / ' + r.t1 + ') ' + r.cls); }
      console.log(d + ': ' + r.state + (r.sub.length ? ' – ' + r.sub[0].slice(0, 140) : ''));
    }
    ok(!errs.length, name + ': Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung (' + n + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
