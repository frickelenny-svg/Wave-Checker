// Test „Eigenen Chart prüfen“: Unterteilung der Wellen aus dem Kursverlauf (seit 23.11.2026, Lenny). Handy (iPhone), iPad (Touch), PC (Maus).
// Aufruf im Repo-Ordner: node tests/struktur.js [Charts je Gerät]   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome für einen installierten Browser)
// Die Charts kommen aus dem echten Generator von „Wie geht es weiter?“ (pgData: großes Muster, jede Welle ein regelkonformes Teilmuster,
// Impulse noch einmal unterteilt). Sie werden als Bild im TradingView-Stil gezeichnet (hell/dunkel, Kerzen/Linie, teils als Handyfoto),
// hochgeladen, die große Welle wird an den bekannten Wendepunkten gezählt (auf dem erkannten Verlauf) und geprüft.
// Prüft:
//  1) Regelkonforme Charts: kein Warnsignal „keine regelkonforme Unterteilung“ (Fehlalarme höchstens 5 % der beurteilten Wellen),
//     mindestens 70 % der Wellen werden beurteilt (nicht zu grob aufgelöst).
//  2) Manipulierte Impulse (Welle 3 ist in Wahrheit ein Zigzag mit verrauschten Teilwellen, also dreiteilig): Warnsignal für Welle 3 in mindestens
//     15 % der Fälle, über alle Geräte zusammen (Stand 23.11.2026 rund 20 bis 35 %; solche Zigzags lassen sich oft auch regelkonform fünfteilig lesen, Vorrang hat: keine Fehlalarme).
//     OCF=Faktor setzt die Größenordnung in ocFit (Standard 1,5).
//  3) Gefundene Wendepunkte werden gestrichelt gezeichnet, keine Fehler in der Konsole.
// DBG=1 zeigt jeden Fehlalarm, NUR=PC prüft nur ein Gerät.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8798, N = +process.argv[2] || 12;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const KEYS = ['imp', 'zig', 'fr', 'fe', 'fru', 'trk', 'tre', 'dl', 'db', 'de', 'dz', 'tz'];
// Chart im Browser erzeugen und zeichnen. o: {key, mut (Welle 3 eines Impulses als Zigzag), theme, kind, photo}
const GEN = (o) => {
  let ORIG = null; if (o.mut) { ORIG = pgNode; pgNode = (k, l) => { const n = ORIG(k, l); if (n && l === 1 && k === 'imp' && n.kids) { const z = ORIG('zig', 2); if (z) n.kids[2] = z; } return n; }; }
  let R; try { R = pgData(PAT[o.key]); } finally { if (ORIG) pgNode = ORIG; }
  const L = R.mp, span = L[L.length - 1] - L[0], tf = [1, 2, 3, 4, 6, 8, 12, 24].reduce((a, b) => Math.abs(span / b - (o.kind === 'line' ? 480 : 190)) < Math.abs(span / a - (o.kind === 'line' ? 480 : 190)) ? b : a);
  const g0 = Math.max(0, Math.floor((L[0] - span * .03) / tf)), g1 = Math.floor(R.N / tf), C = [];
  for (let g = g0; g <= g1; g++) { let o2, h = -1e9, l = 1e9, c; for (let i = g * tf; i <= Math.min(R.N, g * tf + tf - 1); i++) { if (o2 === undefined) o2 = R.o[i]; h = Math.max(h, R.h[i]); l = Math.min(l, R.l[i]); c = R.c[i]; } if (o2 !== undefined) C.push({ o: o2, h, l, c }); }
  const W0 = 1100, H0 = 600, dark = o.theme === 'dark', line = o.kind === 'line';
  const col = dark ? { bg: '#131722', grid: '#1f2330', up: '#089981', dn: '#f23645', ln: '#2962FF' } : { bg: '#ffffff', grid: '#f0f3fa', up: '#089981', dn: '#f23645', ln: '#2962FF' };
  const vals = C.flatMap(k => line ? [k.c] : [k.h, k.l]), mn = Math.min(...vals), mx = Math.max(...vals), pad = (mx - mn) * .08;
  const yOf = p => 10 + (mx + pad - p) / (mx - mn + 2 * pad) * (H0 - 20), sp = (W0 - 20) / C.length, bw = Math.max(1, Math.round(sp * .6) | 1), xOf = i => Math.round(10 + (i + .5) * sp);
  const cv = document.createElement('canvas'); cv.width = W0; cv.height = H0; const g = cv.getContext('2d'); g.fillStyle = col.bg; g.fillRect(0, 0, W0, H0);
  g.strokeStyle = col.grid; for (let y = 40; y < H0; y += 70) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W0, y + .5); g.stroke(); } for (let x = 80; x < W0; x += 140) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H0); g.stroke(); }
  if (line) { g.strokeStyle = col.ln; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); C.forEach((k, i) => i ? g.lineTo(xOf(i), yOf(k.c)) : g.moveTo(xOf(i), yOf(k.c))); g.stroke(); }
  else C.forEach((k, i) => { const X = xOf(i), yh = Math.round(yOf(k.h)), yl = Math.round(yOf(k.l)), yt = Math.round(yOf(Math.max(k.o, k.c))), yb = Math.round(yOf(Math.min(k.o, k.c))); g.fillStyle = k.c >= k.o ? col.up : col.dn; g.fillRect(X, yh, 1, yl - yh + 1); if (bw > 1) g.fillRect(X - (bw - 1) / 2, yt, bw, Math.max(1, yb - yt)); });
  let out = cv; if (o.photo) { const sc = 1.3, c2 = document.createElement('canvas'); c2.width = Math.round(W0 * sc); c2.height = Math.round(H0 * sc); const h2 = c2.getContext('2d'); h2.filter = 'blur(0.6px)'; h2.drawImage(cv, 0, 0, c2.width, c2.height); h2.filter = 'none';
    const id = h2.getImageData(0, 0, c2.width, c2.height), D = id.data; for (let i = 0; i < D.length; i += 4) { const nz = (Math.random() - .5) * 14; for (let c = 0; c < 3; c++) D[i + c] = Math.max(0, Math.min(255, D[i + c] * (dark ? 1.1 : .96) + (dark ? 10 : 0) + nz)); } h2.putImageData(id, 0, 0); out = c2; o.sc = sc; }
  const sc = o.sc || 1, piv = L.map((t, k) => { const gi = Math.floor(t / tf) - g0, up = k ? R.pr[t] > R.pr[L[k - 1]] : R.pr[t] > R.pr[L[1]]; return { x: (xOf(gi) + .5) * sc - .5, hl: up ? 'h' : 'l' }; });
  return { url: out.toDataURL(o.photo ? 'image/jpeg' : 'image/png', .8), piv, kids: R.tree.kids ? R.tree.kids.map(x => x.key) : [], z: PGKOF[o.key], tf, n: C.length };
};

module.exports = { GEN };
if (require.main === module) (async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0; const tot = { j: 0, w: 0, fa: 0, mj: 0, mw: 0 };
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [], st = { charts: 0, waves: 0, judged: 0, fa: 0, mut: 0, mj: 0, mw: 0, rules: 0 };
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    for (let r = 0; r < N; r++) {
      const mut = r % 4 === 3, o = { key: mut ? 'imp' : KEYS[r % KEYS.length], mut, theme: Math.random() < .5 ? 'dark' : 'light', kind: Math.random() < .25 ? 'line' : 'candle', photo: Math.random() < .3 };
      const desc = (mut ? 'Impuls mit dreiteiliger Welle 3' : o.key) + ' [' + [o.theme, o.kind, o.photo ? 'Foto' : 'Screenshot'].join(', ') + ']';
      const G = await page.evaluate(GEN, o).catch(e => { fail('Generator: ' + e.message); return null; }); if (!G) continue;
      await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', { name: 'chart.' + (o.photo ? 'jpg' : 'png'), mimeType: o.photo ? 'image/jpeg' : 'image/png', buffer: Buffer.from(G.url.split(',')[1], 'base64') });
      await page.waitForSelector('#occv'); await page.waitForTimeout(100); await page.click('#ocall'); await page.click('#ocok'); /* ganzes Bild statt Zuschnitt-Vorschlag (seit 25.11.2026) */ await page.waitForSelector('#svg.pgsvg'); if (process.env.OCF) await page.evaluate(v => PGS.setOCF(+v), process.env.OCF);
      // große Welle an den bekannten Wendepunkten zählen: Spalte des Wendepunkts, Preis aus dem erkannten Verlauf (wie beim Einrasten)
      const set = await page.evaluate(([piv, z]) => { const I = PGS.img, P = I.path, f = I.crop.f; let ok = true;
        piv.forEach((q, k) => { const x0 = Math.round(q.x * f); let best = null; for (let x = Math.max(0, x0 - 3); x <= Math.min(I.w - 1, x0 + 3); x++) { const r = q.hl === 'h' ? P.hi[x] : P.lo[x]; if (r < 0) continue; if (!best || (q.hl === 'h' ? r < best.r : r > best.r)) best = { x, r }; }
          if (!best) { ok = false; return; } if (PGS.fadd(z, k, best.x + (k ? 0 : 0), I.h - best.r - .5) === null) ok = false; });
        return ok && PGS.FR().pts.length === piv.length; }, [G.piv, G.z]);
      if (!set) { if (process.env.DBG) console.log('   Zählung nicht gesetzt', name, desc); continue; }
      await page.evaluate(() => document.querySelector('#fchk').click()); await page.waitForTimeout(80);
      const res = await page.evaluate(() => ({ ...PGS.res, zz: document.querySelectorAll('#svg .pgzz').length, html: document.querySelector('#fb').textContent }));
      if (!res.ok) { st.rules++; if (process.env.DBG) console.log('   Hauptzählung nicht regelkonform (Pixel gerundet)', name, desc, res.errs); continue; }
      st.charts++; st.waves += G.piv.length - 1; st.judged += res.subJ;
      if (res.sub.length && res.zz !== res.sub.length) fail('gefundene Wendepunkte nicht gestrichelt gezeichnet');
      if (mut) { st.mut++; const w3 = res.sub.find(x => x.k === 3); if (res.subJ) st.mj++; if (w3) st.mw++; else if (process.env.DBG) console.log('   nicht erkannt', name, desc, JSON.stringify(res.sub)); res.sub.filter(x => x.k !== 3).forEach(x => { st.fa++; if (process.env.DBG) console.log('   Fehlalarm', name, desc, 'Welle', x.k, 'Muster', G.kids[x.k - 1], 'n=' + x.n); }); }
      else res.sub.forEach(x => { st.fa++; if (process.env.DBG) console.log('   Fehlalarm', name, desc, 'Welle', x.k, 'Muster', G.kids[x.k - 1], 'n=' + x.n, 'tf', G.tf, 'Kerzen', G.n); });
      if (res.sub.length && !/finde ich keine regelkonforme/.test(res.html)) fail('Text des Warnsignals fehlt');
    }
    const judgedNorm = st.judged; // beurteilte Wellen (inkl. manipulierter Charts, deren Welle 3 als Treffer zählt)
    const faRate = st.fa / Math.max(1, judgedNorm), jRate = st.judged / Math.max(1, st.waves), sens = st.mw / Math.max(1, st.mut);
    console.log(name + ': ' + st.charts + ' Charts, ' + st.waves + ' Wellen, beurteilt ' + st.judged + ' (' + (100 * jRate).toFixed(0) + ' %), Fehlalarme ' + st.fa + ' (' + (100 * faRate).toFixed(1) + ' %), dreiteilige Welle 3 erkannt ' + st.mw + '/' + st.mut + (st.rules ? ', ' + st.rules + ' Charts mit gerundeter Regelverletzung übersprungen' : ''));
    if (faRate > .05) fail('zu viele Fehlalarme'); if (jRate < .7) fail('zu wenige Wellen beurteilt'); tot.mj += st.mut; tot.mw += st.mw;
    if (errs.length) fail('Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  if (tot.mj >= 10) { console.log('alle Geräte: dreiteilige Welle 3 erkannt ' + tot.mw + '/' + tot.mj + ' (' + (100 * tot.mw / tot.mj).toFixed(0) + ' %)'); if (tot.mw < .15 * tot.mj) { bad++; console.log('  FEHLER: dreiteilige Welle 3 zu selten erkannt'); } }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
