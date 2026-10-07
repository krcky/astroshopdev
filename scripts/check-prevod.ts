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
  // podnaslovi astrologa iz korpusa (reveal u onboardingu), po jeziku: `scripts/korpus/natal-podnaslovi.py`
  /^lib\/natal-podnaslovi-podaci\.ts$/,
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
 * DRUGI JEZICI (`src/i18n/<jezik>/`): ceo recnik, bez praznog dela (`{} as Recnik[...]`).
 * Engleski: bez srpskih slova — srpsko slovo je skoro uvek zaboravljen prevod (vlastita imena su izuzetak).
 * Hrvatski i bosanski: bez EKAVICE — cesta ekavska rec ("vreme", "posle") znaci da je tekst prepisan iz srpskog.
 */
const VLASTITA = /Vujović|Boban Vujović/g;
// Granica reci preko \p{L}: `\b` u JS-u ne smatra č/š/ž slovom ("E-pošta" bi sadrzala "šta").
const EKAVICA = /(?<!\p{L})(vreme|mesto|mesta|mestu|mesec|meseca|mesecu|meseci|dete|deca|deteta|reč|reči|lepo|lepa|svet|sveta|uvek|gde|posle|primer|cena|cenu|deo|delu|delova|menja|menjaš|promeni|promena|promene|videti|ceo|cela|celu|celi|celog|nedelja|nedelju|sneg|verovatno|beleška|razumeš)(?!\p{L})/iu;
/** Slovenacki nema ć ni đ; ove reci su srpske/hrvatske, ne slovenacke. */
const NIJE_SLOVENSKI = /[ćđĆĐ]|(?<!\p{L})(nije|šta|ovde|ovdje|uvek|uvijek|sutra|juče|jučer|takođe|između)(?!\p{L})/iu;
for (const j of ['en', 'hr', 'bs', 'sl', 'mk']) {
  const dir = path.join(KOREN, 'i18n', j);
  for (const f of fs.readdirSync(dir)) {
    const izvor = fs.readFileSync(path.join(dir, f), 'utf8');
    if (/\{\}\s*as\s+Recnik/.test(izvor)) { console.error(`✗ ${j}/${f}: deo jos nije preveden ({} as Recnik)`); greske++; }
    izvor.split('\n').forEach((red, i) => {
      const bez = red.replace(/\/\/.*$|\/?\*.*$/, '').replace(VLASTITA, '');
      // samo tekst u navodnicima, ne kljucevi ni imena promenljivih
      const tekst = (bez.match(/(['"`])(?:\\.|(?!\1).)*\1/g) ?? []).join(' ').replace(/\$\{[^}]*\}/g, ' ');
      if (j === 'en' && SRPSKO.test(tekst)) { console.error(`✗ en/${f}:${i + 1}  srpsko slovo: ${red.trim().slice(0, 70)}`); greske++; }
      const e = (j === 'hr' || j === 'bs') && tekst.match(EKAVICA);
      if (e) { console.error(`✗ ${j}/${f}:${i + 1}  ekavica "${e[0]}": ${red.trim().slice(0, 70)}`); greske++; }
      const sl = j === 'sl' && tekst.match(NIJE_SLOVENSKI);
      if (sl) { console.error(`✗ sl/${f}:${i + 1}  nije slovenacki "${sl[0]}": ${red.trim().slice(0, 70)}`); greske++; }
      // Makedonski je cirilica: srpsko latinicno slovo u tekstu = zaboravljen prevod.
      if (j === 'mk' && SRPSKO.test(tekst)) { console.error(`✗ mk/${f}:${i + 1}  latinica: ${red.trim().slice(0, 70)}`); greske++; }
    });
  }
}

/* Racun koji sklapa tekst mora da prati jezik (getteri, datum, mnozina). */
async function proveraJezika() {
  const { postaviJezik, tr } = await import('../src/i18n/jezik');
  const { datum, sat } = await import('../src/lib/horoscope');
  const { josTraje } = await import('../src/lib/mnozina');
  const { signFromLongitude, SIGNS } = await import('../src/lib/zodiac');
  const { BODIES, ASPECTS } = await import('../src/lib/astro');
  const dan = new Date(2026, 8, 29, 12);
  const ocekivano: [string, () => string, string, string][] = [
    ['datum', () => datum(dan, { dan: true, godina: true }), 'Uto, 29. sep 2026', 'Tue, Sep 29, 2026'],
    ['datum hr/bs', () => { postaviJezik('hr'); const h = datum(dan, { dan: true, godina: true }); postaviJezik('bs'); return `${h} / ${datum(dan, { dan: true, godina: true })}`; }, 'Uto, 29. ruj. 2026. / Uto, 29. sep 2026.', 'Uto, 29. ruj. 2026. / Uto, 29. sep 2026.'],
    ['datum sl/mk', () => { postaviJezik('sl'); const h = datum(dan, { dan: true, godina: true }); postaviJezik('mk'); return `${h} / ${datum(dan, { dan: true, godina: true })}`; }, 'Tor, 29. sep. 2026 / Вто, 29 сеп 2026', 'Tor, 29. sep. 2026 / Вто, 29 сеп 2026'],
    ['trajanje sl (dvojina)', () => { postaviJezik('sl'); return [1, 2, 3, 5, 102].map((n) => josTraje(n)).join(' / '); }, 'Traja še 1 dan / Traja še 2 dneva / Traja še 3 dni / Traja še 5 dni / Traja še 3 mesece', 'Traja še 1 dan / Traja še 2 dneva / Traja še 3 dni / Traja še 5 dni / Traja še 3 mesece'],
    ['znak hr/bs', () => { postaviJezik('hr'); const h = SIGNS[10].name; postaviJezik('bs'); return `${h} / ${SIGNS[10].name}`; }, 'Vodenjak / Vodolija', 'Vodenjak / Vodolija'],
    ['trajanje', () => josTraje(3), 'Traje još 3 dana', '3 days left'],
    ['sat', () => sat(14, 5) + ' / ' + sat(0, 30), '14:05 / 00:30', '2:05 PM / 12:30 AM'],
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

  // Jezik po telefonu (Ivan, 2.10.2026): nas jezik na spisku -> region -> engleski.
  const { jezikTelefona } = await import('../src/i18n/jezik-uredjaja');
  const l = (languageCode: string, regionCode: string | null) => ({ languageCode, regionCode });
  const slucajevi: [string, Parameters<typeof jezikTelefona>[0], string][] = [
    ['srpski telefon', [l('sr', 'RS')], 'sr'],
    ['engleski telefon, region Srbija', [l('en', 'RS')], 'sr'],
    ['engleski telefon, region Hrvatska', [l('en', 'HR')], 'hr'],
    ['engleski telefon, region BiH', [l('en', 'BA')], 'bs'],
    ['srpski telefon u BiH', [l('sr', 'BA')], 'sr'],
    ['engleski telefon, region Slovenija', [l('en', 'SI')], 'sl'],
    ['engleski telefon, region Makedonija', [l('en', 'MK')], 'mk'],
    ['crnogorski region', [l('en', 'ME')], 'sr'],
    ['nemacki pa hrvatski, region Nemacka', [l('de', 'DE'), l('hr', 'DE')], 'hr'],
    ['nemacki telefon, region Nemacka', [l('de', 'DE')], 'en'],
    ['engleski telefon, region SAD', [l('en', 'US')], 'en'],
    ['slovenacki telefon, region Austrija', [l('sl', 'AT')], 'sl'],
    ['prazan spisak', [], 'en'],
  ];
  for (const [ime, spisak, ocekivano] of slucajevi) {
    const dobijeno = jezikTelefona(spisak);
    if (dobijeno !== ocekivano) { console.error(`✗ jezik po telefonu, ${ime}: ${dobijeno}, ocekivano ${ocekivano}`); greske++; }
  }
}

proveraJezika().then(() => {
  if (greske) process.exit(1);
  console.log('Prevod: en, hr, bs, sl i mk recnici su celi, racun prati jezik.');
});
