import * as React from 'react';
import { Stack } from 'expo-router';

import { PaywallEkran } from '@/app/premium';

/**
 * Poslednji korak onboardinga (Ivan, 29.9.2026): Premium POSLE prve price dana
 * (`prva-prica.tsx`) i obavestenja (redosled od 30.9.2026) — korisnik je upravo video
 * svoj dan u kratkoj verziji, pa paywall ima na sta da se pozove. Zatvara se u aplikaciju. Isti paywall kao `/premium`, ali preko celog
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
