import * as React from 'react';
import { View } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Button, HStack, Host, Image, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as a11yLabel, buttonBorderShape, buttonStyle, controlSize, disabled as ugaseno, font, foregroundStyle, frame,
} from '@expo/ui/swift-ui/modifiers';

import { StakloDugmeRezerva, type StakloDugmeProps } from '@/components/staklo-dugme-rezerva';
import { FONT } from '@/theme/font';
import { neutral } from '@/theme/tokens';

export type { StakloDugmeProps };

/** Visina sadrzaja dugmeta; staklo (`controlSize('small')`) dodaje svoj razmak do ~40pt, kao dugmad u traci. */
const VISINA = 30;

/**
 * STAKLENO DUGME U SADRZAJU (Ivan, 29.9.2026: "pravi glass buttoni a ne ovi lazni").
 * Na iOS-u 26 je SISTEMSKO staklo — SwiftUI `Button` sa `buttonStyle('glass')`
 * preko `@expo/ui`, isti materijal kao dugmad u native traci (obod, senka,
 * odziv na dodir). Nativne stavke trake ovde ne mogu — dugmad su usred sadrzaja.
 *
 * Sadrzaj je CIST SwiftUI (SF Symbol + tekst): SwiftUI dugme sa React Native
 * sadrzajem (`RNHostView`) je u Expo Go-u oborilo ceo bundle (29.9.2026).
 * Bez stakla (iOS pre 26) ide rezerva.
 */
export function StakloDugme(props: StakloDugmeProps) {
  if (!isLiquidGlassAvailable()) return <StakloDugmeRezerva {...props} />;
  const { tekst, sfIkona, strelica, onPress, disabled, siroko, accessibilityLabel } = props;
  const boja = disabled ? neutral.inkSubtle : neutral.ink;
  const slika = strelica ? (strelica === 'levo' ? 'chevron.left' : 'chevron.right') : sfIkona;
  const ikona = slika ? <Image systemName={slika as never} size={strelica ? 14 : 16} color={boja} /> : null;
  const natpis = <Text modifiers={[font({ family: FONT.medium, size: 15 }), foregroundStyle(boja)]}>{tekst}</Text>;
  return (
    <View style={siroko ? { flex: 1 } : undefined}>
      <Host matchContents={siroko ? { vertical: true } : true} style={siroko ? { flex: 1 } : undefined}>
        <Button
          onPress={onPress}
          modifiers={[
            buttonStyle('glass'),
            buttonBorderShape('capsule'),
            // Mala kontrola za SVA dugmad: manji unutrasnji razmak stakla, da "dan" stane
            // u uzak korak (pet u redu), i ista visina svuda (~40pt, kao dugmad u traci).
            controlSize('small'),
            ugaseno(!!disabled),
            a11yLabel(accessibilityLabel),
          ]}>
          <HStack spacing={strelica ? 2 : 8} modifiers={[frame({ height: VISINA, ...(siroko ? { maxWidth: 10000 } : {}) })]}>
            {strelica === 'desno' ? <>{natpis}{ikona}</> : <>{ikona}{natpis}</>}
          </HStack>
        </Button>
      </Host>
    </View>
  );
}
