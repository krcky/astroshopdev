import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { NatalnaKartaPrikaz } from '@/components/natalna-karta-prikaz';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useT } from '@/i18n';

/**
 * Tab "Ti": korisnikova natalna karta (`components/natalna-karta-prikaz.tsx`).
 * Druge osobe ("Tvoji ljudi") su na profilu (Ivan, 29.9.2026), ne ovde.
 */
export default function ChartScreen() {
  const t = useT();
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();

  if (!hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  return (
    <Screen label={t.karta.ti.naslov} padded={false} tint="indigo" right={<ProfileButton />}>
      <NatalnaKartaPrikaz resolved={resolved} />
    </Screen>
  );
}
