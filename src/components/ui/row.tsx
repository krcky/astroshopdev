import * as React from 'react';
import { View } from 'react-native';

import { Glyph } from '@/components/ui/glyph';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Red u tabeli "simbol — ime — vrednost", i naslov iznad takve tabele.
 *
 * Izdvojeno iz `chart.tsx` kad je isti oblik zatrebao i ekranu "Trenutno na
 * nebu": natalna karta i trenutno nebo prikazuju iste podatke (znak, stepen,
 * kuca, retrogradnost) i moraju da izgledaju isto — inace korisnik pomisli da
 * gleda dve razlicite vrste podatka.
 */

export function RowHead({ children }: { children: React.ReactNode }) {
  return (
    <View className="border-b border-border px-4 py-3">
      <Text variant="label">{children}</Text>
    </View>
  );
}

type RowProps = {
  glyph: string;
  name: string;
  value: string;
  /** Sitan red ispod vrednosti — kod nas broj kuce. */
  extra?: string;
  retro?: boolean;
  /** Podatak koji postoji ali mu se ne veruje (npr. ASC bez vremena rodjenja). */
  muted?: boolean;
  last?: boolean;
};

export function Row({ glyph, name, value, extra, retro, muted, last }: RowProps) {
  return (
    <View className={cn('flex-row items-center px-4 py-3', !last && 'border-b border-border')}>
      <Glyph size={17} className={muted ? 'text-muted-foreground' : 'text-foreground'}>{glyph}</Glyph>
      <Text className={cn('ml-3 flex-1 text-sm', muted && 'text-muted-foreground')}>{name}</Text>
      <View className="items-end">
        <Text className={cn('text-sm', muted && 'text-muted-foreground')}>
          {value}{retro ? '  R' : ''}
        </Text>
        {extra && <Text variant="muted" className="text-xs">{extra}</Text>}
      </View>
    </View>
  );
}

/** Red u tabeli aspekata: "☉ □ ♂   Sunce kvadrat Mars … 1.4°". */
export function AspectRow({ glyphs, label, orb, last }: {
  glyphs: string; label: string; orb: number; last?: boolean;
}) {
  return (
    <View className={cn('flex-row items-center justify-between px-4 py-3',
                        !last && 'border-b border-border')}>
      <View className="flex-row items-center gap-2">
        <Glyph size={15} className="text-foreground">{glyphs}</Glyph>
        <Text className="text-sm">{label}</Text>
      </View>
      <Text variant="muted" className="text-xs">{orb.toFixed(1)}°</Text>
    </View>
  );
}
