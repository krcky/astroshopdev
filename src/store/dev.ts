/**
 * Alati samo za razvoj — ekrani `/dev-*`. `__DEV__` je false u release bildu,
 * pa ih tamo nema.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEV_TOOLS_ENABLED = __DEV__;

/**
 * PROBNI BUILD: razvoj (`__DEV__`) ili build sa `EXPO_PUBLIC_PROBNE_CENE=1` — lokalni
 * `.env` za build iz Xcode-a (Release, pa `__DEV__` nije true) i EAS profili
 * `development` / `preview`. Isti uslov kao probne cene u `lib/kupovina.ts`. Build za
 * prodavnicu (`production`) ga nema, pa tamo test prekidaca nema.
 */
export const PROBNI_BUILD = __DEV__ || process.env.EXPO_PUBLIC_PROBNE_CENE === '1';

/**
 * TEST PREKIDAC Placen / Besplatan u profilu (vracen 30.9.2026, Ivan: "samo za test";
 * uklonjen 29.9.2026, "ne treba mi"). null = pravo stanje sa servera.
 *
 * Menja SAMO ono sto aplikacija prikazuje (`useEntitlement`). Duge tekstove i dalje
 * salje samo server (pravilo 8): "Placen" na besplatnom nalogu otkljuca ekrane, ali
 * duge verzije ne stignu. Kes tekstova se vodi po PRAVOM stanju, ne po prekidacu.
 * U buildu za prodavnicu se vrednost sa diska ignorise (`PROBNI_BUILD`).
 */
/** `productId` prava pristupa dok je prekidac na "Placen" — profil po njemu zna da nije kupovina. */
export const PREKIDAC_PRODUCT_ID = 'test.prekidac';

type DevState = {
  premiumRucno: boolean | null;
  setPremiumRucno: (v: boolean | null) => void;
};

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      premiumRucno: null,
      setPremiumRucno: (premiumRucno) => set({ premiumRucno }),
    }),
    {
      name: 'astroshop-dev',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ premiumRucno: s.premiumRucno }),
    }
  )
);
