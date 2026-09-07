/**
 * Profil korisnika — podaci o rodjenju iz kojih se racuna natalna karta.
 *
 * Cuva se lokalno (AsyncStorage). Kad dodje Supabase, isti oblik se sinhronizuje
 * na server; lokalna kopija ostaje da app radi offline i da se karta ne racuna
 * ponovo pri svakom otvaranju.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { cityByName, type City } from '@/lib/cities';
import { localBirthToUtc } from '@/lib/timezone';
import { buildNatalChart, type NatalChart } from '@/lib/natal';

export type Profile = {
  name: string;
  birth: { year: number; month: number; day: number };
  /** null = korisnik ne zna tacno vreme rodjenja. */
  time: { hour: number; minute: number } | null;
  cityName: string;
};

type ProfileState = {
  profile: Profile | null;
  /** true kad je AsyncStorage ucitan — do tada ne znamo da li profil postoji. */
  hydrated: boolean;
  setProfile: (p: Profile) => void;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      hydrated: false,
      setProfile: (profile) => set({ profile }),
      clear: () => set({ profile: null }),
    }),
    {
      name: 'astroshop-profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile }) as any,
      onRehydrateStorage: () => (state) => {
        useProfileStore.setState({ hydrated: true });
      },
    }
  )
);

export type ResolvedProfile = {
  profile: Profile;
  city: City;
  /** Trenutak rodjenja u UTC. */
  utc: Date;
  chart: NatalChart;
  /**
   * true ako vreme rodjenja nije poznato — tada je uzeto podne, pa su
   * ASCENDENT i KUCE nepouzdani. Pozicije planeta ostaju upotrebljive
   * (osim Meseca, koji za 12 sati predje i do 7 stepeni).
   */
  timeUnknown: boolean;
};

/** Sklapa sve: profil -> grad -> UTC -> natalna karta. */
export function resolveProfile(profile: Profile | null): ResolvedProfile | null {
  if (!profile) return null;
  const city = cityByName(profile.cityName);
  if (!city) return null;

  const timeUnknown = profile.time === null;
  const t = profile.time ?? { hour: 12, minute: 0 };

  const utc = localBirthToUtc(
    profile.birth.year,
    profile.birth.month,
    profile.birth.day,
    t.hour,
    t.minute,
    city.tz
  );

  const chart = buildNatalChart(
    { date: utc, latitude: city.latitude, longitude: city.longitude },
    // Bez tacnog vremena Placidus nema smisla — Whole Sign je posteniji izbor.
    timeUnknown ? 'whole-sign' : 'placidus'
  );

  return { profile, city, utc, chart, timeUnknown };
}

/** Hook: razresen profil ili null ako korisnik jos nije prosao onboarding. */
export function useResolvedProfile(): ResolvedProfile | null {
  const profile = useProfileStore((s) => s.profile);
  return resolveProfile(profile);
}
