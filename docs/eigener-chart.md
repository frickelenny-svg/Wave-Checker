# „Eigenen Chart prüfen“ – Übergabe (Stand 25.11.2026)

Kurzfassung für einen neuen Chat. Details zu Regeln und Schwellen stehen in CLAUDE.md (Abschnitt „Eigenen Chart prüfen“), Gestaltung in DESIGN.md.

## Aufbau und Ablauf

Kein Spielmodus (keine Punkte, Serie, Ränge, Tutorials), ohne KI und ohne Server. Das Bild bleibt im Browser. Alles steckt in `index.html`.

| Schritt | Funktion | Was passiert |
|---|---|---|
| Hochladen | `ownChart()` | Dateifeld bzw. Ziehen (PNG/JPG), Tipp „Zeichnungen ausblenden“ (`.octip`), Hinweis `OCNOTE` |
| Zuschneiden | `ocCrop(im,u)`, `ocSuggest(im)` | Vorschlag = vorgewählter Rahmen (ohne Achsen, Legende, Leisten), anpassen oder neu ziehen, „Ganzes Bild“; höchstens `OCMAX` = 2000 px |
| Verlauf erkennen | `ocPath(IMG)` | je Bildspalte Hoch/Tief → `IMG.path` {hi, lo, man}, `IMG.auto`, `IMG.cw` (Kerzenbreite), `IMG.ax` (Rahmen/Achsen), `IMG.q` (Qualität) |
| Zählen | `progn({img:IMG},'schwer')` | Bedienung wie „Wie geht es weiter?“ Schwer (Zeichnen/Auswählen, Unterteilungen) |
| Darstellung | `pic()`, `ocCandles()`, `ocG()` | Bild als `<image>`, Regler „Bild blasser“ (0–100 %), Verlauf als Kerzen |
| Steuerung | `zoomX`, `zoomAt`, `clampSc`, `imFit`, `imClamp` | Mausrad streckt die Zeitachse, Strg+Mausrad/+/− zoomen, Ziehen verschiebt, Streifen unten (Modus `ax`), Bild immer randfüllend und begrenzt |
| Einrasten | `imgSnap(px,py,o)` | Wendehoch/-tief auf `IMG.path` (nicht auf den gezeichneten Kerzen) |
| Nachzeichnen | `ocApply(S)` | Strich ersetzt nur die gezeichneten Spalten (`man` = 1) |
| Prüfen | `imgVerify()`, `frCheck`, `ocSub`/`ocZig`/`ocFit` | Regeln (rot), Warnsignale/Faustregeln, Unterteilung per ZigZag (orange „Prüfe die Subwellen“) |
| Prüfen gesperrt | `ocWhy()` | konkreter Grund unter dem Knopf (`#pgwhy`) |
| Export | `ocPng()`, `ocSave`, `ocShare` | PNG mit Bild, Labels, Linien, Fazit |

Testzugriff: `PGS.img`, `PGS.res`, `PGS.ocG()`, `PGS.snapAt`, `PGS.X/Y`, `PGS.Tof/Pof`, `PGS.view()`, `PGS.zoom()`, `PGS.lastPng`.

## Chart-Erkennung (`ocPath`) – aktueller Stand

Reihenfolge im Code:

1. **Hintergrund:** globaler Modus `G`, dann je 48-px-Kachel der häufigste Farbton, nur aus Pixeln innerhalb des Rahmens. Kontrastschwelle `T` aus p98.
2. **Rahmen `AX`:** Leisten der Oberfläche am Bildrand (Zeilen/Spalten zu unter 35 % in Farbe `G`) fallen weg.
3. **Zonen:** gefüllte Flächen (16-px-Kacheln bzw. pixelweise gleichfarbige Flächen ab 40 × 8 px) gelten als Hintergrund, ihre dünnen Ränder fallen mit weg.
4. **Lange Linien:** waagerecht ab 35 % Breite, senkrecht ab 90 % Höhe (Gitter); Kreuzungen mit Kerzen bleiben.
5. **Gezeichnete Linien (Hough):** dünne Pixel stimmen für Geraden bis 58° ab, Ausgleichsgerade, ab 6 % Breite. Entfernt nur, wenn der Kurs in mindestens 60 % der Spalten woanders liegt. Dabei zählen andere gefundene Linien und Pixel weiter als 50 % der Höhe weg nicht (sonst verschwanden gerade Kursstücke im Linienchart).
6. **Kästchen:** Rechtecke mit Schrift (auch runde Ecken, angrenzender Kurs, fehlende Unterkante). Große Rahmen ohne Schrift (`zbox`) verlieren nur ihre Kanten.
7. **Formen und Gruppen:** Achsen an ausgerichteter Schrift (Preisachse: gleiche linke/rechte Kante und gleichmäßige Abstände; Zeitachse: gleiche Unterkante). Dahinter darf nur Schrift liegen.
8. **Labels:** kleine Gruppen direkt über bzw. unter dem Kurs. Randbänder oben, unten und rechts (`bands`/`cut`). Textzeilen im ganzen Bild als Ketten kleiner Formen.
9. **Kursfarbe (`pal`/`pcol`):** aus senkrechten Strichen (Kerzen, Balken), über die Breite verteilt. Bei hoher Abdeckung (`palS`) zählen nur Stränge in Kursfarbe.
10. **Strangwahl (Viterbi):** je Spalte ein Strang. Sprung kostet 0,6 × (Höhe − 3), Auslassen einer Spalte kostet 6. Danach Inseln und Ausreißer weg, blasse Dochtspitzen bis 6 px (nur innerhalb `AX`).
11. **Qualität:** `IMG.q` = {cov, draw, low}. Hinweis `.ocq` bei Abdeckung unter 80 % oder entfernten Zeichnungen ab `Q_DRAW` = 0,8 % der Fläche.

## Probierte Ansätze: was ging, was nicht

| Ansatz | Ergebnis |
|---|---|
| Pauschale Textregel („kleine Gruppe = Schrift“) | verwarf auf kleinen Bildern ganze Kerzenreihen → ersetzt durch gezielte Label-, Rand- und Textzeilen-Regeln |
| Strang je Spalte nach gleitendem Median | sprang in Legende und Labels → ersetzt durch Viterbi-Weg |
| Viterbi ohne Auslassen (Sprung 2 × Höhe) | blieb bei dünnen OHLC-Balken auf einer durchgehenden Trendlinie (Lumen) → Auslassen erlaubt, Sprungkosten gesenkt |
| Kursfarbe = häufigste Farben der Hauptgruppe | Trendlinien und Labels landeten in der Kursfarbe → Farbe aus der Form (senkrechte Striche) |
| Kursfarbe aus allen Strich-Pixeln | auf Fotos zu viele Mischfarben → nur kräftige Kernpixel |
| Hough-Linien: „Kurs woanders“ über alle Pixel | Legende und gepunktete Preislinie zählten als Kurs, gerade Stücke im Linienchart verschwanden → zuerst alle Linien sammeln, Fenster ±50 % der Höhe |
| Hintergrund je 48-px-Kachel über das ganze Bild | Kacheln am schwarzen Oberflächenrand machten den Chart daneben zu „Inhalt“ → Rahmen zuerst, Kacheln nur innerhalb |
| Zuschnitt-Vorschlag auf 900-px-Kopie | Achsenziffern zu blass, Achsen nicht erkannt → 1600 px |
| Achsen ohne Prüfung der Abstände bzw. „dahinter nur Schrift“ | OHLC-Balken und Kerzenteile galten als Achsenschrift → gleichmäßige Abstände; Ausnahmen nur für lange dünne Striche, gefüllte Kästchen und breite Zonen |
| Zonen nur über Kacheln ab 4 × 16 px | schmale Zonen (55 px) blieben → zusätzlich pixelweise |
| Mindestlänge gezeichneter Linien 12 % | kurze Fibonacci-/Trendlinien blieben → 6 % (Messung leicht besser) |
| Unterteilungsprüfung empfindlicher (`OCF` 1,0 bzw. „genau eine Schwelle“) | 13 % bzw. 26 % Fehlalarme → `OCF` 1,5 (2–4 % Fehlalarme, rund 20–35 % Erkennung dreiteiliger Wellen) |
| Bild frei verschiebbar, nicht randfüllend | Bild ließ sich aus der Fläche schieben (Video Lenny) → fixiert |

## Testbilder und Tests

Feste Bilder liegen in `tests/faelle/`, die Erwartungen in `tests/faelle/faelle.json`:

| Bild | Inhalt |
|---|---|
| `legende-oben.png` | TradingView dunkel, Legende, Preisachse, Labels (App-Linie herausgerechnet) |
| `lumen-trendlinien.png` | Original: dünne weiße OHLC-Balken, lila Trendlinien, Kästchen |
| `paypal-preiskaestchen.png` | Original: Kästchen PYPL/52.84/44.31, gepunktete Preislinie, E/D-Symbole |
| `coreweave-zeichnungen-ganz.png` | Discord: ohne Zuschnitt, voller Zeichnungen, Zonen, Kästchen VERKAUF/KAUF |
| `coreweave-zeichnungen.png` | dessen vorgeschlagener Ausschnitt |

Tests (alle Playwright, `NODE_PATH` und `PWCH=msedge` siehe Memory bzw. CLAUDE.md):

| Test | Prüft |
|---|---|
| `tests/verlauf.js` | feste Bilder: Verlauf am Kurs, keine Ausschläge, verbotene Bereiche, Vorschlag, Hinweis |
| `tests/eigener-chart.js [Runden]` | Zufallsbilder (Generator `MK`: Kerzen/OHLC/Linie, hell/dunkel, Foto, Legende, Labels, Zeichnungen): Verlauf, Einrasten, Ziehen, Nachzeichnen, Prüfen, Export |
| `tests/struktur.js` | Unterteilungsprüfung: Fehlalarme, Erkennung dreiteiliger Welle 3 |
| `tests/subwellen.js` | Warnsignal-Texte, Überschrift, Hervorhebung |
| `tests/verlauf-kerzen.js` | Kerzen-Darstellung genau, Zoom feiner/gröber |
| `tests/bild-steuerung.js` | Mausrad, Ziehen vs. Klick, Streifen, Grenzen, Deckungsgleichheit |
| `tests/bild-blasser.js` | Regler 0/50/100 %, Kontrast, Export |
| `tests/pruefen-nachzeichnen.js` | Tipp, Vorschlag, Grund unter „Prüfen“, Nachzeichnen, danach Prüfen |

Tests, die fertig zugeschnittene Bilder hochladen, müssen vor „Weiter“ auf `#ocall` („Ganzes Bild“) klicken, sonst greift der Zuschnitt-Vorschlag.

Für feste Vergleiche gab es ein Skript `bench2.js` (144 Generatorbilder: Verlauf je Kerze, Ausschläge, Einrasten mit harten Versätzen). Es lag nur im temporären Arbeitsordner. Stand: 96,3 % Verlauf, 37 Ausschlag-Spalten, 89,6 % Einrasten. Bei Bedarf als `tests/` neu anlegen.

## Bekannte offene Probleme

- **CoreWeave (viele Zeichnungen):**
  - Der Verlauf hängt noch an Kanten der Zone „b“, an zwei kurzen blauen Linien, an Zonenkanten unten rechts und am Logo unten links.
  - `zbox` greift dort nicht, weil die Zonenfüllung zu blass ist.
  - Auf dem unbeschnittenen Bild bleibt eine Ausschlag-Spalte (erlaubt per `ausschlaege` in `faelle.json`).
- **Zufallstest streut:** `tests/eigener-chart.js` reißt immer wieder knapp einzelne Grenzen (Einrasten 95 % bzw. 88 % mit Zeichnungen, Ausschläge 0,4 % bzw. 2 %, „Ziehen ins Leere“). Das tut auch der Stand vor den Umbauten. Kein fester Fehler gefunden.
- **Fotos:** Legende nah an den Kerzen und Beschriftungen, die von Linien durchkreuzt werden, erzeugen einzelne Ausschläge.
- **Unterteilungsprüfung:** Eine dreiteilige Welle 3 wird nur in rund 20–35 % erkannt (bewusst vorsichtig wegen der Fehlalarme).
- **Achsenerkennung:** setzt ausgerichtete Schrift mit regelmäßigen Abständen voraus. Andere Plattformen als TradingView sind kaum getestet.
- **Leichte Verzerrung:** Bei sehr hohen bzw. flachen Bildern ist das Bild leicht gestreckt, weil die Chartfläche in der Höhe begrenzt ist.
- **Laufzeit:** `ocPath` braucht am PC rund 0,2–0,7 s (2000-px-Bilder); auf alten Handys spürbar.
- **Weiteres Material:** Ein Originalscreenshot zu `legende-oben.png` fehlt; weitere echte Problembilder in `tests/faelle` aufnehmen.
