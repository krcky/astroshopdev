import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { TONE_COLOR } from '@/components/tone-badge';
import { cn } from '@/lib/utils';
import { TONE_LABEL, type Tone } from '@/lib/tone';

/**
 * Kapsula tona RECJU — "Povoljno" / "Izazovno" / "Mešovito". Na ekranu
 * "Tranziti" rec je namerna: kaze zasto tranzit dize ili spusta ocenu oblasti.
 * Boje su iste kao na kruzicu "Tvog dana" (`tone-badge.tsx`).
 */
export function TonOznaka({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <View
      className={cn('self-start rounded-pill px-2.5 py-0.5', className)}
      style={{ backgroundColor: TONE_COLOR[tone] }}>
      <Text variant="caption" className="font-medium text-foreground">{TONE_LABEL[tone]}</Text>
    </View>
  );
}
