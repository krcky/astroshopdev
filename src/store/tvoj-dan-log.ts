/**
 * Dnevnik kartice "Tvoj dan": dan -> prikazan tranzit (`lib/tvoj-dan.ts`).
 *
 * Odvojen od `hero-log.ts` (stari Hero besplatnih korisnika) da se dva izbora
 * ne mesaju — isti korisnik moze da predje sa besplatnog na Premium i nazad.
 * Iz njega se dobija i poslednji prikaz (odmor 3/7 dana) i broj prikaza
 * (rotacija stavki: Efekat, Pazi, Savet).
 *
 * Zivi LOKALNO, u AsyncStorage-u, kao i `hero-log.ts`: telefon i web mogu
 * istog dana da pokazu razlicit tranzit. Ako zasmeta, ide u bazu, oblik ostaje.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { daysBetween } from '@/lib/transits';
import type { TvojDanLog } from '@/lib/tvoj-dan';

/** Duze od Hero dnevnika: broj prikaza odlucuje koja stavka ide sledeca. */
const KEEP_DAYS = 120;

type State = {
  shown: TvojDanLog;
  /** Upis prvog prikaza dana. Dan koji vec ima upis se ne menja. */
  record: (day: string, contentKey: string) => void;
};

export const useTvojDanLog = create<State>()(
  persist(
    (set, get) => ({
      shown: {},
      record: (day, contentKey) => {
        const prev = get().shown;
        if (prev[day]) return;
        const today = new Date();
        const next: TvojDanLog = {};
        for (const [d, k] of Object.entries(prev)) {
          if (daysBetween(d, today) <= KEEP_DAYS) next[d] = k;
        }
        next[day] = contentKey;
        set({ shown: next });
      },
    }),
    {
      name: 'astroshop-tvoj-dan-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ shown: s.shown }) as any,
    }
  )
);
