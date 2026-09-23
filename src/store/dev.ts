/**
 * Prekidaci samo za razvoj.
 *
 * Postoje da bi se oba stanja paywall-a videla bez prave kupovine. Ne ulaze u
 * produkciju: __DEV__ je false u release bildu, pa `DEV_TOOLS_ENABLED` gasi i
 * prikaz prekidaca i primenu override-a. Cak i da vrednost ostane u
 * AsyncStorage-u posle razvoja, u release-u se ignorise.
 *
 * Override menja SAMO ono sto aplikacija prikazuje. Pravi paywall je u bazi
 * (RLS politika nad `transit_texts`), pa ukljucen prekidac ne donosi duge
 * tekstove sa servera — vidi [[transit-texts]] komentar u lib/transit-texts.ts.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEV_TOOLS_ENABLED = __DEV__;

/** null = ne diraj, koristi pravo stanje sa servera. */
export type EntitlementOverride = boolean | null;

type DevState = {
  entitlementOverride: EntitlementOverride;
  setEntitlementOverride: (v: EntitlementOverride) => void;
};

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      entitlementOverride: null,
      setEntitlementOverride: (entitlementOverride) => set({ entitlementOverride }),
    }),
    {
      name: 'astroshop-dev',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entitlementOverride: s.entitlementOverride }) as any,
    }
  )
);
