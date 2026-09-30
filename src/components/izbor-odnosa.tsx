import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { ODNOSI, type OdnosKljuc } from '@/lib/osobe';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/**
 * "Ko ti je": redovi sa kvacicom uz izabran (korak nove osobe i list izmene,
 * 29.9.2026). Na sivoj pozadini redovi su u beloj kartici; na belom listu
 * (`naBelom`) samo linije izmedju njih.
 */
export function IzborOdnosa({ izabran, onIzbor, naBelom = false }: {
  izabran: OdnosKljuc | null;
  onIzbor: (k: OdnosKljuc) => void;
  naBelom?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" className={cn(!naBelom && cn(CARD_SURFACE, 'overflow-hidden'))}>
      {ODNOSI.map((o, i) => {
        const da = o.key === izabran;
        return (
          <Pressable
            key={o.key}
            onPress={() => onIzbor(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: da }}
            className={cn(
              'min-h-row flex-row items-center py-3 active:opacity-60',
              naBelom ? 'px-1' : 'px-4',
              i > 0 && 'border-t border-border',
            )}>
            <Text variant="row" className="flex-1">{o.naziv}</Text>
            {da && <Check size={20} color={neutral.ink} strokeWidth={2.4} />}
          </Pressable>
        );
      })}
    </View>
  );
}
