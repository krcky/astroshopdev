/**
 * Dnevnik prikazanih Hero tranzita — za pauzu od 7 dana (`lib/transits.ts`).
 *
 * Zivi LOKALNO, u AsyncStorage-u. Posledica: telefon i web istog korisnika
 * mogu istog dana da pokazu razlicit Hero, jer svaki ima svoj dnevnik. Ako to
 * zasmeta, dnevnik ide u bazu (tabela po korisniku i danu) — oblik zapisa
 * `HeroHistory` ostaje isti, menja se samo gde stoji.
 *
 * Upisuje se pri prvom prikazu dana. Kljuc prikazan danas nikad nije na pauzi,
 * pa upis ne menja izbor koji korisnik vec gleda.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { daysBetween, type HeroHistory } from '@/lib/transits';

/** Posle ovoliko dana zapis vise nista ne znaci i brise se. */
const KEEP_DAYS = 30;

type HeroLogState = {
  shown: HeroHistory;
  /** Zabelezi da je tranzit prikazan tog dana (`dayKey`). Idempotentno za isti dan. */
  record: (contentKey: string, day: string) => void;
};

export const useHeroLog = create<HeroLogState>()(
  persist(
    (set, get) => ({
      shown: {},
      record: (contentKey, day) => {
        const prev = get().shown;
        if (prev[contentKey] === day) return;
        const today = new Date();
        const next: HeroHistory = {};
        for (const [k, d] of Object.entries(prev)) {
          if (daysBetween(d, today) <= KEEP_DAYS) next[k] = d;
        }
        next[contentKey] = day;
        set({ shown: next });
      },
    }),
    {
      name: 'astroshop-hero-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ shown: s.shown }) as any,
    }
  )
);
