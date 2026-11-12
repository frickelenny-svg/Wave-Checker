# Wave-Checker

Lern-App für Elliott-Wellen (Deutsch). Alles steckt in einer Datei: `index.html` (HTML, CSS, JS, ohne Build-Schritt).
Veröffentlicht wird über `main` (GitHub Pages). Lerninhalte: `lernen/` (Regelwerk-Lernversion + Abbildungen), Quiz: `quiz/`.

## Arbeitsweise
- Texte in der App auf Deutsch, Anrede „du“. Kommentare im Code ebenfalls Deutsch, mit Datum und „Lenny“ bei Umbauten.
- Testen mit Playwright (Chromium ist vorinstalliert), immer auf Handy (iPhone), iPad (Touch) und PC (Maus).
  `PGS` (globale Variable) gibt Testzugriff auf die laufende Runde von „Wie geht es weiter?“:
  `PGS.R` (Kursdaten), `PGS.FR()` (Schwer-Zustand), `PGS.levels()` (Wellengröße je Zählung), `PGS.fadd(z,i,t,p,c)`,
  `PGS.show(t,p)`, `PGS.setTf(h)`, `PGS.X/Y` (Bildschirmkoordinaten).

## „Wie geht es weiter?“ (Funktion `progn`)
Großer, verschiebbarer und zoombarer Kerzenchart in vier Zeiteinheiten (W, D, 4h, 1h), drei Wellengrößen:
groß ①, mittel (1), klein 1.

### Beschriftung (Stand 12.11.2026)
- Kein Label für den Start einer Zählung (keine ⓪ / 0): nur ein kleiner Marker.
- Sichtbarkeit je Zählung, nicht je Label: Eine Unterteilung zeigt alle ihre Labels oder keins, je nachdem, ob ihre Wellen
  bei der aktuellen Zeiteinheit/Zoom im Schnitt breit genug sind. Große Wellen sind immer sichtbar; im Schwer-Modus auch die
  laufende und die ausgewählte Zählung.
- Gemeinsame Pivots: Labels bilden einen Stapel, kleinste Welle innen am Punkt, größte außen
  (am Hoch steht die größere darüber, am Tief darunter). Umgesetzt in `lab()`/`put()` über `stk` und `rank`.

### Schwer: Punkte setzen
- Läuft eine Zählung (noch nicht alle Labels gesetzt, `FR.ac !== null`), lassen sich keine Punkte auswählen, verschieben oder
  löschen. Tippen auf einen bestehenden Punkt setzt das nächste Label genau auf diesen Pivot (gemeinsamer Punkt).
  Knopf „Zählung beenden“ (oder Esc) beendet die Zählung vorzeitig.
- Sonst rastet ein neuer Punkt im sichtbaren Teil auf Hoch bzw. Tief der nächsten Kerze ein (`snap`), in der Zukunftszone frei.
  Fangradius: Finger 28 px, Maus 12 px.
- Ziehen eines gemeinsamen Pivots bewegt alle Punkte darauf zusammen.

### Schwer: feste Reihenfolge der Wellengrößen
Die Größe wird beim Start einer Zählung festgelegt und in `FR.cm[c] = {lev, par, pk}` gespeichert (nicht mehr erraten):
1. Die erste Zählung ist die große Welle.
2. Welle antippen (Endpunkt; wird hervorgehoben), dann Zählweise wählen: Unterteilung genau eine Größe kleiner,
   Start automatisch am Start dieser Welle (`frStartSub`). Für die nächste, noch offene Welle gibt es einen eigenen Knopf.
3. Ohne Auswahl (`frMeta`): beginnt die Zählung in einer Welle einer bestehenden Zählung, ist sie eine Größe kleiner;
   sonst dieselbe Größe wie die Zählung, an die sie anschließt.
4. Löschen einer Zählung: ihre Unterteilungen bleiben und rücken eine Größe auf (mit Rückgängig).
`frSeries` sucht nur noch die übergeordnete Zählung (gewählt oder die Welle einer Zählung genau eine Größe größer).
Überschneiden sich zwei gleich große Zählungen, meldet die Prüfung das.
