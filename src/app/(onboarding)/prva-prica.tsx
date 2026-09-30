import * as React from 'react';
import { Stack } from 'expo-router';

import { PricaDanaEkran } from '@/app/prica';

/**
 * Poslednji korak onboardinga (Ivan, 30.9.2026): prva DNEVNA PRICA, posle paywalla
 * (`ponuda.tsx`; ko vec ima Premium dolazi pravo iz `push.tsx`). Ista prica kao sa
 * pocetne, u rezimu `uvod`: bez zaglavlja, X i deljenja, a na kraju "Počinjemo"
 * vodi na kapiju. Pravilo 23 u CLAUDE.md.
 */
export default function PrvaPrica() {
  return (
    <>
      {/* Prica crta sve sama — native traka onboardinga (strelica, "Preskoči") ovde ne treba. */}
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <PricaDanaEkran uvod />
    </>
  );
}
