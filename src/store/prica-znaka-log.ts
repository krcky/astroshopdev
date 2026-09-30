/**
 * Da li je PRICA O ZNAKU pogledana (korisnik je stigao do poslednje slike) — pravilo 25.
 *
 * Od toga zavisi ulaz na tabu "Ti" (prsten oko Sunca u velikoj trojci): dok nije pogledana,
 * prsten se puni i balon "Tvoj znak" iskace svaki put kad se tab otvori; posle stoje mirno.
 * Pamti se ZNAK: kad se podaci o rodjenju promene i Sunce predje u drugi znak, prica je nova.
 *
 * PRIPADA NALOGU, kao `prica-log.ts`: nosi `userId`, tudji se cita kao prazan, pri odjavi se
 * brise (`store/auth.ts`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type State = {
  userId: string | null;
  /** Kljuc znaka (`SIGNS[].key`) cija je prica pogledana. */
  znak: string | null;
  oznaci: (userId: string, znak: string) => void;
  clear: () => void;
};

export const usePricaZnakaLog = create<State>()(
  persist(
    (set) => ({
      userId: null,
      znak: null,
      oznaci: (userId, znak) => set({ userId, znak }),
      clear: () => set({ userId: null, znak: null }),
    }),
    {
      name: 'astroshop-prica-znaka-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId, znak: s.znak }) as any,
    }
  )
);

/** Da li je prica o znaku `znak` pogledana na ovom nalogu. */
export function usePricaZnakaPogledana(userId: string | null, znak: string | null): boolean {
  return usePricaZnakaLog((s) => !!userId && !!znak && s.userId === userId && s.znak === znak);
}
