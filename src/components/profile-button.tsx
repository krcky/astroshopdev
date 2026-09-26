import * as React from 'react';
import { router } from 'expo-router';
import { UserRound } from 'lucide-react-native';

import { GlassIconButton } from '@/components/ui/glass-button';
import { neutral } from '@/theme/tokens';

/**
 * Profil gore desno u traci (Tranziti, Natalna karta, Nebo — Ivan, 26.9.2026).
 * Stakleni krug od 40pt; isti pomeraj navise kao logo, da stoje u istoj liniji.
 * Pocetna ga ima kao NATIVE stavku iOS trake (`home/index.tsx`), pa ovo ne koristi.
 */
export function ProfileButton() {
  return (
    <GlassIconButton
      onPress={() => router.push('/profile')}
      accessibilityLabel="Profil"
      style={{ transform: [{ translateY: -5 }] }}>
      <UserRound size={20} color={neutral.ink} />
    </GlassIconButton>
  );
}
