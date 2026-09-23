import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
// Tip stize iz 'expo-router/js-tabs', ne iz korena paketa — koren izvozi samo
// komponentu <Tabs>, a tipove trake prosledjuje dalje ovaj ulaz.
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Text } from '@/components/ui/text';

const INK = '#141414';
const MUTED = '#9A9A9A';

/**
 * Koliko prostora ekran mora da ostavi na dnu da traka ne prekrije sadrzaj.
 *
 * Traka lebdi IZNAD ekrana (`position: absolute`), pa ne zauzima mesto u
 * rasporedu — sadrzaj klizi ispod nje. Bez ovog razmaka poslednji red svakog
 * ekrana zavrsi sakriven. Broj je visina trake plus vazduh oko nje; donji
 * safe-area umetak se dodaje posebno jer se razlikuje po uredjaju.
 */
export const TAB_BAR_SPACE = 96;

/** Razmak od donje ivice ekrana kad uredjaj nema safe-area umetak. */
const DNO_BEZ_UMETKA = 14;

/**
 * Oblik pilule. Namerno kao `style`, ne kao Tailwind klasa — vidi komentar
 * uz `GlassView` nize.
 *
 * `borderRadius` je veci od pola visine trake, sto u React Native-u znaci
 * "sasvim okruglo" bez racunanja tacne visine.
 */
const pilula = {
  borderRadius: 999,
  overflow: 'hidden',
} as const;

/** Dodatak za rezervnu, neprovidnu traku — senka daje dubinu koju staklo ima samo po sebi. */
const rezerva = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E6E6E6',
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: Platform.OS === 'android' ? 8 : 0,
} as const;

/**
 * Prazan prostor na dnu ekrana ispod trake — ide kao POSLEDNJE dete ScrollView-a.
 *
 * Razdaljina se ne moze napisati kao Tailwind klasa jer zavisi od uredjaja:
 * telefon sa zarezom ima jos ~34px umetka, stariji nema nista. Zato spacer,
 * a ne `pb-32` — fiksan broj bi na jednom telefonu sekao sadrzaj, a na drugom
 * ostavljao rupu.
 */
export function TabBarSpacer() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: TAB_BAR_SPACE + insets.bottom }} />;
}

/**
 * Lebdeca traka u obliku pilule — iOS 26 izgled.
 *
 * Na iOS-u 26 koristi pravi Liquid Glass (`GlassView`): sistem sam racuna
 * zamucenje, prelamanje i senku, i traka se menja u skladu sa onim sto klizi
 * ispod nje. Na Androidu, starijem iOS-u i vebu `isLiquidGlassAvailable()`
 * vraca false pa se crta neprovidna bela pilula sa senkom — namerno, jer
 * lazni "glass" (poluprovidna bela) izgleda prljavo nad sarenim sadrzajem.
 *
 * Zasto rucna traka a ne `tabBarStyle`: podrazumevana traka je pravougaonik
 * prilepljen uz dno, sa ivicom preko cele sirine. Oblik pilule, aktivna
 * kapsula iza ikone i lebdenje ne mogu da se dobiju kroz njene opcije.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const glass = isLiquidGlassAvailable();

  const stavke = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const aktivna = state.index === index;
    const boja = aktivna ? INK : MUTED;
    const naslov = options.title ?? route.name;

    const pritisak = () => {
      // `emit` sa `canPreventDefault` je jedini nacin da ekran moze da odbije
      // prelazak (npr. nesacuvana izmena). Nikad ne zvati navigate direktno.
      const dogadjaj = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!aktivna && !dogadjaj.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={pritisak}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        accessibilityRole="button"
        accessibilityState={aktivna ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? naslov}
        className={`min-w-[64px] items-center gap-0.5 rounded-full px-3 py-2 ${
          aktivna ? 'bg-secondary' : ''
        }`}>
        {options.tabBarIcon?.({ focused: aktivna, color: boja, size: 22 })}
        <Text
          numberOfLines={1}
          style={{ color: boja }}
          className="text-[10px] tracking-[0.4px]">
          {naslov}
        </Text>
      </Pressable>
    );
  });

  const sadrzaj = <View className="flex-row items-center gap-1 px-2 py-1.5">{stavke}</View>;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: insets.bottom || DNO_BEZ_UMETKA }}>
      {glass ? (
        <GlassView
          glassEffectStyle="regular"
          // Tema je zakljucana na svetlu (pravilo 2 u CLAUDE.md), pa se i staklo
          // drzi svetlog izgleda bez obzira na sistemsko podesavanje.
          colorScheme="light"
          isInteractive
          // STYLE, ne className. `GlassView` je nativna komponenta i NativeWind
          // je ne poznaje, pa klase na njoj tiho nestanu — nema greske, samo
          // pravougaonik umesto pilule. Na vebu se to ne vidi jer tamo staklo
          // nije dostupno pa se crta rezervna grana, koja je obicni <View>.
          style={pilula}>
          {sadrzaj}
        </GlassView>
      ) : (
        <View style={[pilula, rezerva]}>{sadrzaj}</View>
      )}
    </View>
  );
}
