import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';
import { tezina } from '@/theme/tipografija';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

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

/** Krug loga bez natpisa (dobrodoslica) — na vebu staticna slika. */
export function KrugLoga({ size = LOGO_SIZE, color }: { size?: number; color?: string }) {
  return (
    <Image
      source={require('@/assets/images/logo-krug.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export type LogoKrugRef = { zavrti: () => void };

/** Krug za uvod (`uvod.tsx`) — na vebu staticna slika, pa se ne vrti. */
export function LogoKrug({ size, onSpreman }: {
  ref?: React.Ref<LogoKrugRef>;
  size: number;
  onSpreman?: () => void;
}) {
  return (
    <Image
      source={require('@/assets/images/logo-krug.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
      onLoad={onSpreman}
    />
  );
}

/** `title` — ime strane; `full` — pun logo iz brend PNG-a (staticno na vebu). */
/** `color` — preboja kruga (PNG je indigo na providnom, pa `tintColor` radi). */
export function Logo({ title: naslov, full = false, color }: { title?: string; full?: boolean; color?: string }) {
  const t = useT();
  const title = naslov ?? t.opste.imeAplikacije;
  if (full) {
    return (
      <View className="flex-1 items-center" style={{ transform: [{ translateX: -((338 - 621 / 2) / 168) * 58 }, { translateY: 4 }] }} accessibilityRole="header" accessibilityLabel={t.opste.imeAplikacije}>
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
