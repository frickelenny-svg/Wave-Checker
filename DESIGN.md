# Wave-Checker: Gestaltung

Neu angelegt am 13.11.2026. Der Code verweist an einigen Stellen auf „DESIGN.md Abschnitt 11“; das ist der Abschnitt
„Chart in ‚Wie geht es weiter?‘“ unten.

## Grundlagen
- Farben nur über CSS-Variablen (`--accent`, `--up`, `--dn`, `--mut`, `--line`, `--surface`, `--ink` …), helles und dunkles Design.
- Knöpfe mindestens 40 px hoch (Touch), aktiver Zustand: Hintergrund `--accent`, Schrift weiß, `aria-pressed="true"`.
- Icons: Strich-Icons (SVG, `stroke="currentColor"`, Strichstärke 2, runde Enden), keine Füllflächen, keine Emojis in Bedienelementen.

## 11. Chart in „Wie geht es weiter?“
- Groß, länger als der Bildschirm, seitlich verschiebbar, zoombar (zwei Finger, Strg+Mausrad, −/+).
- Zeitachse wie bei TradingView: Mausrad streckt/staucht nur die Zeit, Ziehen an der Zeitachse ebenso (Mauszeiger `ew-resize`),
  Doppelklick/Doppeltipp auf die Zeitachse setzt die Breite zurück.
- Oben links: Zeiteinheiten W, D, 4h, 1h (`.pgtf`). Oben rechts: Zoom (`.pgzm`).
- Graue Zukunftszone rechts der gestrichelten Grenzlinie, Text „Ab hier: deine Prognose“.
- Beschriftung: groß ① im Kreis, mittel (1), klein 1 (kleiner, gedämpft). Kein Label für den Start einer Zählung.
  Gemeinsame Pivots: kleinste Welle innen am Punkt, größte außen.

### Werkzeugleiste (Schwer, seit 13.11.2026)
- Position: links im Chart, senkrecht unter den Zeiteinheiten (`.pgtool`, 8 px vom Rand, 56 px von oben), Abstand 4 px.
- Zwei Knöpfe, je 44 × 40 px, Strich-Icon 20 px:
  1. **Zeichnen**: Fadenkreuz (vier Striche mit Lücke in der Mitte). Mauszeiger im Chart: `crosshair`.
  2. **Auswählen**: Pfeil (Umriss). Mauszeiger: `default`, über einem Punkt `move`.
- Aktives Werkzeug blau hervorgehoben (wie aktive Zeiteinheit). Tooltip mit Tastenkürzel: „Zeichnen (C)“, „Auswählen (V)“.
- Nur im Schwer-Modus und nur, solange noch nicht geprüft wurde.
- Erster Besuch: ein Satz Hinweis über dem Chart mit „OK“-Knopf (`.pgmh`), danach nie wieder.
