/**
 * Odakle se gleda nebo na ekranu "Trenutno na nebu".
 *
 * ODVOJENO OD PROFILA, namerno. Grad rodjenja je podatak od kog zavisi natalna
 * karta i ne sme da se pomeri zato sto je korisnik hteo da vidi kako nebo
 * izgleda iz Njujorka. Zato zaseban store i zaseban kljuc u AsyncStorage-u —
 * `store/profile.ts` ovo ne vidi i ne dira.
 *
 * `null` znaci "grad iz profila". Ne prepisujemo ga vrednoscu pri prvom
 * pokretanju: ako korisnik kasnije promeni mesto rodjenja kroz `/edit`, treba
 * da se pomeri i ovaj ekran — a to radi samo ako je izbor prazan.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { City } from '@/lib/cities';

type SkyPlaceState = {
  /** Izabrano mesto posmatranja, ili null za grad iz profila. */
  city: City | null;
  /** true kad je AsyncStorage procitan — do tada ne znamo da li izbor postoji. */
  hydrated: boolean;
  setCity: (c: City | null) => void;
};

export const useSkyPlaceStore = create<SkyPlaceState>()(
  persist(
    (set) => ({
      city: null,
      hydrated: false,
      setCity: (city) => set({ city }),
    }),
    {
      name: 'astroshop-sky-place',
      storage: createJSONStorage(() => AsyncStorage),
      // Ceo grad, ne samo ID: gradovi iz dijaspore dolaze sa servera i nisu u
      // ugradjenoj listi, pa bez koordinata ekran ne bi radio bez mreze.
      partialize: (s) => ({ city: s.city }) as any,
      onRehydrateStorage: () => () => {
        useSkyPlaceStore.setState({ hydrated: true });
      },
    }
  )
);
