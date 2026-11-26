// Test „Eigenen Chart prüfen“: erkannter Verlauf als Kerzen (seit 24.11.2026, Lenny; seit 26.11.2026 1:1 zum Original). Handy (iPhone) und PC (Maus).
// Aufruf im Repo-Ordner: node tests/verlauf-kerzen.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome).
// Bilder: die festen Fälle aus tests/faelle (Kerzen, OHLC-Balken), erzeugte Kerzen- und OHLC-Charts mit bekannten Kerzen und ein erzeugter
// Linienchart (tests/eigener-chart.js, MK). Je Bild Regler 0 % und 100 %, Startansicht, hineingezoomt, gestreckt, wieder heraus:
//  - Kerzenmodus (PGS.img.cdl): jede erkannte Kerze genau einmal gezeichnet (Docht an ihrer Spalte, Hoch/Tief genau), die Anzahl ändert sich beim
//    Zoomen und Strecken nie (sichtbar = alle Kerzen im Ausschnitt); steigend gefüllt, fallend hohl, beides kommt vor
//  - erzeugte Charts: jede bekannte Kerze hat eine erkannte an derselben Stelle (±1 Spalte, Hoch/Tief ±1,5 px), Anzahl ±5 % (deckungsgleich)
//  - Rückfall (Linienchart): feste Spalten je Kerze (PGS.ocG() bleibt beim Zoomen gleich), Hoch/Tief = Extrem der Spalten
//  - Einrasten auf die erkannte Kerze: Tipp neben ein Hoch trifft Docht-Spalte und Hoch der Kerze
//  - bei 100 % gut sichtbar (Kontrast der Kerzenfarbe auf Weiß mindestens 3:1), keine Zickzack-Linie, keine Fehler in der Konsole
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8802, T = require('./eigener-chart.js');
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': require('./typ')(p), 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 900 } }]];
const BILDER = ['paypal-preiskaestchen.png', 'lumen-trendlinien.png', 'legende-oben.png', 'coreweave-original.png'], FAELLE = JSON.parse(fs.readFileSync(path.join(__dirname, 'faelle', 'faelle.json'), 'utf8')).faelle;

// Gezeichnete Kerzen lesen und mit IMG.cdl bzw. den Spaltengruppen vergleichen
const CHECK = () => { const I = PGS.img, PA = I.path, g = document.querySelector('#svg .occ'), Yr = r => PGS.Y(I.h - r - .5);
  if (!g) return { fehlt: true };
  const num = d => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number), wk = num(g.querySelector('.occw').getAttribute('d')), wick = [];
  for (let i = 0; i + 2 < wk.length; i += 3) wick.push({ x: wk[i], y0: wk[i + 1], y1: wk[i + 2] });
  const nb = cls => (g.querySelector(cls).getAttribute('d').match(/M/g) || []).length;
  const cs = getComputedStyle(g.querySelector('.occu')), cd = getComputedStyle(g.querySelector('.occd')), W = PGS.plot().W;
  let bad = 0; const ex = [];
  if (I.cdl) { const t0 = PGS.Tof(0) - 2, t1 = PGS.Tof(W) + 2, vis = I.cdl.filter(k => !(k.b < t0 || k.a > t1)); // wie beim Zeichnen
    wick.forEach(w => { const k = I.cdl.find(q => Math.abs(PGS.X(q.xc) - w.x) < .11); if (!k || Math.abs(w.y0 - (Yr(k.hi) - .5)) > .11 || Math.abs(w.y1 - (Yr(k.lo) + .5)) > .11) { bad++; if (ex.length < 3) ex.push([w.x, w.y0, w.y1, k && [k.xc, k.hi, k.lo]]); } });
    return { mode: 'kerzen', total: I.cdl.length, vis: vis.length, shown: wick.length, bad, ex, up: nb('.occu'), dn: nb('.occd'), fillU: cs.fill, fillD: cd.fill, stroke: cs.stroke, zick: document.querySelectorAll('#svg .ocpath').length }; }
  const G = PGS.ocG(); wick.forEach(w => { const gi = Math.round(PGS.Tof(w.x) / G - .5 + 1e-6); let gg = null;
    for (const c of [gi, gi - 1, gi + 1]) { const cx = PGS.X((c * G + Math.min(I.w, c * G + G) - 1) / 2); if (Math.abs(cx - w.x) < .11) { gg = c; break; } }
    if (gg === null) { bad++; return; } let h = 1e9, l = -1; for (let x = gg * G; x < Math.min(I.w, gg * G + G); x++) if (PA.hi[x] >= 0) { h = Math.min(h, PA.hi[x]); l = Math.max(l, PA.lo[x]); }
    if (Math.abs(w.y0 - (Yr(h) - .5)) > .11 || Math.abs(w.y1 - (Yr(l) + .5)) > .11) bad++; });
  return { mode: 'spalten', G, shown: wick.length, bad, ex, up: nb('.occu'), dn: nb('.occd'), fillU: cs.fill, fillD: cd.fill, stroke: cs.stroke, zick: document.querySelectorAll('#svg .ocpath').length };
};

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, nchk = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext({ ...opt, colorScheme: 'dark' }), page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    // erzeugte Charts: Linie (Rückfall), Kerzen und OHLC mit bekannten Kerzen (cdl: Spalte, Hoch a, Tief b)
    const mk = o => page.evaluate(new Function('return ' + T.MK)(), { pr: T.PATS[0].pr, z: T.PATS[0].z, legend: true, ...o });
    const lin = await mk({ seed: 4242, theme: 'light', kind: 'line' }), kz = await mk({ seed: 777, theme: 'dark', kind: 'candle', zones: true }), oh = await mk({ seed: 31337, theme: 'light', kind: 'ohlc', ohlcW: false });
    const gen = (n, I) => ({ name: n, buf: Buffer.from(I.url.split(',')[1], 'base64'), truth: I.cdl });
    const bilder = BILDER.map(b => ({ name: b, file: path.join(__dirname, 'faelle', b) })).concat([gen('Kerzen erzeugt', kz), gen('OHLC erzeugt', oh), gen('Linienchart', lin)]);
    for (const B of bilder) for (const fade of [0, 100]) {
      const d = name + ' ' + B.name + ' ' + fade + ' %', fail = m => { bad++; console.log('  FEHLER ' + d + ': ' + m); }, ok = (c, m) => { nchk++; if (!c) fail(m); };
      await page.evaluate(v => localStorage.setItem('waveChecker.ocFade', String(v)), fade);
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', B.file || { name: 'c.png', mimeType: 'image/png', buffer: B.buf });
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); /* ganzes Bild */ await page.waitForSelector('#svg.pgsvg');
      await page.evaluate(() => { const c = document.querySelector('#ocsh'); if (c && !c.checked) c.click(); });
      const st = await page.evaluate(CHECK);
      ok(!st.fehlt && !st.zick, 'Kerzen fehlen oder Zickzack-Linie noch da'); if (st.fehlt) continue;
      ok(st.mode === (B.name === 'Linienchart' ? 'spalten' : 'kerzen'), 'falscher Modus ' + st.mode);
      ok(st.shown > 20 && st.bad === 0, 'gezeichnete Kerzen weichen ab (' + st.bad + ' von ' + st.shown + ' ' + JSON.stringify(st.ex) + ')');
      ok((B.name.startsWith('lumen') || (st.up > 0 && st.dn > 0)) && st.fillD === 'none' && st.fillU === st.stroke, /* Lumen: dünne OHLC-Balken ohne erkennbare Striche, nur Dochte */ 'steigend gefüllt / fallend hohl stimmt nicht (' + [st.up, st.dn, st.fillU, st.fillD, st.stroke] + ')');
      if (st.mode === 'kerzen') ok(st.shown === st.total && st.vis === st.total, 'Startansicht zeigt nicht jede Kerze genau einmal (' + st.shown + ' von ' + st.total + ')');
      // seit 26.11.2026 (PayPal): nie breite Sammelkerzen; dichte Charts schmal (höchstens 4 Spalten); Wendepunkte bleiben Hoch bzw. Tief einer Kerze
      const F = FAELLE.find(q => q.datei === B.name);
      if (st.mode === 'kerzen' && fade === 0) { const kw = await page.evaluate(F => { const I = PGS.img, f = I.crop.f, ws = I.cdl.map(k => k.b - k.a + 1);
          const wp = ((F && F.wendepunkte) || []).map(q => ({ name: q.name, ok: I.cdl.some(k => k.b >= (q.x - 8) * f && k.a <= (q.x + 8) * f && Math.abs((q.hl === 'h' ? k.hi : k.lo) - q.y * f) <= 3 * Math.max(1, f)) }));
          return { max: Math.max(...ws), wp }; }, F || null);
        ok(kw.max <= (F && F.dicht ? 4 : 10), 'zu breite Kerze (' + kw.max + ' Spalten): Sammelkerze über mehrere Kerzen');
        kw.wp.forEach(q => ok(q.ok, 'Wendepunkt ' + q.name + ' ist kein Hoch bzw. Tief einer Kerze')); }
      if (fade === 100) { const con = await page.evaluate(s => { const m = s.match(/\d+/g).map(Number), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }, L = .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); return 1.05 / (L + .05); }, st.stroke);
        ok(con >= 3, 'Kerzen auf Weiß zu blass (Kontrast ' + con.toFixed(2) + ')'); }
      // deckungsgleich mit den bekannten Kerzen der erzeugten Charts
      if (B.truth && fade === 0 && st.mode === 'kerzen') { const r = await page.evaluate(tr => { const I = PGS.img, f = I.crop.f; let hit = 0, n = 0; tr.forEach(q => { if (q.hid) return; const x = q.x * f; if (x < 3 || x > I.w - 4) return; n++;
          if (I.cdl.some(k => Math.abs(k.xc - x) <= 1 && Math.abs(k.hi - q.a * f) <= 1.5 && Math.abs(k.lo - q.b * f) <= 1.5)) hit++; }); return { hit, n, total: I.cdl.length, truth: tr.length }; }, B.truth);
        ok(r.hit >= r.n * (B.name.startsWith('Kerzen') ? .92 : .95), 'erkannte Kerzen nicht deckungsgleich mit dem Original (' + r.hit + ' von ' + r.n + ')'); // Kerzen erzeugt hat Zonen: Dochtspitzen an Box-Kanten (offen)
        ok(Math.abs(r.total - r.truth) <= Math.max(2, r.truth * .05), 'Zahl der Kerzen weicht vom Original ab (' + r.total + ' statt ' + r.truth + ')'); }
      // Zoom und Strecken: Anzahl bleibt, gezeichnete Kerzen bleiben genau
      const mid = await page.evaluate(() => [PGS.plot().W / 2, PGS.plot().H / 2]);
      await page.evaluate(m => PGS.zoom(3, m[0], m[1]), mid); const zi = await page.evaluate(CHECK);
      ok(zi.bad === 0, 'hineingezoomt ungenau (' + zi.bad + ')');
      if (st.mode === 'kerzen') ok(zi.total === st.total && zi.shown === zi.vis, 'hineingezoomt andere Kerzen (' + zi.shown + ' gezeichnet, ' + zi.vis + ' im Ausschnitt, gesamt ' + zi.total + ' statt ' + st.total + ')');
      else ok(zi.G === st.G, 'Rückfall: Spalten je Kerze ändern sich beim Zoom (' + st.G + ' → ' + zi.G + ')');
      const box = await page.evaluate(() => { const b = document.querySelector('#svg').getBoundingClientRect(); return { x: b.left + b.width * .5, y: b.top + b.height * .45 }; });
      if (!opt.hasTouch) { await page.mouse.move(box.x, box.y); for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(40); } } // Mausrad: nur die Zeitachse strecken
      else await page.evaluate(m => PGS.zoom(1.5, m[0], m[1]), mid);
      const zs = await page.evaluate(CHECK); ok(zs.bad === 0 && (st.mode !== 'kerzen' || (zs.total === st.total && zs.shown === zs.vis)), 'gestreckt: Anzahl oder Lage ändert sich (' + JSON.stringify([zs.shown, zs.vis, zs.total, zs.bad]) + ')');
      await page.evaluate(m => PGS.zoom(1 / 30, m[0], m[1]), mid); await page.evaluate(() => { const b = document.querySelector('[data-zr]'); if (b) b.click(); }); const zo = await page.evaluate(CHECK);
      ok(zo.bad === 0 && zo.shown === st.shown, 'zurück in der Startansicht andere Kerzen (' + zo.shown + ' statt ' + st.shown + ')');
      // Einrasten auf die erkannte Kerze: deutliches Hoch im mittleren Drittel, Tipp 6 px daneben
      await page.evaluate(m => PGS.zoom(3, m[0], m[1]), mid);
      const sn = await page.evaluate(() => { const I = PGS.img, PA = I.path, a = Math.round(PGS.Tof(PGS.plot().W * .3)), b = Math.round(PGS.Tof(PGS.plot().W * .7)); let best = null;
        for (let x = Math.max(1, a); x <= Math.min(I.w - 2, b); x++) { if (PA.hi[x] < 0) continue; let pk = true; const R0 = Math.ceil(60 / PGS.view().BW); for (let k = x - R0; k <= x + R0; k++) if (k !== x && PA.hi[k] >= 0 && PA.hi[k] <= PA.hi[x]) { pk = false; break; } if (pk && (!best || PA.hi[x] < PA.hi[best])) best = x; }
        if (best === null) return null; const k = I.cdl && I.cdl.find(q => q.a <= best && best <= q.b), p = I.h - PA.hi[best] - .5, s = PGS.snapAt(PGS.X(best) + 4, PGS.Y(p) - 6, { want: 'h' });
        return { x: k ? k.xc : best, p: k ? I.h - k.hi - .5 : p, s: s && { t: s.t, p: s.p } }; });
      if (sn) ok(sn.s && Math.abs(sn.s.t - sn.x) <= (st.mode === 'kerzen' ? 0 : 1) && Math.abs(sn.s.p - sn.p) <= .6, 'Einrasten nicht auf Docht und Hoch der Kerze (' + JSON.stringify(sn) + ')');
    }
    if (errs.length) { bad++; console.log('  FEHLER ' + name + ': Konsole ' + [...new Set(errs)].slice(0, 3).join(' | ')); }
    console.log(name + ': fertig'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler bei ' + nchk + ' Prüfungen' : 'Alles in Ordnung (' + nchk + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
