import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Naslov iznad tabele u kartici ("Aspekti · 12", "Tačke").
 *
 * Redovi ispod njega su u `components/karta-lista.tsx` — natalna karta i
 * trenutno nebo prikazuju iste podatke (znak, stepen, kuca, retrogradnost) i
 * moraju da izgledaju isto, inace korisnik pomisli da gleda dve razlicite
 * vrste podatka. Stari red "simbol — ime — vrednost" (`Row`, `AspectRow`) je
 * uklonjen 28.9.2026, kad je i nebo preslo na ikonice.
 */
export function RowHead({ children }: { children: React.ReactNode }) {
  return (
    <View className="border-b border-border px-4 py-3">
      <Text variant="label">{children}</Text>
    </View>
  );
}
