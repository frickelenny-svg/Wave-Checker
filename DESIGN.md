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
- Oben links: Zeiteinheiten W, D, 4h, 1h (`.pgtf`, klein: 34 × 30 px, Schrift 0,76 rem). Oben rechts: Zoom (`.pgzm`).
- Graue Zukunftszone rechts der gestrichelten Grenzlinie, Text „Ab hier: deine Prognose“.
- Beschriftung: groß ① im Kreis, mittel (1), klein 1 (kleiner, gedämpft). Kein Label für den Start einer Zählung.
  Gemeinsame Pivots: kleinste Welle innen am Punkt, größte außen.
- Gewähltes Label (Schwer, Auswählen, seit 14.11.2026): großes Label mit blauem Kreisrand (`--accent`, 2,6 px), mittleres und
  kleines mit blau hinterlegtem, abgerundetem Feld (Füllung 14 %, Rand 1,6 px). Am gemeinsamen Pivot ist immer nur ein Label gewählt.
- Label-Leiste (Schwer): Während eine Zählung läuft, ist nur das nächste Label aktiv, alle anderen Knöpfe sind gesperrt (nur Anzeige).

### Werkzeugleiste (Schwer, seit 13.11.2026)
- Position: links im Chart, senkrecht unter den Zeiteinheiten (`.pgtool`, 8 px vom Rand, 44 px von oben), Abstand 4 px.
- Zwei Knöpfe, je 34 × 30 px (seit 13.11.2026 kleiner, wie die Zeiteinheiten), Strich-Icon 15 px:
  1. **Zeichnen**: Fadenkreuz (vier Striche mit Lücke in der Mitte). Mauszeiger im Chart: `crosshair`.
  2. **Auswählen**: Pfeil (Umriss). Mauszeiger: `default`, über einem Punkt `move`.
- Aktives Werkzeug blau hervorgehoben (wie aktive Zeiteinheit). Tooltip mit Tastenkürzel: „Zeichnen (C)“, „Auswählen (V)“.
- Nur im Schwer-Modus und nur, solange noch nicht geprüft wurde.
- Erster Besuch: ein Satz Hinweis über dem Chart mit „OK“-Knopf (`.pgmh`), danach nie wieder.

## Eigenen Chart prüfen (seit 20.11.2026)
- Insel unten neben „Wie geht es weiter?“, Icon Bild (Rahmen, Sonne, Berg als Strich-Icon). Handy: Station in Welle 5.
- Hochladen: große Ablagefläche (`.ocdrop`, gestrichelter Rand `--line`, beim Darüberziehen `--accent`), darunter klein
  „Das Bild bleibt auf deinem Gerät“ und der Hinweistext (13 px, `--muted`).
- Zuschneiden: Bild auf Fläche wie der Chart, außerhalb des Rahmens Navy 55 % abgedunkelt, Rahmen 2 px `--accent`, weiße Eck-Griffe.
- Zählen: wie Schwer, aber Werkzeuge waagerecht links und Zoom rechts in einem 54 px hohen Streifen über dem Bild (nichts verdeckt
  das Bild). Bild unverzerrt; darüber Fläche in `--surface` (Regler „Bild blasser“ unter dem Chart, 0–85 %, Start 25 %), hellt im
  hellen Design auf und dunkelt im dunklen ab. Text-Labels mit Hintergrund (`.pglbg`: `--surface` 92 %, Rand `--line`, Ecken 6 px),
  große Labels wie immer im Kreis.
- Ergebnis: Befunde als `.rnote` mit Abzeichen (Regel, Warnsignal, Faustregel). Leiste unten: „Als Bild speichern“ (Hauptknopf),
  „Teilen“ (nur Handy/iPad), „Zählung ändern“, „Neues Bild“.
- Bild-Export (PNG, 2- bis 3-fach): Bild mit Labels und Linien, darunter Trennlinie, Fazit fett in `--ok` bzw. `--bad` mit ✓/✗,
  bis 6 Zeilen Details (14 px), Hinweis 11 px `--muted`, rechts unten „Wave Checker“ (12 px fett, `--accent-text`).

## Tutorial „So geht's“ (seit 18.11.2026)
- Knopf „So geht's“ mit „?“-Icon (Strich-Icon, Kreis mit Fragezeichen) oben rechts im Spielbildschirm jedes Modus, auf Höhe der
  Modus-Zeile (`.kick`), rund (Pille), Rand und Schrift `--accent`, mindestens 40 px hoch (`.tutbtn`). Blitz: in der Kopfzeile links
  neben „Abbrechen“. Die Modus-Zeile hält rechts immer Platz frei, damit nichts verrutscht.
- Erster Besuch eines Modus: Der Knopf pulsiert zweimal kurz (Ring in `--accent`), danach nie wieder. Kein Pop-up, kein Abdunkeln,
  solange man das Tutorial nicht selbst startet. Bei reduzierter Bewegung: kurz blau hinterlegt statt Puls.
- Während des Tutorials: Rest des Bildschirms leicht abgedunkelt (Navy 32 %, heller als der Wegführer), Ziel-Element mit blauem Rahmen
  ausgespart. Sprechblase wie beim Wegführer (`.gd-bub`): kleine Überschrift „So geht's · Modus“, Text (höchstens zwei Sätze),
  bei Handlungen „Jetzt du.“ in `--accent-text`, unten Schritt „2 / 5“, „Überspringen“ (Textknopf) und „Weiter“ bzw. „Los geht's“.
  Bei Handlungen gibt es kein „Weiter“: Es geht weiter, sobald man es selbst gemacht hat. Die Blase steht neben, unter oder über dem
  Ziel, immer ganz im Bild; passt sie nirgends, an den Bildschirmrand weg von der Tipp-Stelle.
- Hand: Strich-Icon mit weißer Füllung (Oberfläche) und Schatten, gleitet einmal zur Tipp-Stelle, tippt (kleiner Ring in `--accent`)
  und verblasst (2 s). Bei reduzierter Bewegung steht sie kurz still da.
- Nur die Sprechblase und bei Handlungen das Ziel sind bedienbar. Esc = Überspringen, Enter = Weiter.
