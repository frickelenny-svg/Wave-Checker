# Wave-Checker: Gestaltung

Neu angelegt am 13.11.2026. Der Code verweist an einigen Stellen auf „DESIGN.md Abschnitt 11“; das ist der Abschnitt
„Chart in ‚Wie geht es weiter?‘“ unten.

## Grundlagen
- Farben nur über CSS-Variablen (`--accent`, `--up`, `--dn`, `--mut`, `--line`, `--surface`, `--ink` …), helles und dunkles Design.
- Knöpfe mindestens 40 px hoch (Touch), aktiver Zustand: Hintergrund `--accent`, Schrift weiß, `aria-pressed="true"`.
- Icons: Strich-Icons (SVG, `stroke="currentColor"`, Strichstärke 2, runde Enden), keine Füllflächen, keine Emojis in Bedienelementen.

## Benachrichtigungs-Abzeichen (seit 23.11.2026)
- Kleiner roter Kreis mit weißer Zahl (`.nbdg`), klebt oben rechts an der Insel bzw. Station (9 px bzw. 6 px über den Rand),
  mindestens 24 × 24 px, Schrift 12 px fett, Ring 2 px in `--surface` gegen den Hintergrund. Ab 10: „9+“.
- Rot gibt es nur hier: `--notify` = #D93036 (gewünscht war #E5484D, das mit Weiß nur 3,9:1 erreicht; #D93036 hat 4,74:1).
- Beim Erscheinen bzw. wenn die Zahl steigt einmal kurz aufploppen (0,5 s, leicht überschießend), sobald es im Bild ist; danach ruhig.
- Derzeit nur für neue Rangaufstiege an „Meine Ränge“.

## Aufstiegs-Ansicht (seit 23.11.2026)
- Eine Karte je neuem Rang, mittig, höchstens 520 px breit: oben klein „Rangaufstieg 1 von 3“ (Großbuchstaben, `--accent-text`),
  Kategorie als Überschrift, großes Medaillen-Icon im Kreis (84 px), das von der alten zur neuen Rangfarbe wechselt und kurz größer
  wird, darunter alter Rang → neuer Rang als Rang-Abzeichen, Balken füllt sich, Satz fett („Gold im Impuls! Nächstes Ziel: Platin“).
- Mehrere Karten: Punkte als Fortschritt, Wischen nach links/rechts oder „Weiter“/„Zurück“; letzte Karte „Alle Ränge ansehen“.
- Danach auf „Meine Ränge“ die neuen Karten kurz hervorgehoben (Rand `--accent`, Ring `--accent-soft`, verblasst in 2,6 s).
- Bewegung reduzieren: keine Animationen, Endzustand sofort; Hervorhebung bleibt als ruhiger Ring.

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
  das Bild); rechts in der Zoom-Gruppe zuerst der Knopf „Ansicht zurücksetzen“ (Pfeil im Kreis, 18 px). Unter dem Bild ein 26 px hoher
  Streifen mit Trennlinie `--line` und dem Hinweis „↔ Zeitachse ziehen“ (11 px, `--muted`, Mauszeiger ew-resize). Das Bild füllt in der
  Startansicht die ganze Chartfläche (seit 25.11.2026, kein Rand, kein leerer Raum) und lässt sich wie ein Chart strecken bzw. zoomen, aber nie
  kleiner als die Fläche und nie über seine Kanten hinaus verschieben; darüber eine weiße Fläche (Regler „Bild blasser“ unter dem Chart, 0–100 % mit Prozentanzeige, Start 25 %),
  das Bild wird stufenlos blasser zu Weiß hin. Bei 100 % ist das Bild ausgeblendet: Chartfläche #FFFFFF auch im dunklen Design, darin die Farben
  des hellen Designs (`.ocw`), der erkannte bzw. nachgezeichnete Verlauf wird eingeblendet; das Export-Bild übernimmt die Einstellung. Text-Labels mit Hintergrund (`.pglbg`: `--surface` 92 %, Rand `--line`, Ecken 6 px),
  große Labels wie immer im Kreis.
- Hochladen: unter dem Knopf der Tipp zum Ausblenden der Zeichnungen (`.octip`, `--muted`). Zuschneiden: Vorschlag als vorgewählter blauer Rahmen,
  Text „Der Rahmen ist ein Vorschlag …“. Zählen: Hinweis „Viele Zeichnungen im Bild, die Erkennung ist unsicher“ als Kasten `.ocq` (`--warn-bg`,
  `--warn-text`, Warn-Icon 18 px, Ecken 12 px) über dem Hinweistext. Unter gesperrtem „Prüfen“ immer der konkrete Grund (`.pghint`, `#pgwhy`).
- Erkannter bzw. nachgezeichneter Kursverlauf (seit 24.11.2026 als Kerzen, vorher Zickzack-Linie aus Hoch und Tief): Kerzen in `--accent`,
  Docht 1,2 px, steigend gefüllt (`.occu`), fallend als Umriss ohne Füllung (`.occd`, 1,2 px). Breite der Kerze 70 % ihres Abstands; in der
  Start-Ansicht etwa so breit wie im Original, mindestens 2 Bildschirmpixel, beim Hineinzoomen feiner, beim Herauszoomen gröber. Nur beim Zählen
  (bei „Bild blasser“ 100 % immer, auch im Ergebnis und im Export).
  Darunter eine Zeile: Kästchen „Erkannten Verlauf zeigen“, Knopf „Verlauf nachzeichnen“ (aktiv blau hinterlegt, Text dann „Nachzeichnen
  beenden“), nach dem Nachzeichnen „Erkannten Verlauf wiederherstellen“. Der laufende Strich ist grün (`--ok`, 2,4 px, runde Enden).
- Warnsignal zur Unterteilung: gefundene Wendepunkte als gestrichelte Linie in `--warn-text` (1,8 px, Strich 5/4) mit kleinen Kreisen
  (Füllung `--surface`), nur im Ergebnis.
  Die betroffene Welle ist im Chart orange hinterlegt (`--warn-text`, 10 % Deckkraft, `.pgwb`). Der Hinweis ist antippbar (Rand beim Darüberfahren
  `--warn-text`); Antippen scrollt zum Chart, holt die Welle ins Bild und lässt die Fläche viermal kurz aufleuchten (bis 40 %; bei reduzierter
  Bewegung einmal 32 % ohne Blinken).
- Ergebnis-Überschrift: Regelverstoß rot (`.bad`, ✗), Warnsignal zur Unterteilung orange (`.ocwarn`: `--warn-text`, fett, Warn-Icon Dreieck mit
  Ausrufezeichen als Strich-Icon 22 px) „Prüfe die Subwellen“ mit einem Satz darunter, sonst grün (`.ok`, ✓). Im Export-Bild ebenso (orange mit „!“).
- Reihenfolge der Hinweise: Regel → Warnsignal Unterteilung → andere Warnsignale → Faustregeln.
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
