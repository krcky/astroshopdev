/**
 * Widget "Nebo sada" i sat (iOS, Android): aplikacija im javlja MESTO posmatranja.
 *
 * Widget racuna nebo sam, u Swift-u odnosno Kotlin-u (pravilo 27, isti racun kao `lib/`),
 * ali za kuce i ascendent mora da zna mesto — ono sa taba "Nebo"
 * (`useMestoNeba`: izabran grad, inace grad iz profila). Bez mesta crta krug bez
 * kuca, sa 0° Ovna levo, kao tocak bez vremena rodjenja.
 *
 * Modul postoji samo u sopstvenom buildu; u Expo Go-u ovo ne radi nista.
 */
import * as React from 'react';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { useMestoNeba, useSkyPlaceStore } from '@/store/sky-place';

type Modul = {
  postaviMesto(latitude: number | null, longitude: number | null): void;
  /** Nema ih u buildu starijem od 13.10.2026 — zato se zovu sa `?.`. */
  brojWidgeta?: () => Promise<number>;
  /** Samo Android. */
  dodajNaEkran?: () => Promise<boolean>;
};

const modul = requireOptionalNativeModule<Modul>('NeboWidget');

/**
 * Widget postoji samo u sopstvenom buildu. U razvoju (Expo Go) se poziv na tabu "Nebo"
 * ipak vidi, da moze da se pregleda — dugme tada samo otvara uputstvo.
 */
export const IMA_WIDGET = !!modul || __DEV__;

/** Koliko widgeta korisnik vec ima; 0 i kad se ne zna. */
export async function brojWidgeta(): Promise<number> {
  try { return (await modul?.brojWidgeta?.()) ?? 0; } catch { return 0; }
}

/** Android: sistemski dijalog za dodavanje. `false` = nije otvoren, treba pokazati uputstvo. */
export async function dodajWidgetNaEkran(): Promise<boolean> {
  try { return (await modul?.dodajNaEkran?.()) ?? false; } catch { return false; }
}

/** U korenu aplikacije: drzi mesto widgeta jednakim mestu na tabu "Nebo"; pri odjavi ga brise. */
export function useNeboWidget(): void {
  const prijavljen = useAuthStore((s) => !!s.user);
  // Dok se sesija i sacuvani podaci ne ucitaju, mesto izgleda kao da ga nema —
  // upis bi ga tada obrisao widgetu pri svakom pokretanju.
  // Svaki hook u SVOJOJ liniji: spojeni sa `&&` se preskacu kad prvi vrati false, pa React obori aplikaciju.
  const sesija = useAuthStore((s) => !s.loading);
  const profil = useProfileStore((s) => s.hydrated);
  const mestoUcitano = useSkyPlaceStore((s) => s.hydrated);
  const spremno = sesija && profil && mestoUcitano;
  const mesto = useMestoNeba();
  const latitude = prijavljen ? mesto?.latitude ?? null : null;
  const longitude = prijavljen ? mesto?.longitude ?? null : null;

  React.useEffect(() => {
    if (spremno) modul?.postaviMesto(latitude, longitude);
  }, [spremno, latitude, longitude]);
}
