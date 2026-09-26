/**
 * Nijansa preliva koju je POSLEDNJI fokusirani ekran ostavio — odatle sledeci
 * ekran krece pretapanje u svoju nijansu (`ScreenBackdrop`). Nije trajno stanje,
 * samo prenos izmedju ekrana; zato bez persist-a.
 */
import { create } from 'zustand';

import type { BackdropTint } from '@/theme/tokens';

type BackdropState = {
  last: BackdropTint;
  setLast: (t: BackdropTint) => void;
};

export const useBackdropStore = create<BackdropState>()((set) => ({
  last: 'purple',
  setLast: (last) => set({ last }),
}));
