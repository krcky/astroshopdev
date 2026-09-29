import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Podnaslov sekcije na listovima odozdo — tumacenje tranzita (`transit.tsx`),
 * natalno tumacenje (`natal.tsx`) i "Šta je natalna karta" (`natalna-karta-info.tsx`).
 *
 * Stil je `h2` — isti koji je do 28.9.2026 imao NASLOV lista "Šta je natalna
 * karta"; naslov lista je od tada `naslovLista` (Ivan: "naslov veci, a stil naslova
 * za podnaslove sekcija, svuda"). Ranije je podnaslov bio sivi `label`.
 *
 * Linija ispod: list je beo, pa `border-border` (pravilo 17). `ikona` stoji levo.
 */
export function NaslovSekcije({ children, ikona }: { children: string; ikona?: React.ReactNode }) {
  return (
    <View className="mb-3 flex-row items-center gap-2 border-b border-border pb-2">
      {ikona}
      <Text variant="h2" className="flex-1">{children}</Text>
    </View>
  );
}
