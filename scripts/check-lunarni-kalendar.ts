/**
 * Provere mesecnog lunarnog kalendara (`src/lib/lunarni-kalendar.ts`).
 * Pokreni: npm run check:lunarni-kalendar
 */
import { glavneFazeMeseca, mrezaMeseca, nedeljaDana, pomeriDan, ugaoDana } from '../src/lib/lunarni-kalendar';
import { dayKey } from '../src/lib/transits';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(62)} ${detail}`);
};

// Septembar 2026 pocinje u utorak: jedna prazna celija, 30 dana, 5 nedelja.
const sep = mrezaMeseca(2026, 8);
ok(sep[0][0] === null && sep[0][1]?.getDate() === 1, 'sep 2026: 1. je utorak (druga kolona)');
ok(sep.flat().filter(Boolean).length === 30, 'sep 2026: 30 dana');
ok(sep.every((n) => n.length === 7), 'svaka nedelja ima 7 celija');
// Februar 2027 pocinje u ponedeljak i ima tacno 4 nedelje.
const feb = mrezaMeseca(2027, 1);
ok(feb.length === 4 && feb[0][0]?.getDate() === 1, 'feb 2027: od ponedeljka, 4 nedelje');
// Mart 2026 pocinje u nedelju: 6 praznih celija.
const mar = mrezaMeseca(2026, 2);
ok(mar[0].slice(0, 6).every((c) => c === null) && mar[0][6]?.getDate() === 1, 'mar 2026: 1. je nedelja (poslednja kolona)');

// Glavne faze oktobra 2026 (TZ=Europe/Belgrade): mlad 10. okt, pun 26. okt — isto sto
// ekran Mesec vec pokazuje za 29. sep (`moonState`).
const okt = glavneFazeMeseca(2026, 9);
ok(okt.get('2026-10-10')?.key === 'new', 'okt 2026: mlad 10. okt', JSON.stringify([...okt.keys()]));
ok(okt.get('2026-10-26')?.key === 'full', 'okt 2026: pun 26. okt');
ok(okt.size >= 4 && okt.size <= 5, 'okt 2026: 4—5 glavnih faza');
ok([...okt.keys()].every((k) => k.startsWith('2026-10')), 'sve faze su u oktobru');

// Crtez u celiji: pun Mesec ~180, mlad ~0/360.
const u = ugaoDana(new Date(2026, 9, 26));
ok(Math.abs(u - 180) < 15, 'ugao na dan punog Meseca ~180', u.toFixed(1));

// Pomeranje dana preko promene sata (25. okt 2026): isti zid-sat.
const pre = new Date(2026, 9, 24, 21, 30);
const posle = pomeriDan(pre, 2);
ok(dayKey(posle) === '2026-10-26' && posle.getHours() === 21 && posle.getMinutes() === 30, 'pomeriDan preko promene sata zadrzava 21:30');
ok(dayKey(pomeriDan(new Date(2026, 0, 1, 10), -1)) === '2025-12-31', 'pomeriDan unazad preko godine');

// Sklopljen kalendar: nedelja 29. sep 2026 (utorak) je 28. sep — 4. okt, preko granice meseca.
const n = nedeljaDana(new Date(2026, 8, 29, 16));
ok(n.length === 7 && dayKey(n[0]) === '2026-09-28' && dayKey(n[6]) === '2026-10-04', 'nedelja 29. sep: 28. sep — 4. okt', `${dayKey(n[0])} — ${dayKey(n[6])}`);
ok(dayKey(nedeljaDana(new Date(2026, 9, 4, 9))[0]) === '2026-09-28', 'nedelja je prvi dan kad je izabrana nedelja');

console.log(fail ? `\n${fail} FAIL` : '\nsve OK');
process.exit(fail ? 1 : 0);
