import * as React from 'react';
import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';

import { ProfilAvatar, profilStavka, type Znaci } from '@/components/profil-avatar';
import type { NativeStackHeaderItem } from 'expo-router';
import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { SIGNS } from '@/lib/zodiac';
import { DEV_TOOLS_ENABLED } from '@/store/dev';

/**
 * SAMO DEV: avatar profila (`components/profil-avatar.tsx`) za svih 12 znakova Sunca — veliko i u
 * stvarnoj velicini, sa podznakom i bez njega — i prava native stavka u traci gore desno
 * (Lav / Ribe). Za proveru centriranja znaka u krugu i kruga u balonu.
 */
export default function DevAvatar() {
  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;
  const znak = (k: string) => SIGNS.find((s) => s.key === k)!;
  const probni: Znaci = { sunce: znak('leo'), podznak: znak('pisces') };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          title: '',
          // Kalendar kao na pocetnoj: poredjenje mesta, velicine i ivica sistemskih balona.
          unstable_headerRightItems: (): NativeStackHeaderItem[] => [
            { type: 'button', label: 'Kalendar', icon: { type: 'sfSymbol', name: 'calendar' }, sharesBackground: false, onPress: () => {} },
            ...profilStavka(probni),
          ],
        }}
      />
      <Screen label="Avatar" padded>
        <Text variant="muted">Svih 12 Sunca, podznak je sledeci znak po redu. Gore desno: kalendar i avatar, oba u sistemskom balonu.</Text>
        <View className="mt-4 flex-row flex-wrap gap-5">
          {SIGNS.map((s, i) => {
            const uzorak: Znaci = { sunce: s, podznak: SIGNS[(i + 5) % 12] };
            return (
              <View key={s.key} className="items-center gap-1">
                <View className="rounded-full border border-fill-strong bg-white" style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
                  <ProfilAvatar size={72} uzorak={uzorak} />
                </View>
                <Text variant="caption">{s.key}</Text>
              </View>
            );
          })}
        </View>
        <Text variant="muted" className="mt-6">Stvarna velicina (36 pt) i bez podznaka:</Text>
        <View className="mt-3 flex-row flex-wrap gap-4">
          {SIGNS.map((s) => (
            <View key={s.key} className="rounded-full border border-fill-strong bg-white" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <ProfilAvatar size={36} uzorak={{ sunce: s, podznak: null }} />
            </View>
          ))}
        </View>
      </Screen>
    </>
  );
}
