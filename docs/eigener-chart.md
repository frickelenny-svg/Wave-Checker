# „Eigenen Chart prüfen“ – Übergabe (Stand 26.11.2026)

Kurzfassung für einen neuen Chat. Details zu Regeln und Schwellen stehen in CLAUDE.md (Abschnitt „Eigenen Chart prüfen“), Gestaltung in DESIGN.md.

## Aufbau und Ablauf

Kein Spielmodus (keine Punkte, Serie, Ränge, Tutorials), ohne KI und ohne Server. Das Bild bleibt im Browser. Code (seit 26.11.2026 aufgeteilt): Hochladen/Zuschneiden in `js/modi/eigener-chart.js`, Bilderkennung (`ocKerzen`, `ocPath`) in `js/modi/eigener-chart-erkennung.js`, Zählen, Einrasten, Prüfen und Export in `progn` (`js/modi/prognose.js`).

| Schritt | Funktion | Was passiert |
|---|---|---|
| Hochladen | `ownChart()` | Dateifeld bzw. Ziehen (PNG/JPG), Tipp „Zeichnungen ausblenden“ (`.octip`), Hinweis `OCNOTE` |
| Zuschneiden | `ocCrop(im,u)`, `ocSuggest(im)` | Vorschlag = vorgewählter Rahmen (ohne Achsen, Legende, Leisten), anpassen oder neu ziehen, „Ganzes Bild“; höchstens `OCMAX` = 2000 px |
| Kerzensuche | `ocKerzen(k)` (aus `ocPath`) | Kerzenfarben, lokaler Hintergrund je 16-px-Kachel, nur Säulen in Kerzenfarbe → Maske für die Strangwahl; Rückfall auf den alten Weg ohne Kerzen |
| Verlauf erkennen | `ocPath(IMG)` | je Bildspalte Hoch/Tief → `IMG.path` {hi, lo, man}, `IMG.auto`, `IMG.cw` (Kerzenbreite), `IMG.ax` (Rahmen/Achsen), `IMG.q` (Qualität) |
| Zählen | `progn({img:IMG},'schwer')` | Bedienung wie „Wie geht es weiter?“ Schwer (Zeichnen/Auswählen, Unterteilungen) |
| Darstellung | `pic()`, `ocCandles()`, `ocG()` | Bild als `<image>`, Regler „Bild blasser“ (0–100 %), Verlauf als Kerzen: seit 26.11.2026 jede erkannte Kerze 1:1 (`IMG.cdl`), Zoom ändert nur Breite und Abstand; Spaltengruppen mit fester Breite nur im Rückfall und für Nachgezeichnetes |
| Steuerung | `zoomX`, `zoomAt`, `clampSc`, `imFit`, `imClamp` | Mausrad streckt die Zeitachse, Strg+Mausrad/+/− zoomen, Ziehen verschiebt, Streifen unten (Modus `ax`), Bild immer randfüllend und begrenzt |
| Einrasten | `imgSnap(px,py,o)` | Wendehoch/-tief auf `IMG.path`, seit 26.11.2026 auf Docht und Hoch/Tief der erkannten Kerze |
| Nachzeichnen | `ocApply(S)` | Strich ersetzt nur die gezeichneten Spalten (`man` = 1) |
| Prüfen | `imgVerify()`, `frCheck`, `ocSub`/`ocZig`/`ocFit` | Regeln (rot), Warnsignale/Faustregeln, Unterteilung per ZigZag (orange „Prüfe die Subwellen“, „Automatisch erkannt“, nie harte Regel); Befunde zu selbst gezählten Unterteilungen: Welle rot hinterlegt (`.pgeb`), Punkte markiert. Unterteilungen nur mit Start werden nicht geprüft (26.11.2026) |
| Prüfen gesperrt | `ocWhy()` | konkreter Grund unter dem Knopf (`#pgwhy`) |
| Export | `ocPng()`, `ocSave`, `ocShare` | PNG mit Bild, Labels, Linien, Fazit |

Testzugriff: `PGS.img`, `PGS.res`, `PGS.ocG()`, `PGS.snapAt`, `PGS.X/Y`, `PGS.Tof/Pof`, `PGS.view()`, `PGS.zoom()`, `PGS.lastPng`.

## Kerzensuche (`ocKerzen`, seit 25.11.2026)

Anlass: Discord-Feedback (CoreWeave in Originalgröße, `tests/faelle/coreweave-original.png`): waagerechte Treppen entlang von Fibonacci-Boxen, flacher Verlauf auf Fib-Linien. Ursache im alten Weg: Kerzen in halbtransparenten Boxen verschwanden mit der Zonenfarbe, übrig blieben Box-Kanten und Fib-Texte in Kerzenrot.

1. **Lokaler Hintergrund:** je 16-px-Kachel die häufigste Farbe (Fotos: alle Pixel nahe daran). Kandidaten je Pixel: Charthintergrund plus 3 × 3 Kacheln. Kachelfarben, die selbst Kerzenfarbe sind, fallen weg.
2. **Kerzenfarben:** Striche (senkrechte Läufe), gruppiert nach Richtung vom Charthintergrund aus (Farbfächer, häufigste zuerst), Bezug 90-%-Wert. Höchstens zwei, die zweite mit anderer Richtung.
3. **Kerzenpixel relativ:** Pixel − Hintergrund = s × (Kerzenfarbe − Charthintergrund), s 0,5–1,35. Eine Box über der Kerze verschiebt Kerze und Hintergrund gleich. Pixel auf einem Hintergrund (auch Box-Füllung) sind nie Kerze. Blasse Dochte wachsen senkrecht weiter.
4. **Nur Säulen:** dünne waagerechte Stücke, senkrechte Box-Kanten, gepunktete Linien, Kreis-Labels, Beschriftungsketten und die äußersten 2 Bildzeilen fallen weg.
5. **Danach in `ocPath`:** Strangwahl mit billigem Auslassen und Belohnung langer Säulen, dünn besetzte Stellen weg, Lücken linear ergänzt (`IMG.ip`), unsichere Bereiche `IMG.uns` → orange im Chart, „Erkennung zu … % sicher“.
6. **Liniencharts:** nur mit gefüllten Zonen über die Farbmaske, sonst der alte Weg.
7. **Ränder (26.11.2026):** Die Zeitachse zählt nur mit gleich hohen Formen (Ziffern), sonst schnitt eine Reihe Kerzenstücke an der gepunkteten Preislinie den Kurs unten ab. Graue Kerzen ab s 0,42, Dochte über Zonenränder hinweg, dünne Balken auf kleinen Bildern sind keine Schrift. Randtest in `tests/verlauf.js` (`rand`, auch mit Zuschnitt-Vorschlag).

Messung (40 Generatorbilder, Skript nur im Arbeitsordner): Kerzen/OHLC 97 % genau statt 92 %, Ausschlag-Spalten 435 statt 1539.

Weitere Filter (26.11.2026): Farbsaum (Kerzenpixel, umgeben von mehr als dreimal so vielen kräftigen andersfarbigen Pixeln), alte Label-Gruppen mit mehr kräftigen Fremdpixeln als Kerzenpixeln, Legende in Kerzenfarbe (Säulen ganz über der Unterkante der Legendenschrift `LT`), Textzeilen der alten Regel nur im oberen Viertel. Lücken in einer Säule bis 10 px ohne Hintergrund (Linie kreuzt) bzw. bis 20 px aus Zonenpixeln werden überbrückt. s 0,42 nur für unbunte Kerzen auf Screenshots.

## Kerzen 1:1 (`IMG.cdl`, seit 26.11.2026)

- `ocPath` baut im Kerzenmodus je erkannter Kerze {a, b, xc (Docht), hi, lo, o, c, up}. Kerze = zusammenhängende Spalten mit Verlauf (ohne ergänzte).
- **Kerzenabstand:** aus der Regelmäßigkeit der Hoch/Tief-Sprünge zwischen Spalten (kleinste Verschiebung 2–40 mit mind. 85 % der stärksten Selbstähnlichkeit), sonst aus den Formen ab 3 px Höhe (`KZ.P`). Lange Stücke werden im Abstand geteilt.
- **Dichte Charts** (PayPal: mehrere Kerzen je Bildspalte, Hoch/Tief ändern sich fast jede Spalte, keine Regelmäßigkeit, lückenlos): schmale Kerzen fester Breite 2 Spalten (`d:1`), Docht = Extrem, Körper aus erster/letzter Spalte. Nie Sammelkerzen über mehrere Wellen.
- **Körper:** Zeilen mit mind. 2 Spalten Kerzenfarbe; OHLC: Eröffnung = Strich links, Schluss = Strich rechts. **Richtung:** grünere Farbe steigend; unbunt: kräftiger steigend.
- `ocCandles` zeichnet jede Kerze genau einmal; Zoom/Strecken ändern nur Breite und Abstand. Rückfall (keine Kerzen, Linienchart) und Nachgezeichnetes: Spaltengruppen mit fester Breite `ocG()` = `IMG.G0`.
- `imgSnap` setzt einen Treffer in einer erkannten Kerze auf deren Docht und Hoch/Tief.

## Prüfung von Unterteilungen (Stand 26.11.2026)

- **Selbst gezählt (`frCheck`):** Unterteilungen, die nur aus dem Start bestehen (Welle antippen + Zählweise, dann nichts), werden nicht geprüft; vorher meldeten sie „beginnt in die falsche Richtung“. Text der Richtungsprüfung: „Die erste Teilwelle läuft gegen die Welle. Sie muss in dieselbe Richtung laufen wie die Welle selbst.“ Befunde markieren die Welle rot (`.pgeb`, `m.ew`) und alle Punkte der Unterteilung. Bei einem Regelbruch werden alle erlaubten Teilmuster mit Grund genannt.
- **Automatisch (`ocSub`/`ocFit`):** immer alle Muster, die `PGSUB` an der Stelle erlaubt; nur Warnsignal („Automatisch erkannt, kein Regelverstoß“), nie harte Regel. Messtoleranz `OCTOL` = 1,5 px (`ocFails`): Ein Muster passt auch mit einem Wendepunkt bis 1,5 px höher bzw. tiefer. Anlass: (b) pixelgenau auf dem Start, Regular und Expanded Flat scheiterten beide.
- **Meldungen:** Teilwellen mit Ebene (`subRule`: „Teilwelle (b) in Welle B überschreitet den Start von Teilwelle (a)“), Liste „Geprüft: als Zigzag nicht (…); als Regular Flat nicht (…)“ (Feld `tried`; bei nur einem Muster mit Regelbruch ohne Liste).
- Korrekturwellen finden fast immer ein erlaubtes Muster (oft Double Zigzag), Warnsignale dort sind selten; das ist nach dem Regelwerk richtig.

## Wellengrößen und Farben (sechs Größen seit 26.11.2026 abends, DESIGN.md, CLAUDE.md „Schwer: sechs Wellengrößen“)

Sechs Größen (vollständige Elliott-Schreibweise): ① Ⓐ (Kreis `#1E5EFF`, weiß), (1) (A) `#4A7DFF`, 1 A `#6F96FF`, ⓘ ⓐ (Kreis `#93B0FF`, neu), (i) (a) `#B5C9FF`, i a `#D4E1FF` (Schrift ab Größe 2 `#0B1B3A`). Klassen `.wlv1–6`, `.wt1–6`, `.wpt1–6`, Legende `details.pglg` (`.wlg1–6`, am Handy eingeklappt). Die Größe folgt aus der Verschachtelung, nicht aus der Reihenfolge (`frRelevel`); von Hand „Größer“/„Kleiner“ über die schwebende Leiste am gewählten Label (`frSelBar`, mit Löschen). Prüfung (harte Regeln, `ocSub`) läuft auf allen Größen, Teilwellen werden mit der Schreibweise der nächsten Größe genannt (`subRule`, höchstens Größe 6). Fehler bleiben rot ohne Farbfeld.
- Discord-Video 26.11.2026 abends: Eine laufende Zählung der feinsten Größe ließ sich mit iv und v rechts außerhalb der hervorgehobenen Welle nicht
  fortsetzen („Mehr als fünf Wellengrößen werden nicht unterstützt“). Ursache: Rechts daneben lag eine Nachbar-Zählung mit eigener Unterteilung; iv/v
  machten sie zur Unterteilung der laufenden Zählung, ihre Unterteilung hätte eine Größe mehr gebraucht, `frRelevel` nahm alles zurück und `frAdd` den
  Punkt wieder weg. Seit dem Fix wird ein Punkt immer gesetzt; mehr als sechs Größen werden auf 6 begrenzt, mit Hinweis (`FRTOO`). Test: `tests/groessen-leiste.js`.

## Chart-Erkennung (`ocPath`) – bisheriger Weg (liefert Rahmen, Achsen, Legende, Kästchen und Linien; Rückfall ohne Kerzen)

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
| Kerzenfarbe nach RGB-Abstand gruppiert (Abstand 48) | blasse/unscharfe Kerzenpixel bildeten eigene Gruppen, Mischfarben wurden „Kerzenfarbe“ und passten zu Rahmen und Grau → Gruppierung nach Richtung vom Hintergrund |
| Farbgruppen in Bildreihenfolge, höchstens 16 | auf Fotos war die Liste schon mit Rauschen voll, bevor die roten Kerzen kamen → erst Fächer zählen, häufigste zuerst |
| Kerzenfarben nur mit gefüllten Körpern (3 × 3) | dünne Kerzen (Original 1921 px) haben keine Körper, Werkzeugleiste und VERKAUF-Kästchen schon |
| Vergleich nur mit dem nächstgelegenen Hintergrund | reingrüne Kerze neben roter Box passte nicht mehr → jeder Hintergrund, aber Pixel auf einem Hintergrund sind nie Kerze |
| Linienchart = eine lange Form | dicht gepackte Kerzen (verkleinertes Bild) sind auch eine Form → Strichlänge gegen Anstieg, Hauptfarben |
| Textzeilen der alten Erkennung ausschließen | ruhige Kerzenreihen galten als Schrift → eigene Kettenregel mit festem Abstand und Löchern |
| Alte Label-Regel ausschließen | verlor Kerzen in Zonen und das echte Hoch |
| Graue Kerzen allgemein ab s 0,42 | mehr Ausschläge auf farbigen Fotos → nur für unbunte Kerzenfarben |
| Zonenflächen (RMV 2) für die Kerzensuche freigeben | Reste von Preis-Kästchen am Rand → stattdessen Lücken aus Zonenpixeln in einer Säule überbrücken |
| Achsenprüfung „gleich hohe Formen“ auch für die Preisachse | Preisachse mit Kästchen wurde nicht mehr erkannt → nur für die Zeitachse |
| Kerzen je Zoom aus Spaltengruppen (`ocG` je Ansicht) | Anzahl änderte sich beim Strecken, verwirrend (Video Lenny) → Kerzen 1:1 aus `IMG.cdl` |
| Kerzenabstand aus den Formen bei dicht stehenden Kerzen | Formen hängen zusammen, Abstand 39 statt 1 Spalte, 56 Spalten breite Sammelkerzen über mehrere Wellen (PayPal, Screenshot Lenny) → Abstand aus der Regelmäßigkeit der Hoch/Tief-Sprünge, dichte Charts als schmale Kerzen fester Breite |
| Kerzenabstand aus allen Formen | Punkte und Splitter machten ihn zu klein, OHLC-Balken wurden zweigeteilt → nur Formen ab 3 px Höhe |
| Flat-Regeln ohne Toleranz („unter“ bzw. „über“ dem Start) | (b) pixelgenau auf dem Start: Regular und Expanded Flat scheitern beide, Warnsignal mit FR-2 (Discord) → 1,5 px Toleranz (`ocFails`) |
| Engere Farbtoleranz gegen Kreis-Labels | kostete auf Fotos Kerzen (91 → 69 %) |
| Strangwahl mit Auslassen 6 und Belohnung bis 6 | Kreis-Label mit Pixeln in jeder Spalte gewann gegen dünne Dochte (Allzeithoch fehlte) → im Kerzenmodus 2 bzw. 30 |
| Bild frei verschiebbar, nicht randfüllend | Bild ließ sich aus der Fläche schieben (Video Lenny) → fixiert |

## Testbilder und Tests

Feste Bilder liegen in `tests/faelle/`, die Erwartungen in `tests/faelle/faelle.json`:

| Bild | Inhalt |
|---|---|
| `legende-oben.png` | TradingView dunkel, Legende, Preisachse, Labels (App-Linie herausgerechnet) |
| `lumen-trendlinien.png` | Original: dünne weiße OHLC-Balken, lila Trendlinien, Kästchen |
| `paypal-preiskaestchen.png` | Original: Kästchen PYPL/52.84/44.31, gepunktete Preislinie, E/D-Symbole; dichter Chart (`dicht`, Wendepunkte (a), (b), iii, v) |
| `coreweave-zeichnungen-ganz.png` | Discord: ohne Zuschnitt, voller Zeichnungen, Zonen, Kästchen VERKAUF/KAUF |
| `coreweave-zeichnungen.png` | dessen vorgeschlagener Ausschnitt |
| `coreweave-original.png` | derselbe Screenshot in Originalgröße (1921 × 1276), Anlass der Kerzensuche |

Tests (alle Playwright, `NODE_PATH` und `PWCH=msedge` siehe Memory bzw. CLAUDE.md):

| Test | Prüft |
|---|---|
| `tests/verlauf.js` | feste Bilder: Verlauf am Kurs, keine Ausschläge, verbotene Bereiche, Vorschlag, Hinweis, Ränder (`rand`, auch im vorgeschlagenen Ausschnitt), Wendepunkte (`wendepunkte`, PayPal) |
| `tests/eigener-chart.js [Runden]` | Zufallsbilder (Generator `MK`: Kerzen/OHLC/Linie, hell/dunkel, Foto, Legende, Labels, Zeichnungen): Verlauf, Einrasten, Ziehen, Nachzeichnen, Prüfen, Export |
| `tests/struktur.js` | Unterteilungsprüfung: Fehlalarme, Erkennung dreiteiliger Welle 3 |
| `tests/subwellen.js` | Warnsignal-Texte, Überschrift, Hervorhebung |
| `tests/unterteilung-muster.js` | automatische Prüfung mit allen erlaubten Mustern: Screenshot-Fall (Expandierendes Dreieck, (b) genau auf dem Start), Zigzag/Flat/Dreieck ohne Warnsignal, Texte mit Ebene und Musterliste, Farben |
| `tests/unterteilung-richtung.js` | Zählung aus dem Discord-Screenshot (W-X-Y mit Unterteilungen, angefangene Unterteilungen nur mit Start): keine falsche Richtungsmeldung; Gegenprobe mit Text und Hervorhebung |
| `tests/verlauf-kerzen.js` | Kerzen 1:1: jede Kerze einmal, Anzahl bei Zoom/Strecken gleich, deckungsgleich mit bekannten Kerzen, höchstens 10 Spalten je Kerze (dicht 4), Wendepunkte als Hoch/Tief einer Kerze, Rückfall mit fester Breite |
| `tests/bild-steuerung.js` | Mausrad, Ziehen vs. Klick, Streifen, Grenzen, Deckungsgleichheit |
| `tests/bild-blasser.js` | Regler 0/50/100 %, Kontrast, Export |
| `tests/pruefen-nachzeichnen.js` | Tipp, Vorschlag, Grund unter „Prüfen“, Nachzeichnen, danach Prüfen |

Tests, die fertig zugeschnittene Bilder hochladen, müssen vor „Weiter“ auf `#ocall` („Ganzes Bild“) klicken, sonst greift der Zuschnitt-Vorschlag.

Für feste Vergleiche gab es ein Skript `bench2.js` (144 Generatorbilder: Verlauf je Kerze, Ausschläge, Einrasten mit harten Versätzen). Es lag nur im temporären Arbeitsordner. Stand: 96,3 % Verlauf, 37 Ausschlag-Spalten, 89,6 % Einrasten. Bei Bedarf als `tests/` neu anlegen.

## Bekannte offene Probleme

- **Zufallstest streut:** `tests/eigener-chart.js 6` reißt in jedem Lauf einige Grenzen (zuletzt 3–7 Fehler; der Stand vor der Kerzensuche hatte mit den Zonen-Charts 10). Am häufigsten: Einrasten knapp unter 95 % bzw. 88 % mit Zeichnungen auf einem Gerät, einzelne Ausschläge, „Ziehen ins Leere“. `tests/struktur.js` liegt bei Fehlalarmen zwischen 0 und 6 % (Grenze 5 %), je nach Stichprobe.
- **Tipp auf vorhandene Labels:** schwankt zwischen rund 56 und 100 % je Lauf und Gerät; auch Liniencharts über den alten Weg betroffen.
- **Fotos mit weißen OHLC-Balken, Zonen und Zeichnungen:** die schwerste Gruppe (neu 86–100 % der Kerzen, alt 74–84 %), weiter Ausschläge; ebenso Foto-Liniencharts mit Zonen.
- **Reste hinter der letzten Kerze** (Kreis-Labels, Klammern von Fib-Beschriftungen) bleiben im Verlauf, liegen aber in orange markierten Bereichen.
- **Dochtspitzen direkt an Box-Kanten** werden teils abgeschnitten (Zonen-Chart in `verlauf-kerzen.js`: 92 % statt 95 % deckungsgleich).
- **Kreis-Labels in fast Kerzenfarbe** auf stark verkleinerten Bildern; Hohlkerzen (TradingView „Hollow candles“) nicht getestet.
- **Unterteilungsprüfung:** eine dreiteilige Welle 3 wird nur in rund 20–35 % erkannt (bewusst vorsichtig).
- **Achsenerkennung:** setzt ausgerichtete Schrift voraus; andere Plattformen als TradingView kaum getestet.
- **Leichte Verzerrung** bei sehr hohen bzw. flachen Bildern (Chartfläche in der Höhe begrenzt).
- **Laufzeit:** `ocPath` mit Kerzensuche rund 0,3–1 s für 2000-px-Bilder; auf alten Handys spürbar.
- **Material:** Originalscreenshot zu `legende-oben.png` fehlt; neue echte Problembilder in `tests/faelle` aufnehmen.
