import { AppState, Platform } from 'react-native';
import { useLowPowerMode } from 'expo-battery';
import { create } from 'zustand';

/*
 * Da li korisnik trenutno radi nesto sa aplikacijom — za ukrasne pokrete koji
 * bi inace trosili bateriju (zivi preliv u `screen.tsx`).
 *
 * Ivan, 28.9.2026 ("da li animacija gradijenta trosi bateriju"): dok se nesto
 * pomera, telefon crta svaki kadar (60/120 Hz) i ekran nikad ne spusti
 * osvezavanje. Zato pokret staje posle `MIROVANJE_MS` bez dodira i krece
 * ponovo na prvi dodir, promenu taba ili povratak u aplikaciju.
 *
 * Dodir hvata korenski `View` u `_layout.tsx` (`onStartShouldSetResponderCapture`,
 * vraca `false` — nista ne otima). Promenu taba (nativna traka, mimo JS dodira)
 * javlja fokus ekrana.
 */

/** Koliko posle poslednjeg dodira ukras jos tece. */
export const MIROVANJE_MS = 20_000;

export const useBudnost = create<{ budan: boolean }>(() => ({ budan: true }));

let tajmer: ReturnType<typeof setTimeout> | null = null;

/** Korisnik je nesto uradio — produzi budnost. Jeftino, zove se na svaki dodir. */
export function probudi() {
  if (tajmer) clearTimeout(tajmer);
  tajmer = setTimeout(() => useBudnost.setState({ budan: false }), MIROVANJE_MS);
  if (!useBudnost.getState().budan) useBudnost.setState({ budan: true });
}

probudi();
AppState.addEventListener('change', (s) => { if (s === 'active') probudi(); });

/**
 * Low Power Mode (iOS) / usteda baterije (Android): tada ukrasa nema uopste.
 * Na vebu `expo-battery` ne zna stanje — uvek `false`.
 */
export const useUstedaBaterije: () => boolean = Platform.OS === 'web' ? () => false : useLowPowerMode;
