/** Tropski zodijak — 12 znakova po 30 stepeni, pocev od 0 Ovna (prolecna ravnodnevica). */

export type Element = 'vatra' | 'zemlja' | 'vazduh' | 'voda';

export type ZodiacSign = {
  /** Stabilan kljuc — koristi se kao deo kljuca u bazi tekstova. Nikad ne menjati. */
  key: string;
  name: string;
  glyph: string;
  element: Element;
  /** Vladar znaka (tradicionalni/moderni), za prikaz. */
  ruler: string;
  /**
   * Isti vladar kao kljuc planete iz `astro.ts` (`PlanetKey`). Tip je string da
   * `zodiac.ts` ne uvozi `astro.ts` (koji uvozi ovaj fajl). Koristi ga izbor
   * tranzita dana: vladar Ascendenta i Sunca su natalne mete prvog prioriteta.
   */
  rulerKey: string;
  /** Priblizan opseg datuma, samo za prikaz u onboardingu. */
  dates: string;
};

export const SIGNS: ZodiacSign[] = [
  { key: 'aries',       name: 'Ovan',      glyph: '♈\uFE0E', element: 'vatra',  ruler: 'Mars',    rulerKey: 'mars',     dates: '21.3 — 19.4' },
  { key: 'taurus',      name: 'Bik',       glyph: '♉\uFE0E', element: 'zemlja', ruler: 'Venera',  rulerKey: 'venus',    dates: '20.4 — 20.5' },
  { key: 'gemini',      name: 'Blizanci',  glyph: '♊\uFE0E', element: 'vazduh', ruler: 'Merkur',  rulerKey: 'mercury',  dates: '21.5 — 20.6' },
  { key: 'cancer',      name: 'Rak',       glyph: '♋\uFE0E', element: 'voda',   ruler: 'Mesec',   rulerKey: 'moon',     dates: '21.6 — 22.7' },
  { key: 'leo',         name: 'Lav',       glyph: '♌\uFE0E', element: 'vatra',  ruler: 'Sunce',   rulerKey: 'sun',      dates: '23.7 — 22.8' },
  { key: 'virgo',       name: 'Devica',    glyph: '♍\uFE0E', element: 'zemlja', ruler: 'Merkur',  rulerKey: 'mercury',  dates: '23.8 — 22.9' },
  { key: 'libra',       name: 'Vaga',      glyph: '♎\uFE0E', element: 'vazduh', ruler: 'Venera',  rulerKey: 'venus',    dates: '23.9 — 22.10' },
  { key: 'scorpio',     name: 'Škorpija',  glyph: '♏\uFE0E', element: 'voda',   ruler: 'Pluton',  rulerKey: 'pluto',    dates: '23.10 — 21.11' },
  { key: 'sagittarius', name: 'Strelac',   glyph: '♐\uFE0E', element: 'vatra',  ruler: 'Jupiter', rulerKey: 'jupiter',  dates: '22.11 — 21.12' },
  { key: 'capricorn',   name: 'Jarac',     glyph: '♑\uFE0E', element: 'zemlja', ruler: 'Saturn',  rulerKey: 'saturn',   dates: '22.12 — 19.1' },
  { key: 'aquarius',    name: 'Vodolija',  glyph: '♒\uFE0E', element: 'vazduh', ruler: 'Uran',    rulerKey: 'uranus',   dates: '20.1 — 18.2' },
  { key: 'pisces',      name: 'Ribe',      glyph: '♓\uFE0E', element: 'voda',   ruler: 'Neptun',  rulerKey: 'neptune',  dates: '19.2 — 20.3' },
];

/** Normalizuje ugao u [0, 360). */
export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export type SignPosition = {
  sign: ZodiacSign;
  /** Stepen unutar znaka, 0—29.99… */
  degree: number;
  /**
   * Ceo stepen i lucni minut, ISTI oni koji stoje u `formatted`.
   *
   * Postoje kao brojevi zato sto ih natalni tocak crta u dva reda ispod
   * simbola, pa ne moze da uzme gotov string. Racunaju se iz iste odsecene
   * vrednosti kao `formatted` — da se tocak i lista ispod njega nikad ne
   * raziju za jedan minut.
   */
  deg: number;
  min: number;
  /** Za prikaz: "12° 34' Bik" — minuti ODSECENI, kao na astro.com i astro-seek. */
  formatted: string;
  /**
   * Za proveru sa astroloskim softverom: "12° 34' 56\" Bik".
   *
   * NEMA POZIVAOCA U UI-ju i tako treba da ostane — korisnik vidi samo minute.
   * Stepen i minut su isti kao u `formatted`, sekunde su visak za poredjenje
   * cifru po cifru sa astro.com-om ili astro-seek-om.
   */
  formattedPrecise: string;
};

/** Ekliptička longituda (0—360) -> znak + stepen u znaku. */
export function signFromLongitude(longitude: number): SignPosition {
  const lon = norm360(longitude);

  // Minuti se ODSECAJU, ne zaokruzuju: tako rade astro.com i astro-seek, pa
  // korisnik koji poredi ne vidi razliku od 1' (test: scripts/check-sky.ts,
  // odeljak 9). Radi se nad APSOLUTNOM
  // longitudom, pre odredjivanja znaka; epsilon pokriva 12.999999… iz
  // floating pointa, koji bi inace pao minut nize.
  const totalSec = Math.floor(lon * 3600 + 1e-6) % (360 * 3600);
  const totalMin = Math.floor(totalSec / 60);
  const index = Math.floor(totalMin / 1800);
  const within = totalMin - index * 1800;
  const sign = SIGNS[index];

  const deg = Math.floor(within / 60);
  const min = within % 60;
  const sec = totalSec % 60;

  return {
    sign,
    degree: lon - Math.floor(lon / 30) * 30,
    deg,
    min,
    formatted: `${deg}° ${String(min).padStart(2, '0')}' ${sign.name}`,
    formattedPrecise: `${deg}° ${String(min).padStart(2, '0')}' ${String(sec).padStart(2, '0')}" ${sign.name}`,
  };
}

export function signByKey(key: string): ZodiacSign | undefined {
  return SIGNS.find((s) => s.key === key);
}
