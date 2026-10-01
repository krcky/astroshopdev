import { mnozina } from '../sr/gramatika';
import type { Recnik } from '../sr';

/** Mnozina je ista kao u srpskom (tri oblika uz broj); reci su ijekavske. */
export { mnozina };

export const gramatika: Recnik['gramatika'] = {
  dana: (n) => `${n} ${mnozina(n, ['dan', 'dana', 'dana'])}`,
  meseci: (n) => `${n} ${mnozina(n, ['mjesec', 'mjeseca', 'mjeseci'])}`,
  tranzita: (n) => mnozina(n, ['tranzit', 'tranzita', 'tranzita']),
  veliko: (x) => x.charAt(0).toLocaleUpperCase('hr') + x.slice(1),
  locale: 'hr-HR',
};
