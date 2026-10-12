import type { Recnik } from '../sr';

/** Wheel of life on the home screen and the area sheet. Same shape as `sr/krug.ts`. */
export const krug: Recnik['krug'] = {
  naslov: 'Your life today',
  /** Naslov kad je izabran drugi dan ("danas" ne stoji uz datum sutra). */
  naslovDrugiDan: 'Your life',
  oblasti: {
    karijera: 'Career',
    finansije: 'Money',
    zdravlje: 'Health',
    porodica: 'Family',
    partner: 'Partner',
    licni_razvoj: 'Personal growth',
    zabava: 'Fun',
    prijateljstvo: 'Friends',
  },
  stanja: { pritisak: 'Demanding', oprez: 'Cautious', mirno: 'Balanced', raste: 'Favorable', procvat: 'Great' },
  danas: 'Today',
  nedelja: 'This week',
  saznajVise: 'Learn more',
  nemaUticaja: 'No strong influence on this area today.',
  zakljucanaRecenica: "Today's line is part of Premium.",
  stavkeNaslov: 'What affects it',
  josTranzita: (n, tranzita) => `${n} more ${tranzita} in this area`,
  sedamDana: 'Next 7 days',
  linijaNeutralno: 'The line is a neutral day (3).',
  zakljucanList: 'The details of this area are part of Premium. The state and today\'s strength are open.',
  zakljucanoUPremium: 'Tomorrow, the next 7 days and the full transit are part of Premium.',
  oblastA11y: (oblast, stanje, ocena) => `${oblast}, ${stanje}, ${ocena} of 5`,
  oblastZakljucanaA11y: (oblast, stanje) => `${oblast}, ${stanje}, details with Premium`,
  znakSunca: (znak) => `Sun sign: ${znak}`,
  podznak: (znak) => `Rising sign: ${znak}`,
};
