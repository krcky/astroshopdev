import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { useT } from '@/i18n';

/**
 * Broj kuce u kruzicu sa sivim obrisom — lista planeta na ekranu "Ti" i
 * "Simbolika" na listu tumacenja (kao na sajtu, Ivan 28.9.2026). Obris je
 * `border-fill-strong`, isti sivi kao obris ikonica planeta.
 */
export function KucaBroj({ kuca, size = 24, puna }: {
  kuca: number;
  size?: number;
  /**
   * PUN lila krug sa belim, debelim brojem, podignutim 1 pt (Ivan, 13.10.2026; bledo sivi krug sa indigo brojem proban istog dana i vracen) — spisak pozicija probne verzije 2 natalne karte.
   * `slova` je velicina broja: ne prati `size`, da krug moze da bude manji a broj isti.
   */
  puna?: { slova: number };
}) {
  const t = useT();
  if (puna) {
    return (
      <View className="items-center justify-center rounded-full"
        style={{ width: size, height: size, backgroundColor: OBLAST_BOJA }}
        accessibilityLabel={t.karta.kuca(kuca)}>
        <Text variant="caption" className="font-extrabold text-white" style={{ fontSize: puna.slova, lineHeight: size, marginTop: -1 }}>
          {kuca}
        </Text>
      </View>
    );
  }
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
