import * as React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { NatalnaKartaPrikaz } from '@/components/natalna-karta-prikaz';
import { DEV_TOOLS_ENABLED } from '@/store/dev';
import { resolveProfile, type Profile } from '@/store/profile';

/** Isti probni profil kao u `/dev-video` (Beograd, 10.7.1990. 14:30). */
const PROBNI_PROFIL: Profile = {
  name: 'Proba',
  birth: { year: 1990, month: 7, day: 10 },
  time: { hour: 14, minute: 30 },
  cityId: 792680,
  cityName: 'Beograd',
  latitude: 44.804,
  longitude: 20.4651,
  timeZone: 'Europe/Belgrade',
};

/**
 * SAMO ZA RAZVOJ: strana Natalna karta za probni profil, bez naloga — `/dev-karta` (verzija 2),
 * `?v=1` dosadasnja, `?vreme=0` bez vremena rodjenja. Naslove tumacenja salje server samo
 * prijavljenom, pa su bez prijave kartice bez podnaslova.
 */
export default function DevKarta() {
  const { v, vreme } = useLocalSearchParams<{ v?: string; vreme?: string }>();
  const resolved = React.useMemo(
    () => resolveProfile(vreme === '0' ? { ...PROBNI_PROFIL, time: null } : PROBNI_PROFIL),
    [vreme]
  );
  if (!DEV_TOOLS_ENABLED || !resolved) return <Redirect href="/" />;
  return (
    <Screen label="Natalna karta" padded={false} tint="indigo">
      <NatalnaKartaPrikaz resolved={resolved} verzija={v === '1' ? 1 : 2} />
    </Screen>
  );
}
