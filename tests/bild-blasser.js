// Test „Eigenen Chart prüfen“: Regler „Bild blasser“ 0–100 % (seit 23.11.2026, Lenny).
// Aufruf im Repo-Ordner: node tests/bild-blasser.js   (Playwright nötig; PWCH=msedge bzw. PWCH=chrome). Handy (iPhone) und PC (Maus), helles und dunkles Design.
// Je Stufe 0 / 50 / 100 %: Deckkraft der weißen Fläche, bei 100 % weiße Chartfläche (auch dunkel), Labels/Linien/Verlauf mit Kontrast ≥ 4,5:1 auf Weiß,
// „Erkannten Verlauf zeigen“ wird bei 100 % eingeschaltet, Verlauf auch im Ergebnis, Export-Bild nutzt die Einstellung, Einstellung bleibt nach Neuladen.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8794;
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(s); });
const DEV = [['Handy', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }], ['PC', { viewport: { width: 1366, height: 800 } }]];
// regelkonformer Impuls als dunkle bzw. helle Linie (TradingView-Stil)
const MKC = theme => { const P = [0, 34, 24, 64, 52, 100], T = [0, 30, 45, 95, 110, 160], W0 = 1000, H0 = 560, dark = theme === 'dark';
  const xOf = t => 30 + t / 160 * (W0 - 60), yOf = p => 30 + (108 - p) / 116 * (H0 - 60);
  const cv = document.createElement('canvas'); cv.width = W0; cv.height = H0; const g = cv.getContext('2d'); g.fillStyle = dark ? '#131722' : '#ffffff'; g.fillRect(0, 0, W0, H0);
  g.strokeStyle = dark ? '#1f2330' : '#f0f3fa'; for (let y = 50; y < H0; y += 80) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W0, y + .5); g.stroke(); }
  g.strokeStyle = '#2962FF'; g.lineWidth = 2.5; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(xOf(T[i]), yOf(p)) : g.moveTo(xOf(T[i]), yOf(p))); g.stroke();
  return { url: cv.toDataURL('image/png'), piv: P.map((p, k) => ({ x: xOf(T[k]), hl: k % 2 ? 'h' : 'l' })) }; };
// Kontrast nach WCAG
const LUM = `const lum=c=>{const m=c.match(/[\\d.]+/g).map(Number),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])},con=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};`;

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch(process.env.PWCH ? { channel: process.env.PWCH, headless: true } : { headless: true }); let bad = 0, n = 0;
  for (const [name, opt] of DEV.filter(d => !process.env.NUR || d[0] === process.env.NUR)) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ ...opt, acceptDownloads: true, colorScheme: theme }), page = await ctx.newPage(), errs = [], d = name + ' ' + theme;
    const fail = m => { bad++; console.log('  FEHLER ' + d + ': ' + m); }, ok = (c, m) => { n++; if (!c) fail(m); };
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/'); await page.evaluate(() => { localStorage.setItem('waveChecker.guide', '1'); sessionStorage.setItem('waveChecker.intro', '1'); localStorage.setItem('waveChecker.pgTools', '1'); localStorage.setItem('waveChecker.ocFade', '0'); }); await page.reload();
    const G = await page.evaluate(MKC, theme);
    const open = async () => { await page.evaluate(() => ownChart()); await page.waitForSelector('#ocfile', { state: 'attached' });
      await page.setInputFiles('#ocfile', { name: 'chart.png', mimeType: 'image/png', buffer: Buffer.from(G.url.split(',')[1], 'base64') });
      await page.waitForSelector('#occv'); await page.waitForTimeout(80); await page.click('#ocall'); await page.click('#ocok'); /* ganzes Bild statt Zuschnitt-Vorschlag (seit 25.11.2026) */ await page.waitForSelector('#svg.pgsvg'); };
    await open();
    // Zählung setzen (Impuls auf dem erkannten Verlauf)
    await page.evaluate(piv => { const I = PGS.img, P = I.path; piv.forEach((q, k) => { const x0 = Math.round(q.x * I.crop.f); let best = null;
      for (let x = Math.max(0, x0 - 3); x <= Math.min(I.w - 1, x0 + 3); x++) { const v = q.hl === 'h' ? P.hi[x] : P.lo[x]; if (v < 0) continue; if (!best || (q.hl === 'h' ? v < best.v : v > best.v)) best = { x, v }; }
      if (best) PGS.fadd('N', k, best.x, I.h - best.v - .5); }); }, G.piv);
    // Stufe setzen: 0 und 50 über den Wert, 100 mit echtem Tipp bzw. Klick an das rechte Ende des Reglers
    const setF = async v => { if (v === 100) { await page.$eval('#ocfr', e => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(100); const b2 = await page.locator('#ocfr').boundingBox();
        if (opt.hasTouch) await page.touchscreen.tap(b2.x + b2.width - 2, b2.y + b2.height / 2); else await page.mouse.click(b2.x + b2.width - 2, b2.y + b2.height / 2); await page.waitForTimeout(450); }
      else await page.$eval('#ocfr', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v); };
    const state = () => page.evaluate(new Function(LUM + `const pgc=document.querySelector('#pgc'),fd=document.querySelector('#ocfade'),cs=getComputedStyle(pgc),sh=document.querySelector('#ocsh');
      // seit 26.11.2026: Labels mit Farbfeld der Wellengröße (wt1–3) gegen dessen Füllung messen, sonst gegen Weiß
      const BGL={wt1:'rgb(30,94,255)',wt2:'rgb(111,151,255)',wt3:'rgb(201,216,255)'},bgOf=t=>{for(const k in BGL)if(t.classList.contains(k))return BGL[k];return'rgb(255,255,255)'};
      const txt=[...pgc.querySelectorAll('svg text')].filter(t=>t.getBBox().width>0).map(t=>[getComputedStyle(t).fill,bgOf(t)]),lin=[...pgc.querySelectorAll('svg .occ path')].map(e=>getComputedStyle(e).stroke);
      return{val:+document.querySelector('#ocfr').value,out:(document.querySelector('#ocfv')||{}).textContent,op:fd?+fd.getAttribute('opacity'):null,fdFill:fd&&fd.getAttribute('fill'),ocw:pgc.classList.contains('ocw'),bg:cs.backgroundColor,
       sh:sh?sh.checked:null,path:lin.length,txtMin:txt.length?Math.min(...txt.map(c=>con(c[0],c[1]))):99,pathCon:lin.length?Math.min(...lin.map(c=>con(c,'rgb(255,255,255)'))):99,nTxt:txt.length}`));
    // 0 %
    await setF(0); let s = await state();
    ok(s.op === 0 && !s.ocw && s.out === '0 %', '0 %: Deckkraft ' + s.op + ', weiß ' + s.ocw + ', Anzeige ' + s.out);
    ok(s.fdFill === '#FFFFFF', 'Blass-Fläche nicht weiß: ' + s.fdFill);
    // 50 %, Verlauf ausschalten
    await setF(50); await page.evaluate(() => { const c = document.querySelector('#ocsh'); if (c.checked) c.click(); }); s = await state();
    ok(s.op === .5 && !s.ocw && s.path === 0 && s.out === '50 %', '50 %: Deckkraft ' + s.op + ', weiß ' + s.ocw + ', Verlauf ' + s.path);
    if (theme === 'dark') ok(s.bg !== 'rgb(255, 255, 255)', '50 % dunkel: Chartfläche schon weiß');
    await page.screenshot({ path: path.join(process.env.SHOTS || require('os').tmpdir(), 'blass-' + name + '-' + theme + '-50.png') }).catch(() => {});
    // 100 %: weiß, Verlauf automatisch an, Kontrast
    await setF(100); s = await state();
    ok(s.val === 100 && s.op === 1 && s.ocw && s.bg === 'rgb(255, 255, 255)', '100 %: Wert ' + s.val + ', Deckkraft ' + s.op + ', Fläche ' + s.bg);
    ok(s.sh === true && s.path > 0, '100 %: Verlauf nicht automatisch eingeblendet (Kästchen ' + s.sh + ', Linien ' + s.path + ')');
    ok(s.nTxt > 0 && s.txtMin >= 4.5, '100 %: Kontrast der Labels ' + s.txtMin.toFixed(2) + ' (' + s.nTxt + ' Texte)');
    ok(s.pathCon >= 4.5, '100 %: Kontrast des Verlaufs ' + s.pathCon.toFixed(2));
    await page.screenshot({ path: path.join(process.env.SHOTS || require('os').tmpdir(), 'blass-' + name + '-' + theme + '-100.png') }).catch(() => {});
    // Ergebnis bei 100 %: Verlauf bleibt, Linien und Texte lesbar
    await page.evaluate(() => document.querySelector('#fchk').click()); await page.waitForTimeout(150); s = await state();
    ok(s.ocw && s.path > 0 && s.txtMin >= 4.5, 'Ergebnis 100 %: weiß ' + s.ocw + ', Verlauf ' + s.path + ', Kontrast ' + s.txtMin.toFixed(2));
    const lines = await page.evaluate(new Function(LUM + `return[...document.querySelectorAll('#svg line,#svg polyline')].map(e=>getComputedStyle(e).stroke).filter(c=>c&&c!=='none').map(c=>con(c,'rgb(255,255,255)'))`));
    ok(!lines.length || Math.min(...lines) >= 3, 'Ergebnis 100 %: Linien zu blass (' + Math.min(...lines).toFixed(2) + ')');
    // Export: Anteil weißer Pixel in der Chartfläche je Stufe
    const exp = async () => { await page.waitForTimeout(450); await page.evaluate(() => { PGS.lastPng = null; document.querySelector('#ocsave').click(); });
      await page.waitForFunction(() => PGS.lastPng, null, { timeout: 8000 });
      return page.evaluate(async () => { const b = await createImageBitmap(PGS.lastPng), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const g = c.getContext('2d'); g.drawImage(b, 0, 0);
        const h = Math.round(b.height * .5), D = g.getImageData(0, 0, b.width, h).data; let w = 0, t = 0; for (let i = 0; i < D.length; i += 4 * 7) { t++; if (D[i] > 245 && D[i + 1] > 245 && D[i + 2] > 245) w++; } return w / t; }); };
    const w100 = await exp();
    ok(w100 > .85, 'Export 100 %: Chartfläche nicht weiß (' + (100 * w100).toFixed(0) + ' % weiß)');
    await page.$eval('#ocfr', e => { e.value = 0; e.dispatchEvent(new Event('input', { bubbles: true })); });
    s = await state(); ok(!s.ocw && s.path === 0, 'zurück auf 0 % im Ergebnis: weiß ' + s.ocw + ', Verlauf ' + s.path);
    const w0 = await exp();
    if (theme === 'dark') ok(w0 < .2, 'Export 0 % dunkel: zu viel Weiß (' + (100 * w0).toFixed(0) + ' %)');
    else ok(w0 < w100 + .01, 'Export 0 % hell: ' + (100 * w0).toFixed(0) + ' %');
    // Neuladen: Einstellung 100 % bleibt, Verlauf sichtbar
    await page.$eval('#ocfr', e => { e.value = 100; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await open(); s = await state();
    ok(s.val === 100 && s.ocw && s.path > 0 && s.sh === true, 'neues Bild mit gemerkten 100 %: Wert ' + s.val + ', weiß ' + s.ocw + ', Verlauf ' + s.path);
    if (errs.length) fail('Konsole: ' + errs.slice(0, 3).join(' | '));
    console.log(d + ': fertig'); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(bad ? bad + ' Fehler bei ' + n + ' Prüfungen' : 'Alles in Ordnung (' + n + ' Prüfungen)'); process.exit(bad ? 1 : 0);
})();
