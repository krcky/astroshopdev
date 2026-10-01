import { useSyncExternalStore } from 'react';

import { jezik, pretplati, tr, type Recnik } from './jezik';

/**
 * Recnik tekuceg jezika za komponentu: `const t = useT();` pa `t.profil.naslov`.
 * Komponenta se iscrta iznova kad se jezik promeni.
 */
export function useT(): Recnik {
  useSyncExternalStore(pretplati, jezik, jezik);
  return tr();
}
