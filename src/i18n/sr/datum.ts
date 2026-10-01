/**
 * DATUM JE SVUDA ISTOG OBLIKA (Ivan, 29.9.2026): "Uto, 29. sep 2026" — skracen dan, broj
 * sa tackom, skracen mesec malim slovima, godina bez tacke. Drugi jezik menja ceo `oblik`
 * (engleski: "Tue, Sep 29, 2026"), ne samo imena.
 */
const DANI_KRATKO = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub'];
const MESECI_KRATKO = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];

export const datum = {
  /** Nedelja je 0, kao `getDay()`. */
  daniKratko: DANI_KRATKO,
  mesecKratko: MESECI_KRATKO,
  /** `dan` = indeks dana u nedelji ili null (bez dana), `godina` = null (bez godine). */
  oblik: ({ dan, broj, mesec, godina }: { dan: number | null; broj: number; mesec: number; godina: number | null }) => {
    const s = `${broj}. ${MESECI_KRATKO[mesec]}${godina !== null ? ` ${godina}` : ''}`;
    if (dan === null) return s;
    const d = DANI_KRATKO[dan];
    return `${d.charAt(0).toUpperCase() + d.slice(1)}, ${s}`;
  },
  /** "13. sep – 26. sep" */
  opseg: (od: string, do_: string) => `${od} – ${do_}`,
  /** "do 14. nov" */
  doDana: (d: string) => `do ${d}`,
  josGodinama: 'još godinama',
  /** Trajanje: 0 -> poslednji dan, null -> iza horizonta. */
  trajeGodinama: 'Traje godinama',
  poslednjiDan: 'Poslednji dan',
  trajeJos: (koliko: string) => `Traje još ${koliko}`,
};
