import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore, usePremium } from '@/store/auth';
import { useDanas } from '@/store/danas';
import { TranzitiLista } from '@/components/tranziti-lista';
import { useOblastiDana } from '@/lib/use-oblasti';
import { BESPLATNO } from '@/lib/pristup';
import { useT } from '@/i18n';

/**
 * Tab "Tranziti": svi tranziti dana po vaznosti, svaki u svojoj kartici
 * (`components/tranziti-lista.tsx`, 28.9.2026). ISTI ekran za sve (Ivan,
 * 29.9.2026): besplatni vidi prvih `BESPLATNO.tranzitiDana`, ostale po imenu
 * pod katancem. Do tada je besplatni imao stari prikaz sa svim kratkim tekstovima.
 */
export default function Daily() {
  const t = useT();
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();
  // Pravo pristupa iskljucivo sa servera (u razvoju i test prekidac iz /profile).
  const premium = usePremium();
  // Tab ostaje montiran: dan se menja u ponoc i pri povratku u aplikaciju.
  const today = useDanas();
  const rez = useOblastiDana(resolved, today);

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !rez) return <Redirect href="/" />;

  return (
    <Screen label={t.danas.tabovi.tranziti} tint="blue" right={<ProfileButton />}>
      <TranzitiLista rez={rez} date={today} besplatno={premium ? undefined : BESPLATNO.tranzitiDana} />
    </Screen>
  );
}
