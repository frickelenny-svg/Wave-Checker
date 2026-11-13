# Wave-Checker

Lern-App für Elliott-Wellen (Deutsch). Alles steckt in einer Datei: `index.html` (HTML, CSS, JS, ohne Build-Schritt).
Veröffentlicht wird über `main` (GitHub Pages). Gestaltungsregeln: `DESIGN.md`. Lerninhalte: `lernen/` (Regelwerk-Lernversion + Abbildungen), Quiz: `quiz/`.

## Arbeitsweise
- Texte in der App auf Deutsch, Anrede „du“. Kommentare im Code ebenfalls Deutsch, mit Datum und „Lenny“ bei Umbauten.
- Testen mit Playwright (Chromium ist vorinstalliert), immer auf Handy (iPhone), iPad (Touch) und PC (Maus).
  `PGS` (globale Variable) gibt Testzugriff auf die laufende Runde von „Wie geht es weiter?“:
  `PGS.R` (Kursdaten), `PGS.FR()` (Schwer-Zustand), `PGS.levels()` (Wellengröße je Zählung), `PGS.fadd(z,i,t,p,c)`,
  `PGS.show(t,p)`, `PGS.setTf(h)`, `PGS.X/Y` (Bildschirmkoordinaten).

## „Wie geht es weiter?“ (Funktion `progn`)
Großer, verschiebbarer und zoombarer Kerzenchart in vier Zeiteinheiten (W, D, 4h, 1h), drei Wellengrößen:
groß ①, mittel (1), klein 1.

### Zoom und Zeitachse (Stand 13.11.2026)
- Mausrad ohne Taste: nur die Zeitachse (`zoomX`), nach oben strecken, nach unten stauchen, um die Mausposition.
  Die Preisachse bleibt. Über dem Chart scrollt das Mausrad die Seite nie. Waagerechtes Trackpad-Wischen verschiebt.
- Strg/Cmd + Mausrad, Knöpfe + / − und zwei Finger: Zoom in alle Richtungen (`zoomAt`).
- Zeitachse unten ziehen (alle Geräte, `axisDrag`): nach rechts strecken, nach links stauchen. Doppelklick/Doppeltipp auf die
  Zeitachse: Breite der Start-Ansicht (`resetX`). Gesten auf der Zeitachse setzen nie einen Punkt.
- Rand (seit 13.11.2026): Start-Ansicht mit 24 px Innenabstand (`EP`); man kann so weit wischen, dass jede Kerze in die Mitte kommt
  (`clampSc`). Die Fangzone eines Punkts reicht über den Chartrand hinaus.
- Ziehen im Chart verschiebt wie bisher. Punkte und Prognose-Kerzen hängen an Zeit und Preis, nicht an Pixeln.

### Beschriftung (Stand 12.11.2026)
- Kein Label für den Start einer Zählung (keine ⓪ / 0): nur ein kleiner Marker.
- Sichtbarkeit je Zählung, nicht je Label: Eine Unterteilung zeigt alle ihre Labels oder keins, je nachdem, ob ihre Wellen
  bei der aktuellen Zeiteinheit/Zoom im Schnitt breit genug sind. Große Wellen sind immer sichtbar; im Schwer-Modus auch die
  laufende und die ausgewählte Zählung.
- Gemeinsame Pivots: Labels bilden einen Stapel, kleinste Welle innen am Punkt, größte außen
  (am Hoch steht die größere darüber, am Tief darunter). Umgesetzt in `lab()`/`put()` über `stk` und `rank`.

### Schwer: Werkzeuge Zeichnen und Auswählen (Stand 13.11.2026, `FR.md`)
Werkzeugleiste links am Chart unter den Zeiteinheiten (siehe DESIGN.md, Werkzeugleiste). Kein Werkzeug tut, was das andere tut.
- **Zeichnen** (`'draw'`, Fadenkreuz, Mauszeiger crosshair): Standard. Jeder Tipp setzt einen Punkt, auch den Start einer neuen
  Zählung. Tipp auf einen bestehenden Punkt: neuer Punkt genau auf diesem Pivot (gemeinsamer Pivot). Punkte werden hier nie
  ausgewählt, verschoben oder gelöscht; Ziehen verschiebt nur den Chart.
- **Auswählen** (`'sel'`, Pfeil): Tipp auf einen Punkt wählt ihn und seine Zählung (mehrere auf einem Pivot: größte zuerst, erneut
  tippen wechselt). Dann verschieben (Ziehen), umbenennen, löschen (Mülleimer, Entf/Rücktaste), Welle für eine Unterteilung wählen.
  Tipp ins Leere hebt nur die Auswahl auf, setzt nie einen Punkt.
- Wechsel: Zählweise wählen → Zeichnen. Nach einer fertigen Zählung bleibt Zeichnen aktiv. „Zählung beenden“ → Auswählen.
  Tasten: V = Auswählen, C = Zeichnen, Esc = laufende Zählung beenden und Auswählen.
- Beim ersten Öffnen ein Satz Hinweis zu den Werkzeugen (gemerkt in `localStorage` `waveChecker.pgTools`).
- Reihenfolge (seit 13.11.2026, `frAdd`/`frLast`): Eine laufende Zählung vergibt die Labels strikt in ihrer Reihenfolge
  (Start, A, B, C bzw. Start, 1 … 5). Gesetzte Labels werden nie umbenannt oder umsortiert, die Label-Leiste geht nur vorwärts
  (frühere Labels gesperrt), fertig erst nach dem letzten Label. Ein Punkt links vom (oder auf der Zeit des) vorherigen Punkts der
  Zählung wird nicht gesetzt: Hinweis „Punkte bitte von links nach rechts setzen“. Früher begann so still eine neue Zählung.
- Doppelt ausgelöste Tipps (gleiche Stelle, < 350 ms) zählen einmal.
- Im sichtbaren Teil rastet ein neuer Punkt auf Hoch bzw. Tief der nächsten Kerze ein (`snap`, bei laufender Zählung nur rechts
  vom letzten Punkt), in der Zukunftszone frei.
  Fangradius für Punkte: Finger 28 px, Maus 12 px. Ziehen eines gemeinsamen Pivots bewegt alle Punkte darauf zusammen.

### Schwer: feste Reihenfolge der Wellengrößen
Die Größe wird beim Start einer Zählung festgelegt und in `FR.cm[c] = {lev, par, pk}` gespeichert (nicht mehr erraten):
1. Die erste Zählung ist die große Welle.
2. Im Auswahlmodus Welle antippen (Endpunkt; wird hervorgehoben), dann Zählweise wählen: Unterteilung genau eine Größe kleiner,
   Start automatisch am Start dieser Welle (`frStartSub`). Für die nächste, noch offene Welle gibt es einen eigenen Knopf.
3. Ohne Auswahl (`frMeta`): beginnt die Zählung in einer Welle einer bestehenden Zählung, ist sie eine Größe kleiner;
   sonst dieselbe Größe wie die Zählung, an die sie anschließt.
4. Löschen einer Zählung: ihre Unterteilungen bleiben und rücken eine Größe auf (mit Rückgängig).
`frSeries` sucht nur noch die übergeordnete Zählung (gewählt oder die Welle einer Zählung genau eine Größe größer).
Überschneiden sich zwei gleich große Zählungen, meldet die Prüfung das.
