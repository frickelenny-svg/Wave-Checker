// Test „Fünf Wellengrößen“ (seit 27.11.2026, Lenny). Aufruf im Repo-Ordner: node tests/wellengroessen.js [Runden je Gerät]
// (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy (iPhone), iPad (Touch), PC (Maus). „Wie geht es weiter?“ Schwer und Leicht.
// Prüft:
//  1) Schreibweise pgTxt für alle Größen: ① Ⓐ (Kreis), (1) (A), 1 A, (i) (a), i a; Korrekturen auf Größe 2 und 3 großgeschrieben.
//  2) Zählungen mit 1 bis 5 Größen in zufälliger Reihenfolge: Zählweise, Welle der Unterteilung und Weg (Start in der Welle über PGS.fadd
//     bzw. Welle auswählen + Zählweise antippen) zufällig, auch mehrere Unterteilungen je Zählung. PGS.levels() = erwartete Größe, Labels im
//     Chart in der Schreibweise ihrer Größe (Klasse wtL, Text), Punkte in der Farbe ihrer Größe (wptL).
//  3) Größe 6 geht nicht: Start in einer Welle der Größe 5 und „Welle auswählen + Zählweise“ geben den Hinweis
//     „Mehr als fünf Wellengrößen werden nicht unterstützt“ und setzen nichts; die Auswahl einer Welle der Größe 5 zeigt denselben Hinweis.
//  4) Löschen einer mittleren Größe: Unterteilungen rücken eine Größe auf (Labels neu), die anderen bleiben; Rückgängig stellt alles her.
//  5) Zoom-Staffelung: Beim Hineinzoomen erscheinen die Größen von groß nach klein (sichtbar ist immer 1 … k), nie verschwindet beim
//     Hineinzoomen eine; ganz hineingezoomt an der feinsten Zählung sind alle fünf Größen zu sehen.
//  6) Kontrast Schrift/Füllung ≥ 4,5:1 für alle Größen (Chart und Legende), Füllfarben laut DESIGN.md.
//  7) Legende: fünf Einträge „① sehr groß · (1) groß · 1 mittel · (i) klein · i sehr klein“; Handy eingeklappt, Tipp klappt auf; iPad/PC offen.
//  8) Leicht: Labels der Größe 2 und 3 großgeschrieben, Prognose-Punkte (A)/(B)/(C).
//  Keine Fehler in der Konsole.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8814, N = +process.argv[2] || 4;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': require('./typ')(p), 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
const FILL = ['', 'rgb(30, 94, 255)', 'rgb(74, 125, 255)', 'rgb(122, 158, 255)', 'rgb(169, 193, 255)', 'rgb(212, 225, 255)'];
const SEQ = { N: ['0', '1', '2', '3', '4', '5'], ABC: ['0', 'A', 'B', 'C'], TRI: ['0', 'A', 'B', 'C', 'D', 'E'], WXY: ['0', 'W', 'X', 'Y'], TZ: ['0', 'W', 'X', 'Y', 'X', 'Z'] };
const ROM = { 1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v' };
// erwartete Schreibweise (unabhängig von der App aufgeschrieben); Größe 1 steht als Zeichen im Kreis
const TXT = (lev, l) => { const r = ROM[l] || l.toLowerCase(); return lev === 1 ? l : lev === 2 ? '(' + l + ')' : lev === 3 ? l : lev === 4 ? '(' + r + ')' : r; };
const lum = c => { const m = c.match(/[\d.]+/g).map(Number), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
const con = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const pick = a => a[Math.floor(Math.random() * a.length)];
// 7) Reihenfolge frei (seit 27.11.2026): die Größe folgt aus der Verschachtelung, nicht aus der Reihenfolge des Zeichnens.
async function szenarien(page, name, ok) {
  const run = (code) => page.evaluate(code);
  const res = await page.evaluate(() => {
    const out = {}; const ROMX = ['', 'i', 'ii', 'iii', 'iv', 'v'];
    const fresh = () => { progn('imp', 'schwer'); PGS.setTf(1); const c0 = PGS.R.mp[PGS.cut]; return c0; };
    const P = t => PGS.R.c[Math.max(0, Math.min(PGS.R.c.length - 1, Math.round(t)))];
    // Zählung über die Zeiten ts als neue Zählung setzen; liefert ihre Nummer (oder null)
    const add = (z, ts) => { const F = PGS.FR(); F.ac = null; F.i = 0; F.md = 'draw'; const c = PGS.fadd(z, 0, ts[0], P(ts[0]), 'neu'); if (c == null) return null; for (let j = 1; j < ts.length; j++)PGS.fadd(z, j, ts[j], P(ts[j])); return c; };
    const ev = (a, b, n) => { const o = []; for (let j = 0; j <= n; j++)o.push(Math.round(a + (b - a) * j / n)); return o; };
    const labs = c => { const F = PGS.FR(), qs = F.pts.filter(x => x.c === c && x.i > 0); F.md = 'sel'; F.sel = qs[0].id; F.pw = null; const lv = PGS.levels()[c], o = new Set();
      qs.forEach(x => { PGS.show(x.t, x.p); document.querySelectorAll('#svg text.lab.wt' + lv).forEach(e => o.add(e.textContent)); }); F.sel = null; F.md = 'draw'; return [...o].sort().join(' '); };
    const task = () => (document.querySelector('.task') || {}).textContent || '';
    // a) erst Subwellen, dann die Welle darüber (Start vor bzw. genau am Start der Subwellen)
    for (const same of [false, true]) { const c0 = fresh(), a = Math.round(c0 * .2), b = Math.round(c0 * .4);
      const A = add('N', ev(a, b, 5)), lvA0 = PGS.levels()[A], tsB = [same ? a : Math.round(c0 * .1), b, ...ev(b, c0 - 5, 4).slice(1)], B = add('N', tsB);
      out['sub-dann-gross' + (same ? '-gleicherStart' : '')] = { lv: PGS.levels(), A, B, lvA0, labA: labs(A), labB: labs(B), task: task() }; }
    // b) erst groß, dann klein
    { const c0 = fresh(), G = add('ABC', ev(5, c0 - 5, 3)), F = PGS.FR(), g = F.pts.filter(x => x.c === G).sort((x, y) => x.t - y.t), K = add('N', ev(g[0].t, g[1].t, 5));
      out['gross-dann-klein'] = { lv: PGS.levels(), A: K, B: G, labA: labs(K) }; }
    // c) gemischt über drei Größen: mittel, dann klein (in Welle 2 der mittleren), dann groß (mittlere in Welle 1 der großen)
    { const c0 = fresh(), m0 = Math.round(c0 * .1), m1 = Math.round(c0 * .5), M = add('N', ev(m0, m1, 5)), ms = ev(m0, m1, 5), K = add('ABC', ev(ms[1], ms[2], 3)), G = add('N', [m0, m1, ...ev(m1, c0 - 5, 4).slice(1)]);
      out['gemischt'] = { lv: PGS.levels(), G, M, K, labM: labs(M), labK: labs(K), labG: labs(G) }; }
    // c2) klein, groß, dann mittel: die mittlere schiebt sich zwischen beide
    { const c0 = fresh(), m0 = Math.round(c0 * .1), m1 = Math.round(c0 * .5), ms = ev(m0, m1, 5), K = add('ABC', ev(ms[1], ms[2], 3)), G = add('N', [m0, m1, ...ev(m1, c0 - 5, 4).slice(1)]), lvK1 = PGS.levels()[K], M = add('N', ms);
      out['klein-gross-mittel'] = { lv: PGS.levels(), G, M, K, lvK1 }; }
    // d) teilweise Überschneidung: B beginnt in Welle 2 von A und läuft über das Ende von A hinaus
    { const c0 = fresh(), as = ev(Math.round(c0 * .1), Math.round(c0 * .5), 5), A = add('N', as), B = add('ABC', [Math.round((as[1] + as[2]) / 2), as[3], Math.round(c0 * .6), Math.round(c0 * .7)]);
      out['teilweise'] = { lv: PGS.levels(), A, B, note: (document.querySelector('.pgconf') || {}).textContent || '' }; }
    // e) manuelle Korrektur: Größer / Kleiner
    { const c0 = fresh(), G = add('N', ev(5, c0 - 5, 5)), F = PGS.FR(), g = F.pts.filter(x => x.c === G).sort((x, y) => x.t - y.t), K = add('N', ev(g[0].t, g[1].t, 5)), kk = F.pts.filter(x => x.c === K).sort((x, y) => x.t - y.t), KK = add('ABC', ev(kk[0].t, kk[1].t, 3));
      const sel = c => { const q = F.pts.find(x => x.c === c && x.i > 0); F.ac = null; F.md = 'sel'; F.sel = q.id; F.pw = null; document.querySelector('[data-md="sel"]').click(); const b = document.querySelector('#fbig'), s = document.querySelector('#fsmall'); return { big: b && !b.disabled, small: s && !s.disabled }; };
      const r = { lv0: PGS.levels(), G, K, KK }; r.btnG = sel(G); r.btnK = sel(K); document.querySelector('#fbig').click(); r.lvBig = PGS.levels(); r.noteBig = !!document.querySelector('.pgconf');
      sel(K); document.querySelector('#fsmall').click(); r.lvBack = PGS.levels(); r.btnKK = sel(KK); document.querySelector('#fsmall').click(); r.lvSmall = PGS.levels(); r.labKK = labs(KK); out['hand'] = r; }
    // f) Prüfen über alle fünf Größen: große Zählung bis in die Zukunftszone, darin vier Ebenen; Kurs frei gewählt, also Regelbrüche auf vielen Ebenen
    { const c0 = fresh(), G = add('N', [...ev(5, c0 - 5, 4), c0 + 60]), F = PGS.FR(); let par = G;
      for (let L = 2; L <= 5; L++) { const g = F.pts.filter(x => x.c === par).sort((x, y) => x.t - y.t); par = add('N', ev(g[0].t, g[1].t, 5)); }
      const lv = PGS.levels(), b = document.querySelector('#fchk'), en = b && !b.disabled; let err = null; try { b.click(); } catch (e) { err = e.message; }
      out['pruefen'] = { lv, en, err, fb: (document.querySelector('#fb') || {}).textContent || '', errs: (F.errs || []).map(e => e.msg || '') }; }
    return out; });
  const L = res, d = name + ' Reihenfolge: ';
  for (const k of ['sub-dann-gross', 'sub-dann-gross-gleicherStart']) { const x = L[k]; ok(x.lvA0 === 1 && x.lv[x.B] === 1 && x.lv[x.A] === 2, d + k + ': Größen ' + JSON.stringify(x.lv) + ' (Subwellen vorher ' + x.lvA0 + ')');
    ok(x.labA === '(1) (2) (3) (4) (5)' && x.labB === '1 2 3 4 5', d + k + ': Labels umgestellt? Subwellen „' + x.labA + '“, darüber „' + x.labB + '“');
    ok(/Verschachtelung|wird größer, sobald/.test(x.task) && !/erste Zählung ist/.test(x.task), d + 'Hinweistext über dem Chart: ' + x.task.slice(0, 160)); }
  { const x = L['gross-dann-klein']; ok(x.lv[x.B] === 1 && x.lv[x.A] === 2 && x.labA === '(1) (2) (3) (4) (5)', d + 'erst groß, dann klein: ' + JSON.stringify(x.lv) + ' ' + x.labA); }
  { const x = L['gemischt']; ok(x.lv[x.G] === 1 && x.lv[x.M] === 2 && x.lv[x.K] === 3, d + 'gemischt (mittel, klein, groß): ' + JSON.stringify(x.lv));
    ok(x.labG === '1 2 3 4 5' && x.labM === '(1) (2) (3) (4) (5)' && x.labK === 'A B C', d + 'gemischt Labels: ' + [x.labG, x.labM, x.labK].join(' | ')); }
  { const x = L['klein-gross-mittel']; ok(x.lvK1 === 2 && x.lv[x.G] === 1 && x.lv[x.M] === 2 && x.lv[x.K] === 3, d + 'klein, groß, mittel: ' + JSON.stringify(x.lv) + ' (klein nach groß: ' + x.lvK1 + ')'); }
  { const x = L['teilweise']; ok(x.lv[x.A] === x.lv[x.B] && /überschneiden sich nur teilweise/.test(x.note), d + 'teilweise Überschneidung: ' + JSON.stringify(x.lv) + ' Hinweis „' + x.note.slice(0, 80) + '“'); }
  { const x = L['pruefen'], lv = Object.values(x.lv).sort().join(''); ok(lv === '12345' && x.en && !x.err && x.fb.length > 20, d + 'Prüfen mit fünf Größen: Größen ' + lv + ', Knopf ' + x.en + ', Fehler ' + x.err + ', Text ' + x.fb.slice(0, 100));
    ok(x.errs.some(m => /((i|ii|iii|iv|v))|(^|[^a-z(])(ii|iii|iv)([^a-z)]|$)/.test(m.replace(/<[^>]*>/g, ''))), d + 'Prüfen nennt keine Welle der Größe 4/5: ' + x.errs.slice(0, 3).join(' | ').replace(/<[^>]*>/g, '').slice(0, 300)); }
  { const x = L['hand'];
    ok(x.lv0[x.G] === 1 && x.lv0[x.K] === 2 && x.lv0[x.KK] === 3, d + 'Hand: Ausgang ' + JSON.stringify(x.lv0));
    ok(!x.btnG.big && !x.btnG.small, d + 'Hand: einzige größte Zählung, Größer/Kleiner müssen gesperrt sein ' + JSON.stringify(x.btnG));
    ok(x.btnK.big && x.btnK.small, d + 'Hand: mittlere Zählung, beide Knöpfe frei ' + JSON.stringify(x.btnK));
    ok(x.lvBig[x.K] === 1 && x.lvBig[x.KK] === 2 && x.lvBig[x.G] === 1 && x.noteBig, d + 'Hand: Größer ' + JSON.stringify(x.lvBig) + (x.noteBig ? '' : ' ohne Hinweis zur Überschneidung'));
    ok(JSON.stringify(x.lvBack) === JSON.stringify(x.lv0), d + 'Hand: Kleiner zurück ' + JSON.stringify(x.lvBack));
    ok(x.btnKK.big && x.btnKK.small && x.lvSmall[x.KK] === 4 && x.labKK === '(a) (b) (c)', d + 'Hand: Kleiner auf Größe 4 '
 + JSON.stringify(x.lvSmall) + ' ' + x.labKK); }
}
(async () => {
  await new Promise(r => server.listen(PORT, r)); const T0 = Date.now();
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0, STAG = 0; // STAG: Runden, in denen ganz herausgezoomt noch nicht alle Größen sichtbar sind
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), errs = [], touch = !!opt.hasTouch;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    // 1) Schreibweise
    const tx = await page.evaluate(SEQ => { const o = {}; for (let l = 1; l <= 5; l++)Object.values(SEQ).forEach(s => s.slice(1).forEach(x => o[l + x] = pgTxt(l, x))); return o; }, SEQ);
    let tbad = Object.entries(tx).filter(([k, v]) => TXT(+k[0], k.slice(1)) !== v); ok(!tbad.length, 'Schreibweise falsch: ' + tbad.slice(0, 6).map(([k, v]) => k + '→' + v).join(' '));
    // Labels, Punkte und Stand der Zählungen im Chart lesen (svg neu zeichnen; optional eine Zählung auswählen, damit sie sichtbar ist)
    const look = () => page.evaluate(() => { const F = PGS.FR(), lv = PGS.levels(), tx = {};
      document.querySelectorAll('#svg text.lab').forEach(e => { const m = e.getAttribute('class').match(/wt(\d)/); if (m) (tx[m[1]] = tx[m[1]] || []).push(e.textContent); });
      const pc = {}; document.querySelectorAll('#svg circle[class^="wpt"]').forEach(e => { const m = e.getAttribute('class').match(/wpt(\d)/); pc[m[1]] = getComputedStyle(e).fill; });
      return { lv, tx, pc, toast: (document.querySelector('#toast.show') || {}).innerHTML || '', pts: F.pts.map(q => ({ id: q.id, c: q.c, i: q.i, t: q.t, z: q.z })) }; });
    // Punkt (Ende von Welle k, 0 = erster Punkt mit Label) der Zählung c im Werkzeug Auswählen wählen, wie nach einem Tipp; liefert den Text der Auswahl-Karte
    const selUI = (c, k) => page.evaluate(([c, k]) => { const F = PGS.FR(), q = k ? F.pts.find(x => x.c === c && x.i === k) : F.pts.find(x => x.c === c && x.i > 0); F.ac = null; F.i = 0; F.md = 'sel'; F.sel = q.id; F.pw = { c, k: Math.max(1, q.i) };
      document.querySelector('[data-md="sel"]').click(); return (document.querySelector('.pgsel') || {}).textContent || ''; }, [c, k]);
    const RX = ['', /^([1-5]|[A-EWXYZ])$/, /^(([1-5]|[A-EWXYZ]))$/, /^([1-5]|[A-EWXYZ])$/, /^((i|ii|iii|iv|v|[a-ewxyz]))$/, /^(i|ii|iii|iv|v|[a-ewxyz])$/];
    const labelsOf = c => page.evaluate(c => { const F = PGS.FR(), qs = F.pts.filter(x => x.c === c && x.i > 0), q = qs[0]; F.md = 'sel'; F.sel = q.id; F.pw = null; F.ac = null; const lv = PGS.levels()[c], o = new Set(), all = [];
      qs.forEach(x => { PGS.show(x.t, x.p); document.querySelectorAll('#svg text.lab.wt' + lv).forEach(e => o.add(e.textContent)); document.querySelectorAll('#svg text.lab').forEach(e => { const m = e.getAttribute('class').match(/wt(d)/); if (m) all.push([+m[1], e.textContent]); }); });
      return { lv, o: [...o], all }; }, c);
    const labOk = (got, lev, z, tag, what) => { const exp = [...new Set(SEQ[z].slice(1).map(l => TXT(lev, l)))], hit = exp.filter(e => got.o.includes(e)).length, wrong = got.all.filter(([l, t]) => !RX[l].test(t));
      ok(got.lv === lev && hit >= Math.ceil(exp.length * .75) && !wrong.length, tag + what + ' (Größe ' + lev + ', ' + z + '): ' + got.o.join(' ') + ' – erwartet ' + exp.join(' ') + (wrong.length ? '; falsche Schreibweise: ' + wrong.slice(0, 4).map(x => x.join(':')).join(' ') : '')); };
    for (let r = 0; r < N; r++) {
      await page.evaluate(() => { progn('imp', 'schwer'); PGS.setTf(1); });
      const info = await page.evaluate(() => ({ c0: PGS.R.mp[PGS.cut], c: PGS.R.c.slice(0, PGS.R.mp[PGS.cut] + 1) }));
      const price = t => info.c[Math.max(0, Math.min(info.c.length - 1, Math.round(t)))];
      // Zählungen: S = {c, lev, z, ts (Zeiten der Punkte)}; Kind in Welle k (Label-Index des Endes) des Elternteils
      const counts = [], tag = name + ' Runde ' + r + ': ', depth = 1 + Math.floor(Math.random() * 5);
      const times = (a, b, z) => { const m = SEQ[z].length - 1, w = []; for (let j = 0; j < m; j++)w.push(j === 0 ? 3 : 1); const tot = w.reduce((x, y) => x + y), ts = [a]; let acc = 0;
        w.forEach(x => { acc += x; ts.push(Math.round(a + (b - a) * acc / tot)); }); ts[ts.length - 1] = b; return ts; }; // erste Welle 3-mal so lang wie die anderen (Platz für Unterteilungen)
      const addCount = async (z, ts, via) => { // via: null = neue Zählung (PGS.fadd 'neu'), sonst {c, k}: Welle auswählen + Zählweise antippen
        if (via) { await selUI(via.c, via.k); await page.evaluate(z => document.querySelector('[data-fz="' + z + '"]').click(), z);
          for (let j = 1; j < ts.length; j++) await page.evaluate(([z, j, t, p]) => PGS.fadd(z, j, t, p), [z, j, ts[j], price(ts[j])]);
        } else { const c = await page.evaluate(([z, t, p]) => { const F = PGS.FR(); F.ac = null; F.i = 0; F.md = 'draw'; return PGS.fadd(z, 0, t, p, 'neu'); }, [z, ts[0], price(ts[0])]);
          if (c == null) return null; for (let j = 1; j < ts.length; j++) await page.evaluate(([z, j, t, p]) => PGS.fadd(z, j, t, p), [z, j, ts[j], price(ts[j])]); }
        return page.evaluate(() => { const F = PGS.FR(); return F.pts[F.pts.length - 1].c; }); };
      // größte Zählung über fast den ganzen sichtbaren Teil, dann je Größe eine Unterteilung in einer zufälligen Welle des Elternteils
      const z1 = pick(Object.keys(SEQ)), ts1 = times(5, info.c0 - 5, z1), c1 = await addCount(z1, ts1, null); counts.push({ c: c1, lev: 1, z: z1, ts: ts1 });
      let par = counts[0];
      for (let L = 2; L <= depth; L++) {
        const k = Math.random() < .7 ? 1 : 1 + Math.floor(Math.random() * (par.ts.length - 1)), z = pick(Object.keys(SEQ)), a = par.ts[k - 1], b = par.ts[k];
        if (b - a < (SEQ[z].length - 1) * 2) break; const ts = times(a, b, z), via = Math.random() < .5 ? { c: par.c, k } : null;
        const c = await addCount(z, ts, via); const S = { c, lev: L, z, ts, via: !!via, k }; counts.push(S);
        // manchmal eine zweite Unterteilung derselben Größe in einer anderen Welle (beliebige Reihenfolge)
        if (Math.random() < .4 && par.ts.length > 2) { const k2 = k === par.ts.length - 1 ? k - 1 : k + 1, a2 = par.ts[k2 - 1], b2 = par.ts[k2], z2 = pick(['N', 'ABC']);
          if (b2 - a2 >= 12) { const ts2 = times(a2, b2, z2), c2 = await addCount(z2, ts2, Math.random() < .5 ? { c: par.c, k: k2 } : null); counts.push({ c: c2, lev: L, z: z2, ts: ts2, side: 1 }); } }
        par = S; }
      let s = await look();
      const want = {}; counts.forEach(S => want[S.c] = S.lev);
      ok(counts.every(S => s.lv[S.c] === S.lev), tag + 'Wellengrößen ' + JSON.stringify(s.lv) + ' statt ' + JSON.stringify(want) + ' (Zählweisen ' + counts.map(S => S.z + (S.via ? '/Auswahl' : '/Start') + ' W' + S.k).join(', ') + ')');
      // Labels je Zählung: Zählung auswählen (immer sichtbar), Texte ihrer Größe prüfen
      for (const S of counts) labOk(await labelsOf(S.c), S.lev, S.z, tag, 'Labels');
      await page.evaluate(() => { const F = PGS.FR(); F.sel = null; F.md = 'draw'; PGS.show(0); });
      s = await look();
      Object.entries(s.pc).forEach(([l, f]) => ok(f === FILL[l], tag + 'Punkt der Größe ' + l + ' hat Farbe ' + f));
      // 3) Größe 6: Start in Welle 1 der feinsten Zählung bzw. Auswahl + Zählweise
      const deep = counts.filter(S => S.lev === 5 && !S.side)[0];
      if (deep) {
        const before = s.pts.length, c6 = await page.evaluate(([t, p]) => { const F = PGS.FR(); F.ac = null; F.i = 0; F.md = 'draw'; return PGS.fadd('ABC', 0, t, p, 'neu'); }, [deep.ts[0], price(deep.ts[0])]);
        let s6 = await look(); ok(c6 == null && s6.pts.length === before && /Mehr als fünf Wellengrößen werden nicht unterstützt/.test(s6.toast), tag + 'Größe 6 per Start: ' + c6 + ', Hinweis „' + s6.toast.replace(/<[^>]*>/g, '') + '“');
        // Welle 1 der feinsten Zählung auswählen: Karte zeigt den Hinweis, Zählweise antippen setzt nichts
        const card = await selUI(deep.c, 1); ok(/Mehr als fünf Wellengrößen werden nicht unterstützt/.test(card), tag + 'Auswahl einer Welle der Größe 5 ohne Hinweis: ' + card.slice(0, 120));
        await page.evaluate(() => document.querySelector('[data-fz="ABC"]').click());
        s6 = await look(); ok(s6.pts.length === before && /Mehr als fünf Wellengrößen werden nicht unterstützt/.test(s6.toast), tag + 'Größe 6 per Auswahl + Zählweise: ' + (s6.pts.length - before) + ' neue Punkte, Hinweis „' + s6.toast.replace(/<[^>]*>/g, '') + '“');
      }
      // 4) Löschen einer mittleren Größe (3, sonst 2): Unterteilungen rücken auf, Rückgängig
      const mid = counts.find(S => S.lev === 3 && !S.side) || counts.find(S => S.lev === 2 && !S.side && depth > 2);
      if (mid) {
        const lv0 = (await look()).lv;
        await selUI(mid.c, 0);
        const has = await page.evaluate(() => !!document.querySelector('#fdel')); ok(has, tag + 'Knopf „Ganze Zählung löschen“ fehlt');
        if (has) {
          await page.evaluate(() => document.querySelector('#fdel').click());
          const s2 = await look(), desc = new Set(); let grow = true;
          while (grow) { grow = false; counts.forEach(S => { const P = counts.find(x => x.lev === S.lev - 1 && (x.c === mid.c || desc.has(x.c)) && x.ts[0] <= S.ts[0] && S.ts[S.ts.length - 1] <= x.ts[x.ts.length - 1]); if (P && !desc.has(S.c) && S.c !== mid.c && S.lev > mid.lev) { desc.add(S.c); grow = true; } }); }
          const exp = {}; counts.forEach(S => { if (S.c !== mid.c) exp[S.c] = desc.has(S.c) ? S.lev - 1 : S.lev; });
          ok(!(mid.c in s2.lv) && Object.entries(exp).every(([c, l]) => s2.lv[c] === l), tag + 'nach Löschen von Größe ' + mid.lev + ': ' + JSON.stringify(s2.lv) + ' statt ' + JSON.stringify(exp));
          // Labels der aufgerückten Zählungen in der neuen Schreibweise
          for (const c of desc) { const S = counts.find(x => x.c === c); labOk(await labelsOf(c), S.lev - 1, S.z, tag, 'aufgerückte Zählung'); }
          const und = await page.evaluate(() => { const b = document.querySelector('#fundel'); if (b) b.click(); return !!b; });
          const s3 = await look(); ok(und && JSON.stringify(s3.lv) === JSON.stringify(lv0), tag + 'Rückgängig stellt die Größen nicht her: ' + JSON.stringify(s3.lv) + ' statt ' + JSON.stringify(lv0));
        }
      }
      // 5) Zoom-Staffelung an der feinsten Zählung (Hauptzählung, ohne Auswahl)
      const fine = counts.filter(S => !S.side).pop();
      // je Zeiteinheit (W, D, 4h, 1h) ganz heraus, dann schrittweise hinein; innerhalb einer Zeiteinheit darf keine Größe verschwinden
      const zz = await page.evaluate(([t, p]) => { const F = PGS.FR(); F.sel = null; F.pw = null; F.ac = null; F.md = 'draw'; const out = [];
        for (const h of [168, 24, 4, 1]) { PGS.setTf(h); PGS.show(t, p); for (let k = 0; k < 30; k++)PGS.zoom(.6, PGS.X(t), PGS.Y(p)); const seen = [], lv = PGS.levels();
          for (let k = 0; k < 30; k++) { PGS.show(t, p); const v = PGS.vis(), o = new Set(); Object.keys(v).forEach(c => { if (v[c]) o.add(lv[c]); }); seen.push([...o].sort()); PGS.zoom(1.25, PGS.X(t), PGS.Y(p)); } out.push(seen); }
        return out; }, [fine.ts[1], price(fine.ts[1])]);
      const z = zz.flat(), maxLv = Math.max(...counts.map(S => S.lev)), pref = z.every(v => v.every((l, j) => l === j + 1)); let mono = true;
      zz.forEach(seen => { for (let j = 1; j < seen.length; j++)if (seen[j].length < seen[j - 1].length) mono = false; });
      ok(pref, tag + 'Staffelung: sichtbar nicht immer 1 … k: ' + z.map(v => v.join('')).join(' '));
      ok(mono, tag + 'beim Hineinzoomen verschwindet eine Größe: ' + z.map(v => v.join('')).join(' '));
      if (z[0].length < maxLv) STAG++; ok(z[z.length - 1].length === maxLv, tag + 'Zoom zeigt ganz hineingezoomt nicht alle Größen: ' + z.map(v => v.join('')).join(' ') + ' (Tiefe ' + maxLv + ')');
      if (r === 0) console.log(tag + 'Zoom-Staffelung (sichtbare Größen beim Hineinzoomen) ' + z.map(v => v.length).join(''));
    }
    // 6) Kontrast Schrift/Füllung je Größe (Elemente wie im Chart) und Legende
    const kont = await page.evaluate(() => { const o = []; for (let l = 1; l <= 5; l++) { const svg = document.querySelector('#svg'), g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = l === 1 ? '<circle class="pgc1 wlv1" r="10"/><text class="lab l1 wt1">1</text>' : '<rect class="wlv' + l + '" width="20" height="20"/><text class="lab wt' + l + '">1</text>'; svg.appendChild(g);
        o.push([l, getComputedStyle(g.firstChild).fill, getComputedStyle(g.lastChild).fill]); g.remove(); }
      const lg = [...document.querySelectorAll('.pglg .wlg')].map(e => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color]);
      const d = document.querySelector('details.pglg'); return { o, lg, txt: d ? d.textContent.replace(/\s+/g, ' ') : '', open: d && d.open }; });
    kont.o.forEach(([l, f, t]) => { ok(f === FILL[l], name + ': Füllung Größe ' + l + ' ist ' + f); ok(con(f, t) >= 4.5, name + ': Kontrast Größe ' + l + ' nur ' + con(f, t).toFixed(2)); });
    ok(kont.lg.length === 5 && kont.lg.every(([b, c], j) => b === FILL[j + 1] && con(b, c) >= 4.5), name + ': Legende Farben/Kontrast ' + JSON.stringify(kont.lg));
    ok(/Wellengrößen ?1 sehr groß · \(1\) groß · 1 mittel · \(i\) klein · i sehr klein/.test(kont.txt), name + ': Legendentext „' + kont.txt + '“');
    ok(kont.open === (name !== 'Handy'), name + ': Legende ' + (kont.open ? 'offen' : 'zu'));
    if (name === 'Handy') { await page.evaluate(() => document.querySelector('details.pglg summary').scrollIntoView({ block: 'center' })); const b = await page.evaluate(() => { const r = document.querySelector('details.pglg summary').getBoundingClientRect(); return [r.left + 20, r.top + r.height / 2]; });
      if (touch) await page.touchscreen.tap(b[0], b[1]); else await page.mouse.click(b[0], b[1]); await page.waitForTimeout(150);
      const o = await page.evaluate(() => { const d = document.querySelector('details.pglg'); return d.open && d.querySelector('.pglgl').getBoundingClientRect().height > 10 && document.documentElement.scrollWidth <= innerWidth; }); ok(o, name + ': Legende klappt per Tipp nicht auf (oder Seite zu breit)'); }
    // 7) Reihenfolge frei (Verschachtelung): Szenarien in SZ
    await szenarien(page, name, ok);
    // 8) Leicht: Großschreibung
    const lt = await page.evaluate(() => { progn('zig', 'leicht'); PGS.setTf(1); const o = { 2: [], 3: [] }; for (let k = 0; k < 6; k++) { PGS.zoom(1.5, 200, 200); PGS.show(PGS.R.mp[1]); document.querySelectorAll('#svg text.lab').forEach(e => { const m = e.getAttribute('class').match(/wt([23])/); if (m) o[m[1]].push(e.textContent); }); }
      return { o, pk: PGK.ABC.l.join(' ') }; });
    ok(lt.o[2].length && lt.o[2].every(t => /^\([0-9A-Z]\)$/.test(t)), name + ' Leicht: Größe 2 ' + [...new Set(lt.o[2])].join(' '));
    ok(lt.o[3].every(t => /^[0-9A-Z]$/.test(t)), name + ' Leicht: Größe 3 ' + [...new Set(lt.o[3])].join(' '));
    ok(lt.pk === '(A) (B) (C)', name + ' Leicht: Prognose-Punkte ' + lt.pk);
    ok(!errs.length, name + ': Konsole: ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await ctx.close();
  }
  if (!STAG) { bad++; console.log('  FEHLER: in keiner Runde fehlen herausgezoomt kleine Größen (keine Staffelung)'); } else console.log(STAG + ' Runden mit Staffelung (herausgezoomt weniger Größen sichtbar)');
  await browser.close(); server.close();
  console.log((bad ? bad + ' Fehler' : 'Alles in Ordnung (' + n + ' Prüfungen)') + ', ' + Math.round((Date.now() - T0) / 1000) + ' s'); process.exit(bad ? 1 : 0);
})();
