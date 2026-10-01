import type { Recnik } from '../sr';

/**
 * Imena teles, tock, aspektov, znamenj in lunin men — glej `sr/nebo.ts`. Kljuci se ne prevajajo.
 * Skloni: genitiv = rodilnik, dativ = dajalnik, akuzativ = tozilnik, instrumental = orodnik,
 * lokativ = mestnik. "Mesec" (planet) je v slovenscini LUNA (zenski spol). `rod` izbira "tvojim / tvojo".
 */
type Padezi = { genitiv: string; dativ: string; akuzativ: string; instrumental: string; lokativ: string };
const p = (genitiv: string, dativ: string, akuzativ: string, instrumental: string, lokativ: string): Padezi =>
  ({ genitiv, dativ, akuzativ, instrumental, lokativ });

/** Znamenje: ime, tozilnik ("gre v Leva"), mestnik ("v Levu"). Dvojcka in Ribi sta v dvojini. */
const znaci: Recnik['nebo']['znaci'] = {
  aries:       { ime: 'Oven',      akuzativ: 'Ovna',      lokativ: 'Ovnu' },
  taurus:      { ime: 'Bik',       akuzativ: 'Bika',      lokativ: 'Biku' },
  gemini:      { ime: 'Dvojčka',   akuzativ: 'Dvojčka',   lokativ: 'Dvojčkih' },
  cancer:      { ime: 'Rak',       akuzativ: 'Raka',      lokativ: 'Raku' },
  leo:         { ime: 'Lev',       akuzativ: 'Leva',      lokativ: 'Levu' },
  virgo:       { ime: 'Devica',    akuzativ: 'Devico',    lokativ: 'Devici' },
  libra:       { ime: 'Tehtnica',  akuzativ: 'Tehtnico',  lokativ: 'Tehtnici' },
  scorpio:     { ime: 'Škorpijon', akuzativ: 'Škorpijona', lokativ: 'Škorpijonu' },
  sagittarius: { ime: 'Strelec',   akuzativ: 'Strelca',   lokativ: 'Strelcu' },
  capricorn:   { ime: 'Kozorog',   akuzativ: 'Kozoroga',  lokativ: 'Kozorogu' },
  aquarius:    { ime: 'Vodnar',    akuzativ: 'Vodnarja',  lokativ: 'Vodnarju' },
  pisces:      { ime: 'Ribi',      akuzativ: 'Ribi',      lokativ: 'Ribah' },
};

export const nebo: Recnik['nebo'] = {
  tela: {
    sun: 'Sonce', moon: 'Luna', mercury: 'Merkur', venus: 'Venera', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uran', neptune: 'Neptun', pluto: 'Pluton',
  },
  tacke: { northNode: 'Severno vozlišče', lilith: 'Lilit', fortune: 'Točka sreče' },
  aspekti: { conjunction: 'konjunkcija', sextile: 'sekstil', square: 'kvadrat', trine: 'trigon', opposition: 'opozicija' },
  padeziTela: {
    sun:     { rod: 's', ...p('Sonca', 'Soncu', 'Sonce', 'Soncem', 'Soncu') },
    moon:    { rod: 'z', ...p('Lune', 'Luni', 'Luno', 'Luno', 'Luni') },
    mercury: { rod: 'm', ...p('Merkurja', 'Merkurju', 'Merkur', 'Merkurjem', 'Merkurju') },
    venus:   { rod: 'z', ...p('Venere', 'Veneri', 'Venero', 'Venero', 'Veneri') },
    mars:    { rod: 'm', ...p('Marsa', 'Marsu', 'Mars', 'Marsom', 'Marsu') },
    jupiter: { rod: 'm', ...p('Jupitra', 'Jupitru', 'Jupiter', 'Jupitrom', 'Jupitru') },
    saturn:  { rod: 'm', ...p('Saturna', 'Saturnu', 'Saturn', 'Saturnom', 'Saturnu') },
    uranus:  { rod: 'm', ...p('Urana', 'Uranu', 'Uran', 'Uranom', 'Uranu') },
    neptune: { rod: 'm', ...p('Neptuna', 'Neptunu', 'Neptun', 'Neptunom', 'Neptunu') },
    pluto:   { rod: 'm', ...p('Plutona', 'Plutonu', 'Pluton', 'Plutonom', 'Plutonu') },
  },
  padeziAspekta: {
    conjunction: p('konjunkcije', 'konjunkciji', 'konjunkcijo', 'konjunkcijo', 'konjunkciji'),
    sextile:     p('sekstila', 'sekstilu', 'sekstil', 'sekstilom', 'sekstilu'),
    square:      p('kvadrata', 'kvadratu', 'kvadrat', 'kvadratom', 'kvadratu'),
    trine:       p('trigona', 'trigonu', 'trigon', 'trigonom', 'trigonu'),
    opposition:  p('opozicije', 'opoziciji', 'opozicijo', 'opozicijo', 'opoziciji'),
  },
  znaci,
  /** "v Levu" — kje je nekaj. */
  uZnaku: (k) => `v ${znaci[k].lokativ}`,
  /** "v Leva" — kam gre ("prestopi v Leva"). */
  uZnak: (k) => `v ${znaci[k].akuzativ}`,
  fazeMeseca: [
    'Mlaj', 'Naraščajoči srp', 'Prvi krajec', 'Naraščajoča Luna',
    'Polna Luna', 'Pojemajoča Luna', 'Zadnji krajec', 'Pojemajoči srp',
  ],
};
