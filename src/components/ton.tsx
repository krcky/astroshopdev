import * as React from 'react';
import { View } from 'react-native';
import { Diff, Minus, Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { TONE_LABEL, type Tone } from '@/lib/tone';

/* Boje "Ide ti" (plus) i "Koci te" (minus) su u `lib/tocak-stil.ts` — deli ih tocak. */
import { MINUS_BOJA, PLUS_BOJA } from '@/lib/tocak-stil';
export { MINUS_BOJA, PLUS_BOJA };
/**
 * Iste boje u tamnijem tonu, SAMO za TEKST (UX recenzija 1.10.2026): svetlo plava i roze
 * na beloj imaju kontrast ~1,7:1, a sitan tekst trazi bar 4,5:1. Ikonice, trake i
 * pozadine ostaju u `PLUS_BOJA` / `MINUS_BOJA`.
 */
export const PLUS_TEKST = '#1F6F8B'; // 5,7:1 na beloj
export const MINUS_TEKST = '#C2416B'; // 4,9:1 na beloj

/**
 * Ton bez obojene kapsule (Ivan, 28.9.2026): ikonica pa rec, u redu sa
 * trajanjem. Povoljno = plus, Izazovno = minus (kao "Ide ti" / "Koci te"),
 * Mesovito = ± u sivoj — ni jedno ni drugo.
 */
const IKONA: Record<Tone, { Ikona: typeof Plus; boja: string }> = {
  povoljno: { Ikona: Plus, boja: PLUS_BOJA },
  izazovno: { Ikona: Minus, boja: MINUS_BOJA },
  mesovito: { Ikona: Diff, boja: neutral.inkSubtle },
};

export function TonOznaka({ tone, className }: { tone: Tone; className?: string }) {
  const { Ikona, boja } = IKONA[tone];
  return (
    <View className={cn('flex-row items-center gap-1', className)}>
      <Ikona size={13} color={boja} strokeWidth={3} />
      {/* 13pt, sitnije od imena tranzita (Ivan, 28.9.2026) — isto kao trajanje pored. */}
      <Text variant="caption">{TONE_LABEL[tone]}</Text>
    </View>
  );
}
