import type { Recnik } from '../sr';

/**
 * Makedonski uz broj: jednina za 1, 21, 31… (osim 11), inace broj-oblik / mnozina
 * ("1 ден", "2 дена", "5 дена"; "1 месец", "3 месеци").
 */
export function mnozina(n: number, jedan: string, vise: string): string {
  const d = Math.abs(n) % 10;
  const s = Math.abs(n) % 100;
  return d === 1 && s !== 11 ? jedan : vise;
}

export const gramatika: Recnik['gramatika'] = {
  dana: (n) => `${n} ${mnozina(n, 'ден', 'дена')}`,
  meseci: (n) => `${n} ${mnozina(n, 'месец', 'месеци')}`,
  tranzita: (n) => mnozina(n, 'транзит', 'транзити'),
  veliko: (x) => x.charAt(0).toLocaleUpperCase('mk') + x.slice(1),
  locale: 'mk-MK',
};
