import type { Recnik } from '../sr';

/**
 * Datum istog oblika kao srpski, ali sa tackom posle godine (pravopis): "Uto, 29. sep 2026."
 * Verzali ("TVOJ DAN · …") dolaze iz stila `oznaka`.
 */
const DANI_KRATKO = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
const MESECI_KRATKO = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export const datum: Recnik['datum'] = {
  daniKratko: DANI_KRATKO,
  mesecKratko: MESECI_KRATKO,
  oblik: ({ dan, broj, mesec, godina }) => {
    const s = `${broj}. ${MESECI_KRATKO[mesec]}${godina !== null ? ` ${godina}.` : ''}`;
    if (dan === null) return s;
    const d = DANI_KRATKO[dan];
    return `${d.charAt(0).toUpperCase() + d.slice(1)}, ${s}`;
  },
  opseg: (od, do_) => `${od} – ${do_}`,
  doDana: (d) => `do ${d}`,
  josGodinama: 'još godinama',
  trajeGodinama: 'Traje godinama',
  poslednjiDan: 'Posljednji dan',
  trajeJos: (koliko) => `Traje još ${koliko}`,
  /** Sat u danu: 24 sata, "14:05". */
  sat: (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
};
