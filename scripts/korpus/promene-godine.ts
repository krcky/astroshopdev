/**
 * Koji tekstovi "Promena na nebu" trebaju za narednih godinu dana (Ivan, 30.9.2026).
 *
 *   npx tsx scripts/korpus/promene-godine.ts [YYYY-MM-DD] [dana]     (podrazumevano: danas, 365)
 *
 * Tekst ide po ZNAKU, ne po kuci, u dve vrste:
 *   sky.<planeta>.sign.<znak>        planeta u znaku — kad UDJE u znak ili u njemu ponovo postane DIREKTNA
 *   sky.<planeta>.retrograde.<znak>  retrogradna u znaku — kad POSTANE retrogradna ili retrogradno UDJE u znak
 * Trazi se samo ono sto se u tom periodu stvarno desi; ispis je JSON (cita ga `odgovor.py`),
 * poredjan po prvom pojavljivanju. Planete i efemeris su isti kao `lib/sky-events.ts` (bez Meseca).
 */
import { bodyLongitude, BODIES, type PlanetKey } from '../../src/lib/astro';
import { SIGN_CASES, SIGNS, norm360 } from '../../src/lib/zodiac';

const DAY = 86_400_000;
const H = 3_600_000;
const KORAK = 6 * H; // Merkurova stanica traje danima, znak se prelazi za bar ~14 dana

const delta = (a: number, b: number) => ((a - b + 540) % 360) - 180;
const znak = (lon: number) => Math.floor(norm360(lon) / 30);
const lon = (k: PlanetKey, t: number) => bodyLongitude(k, new Date(t));
/** Brzina u stepenima po danu, iz razlike +-1h — kao u `sky-events.ts`. */
const brzina = (k: PlanetKey, t: number) => delta(lon(k, t + H), lon(k, t - H)) * 12;

function bisect(lo: number, hi: number, promenjeno: (t: number) => boolean): number {
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (promenjeno(m)) hi = m;
    else lo = m;
  }
  return hi;
}

const datum = (t: number) => {
  const d = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(new Date(t));
  const p = (x: string) => d.find((y) => y.type === x)!.value;
  return `${Number(p('day'))}. ${Number(p('month'))}. ${p('year')}.`;
};

/** Pocetak: lokalna ponoc u Beogradu za dati dan (letnje vreme se uzima iz Intl-a). */
function ponoc(iso: string): number {
  const utc = Date.parse(`${iso}T00:00:00Z`);
  const sat = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', hour: 'numeric', hourCycle: 'h23' })
    .format(new Date(utc)));
  return utc - sat * H;
}

type Vrsta = 'ulazak' | 'ulazak-retro' | 'retrograde' | 'direct';
type Stavka = {
  kljuc: string; naslov: string; planeta: string; planetaKey: PlanetKey; znak: string; znakKey: string;
  retro: boolean; prvi: number; dogadjaji: { vrsta: Vrsta; datum: string }[];
};

const danas = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Belgrade' });
const od = ponoc(process.argv[2] ?? danas);
const dana = Number(process.argv[3] ?? 365);
const stavke = new Map<string, Stavka>();

function dodaj(k: PlanetKey, ime: string, z: number, retro: boolean, vrsta: Vrsta, t: number) {
  const kljuc = `sky.${k}.${retro ? 'retrograde' : 'sign'}.${SIGNS[z].key}`;
  // Kao naslovi na kartici: "Merkur u Škorpiji", "Retrogradna Venera u Vagi".
  const naslov = `${retro ? (k === 'venus' ? 'Retrogradna ' : 'Retrogradni ') : ''}${ime} u ${SIGN_CASES[SIGNS[z].key].loc}`;
  const s = stavke.get(kljuc) ?? {
    kljuc, naslov, planeta: ime, planetaKey: k, znak: SIGNS[z].name, znakKey: SIGNS[z].key, retro, prvi: t, dogadjaji: [],
  };
  s.dogadjaji.push({ vrsta, datum: datum(t) });
  stavke.set(kljuc, s);
}

for (const b of BODIES) {
  if (b.key === 'moon') continue;
  let pl = lon(b.key, od);
  let pv = brzina(b.key, od);
  for (let t = od + KORAK; t <= od + dana * DAY; t += KORAK) {
    const l = lon(b.key, t);
    const v = brzina(b.key, t);
    if (znak(l) !== znak(pl)) {
      const bio = znak(pl);
      const at = bisect(t - KORAK, t, (x) => znak(lon(b.key, x)) !== bio);
      const retro = brzina(b.key, at) < 0;
      dodaj(b.key, b.name, znak(lon(b.key, at + 60_000)), retro, retro ? 'ulazak-retro' : 'ulazak', at);
    }
    if (pv > 0 && v <= 0) dodaj(b.key, b.name, znak(l), true, 'retrograde', bisect(t - KORAK, t, (x) => brzina(b.key, x) <= 0));
    if (pv < 0 && v >= 0) dodaj(b.key, b.name, znak(l), false, 'direct', bisect(t - KORAK, t, (x) => brzina(b.key, x) >= 0));
    pl = l;
    pv = v;
  }
}

const lista = [...stavke.values()].sort((a, b) => a.prvi - b.prvi);
console.log(JSON.stringify({ od: datum(od), do: datum(od + dana * DAY), stavke: lista }, null, 1));
