import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatDay } from '@/lib/horoscope';
import { daysBetween, dayKey } from '@/lib/transits';
import { dana } from '@/lib/mnozina';

/**
 * Trajanje tranzita: pocetak, "Jos N dana" i traka napretka. Pocetak i kraj su
 * ulazak u orbis i izlazak iz njega (`tvojDanWindow` u `lib/tvoj-dan.ts`).
 * Stoji u listu "Na osnovu cega je ovaj tekst"; sa kartice na pocetnoj je izbacena (Ivan, 28.9.2026).
 */
export function TransitTrajanje({ start, end, date, mesec, className }: {
  start: Date | null;
  end: Date | null;
  date: Date;
  /** Mesec je u orbisu samo dan kad je tacan. */
  mesec: boolean;
  className?: string;
}) {
  if (mesec) {
    return <Text variant="muted" className={cn('mt-4', className)}>Samo danas</Text>;
  }
  const preostalo = end ? daysBetween(dayKey(date), end) : null;
  const desno = preostalo === null ? 'Traje godinama' : preostalo === 0 ? 'Poslednji dan' : `Još ${dana(preostalo)}`;
  const levo = start ? `Od ${formatDay(start, date)}` : 'Traje duže od tri godine';
  const ukupno = start && end ? daysBetween(dayKey(start), end) + 1 : null;
  const proslo = start ? daysBetween(dayKey(start), date) + 1 : null;
  const udeo = ukupno && proslo ? Math.min(1, proslo / ukupno) : null;

  return (
    <View className={cn('mt-4', className)} accessible accessibilityLabel={`${levo}. ${desno}.`}>
      <View className="flex-row justify-between">
        <Text variant="muted">{levo}</Text>
        <Text variant="muted">{desno}</Text>
      </View>
      {udeo !== null && (
        <View className="mt-2 h-1.5 overflow-hidden rounded-pill bg-fill">
          <View className="h-full rounded-pill bg-foreground" style={{ width: `${Math.round(udeo * 100)}%` }} />
        </View>
      )}
    </View>
  );
}
