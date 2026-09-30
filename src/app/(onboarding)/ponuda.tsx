import * as React from 'react';
import { Stack } from 'expo-router';

import { PaywallEkran } from '@/app/premium';

/**
 * Pretposlednji korak onboardinga (Ivan, 29.9.2026): Premium POSLE obavestenja —
 * dozvola za obavestenja se trazi dok je korisnik jos raspolozen. Paywall se
 * zatvara u prvu pricu dana (`prva-prica.tsx`, 30.9.2026), a ona u aplikaciju. Isti paywall kao `/premium`, ali preko celog
 * ekrana; X je tu od prvog trenutka (Apple ne dozvoljava paywall koji se ne
 * preskace). Ko vec ima Premium ovaj korak ne vidi (`push.tsx`).
 *
 * Paketi: dok RevenueCat ne stigne, probni (`lib/kupovina.ts`, `PROBNE_CENE`).
 */
export default function Ponuda() {
  return (
    <>
      {/* Paywall ima svoj X — native traka onboardinga (strelica, "Preskoči") ovde ne treba. */}
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <PaywallEkran uOnboardingu />
    </>
  );
}
