import * as React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Glyph } from '@/components/ui/glyph';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

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
  /** Ikonica umesto simbola (znak zodijaka — `ZnakIkona`); tada se `glyph` ne crta. */
  icon?: React.ReactNode;
  name: string;
  value: string;
  /** Sitan red ispod vrednosti — kod nas broj kuce. */
  extra?: string;
  retro?: boolean;
  /** Podatak koji postoji ali mu se ne veruje (npr. ASC bez vremena rodjenja). */
  muted?: boolean;
  last?: boolean;
  /** Red vodi na tumacenje; tada dobija strelicu. Bez `onPress` je obican red. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Okvir reda: `Pressable` sa strelicom kad red nekud vodi, inace obican `View`. */
function Okvir({ onPress, accessibilityLabel, last, className, children }: {
  onPress?: () => void; accessibilityLabel?: string; last?: boolean; className: string; children: React.ReactNode;
}) {
  const klasa = cn(className, !last && 'border-b border-border');
  if (!onPress) return <View className={klasa}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      className={cn(klasa, 'active:opacity-60')}>
      {children}
      <ChevronRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} style={{ marginLeft: 8 }} />
    </Pressable>
  );
}

export function Row({ glyph, icon, name, value, extra, retro, muted, last, onPress, accessibilityLabel }: RowProps) {
  return (
    <Okvir onPress={onPress} accessibilityLabel={accessibilityLabel} last={last} className="flex-row items-center px-4 py-3">
      {icon ?? <Glyph size={17} className={muted ? 'text-muted-foreground' : 'text-foreground'}>{glyph}</Glyph>}
      <Text className={cn('ml-3 flex-1 text-sm', muted && 'text-muted-foreground')}>{name}</Text>
      <View className="items-end">
        <Text className={cn('text-sm', muted && 'text-muted-foreground')}>
          {value}{retro ? '  R' : ''}
        </Text>
        {extra && <Text variant="muted" className="text-xs">{extra}</Text>}
      </View>
    </Okvir>
  );
}

/** Red u tabeli aspekata: "☉ □ ♂   Sunce kvadrat Mars … 1.4°". */
export function AspectRow({ glyphs, label, orb, last, onPress }: {
  glyphs: string; label: string; orb: number; last?: boolean; onPress?: () => void;
}) {
  return (
    <Okvir onPress={onPress} accessibilityLabel={label} last={last} className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-2">
        <Glyph size={15} className="text-foreground">{glyphs}</Glyph>
        <Text className="text-sm">{label}</Text>
      </View>
      <Text variant="muted" className="ml-auto text-xs">{orb.toFixed(1)}°</Text>
    </Okvir>
  );
}
