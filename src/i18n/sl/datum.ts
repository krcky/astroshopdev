import type { Recnik } from '../sr';

/** "Tor, 29. sep. 2026" — skrajsan mesec dobi piko (slovenski pravopis), leto brez pike. */
const DANI_KRATKO = ['ned', 'pon', 'tor', 'sre', 'čet', 'pet', 'sob'];
const MESECI_KRATKO = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'];

export const datum: Recnik['datum'] = {
  daniKratko: DANI_KRATKO,
  mesecKratko: MESECI_KRATKO,
  oblik: ({ dan, broj, mesec, godina }) => {
    const s = `${broj}. ${MESECI_KRATKO[mesec]}${godina !== null ? ` ${godina}` : ''}`;
    if (dan === null) return s;
    const d = DANI_KRATKO[dan];
    return `${d.charAt(0).toUpperCase() + d.slice(1)}, ${s}`;
  },
  opseg: (od, do_) => `${od} – ${do_}`,
  doDana: (d) => `do ${d}`,
  josGodinama: 'še leta',
  trajeGodinama: 'Traja več let',
  poslednjiDan: 'Zadnji dan',
  trajeJos: (koliko) => `Traja še ${koliko}`,
  /** Sat u danu: 24 sata, "14:05". */
  sat: (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
};
