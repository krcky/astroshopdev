import type { Recnik } from '../sr';

/**
 * Slovenska mnozina uz broj ima CETIRI oblika (dvojina): 1 (101…) dan, 2 (102…) dneva,
 * 3—4 dnevi, 0 i 5+ dni. Odlucuje ostatak pri deljenju sa 100.
 */
export type Oblici = readonly [ednina: string, dvojina: string, mnozina34: string, mnozina5: string];

export function mnozina(n: number, [ednina, dvojina, tri, pet]: Oblici): string {
  const s = Math.abs(n) % 100;
  if (s === 1) return ednina;
  if (s === 2) return dvojina;
  if (s === 3 || s === 4) return tri;
  return pet;
}

export const gramatika: Recnik['gramatika'] = {
  // Trajanje je u TOZILNIKU (traja še 3 dni, preizkusi 3 dni), zato za 3—4: dni, mesece.
  dana: (n) => `${n} ${mnozina(n, ['dan', 'dneva', 'dni', 'dni'])}`,
  meseci: (n) => `${n} ${mnozina(n, ['mesec', 'meseca', 'mesece', 'mesecev'])}`,
  tranzita: (n) => mnozina(n, ['tranzit', 'tranzita', 'tranziti', 'tranzitov']),
  teksta: (n) => mnozina(n, ['besedilo', 'besedili', 'besedila', 'besedil']),
  veliko: (x) => x.charAt(0).toLocaleUpperCase('sl') + x.slice(1),
  locale: 'sl-SI',
};
