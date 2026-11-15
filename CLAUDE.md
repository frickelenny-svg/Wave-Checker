# Wave-Checker

Lern-App für Elliott-Wellen (Deutsch). Alles steckt in einer Datei: `index.html` (HTML, CSS, JS, ohne Build-Schritt).
Veröffentlicht wird über `main` (GitHub Pages). Gestaltungsregeln: `DESIGN.md`. Lerninhalte: `lernen/` (Regelwerk-Lernversion + Abbildungen), Quiz: `quiz/`.

## Arbeitsweise
- Texte in der App auf Deutsch, Anrede „du“. Kommentare im Code ebenfalls Deutsch, mit Datum und „Lenny“ bei Umbauten.
- Testen mit Playwright (Chromium ist vorinstalliert), immer auf Handy (iPhone), iPad (Touch) und PC (Maus).
  `PGS` (globale Variable) gibt Testzugriff auf die laufende Runde von „Wie geht es weiter?“:
  `PGS.R` (Kursdaten), `PGS.FR()` (Schwer-Zustand), `PGS.levels()` (Wellengröße je Zählung), `PGS.fadd(z,i,t,p,c)`,
  `PGS.show(t,p)`, `PGS.setTf(h)`, `PGS.X/Y` (Bildschirmkoordinaten), `PGS.lbx()` (Flächen der Labels im Schwer-Modus).
- Touch-Test Schwer (seit 14.11.2026): `node tests/schwer-touch.js [Runden]` (Playwright; `PWCH=chrome` bzw. `msedge` für einen
  installierten Browser). Echte Tipps auf Handy, iPad und PC: Reihenfolge der Labels in allen fünf Zählweisen (auch auf bestehenden
  Pivots, bei verschobener Seite und mit Tipp auf einen späteren Knopf der Label-Leiste), gemeinsame Pivots (Auswahl, Tipp auf
  Label, Ziehen nur des gewählten Labels) und die Regel „Unterteilung am Ende der Welle darüber muss vollständig sein“.
  Vor jedem Veröffentlichen von Änderungen an Schwer laufen lassen. Hinweis für Tests: Nach einem synthetischen Wisch mit Schwung
  verschluckt der Test-Browser den nächsten Tipp (Finger vor dem Loslassen ruhen lassen); der Click eines Touch-Tipps kommt verzögert.

## „Fehler finden“ (Funktion `findSub`), Schwer seit 14.11.2026
- Im Menü (`pick('find')`) Schwierigkeit wählen: Leicht (Regel aus einer Auswahl) oder Schwer (Freitext), gemerkt in
  `localStorage` `waveChecker.findLvl`. Welle wählen wie in Leicht, dann Textfeld „Was ist falsch?“ (Enter oder Auswerten).
- Prüfung ohne KI per Schlüsselwörtern (`FFT`, Block zwischen `// FFT-START` und `// FFT-END`, ohne Bezug auf den Rest der App).
  Begriffe in `fehler-schluesselwoerter.json` (Anleitung oben in der Datei): je Regel Pflichtgruppen, aus jeder Gruppe muss ein Begriff
  vorkommen; `sinn` prüft Verneinungen (nicht, kein, statt …; Regel-Formulierungen mit muss/darf/„geht nicht“ drehen den Sinn um),
  `richtung` tauscht bei gespiegeltem Chart unter/über, Tief/Hoch; `wie`, `je_welle`, `varianten`, `@LISTE`, `{welle}`.
  Toleranz: Groß/klein, ae/oe/ue, Zahlwörter, Wortanfänge, ab 5 Buchstaben ein Tippfehler. Regel-IDs nie in der Oberfläche.
- Ausgänge: erkannt +10 („Richtig erkannt“ und die Regel in einfachen Worten, Feld `einfach`); nicht erkannt: „Das konnte ich nicht
  sicher zuordnen.“, richtige Regel, Knöpfe „Das meinte ich“ (+5, Serie bleibt) / „Lag daneben“ (0, Serie weg); falsche Welle wie Leicht.
- Nicht erkannte Antworten (bei richtiger Welle) in `localStorage` `waveChecker.fehlerTexte` (höchstens 300). Übersicht nur für Lenny:
  Adresse mit `#fehlertexte` oder Umschalt+Alt+F (`fehlerTexte()`), mit Kopieren und Leeren.
- Handy/iPad: Beim Tippen bekommt `#view` die Klasse `fft-typing`: Chart höchstens 30 % der sichtbaren Höhe (`--vvh` aus
  `visualViewport`), rückt nach oben, Leiste unten weicht einem Knopf unter dem Feld, damit die Tastatur nichts verdeckt.
- Tests: `node tests/fehler-text.js` (ohne Browser: je Regel mindestens 5 richtige und 3 falsche Formulierungen, vage Antworten,
  jede Regel aus `findSub` in der Datei) und `node tests/fehler-schwer-ui.js [Runden]` (Playwright, Handy/iPad/PC, Testzugriff `FFS`
  = gesuchte Regel, Welle, beteiligte Wellen inv, Runde R, Option o, Versuche tries). Nach jeder Änderung an der Begriffsdatei
  `tests/fehler-text.js` laufen lassen.

### Beteiligte Wellen (seit 15.11.2026, Leicht und Schwer)
Jede beteiligte Welle zählt als richtige Wellenwahl (`ffInv(P,R,o,wv)` = [Welle der Regel, Partner …], je Runde; `FFPS` = mögliche
Partner für die Regelauswahl in Leicht). In Leicht steht die Regel auch bei der Partnerwelle zur Auswahl.

| Regel | Welle der Regel | Partner |
|---|---|---|
| IMP-1 Welle 2 unter Start von 1 | 2 | 1 |
| IMP-2 Welle 3 die kürzeste | 3 | die kürzere von 1 und 5 |
| IMP-3 Überlappung / DIAG-2 keine Überlappung | 4 | 1 |
| ZZ-2, FR-2, FE-2, FRU-2 (Welle B und Start von A) | B | A |
| ZZ-3, FR-3, FE-3, FRU-3 (Welle C und Ende von A) | C | A |
| DRE-7 / DRE-8 (Dreieck, Längenfolge) | die Welle mit falschem Verhältnis | ihre Vorgängerin |
| DL-4 Welle 1 nicht die längste | 3 | 1 (und 5, falls mindestens so lang wie 1) |
| DL-8, DB-10 Welle 5 nicht kürzer als 3 | 5 | 3 |
| DB-4 Welle 3 nicht kürzer als 1 | 3 | 1 |
| DE-3 Wellen werden nicht immer länger | 3 bzw. 5 | 1 bzw. 3 |
| DE-9 Welle 4 über 99,9 % von 3 | 4 | 3 |
| WX-2 / WX-2b Welle X ≥ 100 % | X (X1) bzw. X2 | W bzw. Y |
| W4-3 Alternation | 4 | 2 |
| DRE-1 Dreieck in W bzw. 2, alle Subwellen-Regeln (s:…) | nur diese Welle | – |

KOM-5 und andere Regeln, die der Generator nicht verletzt, kommen in „Fehler finden“ nicht vor.
- Freitext je Blickwinkel: Varianten mit `welle` in der Begriffsdatei gelten nur für die passende gewählte Welle; `{welle}`/`{partner}`
  als Platzhalter. Nennt die Antwort die gewählte Welle nicht (und keine unbeteiligte), setzt `FFT.check` sie als Satzgegenstand davor
  („nicht die längste“ bei Welle 1). `*` springt nie über eine Wellenbezeichnung. Umlaute: ä = ae = a (ebenso ö, ü).
- Nach einer richtigen Antwort „Anders gesagt: …“ (Feld `anders` mit `haupt`/`partner`) aus dem Blickwinkel der anderen Welle.
- `tests/fehler-text.js` prüft je Regel mit mehreren Wellen und je Blickwinkel mindestens 3 richtige Formulierungen;
  `tests/generator.js` prüft in Leicht, dass jede beteiligte Welle die Regel anbietet und als richtig zählt.

### Generator: genau ein Verstoß (seit 15.11.2026)
- Beschriftete Teilmuster (Muster der Wellen 2/4 im Impuls, W/X/Y/Z bei Double Zigzag und Dreifacher Form) kommen aus den echten
  Generatoren (`partF(name)` über `pgFr`, wie in „Wie geht es weiter?“). Dreieck = kontrahierend nach DRE-7 (|A| > |B| > |C| > |D| > |E|),
  die Flats nach FR/FE/FRU. Früher war das Dreieck fest `[0,1,.5,.85,.65,1]` ((e) länger als (d), Verstoß gegen DRE-7).
- `roundFails(P,R)` prüft eine Runde komplett: Hauptebene (auch mit dem äußersten Punkt jeder Welle, z. B. Welle A eines Dreiecks
  in X gegen WX-2), Teilzahl je Welle, fünfteilige Wellen gegen die Impulsregeln, beschriftete Teilmuster gegen ihre eigenen Regeln
  sowie DRE-1/W4-3 aus den Namen. `findSub` erzeugt neu, bis nur der gewollte Verstoß übrig ist (`findOk`/`findWant`; erlaubt sind nur
  die Folgeregeln der Diagonalen aus `P.implied`). Gilt für Leicht und Schwer.
- Beschriftung in allen Modi: kein „0“ am Start, im Chart ein kleiner Marker, im Text „Start“ (`L0`). Labels rücken am Chartrand nach
  innen (`labX`), damit z. B. „Y Regular Flat“ nicht abgeschnitten wird.
- Test: `node tests/generator.js [Charts je Muster]` (Playwright): Dreiecke aller Modi gegen DRE-7/DRE-8 (auch die Musterbäume von
  „Wie geht es weiter?“), jede Fehler-Aufgabe mit genau einem Verstoß, regelkonforme Charts ohne Verstoß, kein „0“, Labels im Bild.
  Mit 250 rund 30.000 geprüfte Charts und Teile. Nach Änderungen an Generatoren laufen lassen.

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
- **Auswählen** (`'sel'`, Pfeil): Tipp auf einen Punkt wählt ihn und seine Zählung (mehrere auf einem Pivot: kleinste zuerst, erneut
  tippen wechselt). Dann verschieben (Ziehen), umbenennen, löschen (Mülleimer, Entf/Rücktaste), Welle für eine Unterteilung wählen.
  Tipp ins Leere hebt nur die Auswahl auf, setzt nie einen Punkt.
  **Gemeinsame Pivots (seit 14.11.2026):** Antippen wählt zuerst die kleinste Welle dort, erneutes Antippen die nächstgrößere.
  Tipp direkt auf ein Label wählt genau dieses Label (`LBX`, Flächen aus `put()`). Das gewählte Label ist hervorgehoben (Kreis
  mit blauem Rand bzw. blau hinterlegt). Ziehen verschiebt nur das gewählte Label (`mq`), die anderen auf dem Pivot bleiben stehen;
  ist dort noch nichts gewählt, die kleinste Welle.
- Wechsel: Zählweise wählen → Zeichnen. Nach einer fertigen Zählung bleibt Zeichnen aktiv. „Zählung beenden“ → Auswählen.
  Tasten: V = Auswählen, C = Zeichnen, Esc = laufende Zählung beenden und Auswählen.
- Beim ersten Öffnen ein Satz Hinweis zu den Werkzeugen (gemerkt in `localStorage` `waveChecker.pgTools`).
- Reihenfolge (seit 13.11.2026, `frAdd`/`frLast`): Eine laufende Zählung vergibt die Labels strikt in ihrer Reihenfolge
  (Start, A, B, C bzw. Start, 1 … 5). Gesetzte Labels werden nie umbenannt oder umsortiert, die Label-Leiste geht nur vorwärts
  (frühere Labels gesperrt), fertig erst nach dem letzten Label.
  **Seit 14.11.2026 strukturell abgesichert:** `frAdd` vergibt in einer laufenden Zählung immer `lst.i+1`, unabhängig von `FR.i`
  (vorher `max(FR.i, lst.i+1)`: Stand die Leiste weiter vorn, wurde z. B. nach Start und 1 direkt die 5 gesetzt und die Zählung galt
  als fertig). Die Label-Leiste ist bei laufender Zählung nur Anzeige (alle Knöpfe außer dem nächsten gesperrt), ohne laufende
  Zählung sind nur Start und 1 wählbar. Der Browser schickt nach einem Touch-Tipp noch einen Click an das Element, das nach dem
  Neuaufbau unter dem Finger liegt: Solche Clicks außerhalb des Charts werden 400 ms lang verschluckt (`PGTAPT`), und `frRender`
  hält den Chart an seiner Stelle im Bild (Scroll-Ausgleich), damit nichts unter dem Finger verrutscht. Ein Punkt links vom (oder auf der Zeit des) vorherigen Punkts der
  Zählung wird nicht gesetzt: Hinweis „Punkte bitte von links nach rechts setzen“. Früher begann so still eine neue Zählung.
- Doppelt ausgelöste Tipps (gleiche Stelle, < 350 ms) zählen einmal.
- Im sichtbaren Teil rastet ein neuer Punkt auf Hoch bzw. Tief der nächsten Kerze ein (`snap`, bei laufender Zählung nur rechts
  vom letzten Punkt), in der Zukunftszone frei.
  Fangradius für Punkte: Finger 28 px, Maus 12 px.

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

### Schwer: Prüfung von Unterteilungen (Stand 14.11.2026)
- Erreicht der letzte gesetzte Punkt einer Unterteilung das Ende ihrer übergeordneten Welle, muss die Unterteilung vollständig sein
  (alle Labels der Zählweise, z. B. ZZ-1/WC-1: Welle C fünfteilig). Sonst Befund am letzten Punkt, z. B. „Welle (c) endet hier,
  ihre Unterteilung braucht noch Welle 4 und 5“ (`frCheck`, Schleife über `kids`). Läuft sie über das Ende hinaus, ebenso.
- Eine Unterteilung, die vor dem Ende der übergeordneten Welle aufhört, bleibt als angefangene Zählung erlaubt. Fehlt nur das letzte
  Label und liegt der letzte Punkt vor dem Wellenende, endet sie wie bisher am Ende der Welle darüber (`endImpl`).
