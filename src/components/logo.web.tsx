import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';
import { tezina } from '@/theme/tipografija';
import { cn } from '@/lib/utils';

/**
 * Veb varijanta loga: staticni krug umesto Lottie animacije.
 *
 * `lottie-react-native` na vebu trazi `@lottiefiles/dotlottie-react`; bez
 * njega bi veb bild pao. Krug je `assets/images/logo-krug.png` iz brend
 * foldera (isti motiv, bez pokreta). Mere iste kao u `logo.tsx`.
 */
export const LOGO_SIZE = 48;
const GAP = 12;

const FULL_ASPECT = 621 / 168;

/** `title` — ime strane; `full` — pun logo iz brend PNG-a (staticno na vebu). */
/** `color` — preboja kruga (PNG je indigo na providnom, pa `tintColor` radi). */
export function Logo({ title = 'Astro Shop', full = false, color }: { title?: string; full?: boolean; color?: string }) {
  if (full) {
    return (
      <View className="flex-1 items-center" style={{ transform: [{ translateX: -((338 - 621 / 2) / 168) * 58 }, { translateY: 4 }] }} accessibilityRole="header" accessibilityLabel="Astro Shop">
        <Image
          source={require('@/assets/images/logo-full.png')}
          style={{ width: 58 * FULL_ASPECT, height: 58 }}
          contentFit="contain"
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
      <Image
        source={require('@/assets/images/logo-krug.png')}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        contentFit="contain"
        tintColor={color}
      />
      <Text className={cn('text-[24px] leading-[30px] tracking-[-0.3px]', tezina('naslovStrane'))} numberOfLines={1}>{title}</Text>
    </View>
  );
}
