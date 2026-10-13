/**
 * Dnevnik "novog" na tabovima pocetne (`lib/novo.ts`): sta je bilo na tabu Mesec / Promene / Teme kad ga je
 * korisnik poslednji put otvorio. Od toga zavisi ljubicasti kruzic sa brojem na dugmetu taba.
 *
 * PRIPADA NALOGU, kao `prica-log.ts`: nosi `userId`, tudji se cita kao prazan, pri odjavi se brise (`store/auth.ts`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { istiKljucevi, type NovoTab } from '@/lib/novo';

type Vidjeno = Partial<Record<NovoTab, string[]>>;

type State = {
  userId: string | null;
  vidjeno: Vidjeno;
  /** Dnevnik je ucitan sa diska — pre toga "nema dnevnika" ne znaci da ga zaista nema. */
  hydrated: boolean;
  oznaci: (userId: string, tab: NovoTab, kljucevi: readonly string[]) => void;
  clear: () => void;
};

export const useNovoLog = create<State>()(
  persist(
    (set, get) => ({
      userId: null,
      vidjeno: {},
      hydrated: false,
      oznaci: (userId, tab, kljucevi) => {
        const prev = get().userId === userId ? get().vidjeno : {};
        if (get().userId === userId && istiKljucevi(kljucevi, prev[tab])) return;
        set({ userId, vidjeno: { ...prev, [tab]: [...kljucevi] } });
      },
      clear: () => set({ userId: null, vidjeno: {} }),
    }),
    {
      name: 'astroshop-novo-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId, vidjeno: s.vidjeno }) as any,
      onRehydrateStorage: () => () => { useNovoLog.setState({ hydrated: true }); },
    }
  )
);

const PRAZNO: Vidjeno = {};

/** Sta je ovaj nalog vec video po tabovima; tudji dnevnik je prazan. */
export function useNovoVidjeno(userId: string | null): Vidjeno {
  return useNovoLog((s) => (userId && s.userId === userId ? s.vidjeno : PRAZNO));
}
