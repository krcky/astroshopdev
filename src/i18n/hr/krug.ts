import type { Recnik } from '../sr';

/** Kotač života na početnoj i list područja. Isti oblik kao `sr/krug.ts`. */
export const krug: Recnik['krug'] = {
  naslov: 'Tvoj život danas',
  /** Naslov kad je izabran drugi dan ("danas" ne stoji uz datum sutra). */
  naslovDrugiDan: 'Tvoj život',
  oblasti: {
    karijera: 'Karijera',
    finansije: 'Financije',
    zdravlje: 'Zdravlje',
    porodica: 'Obitelj',
    partner: 'Partner',
    licni_razvoj: 'Osobni razvoj',
    zabava: 'Zabava',
    prijateljstvo: 'Prijateljstvo',
  },
  stanja: { pritisak: 'Zahtjevno', oprez: 'Oprezno', mirno: 'Uravnoteženo', raste: 'Povoljno', procvat: 'Sjajno' },
  danas: 'Danas',
  nedelja: 'Ovaj tjedan',
  saznajVise: 'Saznaj više',
  nemaUticaja: 'Danas nema jakog utjecaja na ovo područje.',
  zakljucanaRecenica: 'Rečenica za danas je uz Premium.',
  stavkeNaslov: 'Što utječe',
  josTranzita: (n, tranzita) => `još ${n} ${tranzita} u ovom području`,
  sedamDana: 'Sljedećih 7 dana',
  linijaNeutralno: 'Crta je neutralan dan (3).',
  zakljucanList: 'Detalji ovog područja su uz Premium. Stanje i današnja jačina su otvoreni.',
  zakljucanoUPremium: 'Sutra, sljedećih 7 dana i cijeli tranzit su uz Premium.',
  oblastA11y: (oblast, stanje, ocena) => `${oblast}, ${stanje}, ${ocena} od 5`,
  oblastZakljucanaA11y: (oblast, stanje) => `${oblast}, ${stanje}, detalji uz Premium`,
  /** Promena ocene u odnosu na prethodni dan (strelica na kartici oblasti; cita ga citac ekrana). */
  odJuce: { gore: 'poraslo u odnosu na jučer', dole: 'palo u odnosu na jučer' },
  znakSunca: (znak) => `Znak Sunca: ${znak}`,
  podznak: (znak) => `Podznak: ${znak}`,
};
