/**
 * Provere kruga zivota (osam oblasti sa stanjem). Pokreni: npm run check:krug
 *
 * Karte se RACUNAJU (rodjenje u Beogradu); rucno su zadati samo brojevi za usrednjavanje.
 */
import { buildNatalChart } from '../src/lib/natal';
import { STANJA, KRUG } from '../src/lib/krug-config';
import {
  danPomeren, osnovaDana, stanjeIzOcene, krugDana, usrednji, ocenePoDanima,
} from '../src/lib/krug';
import { BEOGRAD } from '../src/lib/test-karta';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};
const nema = new Map<string, string>();

console.log('\n=== 1. Oblasti ===');
{
  ok(KRUG.length === 8, 'osam oblasti', String(KRUG.length));
  ok(new Set(KRUG.map((d) => d.key)).size === 8, 'kljucevi su jedinstveni');
  const kuce = new Set(KRUG.flatMap((d) => [...d.houses, ...d.weakHouses]));
  const sve = Array.from({ length: 12 }, (_, i) => i + 1);
  ok(sve.every((k) => kuce.has(k)), 'svih 12 kuca ima oblast (puna ili slaba veza)', [...kuce].sort((a, b) => a - b).join(','));
  ok(KRUG.every((d) => d.houses.length > 0 && d.points.length > 0), 'svaka oblast ima kucu i planetu');
  ok(KRUG.every((d) => d.points.every((p) => typeof p === 'string')), 'planete su kljucevi');
}

console.log('\n=== 2. Usrednjavanje i stanje ===');
{
  const t: [number[], number][] = [[[3, 3, 3], 3], [[1, 1, 2], 1], [[4, 5, 5], 5], [[2, 3, 3], 3], [[2, 2, 3], 2], [[4, 4, 3], 4], [[2, 2], 2]];
  for (const [ulaz, izlaz] of t) ok(usrednji(ulaz) === izlaz, `usrednji ${JSON.stringify(ulaz)} = ${izlaz}`, String(usrednji(ulaz)));
  ok(usrednji([2, 3, 4]) === 3, 'simetrija: 2, 3, 4 -> 3');
  ok(STANJA.map((_, i) => stanjeIzOcene(i + 1)).join(',') === 'pritisak,oprez,mirno,raste,procvat', 'ocena 1—5 -> stanje');
  ok(stanjeIzOcene(0) === 'pritisak' && stanjeIzOcene(9) === 'procvat', 'van granica se prilepi uz ivicu');
}

console.log('\n=== 3. Karta sa vremenom rodjenja: godinu dana ===');
{
  const chart = buildNatalChart({ date: new Date(Date.UTC(1988, 2, 14, 9, 30)), ...BEOGRAD });
  const start = new Date(2026, 9, 7, 12);
  const neutralnih = KRUG.map(() => 0);
  let sveTri = true, uredjeno = true, stanjeSkace = 0, prethodno: string[] = [], ukupno = 0;
  for (let i = 0; i < 365; i++) {
    const d = danPomeren(start, i);
    const r = krugDana({ jucer: osnovaDana(chart, danPomeren(d, -1), false), danas: osnovaDana(chart, d, false), sutra: osnovaDana(chart, danPomeren(d, 1), false) }, nema, false);
    if (r.oblasti.length !== 8) sveTri = false;
    r.oblasti.forEach((o, j) => {
      if (o.ocena < 1 || o.ocena > 5) sveTri = false;
      if (o.ocena !== 3) neutralnih[j]++;
      for (let k = 1; k < o.stavke.length; k++) if (Math.abs(o.stavke[k - 1].doprinos) + 1e-9 < Math.abs(o.stavke[k].doprinos)) uredjeno = false;
    });
    const st = r.oblasti.map((o) => o.stanje);
    if (prethodno.length) stanjeSkace += st.filter((s, j) => s !== prethodno[j]).length;
    prethodno = st; ukupno++;
  }
  ok(sveTri, 'svaki dan: osam oblasti, ocene 1—5');
  ok(uredjeno, 'stavke su po uticaju na ocenu');
  neutralnih.forEach((n, j) => ok(n / 365 > 0.4, `oblast ${KRUG[j].key}: ocena nije 3 vise od 40% dana`, `${Math.round((100 * n) / 365)}%`));
  const prosecno = stanjeSkace / 8 / ukupno;
  ok(prosecno < 0.4, 'stanje se menja ređe nego jednom u 2,5 dana po oblasti', `${(prosecno * 365).toFixed(0)} promena godisnje`);
  // sedam dana unapred za jednu oblast
  const sedam = ocenePoDanima(KRUG[4], chart, start, false, nema);
  ok(sedam.length === 7 && sedam.every((o) => o >= 1 && o <= 5), 'sedam dana za jednu oblast', sedam.join(''));
}

console.log('\n=== 4. Bez vremena rodjenja: samo planete ===');
{
  const chart = buildNatalChart({ date: new Date(Date.UTC(1988, 2, 14, 9, 30)), ...BEOGRAD });
  const d = new Date(2026, 9, 7, 12);
  const r = krugDana({ jucer: osnovaDana(chart, danPomeren(d, -1), true), danas: osnovaDana(chart, d, true), sutra: osnovaDana(chart, danPomeren(d, 1), true) }, nema, true);
  ok(r.oblasti.length === 8 && r.bezKuca, 'osam oblasti i oznaka bez kuca');
  const veze = r.oblasti.flatMap((o) => o.stavke.map((s) => s.veza));
  ok(veze.length > 0 && veze.every((v) => v <= 0.5), 'bez kuca je veza samo preko planeta (<= 0,5)', `max ${Math.max(...veze)}`);
}

console.log(fail ? `\n${fail} provera pada` : '\nSve provere prolaze');
process.exit(fail ? 1 : 0);
