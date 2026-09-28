import * as React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Blagi prelaz na vrhu lista, ispod rucice (Ivan, 28.9.2026): tekst koji se
 * skroluje nestaje u belo PRE linije za povlacenje, umesto da prolazi ispod nje.
 * Pun beo prvih ~14pt (tu je rucica), pa se pretapa u providno do `FADE`.
 * Sadrzaj pocinje tacno ispod prelaza, pa u mirovanju naslov nije zamucen.
 */
const FADE = 40;

/**
 * Rucica za povlacenje — SAMO ANDROID. Na iOS-u je crta sistem
 * (`sheetGrabberVisible` u `_layout.tsx`), a ta opcija na Androidu ne postoji,
 * pa je list tamo bio bez nje (Ivan, 28.9.2026). Mera je Material 3 "drag
 * handle": 32x4dp, zaobljena, 12dp od vrha. Samo znak — povlacenje hvata sam
 * list, pa rucica ne prima dodir.
 */
export function SheetGrabber() {
  if (Platform.OS !== 'android') return null;
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-3 items-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="h-1 w-8 rounded-pill bg-subtle opacity-60" />
    </View>
  );
}

/**
 * Okvir za sadrzaj NATIVNOG LISTA odozdo (`presentation: 'formSheet'` u
 * `app/_layout.tsx`) — sva tumacenja se otvaraju tako (Ivan, 28.9.2026), isto
 * kao list "Na osnovu cega je ovaj tekst".
 *
 * Bez zaglavlja i strelice nazad: list ima rucicu i zatvara se povlacenjem
 * nadole. List ide odmah do vrha (`TUMACENJE_LIST`), a dugacak tekst se
 * skroluje unutra.
 */
export function SheetScroll({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    // ScrollView MORA biti koren: iOS formSheet sadrzaju ne daje visinu (pozicija bez
    // `bottom`), pa bi omotac sa `flex-1` dobio visinu 0 i list bi bio prazan i beo
    // (Ivan, 28.9.2026). Prelaz je zato PRVO dete skrola, zalepljen za vrh
    // (`stickyHeaderIndices`) — zalepljeno zaglavlje RN crta PREKO sadrzaja koji
    // prolazi ispod, a svojih 40pt ujedno sluzi kao gornji razmak.
    <ScrollView
      className="flex-1 bg-background"
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}>
      <View pointerEvents="none" style={{ height: FADE }}>
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
          locations={[0, 0.35, 1]}
          style={{ flex: 1 }}
        />
        <SheetGrabber />
      </View>
      <View style={{ paddingHorizontal: 24 }}>{children}</View>
    </ScrollView>
  );
}

/**
 * Prelaz sa lista na obican ekran (npr. "Otkljucaj" -> profil): list se prvo
 * zatvori, pa se ekran otvori. Inace bi se ekran gurnuo ISPOD otvorenog lista.
 */
export function leaveSheetTo(href: Parameters<typeof router.push>[0]) {
  if (router.canGoBack()) router.back();
  router.push(href);
}
