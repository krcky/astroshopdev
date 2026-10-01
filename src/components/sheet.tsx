import * as React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BezInterneta } from '@/components/bez-interneta';
import { neutral } from '@/theme/tokens';

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
 * kao list "Zašto baš ovaj tekst".
 *
 * Bez zaglavlja i strelice nazad: list ima rucicu i zatvara se povlacenjem
 * nadole. List ide odmah do vrha (`TUMACENJE_LIST`), a dugacak tekst se
 * skroluje unutra.
 */
export function SheetScroll({ children, keyboardShouldPersistTaps, siva = false, skrolRef, onScrollY }: {
  children: React.ReactNode;
  /** Skrol lista — za povratak na mesto posle zamene sadrzaja (lunarni kalendar). */
  skrolRef?: React.Ref<ScrollView>;
  /** Trenutni pomeraj skrola (throttle 16 ms). */
  onScrollY?: (y: number) => void;
  /**
   * Siva pozadina (`bg-grouped`) umesto bele — za list sa BELIM KARTICAMA (lunarni
   * kalendar, Ivan 29.9.2026): bela kartica na belom listu se ne vidi (pravilo 17).
   */
  siva?: boolean;
  /** Lista sa poljem za pretragu: `handled`, da prvi dodir na rezultat izabere, a ne samo spusti tastaturu. */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}) {
  const insets = useSafeAreaInsets();
  return (
    // ScrollView MORA biti koren: iOS formSheet sadrzaju ne daje visinu (pozicija bez
    // `bottom`), pa bi omotac sa `flex-1` dobio visinu 0 i list bi bio prazan i beo
    // (Ivan, 28.9.2026). Prelaz je zato PRVO dete skrola, zalepljen za vrh
    // (`stickyHeaderIndices`) — zalepljeno zaglavlje RN crta PREKO sadrzaja koji
    // prolazi ispod, a svojih 40pt ujedno sluzi kao gornji razmak.
    <ScrollView
      ref={skrolRef}
      onScroll={onScrollY ? (e) => onScrollY(e.nativeEvent.contentOffset.y) : undefined}
      scrollEventThrottle={onScrollY ? 16 : undefined}
      className={siva ? 'flex-1 bg-grouped' : 'flex-1 bg-background'}
      stickyHeaderIndices={[0]}
      // ANDROID (Ivan, 1.10.2026): list odozdo je `BottomSheetBehavior`, koji skrol unutar sebe
      // prepoznaje samo kao "nested scroll" — RN ScrollView ga na Androidu podrazumevano iskljucuje,
      // pa je svako povlacenje nadole (i skrol teksta nagore) zatvaralo list. Na iOS-u nema efekta.
      nestedScrollEnabled
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}>
      <View pointerEvents="none" style={{ height: FADE }}>
        <LinearGradient
          colors={siva
            ? [neutral.grouped, neutral.grouped, `${neutral.grouped}00`]
            : ['rgba(255,255,255,1)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
          locations={[0, 0.35, 1]}
          style={{ flex: 1 }}
        />
        <SheetGrabber />
      </View>
      <View style={{ paddingHorizontal: 24 }}>
        <BezInterneta className="mb-6" />
        {children}
      </View>
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

/** Vidljivi vazduh na dnu lista visine po sadrzaju (`fitToContents`) — kao bokovi (`px-6`). */
const DNO = 24;

/**
 * Donji razmak lista visine po sadrzaju ("Zašto baš ovaj tekst", kalendar na
 * Nebu). iOS sam dodaje `bottom` ispod sadrzaja; kad je veci od `DNO`, visak se
 * odbija negativnom marginom (sadrzaj koji iOS meri je kraci, pa je i list
 * toliko nizi), a kad je manji, dopunjuje se paddingom. Android: modal do dna.
 */
export function dnoLista(bottom: number) {
  if (Platform.OS === 'android') return { paddingBottom: bottom + DNO };
  const razlika = DNO - bottom;
  return razlika >= 0 ? { paddingBottom: razlika } : { marginBottom: razlika };
}
