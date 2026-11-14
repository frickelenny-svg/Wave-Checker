// Test für „Fehler finden“ Schwer (seit 14.11.2026, Lenny): Freitext-Prüfung per Schlüsselwörtern.
// Aufruf im Repo-Ordner: node tests/fehler-text.js   (ohne Browser; führt den Block FFT-START … FFT-END aus index.html aus)
// Für jede Regel, die der Generator verletzen kann: mindestens 5 richtige Formulierungen (verschiedene Wörter, Tippfehler, Zahlwörter)
// und 3 falsche. Zusätzlich: Jede Regel aus findSub steht in fehler-schluesselwoerter.json und hat einen Text „einfach“.
const fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const code = html.slice(html.indexOf('// FFT-START'), html.indexOf('// FFT-END'));
const FFT = new Function(code + '\nreturn FFT;')();
const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'fehler-schluesselwoerter.json'), 'utf8'));

// opts: welle = gewählte Welle, dir = Richtung der Bezugswelle im Chart ('auf'/'ab')
const C = [
  { id: 'IMP-1', o: { welle: '2', dir: 'auf' },
    ok: ['Welle 2 fällt unter den Start von Welle 1.', 'Die zweite Welle unterschreitet den Anfang der ersten Welle', 'welle zwei geht tiefer als der startpunkt von welle eins',
      'Welle 2 korrigiert mehr als 100 % von Welle 1', 'Welle 2 darf nicht unter den Beginn von Welle 1 fallen', 'W2 unterschreitet den Strat von W1', 'Welle 2 ist länger als Welle 1, das geht nicht'],
    no: ['Welle 2 ist kürzer als Welle 1', 'Welle 2 bleibt über dem Start von Welle 1', 'Welle 2 unterschreitet den Start von Welle 1 nicht', 'Welle 4 überlappt Welle 1'] },
  { id: 'IMP-2', o: { welle: '3' },
    ok: ['Welle 3 ist die kürzeste', 'Die dritte Welle ist kürzer als Welle 1 und Welle 5.', 'welle drei ist am kürzesten von 1, 3 und 5', 'Welle 3 darf nicht die kürzeste sein',
      'Welle 3 ist die kürzste Impulswelle', 'Welle 3 ist zu kurz, sie ist kleiner als 1 und 5'],
    no: ['Welle 3 ist nicht die kürzeste', 'Welle 3 ist die längste', 'Welle 3 ist länger als Welle 1 und 5', 'Welle 4 ist die kürzeste'] },
  { id: 'IMP-3', o: { welle: '4', dir: 'auf' },
    ok: ['Welle 4 überlappt Welle 1', 'Die vierte Welle ragt in das Preisterritorium der ersten Welle', 'Welle 4 fällt unter das Hoch von Welle 1.', 'Welle vier schneidet den Bereich von Welle eins',
      'Welle 4 darf Welle 1 nicht überlappen', 'welle 4 überlapt welle 1', 'Welle 4 berührt das Hoch der Welle 1'],
    no: ['Welle 4 überlappt Welle 1 nicht', 'Welle 4 bleibt über dem Hoch von Welle 1', 'Welle 4 ist zu lang', 'Welle 2 überlappt Welle 1'] },
  { id: 'IMP-3', o: { welle: '4', dir: 'ab' }, // gespiegelt: Abwärtsimpuls
    ok: ['Welle 4 steigt über das Tief von Welle 1', 'Welle 4 geht über das Tief der ersten Welle', 'Welle 4 überlappt mit Welle 1', 'Die 4 reicht in das Gebiet von Welle 1 hinein', 'Welle 4 ist höher als das Tief von Welle 1, das ist eine Überlappung'],
    no: ['Welle 4 bleibt unter dem Tief von Welle 1', 'Welle 4 überschneidet Welle 1 nicht', 'Welle 4 ist zu kurz'] },
  { id: 'ZZ-2', o: { welle: 'B' },
    ok: ['Welle B überschreitet den Start von Welle A', 'B geht über den Anfang von A hinaus', 'Welle B steigt über das Hoch von Welle A', 'Welle B retraced mehr als 100 % von Welle A',
      'Welle B darf den Startpunkt von A nicht überschreiten', 'Welle B überschreitett den Strat von A'],
    no: ['Welle B bleibt unter dem Start von Welle A', 'Welle B überschreitet den Start von Welle A nicht', 'Welle C ist zu kurz', 'Welle B ist kürzer als Welle A'] },
  { id: 'ZZ-3', o: { welle: 'C', dir: 'ab' },
    ok: ['Welle C endet nicht unter dem Tief von Welle A', 'C fällt nicht unter das Ende von A', 'Welle C endet über dem Tief von Welle A', 'Welle C muss tiefer als A enden',
      'Welle C erreicht das Tief von Welle A nicht', 'Welle C ist zu kurz, sie bleibt über dem Tief von A'],
    no: ['Welle C endet unter dem Tief von Welle A', 'Welle B ist zu lang', 'Welle C überlappt Welle A', 'Welle C fällt unter das Tief von A'] },
  { id: 'ZZ-3', o: { welle: 'C', dir: 'auf' }, // gespiegelt: steigendes Zigzag
    ok: ['Welle C endet unter dem Hoch von Welle A', 'Welle C steigt nicht über das Hoch von A', 'Welle C endet nicht über A', 'C erreicht das Hoch von A nicht', 'Welle C muss höher als A enden'],
    no: ['Welle C endet über dem Hoch von Welle A', 'Welle C steigt über das Hoch von A', 'Welle B geht über den Start von A'] },
  { id: 'FR-2', o: { welle: 'B' },
    ok: ['Welle B überschreitet den Start von Welle A', 'B läuft über den Anfang von A hinaus', 'Welle B übersteigt den Beginn von Welle A', 'Welle B darf nicht über den Start von A hinaus, sie nähert sich nur an',
      'B geht über den Startpunkt der Welle A', 'Welle B schießt über den Start von A, das wäre ein Expanded Flat'],
    no: ['Welle B nähert sich dem Start von A nur an', 'Welle B bleibt unter dem Start von A', 'Welle C endet nicht unter A', 'Welle B überschreitet den Start von A nicht'] },
  { id: 'FR-3', o: { welle: 'C', dir: 'ab' },
    ok: ['Welle C endet nicht unter dem Tief von Welle A', 'C bleibt über dem Tief von A', 'Welle C fällt nicht unter A', 'Welle C sollte leicht unter dem Tief von A enden', 'Welle C endet vor dem Tief von Welle A'],
    no: ['Welle C endet unter dem Tief von A', 'Welle B geht über den Start von A', 'Welle C ist fünfteilig'] },
  { id: 'FE-2', o: { welle: 'B' },
    ok: ['Welle B überschreitet den Start von Welle A nicht', 'B bleibt unter dem Anfang von A', 'Welle B müsste über den Start von Welle A hinausgehen', 'Welle B erreicht den Startpunkt von A nicht',
      'Welle B ist zu kurz, sie kommt nicht über den Start von A', 'Welle B übersteigt den Begin von A nicht'],
    no: ['Welle B überschreitet den Start von Welle A', 'Welle B geht über den Anfang von A hinaus', 'Welle C endet nicht unter dem Tief von A', 'Welle B ist dreiteilig'] },
  { id: 'FE-3', o: { welle: 'C', dir: 'ab' },
    ok: ['Welle C endet nicht unter dem Tief von Welle A', 'Welle C bildet kein neues Tief unter A', 'C endet oberhalb des Tiefs von A', 'Welle C müsste unter das Tief von A fallen', 'Welle C erreicht das Tief der Welle A nicht'],
    no: ['Welle C endet unter dem Tief von A', 'Welle C bildet ein neues Tief unter A', 'Welle B überschreitet den Start von A nicht'] },
  { id: 'FRU-2', o: { welle: 'B' },
    ok: ['Welle B überschießt den Start von Welle A nicht', 'Welle B bleibt unter dem Start von A', 'B kommt nicht über den Anfang von A hinaus', 'Welle B müsste über den Start von A schießen', 'Welle B ist zu kurz und erreicht den Start von A nicht'],
    no: ['Welle B überschießt den Start von Welle A', 'Welle C bildet ein neues Tief', 'Welle B geht über den Start von A'] },
  { id: 'FRU-3', o: { welle: 'C', dir: 'ab' },
    ok: ['Welle C bildet ein neues Tief unter Welle A', 'C fällt unter das Tief von A', 'Welle C endet unterhalb des Tiefs von A', 'Welle C darf kein neues Tief unter A bilden', 'Welle C geht tiefer als das Ende von A', 'Welle C unterschreitet das Tief von Welle A'],
    no: ['Welle C bildet kein neues Tief unter A', 'Welle C endet über dem Tief von A', 'Welle B überschießt den Start von A nicht'] },
  { id: 'FRU-3', o: { welle: 'C', dir: 'auf' }, // gespiegelt
    ok: ['Welle C bildet ein neues Hoch über Welle A', 'C steigt über das Hoch von A', 'Welle C endet oberhalb des Hochs von A', 'Welle C darf kein neues Hoch über A bilden', 'Welle C überschreitet das Hoch von A'],
    no: ['Welle C bildet kein neues Hoch über A', 'Welle C endet unter dem Hoch von A', 'Welle B ist zu kurz'] },
  { id: 'DRE-7', o: { welle: 'D' },
    ok: ['Welle D ist länger als Welle C', 'D ist nicht kürzer als C', 'Welle D ist größer als die vorherige Welle', 'Jede Welle muss kürzer sein als die vorherige, D ist es nicht',
      'Welle D ist zu lang', 'Welle D ist genauso lang wie Welle C', 'Die Wellen werden nicht nacheinander kleiner'],
    no: ['Welle D ist kürzer als Welle C', 'Welle B ist zu lang', 'Welle D ist dreiteilig', 'Welle D überlappt Welle A'] },
  { id: 'DRE-8', o: { welle: 'C' },
    ok: ['Welle C ist kürzer als Welle B', 'C ist nicht länger als B', 'Welle C ist kleiner als die vorherige', 'Jede Welle muss länger sein als die vorangegangene', 'Welle C ist zu kurz', 'Welle C ist gleich lang wie B'],
    no: ['Welle C ist länger als Welle B', 'Welle E ist zu kurz', 'Welle C ist fünfteilig'] },
  { id: 'DIAG-2', o: { welle: '4', dir: 'auf' },
    ok: ['Welle 4 überlappt Welle 1 nicht', 'Die vierte Welle ragt nicht in den Bereich der ersten Welle', 'Welle 4 bleibt über dem Hoch von Welle 1', 'Bei einer Diagonale müssen sich Welle 1 und 4 überlappen',
      'Welle 4 erreicht das Territorium von Welle 1 nicht, sie müsste es überschneiden', 'Welle 4 überlapt Welle 1 nicht'],
    no: ['Welle 4 überlappt Welle 1', 'Welle 4 fällt unter das Hoch von Welle 1', 'Welle 4 ist zu kurz', 'Welle 2 überlappt Welle 1 nicht'] },
  { id: 'DL-4', o: { welle: '3' },
    ok: ['Welle 1 ist nicht die längste', 'Welle 3 ist länger als Welle 1', 'Die erste Welle müsste die längste sein', 'Welle 1 ist kürzer als Welle 3', 'Welle eins ist nicht am längsten', 'Welle 5 ist länger als Welle 1'],
    no: ['Welle 1 ist die längste', 'Welle 3 ist kürzer als Welle 1', 'Welle 3 ist länger als Welle 5', 'Welle 4 überlappt Welle 1'] },
  { id: 'DL-8', o: { welle: '5' },
    ok: ['Welle 5 ist nicht kürzer als Welle 3', 'Welle 5 ist länger als Welle 3', 'Die fünfte Welle ist genauso lang wie die dritte', 'Welle 5 müsste kürzer als Welle 3 sein', 'Welle 3 ist kürzer als Welle 5', 'Welle 5 ist größer als Welle drei'],
    no: ['Welle 5 ist kürzer als Welle 3', 'Welle 3 ist länger als Welle 5', 'Welle 5 überlappt Welle 1', 'Welle 1 ist die längste'] },
  { id: 'DB-10', o: { welle: '5' },
    ok: ['Welle 5 ist länger als Welle 3', 'Welle 5 ist nicht kürzer als Welle 3', 'Welle 5 darf nicht länger als Welle 3 sein', 'Die 5 ist größer als die 3', 'Welle 5 ist gleich lang wie Welle 3'],
    no: ['Welle 5 ist kürzer als Welle 3', 'Welle 3 ist kürzer als Welle 1', 'Welle 4 überlappt Welle 1 nicht'] },
  { id: 'DB-4', o: { welle: '3' },
    ok: ['Welle 3 ist nicht kürzer als Welle 1', 'Welle 3 ist länger als Welle 1', 'Die dritte Welle müsste kürzer als die erste sein', 'Welle 1 ist kürzer als Welle 3', 'Welle 3 ist genauso lang wie Welle 1', 'Welle 3 ist grösser als Welle 1'],
    no: ['Welle 3 ist kürzer als Welle 1', 'Welle 1 ist länger als Welle 3', 'Welle 5 ist länger als Welle 3', 'Welle 3 ist die kürzeste'] },
  { id: 'DE-3', o: { welle: '5' },
    ok: ['Welle 5 ist kürzer als Welle 3', 'Welle 5 ist nicht länger als Welle 3', 'Die Wellen 1, 3 und 5 werden nicht immer länger', 'Welle 5 müsste länger als Welle 3 sein', 'Welle 5 ist zu kurz', 'Die Wellen werden nicht nacheinander größer'],
    no: ['Welle 5 ist länger als Welle 3', 'Die Wellen werden immer länger', 'Welle 4 überlappt Welle 1', 'Welle 3 ist zu kurz'] },
  { id: 'DE-9', o: { welle: '4' },
    ok: ['Welle 4 retraced mehr als 99,9 % von Welle 3', 'Welle 4 läuft komplett über Welle 3 zurück', 'Welle 4 ist länger als Welle 3', 'Welle 4 darf höchstens 99,9 % der Welle 3 korrigieren', 'Welle 4 fällt unter den Start von Welle 3', 'Die vierte Welle korrigiert die dritte vollständig'],
    no: ['Welle 4 retraced weniger als 99,9 % von Welle 3', 'Welle 4 ist kürzer als Welle 3', 'Welle 4 überlappt Welle 1', 'Welle 4 retraced höchstens 99,9 % von Welle 3'] },
  { id: 'WX-2', o: { welle: 'X' },
    ok: ['Welle X retraced mehr als 100 % von Welle W', 'X läuft über den Start von W hinaus', 'Welle X korrigiert W komplett', 'Welle X ist länger als Welle W', 'Welle X darf nicht 100 % von W zurücklaufen', 'Welle X geht über den Anfang von Welle W'],
    no: ['Welle X retraced weniger als 100 % von W', 'Welle X ist kürzer als Welle W', 'In Welle W steht ein Dreieck', 'Welle Y ist zu lang'] },
  { id: 'WX-2b', o: { welle: 'X2' },
    ok: ['Die zweite Welle X retraced mehr als 100 % von Welle Y', 'X2 läuft über den Start von Y hinaus', 'Welle X korrigiert Y vollständig', 'Welle X ist länger als Welle Y', 'Welle X darf Y nicht zu 100 % zurücklaufen'],
    no: ['Welle X retraced weniger als 100 % von Welle Y', 'Welle X ist kürzer als Y', 'Welle Z ist zu kurz'] },
  { id: 'DRE-1', o: { welle: 'W' },
    ok: ['In Welle W steht ein Dreieck', 'W ist ein Dreieck, das ist nicht erlaubt', 'Welle W darf kein Dreieck sein', 'Ein Dreick in Welle W geht nicht', 'Welle W ist ein kontrahierendes Dreieck', 'Das Muster in W ist ein Triangle'],
    no: ['Welle W ist kein Dreieck', 'Welle X ist zu lang', 'Welle W ist zu kurz', 'Welle W ist ein Zigzag'] },
  { id: 'DRE-1', o: { welle: '2' },
    ok: ['In Welle 2 steht ein Dreieck', 'Welle 2 darf kein Dreieck sein', 'Dreiecke gibt es nie in Welle 2', 'Welle zwei ist ein Dreieck', 'Die zweite Welle bildet ein Dreieck'],
    no: ['Welle 2 ist kein Dreieck', 'Welle 2 ist zu tief', 'Welle 2 und 4 sind gleich'] },
  { id: 'W4-3', o: { welle: '4' },
    ok: ['Welle 2 und Welle 4 sind beide ein Zigzag', 'Welle 4 hat dasselbe Muster wie Welle 2', 'Es fehlt die Alternation zwischen Welle 2 und 4', 'Welle 4 muss anders sein als Welle 2',
      'Welle 2 und 4 sind gleich', 'Keine Alternation: Welle 4 ist identisch mit Welle 2', 'Welle 4 ist wie Welle 2 ein Flat'],
    no: ['Welle 2 und Welle 4 sind unterschiedlich', 'Welle 4 überlappt Welle 1', 'Welle 4 ist ein Dreieck', 'Welle 2 und 4 alternieren'] },
  { id: 's:IMP-1', o: { welle: '3', dir: 'ab' },
    ok: ['Subwelle 2 geht über den Start von Subwelle 1', 'In Welle 3 unterschreitet die (2) den Anfang der (1)', 'Die zweite Unterwelle läuft über den Beginn der ersten hinaus', 'Welle (2) darf nicht über den Start von (1)', 'Die (2) retraced mehr als 100 % der (1)'],
    no: ['Die (2) bleibt unter dem Start von (1)', 'Die (4) überlappt die (1)', 'Welle 3 ist dreiteilig'] },
  { id: 's:IMP-2', o: { welle: '1' },
    ok: ['Die Subwelle 3 ist die kürzeste', 'In Welle 1 ist die (3) kürzer als (1) und (5)', 'Die dritte Subwelle ist am kürzesten', 'Die (3) darf nicht die kürzeste sein', 'Unterwelle drei ist zu kurz'],
    no: ['Die (3) ist die längste', 'Die (3) ist nicht die kürzeste', 'Welle 1 ist dreiteilig'] },
  { id: 's:IMP-3', o: { welle: '3', dir: 'auf' },
    ok: ['In Welle 3 überlappt die (4) die (1)', 'Subwelle 4 ragt in den Bereich von Subwelle 1', 'Die vierte Unterwelle fällt unter das Hoch der ersten', 'Die (4) darf die (1) nicht überschneiden', 'Subwelle vier überlappt Subwelle eins'],
    no: ['Die (4) überlappt die (1) nicht', 'Die (2) ist zu lang', 'Welle 3 ist die kürzeste'] },
  { id: 's:IMP-3', o: { welle: 'A', dir: 'ab' }, // Zigzag-A abwärts
    ok: ['In Welle A überlappt (4) mit (1)', 'Die (4) steigt über das Tief der (1)', 'Subwelle 4 reicht in das Gebiet von Subwelle 1', 'Die vierte Subwelle überschneidet die erste', 'Die (4) berührt das Tief von (1)'],
    no: ['Die (4) bleibt unter dem Tief von (1)', 'Welle A ist dreiteilig', 'Die (4) überlappt die (1) nicht'] },
  { id: 's:IMP-4', o: { welle: '3' },
    ok: ['Welle 3 ist nur dreiteilig', 'Welle 3 hat nur drei Subwellen, sie muss fünfteilig sein', 'Welle 3 ist kein Impuls, sondern eine Korrektur', 'Die dritte Welle besteht aus 3 statt 5 Wellen', 'Welle 3 ist ein ABC',
      'Welle 3 ist 3-teilig', 'Welle 3 ist nicht fünfteilig', 'Welle 3 ist driteilig'],
    no: ['Welle 3 ist fünfteilig', 'Welle 3 ist ein Impuls', 'Welle 3 ist die kürzeste', 'Welle 3 ist nicht dreiteilig'] },
  { id: 's:ZZ-1', o: { welle: 'A' },
    ok: ['Welle A ist dreiteilig', 'A hat nur 3 Subwellen', 'Welle A muss fünfteilig sein', 'Welle A ist kein Impuls', 'Welle A ist korrektiv statt impulsiv'],
    no: ['Welle A ist fünfteilig', 'Welle B ist zu lang', 'Welle A ist nicht dreiteilig'] },
  { id: 's:WC-2', o: { welle: 'C' },
    ok: ['Welle C ist dreiteilig', 'Welle C ist nicht fünfteilig', 'C besteht nur aus drei Wellen', 'Welle C müsste ein Impuls sein', 'Welle C ist ein Zigzag statt ein Fünfteiler'],
    no: ['Welle C ist fünfteilig', 'Welle C endet nicht unter A', 'Welle C ist ein Impuls'] },
  { id: 's:ZZ-2', o: { welle: 'B' },
    ok: ['Welle B ist fünfteilig', 'Welle B hat fünf Subwellen', 'B ist ein Impuls, sie müsste dreiteilig sein', 'Welle B ist nicht dreiteilig', 'Welle B besteht aus 5 statt 3 Wellen', 'Welle B ist fünfteillig'],
    no: ['Welle B ist dreiteilig', 'Welle B ist ein Zigzag', 'Welle B geht über den Start von A', 'Welle B ist kein Impuls'] },
  { id: 's:FL-A', o: { welle: 'A' },
    ok: ['Welle A ist fünfteilig', 'Welle A ist ein Impuls', 'A muss dreiteilig sein', 'Welle A hat 5 Unterwellen', 'Welle A ist nicht dreiteilig, sondern fünfteilig'],
    no: ['Welle A ist dreiteilig', 'Welle A ist kein Impuls', 'Welle C endet nicht unter A'] },
  { id: 's:WB-2', o: { welle: 'B' },
    ok: ['Welle B ist fünfteilig', 'Welle B ist impulsiv', 'B sollte dreiteilig sein', 'Welle B hat fünf Teile', 'Welle B ist keine Korrektur'],
    no: ['Welle B ist dreiteilig', 'Welle B ist eine Korrektur', 'Welle B überschreitet den Start von A'] },
  { id: 's:DRE-4', o: { welle: 'D' },
    ok: ['Welle D ist fünfteilig', 'D ist ein Impuls, im Dreieck ist jede Welle dreiteilig', 'Welle D hat 5 Subwellen', 'Welle D ist nicht dreiteilig', 'Welle D müsste ein ABC sein'],
    no: ['Welle D ist dreiteilig', 'Welle D ist länger als C', 'Welle D ist kein Impuls'] },
  { id: 's:DB-2', o: { welle: '3' },
    ok: ['Welle 3 ist fünfteilig', 'Welle 3 ist ein Impuls', 'Welle 3 müsste dreiteilig sein', 'Welle 3 hat fünf Subwellen', 'Welle 3 ist nicht dreiteilig'],
    no: ['Welle 3 ist dreiteilig', 'Welle 3 ist kürzer als Welle 1', 'Welle 3 ist kein Impuls'] },
  { id: 's:DE-2', o: { welle: '2' },
    ok: ['Welle 2 ist fünfteilig', 'Welle 2 ist ein Impuls', 'Welle 2 müsste dreiteilig sein', 'Die zweite Welle hat fünf Unterwellen', 'Welle 2 ist kein ABC'],
    no: ['Welle 2 ist dreiteilig', 'Welle 2 ist zu kurz', 'Welle 2 ist kein Impuls'] },
  { id: 's:DL-2', o: { welle: '3' },
    ok: ['Welle 3 ist dreiteilig', 'Welle 3 ist nicht fünfteilig', 'Die Struktur passt weder zu 5-3-5-3-5 noch zu 3-3-3-3-3', 'Welle 3 ist eine Korrektur statt ein Impuls', 'Das passt nicht zum 5-3-5-3-5-Muster'],
    no: ['Welle 3 ist fünfteilig', 'Welle 3 ist zu lang', 'Das passt zum 5-3-5-3-5-Muster'] },
  { id: 's:DL-2', o: { welle: '2' },
    ok: ['Welle 2 ist fünfteilig', 'Welle 2 ist ein Impuls', 'Welle 2 müsste dreiteilig sein', 'Die Teilstruktur weicht von 5-3-5-3-5 ab', 'Welle 2 hat fünf Subwellen'],
    no: ['Welle 2 ist dreiteilig', 'Welle 2 ist zu tief', 'Welle 2 ist kein Impuls'] }
];

let bad = 0, n = 0; const ids = new Set();
for (const c of C) {
  ids.add(c.id);
  if (c.ok.length < 5 || c.no.length < 3) { bad++; console.log('ZU WENIG BEISPIELE ' + c.id); }
  for (const t of c.ok) { n++; const r = FFT.check(J, c.id, t, c.o); if (!r.ok) { bad++; console.log('NICHT ERKANNT  ' + c.id + ' ' + JSON.stringify(c.o) + ': „' + t + '“ (' + r.why + ')'); } }
  for (const t of c.no) { n++; const r = FFT.check(J, c.id, t, c.o); if (r.ok) { bad++; console.log('FÄLSCHLICH OK  ' + c.id + ' ' + JSON.stringify(c.o) + ': „' + t + '“'); } }
}
// Allgemeine Antworten ohne Inhalt dürfen bei keiner Regel durchgehen
const VAGE = ['falsch', 'keine Ahnung', 'Die Zählung stimmt nicht', 'Welle 3 ist falsch', 'Hier ist ein Fehler in der Welle', 'asdf', 'Die Welle passt nicht', 'Das ist regelwidrig'];
for (const c of C) for (const t of VAGE) { n++; if (FFT.check(J, c.id, t, c.o).ok) { bad++; console.log('VAGE ANTWORT OK  ' + c.id + ': „' + t + '“'); } }
// Jede Regel, die findSub verwenden kann, muss in der Datei stehen (mit „einfach“) und hier getestet sein
const sr = new Set(['W4-3', 'DRE-1', 's:IMP-1', 's:IMP-2', 's:IMP-3', 's:IMP-4', 's:ZZ-1', 's:ZZ-2', 's:FL-A', 's:WB-2', 's:DRE-4', 's:DL-2', 's:DB-2', 's:DE-2', 's:WC-2']);
for (const m of html.matchAll(/viol:\s*\[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([^']+)'/g)) sr.add(x[1]);
for (const id of sr) {
  if (!J.regeln[id]) { bad++; console.log('FEHLT IN DER DATEI: ' + id); continue; }
  if (!FFT.einfach(J, id)) { bad++; console.log('KEIN TEXT „einfach“: ' + id); }
  if (!ids.has(id)) { bad++; console.log('NICHT GETESTET: ' + id); }
}
console.log((bad ? bad + ' Fehler' : 'Alles in Ordnung') + ' (' + n + ' Formulierungen, ' + ids.size + ' Regeln)');
process.exit(bad ? 1 : 0);
