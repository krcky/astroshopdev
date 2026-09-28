import '@/global.css';

import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colorScheme } from 'nativewind';
import { useAuthListener } from '@/store/auth';
import { neutral } from '@/theme/tokens';
import { useFonts } from 'expo-font';
import { FONT_FILES } from '@/theme/font';

// Astroshop je light-first. Tamna tema ostaje definisana u global.css
// (.dark:root) ako je ikad budemo ponudili kao opciju.
//
// Guard: pri static web renderu Expo izvrsava ovaj modul u Node-u, gde nema
// DOM-a i colorScheme.set baca gresku. Na native-u i u browseru window postoji.
if (typeof window !== 'undefined') {
  colorScheme.set('light');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dnevni horoskop se menja jednom dnevno; nema potrebe za refetch-om.
      staleTime: 1000 * 60 * 30,
      retry: 2,
    },
  },
});

/** Tumacenje (tranzit, natal): nativni list odozdo, odmah do vrha (Ivan, 28.9.2026); tekst se skroluje unutra. */
const TUMACENJE_LIST = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [1],
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
  contentStyle: { backgroundColor: neutral.white },
};

export default function RootLayout() {
  useAuthListener();

  // Pismo je Plus Jakarta Sans (`theme/font.ts`). Dok se ne ucita, ekran ostaje prazan —
  // inace bi prvi kadar bio u sistemskom pismu pa preskocio. Ako ucitavanje
  // padne, aplikacija ide dalje sa sistemskim, ne ostaje prazna.
  const [fontovi, greska] = useFonts(FONT_FILES);
  if (!fontovi && !greska) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              // Siva, ne bela — ista pozadina koju crta `Screen`. Sa belom
              // svaki prelaz izmedju ekrana kratko bljesne svetlije.
              contentStyle: { backgroundColor: neutral.grouped },
              // iOS home indikator mora da ostane vidljiv — tako izgleda svaka
              // druga aplikacija. Podrazumevana vrednost bi trebalo da bude
              // false, ali je postavljamo izricito jer se u Expo Go ponasalo
              // kao da je ukljuceno.
              autoHideHomeIndicator: false,
            }}>
            {/* Nativni iOS list odozdo, visok koliko sadrzaj (Ivan, 28.9.2026): na osnovu
                cega je napisan "Tvoj dan". Na webu i Androidu je obican modal. */}
            {/* Sva tumacenja kao isti nativni list, odmah do vrha (Ivan, 28.9.2026).
                Pozivaoci se ne menjaju — `router.push('/transit')` sam otvara list. */}
            <Stack.Screen name="transit" options={TUMACENJE_LIST} />
            <Stack.Screen name="natal" options={TUMACENJE_LIST} />
            <Stack.Screen
              name="tvoj-dan-info"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
                sheetCornerRadius: 24,
                contentStyle: { backgroundColor: neutral.white },
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
