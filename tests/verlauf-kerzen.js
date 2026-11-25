// Test „Eigenen Chart prüfen“: erkannter Verlauf als Kerzen (seit 24.11.2026, Lenny). Handy (iPhone) und PC (Maus).
// Aufruf im Repo-Ordner: node tests/verlauf-kerzen.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome).
// Bilder: die festen Fälle aus tests/faelle (Kerzen, OHLC-Balken) und ein erzeugter Linienchart (tests/eigener-chart.js, MK).
// Je Bild in der Start-Ansicht, hineingezoomt und herausgezoomt, Regler 0 % und 100 %:
//  - keine Zickzack-Linie mehr (.ocpath), Kerzen (.occ) mit Docht, gefüllten (steigend) und hohlen (fallend) Körpern in --accent
//  - Hoch und Tief jeder Kerze = genaues Extrem ihrer Bildspalten (PGS.ocG() Spalten je Kerze), Schluss = Mitte der letzten Spalte,
//    Eröffnung = Schluss der Kerze davor; steigend gefüllt, fallend hohl
//  - Zahl der Kerzen in der Start-Ansicht ungefähr wie im Original (Bildbreite / IMG.cw, höchstens eine je 2 Bildschirmpixel; Faktor 0,4–2,5)
//  - hineingezoomt feiner (weniger Spalten je Kerze), wieder herausgezoomt gröber (höchstens bis zur Startansicht)
//  - Einrasten nutzt die einzelnen Spalten: Tipp neben ein Hoch (das höchste in 60 Bildschirmpixeln) trifft genau das Extrem der Spalte
//  - bei 100 % gut sichtbar (Kontrast der Kerzenfarbe auf Weiß mindestens 3:1), keine Fehler in der Konsole
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8802, T = require('./eigener-chart.js');
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 900 } }]];
const BILDER = ['paypal-preiskaestchen.png', 'lumen-trendlinien.png', 'legende-oben.png'];

// Kerzen aus dem SVG lesen und mit den Spalten vergleichen
const CHECK = () => { const I = PGS.img, PA = I.path, G = PGS.ocG(), g = document.querySelector('#svg .occ');
  if (!g) return { fehlt: true };
  const num = d => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number), wk = num(g.querySelector('.occw').getAttribute('d')), wick = [];
  for (let i = 0; i + 2 < wk.length; i += 3) wick.push({ x: wk[i], y0: wk[i + 1], y1: wk[i + 2] });
  const body = cls => { const v = num(g.querySelector(cls).getAttribute('d')), o = []; for (let i = 0; i + 4 < v.length; i += 5) o.push({ x: v[i] + v[i + 2] / 2, y: v[i + 1], hh: v[i + 3] }); return o; };
  const ups = body('.occu'), dns = body('.occd'), Yr = r => PGS.Y(I.h - r - .5);
  let bad = 0, n = 0, bodyBad = 0; const ex = [];
  wick.forEach(k => { const gi = Math.round(PGS.Tof(k.x) / G - .5 + 1e-6); let gg = null;
    for (const c of [gi, gi - 1, gi + 1]) { const cx = PGS.X((c * G + Math.min(I.w, c * G + G) - 1) / 2); if (Math.abs(cx - k.x) < .11) { gg = c; break; } }
    if (gg === null) { bad++; return; } n++;
    let h = 1e9, l = -1, cl = null; for (let x = gg * G; x < Math.min(I.w, gg * G + G); x++) if (PA.hi[x] >= 0) { h = Math.min(h, PA.hi[x]); l = Math.max(l, PA.lo[x]); cl = (PA.hi[x] + PA.lo[x]) / 2; }
    let pc = null; for (let x = gg * G - 1; x >= 0; x--) if (PA.hi[x] >= 0) { pc = (PA.hi[x] + PA.lo[x]) / 2; break; }
    const op = pc === null ? cl : Math.max(h, Math.min(l, pc));
    if (Math.abs(k.y0 - (Yr(h) - .5)) > .11 || Math.abs(k.y1 - (Yr(l) + .5)) > .11) { bad++; if (ex.length < 3) ex.push([gg, k.y0, Yr(h) - .5, k.y1, Yr(l) + .5]); }
    // Körper: steigend (Schluss höher, kleinere Zeile) gefüllt, sonst hohl; Ober- und Unterkante aus Eröffnung und Schluss
    const L = cl <= op ? ups : dns, b = L.find(q => Math.abs(q.x - k.x) < .2), yt = Yr(Math.min(op, cl)), yb = Yr(Math.max(op, cl));
    if (!b || Math.abs(b.y - (yt - (yb - yt < 1 ? .5 : 0))) > .11 || Math.abs(b.hh - Math.max(1, yb - yt)) > .11) bodyBad++; });
  const cs = getComputedStyle(g.querySelector('.occu')), cd = getComputedStyle(g.querySelector('.occd'));
  return { G, n, bad, bodyBad, ex, up: ups.length, dn: dns.length, fillU: cs.fill, fillD: cd.fill, stroke: cs.stroke, zick: document.querySelectorAll('#svg .ocpath').length,
    est: Math.round(Math.min((PGS.Tof(PGS.plot().W) - PGS.Tof(0)) / I.cw, PGS.plot().W / 2)), shown: wick.length };
};

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, nchk = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext({ ...opt, colorScheme: 'dark' }), page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    // erzeugter Linienchart
    const lin = await page.evaluate(new Function('return ' + T.MK)(), { seed: 4242, pr: T.PATS[0].pr, z: T.PATS[0].z, theme: 'light', kind: 'line', legend: true });
    const bilder = BILDER.map(b => ({ name: b, file: path.join(__dirname, 'faelle', b) })).concat([{ name: 'Linienchart', buf: Buffer.from(lin.url.split(',')[1], 'base64') }]);
    for (const B of bilder) for (const fade of [0, 100]) {
      const d = name + ' ' + B.name + ' ' + fade + ' %', fail = m => { bad++; console.log('  FEHLER ' + d + ': ' + m); }, ok = (c, m) => { nchk++; if (!c) fail(m); };
      await page.evaluate(v => localStorage.setItem('waveChecker.ocFade', String(v)), fade);
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', B.file || { name: 'c.png', mimeType: 'image/png', buffer: B.buf });
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); /* ganzes Bild statt Zuschnitt-Vorschlag (seit 25.11.2026) */ await page.waitForSelector('#svg.pgsvg');
      await page.evaluate(() => { const c = document.querySelector('#ocsh'); if (c && !c.checked) c.click(); });
      const st = await page.evaluate(CHECK);
      ok(!st.fehlt && !st.zick, 'Kerzen fehlen oder Zickzack-Linie noch da');
      if (st.fehlt) continue;
      ok(st.n > 20 && st.bad === 0, 'Hoch/Tief der Kerzen nicht genau das Extrem der Spalten (' + st.bad + ' von ' + st.n + ' ' + JSON.stringify(st.ex) + ')');
      ok(st.bodyBad === 0, 'Körper passt nicht zu Eröffnung/Schluss (' + st.bodyBad + ')');
      ok(st.up > 0 && st.dn > 0 && st.fillD === 'none' && st.fillU === st.stroke, 'steigend gefüllt / fallend hohl stimmt nicht (' + [st.up, st.dn, st.fillU, st.fillD, st.stroke] + ')');
      ok(st.shown >= st.est * .4 && st.shown <= st.est * 2.5, 'Zahl der Kerzen passt nicht zum Original (' + st.shown + ' statt etwa ' + st.est + ')');
      if (fade === 100) { const con = await page.evaluate(s => { const m = s.match(/\d+/g).map(Number), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }, L = .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); return 1.05 / (L + .05); }, st.stroke);
        ok(con >= 3, 'Kerzen auf Weiß zu blass (Kontrast ' + con.toFixed(2) + ')'); }
      // Zoom: hinein feiner, heraus gröber; danach wieder genau
      const g0 = st.G, mid = await page.evaluate(() => [PGS.plot().W / 2, PGS.plot().H / 2]);
      await page.evaluate(m => PGS.zoom(3, m[0], m[1]), mid); const zi = await page.evaluate(CHECK);
      ok(zi.G < g0 || g0 === 1, 'hineingezoomt nicht feiner (' + g0 + ' → ' + zi.G + ' Spalten je Kerze)');
      ok(zi.bad === 0 && zi.bodyBad === 0, 'hineingezoomt ungenau (' + zi.bad + '/' + zi.bodyBad + ')');
      await page.evaluate(m => PGS.zoom(1 / 9, m[0], m[1]), mid); const zo = await page.evaluate(CHECK);
      ok(zo.G > zi.G && zo.G === g0, 'herausgezoomt nicht gröber bzw. nicht bis zur Startansicht (' + zi.G + ' → ' + zo.G + ', Start ' + g0 + ')'); // seit 25.11.: nicht kleiner als die Startansicht
      ok(zo.bad === 0 && zo.bodyBad === 0, 'herausgezoomt ungenau (' + zo.bad + '/' + zo.bodyBad + ')');
      // Einrasten auf die Spalte, nicht auf die Kerze: deutliches Hoch im mittleren Drittel, Tipp 6 px daneben
      await page.evaluate(m => PGS.zoom(3, m[0], m[1]), mid);
      const sn = await page.evaluate(() => { const I = PGS.img, PA = I.path, a = Math.round(PGS.Tof(PGS.plot().W * .3)), b = Math.round(PGS.Tof(PGS.plot().W * .7)); let best = null;
        for (let x = Math.max(1, a); x <= Math.min(I.w - 2, b); x++) { if (PA.hi[x] < 0) continue; let pk = true; const R0 = Math.ceil(60 / PGS.view().BW); for (let k = x - R0; k <= x + R0; k++) if (k !== x && PA.hi[k] >= 0 && PA.hi[k] <= PA.hi[x]) { pk = false; break; } if (pk && (!best || PA.hi[x] < PA.hi[best])) best = x; }
        if (best === null) return null; const p = I.h - PA.hi[best] - .5, s = PGS.snapAt(PGS.X(best) + 4, PGS.Y(p) - 6, { want: 'h' }); return { x: best, p, s: s && { t: s.t, p: s.p } }; });
      if (sn) ok(sn.s && Math.abs(sn.s.t - sn.x) <= 1 && Math.abs(sn.s.p - sn.p) <= .6, 'Einrasten nicht auf dem Hoch der Spalte (' + JSON.stringify(sn) + ')');
    }
    if (errs.length) { bad++; console.log('  FEHLER ' + name + ': Konsole ' + [...new Set(errs)].slice(0, 3).join(' | ')); }
    console.log(name + ': fertig'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler bei ' + nchk + ' Prüfungen' : 'Alles in Ordnung (' + nchk + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
