import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Wordmark } from '@/components/wordmark';

/**
 * Veb varijanta loga: staticni krug umesto Lottie animacije.
 *
 * `lottie-react-native` na vebu trazi `@lottiefiles/dotlottie-react`; bez
 * njega bi veb bild pao. Krug je `assets/images/logo-krug.png` iz brend
 * foldera (isti motiv, bez pokreta). Mere iste kao u `logo.tsx`.
 */
export const LOGO_SIZE = 52;
const GAP = 12;

export function Logo() {
  return (
    <View
      className="flex-row items-center"
      // Traka centrira natpis po sredini svojih 70pt; logo ide 5pt vise, blize
      // statusnoj traci (Ivan, 26.9.2026): krug od 52 tada ima 4pt do vrha trake.
      style={{ gap: GAP, transform: [{ translateY: -5 }] }}
      accessibilityRole="header"
      accessibilityLabel="Astroshop">
      <Image
        source={require('@/assets/images/logo-krug.png')}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        contentFit="contain"
      />
      <Wordmark height={11} />
    </View>
  );
}
