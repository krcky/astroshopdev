/**
 * Racun za "Astrodial" — zasebnu aplikaciju za sat (pravilo 27 u CLAUDE.md).
 *
 * Telefonska aplikacija ovo NE prikazuje; fajl postoji jer je `src/lib` izvor istine za
 * svaki racun neba: odavde se pravi `golden.json`, a Swift (`native/SkyCore/.../Sat.swift`)
 * i Kotlin (`.../core/Sat.kt`) su prepis i porede se sa tim brojevima.
 *
 * Sve je CIST racun bez reci i bez datuma rodjenja: Mesec u znaku i kad ga menja, Mesec bez
 * kursa (void of course), planetarni sat, i spisak narednih dogadjaja na nebu.
 *
 * Trazenje trenutka (ulazak u znak, tacan aspekt, stanica) ide SVOJOM bisekcijom nad
 * `bodyLongitude`, ne funkcijama biblioteke — tako su sva tri prepisa isti algoritam, korak po korak.
 *
 * DEFINICIJE KOJE CEKAJU ASTROLOGA (`docs/ASTRO-LOGIKA.md`, 7):
 *   - Mesec bez kursa: od poslednjeg TACNOG glavnog aspekta (0, 60, 90, 120, 180) sa bilo kojom
 *     od devet planeta (i Uran, Neptun, Pluton) do ulaska u sledeci znak.
 *   - Planetarni sati: haldejski red, dan pocinje izlaskom Sunca, dan i noc se dele na po 12.
 */
import * as Astronomy from 'astronomy-engine';
import { BODIES, bodyLongitude, moonPhase, type PlanetKey } from '@/lib/astro';
import { norm360 } from '@/lib/zodiac';

const SAT_MS = 3_600_000;
const DAN_MS = 86_400_000;

function delta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

const lon = (key: PlanetKey, ms: number) => bodyLongitude(key, new Date(ms));
const znak = (key: PlanetKey, ms: number) => Math.floor(lon(key, ms) / 30);

/** Bisekcija: `uslov(lo)` je false, `uslov(hi)` true; vraca prvi trenutak kad postane true (do `tacnost` ms). */
function bisekcija(lo: number, hi: number, uslov: (ms: number) => boolean, tacnost = 500): number {
  while (hi - lo > tacnost) {
    const mid = (lo + hi) / 2;
    if (uslov(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Prvi trenutak posle `ms` kad telo predje u drugi znak (napred ili, retrogradno, nazad); `null` ako ne u `dana`. */
export function sledeciUlazak(key: PlanetKey, ms: number, korakMs: number, dana: number): { at: number; sign: number } | null {
  const z0 = znak(key, ms);
  for (let t = ms; t < ms + dana * DAN_MS; t += korakMs) {
    if (znak(key, t + korakMs) !== z0) {
      const at = bisekcija(t, t + korakMs, (x) => znak(key, x) !== z0);
      return { at, sign: znak(key, at) };
    }
  }
  return null;
}

export type MoonNow = {
  /** 0 = Ovan … 11 = Ribe. */
  sign: number;
  /** Stepen u znaku, 0—30. */
  degree: number;
  /** Kad je usao u ovaj znak i kad ulazi u sledeci (ms). */
  enteredAt: number;
  ingressAt: number;
  /** Koliko je znaka presao, po VREMENU (0—1) — traka napretka. */
  progress: number;
  /** Ugao faze (0 mlad, 180 pun), osvetljeni deo 0—1 i indeks faze 0—7 (0 = mlad Mesec). */
  phaseAngle: number;
  illumination: number;
  phase: number;
  /** Poslednji mlad Mesec (ms) i lunarni dan 1—30: dani od njega, pocev od 1 — kao `moonState` u `moon.ts`. */
  lastNew: number;
  lunarDay: number;
};

export function moonNow(ms: number): MoonNow {
  const l = lon('moon', ms);
  const sign = Math.floor(l / 30);
  // Mesec ostaje u znaku oko 2,3 dana; unazad i unapred po sat, pa bisekcija.
  let t = ms;
  while (znak('moon', t - SAT_MS) === sign) t -= SAT_MS;
  const enteredAt = bisekcija(t - SAT_MS, t, (x) => znak('moon', x) === sign);
  const ingressAt = sledeciUlazak('moon', ms, SAT_MS, 4)!.at;
  const phaseAngle = moonPhase(new Date(ms)).angle;
  // Poslednji mlad Mesec: unazad po 6 sati dok ugao faze ne preskoci sa ~0 na ~360, pa bisekcija.
  const faza = (x: number) => moonPhase(new Date(x)).angle;
  let m = ms;
  while (faza(m - 6 * SAT_MS) < faza(m)) m -= 6 * SAT_MS;
  const lastNew = bisekcija(m - 6 * SAT_MS, m, (x) => faza(x) < 180);
  return {
    sign,
    degree: l - sign * 30,
    enteredAt,
    ingressAt,
    progress: (ms - enteredAt) / (ingressAt - enteredAt),
    phaseAngle,
    illumination: (1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2,
    phase: Math.floor(norm360(phaseAngle + 22.5) / 45),
    lastNew,
    lunarDay: Math.min(30, Math.floor((ms - lastNew) / DAN_MS) + 1),
  };
}

/** Uglovi rastojanja Meseca od planete na kojima je glavni aspekt tacan. */
const ASPEKT_UGLOVI = [0, 60, 90, 120, 180, 240, 270, 300];
const VOC_KORAK_MS = SAT_MS / 2;

export type Voc = { start: number; end: number; active: boolean };

/**
 * Mesec bez kursa za boravak Meseca u tekucem znaku: `start` je poslednji tacan glavni aspekt
 * pre izlaska iz znaka (ili ulazak u znak, ako aspekta nema), `end` ulazak u sledeci znak.
 */
export function voidOfCourse(ms: number, moon: MoonNow = moonNow(ms)): Voc {
  const planete = BODIES.map((b) => b.key).filter((k) => k !== 'moon');
  let poslednji = moon.enteredAt;
  for (const p of planete) {
    // Mesec je brzi od svih, pa rastojanje (Mesec − planeta) samo raste: tacan aspekt je
    // trenutak kad predje ciljni ugao.
    const rast = (t: number) => norm360(lon('moon', t) - lon(p, t));
    for (let t = moon.enteredAt; t < moon.ingressAt; t += VOC_KORAK_MS) {
      const kraj = Math.min(t + VOC_KORAK_MS, moon.ingressAt);
      const a = rast(t);
      const b = rast(kraj);
      for (const cilj of ASPEKT_UGLOVI) {
        const da = delta(a, cilj);
        const db = delta(b, cilj);
        if (da < 0 && db >= 0 && db - da < 90) {
          const at = bisekcija(t, kraj, (x) => delta(rast(x), cilj) >= 0);
          if (at > poslednji) poslednji = at;
        }
      }
    }
  }
  return { start: poslednji, end: moon.ingressAt, active: ms >= poslednji };
}

/** Haldejski red (od najsporije) i vladari dana od nedelje. */
const HALDEJSKI: PlanetKey[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];
const VLADAR_DANA: PlanetKey[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

export type PlanetaryHour = {
  ruler: PlanetKey;
  next: PlanetKey;
  start: number;
  end: number;
  /** Redni broj sata, 0—23 (0—11 dan, 12—23 noc). */
  index: number;
  day: boolean;
  /** Izlazak i zalazak Sunca tog planetarnog dana. */
  sunrise: number;
  sunset: number;
};

function suncevDogadjaj(smer: 1 | -1, odMs: number, latitude: number, longitude: number): number | null {
  const t = Astronomy.SearchRiseSet(Astronomy.Body.Sun, new Astronomy.Observer(latitude, longitude, 0), smer, new Date(odMs), 2);
  return t ? t.date.getTime() : null;
}

/** Planetarni sat u trenutku `ms` nad mestom; `null` gde Sunce tog dana ne izlazi ili ne zalazi. */
export function planetaryHour(ms: number, latitude: number, longitude: number): PlanetaryHour | null {
  // Poslednji izlazak Sunca pre `ms`: trazi se od dan i po ranije, pa se ide napred.
  let izlazak = suncevDogadjaj(1, ms - 1.5 * DAN_MS, latitude, longitude);
  if (izlazak === null || izlazak > ms) return null;
  for (;;) {
    const sledeci = suncevDogadjaj(1, izlazak + 60_000, latitude, longitude);
    if (sledeci === null) return null;
    if (sledeci > ms) break;
    izlazak = sledeci;
  }
  const zalazak = suncevDogadjaj(-1, izlazak, latitude, longitude);
  const sutra = suncevDogadjaj(1, izlazak + 60_000, latitude, longitude);
  if (zalazak === null || sutra === null || zalazak > sutra) return null;

  const day = ms < zalazak;
  const pocetak = day ? izlazak : zalazak;
  const duzina = (day ? zalazak - izlazak : sutra - zalazak) / 12;
  const uDelu = Math.min(11, Math.floor((ms - pocetak) / duzina));
  const index = (day ? 0 : 12) + uDelu;
  // Dan u nedelji po MESNOM vremenu izlaska (duzina / 15 sati), bez vremenske zone; 1.1.1970. je cetvrtak.
  const dan = ((Math.floor((izlazak + longitude * 240_000) / DAN_MS) + 4) % 7 + 7) % 7;
  const prvi = HALDEJSKI.indexOf(VLADAR_DANA[dan]);
  return {
    ruler: HALDEJSKI[(prvi + index) % 7],
    next: HALDEJSKI[(prvi + index + 1) % 7],
    start: pocetak + uDelu * duzina,
    end: pocetak + (uDelu + 1) * duzina,
    index,
    day,
    sunrise: izlazak,
    sunset: zalazak,
  };
}

export type SatEvent =
  | { kind: 'moonSign'; at: number; sign: number }
  | { kind: 'voc'; at: number }
  /** 0 mlad, 1 prva cetvrt, 2 pun, 3 poslednja cetvrt. */
  | { kind: 'phase'; at: number; quarter: number }
  | { kind: 'ingress'; at: number; body: PlanetKey; sign: number }
  | { kind: 'station'; at: number; body: PlanetKey; retrograde: boolean };

/** Brzina kao u `planetPositions`: razlika longitude za pola dana. */
const brzina = (key: PlanetKey, ms: number) => delta(lon(key, ms + DAN_MS / 2), lon(key, ms)) / 0.5;

/** Naredni dogadjaji, po vremenu: Mesec (znak, bez kursa, cetvrti) i planete (ulazak u znak, stanica) za `dana`. */
export function upcomingEvents(ms: number, dana = 30): SatEvent[] {
  const out: SatEvent[] = [];
  const moon = moonNow(ms);
  out.push({ kind: 'moonSign', at: moon.ingressAt, sign: (moon.sign + 1) % 12 });
  const voc = voidOfCourse(ms, moon);
  if (voc.start > ms) out.push({ kind: 'voc', at: voc.start });

  // Cetvrti Meseca: ugao faze prelazi sledeci umnozak od 90°.
  const faza = (t: number) => moonPhase(new Date(t)).angle;
  const KORAK_FAZE = 6 * SAT_MS;
  for (let t = ms; t < ms + dana * DAN_MS; t += KORAK_FAZE) {
    const q0 = Math.floor(faza(t) / 90);
    if (Math.floor(faza(t + KORAK_FAZE) / 90) !== q0) {
      const at = bisekcija(t, t + KORAK_FAZE, (x) => Math.floor(faza(x) / 90) !== q0);
      out.push({ kind: 'phase', at, quarter: (q0 + 1) % 4 });
    }
  }

  for (const { key } of BODIES) {
    if (key === 'moon') continue;
    const ulazak = sledeciUlazak(key, ms, DAN_MS, dana);
    if (ulazak) out.push({ kind: 'ingress', at: ulazak.at, body: key, sign: ulazak.sign });
    if (key === 'sun') continue; // Sunce nema stanice
    for (let t = ms; t < ms + dana * DAN_MS; t += DAN_MS) {
      const r0 = brzina(key, t) < 0;
      if (brzina(key, t + DAN_MS) < 0 !== r0) {
        const at = bisekcija(t, t + DAN_MS, (x) => brzina(key, x) < 0 !== r0, 30_000);
        out.push({ kind: 'station', at, body: key, retrograde: !r0 });
        break;
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
