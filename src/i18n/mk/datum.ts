import type { Recnik } from '../sr';

/** "Вто, 29 сеп 2026" — makedonski bez tacke posle dana. */
const DANI_KRATKO = ['нед', 'пон', 'вто', 'сре', 'чет', 'пет', 'саб'];
const MESECI_KRATKO = ['јан', 'фев', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'ное', 'дек'];

export const datum: Recnik['datum'] = {
  daniKratko: DANI_KRATKO,
  mesecKratko: MESECI_KRATKO,
  oblik: ({ dan, broj, mesec, godina }) => {
    const s = `${broj} ${MESECI_KRATKO[mesec]}${godina !== null ? ` ${godina}` : ''}`;
    if (dan === null) return s;
    const d = DANI_KRATKO[dan];
    return `${d.charAt(0).toUpperCase() + d.slice(1)}, ${s}`;
  },
  opseg: (od, do_) => `${od} – ${do_}`,
  doDana: (d) => `до ${d}`,
  josGodinama: 'уште со години',
  trajeGodinama: 'Трае со години',
  poslednjiDan: 'Последен ден',
  trajeJos: (koliko) => `Трае уште ${koliko}`,
};
