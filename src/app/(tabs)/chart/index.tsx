import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { NatalnaKartaPrikaz } from '@/components/natalna-karta-prikaz';
import { TvojiLjudi } from '@/components/tvoji-ljudi';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useOsveziOsobe } from '@/lib/osobe-api';

/**
 * Tab "Ti": korisnikova natalna karta (`components/natalna-karta-prikaz.tsx`) i,
 * posle velike trojke, "Tvoji ljudi" — druge osobe (29.9.2026, `app/osoba.tsx`).
 */
export default function ChartScreen() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();
  // Spisak osoba se osvezi sa servera pri svakom dolasku na tab (dodate na drugom telefonu).
  const osveziOsobe = useOsveziOsobe();
  useFocusEffect(osveziOsobe);

  if (!hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  return (
    <Screen label="Natalna karta" padded={false} tint="indigo" right={<ProfileButton />}>
      <NatalnaKartaPrikaz resolved={resolved} posleTrojke={<TvojiLjudi className="mx-5 mt-4" />} />
    </Screen>
  );
}
