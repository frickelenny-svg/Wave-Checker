// Massentest der Chart-Generatoren (seit 15.11.2026, Lenny). Aufruf im Repo-Ordner: node tests/generator.js [Charts je Muster und Fall]
// (Playwright nötig; anderer Browser: PWCH=chrome bzw. PWCH=msedge). Prüft mehrere tausend erzeugte Charts aller Muster und Modi:
//  1) Kein Dreieck verletzt DRE-7 (kontrahierend: jede Welle kürzer) bzw. DRE-8 (expandierend: jede Welle länger): Teilmuster „Dreieck“,
//     Hauptmuster, Musterbäume von „Wie geht es weiter?“. Die Prüffunktionen greifen (Gegenbeispiele werden erkannt).
//  2) „Fehler finden“ (Leicht und Schwer erzeugen gleich): Jede Aufgabe hat genau den gewollten Verstoß, Haupt- und Subwellen komplett geprüft.
//  3) Regelkonforme Charts (Durchzählen, Erkennen, Blitz, Subwellen zählen) haben keinen harten Verstoß.
//  4) Kein „0“ im Chart, alle Labels ganz im Bild (Handy und PC).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8796, N = +process.argv[2] || 150;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/json', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0;
  for (const [name, vp] of [['Handy', { width: 390, height: 844 }], ['PC', { width: 1366, height: 800 }]]) {
    const page = await browser.newPage({ viewport: vp }), errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); }); await page.reload();
    const r = await page.evaluate(N => {
      const out = { n: 0, fails: [] }, F = m => { if (out.fails.length < 40) out.fails.push(m); out.bad = (out.bad || 0) + 1; }, keys = Object.keys(PAT);
      const triOk = (k, f) => { const Q = PAT[k], u = norm(Q, f); return (!Q.struct || Q.struct(u)) && !hardFails(Q, u).length; };
      // Labels: kein „0“, alles im Bild
      const labs = where => { const svg = document.querySelector('#svg'); if (!svg) return; const vb = svg.viewBox.baseVal;
        svg.querySelectorAll('text').forEach(t => { const b = t.getBBox(); if (t.textContent.trim() === '0') F(where + ': Label „0“ im Chart');
          if (b.x < -0.5 || b.x + b.width > vb.width + 0.5) F(where + ': Label „' + t.textContent + '“ ragt über den Rand (' + Math.round(b.x) + '…' + Math.round(b.x + b.width) + ' von ' + vb.width + ')'); }); };
      // 1) Dreiecke
      for (let i = 0; i < N * 10; i++) { out.n++; const f = partF('Dreieck'); if (!triOk('trk', f)) F('Teil-Dreieck verletzt DRE-7: ' + f.map(x => x.toFixed(2)).join(' ')); }
      for (const k of ['trk', 'tre']) for (let i = 0; i < N * 5; i++) { out.n++; const v = genTri(k, null); if (!triOk(k, v)) F('Hauptmuster ' + k + ' verletzt ' + hardFails(PAT[k], norm(PAT[k], v))); }
      const walk = (nd, w) => { if (!nd) return; if (nd.key === 'trk' || nd.key === 'tre') { out.n++; if (!triOk(nd.key, nd.fr)) F('Wie geht es weiter? (' + w + '): Dreieck ' + nd.key + ' verletzt die Regel'); } (nd.kids || []).forEach(c => walk(c, w)); };
      for (const k of keys) for (let i = 0; i < N; i++) walk(pgNode(k, 1), k);
      // Gegenbeispiele: die Prüfung greift
      if (!hardFails(PAT.trk, [0, 100, 30, 80, 40, 90]).includes('DRE-7')) F('DRE-7 erkennt (e) länger als (d) nicht');
      if (triOk('trk', [0, 1, .5, .85, .65, 1])) F('das frühere Teil-Dreieck (Screenshot 15.11.2026) gilt als regelkonform');
      if (!hardFails(PAT.tre, [0, 30, -10, 60, -40, 20]).includes('DRE-8')) F('DRE-8 erkennt (e) kürzer als (d) nicht');
      // 2) Fehler finden: genau ein Verstoß
      const cnt = {};
      for (const k of keys) for (let i = 0; i < N; i++) { out.n++; findSub(k, i % 2 ? 'schwer' : 'leicht'); const S = FFS, f = roundFails(S.P, S.R), w = findWant(S.o);
        cnt[w] = (cnt[w] || 0) + 1;
        if (!findOk(S.P, S.R, S.o)) F('Fehler finden ' + k + ', gewollt ' + w + ', gefunden ' + f.join(' '));
        if (i < 6) labs('Fehler finden ' + k); }
      // 3) regelkonforme Charts
      for (const k of keys) for (let i = 0; i < N; i++) { out.n += 2; const P = PAT[k], R = makeRound(P, null), u = norm(P, R.piv.map(j => R.pr[j])), f = hardFails(P, u);
        if (f.length || (P.struct && !P.struct(u))) F('makeRound ' + k + ': ' + f);
        const S = makeSubRound(P), g = roundFails(P, S); if (g.length) F('Subwellen zählen ' + k + ': ' + g.join(' '));
        if (i < 3) { document.querySelector('#view').innerHTML = '<div class="chart">' + draw(R, [], true) + '</div>'; labs('Durchzählen ' + k);
          document.querySelector('#view').innerHTML = '<div class="chart">' + draw(R, R.piv, false) + '</div>'; labs('Durchzählen gesetzt ' + k); } }
      out.cnt = Object.keys(cnt).length; return out;
    }, N);
    errs.forEach(e => { bad++; console.log('  FEHLER ' + name + ' Browser: ' + e); });
    r.fails.forEach(m => console.log('  FEHLER ' + name + ': ' + m)); bad += r.bad || 0;
    console.log(name + ': ' + r.n + ' Charts/Teile geprüft, ' + r.cnt + ' verschiedene Fehlerarten, ' + (r.bad || 0) + ' Fehler');
    await page.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})();
