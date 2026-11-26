// Inhaltstyp für die kleinen Test-Server der Playwright-Tests (seit 26.11.2026, Lenny).
// Seit der Aufteilung von index.html in css/ und js/ muss der Server Skripte und Styles mit dem richtigen Typ schicken,
// sonst lädt der Browser die Styles nicht (strenge Prüfung im Standardmodus).
const TYP = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'
};
module.exports = p => TYP[(p.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase()] || 'application/octet-stream';
