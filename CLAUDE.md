# Wave-Checker

Lern-App für Elliott-Wellen (Deutsch). Alles steckt in einer Datei: `index.html` (HTML, CSS, JS, ohne Build-Schritt).
Veröffentlicht wird über `main` (GitHub Pages). Gestaltungsregeln: `DESIGN.md`. Lerninhalte: `lernen/` (Regelwerk-Lernversion + Abbildungen), Quiz: `quiz/`, Tutorial-Texte: `tutorials.json`.

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
- Seit 18.11.2026 braucht das installierte Edge (Version 157) Playwright ab 1.65; ältere Versionen starten es nicht mehr.

## Punkte ziehen, alle Modi (seit 18.11.2026)
Gilt für „Chart durchzählen“, „Muster erkennen – Schwer“, Tagesaufgabe (`bindPoints`), „Subwellen zählen“ (`sub`) und
„Wie geht es weiter?“ Leicht (Prognose-Punkte) und Schwer (Werkzeug Auswählen).
- Ein gezogener Punkt behält immer sein Label, nichts wird umsortiert oder umbenannt. Er bleibt zwischen Vorgänger und Nachfolger
  (bzw. in Schwer zwischen den Nachbarn seiner Zählung); weiter gezogen stoppt er an der Grenze, dazu kurz der Hinweis
  „Punkte bleiben in ihrer Reihenfolge“ (`ordHint`, auch in der Übungsrunde). Schwer: Eingerastet wird nur innerhalb der Grenzen
  (`snapPt` mit `tmin`/`tmax`); gibt es dort kein Ziel, bleibt das letzte gültige (anfangs die alte Stelle).
- Während des Ziehens bleiben alle Punkte in normaler Größe mit Markierung sichtbar; nur der gezogene ist hervorgehoben (`DRAGK`,
  Klasse `.pt.drag` bzw. in `drawS` Feld `drag`).
- „Subwellen zählen“: Welcher Punkt gegriffen wird, folgt aus der Lage von Punkt und Label (gleiche Geometrie wie `drawS`). Früher
  wurden die Labels im SVG abgezählt; weil der Start kein Label hat, griff ein Tipp auf die 2 die 1 (Punkt „sprang zurück“, „aus 2 wurde 1“).
- Test: `node tests/ziehen.js [Runden]` (Playwright, Handy/iPad/PC, echte Tipps und Mausziehen): Punkte setzen, an eine gültige
  Stelle ziehen (bleibt dort, andere unverändert), über den Nachbarn hinaus ziehen (stoppt an der Grenze, Label und Reihenfolge
  bleiben, Hinweis erscheint), während des Ziehens alle Punkte sichtbar. `NUR=subwellen` (Teil des Modusnamens) prüft nur passende
  Modi, `DBG=1` zeigt Details für Schwer. Nach Änderungen am Setzen oder Ziehen von Punkten laufen lassen.

## Kurz-Tutorials „So geht's“ (seit 18.11.2026)
- Je Spielbildschirm ein Knopf „So geht's“ (oben rechts, `.tutbtn`), startet nie von selbst. Beim ersten Besuch eines Modus pulsiert er
  einmal (`localStorage` `waveChecker.tutSeen`). Elf Tutorials: `count`, `find`, `find-schwer`, `recog`, `recog-schwer`, `daily`, `sub`,
  `blitz`, `progn`, `progn-schwer`, `quiz` (Schlüssel je nach Schwierigkeit). Gestaltung: DESIGN.md, Abschnitt „Tutorial“.
- Texte nur in `tutorials.json` (Anleitung oben in der Datei): je Modus `titel` und `schritte` (`id` + `text`, höchstens zwei Sätze, du,
  keine Regel-IDs). Reihenfolge und Auswahl der Schritte kommen aus der Datei, unbekannte ids werden übersprungen.
- Technik in `index.html` (Block „Kurz-Tutorials“ direkt vor dem App-Start): Jeder Spielbildschirm meldet sich mit
  `tutCtx(key, neueRunde, daten)` an (count, findSub, recogNormal, recogHard, sub, blitz/show, progn, quizAsk). `TUTDEF[key]` legt je
  Schritt das echte Ziel-Element fest (`el`), bei Handlungen `hand` (wohin die Hand zeigt), `done`/`click` (wann es weitergeht), `opt`
  (nur wenn es passt, z. B. Tipp-Knopf, Bonusfrage). Fehlt ein Element, wird der Schritt übersprungen, nie blockiert.
- Übungsrunde in einer Sandbox: fester Beispielchart (`Math.random` = `seeded('tutorial '+key)`, Impuls bzw. feste Quizfragen,
  Tagesaufgabe mit eigenem Beispiel statt des echten Tages). Punkte-Meldungen zeigen „keine Punkte (Übungsrunde)“, Kopfzeile und
  Rang-Meldungen bleiben still. Am Ende (Los geht's, Überspringen, Esc) werden Punkte, Serie und der ganze `localStorage` zurückgesetzt,
  dann startet eine normale Runde (Quiz und Blitz: die unterbrochene Runde, falls gespeichert).
- Neuer Modus: `tutCtx` im Spielbildschirm aufrufen, Eintrag in `TUTDEF` und in `tutorials.json`, Öffner in `tests/tutorial.js` (`OPEN`).
- Test: `node tests/tutorial.js [Durchläufe]` (Playwright, Handy/iPad/PC): Knopf und Puls, jedes Tutorial bis zum Ende mit echten Tipps
  an die Stelle der Hand, alle Pflichtschritte erscheinen, Blase im Bild, danach normale Runde und Spielstand unverändert, Überspringen
  und Neustart, Datei-Prüfung (zwei Sätze, keine Regel-IDs). Testzugriff: `TUTS()` (Schritt, Handlung, Hand-Punkt), `TUTLAST`.
  Nach Änderungen an Tutorials, an `tutorials.json` oder an Bedienelementen eines Modus laufen lassen.

## „Eigenen Chart prüfen“ (seit 20.11.2026, Funktionen `ownChart`, `ocCrop`, `progn({img})`)
Kein Spielmodus: keine Punkte, keine Serie, keine Ränge, kein Tutorial. Ohne KI und ohne Server, Grundlage nur das Regelwerk.
- Insel unten im Hauptmenü (neben „Wie geht es weiter?“), Station am Handy-Pfad zwischen Prognose und Rängen (`STN` id `own`),
  Schritt im Wegführer. Hinweistext `OCNOTE` („prüft deine Zählung nach dem Regelwerk … keine Kursprognose oder Anlageempfehlung“)
  auf Hochladen, Zählen und Ergebnis.
- Hochladen: Dateifeld bzw. Ziehen (PNG/JPG), Bild bleibt im Browser (Blob-URL, Canvas). Zuschneiden (`ocCrop`): Rahmen ziehen,
  Ecken/Kanten anpassen, im Rahmen verschieben, „Ganzes Bild“. Ausschnitt höchstens 2000 px lange Seite (`OCMAX`).
- Zählen = `progn({img:IMG},'schwer')`: dieselbe Bedienung wie Schwer (Zählweisen, Zeichnen/Auswählen, Unterteilungen, Löschen,
  Zoom). `IMG` = {cv, data, w, h, url, fade, crop:{x,y,f}}. Zeit = Bildspalte, Preis = Pixelhöhe von unten (`h - Zeile - 0,5`),
  immer linear (auch bei log-Charts, ohne Hinweis). Keine Zukunftszone, keine Zeiteinheiten, Mausrad zoomt unverzerrt.
  Werkzeuge und Zoom stehen in einem Streifen über dem Bild (`TP` 54 px), damit keine Bildecke verdeckt ist.
  Regler „Bild blasser“ (Fläche in `--surface` über dem Bild, `localStorage` `waveChecker.ocFade`), Labels mit Hintergrund (`.pglbg`).
- Einrasten (`imgSnap`, statt Kerzen): Hintergrund = häufigste Farbe im Fenster um den Fangbereich, abweichend ab Schwelle nach
  Kontrast (Gitterlinien bleiben darunter), Formen ab 3 Pixeln, senkrechte Lücken bis 2 px geschlossen. Profil je Spalte (oberstes bzw.
  unterstes Pixel), Wendehoch/-tief in ±K Spalten wie beim Kerzen-Einrasten (Abstand zum Finger, Bonus für markante Spitzen, Richtung
  aus `wantOf`), Spitze mit schwacher Schwelle verfolgt (blasse Dochte auf Fotos). Schon eingezeichnete Labels (kleines „Wort“ bis
  110 × 44 px, 4 bis 60 px über einem Hoch bzw. unter einem Tief) zählen nicht: Tipp aufs Label rastet am Docht ein. Kein Treffer: frei.
  Start ohne Richtung: das nähere von Hoch und Tief (wie in Schwer). Tipps bis Fangradius neben dem Bildrand gelten noch.
- Prüfen (`imgVerify`, sobald eine große Zählung 3 Punkte hat): `frCheck` ohne Kerzendaten (Lage am Hoch entfällt, Wellengebiet aus den
  Punkten), merkt das passende Muster (`S.fitQ`). Alle Befunde auf einmal: harte Regeln = Fehler (rot, Grenzlinie), Warnsignale und
  Faustregeln = Hinweise, Invalidierungslinien des passenden Musters für große Zählungen. Text nur „Deine Zählung ist regelkonform“
  bzw. „verstößt gegen …“, nie „richtige Zählung“. Danach „Als Bild speichern“ (PNG: Bild, Labels, Linien, Fazit, „Wave Checker“;
  `ocPng`), „Teilen“ (nur Touch mit Datei-Teilen), „Zählung ändern“, „Neues Bild“. Testzugriff: `PGS.img`, `PGS.res`, `PGS.lastPng`,
  `IMG.cand` (Kandidaten des letzten Einrastens), `IMG.debug` → `IMG.dbg`.
- Test: `node tests/eigener-chart.js [Runden]` (Playwright, Handy/iPad/PC, `NUR=Handy` für ein Gerät, `DBG=1` Fehlgriffe, `SHOTS=Ordner`
  Bildschirmfotos). Testbilder im TradingView-Stil mit bekannten Preisen (hell/dunkel, Kerzen/Linie, linear/log, Handyfoto-Simulation
  mit Unschärfe/Rauschen/Moiré/JPEG, teils mit eingezeichneten Labels): Hochladen, echtes Zuschneiden, Einrasten ≥ 95 % (Stand 20.11.:
  Handy, iPad, PC je rund 99–100 %, Labels 100 %), Ziehen, Prüfergebnis gleich den Regeln für die bekannten Preise (log: Pixelhöhe),
  Regler, Bild-Export, Spielstand unverändert. Der Start wird auf bzw. jenseits des Extrems getippt. Nach Änderungen an Schwer,
  `snapPt` oder `frCheck` auch diesen Test laufen lassen.

## Neue Ränge: Abzeichen und Aufstiegs-Ansicht (seit 23.11.2026)
- `rankCheck` merkt jeden Rangaufstieg (neu oder verbessert, auch Elliott-Meister als `c:'m'`) in `localStorage`
  `waveChecker.rankNew` = `{l:[{c,f,t}], pop}` (`rnPush`). Steigt eine Kategorie erneut, bevor man hinschaut, wird ihr Eintrag
  erweitert (Bronze → Gold statt zwei Karten). Reihenfolge der Karten = Reihenfolge der Aufstiege.
- Abzeichen (`rnBadge`, rot, Zahl, ab 10 „9+“) an der Insel „Meine Ränge“ (`rnIsl`) und an der Station am Handy-Pfad, Zahl auch im
  `aria-label`. Ploppt einmal auf, sobald es ins Bild kommt (`rnPop`, IntersectionObserver; `pop` = schon aufgeploppte Anzahl).
- Insel, Station und „Meine Ränge“ im Lernbereich rufen `ranksOpen()`: mit neuen Aufstiegen erst `rankUp(i)` (eine Karte je Aufstieg,
  Wischen bzw. Weiter/Zurück), sonst direkt `ranks()`. Sobald die letzte Karte zu sehen ist, gelten alle als gesehen (Liste leer);
  „Alle Ränge ansehen“ → `ranks(fromLearn, hl)` mit kurz hervorgehobenen Karten (`.rkhl`).
- Test: `node tests/rangaufstieg.js [Runden]` (Playwright, Handy/iPad/PC): Aufstieg echt über `exSolved`, Abzeichen sichtbar oben
  rechts, Kontrast, Aufploppen nur einmal, Neuladen, Aufstiegs-Ansicht mit Text und Rängen, mehrere Aufstiege mit Wischen (CDP-Touch
  bzw. Maus) und Weiter, Hervorhebung, „9+“, reduzierte Bewegung. Nach Änderungen an Rängen oder Startseite laufen lassen.

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
  Zählung. Tipp auf oder neben einen bestehenden Punkt: neuer Punkt genau auf diesem Pivot (gemeinsamer Pivot). Punkte werden hier nie
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
- Einrasten: siehe „Schwer: Einrasten auf Pivots“. Fangradius zum Auswählen eines Punkts: Finger 28 px, Maus 12 px.

### Schwer: Einrasten auf Pivots (seit 16.11.2026, `snapPt`)
Beim Setzen (Zeichnen) und beim Ziehen (Auswählen) springt der Punkt automatisch auf ein echtes Pivot. Reihenfolge in `snapPt(px,py,o)`:
1. Bestehende Punkte im Fangbereich (gemeinsame Pivots, in der Zukunftszone die Prognose-Punkte) haben Vorrang.
2. Zukunftszone: frei (keine Kerzen). Nur direkt an der Grenze rastet noch das letzte Pivot des sichtbaren Teils ein.
3. Wendehoch bzw. Wendetief der Kerzen der aktuellen Zeiteinheit im Fangbereich (Handy/iPad 40 px, PC 15 px). Wendepunkt = Kerze,
   die in einem Fenster von ±K Kerzen das Extrem ist (K mindestens 1, mindestens ca. 18 px am Handy bzw. 8 px am PC). Markante
   Wendepunkte (über eine breite Strecke das Extrem) bekommen einen Bonus bis 27 px gegenüber kleinen Neben-Wendepunkten.
   Flache Spitzen (mehrere Kerzen mit demselben Extrem, im erzeugten Kurs häufig): zuerst die Stunde, die am Extrem schließt,
   dann die nächste am Finger. Gespeichert wird die Stunde des Extrems (`t`) und sein Preis.
4. Sonst Hoch bzw. Tief der Kerze unter dem Finger.
- Richtung (`wantOf`): Aus den letzten beiden Punkten der Zählung folgt, ob ein Hoch (`'h'`) oder Tief (`'l'`) dran ist; dann rastet
  der Punkt nur auf diese Art ein. Direkt nach dem Start ist die Richtung nur bevorzugt (`'H'`/`'L'`, Bonus 14 px), abgeleitet aus
  `hl` des Startpunkts (beim Einrasten gemerkt: Hoch oder Tief). Ganz ohne Anhalt: das nächste von beiden.
- Ziehen: Der Punkt folgt dem Finger (am Handy 34 px darüber), ein Ring (`SNAPR`, `.pgsnap`) zeigt das Ziel, beim Loslassen springt der
  Punkt dorthin. Wechselt das Ziel, vibriert das Handy kurz (`buzz`, falls verfügbar); ebenso beim Setzen per Tipp.
- PC: Alt gedrückt = frei platzieren, ohne Einrasten (auch beim Ziehen).
- Zeichnen hat keinen eigenen Weg mehr für „Tipp auf bestehenden Punkt“: Das erledigt Schritt 1 (Punkte der laufenden Zählung und
  Punkte links vom letzten Punkt ausgenommen).
- Test: `node tests/einrasten.js [Runden]` (Playwright, Handy/iPad/PC): grobes Tippen mit zufälligem Versatz (Finger bis 22 px, Maus
  bis 9 px) muss in mindestens 95 % der Fälle genau den Preis des gewünschten Hochs/Tiefs treffen (Stand 16.11.: Handy und iPad
  rund 97 %, PC 100 %), dazu Ziehen mit Ring, Zukunftszone, Prognose-Punkte und Alt. Gewertet werden nur Wellenenden, die in der
  Zeiteinheit wirklich das Extrem ihrer Kerze und der Nachbarkerzen sind (im Wochen-Chart läuft sonst z. B. eine spätere Teilwelle
  darüber hinaus). `DBG=1` zeigt jeden Fehlgriff. Testzugriff: `PGS.snapAt(px,py,o)`, `PGS.ring()`.

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
