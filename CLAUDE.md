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
- Testumfang nach Größe der Änderung (Regel von Lenny, seit 24.11.2026):
  · Klein (Text, Design, eine Funktion in einem Modus): nur gezielte Tests für das Geänderte plus ein kurzer Rauchtest, dass die App startet.
  · Mittel (Bedienung, Zieh-/Tipp-Logik, ein Modus umgebaut): gezielte Tests plus die bestehenden Tests dieses Modus.
  · Groß (Generator, Regel-Checker, mehrere Modi): voller Testlauf mit vielen Runden.
  Lange Dauertests (tausende Runden) nur bei großen Änderungen oder wenn Lenny es ausdrücklich verlangt. Steht im Auftrag ein größerer
  Testumfang, gilt dieser. Die Hinweise „immer auf Handy, iPad und PC“ und „nach Änderungen an … laufen lassen“ in dieser Datei gelten
  innerhalb dieses Umfangs. Am Ende kurz sagen, welche Tests gelaufen sind und wie lange sie gedauert haben.

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
**Übersicht zum Weiterarbeiten (Ablauf, Erkennung, probierte Ansätze, Testbilder, offene Probleme): [docs/eigener-chart.md](docs/eigener-chart.md).**
- Insel unten im Hauptmenü (neben „Wie geht es weiter?“), Station am Handy-Pfad zwischen Prognose und Rängen (`STN` id `own`),
  Schritt im Wegführer. Hinweistext `OCNOTE` („prüft deine Zählung nach dem Regelwerk … keine Kursprognose oder Anlageempfehlung“)
  auf Hochladen, Zählen und Ergebnis.
- Hochladen: Dateifeld bzw. Ziehen (PNG/JPG), Bild bleibt im Browser (Blob-URL, Canvas). Darunter der Tipp „Beste Ergebnisse: In TradingView vorher
  alle Zeichnungen ausblenden (Augen-Symbol links) …“ (`.octip`, seit 25.11.2026). Zuschneiden (`ocCrop`): Rahmen ziehen,
  Ecken/Kanten anpassen, im Rahmen verschieben, „Ganzes Bild“. Ausschnitt höchstens 2000 px lange Seite (`OCMAX`).
  Zuschnitt-Vorschlag (seit 25.11.2026 nach Discord-Feedback, `ocSuggest`): `ocPath` auf einer Kopie (höchstens 1600 px; kleiner werden die
  Achsenziffern zu blass), Rahmen = erkannter Oberflächenrand und Achsen (`IMG.ax`), oben/unten bis 8 % der Kursspanne über bzw. unter dem Kurs
  (Legende, Leisten weg), links/rechts bis zum Kurs. Kurs = größtes zusammenhängendes Stück des Verlaufs (Lücke über 1,5 % der Breite bzw. Sprung über
  10 % der Höhe trennt) plus Stücke ab 3 % der Breite in seiner Höhenspanne; kleine Stücke abseits (Kästchen, Logo) zählen nicht. Der Rahmen ist
  vorgewählt (Text „Der Rahmen ist ein Vorschlag …“), Weiter übernimmt ihn; Kanten anpassen oder neu ziehen (nicht verschieben). Tests klicken vor
  Weiter „Ganzes Bild“, wenn sie fertig zugeschnittene Bilder hochladen.
- Zählen = `progn({img:IMG},'schwer')`: dieselbe Bedienung wie Schwer (Zählweisen, Zeichnen/Auswählen, Unterteilungen, Löschen,
  Zoom). `IMG` = {cv, data, w, h, url, fade, crop:{x,y,f}}. Zeit = Bildspalte, Preis = Pixelhöhe von unten (`h - Zeile - 0,5`),
  immer linear (auch bei log-Charts, ohne Hinweis). Keine Zukunftszone, keine Zeiteinheiten.
  Werkzeuge und Zoom stehen in einem Streifen über dem Bild (`TP` 54 px), damit keine Bildecke verdeckt ist.
  Steuerung (seit 24.11.2026 wie in „Wie geht es weiter?“, dieselben Funktionen `zoomX`/`zoomAt`/`axisDrag`): Mausrad ohne Taste streckt bzw.
  staucht nur die Zeitachse um die Maus (Seite scrollt nicht), Strg/Cmd + Mausrad und + / − zoomen in alle Richtungen. Ziehen verschiebt
  waagerecht und senkrecht (im Bild auch mit einem Finger, die Seite scrollt dann nicht); ein Klick mit Bewegung unter 5 px (Maus; Finger 8 px)
  setzt im Werkzeug Zeichnen einen Punkt, nach dem Verschieben nie. Streifen „↔ Zeitachse ziehen“ unter dem Bild (`BP` 26 px, `.ocax`):
  Ziehen streckt/staucht (Modus `ax`, vor allem für Handy/iPad); ein Tipp dort wirkt seit 25.11.2026 wie ein Tipp in den Chart (Tiefs am unteren
  Bildrand). Knopf „Ansicht zurücksetzen“ (`[data-zr]`, links neben −) und Doppelklick auf die Chartfläche (nicht im Werkzeug Zeichnen, dort setzt
  ein Klick einen Punkt; nicht auf einem Punkt) stellen die Startansicht her.
  Bild fixiert (seit 25.11.2026, `imFit` = W/Bildbreite, `imClamp` in `pic()`, `clampSc`): Die Startansicht füllt die Chartfläche ganz (Höhe nach
  Seitenverhältnis, bei sehr hohen bzw. flachen Bildern leicht gestreckt), dort bewegt Ziehen nichts. Verschieben nur, wo durch Zoom bzw. Strecken
  mehr Bild da ist (nach reinem Strecken nur waagerecht), bis zur Bildkante; die Kanten rutschen nie in die Fläche. Rauszoomen und Stauchen höchstens
  bis zur Startansicht. Bild (`<image>` mit preserveAspectRatio none), Kerzen, Punkte und Labels hängen alle an X/Y, verzerren also gemeinsam.
  Test: `node tests/bild-steuerung.js` (Playwright, Handy/iPad/PC: Mausrad, Strg + Mausrad, Ziehen vs. Klick, Streifen (Ziehen und Tipp), + / −,
  Zurücksetzen, Startansicht fest, Grenzen an allen Kanten, nie leerer Raum, nicht kleiner als die Startansicht, Bild, Kerzen und Punkte deckungsgleich).
  Regler „Bild blasser“ 0–100 % (seit 23.11.2026; weiße Fläche über dem Bild, stufenlos, Anzeige `#ocfv`, `localStorage` `waveChecker.ocFade`).
  Bei 100 % ist die ganze Chartfläche weiß, auch im dunklen Design (Klasse `.ocw` am `#pgc` setzt die Farben des hellen Designs, Kontrast ≥ 4,5:1),
  der Verlauf ist immer zu sehen (Kästchen wird eingeschaltet, auch im Ergebnis und im Export-Bild). Labels mit Hintergrund (`.pglbg`).
  Test: `node tests/bild-blasser.js` (Playwright, Handy/PC, hell/dunkel, 0/50/100 %: Deckkraft, weiße Fläche, Kontrast, Verlauf, Export, Neuladen).
- Prüfen gesperrt: darunter immer der konkrete Grund (`ocWhy`, `#pgwhy`, seit 25.11.2026): Nachzeichnen läuft, noch keine Punkte (mit Hinweis auf das
  Werkzeug Zeichnen, wenn Auswählen aktiv ist), wie viele Labels der großen Zählung fehlen. Ursache der Discord-Meldung „Prüfen geht nicht“: keine Punkte,
  Werkzeug Auswählen aktiv. „Nachzeichnen beenden“ schaltet wieder auf Zeichnen. Nachzeichnen ersetzt nur die gezeichneten Spalten (`man`).
  Hinweis „Viele Zeichnungen im Bild, die Erkennung ist unsicher“ mit Tipp (`.ocq`), wenn `IMG.q.low`: Verlauf in unter 80 % der 6-Spalten-Abschnitte
  oder entfernte Zeichnungen (Linien-, Kästchen- und Zonenpixel) ab `Q_DRAW` = 0,8 % der Bildfläche (`IMG.q` = {cov, draw, low}).
  Test: `node tests/pruefen-nachzeichnen.js` (Playwright, Handy/iPad/PC: Tipp, Vorschlag, Gründe, Nachzeichnen nur dort, danach Zeichnen, Punkte, Prüfen).
- Kerzensuche (seit 25.11.2026, `ocKerzen`, in `ocPath` vor der Strangwahl; nach Discord-Feedback CoreWeave: Treppen entlang von Fibonacci-Boxen):
  Kerzen finden statt „alles, was nicht Hintergrund ist“. Der bisherige Weg (unten) liefert weiter Rahmen, Achsen, Legende, Kästchen und Linien
  (`RMV`: 1 = Linie, 2 = Zonenfläche, 3 = Kästchen/Zonenrahmen) und bleibt Rückfall, wenn keine Kerzen gefunden werden.
  1. Hintergrund je 16-px-Kachel: häufigste Farbe (auf Fotos alle Pixel bis 10 + Rauschen daneben, ab 30 % der Kachel, bis 120 vom Charthintergrund);
     Kachelfarben, die selbst Kerzenfarbe sind (s ab 0,45 vom Charthintergrund bzw. einer helleren Nachbarkachel aus), fallen weg (breite Körper).
     Kandidaten je Pixel: Charthintergrund und die 3 × 3 Kacheln rundherum. So ist die Füllung einer halbtransparenten Box lokaler Hintergrund.
  2. Kerzenfarben aus senkrechten Strichen, gruppiert nach der Richtung vom Charthintergrund aus (Fächer, häufigste zuerst, Winkel bis ~10°),
     Bezug = 90-%-Wert der Entfernung; mindestens 3 % der Striche über 10 von 24 Abschnitten; höchstens zwei, die zweite mit anderer Richtung.
  3. Kerzenpixel: liegt das Pixel (fast) auf einem Hintergrund (bis max(8, 0,4 T) + 1,5 × Rauschen), ist es Hintergrund; sonst Kerze, wenn
     Pixel − Hintergrund = s × (Kerzenfarbe − Charthintergrund) mit s 0,5–1,35 und Rest bis 10 + 10 % + Rauschen (Kerze in der Box: von der
     Füllung aus). Blasse Dochte wachsen senkrecht weiter (s ab 0,25), auch durch Pixel, die die Linienerkennung entfernt hat.
  4. Nur Säulen: dünne waagerechte Stücke (bis 3 px hoch, ab 1,6 × Körperbreite + 3, höchstens 15) und senkrechte Box-Kanten (Säule, die oben und
     unten an so einem Stück endet) fallen weg, ebenso gepunktete Linien (≥ 5 Punkte, gleicher Abstand), Kreis-Labels (Löcher in ≥ 30 % der
     Spalten; verschmolzene Label-Stapel zeilenweise auf Höhe der Löcher), Beschriftung in Kerzenfarbe (Kette ≥ 4 kleiner Formen; Formen im festen
     Abstand sind Kerzen, außer sie haben Löcher wie 0, 4, 6, %) und die oberste/unterste 2 Bildzeilen (angeschnittene Labels).
  5. Liniencharts (eine Hauptfarbe, ≥ 85 % der Spalten, Strich kaum länger als der Anstieg): nur mit gefüllten Zonen über die Farbmaske (ohne
     Schritt 4 waagerecht), sonst der bisherige Weg (Trend- und Fib-Linien in Linienfarbe).
  Strangwahl im Kerzenmodus: Auslassen kostet 2 statt 6, Belohnung bis 30 Pixel Säulenlänge statt 6 (sonst gewann ein Kreis-Label mit Pixeln in
  jeder Spalte gegen die dünnen Dochte); Lücken bis 10 px in einer Säule ohne Hintergrund (Linie kreuzt den Balken) werden überbrückt.
  Danach: dünn besetzte Stellen (±5 Kerzenabstände unter 30 % der mittleren Dichte des Kurses; dünne OHLC-Balken belegen nur ~5 %) fallen weg; Lücken über 1,6 ×
  Kerzenabstand (`KZ.P`, Median der Abstände der Formen) werden bis 14 Kerzen bzw. 5 % der Breite zwischen den Nachbarkerzen linear ergänzt
  (`IMG.ip`) und als unsicher markiert, ebenso Stellen mit konkurrierender Säule weit abseits (`IMG.uns` = Bereiche). `IMG.kz` = Farben,
  Körperbreite, Abstand, `ok`. Anzeige: unsichere Stellen orange im Chart (`ocUns`, `ocUnsR`, nachgezeichnete Spalten zählen nicht), darunter
  „Erkennung zu … % sicher“ (`ocQS`, `ocSure`); `IMG.q.sure`, Hinweis „Erkennung unsicher“ auch ab 12 % unsicherer Spalten.
  Zuschnitt-Vorschlag: oben/unten der 0,3-%-Wert statt des Extrems. Stand 25.11.2026 auf 40 Generatorbildern (Kerzen/OHLC): 96,9–97,2 % der Kerzen
  genau (bisher 92,1 %), Ausschlag-Spalten aller 40 Bilder 435 statt 1539; Liniencharts mit Zonen 0 statt 61/20 Ausschlag-Spalten.
  Weitere Filter: Farbsaum (Kerzenpixel, die in 5 × 5 von mehr als dreimal so vielen kräftigen andersfarbigen Pixeln umgeben sind), Label-Gruppen der
  alten Regel (`lab`), die zu weniger als 50 % aus Kerzenfarbe bestehen; Textzeilen der alten Regel nur im oberen Viertel (Legende).
  `tests/eigener-chart.js 6` am 25.11.2026, alt gegen neu (mit den neuen Zonen-Charts): Verlauf 92,8/93,4/94,6 % → 95,2/95,7/94,0 %,
  Ausschlag-Spalten 30/50/14 → 0/11/8, Einrasten 89,6/88,0/98,4 % → 100/94,6/95,5 %, Tipp auf vorhandenes Label 85,7/94,4/100 % →
  85,7/92,9/56,3 % (PC schwächer, auch Liniencharts über den alten Weg betroffen); der Test reißt weiter einzelne Grenzen (alt 10, neu 7 Fehler).
  Ränder (26.11.2026, Discord: „Mitte gut, links und rechts Fehler“): Ursache war vor allem die Achsenerkennung. Kerzenstücke, die alle an der
  gepunkteten Preislinie enden, galten als Zeitachse (`AX.b` mitten im Kurs), alles darunter fiel weg (Tiefs links, letzte Kerzen rechts). Seit
  26.11. zählt eine Zeitachse nur, wenn mind. 80 % ihrer Formen gleich hoch sind (±3 px, Ziffern). Außerdem: unbunte Kerzenfarben (weiß/grau) ab
  s 0,42 statt 0,5 (graue Abwärtskerzen), Lücken in einer Säule bis 20 px aus Zonenpixeln werden überbrückt (Docht durch den Rand einer Zone),
  die Schriftketten-Regel gilt nur für Formen ab 6 px Höhe oder über 3 px Breite (dünne Balken auf kleinen Bildern), die Label-Gruppen-Regel nur bei
  mehr kräftigen andersfarbigen Pixeln als Kerzenpixeln. Halb abgeschnittene Kerzen am Rand bleiben (nur die oberste/unterste 2 Zeilen fallen weg).
  s 0,42 gilt nur auf Screenshots (Rauschen unter 3); auf Fotos 0,5. Legende in Kerzenfarbe (helle OHLC-Charts, schwarze Schrift): Säulen, die ganz
  über der Unterkante der als Legende erkannten Schrift (`LT`) liegen, fallen weg. `tests/eigener-chart.js 6` am 26.11.: Verlauf 92,5/95,3/94,8 %,
  Fehler vor allem bei Fotos mit weißen OHLC-Balken, Zonen und Zeichnungen; dort gezielt verglichen (6 Bilder): neu 86–100 % der Kerzen, alt 74–84 %,
  Ausschlag-Spalten neu 12–163, alt 141–314.
  Offen: Tipp auf vorhandene Labels; Reste hinter der letzten Kerze (Kreis-Labels, Klammern von Fib-Beschriftungen) bleiben, liegen aber in den unsicheren Bereichen;
  Fotos mit überlappenden Zonen; Kreis-Labels in fast Kerzenfarbe auf stark verkleinerten Bildern.
- Kursverlauf (seit 23.11.2026, `ocPath`, direkt nach dem Zuschneiden): je Bildspalte höchstes und tiefstes Pixel von Kerzen bzw.
  Linie → `IMG.path` = {hi, lo (Zeile, -1 = nichts), man (nachgezeichnet)}, `IMG.auto` = erkannte Werte. Hintergrund je Kachel (48 px,
  häufigste Farbe, nur aus Pixeln innerhalb des Rahmens), Schwelle nach Kontrast. Schutzstufen (überarbeitet 23.11.2026 nach senkrechten Balken bis zur Legende):
  0. Rahmen und Zonen (seit 25.11.2026, CoreWeave-Bild aus dem Discord): Leisten der Oberfläche am Bildrand (Zeilen/Spalten zu unter 35 % in
     Charthintergrund, bis 25 % tief, `AX`) zählen nie; gefüllte Zonen (Fibonacci-/Zielzonen): Kacheln 16 px mit gleicher Nicht-Hintergrundfarbe
     (ab 45 %, mind. 4 nebeneinander) bzw. pixelweise gleichfarbige Flächen ab 40 px breit und 8 px hoch gelten als Hintergrund, ihre dünnen Ränder
     fallen mit weg; große Rahmen ohne Schrift (ab 60 px bzw. 5 % breit, `zbox`) verlieren ihre dünnen Kanten. Achsen an ausgerichteter Schrift:
     Preisachse = mind. 5 kleine Formen mit gleicher linker bzw. rechter Kante rechts (ab 82 % der Breite) über 40 % der Höhe, gleichmäßige Abstände
     (±35 %), dahinter nur Schrift (lange dünne Striche, gefüllte Kästchen und Formen über 6 % Breite ausgenommen), linke Kante über angrenzende Zeichen;
     Zeitachse = mind. 5 Formen mit gleicher Unterkante unten (ab 85 % der Höhe) über 40 % der Breite, dahinter in der Datumszeile nur Schrift. Alles
     dahinter fällt weg (`IMG.ax`), auch blasse Dochtspitzen werden nicht darüber hinaus verlängert.
  1. Linien: waagerecht ab 35 % Breite, senkrecht ab 90 % Höhe (Gitter, Fadenkreuz; lange echte Dochte bleiben), bis 5 px dick, Kreuzungen
     mit Kerzen bleiben; gestrichelte Linien (Gruppen bis 3 px hoch), Volumen am unteren Rand neben dem Hauptchart.
  1a. Gezeichnete Linien (seit 23.11.2026 nach Lennys Lumen-Bild: Trendlinien, Kanäle, Fibonacci, gepunktete Preislinie), waagerecht und schräg
     bis 58°, auch in Kursfarbe: dünne Pixel (senkrechter Lauf bis 4 px, bzw. bis 8 px bei mindestens so langem waagerechtem Lauf) stimmen für
     Geraden ab (Hough); jede Kandidatin wird mit einer Ausgleichsgeraden nachgemessen (Dicke = Median der Läufe). Linie = ab 12 % der Breite
     (mind. 50 px; seit 25.11.2026 6 % bzw. mind. 40 px für kurze Fibonacci- und Trendlinien) mit Treffern in mind. 35 % der Spalten (gepunktet 20 % bei 20 % Breite; Lücken bis 16 Spalten; Treffer nur frei stehend, nicht
     an Kerzen hängend). Entfernt nur, wenn der Kurs in mind. 60 % ihrer Spalten woanders liegt (sonst ist die Gerade selbst der Kurs, gerades Stück
     im Linienchart; seit 24.11.2026 werden erst alle Linien gesucht, Pixel auf anderen gefundenen Linien und weiter als 50 % der Höhe entfernte
     Pixel, etwa die Legende, zählen nicht als Kurs). Entfernt wird bis 8 Spalten über die Treffer hinaus und unter berührender Schrift hindurch; über einem Kerzenkörper fällt
     die Linie auch dort weg, ein 1 px breiter Docht bleibt.
  1b. Kästchen (seit 23.11.2026 nach Lennys PayPal-Bild): Rechtecke 12 px bis 35 % breit, 7–45 px hoch, Oberkante frei, Unterkante (auf Fotos
     unscharf; seit 25.11.2026 ab 70 % für runde Ecken) und beide Seiten zu mind. 70 %, mit Schrift innen (hohl: 3–70 % Pixel innen; gefüllt: andersfarbige Pixel ab 4 %); auch ohne sichtbare
     Unterkante (beide Seiten gleich lang) und wenn Kurs oder Balken links bzw. rechts angrenzen (Kante im Lauf, fehlende Ecke). Sie fallen ganz
     weg (Preis-, Symbol-, Hinweis-Kästchen). Rechtecke ohne Schrift (hohle oder gefüllte Kerzen) bleiben.
  2. Labels: kleine Gruppe (bis 110 × 44 px), unter bzw. über deren Mitte (4–60 px) der Kurs liegt (Hauptchart oder eine größere Form über
     44 px Höhe, nie eine Textzeile; sonst hielt die Regel Kerzen direkt unter der Legende für Labels).
     Keine pauschale Textregel mehr: Sie verwarf auf kleinen Bildern ganze Kerzenreihen.
  3. Ränder: Bänder oben (Legende: Symbol, OHLC, Indikatoren), unten (Zeitachse) und rechts (Preisachse, Preis-Kästchen) bis 18 % groß, durch
     mindestens 3 leere Zeilen bzw. Spalten getrennt (bis 2 Rauschpixel zählen als leer; die größte solche Grenze, unter der nur Formen bis
     44 px Höhe liegen; oben die größte Grenze wegen mehrzeiliger Legende, unten und rechts die nächste am Rand, weil Lücken zwischen Kerzen
     auch leere Spalten sind, `bands`/`cut`). Geschnitten wird je Form (auf Fotos verbindet Rauschen Buchstaben zu Gruppen über das Band hinaus);
     Formen in Kerzenfarbe bleiben, außer sie schließen oben und unten bündig mit Schrift ab (blaue Indikatorwerte in der Legende) oder stehen in
     einer Textzeile (mind. 4 kleine Formen auf gleicher Höhe, Legende ganz in Kursfarbe). Hohe dünne Striche (Stück der Achsenlinie) brechen ein
     Band nicht mehr ab. Achsen (seit 23.11.): Band rechts bzw. unten nur aus Schrift bis 16 px (bzw. 4 % der Höhe) in mind. 4 Zeilen bzw. Spalten
     über 40 % der Höhe bzw. Breite verteilt = Preis- bzw. Zeitachse, fällt ganz weg, auch in Kursfarbe (weiße Zahlen bei weißen Balken);
     lange dünne Striche (Achsenrand, ab 25 % der Höhe) zählen dabei nicht. Rechts geht es nach dem ersten Band weiter nach innen, solange das
     Band eine Achse ist (ein schmaler Streifen am Bildrand stoppte sonst vor der Preisachse); unten nicht (dort hielt das kleine Kerzen für die Zeitachse).
     Textzeilen im ganzen Bild (seit 23.11.): Ketten kleiner Formen (Abstand bis 0,8 × Höhe, Mitte und Ober- oder Unterkante ±3 px): ab 5 Formen
     (unterhalb des oberen Viertels nur schmale Formen wie Ziffern), oder 4 × so breit wie hoch aus lückenhaften Formen (Dichte bis 0,6), oder
     mind. 3 gleich hohe Formen mit gleicher Ober- und Unterkante (±2 px, Foto-Schrift). So fallen Legende ohne Lücke zum Chart und
     Fibonacci-Beschriftungen neben den Kerzen weg.
  4. Kursfarbe (seit 23.11.2026 aus der Form, `pal`/`pcol`): Farben der kräftigen Pixel (Kontrast ab 55 % von p98) in senkrechten Strichen
     (Lauf ab 3 px und 1,5 × so lang wie waagerecht, also keine flache dicke Linie), zu Farbgruppen zusammengefasst (Abstand bis 48); Kursfarbe =
     Gruppe ab 3 % dieser Pixel über mind. 10 von 24 Abschnitten der Breite (Labels stehen nur an wenigen Stellen). Ohne Striche (Linienchart): Farben
     der Hauptgruppe. Decken die Kursfarben mind. 60 % der Striche ab (`palS`), zählen nur Stränge mit mind. einem Pixel in Kursfarbe (Toleranz 56),
     sonst zählen sie doppelt. Unterstützt Kerzen, OHLC-Balken, Linie, hell/dunkel.
  5. Strangwahl (Kontinuität): je Spalte zusammenhängende senkrechte Stränge (Lücken bis 3 px). Gewählt wird je Spalte ein Strang auf dem
     günstigsten Weg durch alle Spalten (Viterbi: Belohnung je Strang bis 6 Pixel, Kerzenfarbe doppelt; ein Sprung kostet 0,6 × (Höhe − 3 px); seit
     23.11.2026 darf eine Spalte auch ausgelassen werden (kostet 6, bis 24 Spalten mit Strängen am Stück), sonst blieb der Weg zwischen dünnen
     OHLC-Balken lieber auf einer durchgehenden Trendlinie), so bleibt der Verlauf auf den Kerzen statt in Schrift, Labels oder Zeichnungen. Danach fallen Inseln
     weg: Stücke ohne Verbindung (innerhalb von 40 Spalten näher als 10 % der Höhe) mit zusammen unter 5 % der Spalten. Fester Vergleich am
     23.11. (48 feste Bilder mit Legende, Labels, Fotos): Verlauf je Kerze 95,0 % → 99,4 %, senkrechte Ausschläge 279 → 4; auf 144 Bildern: 99,0 %, 17 Ausschlag-Spalten (Kerzen-Fotos
     mit Legende nah an den Kerzen), Einrasten 93,5 % mit harten Versätzen. Seit den Zeichnungen (23.11., 144 Bilder, die Hälfte mit Zeichnungen,
     20 % OHLC): vorher 73,5 % / 2412 Ausschlag-Spalten / Einrasten 68 %, jetzt 96,9 % / 65 / 91 % (ohne Zeichnungen 93 %, wie vorher).
     `tests/eigener-chart.js` toleriert bis 0,4 % Ausschlag-Spalten (mit Zeichnungen 2 %, Einrasten ab 88 %). Liegt nur etwas über 25 % der Höhe daneben, bleibt die Spalte leer (kein Ausreißer). Echte lange Dochte
     hängen am Kerzenkörper und bleiben. Blasse Dochtspitzen werden bis 6 px verlängert.
  Was dann noch nicht passt, überzeichnet man mit „Verlauf nachzeichnen“.
- Der Verlauf liegt als Kerzen über dem Bild (seit 24.11.2026, `ocCandles`; vorher Zickzack aus Hoch und Tief, wirkte wie eine Doppelspur):
  `ocG()` Bildspalten je Kerze, so dass die Kerzen in der Start-Ansicht etwa so breit sind wie im Original (`IMG.cw` aus `ocPath`: Breite der
  Stücke mit Verlauf bei Kerzen/Balken mit Lücken, sonst etwa 250 Kerzen über die Breite), mindestens 2 Bildschirmpixel; hineingezoomt feiner,
  herausgezoomt gröber, Gruppen fest an Vielfachen von G. Hoch/Tief = genaues Extrem der Spalten, Schluss = Mitte der letzten Spalte, Eröffnung =
  Schluss davor; steigend gefüllt, fallend Umriss (`.occ`, `.occw/.occu/.occd`). Gilt auch für Nachgezeichnetes. Das Einrasten nutzt weiter die
  einzelnen Spalten. Test: `node tests/verlauf-kerzen.js` (Playwright, Handy/PC, feste Bilder und Linienchart, 0/100 %, Zoom: Hoch/Tief und
  Körper genau, Anzahl wie im Original, feiner/gröber, Einrasten auf der Spalte, Kontrast auf Weiß). Testzugriff `PGS.ocG()`.
  Kästchen „Erkannten Verlauf zeigen“,
  `IMG.show`). „Verlauf nachzeichnen“ (`IMG.trace`): ein Finger bzw. die Maus zeichnet (`TRS`, `ocApply`: gleitendes Mittel über 3
  Messpunkte, Spalte für Spalte in den Verlauf, `man` = 1), ein zweiter Finger zoomt, erneutes Zeichnen bessert nach, „Erkannten Verlauf
  wiederherstellen“ setzt `IMG.auto` zurück. Während des Nachzeichnens werden keine Punkte gesetzt.
- Einrasten (`imgSnap`, seit 23.11.2026 auf dem Verlauf): Profil `IMG.path`, Wendehoch/-tief in ±K Spalten wie beim Kerzen-Einrasten
  (Abstand zum Finger bis 1,5 × Fangradius, Bonus für markante Spitzen, Richtung aus `wantOf`). Kein Treffer: frei. Start ohne Richtung: das
  nähere von Hoch und Tief (wie in Schwer). Tipps bis Fangradius neben dem Bildrand gelten noch. Nachgezeichnetes zählt sofort.
- Prüfen (`imgVerify`, sobald eine große Zählung 3 Punkte hat): `frCheck` ohne Kerzendaten (Lage am Hoch entfällt, Wellengebiet aus den
  Punkten), merkt das passende Muster (`S.fitQ`). Alle Befunde auf einmal: harte Regeln = Fehler (rot, Grenzlinie), Warnsignale und
  Faustregeln = Hinweise, Invalidierungslinien des passenden Musters für große Zählungen. Text nur „Deine Zählung ist regelkonform“
  bzw. „verstößt gegen …“, nie „richtige Zählung“. Danach „Als Bild speichern“ (PNG: Bild, Labels, Linien, Fazit, „Wave Checker“;
  `ocPng`), „Teilen“ (nur Touch mit Datei-Teilen), „Zählung ändern“, „Neues Bild“. Testzugriff: `PGS.img`, `PGS.res` (ok, errs, notes,
  lines, sub = Warnsignale der Unterteilung {c,k,need,n}, subJ = beurteilte Wellen), `PGS.lastPng`, `PGS.setOCF(f)`, `IMG.cand`.
- Unterteilung prüfen (seit 23.11.2026, `ocSub`, in `imgVerify` für jede regelkonforme Zählung): Für jede Welle ohne eigene Unterteilung
  sucht ein ZigZag-Filter (`ocZig`, Schwelle 4 % der Wellenlänge) die Wendepunkte im Verlauf. `ocFit` sucht daraus eine Unterteilung, die
  die Welle laut `PGSUB` haben darf (Vereinigung über alle Muster der Zählweise, deren harte Regeln die Zählung erfüllt) und die die harten
  Regeln des Teilmusters erfüllt: abwechselnd Hoch/Tief, jede Teilwelle ≥ 8 % der Welle, jeder Wendepunkt Extrem seiner Teilwellen (bis 3 %),
  eine Größenordnung (jede nicht gewählte Gegenbewegung innerhalb einer Teilwelle höchstens `OCF` = 1,5 × die kleinste gewählte Korrektur).
  Ergibt außerdem der ZigZag bei einer der Schwellen 5–35 % (`OCZZ`) genau eine regelkonforme Unterteilung, gilt die Welle ebenfalls als passend.
  Sonst Warnsignal, Text je Befund (seit 23.11.2026, Feld `kind`): `regel` = Teilwellen in der passenden Zahl gefunden, aber Regel verletzt
  („Die gefundenen 5 Teilwellen verletzen eine Regel (Welle 4 überschneidet Welle 1)“, Regel des am besten passenden Teilmusters), `drei`/`fuenf`
  = die andere Zahl gefunden („sie wirkt eher dreiteilig“ bzw. bei Korrekturwellen „eher fünfteilig“), `unruhig` = sonst („wirkt unruhiger, mit
  mehr Teilwellen“). Dazu die Wendepunkte dieses Befunds gestrichelt (`.pgzz`, `m.zz`) und die Welle orange hinterlegt (`.pgwb`, `m.zzw`).
  Antippen eines solchen Warnsignals (`.ocsubn`, `data-zz`) holt Chart und Welle ins Bild und lässt sie kurz blinken. Nicht beurteilt wird
  Seit 26.11.2026 steht bei jedem dieser Warnsignale „Automatisch erkannt, kein Regelverstoß“. Befunde aus automatisch gefundenen Teilwellen sind
  nie harte Regeln; harte Fehler zu Unterteilungen kommen nur aus selbst gezählten Unterteilungen (`frCheck`). Deren Befunde markieren die Welle rot
  (`.pgeb`, `m.ew`) und alle Punkte der Unterteilung (`pids`). Eine Unterteilung, die nur aus dem Start besteht (Welle antippen + Zählweise, dann
  nichts weiter), wird weder geprüft noch hält sie die automatische Prüfung der Welle ab.
  nur eine Welle ohne Gegenbewegung (ZigZag 4 % mit weniger als 3 Teilwellen).
- Ergebnis-Überschrift (seit 23.11.2026, `PGS.res.state`): harter Regelverstoß rot (Vorrang), sonst bei Warnsignalen zur Unterteilung orange
  mit Warn-Icon „Prüfe die Subwellen“ und „Die Hauptwellen sind regelkonform, aber in Welle 1 und 3 passt die innere Struktur nicht sicher.“,
  nur ohne sie grün „Deine Zählung ist regelkonform“ (Export-Bild ebenso). Hinweise immer sortiert: harte Fehler → Warnsignale zur
  Unterteilung → andere Warnsignale → Faustregeln. Selbst gezählte Unterteilungen prüft wie bisher `frCheck`. Abwägung (Strukturtest, 23.11.): mit `OCF` 1,5
  rund 2–4 % Fehlalarme, eine in Wahrheit dreiteilige Welle 3 wird in rund 20–35 % erkannt (seit dem Zulassen einer
  einzelnen Schwelle 23.11. rund 34 %); „genau eine Schwelle“ statt Suche ergab 26 %
  Fehlalarme bei 79 % Erkennung, kleineres `OCF` (1,0) 13 % Fehlalarme.
- Test: `node tests/eigener-chart.js [Runden]` (Playwright, Handy/iPad/PC, `NUR=Handy` für ein Gerät, `DBG=1` Fehlgriffe, `SHOTS=Ordner`
  Bildschirmfotos). Seit 23.11. auch: erkannter Verlauf an jeder Kerze (≥ 95 %, Stand rund 99,8–100 %), Nachzeichnen mit echtem Strich,
  Einrasten auf dem Strich, Wiederherstellen. Testbilder im TradingView-Stil mit bekannten Preisen (hell/dunkel, Kerzen/Linie, linear/log, Handyfoto-Simulation
  mit Unschärfe/Rauschen/Moiré/JPEG, teils mit eingezeichneten Labels): Hochladen, echtes Zuschneiden, Einrasten ≥ 95 % (Stand 20.11.:
  Handy, iPad, PC je rund 99–100 %, Labels 100 %), Ziehen, Prüfergebnis gleich den Regeln für die bekannten Preise (log: Pixelhöhe),
  Regler, Bild-Export, Spielstand unverändert. Der Start wird auf bzw. jenseits des Extrems getippt. Nach Änderungen an Schwer,
  `snapPt` oder `frCheck` auch diesen Test laufen lassen.
- Richtungs-Test (seit 26.11.2026, Discord-Screenshot): `node tests/unterteilung-richtung.js` (Playwright, Handy/iPad/PC) auf
  `coreweave-original.png`: große W-X-Y, W als (a)(b)(c), X und Y als (w)(x)(y), dazu angefangene Unterteilungen nur mit Start in (b) und Y. Keine
  Meldung „falsche Richtung“, keine harte Regel zu Unterteilungen, Warnsignale nur unter „Hinweise“ mit „Automatisch erkannt“. Gegenprobe: X-Unterteilung
  mit erster Teilwelle nach unten → harte Regel „Die erste Teilwelle läuft gegen die Welle. Sie muss in dieselbe Richtung laufen wie die Welle selbst.“,
  Welle X rot hinterlegt, Punkte markiert. Vorher (bis 25.11.) meldete die App für die angefangenen Unterteilungen „beginnt in die falsche Richtung:
  Die erste Teilwelle läuft wie die Welle selbst“. Nach Änderungen an `frCheck`, `frStartSub`, `imgVerify` oder `ocSub` laufen lassen.
- Fall-Test: `node tests/subwellen.js [Durchläufe]` (Playwright, Handy/iPad/PC): gebaute Linien-Charts, Welle 3 je Fall dreiteilig, fünfteilig
  mit Regelbruch (IMP-3), unruhig, sauber, dazu ein harter Verstoß: Text je Befund, Überschrift (orange/grün/rot), Reihenfolge, Hervorhebung,
  Antippen blinkt, Export. Nach Änderungen an `ocSub`, `imgVerify` oder den Texten laufen lassen.
- Verlauf auf festen Bildern (seit 25.11.2026 auch `coreweave-zeichnungen-ganz.png` = Discord-Screenshot ohne Zuschnitt, voller Zeichnungen, und
  `coreweave-zeichnungen.png` = dessen vorgeschlagener Ausschnitt; Felder `vorschlag`, `hinweis`, `ausschlaege`; der zweite Discord-Screenshot zeigte
  nur die App und ist kein Testbild; seit der Kerzensuche auch `coreweave-original.png` = derselbe Screenshot in Originalgröße 1921 × 1276 mit
  verbotener Oberkante der Box b und Zone hinter der letzten Kerze): `node tests/verlauf.js` (Playwright, Handy/iPad/PC). Bilder und Erwartungen in `tests/faelle/faelle.json`
  (Bereich, kein Verlauf über `oben`/unter `unten`, keine senkrechten Ausschläge, Abdeckung je 6 Spalten). `legende-oben.png` = Lennys
  Screenshot vom 23.11.2026 (TradingView dunkel, Legende, Preisachse, Labels; blaue App-Linie herausgerechnet). `lumen-trendlinien.png` =
  Lennys Original (dünne weiße OHLC-Balken, lila Trendlinien, Kästchen 6.49), `paypal-preiskaestchen.png` = Lennys Original (dünne weiße
  Kerzen, Kästchen PYPL/52.84/44.31, gepunktete Preislinie, Preisachse mit Rand, E/D-Symbole). Optional je Fall `kurs` (Kursfarbe bzw. Helligkeit; nur Pixel mit Nachbar in Kursfarbe
  darüber oder darunter, also keine Punkte einer gepunkteten Linie; seit 25.11.2026 zählt auch ein einzelnes Pixel ohne 2 weitere in derselben Zeile
  ±12 Spalten, also ein Balken ohne Bewegung wie in Lumen): Verlauf bis 3 px am obersten/untersten Kurspixel (Anteil `nah`), höchstens 0,5 % der Spalten mehr als 8 px abseits; `verboten` = Rechtecke ohne Verlauf. Neue
  Problembilder dort aufnehmen (Original-Screenshots sind besser als zurückgerechnete). Seit 26.11.2026 Randtest: je 5 % (mind. 30 Spalten) links und
  rechts von `rand` (erste/letzte Kerzenspalte, sonst `bereich`) mind. 80 % Abdeckung; Fälle mit `vorschlag` laufen zusätzlich mit dem vorgeschlagenen
  Ausschnitt (Ränder, keine Zeitachse mitten im Kurs). `tests/eigener-chart.js` zeichnet seit 23.11. auch TradingView-Legende im Chart, gepunktete Linie des letzten Kurses,
  Preis-Kästchen auf der mitgeschnittenen Preisachse und lange Dochte und prüft „keine senkrechten Ausschläge“. Seit 23.11. außerdem OHLC-Balken
  (farbig bzw. weiß/grau, `kind:'ohlc'`) und Zeichnungen (`draw`: Trendlinie durch zwei Hochs/Tiefs, Kanal, Fibonacci mit Beschriftung,
  Symbol-Kästchen auf Kurshöhe; Farbe lila, blau, grau oder Kursfarbe); verdeckte Kerzen zählen nicht (`hid`), an berührten Spitzen (`tt`) 3 px
  Toleranz. Seit 25.11.2026 Zonen (`zones`, 35 %): 1–3 halbtransparente Rechtecke über den Kerzen in Kerzenrot, -grün oder Orange mit Rand und
  Beschriftung in derselben Farbe, dazu kurze Fib-Striche; von Schrift verdeckte Kerzen zählen nicht, Wendepunkte auf einer Kante bekommen `tt`.
- Strukturtest: `node tests/struktur.js [Charts je Gerät]` (Playwright, Handy/iPad/PC, `NUR`, `DBG=1`, `OCF=Faktor`): Charts aus `pgData`
  (alle Muster, bekannte Unterteilung) als Bild im TradingView-Stil (hell/dunkel, Kerzen/Linie, teils Foto), große Welle an den bekannten
  Wendepunkten gezählt: Fehlalarme ≤ 5 % der beurteilten Wellen, ≥ 70 % beurteilt; manipulierte Impulse mit dreiteiliger Welle 3 (Zigzag)
  müssen über alle Geräte in ≥ 15 % ein Warnsignal für Welle 3 geben (Stand 23.11.: rund 20 %). Nach Änderungen an `ocPath`, `ocZig`, `ocFit` oder `PGSUB` laufen lassen.

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
- Seit 26.11.2026: Unterteilungen, die nur aus dem Start bestehen, werden nicht geprüft (vorher meldete die Richtungsprüfung ohne erste Teilwelle
  „falsche Richtung“). Text der Richtungsprüfung: „… beginnt in die falsche Richtung: Die erste Teilwelle läuft gegen die Welle. Sie muss in
  dieselbe Richtung laufen wie die Welle selbst.“ Befunde zu Unterteilungen tragen `S`, `k`, `sub`, `pids` (Hervorhebung).
- Eine Unterteilung, die vor dem Ende der übergeordneten Welle aufhört, bleibt als angefangene Zählung erlaubt. Fehlt nur das letzte
  Label und liegt der letzte Punkt vor dem Wellenende, endet sie wie bisher am Ende der Welle darüber (`endImpl`).
