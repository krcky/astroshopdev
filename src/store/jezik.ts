/**
 * Izabran jezik aplikacije (pravilo 26) — na disku, pripada TELEFONU, ne nalogu (kao i
 * sistemski jezik). BEZ RUCNOG IZBORA jezik se uzima iz telefona: spisak jezika pa REGION
 * (`i18n/jezik-uredjaja.ts`; Ivan, 2.10.2026) — srpski region sa engleskim telefonom daje srpski.
 * Taj izbor se NE pamti: dok korisnik ne izabere sam, racuna se pri svakom pokretanju.
 *
 * Tekuci jezik drzi `i18n/jezik.ts`; ovaj store ga samo pamti i postavi pri pokretanju.
 * Uvod ceka `hydrated` (`_layout.tsx`), da prvi kadar ne bude na pogresnom jeziku.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLocales } from 'expo-localization';
import { router } from 'expo-router';

import { imaRecnik, postaviJezik, type Jezik } from '@/i18n/jezik';
import { jezikTelefona } from '@/i18n/jezik-uredjaja';

type JezikState = {
  /** null = nije birano rucno (jezik po telefonu). */
  izabran: Jezik | null;
  hydrated: boolean;
  izaberi: (j: Jezik) => void;
};

/** Jezik po telefonu; ako `expo-localization` iz bilo kog razloga padne — srpski. */
function poTelefonu(): Jezik {
  try {
    return jezikTelefona(getLocales());
  } catch {
    return 'sr';
  }
}

const primeni = (j: Jezik | null) => {
  const izbor = j ?? poTelefonu();
  postaviJezik(imaRecnik(izbor) ? izbor : 'sr');
};

export const useJezikStore = create<JezikState>()(
  persist(
    (set) => ({
      izabran: null,
      hydrated: false,
      izaberi: (izabran) => {
        set({ izabran });
        primeni(izabran);
        // Navigacija se sklopi iznova (`key` u `_layout.tsx`); sama obnova je otvarala "Unesi kod"
        // bez nazad — zato odmah na KAPIJU, koja zna gde korisnik ide.
        setTimeout(() => router.replace('/'), 0);
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
