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
