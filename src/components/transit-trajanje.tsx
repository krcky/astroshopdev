import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatDay, opsegDatuma } from '@/lib/horoscope';
import { daysBetween, dayKey } from '@/lib/transits';
import { trajanjeTekst, type Trajanje } from '@/lib/oblasti';

/**
 * Trajanje tranzita: pocetak, "Jos N dana" i traka napretka. Pocetak i kraj su
 * ulazak u orbis i izlazak iz njega; racuna ih ISKLJUCIVO `trajanjeTranzita`
 * (`lib/oblasti.ts`), a natpis desno je isti kao na listi (`trajanjeTekst`).
 * Stoji u listu "Zašto baš ovaj tekst"; sa kartice na pocetnoj je izbacena (Ivan, 28.9.2026).
 */
export function TransitTrajanje({ trajanje, date, className, boja, opseg = false }: {
  trajanje: Trajanje;
  /** Dan za koji je `trajanje` racunato. */
  date: Date;
  className?: string;
  /** Boja ispune trake; bez nje crna (`foreground`). */
  boja?: string;
  /** Levo opseg "13. sep – 26. sep" umesto "Od 13. sep" (list tranzita i "Zašto baš ovaj tekst"). */
  opseg?: boolean;
}) {
  const { start, end, mesec } = trajanje;
  if (mesec) {
    return <Text variant="muted" className={cn('mt-4', className)}>{trajanjeTekst(trajanje)}</Text>;
  }
  const desno = trajanjeTekst(trajanje);
  const levo = opseg && start && end ? opsegDatuma(start, end)
    : start ? `Od ${formatDay(start, date)}` : 'Traje duže od tri godine';
  const ukupno = start && end ? daysBetween(dayKey(start), end) + 1 : null;
  const proslo = start ? daysBetween(dayKey(start), date) + 1 : null;
  const udeo = ukupno && proslo ? Math.min(1, proslo / ukupno) : null;

  return <TrakaNapretka levo={levo} desno={desno} udeo={udeo} boja={boja} className={className}
    levoVariant={opseg && start && end ? 'oznaka' : 'muted'} />;
}

/**
 * Traka napretka sa natpisom levo i desno — oblik trajanja tranzita, izdvojen
 * da ga natalno tumacenje (polozaj u znaku, tacnost aspekta) nosi ISTI.
 * Bez `udeo` samo natpisi.
 */
export function TrakaNapretka({ levo, desno, udeo, boja, className, levoVariant = 'muted' }: {
  levo: string;
  desno: string;
  udeo: number | null;
  /** Boja ispune trake; bez nje crna (`foreground`). */
  boja?: string;
  className?: string;
  /** Stil levog natpisa; opseg datuma na listu tranzita ide kao `oznaka` (Ivan, 28.9.2026). */
  levoVariant?: React.ComponentProps<typeof Text>['variant'];
}) {
  return (
    <View className={cn('mt-4', className)} accessible accessibilityLabel={`${levo}. ${desno}.`}>
      {/* Poravnato po DNU slova (osnovna linija), iako su natpisi razlicite velicine (Ivan, 28.9.2026). */}
      <View className="flex-row items-baseline justify-between">
        <Text variant={levoVariant}>{levo}</Text>
        <Text variant="muted">{desno}</Text>
      </View>
      {udeo !== null && (
        <View className="mt-2 h-1.5 overflow-hidden rounded-pill bg-fill">
          <View
            className={cn('h-full rounded-pill', !boja && 'bg-foreground')}
            style={{ width: `${Math.round(udeo * 100)}%`, backgroundColor: boja }}
          />
        </View>
      )}
    </View>
  );
}
