import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { UserRound } from 'lucide-react-native';

import { GlassIconButton } from '@/components/ui/glass-button';
import { neutral } from '@/theme/tokens';

/**
 * Profil gore desno u traci (Tranziti, Natalna karta, Nebo — Ivan, 26.9.2026).
 * Stakleni krug od 40pt; isti pomeraj navise kao logo, da stoje u istoj liniji.
 * Pocetna ga ima kao NATIVE stavku iOS trake (`home/index.tsx`), pa ovo ne koristi.
 *
 * Pomeraj nosi omotac, kao na pocetnoj, a ne `style` dugmeta: na Androidu je
 * dugme nas `Button`, ciji `style` ide kroz funkciju, a NativeWind je uz
 * `className` tiho odbaci — ikona je stajala 5pt nize nego na pocetnoj.
 */
export function ProfileButton() {
  return (
    <View style={{ transform: [{ translateY: -5 }] }}>
      <GlassIconButton onPress={() => router.push('/profile')} accessibilityLabel="Profil">
        <UserRound size={20} color={neutral.ink} />
      </GlassIconButton>
    </View>
  );
}
