/**
 * Imena tela, tacaka, aspekata, znakova i faza Meseca. Kljucevi su ISTI kao u `astro.ts`,
 * `points.ts` i `zodiac.ts` (`contentKey`) — kljuc se ne prevodi, samo ime.
 */
/**
 * Znak: ime (nominativ), akuzativ ("Mars ulazi u Lava"), lokativ ("Venera u Škorpiji").
 * Jezik bez padeza (engleski) stavlja isto ime u sva tri.
 */
const znaci = {
  aries:       { ime: 'Ovan',     akuzativ: 'Ovna',     lokativ: 'Ovnu' },
  taurus:      { ime: 'Bik',      akuzativ: 'Bika',     lokativ: 'Biku' },
  gemini:      { ime: 'Blizanci', akuzativ: 'Blizance', lokativ: 'Blizancima' },
  cancer:      { ime: 'Rak',      akuzativ: 'Raka',     lokativ: 'Raku' },
  leo:         { ime: 'Lav',      akuzativ: 'Lava',     lokativ: 'Lavu' },
  virgo:       { ime: 'Devica',   akuzativ: 'Devicu',   lokativ: 'Devici' },
  libra:       { ime: 'Vaga',     akuzativ: 'Vagu',     lokativ: 'Vagi' },
  scorpio:     { ime: 'Škorpija', akuzativ: 'Škorpiju', lokativ: 'Škorpiji' },
  sagittarius: { ime: 'Strelac',  akuzativ: 'Strelca',  lokativ: 'Strelcu' },
  capricorn:   { ime: 'Jarac',    akuzativ: 'Jarca',    lokativ: 'Jarcu' },
  aquarius:    { ime: 'Vodolija', akuzativ: 'Vodoliju', lokativ: 'Vodoliji' },
  pisces:      { ime: 'Ribe',     akuzativ: 'Ribe',     lokativ: 'Ribama' },
};

/**
 * Padezi planeta, za recenice: "sa tvojim Suncem" (instrumental), "Venera u trigonu" (lokativ aspekta).
 * Nominativ je `tela`. `rod` bira oblik prisvojne zamenice: m "tvojim Marsom", z "tvojom Venerom",
 * s "tvojim Suncem". Akuzativ kao u govoru: "tvoj Mesec", ali "tvog Marsa".
 */
type Padezi = { genitiv: string; dativ: string; akuzativ: string; instrumental: string; lokativ: string };
type Rod = 'm' | 'z' | 's';
const p = (genitiv: string, dativ: string, akuzativ: string, instrumental: string, lokativ: string): Padezi =>
  ({ genitiv, dativ, akuzativ, instrumental, lokativ });

const padeziTela: Record<'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto', Padezi & { rod: Rod }> = {
  sun:     { rod: 's', ...p('Sunca', 'Suncu', 'Sunce', 'Suncem', 'Suncu') },
  moon:    { rod: 'm', ...p('Meseca', 'Mesecu', 'Mesec', 'Mesecom', 'Mesecu') },
  mercury: { rod: 'm', ...p('Merkura', 'Merkuru', 'Merkur', 'Merkurom', 'Merkuru') },
  venus:   { rod: 'z', ...p('Venere', 'Veneri', 'Veneru', 'Venerom', 'Veneri') },
  mars:    { rod: 'm', ...p('Marsa', 'Marsu', 'Marsa', 'Marsom', 'Marsu') },
  jupiter: { rod: 'm', ...p('Jupitera', 'Jupiteru', 'Jupitera', 'Jupiterom', 'Jupiteru') },
  saturn:  { rod: 'm', ...p('Saturna', 'Saturnu', 'Saturna', 'Saturnom', 'Saturnu') },
  uranus:  { rod: 'm', ...p('Urana', 'Uranu', 'Urana', 'Uranom', 'Uranu') },
  neptune: { rod: 'm', ...p('Neptuna', 'Neptunu', 'Neptuna', 'Neptunom', 'Neptunu') },
  pluto:   { rod: 'm', ...p('Plutona', 'Plutonu', 'Plutona', 'Plutonom', 'Plutonu') },
};

/** Padezi aspekata: "u trigonu" (lokativ), "posle konjunkcije" (genitiv). */
const padeziAspekta: Record<'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition', Padezi> = {
  conjunction: p('konjunkcije', 'konjunkciji', 'konjunkciju', 'konjunkcijom', 'konjunkciji'),
  sextile:     p('sekstila', 'sekstilu', 'sekstil', 'sekstilom', 'sekstilu'),
  square:      p('kvadrata', 'kvadratu', 'kvadrat', 'kvadratom', 'kvadratu'),
  trine:       p('trigona', 'trigonu', 'trigon', 'trigonom', 'trigonu'),
  opposition:  p('opozicije', 'opoziciji', 'opoziciju', 'opozicijom', 'opoziciji'),
};

export const nebo = {
  tela: {
    sun: 'Sunce',
    moon: 'Mesec',
    mercury: 'Merkur',
    venus: 'Venera',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
    uranus: 'Uran',
    neptune: 'Neptun',
    pluto: 'Pluton',
  },
  tacke: {
    northNode: 'Severni čvor',
    lilith: 'Lilit',
    fortune: 'Tačka sreće',
  },
  aspekti: {
    conjunction: 'konjunkcija',
    sextile: 'sekstil',
    square: 'kvadrat',
    trine: 'trigon',
    opposition: 'opozicija',
  },
  padeziTela,
  padeziAspekta,
  znaci,
  /** "u Lavu" — gde je nesto. */
  uZnaku: (k: keyof typeof znaci) => `u ${znaci[k].lokativ}`,
  /** "u Lava" — kuda ide ("ulazi u Lava", "prešao u Lava"). */
  uZnak: (k: keyof typeof znaci) => `u ${znaci[k].akuzativ}`,
  /** Faze Meseca po osminama, od mladog (0) do starog srpa (7). */
  fazeMeseca: [
    'Mlad Mesec', 'Mladi srp', 'Prva četvrt', 'Rastući Mesec',
    'Pun Mesec', 'Opadajući Mesec', 'Poslednja četvrt', 'Stari srp',
  ],
};
