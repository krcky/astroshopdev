import type { Recnik } from '../sr';

/** Točak života na početnoj i list oblasti. Isti oblik kao `sr/krug.ts`. */
export const krug: Recnik['krug'] = {
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
  stanja: { pritisak: 'Zahtjevno', oprez: 'Oprezno', mirno: 'Uravnoteženo', raste: 'Povoljno', procvat: 'Sjajno' },
  danas: 'Danas',
  nedelja: 'Ove sedmice',
  saznajVise: 'Saznaj više',
  nemaUticaja: 'Danas nema jakog uticaja na ovu oblast.',
  zakljucanaRecenica: 'Rečenica za danas je uz Premium.',
  stavkeNaslov: 'Šta utiče',
  josTranzita: (n, tranzita) => `još ${n} ${tranzita} u ovoj oblasti`,
  sedamDana: 'Narednih 7 dana',
  linijaNeutralno: 'Linija je neutralan dan (3).',
  zakljucanList: 'Detalji ove oblasti su uz Premium. Stanje i današnja jačina su otvoreni.',
  zakljucanoUPremium: 'Sutra, narednih 7 dana i cijeli tranzit su uz Premium.',
  oblastA11y: (oblast, stanje, ocena) => `${oblast}, ${stanje}, ${ocena} od 5`,
  oblastZakljucanaA11y: (oblast, stanje) => `${oblast}, ${stanje}, detalji uz Premium`,
  znakSunca: (znak) => `Znak Sunca: ${znak}`,
  podznak: (znak) => `Podznak: ${znak}`,
};
