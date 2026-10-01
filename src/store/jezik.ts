/**
 * Izabran jezik aplikacije (pravilo 26) — na disku, pripada TELEFONU, ne nalogu (kao i
 * sistemski jezik). Bez izbora je srpski: publika je srpska, a mnogi u Srbiji drze telefon
 * na engleskom — jezik telefona zato NE bira jezik aplikacije.
 *
 * Tekuci jezik drzi `i18n/jezik.ts`; ovaj store ga samo pamti i postavi pri pokretanju.
 * Uvod ceka `hydrated` (`_layout.tsx`), da prvi kadar ne bude na pogresnom jeziku.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { imaRecnik, postaviJezik, type Jezik } from '@/i18n/jezik';

type JezikState = {
  /** null = nije birano (srpski). */
  izabran: Jezik | null;
  hydrated: boolean;
  izaberi: (j: Jezik) => void;
};

const primeni = (j: Jezik | null) => postaviJezik(j && imaRecnik(j) ? j : 'sr');

export const useJezikStore = create<JezikState>()(
  persist(
    (set) => ({
      izabran: null,
      hydrated: false,
      izaberi: (izabran) => {
        set({ izabran });
        primeni(izabran);
      },
    }),
    {
      name: 'astroshop-jezik',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ izabran: s.izabran }),
      onRehydrateStorage: () => (s) => {
        primeni(s?.izabran ?? null);
        useJezikStore.setState({ hydrated: true });
      },
    }
  )
);
