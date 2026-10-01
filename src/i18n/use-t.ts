import { useSyncExternalStore } from 'react';

import { jezik, pretplati, recnikZa, type Jezik, type Recnik } from './jezik';

/**
 * Recnik tekuceg jezika za komponentu: `const t = useT();` pa `t.profil.naslov`.
 * Komponenta se iscrta iznova kad se jezik promeni.
 */
export function useT(): Recnik {
  // Recnik IZVEDEN iz jezika, ne `tr()`: React Compiler pamti poziv bez React ulaza, pa bi
  // `tr()` posle promene jezika vracao stari recnik (Ivan, 2.10.2026 — prvi ekran ostao preveden).
  const j = useSyncExternalStore(pretplati, jezik, jezik);
  return recnikZa(j);
}

/** Tekuci jezik — za `key` korena, da se posle promene jezika sve sklopi iznova. */
export function useJezik(): Jezik {
  return useSyncExternalStore(pretplati, jezik, jezik);
}
