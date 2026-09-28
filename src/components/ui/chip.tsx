import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { tezina } from '@/theme/tipografija';

/**
 * Kapsula kategorije — vodoravni niz izbora ("Family", "Tech", "Food & Drink").
 *
 * Visina 40pt, ivica od 1pt u boji razdvajanja, bela ispuna. Izabrana kapsula
 * se NE boji: referentna aplikacija je samo ispuni sivim (#F5F5F5) i podeblja
 * natpis. Obojena kapsula bi se tukla sa kvadraticima ikona, koji su jedino
 * mesto za boju.
 */
type ChipProps = {
  label: string;
  /** Ikona levo od natpisa. U referentnoj aplikaciji je jedini obojen deo. */
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Chip({ label, icon, selected, onPress, className }: ChipProps) {
  const Okvir = onPress ? Pressable : View;
  return (
    <Okvir
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={selected ? { selected: true } : undefined}
      className={cn(
        'h-chip flex-row items-center gap-2 rounded-pill border border-border px-4',
        selected ? 'bg-fill' : 'bg-background',
        onPress && 'active:opacity-70',
        className
      )}>
      {icon}
      <Text variant="chip" className={cn(selected && tezina('chipIzabran'))}>
        {label}
      </Text>
    </Okvir>
  );
}
