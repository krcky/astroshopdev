import * as React from 'react';
import { View } from 'react-native';
import { Diff, Minus, Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { TONE_LABEL, type Tone } from '@/lib/tone';

/**
 * Boje ikonica "Ide ti" (plus) i "Koci te" (minus) na pocetnoj — Ivanove.
 * Ton na tabu "Tranziti" koristi ISTE ikonice, pa je znacenje jedno.
 */
export const PLUS_BOJA = '#7ACCEA';
export const MINUS_BOJA = '#F8B3C3';

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
      <Ikona size={15} color={boja} strokeWidth={3} />
      <Text variant="muted">{TONE_LABEL[tone]}</Text>
    </View>
  );
}
