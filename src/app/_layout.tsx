import '@/global.css';

import * as React from 'react';
import { Dimensions, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { probudi } from '@/store/budnost';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colorScheme } from 'nativewind';
import * as SplashScreen from 'expo-splash-screen';
import { isRunningInExpoGo } from 'expo';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useAuthListener, useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { neutral } from '@/theme/tokens';
import { useFonts } from 'expo-font';
import { FONT_FILES } from '@/theme/font';
import { Uvod } from '@/components/uvod';
import { KorenskiUmeci } from '@/components/umeci';
import { UVOD_MS } from '@/lib/uvod';

// Sistemski splash ostaje dok ga ne skloni uvod (`components/uvod.tsx`) — tek kad
// je uvod iscrtan, jer mu je prvi kadar ista slika. Android ga sklanja pretapanjem;
// kratko, jer je ispod ista slika (iOS ga sklanja trenutno). Expo Go ima svoj
// splash i `setOptions` tamo samo upozori.
SplashScreen.preventAutoHideAsync();
if (Platform.OS === 'android' && !isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: UVOD_MS.androidSplash });
}

// Astro Shop je light-first. Tamna tema ostaje definisana u global.css
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

/**
 * Paywall kao list (iOS). `fitToContents` NE RADI — sadrzaj je skrol, a list ga ne meri
 * (bio je prazan). Zato fiksna visina: koliko paywall-u treba (~790pt: naslov, cetiri
 * stavke, paketi, dugme, pravila), a najvise 92% ekrana — manji telefon skroluje.
 */
const PAYWALL_LIST = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [Math.min(0.92, 790 / Dimensions.get('window').height)],
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
  contentStyle: { backgroundColor: neutral.grouped },
};

/** Nativni list visok koliko sadrzaj ("Zašto baš ovaj tekst", kalendar na Nebu). */
const LIST_PO_SADRZAJU = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: 'fitToContents' as const,
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
  contentStyle: { backgroundColor: neutral.white },
};

export default function RootLayout() {
  useAuthListener();

  // Pismo je Plus Jakarta Sans (`theme/font.ts`). Dok se ne ucita, aplikacija se ne
  // crta (preko je uvod) — inace bi prvi kadar bio u sistemskom pismu pa preskocio.
  // Ako ucitavanje padne, aplikacija ide dalje sa sistemskim, ne ostaje prazna.
  const [fontovi, greska] = useFonts(FONT_FILES);
  const pismo = fontovi || !!greska;

  // Uvod ceka ISTO sto i kapija (`app/index.tsx`) — tada ona zna gde korisnik ide.
  // Nikad mrezu: sesija i profil se citaju sa diska (pravilo 19).
  const authLoading = useAuthStore((s) => s.loading);
  const hydrated = useProfileStore((s) => s.hydrated);
  const [uvod, setUvod] = React.useState(true);
  const krajUvoda = React.useCallback(() => setUvod(false), []);
  // Aplikacija se montira tek kad uvod krene — njeno prvo crtanje zauzme JS, pa
  // bi pre toga krug stajao; ovako se crta dok se krug okrece (`components/uvod.tsx`).
  const [aplikacija, setAplikacija] = React.useState(false);
  const pocetakUvoda = React.useCallback(() => setAplikacija(true), []);
  // Skala cele aplikacije: uvod je drzi malo uvecanu i spusti na 1 dok se otvara.
  const zum = useSharedValue(1);
  const zumStil = useAnimatedStyle(() => ({ transform: [{ scale: zum.get() }] }));

  return (
    // Svaki dodir bilo gde javlja budnost (ukrasni pokreti staju kad korisnik miruje,
    // `store/budnost.ts`). `false` = dodir ide dalje, nista se ne otima.
    <GestureHandlerRootView style={{ flex: 1 }} onStartShouldSetResponderCapture={() => { probudi(); return false; }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          {/* Pravi umeci prozora za tabove koji jos nisu bili na ekranu — `components/umeci.tsx`. */}
          <KorenskiUmeci>
            <StatusBar style="dark" />
            <Animated.View style={[{ flex: 1 }, zumStil]}>
              {pismo && aplikacija && (
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
                  {/* "Šta je natalna karta" sa ikonice "i" na tabu "Ti" — dug tekst, pa isti list do vrha. */}
                  <Stack.Screen name="natalna-karta-info" options={TUMACENJE_LIST} />
                  {/* "Šta je trenutno nebo" sa ikonice "i" pored tocka na Nebu (Ivan, 29.9.2026). */}
                  <Stack.Screen name="nebo-info" options={TUMACENJE_LIST} />
                  <Stack.Screen name="tvoj-dan-info" options={LIST_PO_SADRZAJU} />
                  {/* Ceo lunarni kalendar (ekran Mesec) kao list odozdo do vrha, bez strelice
                      nazad (Ivan, 29.9.2026). SIVA pozadina: na njemu su bele kartice. */}
                  <Stack.Screen name="moon" options={{ ...TUMACENJE_LIST, contentStyle: { backgroundColor: neutral.grouped } }} />
                  {/* Dnevna prica (Ivan, 30.9.2026): preko celog ekrana, PROVIDNA — pri povlacenju
                      nadole ispod se vidi pocetna. Ulaz i zatvaranje animira sama (`app/prica.tsx`). */}
                  <Stack.Screen
                    name="prica"
                    options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }}
                  />
                  {/* Paywall — sa svakog "Otključaj" (`components/zakljucano.tsx`). Na iOS-u
                      list VISINE SADRZAJA (Ivan, 30.9.2026: "ne mora da bude 100%"; do tada
                      `modal` preko celog ekrana) — `PAYWALL_LIST`. Android: `modal`. */}
                  <Stack.Screen
                    name="premium"
                    options={Platform.OS === 'ios'
                      ? PAYWALL_LIST
                      : { presentation: 'modal', contentStyle: { backgroundColor: neutral.grouped } }}
                  />
                  {/* Nebo (Ivan, 28.9.2026): kalendar sa dugmeta sa datumom, visok koliko
                      sadrzaj; izbor mesta sa dugmeta sa gradom, do vrha — lista gradova
                      raste dok se kuca, a list koji menja visinu bi skakao. */}
                  <Stack.Screen name="sky-datum" options={LIST_PO_SADRZAJU} />
                  <Stack.Screen name="sky-place" options={TUMACENJE_LIST} />
                  {/* Pitaj astrologa (29.9.2026): odgovor je list kao tumacenje; pisanje je
                      pageSheet preko celog ekrana — formSheet ne daje visinu, a polje mora
                      da zauzme prostor i dugme da stoji iznad tastature (`pitanje-novo.tsx`). */}
                  {/* Izmena jednog podatka o rodjenju (svog ili druge osobe) sa tabele (Ivan, 29.9.2026):
                      ime i mesto do vrha (tastatura, predlozi grada), ostalo visoko koliko sadrzaj. */}
                  <Stack.Screen
                    name="rodjenje-polje"
                    options={({ route }) => {
                      const polje = (route.params as { polje?: string } | undefined)?.polje;
                      return polje === 'ime' || polje === 'mesto' ? TUMACENJE_LIST : LIST_PO_SADRZAJU;
                    }}
                  />
                  <Stack.Screen name="pitanje" options={TUMACENJE_LIST} />
                  {/* Profil (Ivan, 29.9.2026): list odozdo do vrha, SIVI — na njemu su bele
                      grupe. "Nalog" (brisanje naloga) je list preko njega, visok koliko sadrzaj. */}
                  <Stack.Screen name="profile" options={{ ...TUMACENJE_LIST, contentStyle: { backgroundColor: neutral.grouped } }} />
                  <Stack.Screen name="nalog" options={{ ...TUMACENJE_LIST, contentStyle: { backgroundColor: neutral.grouped } }} />
                  {/* Promena emaila sa lista "Nalog": nova adresa, pa kod sa mejla (29.9.2026). */}
                  <Stack.Screen name="email" options={{ ...TUMACENJE_LIST, contentStyle: { backgroundColor: neutral.grouped } }} />
                  <Stack.Screen
                    name="pitanje-novo"
                    options={{ presentation: 'modal', contentStyle: { backgroundColor: neutral.white } }}
                  />
                </Stack>
              )}
            </Animated.View>
            {/* Uvod pri pokretanju: pokriva aplikaciju dok se ne otvori, pa nestaje. */}
            {uvod && (
              <Uvod
                spremno={pismo && aplikacija && !authLoading && hydrated}
                zum={zum}
                onPocetak={pocetakUvoda}
                onKraj={krajUvoda}
              />
            )}
          </KorenskiUmeci>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
