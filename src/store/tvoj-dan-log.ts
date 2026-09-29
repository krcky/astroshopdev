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
 *
 * PRIPADA NALOGU (29.9.2026): do tada je bio dnevnik telefona, pa je drugi nalog
 * na istom telefonu nasledjivao tudje pauze i dobijao drugi tranzit za istu kartu
 * (Ivan). Dnevnik tudjeg naloga (i stari, bez `userId`) se cita kao prazan i
 * zamenjuje pri prvom upisu; pri odjavi se brise (`store/auth.ts`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { daysBetween } from '@/lib/transits';
import type { TvojDanLog } from '@/lib/tvoj-dan';

/** Duze od Hero dnevnika: broj prikaza odlucuje koja stavka ide sledeca. */
const KEEP_DAYS = 120;

const PRAZAN: TvojDanLog = {};

type State = {
  /** Nalog kome dnevnik pripada. */
  userId: string | null;
  shown: TvojDanLog;
  /** Upis prvog prikaza dana. Dan koji vec ima upis se ne menja. */
  record: (userId: string, day: string, contentKey: string) => void;
  clear: () => void;
};

export const useTvojDanLog = create<State>()(
  persist(
    (set, get) => ({
      userId: null,
      shown: {},
      record: (userId, day, contentKey) => {
        const prev = get().userId === userId ? get().shown : PRAZAN;
        if (prev[day]) return;
        const today = new Date();
        const next: TvojDanLog = {};
        for (const [d, k] of Object.entries(prev)) {
          if (daysBetween(d, today) <= KEEP_DAYS) next[d] = k;
        }
        next[day] = contentKey;
        set({ userId, shown: next });
      },
      clear: () => set({ userId: null, shown: {} }),
    }),
    {
      name: 'astroshop-tvoj-dan-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId, shown: s.shown }) as any,
    }
  )
);

/** Dnevnik naloga `userId`; tudji ili bez naloga — prazan. */
export const tvojDanShownFor = (userId: string | null) => (s: State): TvojDanLog =>
  userId && s.userId === userId ? s.shown : PRAZAN;
