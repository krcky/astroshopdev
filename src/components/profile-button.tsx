import * as React from 'react';
import { Platform, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { UserRound } from 'lucide-react-native';

import { GlassIconButton } from '@/components/ui/glass-button';
import { useT } from '@/i18n';
import { STARI_IOS } from '@/lib/platform';
import { neutral } from '@/theme/tokens';

/** Native traka tabova postoji samo na iOS-u 26 (`components/tab-stack.tsx`). */
const NATIVE_TRAKA = Platform.OS === 'ios' && !STARI_IOS;

const otvoriProfil = () => router.push('/profile');

/**
 * Profil gore desno u traci (Tranziti, Pitaj, Natalna karta, Nebo — Ivan, 26.9.2026).
 *
 * Na iOS-u 26 je NATIVE stavka trake, isto dugme kao profil na pocetnoj
 * (`home/index.tsx`) — pravo sistemsko staklo (Ivan, 29.9.2026; CLAUDE.md,
 * pravilo 17). Tada ne crta nista u nasem redu: `Stack.Screen` samo upise
 * stavku u traku taba (`(tabs)/<tab>/_layout.tsx`).
 *
 * Android i iOS pre 26: stakleni krug od 40pt, isti pomeraj navise kao logo, da
 * stoje u istoj liniji. Pomeraj nosi omotac, a ne `style` dugmeta: na Androidu je
 * dugme nas `Button`, ciji `style` ide kroz funkciju, a NativeWind je uz
 * `className` tiho odbaci — ikona je stajala 5pt nize nego na pocetnoj.
 */
export function ProfileButton() {
  const t = useT();
  if (NATIVE_TRAKA) {
    return (
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [{
            type: 'button',
            label: t.profil.dugmeProfil,
            icon: { type: 'sfSymbol', name: 'person' },
            accessibilityLabel: t.profil.dugmeProfil,
            sharesBackground: false,
            onPress: otvoriProfil,
          }],
        }}
      />
    );
  }
  return (
    <View style={{ transform: [{ translateY: -5 }] }}>
      <GlassIconButton onPress={otvoriProfil} accessibilityLabel={t.profil.dugmeProfil}>
        <UserRound size={20} color={neutral.ink} />
      </GlassIconButton>
    </View>
  );
}
