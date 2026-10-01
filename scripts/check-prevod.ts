/**
 * Provera prevoda: tekst koji korisnik vidi ide ISKLJUCIVO kroz recnik (`src/i18n/`).
 *
 * Cita svaki .ts/.tsx u `src/` kao TypeScript stablo (komentari ne smetaju) i trazi:
 *   - JSX tekst sa slovima (`<Text>Nastavi</Text>`),
 *   - string ili sablon sa srpskim slovom (č ć š ž đ).
 * Tekst bez dijakritike u stringu ("Profil") skener ne vidi — zato je i drugi deo
 * provere: `--svi` ispisuje SVE stringove sa razmakom i velikim slovom, za rucni pregled.
 *
 * Izuzeti su recnici, generisani podaci, korpus i ekrani samo za razvoj (`IZUZETI`).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';

const KOREN = path.join(__dirname, '..', 'src');

/** Putanje (od `src/`) koje SMEJU da nose srpski tekst. */
const IZUZETI: RegExp[] = [
  /^i18n\//,
  // samo razvoj / probni build, korisnik ih ne vidi
  /^app\/dev-[^/]+\.tsx$/,
  // generisani podaci i korpus (pravilo 7) — prevode se kao sadrzaj, ne kao interfejs
  /^lib\/znak-opis-podaci\.ts$/,
  /^lib\/sazvezdja\.ts$/,
  /^lib\/ikone-osnova\.ts$/,
  /^lib\/traits\.ts$/,
  /^lib\/cities\.ts$/,
  /^lib\/simbolika\.ts$/,
];

const SRPSKO = /[čćšžđČĆŠŽĐ]/;
const SLOVO = /[A-Za-zčćšžđČĆŠŽĐ]/;
const sviRezim = process.argv.includes('--svi');

function fajlovi(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return fajlovi(p);
    return /\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts') ? [p] : [];
  });
}

type Nalaz = { fajl: string; red: number; tekst: string };
const nalazi: Nalaz[] = [];

for (const puna of fajlovi(KOREN)) {
  const rel = path.relative(KOREN, puna).split(path.sep).join('/');
  if (IZUZETI.some((r) => r.test(rel))) continue;
  const izvor = fs.readFileSync(puna, 'utf8');
  const sf = ts.createSourceFile(puna, izvor, ts.ScriptTarget.Latest, true, puna.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const zabelezi = (n: ts.Node, tekst: string) => {
    const red = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
    nalazi.push({ fajl: rel, red, tekst: tekst.replace(/\s+/g, ' ').trim().slice(0, 70) });
  };

  const obidji = (n: ts.Node) => {
    if (ts.isJsxText(n)) {
      if (SLOVO.test(n.text) && n.text.trim()) zabelezi(n, n.text);
    } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      // kljucevi uvoza, `require` i `declare module` nisu tekst
      const ok = !ts.isImportDeclaration(n.parent) && !ts.isExportDeclaration(n.parent) && !ts.isModuleDeclaration(n.parent);
      if (ok && (SRPSKO.test(n.text) || (sviRezim && / /.test(n.text) && /^[A-ZČĆŠŽĐ]/.test(n.text)))) zabelezi(n, n.text);
    } else if (ts.isTemplateExpression(n)) {
      const delovi = [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join('…');
      if (SRPSKO.test(delovi) || (sviRezim && SLOVO.test(delovi) && / /.test(delovi))) zabelezi(n, delovi);
    }
    ts.forEachChild(n, obidji);
  };
  obidji(sf);
}

if (process.argv.includes('--po-fajlu')) {
  const broj = new Map<string, number>();
  for (const n of nalazi) broj.set(n.fajl, (broj.get(n.fajl) ?? 0) + 1);
  for (const [f, b] of [...broj].sort((a, b) => b[1] - a[1])) console.log(`${String(b).padStart(4)}  ${f}`);
  console.log(`\nUkupno: ${nalazi.length} u ${broj.size} fajlova.`);
  process.exit(0);
}

let greske = 0;
if (nalazi.length) {
  for (const n of nalazi) console.error(`  ${n.fajl}:${n.red}  ${n.tekst}`);
  console.error(`\n✗ ${nalazi.length} tekstova van recnika. Tekst za korisnika ide u \`src/i18n/sr/\` i cita se kroz \`useT()\` ili \`tr()\`.`);
  greske++;
} else {
  console.log('Prevod: sav tekst za korisnika ide kroz recnik.');
}

/*
 * ENGLESKI (`src/i18n/en/`): ceo recnik, bez praznog dela (`{} as Recnik[...]`) i bez srpskih slova —
 * srpsko slovo u engleskom recniku je skoro uvek zaboravljen prevod. Vlastita imena su izuzetak.
 */
const VLASTITA = /Vujović|Boban Vujović/g;
const EN = path.join(KOREN, 'i18n', 'en');
for (const f of fs.readdirSync(EN)) {
  const izvor = fs.readFileSync(path.join(EN, f), 'utf8');
  if (/\{\}\s*as\s+Recnik/.test(izvor)) { console.error(`✗ en/${f}: deo jos nije preveden ({} as Recnik)`); greske++; }
  izvor.split('\n').forEach((red, i) => {
    const bez = red.replace(/\/\/.*$|\/?\*.*$/, '').replace(VLASTITA, '');
    if (SRPSKO.test(bez)) { console.error(`✗ en/${f}:${i + 1}  srpsko slovo: ${red.trim().slice(0, 70)}`); greske++; }
  });
}

/* Racun koji sklapa tekst mora da prati jezik (getteri, datum, mnozina). */
async function proveraJezika() {
  const { postaviJezik, tr } = await import('../src/i18n/jezik');
  const { datum } = await import('../src/lib/horoscope');
  const { josTraje } = await import('../src/lib/mnozina');
  const { signFromLongitude, SIGNS } = await import('../src/lib/zodiac');
  const { BODIES, ASPECTS } = await import('../src/lib/astro');
  const dan = new Date(2026, 8, 29, 12);
  const ocekivano: [string, () => string, string, string][] = [
    ['datum', () => datum(dan, { dan: true, godina: true }), 'Uto, 29. sep 2026', 'Tue, Sep 29, 2026'],
    ['trajanje', () => josTraje(3), 'Traje još 3 dana', '3 days left'],
    ['znak', () => signFromLongitude(42.5).formatted, "12° 30' Bik", "12° 30' Taurus"],
    ['vladar', () => SIGNS[7].ruler, 'Pluton', 'Pluto'],
    ['planeta', () => BODIES[0].name, 'Mesec', 'Moon'],
    ['aspekt', () => ASPECTS[2].name, 'kvadrat', 'square'],
    ['padezi', () => tr().onboarding.push.primerAspektTekst('venus', 'trine', 'sun'), 'Venera je u trigonu sa tvojim Suncem.', 'Venus trines your Sun.'],
    ['rod', () => tr().onboarding.push.primerAspektTekst('mars', 'conjunction', 'venus'), 'Mars je u konjunkciji sa tvojom Venerom.', 'Mars is conjunct your Venus.'],
  ];
  for (const [ime, f, sr, en] of ocekivano) {
    for (const [j, v] of [['sr', sr], ['en', en]] as const) {
      postaviJezik(j);
      const dobijeno = f();
      if (dobijeno !== v) { console.error(`✗ ${ime} (${j}): "${dobijeno}", ocekivano "${v}"`); greske++; }
    }
  }
  postaviJezik('sr');
}

proveraJezika().then(() => {
  if (greske) process.exit(1);
  console.log('Prevod: engleski recnik je ceo, racun prati jezik.');
});
