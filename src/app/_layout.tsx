import '@/global.css';

import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colorScheme } from 'nativewind';

import { useAuthListener } from '@/store/auth';

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

export default function RootLayout() {
  useAuthListener();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
              // iOS home indikator mora da ostane vidljiv — tako izgleda svaka
              // druga aplikacija. Podrazumevana vrednost bi trebalo da bude
              // false, ali je postavljamo izricito jer se u Expo Go ponasalo
              // kao da je ukljuceno.
              autoHideHomeIndicator: false,
            }}
          />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
