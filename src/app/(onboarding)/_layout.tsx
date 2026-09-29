import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { STARI_IOS } from '@/lib/platform';

/**
 * Na iOS-u 26 koraci imaju NATIVE traku, providnu i bez naslova — samo zbog
 * dugmadi: strelica nazad / X i "Preskoči" su native stavke trake
 * (`OnboardingStep`), isto kao kalendar i profil na pocetnoj
 * (`(tabs)/home/_layout.tsx`). Tako su pravo sistemsko staklo, a ne `GlassView`
 * koji samo lici na njega (Ivan, 29.9.2026). Android i stariji iOS nemaju te
 * stavke — tamo `OnboardingStep` crta svoju dugmad, a traka ne postoji.
 */
const NATIVE_TRAKA = Platform.OS === 'ios' && !STARI_IOS;

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: NATIVE_TRAKA,
        // PROVIDNA: neprovidna traka bi gurnula ekran (preliv, zaglavlje) ispod sebe.
        headerTransparent: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerBackVisible: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        // Nazad gestom je iskljucen: koraci imaju sopstvenu strelicu, a
        // preskakanje unazad gestom bi ostavilo draft u nedoslednom stanju.
        gestureEnabled: false,
        // vidi komentar u korenskom layout-u
        autoHideHomeIndicator: false,
      }}
    />
  );
}
