/**
 * Krug zivota na pocetnoj ("Tvoj život danas") i list oblasti: `components/krug-zivota.tsx`,
 * `components/oblast-kartica.tsx`, `app/oblast.tsx`, `lib/krug-config.ts`.
 */
export const krug = {
  naslov: 'Tvoj život danas',
  /** Naslov kad je izabran drugi dan ("danas" ne stoji uz datum sutra). */
  naslovDrugiDan: 'Tvoj život',
  oblasti: {
    karijera: 'Karijera',
    finansije: 'Finansije',
    zdravlje: 'Zdravlje',
    porodica: 'Porodica',
    partner: 'Partner',
    licni_razvoj: 'Lični razvoj',
    zabava: 'Zabava',
    prijateljstvo: 'Prijateljstvo',
  },
  /** Stanje oblasti iz proseka ocene za tri dana (`lib/krug.ts`). */
  stanja: { pritisak: 'Zahtevno', oprez: 'Oprezno', mirno: 'Uravnoteženo', raste: 'Povoljno', procvat: 'Sjajno' },
  danas: 'Danas',
  nedelja: 'Ove nedelje',
  saznajVise: 'Saznaj više',
  /** Oblast bez ijednog tranzita ili sa tekstom koji nije stigao. */
  nemaUticaja: 'Danas nema jakog uticaja na ovu oblast.',
  zakljucanaRecenica: 'Rečenica za danas je uz Premium.',
  stavkeNaslov: 'Šta utiče',
  josTranzita: (n: number, tranzita: string) => `još ${n} ${tranzita} u ovoj oblasti`,
  sedamDana: 'Narednih 7 dana',
  linijaNeutralno: 'Linija je neutralan dan (3).',
  zakljucanList: 'Detalji ove oblasti su uz Premium. Stanje i današnja jačina su otvoreni.',
  zakljucanoUPremium: 'Sutra, narednih 7 dana i ceo tranzit su uz Premium.',
  /** Citac ekrana: "Partner, Pritisak, 1 od 5". */
  oblastA11y: (oblast: string, stanje: string, ocena: number) => `${oblast}, ${stanje}, ${ocena} od 5`,
  oblastZakljucanaA11y: (oblast: string, stanje: string) => `${oblast}, ${stanje}, detalji uz Premium`,
  /** Promena ocene u odnosu na prethodni dan (strelica na kartici oblasti; cita ga citac ekrana). */
  odJuce: { gore: 'poraslo u odnosu na juče', dole: 'palo u odnosu na juče' },
  znakSunca: (znak: string) => `Znak Sunca: ${znak}`,
  podznak: (znak: string) => `Podznak: ${znak}`,
};
