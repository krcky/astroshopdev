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
 * Krug je 52 (Ivan: +30% pa +10% na 36), razmak 12; red ima `items-center`,
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
export const LOGO_SIZE = 52;
const GAP = 12;

/** `title` — ime strane umesto "Astro Shop"; isti krug, drugi natpis (Ivan, 26.9.2026). */
export function Logo({ title = 'Astro Shop' }: { title?: string }) {
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

  return (
    <View
      className="flex-row items-center"
      // Traka centrira natpis po sredini svojih 70pt; logo ide 5pt vise, blize
      // statusnoj traci (Ivan, 26.9.2026): krug od 52 tada ima 4pt do vrha trake.
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
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
      />
      <Text className="text-[24px] leading-[30px] font-semibold tracking-[-0.3px]" numberOfLines={1}>{title}</Text>
    </View>
  );
}
