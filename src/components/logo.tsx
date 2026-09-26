import * as React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/ui/text';

/*
 * Logo u traci na vrhu ekrana: animirani krug + natpis ASTROSHOP.
 *
 * Krug je VEKTORSKI Lottie sklopljen iz brend SVG-a (`logo/krug-vektor.svg`)
 * skriptom `scripts/logo/build-krug.py` — tamo su i razlozi i zamke. Originalni
 * brend Lottie je rasterski i na ovoj velicini se raspadao. Animacija je ista:
 * uvodni okret od dve sekunde, zatim jedan krug u minut; lice miruje, zraci se
 * okrecu, znakovi kruze i ostaju uspravni.
 *
 * Natpis je OBICAN TEKST "Astro Shop", 24/30 polucrn (Ivan, 26.9.2026),
 * sistemsko pismo, ne SVG wordmark iz brend fajla.
 * Krug je 48 (Ivan, 26.9.2026), centar u liniji sa native dugmadima; razmak 12; red ima `items-center`,
 * pa je tekst na sredini kruga.
 *
 * Na vebu `lottie-react-native` trazi dodatni paket, pa `logo.web.tsx` crta
 * staticni krug — vidi tamo.
 *
 * `autoPlay` sam po sebi na iOS-u (nova arhitektura) ume da ne krene — poznata
 * mana biblioteke — pa se `play()` zove i rucno kad se pogled izmeri. Provereno
 * 26.9.2026: sa samim `autoPlay` krug je stajao.
 *
 * Smanjeno kretanje se ovde NAMERNO ne postuje: okret od jednog kruga u minut
 * je jedva pokret, a logo je jedina animacija na ekranu. Ako se doda jos
 * pokreta, ovo je mesto gde se `useReducedMotion` vraca.
 */
export const LOGO_SIZE = 48;
const GAP = 12;

/** Kompozicija punog loga (logo-full.json): sirina, visina i x centra kruga. */
const FULL_W = 1511;
const FULL_H = 400;
const FULL_CX = 809;
const FULL_ASPECT = FULL_W / FULL_H;
/**
 * Krug u punom logu nije na sredini kompozicije (ASTRO je sire od SHOP), pa se
 * ceo logo pomera ulevo za toliko da KRUG bude na sredini strane (Ivan, 26.9.2026).
 */
/** Visina punog loga = precnik kruga u njemu. Po meri je isti kao LOGO_SIZE (kompozicija
 *  je visoka tacno koliko krug), ali na oku deluje manji pored sitnih slova, pa je
 *  malo veci (Ivan, 26.9.2026). */
const FULL_SIZE = 58;
const FULL_SHIFT_X = -((FULL_CX - FULL_W / 2) / FULL_H) * FULL_SIZE;

/** Imena slojeva kruga sa oblicima (iz logo-krug.json) — na njih ide preboja. */
const KRUG_SLOJEVI = [
  'Prsten', 'Lice', 'Zraci',
  ...['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'].map((z) => `znak ${z}`),
];

/**
 * `title` — ime strane umesto "Astro Shop"; isti krug, drugi natpis.
 * `full` — PUN logo (ASTRO, krug, SHOP) iz `logo-full.json`, centriran u traci.
 * `color` — preboja kruga (npr. `ink` na ekranima ciji preliv nije ljubicast,
 * Ivan 26.9.2026); bez nje krug je brend indigo iz fajla. Ide kroz Lottie
 * `colorFilters` po imenu sloja, pa JSON ostaje jedan.
 */
export function Logo({ title = 'Astro Shop', full = false, color }: { title?: string; full?: boolean; color?: string }) {
  const krug = React.useRef<LottieView>(null);
  const pusti = React.useCallback(() => krug.current?.play(), []);
  React.useEffect(() => { pusti(); }, [pusti]);

  // Svaki put kad ekran dodje u fokus (promena taba, povratak sa drugog ekrana)
  // krug krece ISPOCETKA, sa uvodnim okretom (Ivan, 26.9.2026). Tabovi ostaju
  // montirani, pa bez ovoga animacija samo nastavlja gde je bila.
  useFocusEffect(
    React.useCallback(() => {
      krug.current?.reset();
      krug.current?.play();
    }, [])
  );

  if (full) {
    return (
      <View
        className="flex-1 items-center"
        // Pun logo ide 4pt NIZE od sredine trake (Ivan, 26.9.2026), i ulevo
        // koliko treba da krug bude na sredini strane.
        style={{ transform: [{ translateX: FULL_SHIFT_X }, { translateY: 4 }] }}
        accessibilityRole="header"
        accessibilityLabel="Astro Shop">
        <LottieView
          ref={krug}
          source={require('@/assets/lottie/logo-full.json')}
          autoPlay
          loop
          resizeMode="contain"
          onLayout={pusti}
          style={{ width: FULL_SIZE * FULL_ASPECT, height: FULL_SIZE }}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center"
      // Traka je 53pt (centar 26,5); logo ide 5pt vise da mu centar bude na 22pt
      // ispod statusne trake, u liniji sa native dugmadima iOS trake (44pt).
      style={{ gap: GAP, transform: [{ translateY: -5 }] }}
      accessibilityRole="header"
      accessibilityLabel={title}>
      <LottieView
        ref={krug}
        source={require('@/assets/lottie/logo-krug.json')}
        autoPlay
        loop
        resizeMode="contain"
        onLayout={pusti}
        colorFilters={color ? KRUG_SLOJEVI.map((keypath) => ({ keypath, color })) : undefined}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
      />
      <Text className="text-[24px] leading-[30px] font-semibold tracking-[-0.3px]" numberOfLines={1}>{title}</Text>
    </View>
  );
}
