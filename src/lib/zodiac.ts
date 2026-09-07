/** Tropski zodijak — 12 znakova po 30 stepeni, pocev od 0 Ovna (prolecna ravnodnevica). */

export type Element = 'vatra' | 'zemlja' | 'vazduh' | 'voda';

export type ZodiacSign = {
  /** Stabilan kljuc — koristi se kao deo kljuca u bazi tekstova. Nikad ne menjati. */
  key: string;
  name: string;
  glyph: string;
  element: Element;
  /** Vladar znaka (tradicionalni/moderni). */
  ruler: string;
  /** Priblizan opseg datuma, samo za prikaz u onboardingu. */
  dates: string;
};

export const SIGNS: ZodiacSign[] = [
  { key: 'aries',       name: 'Ovan',      glyph: '♈\uFE0E', element: 'vatra',  ruler: 'Mars',    dates: '21.3 — 19.4' },
  { key: 'taurus',      name: 'Bik',       glyph: '♉\uFE0E', element: 'zemlja', ruler: 'Venera',  dates: '20.4 — 20.5' },
  { key: 'gemini',      name: 'Blizanci',  glyph: '♊\uFE0E', element: 'vazduh', ruler: 'Merkur',  dates: '21.5 — 20.6' },
  { key: 'cancer',      name: 'Rak',       glyph: '♋\uFE0E', element: 'voda',   ruler: 'Mesec',   dates: '21.6 — 22.7' },
  { key: 'leo',         name: 'Lav',       glyph: '♌\uFE0E', element: 'vatra',  ruler: 'Sunce',   dates: '23.7 — 22.8' },
  { key: 'virgo',       name: 'Devica',    glyph: '♍\uFE0E', element: 'zemlja', ruler: 'Merkur',  dates: '23.8 — 22.9' },
  { key: 'libra',       name: 'Vaga',      glyph: '♎\uFE0E', element: 'vazduh', ruler: 'Venera',  dates: '23.9 — 22.10' },
  { key: 'scorpio',     name: 'Škorpija',  glyph: '♏\uFE0E', element: 'voda',   ruler: 'Pluton',  dates: '23.10 — 21.11' },
  { key: 'sagittarius', name: 'Strelac',   glyph: '♐\uFE0E', element: 'vatra',  ruler: 'Jupiter', dates: '22.11 — 21.12' },
  { key: 'capricorn',   name: 'Jarac',     glyph: '♑\uFE0E', element: 'zemlja', ruler: 'Saturn',  dates: '22.12 — 19.1' },
  { key: 'aquarius',    name: 'Vodolija',  glyph: '♒\uFE0E', element: 'vazduh', ruler: 'Uran',    dates: '20.1 — 18.2' },
  { key: 'pisces',      name: 'Ribe',      glyph: '♓\uFE0E', element: 'voda',   ruler: 'Neptun',  dates: '19.2 — 20.3' },
];

/** Normalizuje ugao u [0, 360). */
export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export type SignPosition = {
  sign: ZodiacSign;
  /** Stepen unutar znaka, 0—29.99… */
  degree: number;
  /** Za prikaz: "12° 34' Bik" — minuti ZAOKRUZENI. */
  formatted: string;
  /** Za proveru sa astroloskim softverom: "12° 34' 56\" Bik". */
  formattedPrecise: string;
};

/** Ekliptička longituda (0—360) -> znak + stepen u znaku. */
export function signFromLongitude(longitude: number): SignPosition {
  const lon = norm360(longitude);

  // Zaokruzivanje na najblizi lucni minut radi se nad APSOLUTNOM longitudom,
  // pre odredjivanja znaka. Inace bi 29° 59.7' ostalo prikazano kao 29° 60'
  // u prethodnom znaku, umesto kao 0° sledeceg.
  const totalMin = Math.round(lon * 60) % (360 * 60);
  const index = Math.floor(totalMin / 1800);
  const within = totalMin - index * 1800;
  const sign = SIGNS[index];

  // Precizan oblik zadrzava sekunde i NE zaokruzuje minute — tako pise i
  // astro.com za planete, pa se vrednosti mogu porediti cifru po cifru.
  const rawIndex = Math.floor(lon / 30);
  const rawDeg = lon - rawIndex * 30;
  const pd = Math.floor(rawDeg);
  const pm = Math.floor((rawDeg - pd) * 60);
  const ps = Math.round((rawDeg - pd - pm / 60) * 3600);

  return {
    sign,
    degree: lon - rawIndex * 30,
    formatted: `${Math.floor(within / 60)}° ${String(within % 60).padStart(2, '0')}' ${sign.name}`,
    formattedPrecise: `${pd}° ${String(pm).padStart(2, '0')}' ${String(ps).padStart(2, '0')}" ${SIGNS[rawIndex].name}`,
  };
}

export function signByKey(key: string): ZodiacSign | undefined {
  return SIGNS.find((s) => s.key === key);
}
