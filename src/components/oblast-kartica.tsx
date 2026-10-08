import * as React from 'react';
import { View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { OcenaTackice } from '@/components/ocena-oblasti';
import { PREMIUM } from '@/components/zakljucano';
import { neutralnaRecenica } from '@/lib/krug-tekst';
import type { KrugOblast } from '@/lib/krug';
import { useT } from '@/i18n';
import { brand } from '@/theme/tokens';

/**
 * Kartica ispod kruga: izabrana oblast — stanje, tackice i recenica za DANAS (Ivan, 8.10.2026: "samo danas
 * i rezultat"), pa "Saznaj više" koje otvara ceo list oblasti (`app/oblast.tsx`). Oblast koja je pod
 * katancem (besplatni) pokazuje stanje i tackice, a umesto recenice poruku o Premium-u.
 */
export function OblastKartica({ oblast, otvorena, recenica, onSaznaj }: {
  oblast: KrugOblast;
  otvorena: boolean;
  /** Recenica za danas; bez nje "Danas nema jakog uticaja na ovu oblast." */
  recenica: string | null;
  onSaznaj: () => void;
}) {
  const t = useT();
  return (
    <View className={`${CARD_SURFACE} p-4`}>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="h3" numberOfLines={1} className="flex-1">{t.krug.oblasti[oblast.def.key]}</Text>
        <View className="flex-row items-center gap-2 rounded-pill bg-fill px-3 py-1.5">
          <Text variant="chip" style={{ color: brand.indigo }}>{t.krug.stanja[oblast.stanje]}</Text>
          <OcenaTackice ocena={oblast.ocena} />
        </View>
      </View>

      <Text variant="oznaka" className="mt-4">{t.krug.danas}</Text>
      {otvorena ? (
        <Text variant="default" className="mt-1.5 text-[17px] leading-[24px]">{recenica ?? neutralnaRecenica(oblast.def.key) ?? t.krug.nemaUticaja}</Text>
      ) : (
        <View className="mt-1.5 flex-row items-center gap-2">
          <Lock size={16} color={PREMIUM} />
          <Text variant="body" className="flex-1">{t.krug.zakljucanaRecenica}</Text>
        </View>
      )}

      <View className="mt-4 self-start">
        <Button size="compact" istaknuto className="h-auto px-5 py-[10px]" onPress={onSaznaj}>
          <Text className="text-[16px] leading-[20px]">{t.krug.saznajVise}</Text>
        </Button>
      </View>
    </View>
  );
}
