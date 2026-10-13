import * as React from 'react';
import { Redirect } from 'expo-router';

import { OstaloSadrzaj } from '@/components/ostalo/sadrzaj';
import { ProfileButton } from '@/components/profile-button';
import { Screen } from '@/components/screen';
import { SIGNS } from '@/lib/zodiac';
import { DEV_TOOLS_ENABLED } from '@/store/dev';

/**
 * SAMO DEV: sadrzaj taba "Ostalo" bez naloga i bez tabova (`/dev-ostalo`), sa znakom Lav. Kartice vode na prave
 * ekrane (`/uporedni?dev=leo` zadaje znak i tamo). Pravi tab je `app/(tabs)/ostalo`.
 */
export default function DevOstalo() {
  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;
  return (
    <Screen label="Ostalo" right={<ProfileButton />}>
      <OstaloSadrzaj znak={SIGNS.find((s) => s.key === 'leo') ?? null} />
    </Screen>
  );
}
