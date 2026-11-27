// Touch-Test für „Wie geht es weiter?“ Schwer (seit 14.11.2026, Lenny). Echte Tipps (Finger am Handy und iPad, Maus am PC).
// Aufruf im Repo-Ordner: node tests/schwer-touch.js [Runden je Gerät]   (Playwright nötig; anderer Browser: PWCH=chrome bzw. PWCH=msedge)
// Prüft:
//  1) Reihenfolge: Jeder Tipp setzt genau das nächste Label der Zählweise (1-2-3-4-5, A-B-C, A-B-C-D-E, W-X-Y, W-X-Y-X-Z), die Leiste
//     springt immer nur ein Label vor, fertig ist die Zählung erst nach dem letzten Label. Auch bei Tipps auf bestehende Pivots, bei
//     verschobener Seite und wenn zwischendurch ein späterer Knopf der Label-Leiste angetippt wird.
//  2) Gemeinsame Pivots: Antippen wählt zuerst die kleinste Welle, erneut die nächstgrößere; Tipp direkt auf ein Label wählt genau dieses;
//     Ziehen verschiebt nur das gewählte Label, die anderen bleiben stehen.
//  3) Eine Unterteilung, die das Ende der Welle darüber erreicht, muss vollständig sein; hört sie vorher auf, ist sie erlaubt.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8793, N = +process.argv[2] || 6;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': require('./typ')(p), 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const KEYS = { N: 'imp', ABC: 'zig', TRI: 'trk', WXY: 'dz', TZ: 'tz' };
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['iPad', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }], ['PC', { viewport: { width: 1366, height: 800 } }]];
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0;
  for (const [name, opt] of DEV) {
    const ctx = await browser.newContext(opt), page = await ctx.newPage(), touch = !!opt.hasTouch, errs = []; let checks = 0;
    const fail = m => { bad++; console.log('  FEHLER ' + name + ': ' + m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); }); await page.reload();
    const cdp = touch ? await ctx.newCDPSession(page) : null;
    const tap = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(40); };
    const btn = async sel => { await page.waitForTimeout(430); await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); const b = await page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel); await tap(b[0], b[1]); await page.waitForTimeout(380); }; // der Click eines Touch-Tipps kommt im Test-Browser verzögert
    // Stelle (Zeit t, Preis p) ins Bild holen, die Seite zufällig scrollen (auch ganz nach unten) und die Bildschirmkoordinaten liefern
    const at = (t, p) => page.evaluate(([t, p]) => { const S = PGS; S.show(t, p); const sv = document.querySelector('#svg'), dock = document.querySelector('.dock').getBoundingClientRect().top;
      for (let n = 0; n < 30; n++) { const mx = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, n % 5 === 0 ? mx : Math.random() * mx); const b = sv.getBoundingClientRect(), x = b.left + S.X(t), y = b.top + S.Y(p), e = document.elementFromPoint(x, y);
        if (y > 8 && y < dock - 8 && e && e.closest('#svg')) return { x, y }; } return null; }, [t, p]);
    const st = () => page.evaluate(() => { const F = PGS.FR(); return { pts: F.pts.map(q => ({ id: q.id, c: q.c, i: q.i, t: q.t, p: q.p })), i: F.i, ac: F.ac, sel: F.sel, md: F.md, toast: (document.querySelector('#toast.show') || {}).textContent || '',
      open: [...document.querySelectorAll('[data-fi]')].filter(b => !b.disabled).map(b => +b.dataset.fi) }; });
    for (let r = 0; r < N; r++) for (const z of Object.keys(KEYS)) {
      await page.evaluate(k => { progn(k, 'schwer'); PGS.setTf(4); }, KEYS[z]);
      const info = await page.evaluate(() => { const S = PGS, R = S.R; return { cut: S.cut, L: R.mp.map(t => [t, R.pr[t]]), sub2: R.piv.filter(q => q.lev === 2 && q.w1 === 2).sort((a, b) => a.t - b.t).map(q => [q.t, q.p]) }; });
      const n = info.L.length - 1, tag = z + ' Runde ' + r + ': ';
      await btn('[data-fz="' + z + '"]');
      // ---- 1) Reihenfolge: Start, dann jedes Label einzeln ----
      let ok = true, c1 = null;
      for (let k = 0; k <= n && ok; k++) {
        const pos = await at(info.L[k][0], info.L[k][1]); if (!pos) { ok = false; break; }
        await tap(pos.x, pos.y); let s = await st(); const mine = s.pts.filter(q => c1 === null || q.c === c1); if (c1 === null && s.pts.length) c1 = s.pts[0].c; checks++;
        if (s.pts.length !== k + 1 || mine.length !== k + 1 || mine.some((q, j) => q.i !== j)) { fail(tag + 'nach Tipp ' + (k + 1) + ' Labels ' + s.pts.map(q => q.c + ':' + q.i).join(' ') + ' statt 0…' + k + (s.toast ? ' (Hinweis: ' + s.toast + ')' : '')); ok = false; break; }
        if (k < n && (s.ac !== c1 || s.i !== k + 1)) { fail(tag + 'Leiste steht nach Label ' + k + ' auf ' + s.i + ' (Zählung ' + s.ac + ')'); ok = false; break; }
        if (k === n && s.ac !== null) { fail(tag + 'Zählung nach dem letzten Label nicht fertig'); ok = false; }
        if (k < n && (s.open.length !== 1 || s.open[0] !== k + 1)) { fail(tag + 'Label-Leiste lässt Springen zu: frei sind ' + s.open.join(',')); ok = false; }
        // ein späterer Knopf der Label-Leiste wird angetippt (wie ein verrutschter Tipp): darf nichts ändern
        if (k < n - 1 && Math.random() < .5) { await page.evaluate(() => document.querySelector('.pgnx').scrollIntoView({ block: 'center' })); const b = await page.evaluate(j => { const r = document.querySelector('[data-fi="' + j + '"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, n);
          await tap(b[0], b[1]); const s2 = await st(); if (s2.i !== k + 1 || s2.ac !== c1 || s2.pts.length !== k + 1) { fail(tag + 'Tipp auf späteres Label in der Leiste ändert die Zählung (Leiste ' + s2.i + ')'); ok = false; } }
      }
      if (!ok) continue;
      // ---- Reihenfolge auf bestehenden Pivots: A-B-C von Pivot 1 der großen Welle über zwei Zwischenpunkte bis genau auf Pivot 2 ----
      if (info.sub2.length < 3) continue;
      await page.evaluate(() => PGS.setTf(1)); // Stundenchart: eng beieinander liegende Zwischenpunkte rasten getrennt ein
      await btn('[data-fz="ABC"]');
      const seq = [info.L[1], info.sub2[0], info.sub2[1], info.L[2]]; let c2 = null, ok2 = true;
      for (let k = 0; k < 4 && ok2; k++) { const pos = await at(seq[k][0], seq[k][1]); if (!pos) { ok2 = false; break; } await tap(pos.x, pos.y); const s = await st(), mine = s.pts.filter(q => q.c !== c1); if (mine.length) c2 = mine[0].c; checks++;
        if (mine.length !== k + 1 || mine.some((q, j) => q.i !== j || q.c !== c2)) { fail(tag + 'A-B-C auf bestehenden Pivots: nach Tipp ' + (k + 1) + ' Labels ' + mine.map(q => q.c + ':' + q.i).join(' ') + (s.toast ? ' (Hinweis: ' + s.toast + ')' : '')); ok2 = false; break; }
        if ((k === 0 || k === 3) && (mine[k].t !== seq[k][0] || mine[k].p !== seq[k][1])) { fail(tag + 'Tipp auf bestehenden Pivot setzt den Punkt nicht genau darauf'); ok2 = false; }
        if (k === 3 && s.ac !== null) { fail(tag + 'A-B-C nach C nicht fertig'); ok2 = false; } }
      if (!ok2) continue;
      // ---- 2) Gemeinsamer Pivot (Pivot 2: große Welle und C der kleineren Zählung) ----
      await btn('[data-md="sel"]');
      let s = await st(); const big = s.pts.find(q => q.c === c1 && q.i === 2), sm = s.pts.find(q => q.c === c2 && q.i === 3);
      let pos = await at(big.t, big.p); if (!pos) continue;
      await tap(pos.x, pos.y); await page.waitForTimeout(380); s = await st(); checks++; if (s.sel !== sm.id) { fail(tag + 'gemeinsamer Pivot: erster Tipp wählt nicht die kleinste Welle'); continue; }
      pos = await at(big.t, big.p); await tap(pos.x, pos.y); await page.waitForTimeout(380); s = await st(); if (s.sel !== big.id) { fail(tag + 'gemeinsamer Pivot: zweiter Tipp wählt nicht die nächstgrößere Welle'); continue; }
      // Tipp direkt auf ein Label
      for (const q of [big, sm, big]) { await at(big.t, big.p); const lb = await page.evaluate(id => { let b = document.querySelector('#svg').getBoundingClientRect(); const L = PGS.lbx().find(o => o.id === id); if (!L) return null;
          // Label ins Bild holen (seit 27.11.2026): at() hält nur den Punkt sichtbar, das äußere Label eines Stapels lag sonst manchmal über dem Bildrand;
          // der Tipp wurde dann still übersprungen, die kleine Welle blieb gewählt und das Ziehen griff sie (Fehlalarm „Label der kleineren mitbewegt“)
          { const d0 = document.querySelector('.dock').getBoundingClientRect().top, y = b.top + L.y; if (y < 40 || y > d0 - 40) { window.scrollBy(0, y - d0 / 2); b = document.querySelector('#svg').getBoundingClientRect(); } }
          const e = document.elementFromPoint(b.left + L.x, b.top + L.y), dock = document.querySelector('.dock').getBoundingClientRect().top; return [b.left + L.x, b.top + L.y, !!(e && e.closest('#svg')) && b.top + L.y < dock - 8 && b.top + L.y > 8, PGS.FR().md]; }, q.id);
        if (!lb) { if (q === big) fail(tag + 'Label der großen Welle am gemeinsamen Pivot nicht sichtbar'); continue; } /* kleine Zählung kann beim aktuellen Zoom ausgeblendet sein */ if (!lb[2]) { if (q === big) fail(tag + 'Label der großen Welle am gemeinsamen Pivot lässt sich nicht antippen (liegt unter einem Knopf)'); continue; } /* Label liegt unter einem Knopf am Chartrand */ /* große Welle: ohne diesen Tipp bliebe die kleine gewählt */ await tap(lb[0], lb[1]); await page.waitForTimeout(380); s = await st(); checks++; if (s.sel !== q.id) fail(JSON.stringify([lb, s.sel, s.md, q.id, sm.id, big.id]) + tag + 'Tipp direkt auf ein Label wählt nicht genau dieses (' + (q === sm ? 'kleine' : 'große') + ' Welle)'); }
      // Ziehen: nur das gewählte Label (hier die große Welle) bewegt sich
      pos = await at(big.t, big.p); if (!pos) continue; const pre = (await st()).pts, dx =pos.x > 200 ? -70 : 70, dy = pos.y > 300 ? -40 : 40;
      if (touch) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pos.x, y: pos.y }] }); for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pos.x + dx * i / 6, y: pos.y + dy * i / 6 }] }); for (let i = 0; i < 3; i++) { await page.waitForTimeout(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pos.x + dx, y: pos.y + dy }] }); } /* Finger ruht vor dem Loslassen: kein Schwung, sonst verschluckt der Test-Browser den nächsten Tipp */ await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300); }
      else { await page.mouse.move(pos.x, pos.y); await page.mouse.down(); await page.mouse.move(pos.x + dx, pos.y + dy, { steps: 6 }); await page.mouse.up(); }
      s = await st(); checks++; const b2 = s.pts.find(q => q.id === big.id), s2 = s.pts.find(q => q.id === sm.id);
      if (s2.t !== sm.t || s2.p !== sm.p) fail(tag + 'Ziehen der großen Welle hat das Label der kleineren mitbewegt');
      if (b2.t === big.t && b2.p === big.p) fail(tag + 'das gewählte Label ließ sich nicht verschieben');
      if (s.pts.some(q => { const o = pre.find(x => x.id === q.id); return q.id !== big.id && (o.t !== q.t || o.p !== q.p); })) fail(tag + 'Ziehen hat weitere Punkte bewegt');
    }
    // ---- 3) Unterteilung am Ende der Welle darüber muss vollständig sein ----
    for (let r = 0; r < N * 3; r++) {
      const res = await page.evaluate(() => { progn('imp', 'schwer'); const S = PGS, R = S.R, L = R.mp; let k = 0; for (let j = 1; j <= S.cut; j++) if (PGKOF[R.tree.kids[j - 1].key] === 'N') { k = j; break; } if (!k) return null;
        const sub = R.piv.filter(q => q.lev === 2 && q.w1 === k).sort((a, b) => a.t - b.t); if (sub.length !== 5) return null;
        const build = how => { { const F = S.FR(); F.pts.length = 0; F.cm = {}; F.ac = null; F.i = 0; F.done = false; F.err = {}; F.errs = []; S.m.done = false; } let c; for (let j = 0; j <= S.cut + 1; j++) { const x = S.fadd('N', j, L[j], R.pr[L[j]], j ? c : 'neu'); if (!j) c = x; }
          let d; d = S.fadd('N', 0, L[k - 1], R.pr[L[k - 1]], 'neu'); // Start der Unterteilung am Start von Welle k
          if (how === 'kurz3') { S.fadd('N', 1, sub[0].t, sub[0].p, d); S.fadd('N', 2, sub[1].t, sub[1].p, d); S.fadd('N', 3, L[k], R.pr[L[k]], d); } // Label 3 genau auf dem Ende der Welle
          else if (how === 'offen') { S.fadd('N', 1, sub[0].t, sub[0].p, d); S.fadd('N', 2, sub[1].t, sub[1].p, d); S.fadd('N', 3, sub[2].t, sub[2].p, d); } // hört vorher auf
          else sub.forEach((q, j) => S.fadd('N', j + 1, q.t, q.p, d)); // vollständig
          document.querySelector('#fchk').click(); const F = S.FR(); return { fb: document.querySelector('#fb').textContent.slice(0, 160), need: !!(F.errs || []).length && !F.done && F.errs.some(e => /braucht noch/.test(e.msg || '')), done: F.done, lev: S.levels()[d] }; };
        return { kurz3: build('kurz3'), offen: build('offen'), voll: build('voll') }; });
      if (!res) continue; checks++;
      if (res.kurz3.lev !== 2) fail('Unterteilung nicht als mittlere Welle erkannt');
      if (!res.kurz3.need || res.kurz3.done) fail('Unterteilung endet mit Label 3 am Ende der Welle und wird nicht beanstandet: ' + res.kurz3.fb);
      if (!/braucht noch Welle \(4\) und \(5\)/.test(res.kurz3.fb) && res.kurz3.need && !/weitere Stelle/.test(res.kurz3.fb)) fail('Hinweis nennt die fehlenden Wellen nicht: ' + res.kurz3.fb);
      if (res.offen.need) fail('angefangene Unterteilung (hört vor dem Ende auf) wird beanstandet: ' + res.offen.fb);
      if (res.voll.need || !res.voll.done) fail('vollständige Unterteilung wird nicht angenommen: ' + res.voll.fb);
    }
    console.log(name.padEnd(6), checks, 'Prüfschritte,', errs.length, 'Konsolenfehler', errs.slice(0, 2).join(' | ')); if (errs.length) bad++;
    await ctx.close();
  }
  await browser.close(); server.close(); console.log(bad ? bad + ' Fehler' : 'Alles in Ordnung'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ABBRUCH', e); process.exit(1); });
