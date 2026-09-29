import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Dve (ili vise) strane jednog ekrana, podvucena izabrana — "Pitaj čoveka / Pitaj
 * AI" na tabu Pitaj, "Karta / Danas" na strani osobe (29.9.2026). Linija stoji
 * direktno na sivom, pa `border-fill-strong` (pravilo 17).
 */
export function PodvuceniTabovi<K extends string>({ stavke, izabrana, onIzbor, className }: {
  stavke: readonly { key: K; natpis: string; oznaka?: string }[];
  izabrana: K;
  onIzbor: (k: K) => void;
  className?: string;
}) {
  return (
    <View accessibilityRole="tablist" className={cn('flex-row border-b border-fill-strong', className)}>
      {stavke.map((s) => {
        const aktivna = s.key === izabrana;
        return (
          <Pressable
            key={s.key}
            onPress={() => onIzbor(s.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktivna }}
            accessibilityLabel={s.oznaka ? `${s.natpis}, ${s.oznaka}` : s.natpis}
            className={cn('-mb-px flex-1 flex-row items-center justify-center gap-1.5 pb-3 pt-2', aktivna && 'border-b-2 border-foreground')}>
            <Text variant="row" className={cn(!aktivna && 'text-muted-foreground')}>{s.natpis}</Text>
            {s.oznaka && <Text variant="caption" className="text-subtle">{s.oznaka}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
