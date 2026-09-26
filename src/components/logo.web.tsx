import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';

/**
 * Veb varijanta loga: staticni krug umesto Lottie animacije.
 *
 * `lottie-react-native` na vebu trazi `@lottiefiles/dotlottie-react`; bez
 * njega bi veb bild pao. Krug je `assets/images/logo-krug.png` iz brend
 * foldera (isti motiv, bez pokreta). Mere iste kao u `logo.tsx`.
 */
export const LOGO_SIZE = 52;
const GAP = 12;

/** `title` — ime strane umesto "Astro Shop"; isti krug, drugi natpis (Ivan, 26.9.2026). */
export function Logo({ title = 'Astro Shop' }: { title?: string }) {
  return (
    <View
      className="flex-row items-center"
      // Traka centrira natpis po sredini svojih 70pt; logo ide 5pt vise, blize
      // statusnoj traci (Ivan, 26.9.2026): krug od 52 tada ima 4pt do vrha trake.
      style={{ gap: GAP, transform: [{ translateY: -5 }] }}
      accessibilityRole="header"
      accessibilityLabel={title}>
      <Image
        source={require('@/assets/images/logo-krug.png')}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        contentFit="contain"
      />
      <Text className="text-[24px] leading-[30px] font-semibold tracking-[-0.3px]" numberOfLines={1}>{title}</Text>
    </View>
  );
}
