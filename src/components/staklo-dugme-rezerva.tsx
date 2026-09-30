import * as React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { GlassBubble } from '@/components/ui/glass-button';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

export type StakloDugmeProps = {
  tekst: string;
  /** SF Symbol za pravo staklo (iOS 26). */
  sfIkona?: string;
  /** Ikonica za rezervu (Android, iOS < 26) — lucide, iste namene kao `sfIkona`. */
  ikona?: React.ReactNode;
  /** Strelica uz natpis: "‹ dan" / "sat ›". Tada ikonica nije potrebna. */
  strelica?: 'levo' | 'desno';
  onPress: () => void;
  disabled?: boolean;
  /** Deli sirinu reda sa ostalima (koraci vremena). */
  siroko?: boolean;
  accessibilityLabel: string;
};

const IKONA = 18;

/**
 * REZERVA staklenog dugmeta (Android, iOS pre 26, veb): nas `GlassBubble` —
 * `GlassView` gde postoji, inace bela pilula sa senkom. Na iOS-u 26 je pravo
 * sistemsko staklo (`staklo-dugme.ios.tsx`).
 */
export function StakloDugmeRezerva({ tekst, ikona, strelica, onPress, disabled, siroko, accessibilityLabel }: StakloDugmeProps) {
  const Strelica = strelica === 'levo' ? ChevronLeft : ChevronRight;
  return (
    <GlassBubble interaktivno={!disabled} style={siroko ? { flex: 1 } : undefined}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={disabled ? { disabled: true } : undefined}
        hitSlop={{ top: 2, bottom: 2 }}
        className={cn(
          'h-full items-center gap-2 active:opacity-60',
          siroko ? 'w-full justify-center gap-0' : 'px-4',
          strelica === 'desno' ? 'flex-row-reverse' : 'flex-row',
        )}>
        {strelica ? <Strelica size={IKONA} color={neutral.ink} strokeWidth={2.2} /> : ikona}
        <View>
          <Text variant="chip" numberOfLines={1} className={cn(disabled && 'text-muted-foreground')}>{tekst}</Text>
        </View>
      </Pressable>
    </GlassBubble>
  );
}
