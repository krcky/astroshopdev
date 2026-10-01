import type { Recnik } from '../sr';

/** English has no grammatical case: name, "akuzativ" and "lokativ" are the same word. */
const znak = (ime: string) => ({ ime, akuzativ: ime, lokativ: ime });

const znaci: Recnik['nebo']['znaci'] = {
  aries: znak('Aries'),
  taurus: znak('Taurus'),
  gemini: znak('Gemini'),
  cancer: znak('Cancer'),
  leo: znak('Leo'),
  virgo: znak('Virgo'),
  libra: znak('Libra'),
  scorpio: znak('Scorpio'),
  sagittarius: znak('Sagittarius'),
  capricorn: znak('Capricorn'),
  aquarius: znak('Aquarius'),
  pisces: znak('Pisces'),
};

export const nebo: Recnik['nebo'] = {
  tela: {
    sun: 'Sun',
    moon: 'Moon',
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
    uranus: 'Uranus',
    neptune: 'Neptune',
    pluto: 'Pluto',
  },
  tacke: {
    northNode: 'North Node',
    lilith: 'Lilith',
    fortune: 'Part of Fortune',
  },
  aspekti: {
    conjunction: 'conjunction',
    sextile: 'sextile',
    square: 'square',
    trine: 'trine',
    opposition: 'opposition',
  },
  znaci,
  /** "in Leo" — where something is. */
  uZnaku: (k) => `in ${znaci[k].ime}`,
  /** "into Leo" — direction ("moved into Leo"). */
  uZnak: (k) => `into ${znaci[k].ime}`,
  fazeMeseca: [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
  ],
};
