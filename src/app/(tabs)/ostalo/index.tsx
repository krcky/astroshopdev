import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { OstaloSadrzaj } from '@/components/ostalo/sadrzaj';
import { ProfileButton } from '@/components/profile-button';
import { Screen } from '@/components/screen';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useT } from '@/i18n';

/**
 * Tab "Ostalo" (Ivan, 14.10.2026; do tada peti tab je bio "Nebo"): Uporedni horoskop, Trenutno na nebu i Proizvodi
 * (`components/ostalo/sadrzaj.tsx`). Nebo je od tada obican ekran (`app/nebo.tsx`), a lista proizvoda objedinjuje
 * ono sto se kupuje u aplikaciji i ono sto vodi na sajt (`lib/proizvodi.ts`).
 */
export default function OstaloTab() {
  const t = useT();
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();

  if (!hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  return (
    <Screen label={t.ostalo.naslov} right={<ProfileButton />}>
      <OstaloSadrzaj />
    </Screen>
  );
}
