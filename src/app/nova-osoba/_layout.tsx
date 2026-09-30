import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { STARI_IOS } from '@/lib/platform';
import { neutral } from '@/theme/tokens';

/**
 * Nova osoba korak po korak (Ivan, 29.9.2026: "slicno kao onboarding") — ime, ko
 * ti je, datum, vreme, mesto, pregled. Traka je ista kao u `(onboarding)/_layout.tsx`:
 * na iOS-u 26 providna native traka samo zbog dugmadi (`OnboardingStep`).
 */
const NATIVE_TRAKA = Platform.OS === 'ios' && !STARI_IOS;

export default function NovaOsobaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: NATIVE_TRAKA,
        headerTransparent: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerBackVisible: false,
        contentStyle: { backgroundColor: neutral.grouped },
        // Kao onboarding: koraci imaju svoju strelicu nazad.
        gestureEnabled: false,
        autoHideHomeIndicator: false,
      }}
    />
  );
}
