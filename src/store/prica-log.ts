/**
 * Dnevnik dnevne price: koji dan je prica POGLEDANA (korisnik je stigao do poslednje slike).
 *
 * Od toga zavisi ulaz na pocetnoj (`components/prica/ulaz.tsx`): dok prica nije
 * pogledana, prsten se puni i balon iskace svaki put kad se pocetna otvori; posle
 * stoje mirno do sutra (Ivan, 30.9.2026).
 *
 * PRIPADA NALOGU, kao `tvoj-dan-log.ts`: nosi `userId`, tudji se cita kao prazan,
 * pri odjavi se brise (`store/auth.ts`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { daysBetween } from '@/lib/transits';

/** Stariji dani ne trebaju — ulaz gleda samo danas. */
const KEEP_DAYS = 7;

type State = {
  userId: string | null;
  /** dan (`dayKey`) -> pogledana */
  pogledano: Record<string, true>;
  oznaci: (userId: string, day: string) => void;
  clear: () => void;
};

export const usePricaLog = create<State>()(
  persist(
    (set, get) => ({
      userId: null,
      pogledano: {},
      oznaci: (userId, day) => {
        const prev = get().userId === userId ? get().pogledano : {};
        if (prev[day]) return;
        const today = new Date();
        const next: Record<string, true> = {};
        for (const d of Object.keys(prev)) if (daysBetween(d, today) <= KEEP_DAYS) next[d] = true;
        next[day] = true;
        set({ userId, pogledano: next });
      },
      clear: () => set({ userId: null, pogledano: {} }),
    }),
    {
      name: 'astroshop-prica-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId, pogledano: s.pogledano }) as any,
    }
  )
);

/** Da li je prica za `day` pogledana na ovom nalogu. */
export function usePricaPogledana(userId: string | null, day: string): boolean {
  return usePricaLog((s) => !!userId && s.userId === userId && !!s.pogledano[day]);
}
