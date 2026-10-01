import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';

/**
 * Broj kuce u kruzicu sa sivim obrisom — lista planeta na ekranu "Ti" i
 * "Simbolika" na listu tumacenja (kao na sajtu, Ivan 28.9.2026). Obris je
 * `border-fill-strong`, isti sivi kao obris ikonica planeta.
 */
export function KucaBroj({ kuca, size = 24 }: { kuca: number; size?: number }) {
  const t = useT();
  return (
    <View
      className="items-center justify-center rounded-full border border-fill-strong"
      style={{ width: size, height: size }}
      accessibilityLabel={t.karta.kuca(kuca)}>
      <Text variant="caption" className="text-foreground" style={{ fontSize: Math.round(size * 0.46), lineHeight: size - 2 }}>
        {kuca}
      </Text>
    </View>
  );
}
