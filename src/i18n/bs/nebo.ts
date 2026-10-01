import type { Recnik } from '../sr';

/**
 * Imena tela, tacaka, aspekata, znakova i faza Mjeseca — vidi `sr/nebo.ts`. Kljucevi se ne prevode.
 * Padezi kao u srpskom; `rod` bira "tvojim / tvojom".
 */
type Padezi = { genitiv: string; dativ: string; akuzativ: string; instrumental: string; lokativ: string };
const p = (genitiv: string, dativ: string, akuzativ: string, instrumental: string, lokativ: string): Padezi =>
  ({ genitiv, dativ, akuzativ, instrumental, lokativ });

const znaci: Recnik['nebo']['znaci'] = {
  aries: { ime: 'Ovan', akuzativ: 'Ovna', lokativ: 'Ovnu' },
  taurus: { ime: 'Bik', akuzativ: 'Bika', lokativ: 'Biku' },
  gemini: { ime: 'Blizanci', akuzativ: 'Blizance', lokativ: 'Blizancima' },
  cancer: { ime: 'Rak', akuzativ: 'Raka', lokativ: 'Raku' },
  leo: { ime: 'Lav', akuzativ: 'Lava', lokativ: 'Lavu' },
  virgo: { ime: 'Djevica', akuzativ: 'Djevicu', lokativ: 'Djevici' },
  libra: { ime: 'Vaga', akuzativ: 'Vagu', lokativ: 'Vagi' },
  scorpio: { ime: 'Škorpija', akuzativ: 'Škorpiju', lokativ: 'Škorpiji' },
  sagittarius: { ime: 'Strijelac', akuzativ: 'Strijelca', lokativ: 'Strijelcu' },
  capricorn: { ime: 'Jarac', akuzativ: 'Jarca', lokativ: 'Jarcu' },
  aquarius: { ime: 'Vodolija', akuzativ: 'Vodoliju', lokativ: 'Vodoliji' },
  pisces: { ime: 'Ribe', akuzativ: 'Ribe', lokativ: 'Ribama' },
};

export const nebo: Recnik['nebo'] = {
  tela: {
    sun: 'Sunce', moon: 'Mjesec', mercury: 'Merkur', venus: 'Venera', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uran', neptune: 'Neptun', pluto: 'Pluton',
  },
  tacke: { northNode: 'Sjeverni čvor', lilith: 'Lilit', fortune: 'Tačka sreće' },
  aspekti: { conjunction: 'konjunkcija', sextile: 'sekstil', square: 'kvadrat', trine: 'trigon', opposition: 'opozicija' },
  padeziTela: {
    sun:     { rod: 's', ...p('Sunca', 'Suncu', 'Sunce', 'Suncem', 'Suncu') },
    moon:    { rod: 'm', ...p('Mjeseca', 'Mjesecu', 'Mjesec', 'Mjesecom', 'Mjesecu') },
    mercury: { rod: 'm', ...p('Merkura', 'Merkuru', 'Merkur', 'Merkurom', 'Merkuru') },
    venus:   { rod: 'z', ...p('Venere', 'Veneri', 'Veneru', 'Venerom', 'Veneri') },
    mars:    { rod: 'm', ...p('Marsa', 'Marsu', 'Marsa', 'Marsom', 'Marsu') },
    jupiter: { rod: 'm', ...p('Jupitera', 'Jupiteru', 'Jupitera', 'Jupiterom', 'Jupiteru') },
    saturn:  { rod: 'm', ...p('Saturna', 'Saturnu', 'Saturna', 'Saturnom', 'Saturnu') },
    uranus:  { rod: 'm', ...p('Urana', 'Uranu', 'Urana', 'Uranom', 'Uranu') },
    neptune: { rod: 'm', ...p('Neptuna', 'Neptunu', 'Neptuna', 'Neptunom', 'Neptunu') },
    pluto:   { rod: 'm', ...p('Plutona', 'Plutonu', 'Plutona', 'Plutonom', 'Plutonu') },
  },
  padeziAspekta: {
    conjunction: p('konjunkcije', 'konjunkciji', 'konjunkciju', 'konjunkcijom', 'konjunkciji'),
    sextile:     p('sekstila', 'sekstilu', 'sekstil', 'sekstilom', 'sekstilu'),
    square:      p('kvadrata', 'kvadratu', 'kvadrat', 'kvadratom', 'kvadratu'),
    trine:       p('trigona', 'trigonu', 'trigon', 'trigonom', 'trigonu'),
    opposition:  p('opozicije', 'opoziciji', 'opoziciju', 'opozicijom', 'opoziciji'),
  },
  znaci,
  /** "u Lavu" — gdje je nesto. */
  uZnaku: (k) => `u ${znaci[k].lokativ}`,
  /** "u Lava" — kamo ide. */
  uZnak: (k) => `u ${znaci[k].akuzativ}`,
  fazeMeseca: [
    'Mlad Mjesec', 'Mladi srp', 'Prva četvrt', 'Rastući Mjesec',
    'Pun Mjesec', 'Opadajući Mjesec', 'Posljednja četvrt', 'Stari srp',
  ],
};
