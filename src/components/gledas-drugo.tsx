import * as React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Traka "ne gledas sada" (UX recenzija 1.10.2026): pocetna sa izabranim drugim danom
 * i Nebo sa pomerenim vremenom. Do tada je drugi dan pokazivao samo sitan nadnaslov,
 * pa se sutrasnji tekst citao kao danasnji. Ista traka na oba mesta, sa jednim
 * dugmetom nazad.
 */
export function GledasDrugo({ tekst, dugme, onPress, className }: {
  tekst: string;
  dugme: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <View
      accessibilityRole="summary"
      className={cn(CARD_SURFACE, 'flex-row items-center gap-3 py-2 pl-4 pr-2', className)}>
      <Text variant="row" className="flex-1" numberOfLines={2}>{tekst}</Text>
      <Button size="sm" variant="secondary" onPress={onPress} accessibilityLabel={dugme}>
        <Text>{dugme}</Text>
      </Button>
    </View>
  );
}
