import * as React from 'react';
import { Stack } from 'expo-router';

import { PricaZnakaEkran } from '@/app/prica-znak';

/**
 * Korak onboardinga (Ivan, 30.9.2026): prva PRICA, posle imena a PRE obavestenja (`push.tsx`) i
 * paywalla (`ponuda.tsx`) — prvo vrednost, pa zahtevi. Od 1.10.2026 (Ivan) to je PRICA O ZNAKU
 * (pravilo 25) umesto dnevne, po istim pravilima: rezim `uvod` — bez zaglavlja, X i deljenja,
 * mora se odgledati, a na kraju "Nastavi" vodi na obavestenja.
 * Pravila 23 i 25 u CLAUDE.md.
 */
export default function PrvaPrica() {
  return (
    <>
      {/* Prica crta sve sama — native traka onboardinga (strelica, "Preskoči") ovde ne treba. */}
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <PricaZnakaEkran uvod />
    </>
  );
}
