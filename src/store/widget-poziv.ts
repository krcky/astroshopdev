/**
 * Poziv za widget na tabu "Nebo" (`lib/widget-poziv.ts`): koliko puta je tab posecen i da li je kartica sklonjena.
 *
 * PRIPADA TELEFONU, ne nalogu — widget je na ovom telefonu, pa se pri odjavi NE brise:
 * ko je karticu sklonio, ne treba da je vidi opet posle ponovne prijave.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type State = {
  posete: number;
  sklonjeno: boolean;
  /** Ucitano sa diska — pre toga se kartica ne pokazuje. */
  hydrated: boolean;
  poseta: () => void;
  skloni: () => void;
};

export const useWidgetPoziv = create<State>()(
  persist(
    (set, get) => ({
      posete: 0,
      sklonjeno: false,
      hydrated: false,
      poseta: () => set({ posete: get().posete + 1 }),
      skloni: () => set({ sklonjeno: true }),
    }),
    {
      name: 'astroshop-widget-poziv',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ posete: s.posete, sklonjeno: s.sklonjeno }) as any,
      onRehydrateStorage: () => () => { useWidgetPoziv.setState({ hydrated: true }); },
    }
  )
);
