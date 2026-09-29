import * as React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Button } from '@/components/ui/button';
import { neutral, shadow, size } from '@/theme/tokens';

/**
 * Kruzno dugme sa ikonom u Liquid Glass mehuru (iOS 26+), 40pt kao dugme u
 * zaglavlju. Gde stakla nema — Android, stariji iOS, veb — pada na `Button`
 * varijante `soft`: belo sa mekom senkom, isto sto koristi i zaglavlje ekrana.
 *
 * Pravo staklo gde postoji, a ne lazno poluprovidno belo, koje nad sarenim
 * sadrzajem izgleda prljavo.
 *
 * `GlassView` je nativna komponenta i NativeWind je ne poznaje — sve ide kroz
 * `style`, ne `className` (klase bi tiho nestale).
 *
 * Neaktivno dugme: staklo ostaje, ikona posivi — boju ikone bira pozivalac
 * (`disabled` mu je poznat), ovde se samo gasi dodir.
 */
type Props = {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const D = size.headerButton;

const mehur: ViewStyle = {
  width: D,
  height: D,
  borderRadius: D / 2,
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
};

export function GlassIconButton({ onPress, disabled, accessibilityLabel, children, style }: Props) {
  if (!isLiquidGlassAvailable()) {
    return (
      <Button size="icon" variant="soft" disabled={disabled} onPress={onPress} accessibilityLabel={accessibilityLabel} style={style}>
        {children}
      </Button>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={style}>
      {/* Bez `active:opacity-*` na ovom omotacu: providan roditelj kvari staklo na
          iOS-u (vidi `ui/kapsule.tsx`). Odziv na dodir daje `isInteractive`. */}
      <GlassView glassEffectStyle="regular" colorScheme="light" isInteractive={!disabled} style={mehur}>
        <View>{children}</View>
      </GlassView>
    </Pressable>
  );
}

/**
 * Mehur proizvoljne sirine, visine dugmeta zaglavlja (40pt), za vise kontrola
 * u jednom staklu — npr. strelice za dan. Gde stakla nema: bela pilula sa
 * ivicom i mekom senkom.
 *
 * `interaktivno={false}` za neaktivno dugme: staklo ostaje, ali ne reaguje na dodir.
 */
export function GlassBubble({ children, style, interaktivno = true }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  interaktivno?: boolean;
}) {
  const pilula: ViewStyle = { height: D, borderRadius: D / 2, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' };
  if (!isLiquidGlassAvailable()) {
    return (
      <View style={[pilula, { backgroundColor: neutral.white, borderWidth: 1, borderColor: neutral.separator, ...shadow.soft }, style]}>
        {children}
      </View>
    );
  }
  return (
    <GlassView glassEffectStyle="regular" colorScheme="light" isInteractive={interaktivno} style={[pilula, style]}>
      {children}
    </GlassView>
  );
}
