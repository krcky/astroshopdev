import type { Recnik } from '../sr';

/** English plural: one form for 1, one for everything else. */
export const mnozina = (n: number, jedan: string, vise: string) => (Math.abs(n) === 1 ? jedan : vise);

export const gramatika: Recnik['gramatika'] = {
  dana: (n) => `${n} ${mnozina(n, 'day', 'days')}`,
  meseci: (n) => `${n} ${mnozina(n, 'month', 'months')}`,
  tranzita: (n) => mnozina(n, 'transit', 'transits'),
  veliko: (x) => x.charAt(0).toLocaleUpperCase('en') + x.slice(1),
  locale: 'en',
};
