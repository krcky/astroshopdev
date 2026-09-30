import * as React from 'react';
import { Stack } from 'expo-router';

import { PricaDanaEkran } from '@/app/prica';

/**
 * Korak onboardinga (Ivan, 30.9.2026): prva DNEVNA PRICA, posle imena a PRE obavestenja
 * (`push.tsx`) i paywalla (`ponuda.tsx`) — prvo vrednost, pa zahtevi. Ista prica kao sa
 * pocetne, u rezimu `uvod`: bez zaglavlja, X i deljenja, a na kraju "Nastavi" vodi na
 * obavestenja.
 * Pravilo 23 u CLAUDE.md.
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
