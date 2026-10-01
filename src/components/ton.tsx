import * as React from 'react';
import { View } from 'react-native';
import { Diff, Minus, Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import type { Tone } from '@/lib/tone';
import { useT } from '@/i18n';

/* Boje "Ide ti" (plus) i "Koci te" (minus) su u `lib/tocak-stil.ts` — deli ih tocak. */
import { MINUS_BOJA, PLUS_BOJA } from '@/lib/tocak-stil';
export { MINUS_BOJA, PLUS_BOJA };

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
  const t = useT();
  const { Ikona, boja } = IKONA[tone];
  return (
    <View className={cn('flex-row items-center gap-1', className)}>
      <Ikona size={13} color={boja} strokeWidth={3} />
      {/* 13pt, sitnije od imena tranzita (Ivan, 28.9.2026) — isto kao trajanje pored. */}
      <Text variant="caption">{t.danas.ton[tone]}</Text>
    </View>
  );
}
