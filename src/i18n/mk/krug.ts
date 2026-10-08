import type { Recnik } from '../sr';

/** Тркалото на животот на почетната и листот на областа. Ист облик како `sr/krug.ts`. */
export const krug: Recnik['krug'] = {
  naslov: 'Твојот живот денес',
  /** Naslov kad je izabran drugi dan ("danas" ne stoji uz datum sutra). */
  naslovDrugiDan: 'Твојот живот',
  oblasti: {
    karijera: 'Кариера',
    finansije: 'Финансии',
    zdravlje: 'Здравје',
    porodica: 'Семејство',
    partner: 'Партнер',
    licni_razvoj: 'Личен развој',
    zabava: 'Забава',
    prijateljstvo: 'Пријателство',
  },
  stanja: { pritisak: 'Притисок', oprez: 'Претпазливост', mirno: 'Мирно', raste: 'Расте', procvat: 'Процут' },
  danas: 'Денес',
  nedelja: 'Оваа недела',
  saznajVise: 'Дознај повеќе',
  nemaUticaja: 'Денес нема силно влијание врз оваа област.',
  zakljucanaRecenica: 'Реченицата за денес е со Premium.',
  stavkeNaslov: 'Што влијае',
  josTranzita: (n, tranzita) => `уште ${n} ${tranzita} во оваа област`,
  sedamDana: 'Следните 7 дена',
  linijaNeutralno: 'Линијата е неутрален ден (3).',
  zakljucanList: 'Деталите за оваа област се со Premium. Состојбата и денешната јачина се отворени.',
  zakljucanoUPremium: 'Утре, следните 7 дена и целиот транзит се со Premium.',
  oblastA11y: (oblast, stanje, ocena) => `${oblast}, ${stanje}, ${ocena} од 5`,
  oblastZakljucanaA11y: (oblast, stanje) => `${oblast}, ${stanje}, деталите се со Premium`,
  znakSunca: (znak) => `Знак на Сонцето: ${znak}`,
  podznak: (znak) => `Подзнак: ${znak}`,
};
