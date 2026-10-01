import * as React from 'react';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { HStack, Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as a11yLabel, buttonBorderShape, buttonStyle, controlSize, font, foregroundStyle, frame,
  menuIndicator, menuStyle, tag, tint,
} from '@expo/ui/swift-ui/modifiers';

import { IzborJezikaRezerva, natpis } from '@/components/izbor-jezika-rezerva';
import { dostupniJezici, IME_JEZIKA, useJezik } from '@/i18n';
import { useJezikStore } from '@/store/jezik';
import { FONT } from '@/theme/font';
import { neutral } from '@/theme/tokens';

export { natpis, SpisakJezika } from '@/components/izbor-jezika-rezerva';

/** Ista visina sadrzaja kao `StakloDugme` (44pt sa staklom). */
const VISINA = 34;

/**
 * Izbor jezika na iOS-u 26: SwiftUI `Menu` u SISTEMSKOM staklu (`buttonStyle('glass')`, kao
 * `StakloDugme`), a u meniju `Picker` — kvacicu na izabranom jeziku crta sam sistem, isto kao
 * dan-meni (`native-day-menu.ios.tsx`). Sadrzaj je cist SwiftUI (tekst + SF Symbol), bez
 * `RNHostView` (u Expo Go-u je obarao bundle). Bez stakla (iOS < 26): rezerva.
 */
export function IzborJezika() {
  const jezik = useJezik();
  const izaberi = useJezikStore((s) => s.izaberi);
  if (!isLiquidGlassAvailable()) return <IzborJezikaRezerva />;
  const jezici = dostupniJezici();
  return (
    <Host matchContents>
      <Menu
        modifiers={[
          menuStyle('button'),
          buttonStyle('glass'),
          buttonBorderShape('capsule'),
          controlSize('small'),
          menuIndicator('hidden'),
          tint(neutral.ink),
          a11yLabel(IME_JEZIKA[jezik]),
        ]}
        label={
          <HStack spacing={6} modifiers={[frame({ height: VISINA })]}>
            <Text modifiers={[font({ family: FONT.medium, size: 15 }), foregroundStyle(neutral.ink)]}>{natpis(jezik)}</Text>
            <Image systemName="chevron.down" size={12} color={neutral.ink} />
          </HStack>
        }>
        <Picker selection={jezici.indexOf(jezik)} onSelectionChange={(i: number) => izaberi(jezici[i])}>
          {jezici.map((j, i) => (
            <Text key={j} modifiers={[tag(i)]}>{natpis(j)}</Text>
          ))}
        </Picker>
      </Menu>
    </Host>
  );
}
