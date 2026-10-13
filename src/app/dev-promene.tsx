import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { PromenaNaNebu } from '@/components/promena-na-nebu';
import { istakniPromenu, upcomingSkyEvents } from '@/lib/sky-events';
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
 * SAMO ZA RAZVOJ: kartice "Promene na nebu" za probni profil, bez naloga — `/dev-promene`;
 * `?dan=2026-10-20` bira dan (tog dana je medju tri i retrogradni Merkur, pa je on velika kartica).
 */
export default function DevPromene() {
  const { dan } = useLocalSearchParams<{ dan?: string }>();
  const today = React.useMemo(() => (dan ? new Date(`${dan}T12:00:00`) : new Date()), [dan]);
  const resolved = React.useMemo(() => resolveProfile(PROBNI_PROFIL), []);
  const promene = React.useMemo(
    () => (resolved ? istakniPromenu(upcomingSkyEvents(resolved.chart, today, resolved.timeUnknown)) : []),
    [resolved, today]
  );
  if (!DEV_TOOLS_ENABLED || !resolved) return <Redirect href="/" />;
  return (
    <Screen label="Promene na nebu">
      <View className="gap-3">
        {promene.map((e, i) => <PromenaNaNebu key={e.planet.key} e={e} today={today} velika={i === 0} />)}
      </View>
    </Screen>
  );
}
