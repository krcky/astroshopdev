import type { Recnik } from '../sr';

/**
 * Same date everywhere, English order: "Tue, Sep 29, 2026", "Sep 29", "Sep 29, 2026".
 * Uppercase labels ("YOUR DAY · TUE, SEP 29, 2026") come from the `oznaka` style, not the text.
 */
const DANI_KRATKO = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESECI_KRATKO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const datum: Recnik['datum'] = {
  daniKratko: DANI_KRATKO,
  mesecKratko: MESECI_KRATKO,
  oblik: ({ dan, broj, mesec, godina }) => {
    const s = `${MESECI_KRATKO[mesec]} ${broj}${godina !== null ? `, ${godina}` : ''}`;
    return dan === null ? s : `${DANI_KRATKO[dan]}, ${s}`;
  },
  opseg: (od, do_) => `${od} – ${do_}`,
  doDana: (d) => `until ${d}`,
  josGodinama: 'for years to come',
  trajeGodinama: 'Lasts for years',
  poslednjiDan: 'Last day',
  trajeJos: (koliko) => `${koliko} left`,
  /** 12-hour clock for English: "2:05 PM", "12:30 AM". */
  sat: (h, m) => `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`,
};
