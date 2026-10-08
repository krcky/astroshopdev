import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Host, Spacer, ZStack } from '@expo/ui/swift-ui';
import { frame, glassEffect } from '@expo/ui/swift-ui/modifiers';

import { StakloPovrsinaRezerva, type StakloPovrsinaProps } from '@/components/staklo-povrsina-rezerva';

export type { StakloPovrsinaProps };

/**
 * STAKLENA POVRSINA ZA SADRZAJ (Ivan, 8.10.2026: "original glass, a ne ovaj fake") — kartica koja
 * plovi preko kruga. Staklo je SISTEMSKO: SwiftUI `.glassEffect` preko `@expo/ui`, isti materijal
 * kao `StakloDugme` i native traka (a ne `GlassView`/UIVisualEffectView, koji "lici na staklo, nije
 * to"). Sadrzaj ostaje React Native, nacrtan PREKO stakla: SwiftUI dobija samo praznu povrsinu
 * (bez `RNHostView`, koji je u Expo Go-u oborio bundle — vidi `staklo-dugme.ios.tsx`).
 *
 * Staklo se ne sme drzati ispod roditelja sa providnoscu < 1; razmera je u redu.
 * Bez stakla (iOS pre 26) ide rezerva.
 */
export function StakloPovrsina(props: StakloPovrsinaProps) {
  if (!isLiquidGlassAvailable()) return <StakloPovrsinaRezerva {...props} />;
  const { children, radius = 18, style } = props;
  return (
    <View style={[{ borderRadius: radius }, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Host style={StyleSheet.absoluteFill}>
          <ZStack
            modifiers={[
              frame({ maxWidth: 10000, maxHeight: 10000 }),
              glassEffect({ glass: { variant: 'regular' }, shape: 'roundedRectangle', cornerRadius: radius }),
            ]}>
            <Spacer />
          </ZStack>
        </Host>
      </View>
      {children}
    </View>
  );
}
