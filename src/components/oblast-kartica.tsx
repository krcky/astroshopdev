import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Lock, X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { OcenaTackice } from '@/components/ocena-oblasti';
import { PREMIUM } from '@/components/zakljucano';
import { neutralnaRecenica } from '@/lib/krug-tekst';
import type { KrugOblast } from '@/lib/krug';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';

/**
 * Sadrzaj STAKLENE kartice koja se otvori kad se dodirne isecak kruga zivota (Ivan, 12.10.2026; do tada je
 * kartica stalno stajala ispod kruga): oblast, stanje i tackice, recenica za DANAS, pa "Saznaj više" koje
 * otvara ceo list oblasti (`app/oblast.tsx`). Staklo i polozaj daje `KrugZivota` (kao `TockPopover` na
 * astroloskom krugu). Oblast pod katancem (besplatni) pokazuje stanje i tackice, a umesto recenice poruku o Premium-u.
 */
export function OblastKartica({ oblast, otvorena, recenica, onSaznaj, onZatvori }: {
  oblast: KrugOblast;
  otvorena: boolean;
  /** Recenica za danas; bez nje "Danas nema jakog uticaja na ovu oblast." */
  recenica: string | null;
  onSaznaj: () => void;
  onZatvori: () => void;
}) {
  const t = useT();
  return (
    <View>
      <View className="flex-row items-center gap-2">
        <Text variant="h3" numberOfLines={1} className="flex-shrink">{t.krug.oblasti[oblast.def.key]}</Text>
        <Pressable
          onPress={onZatvori}
          accessibilityRole="button"
          accessibilityLabel={t.karta.tockDodir.zatvori}
          hitSlop={10}
          className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-fill active:opacity-70">
          <X size={12} color={neutral.inkSubtle} strokeWidth={2.6} />
        </Pressable>
      </View>
      <View className="mt-1.5 flex-row items-center gap-2">
        <Text variant="chip" style={{ color: brand.indigo }}>{t.krug.stanja[oblast.stanje]}</Text>
        <OcenaTackice ocena={oblast.ocena} />
      </View>

      {otvorena ? (
        <Text variant="default" className="mt-2.5 text-[15px] leading-[21px]">{recenica ?? neutralnaRecenica(oblast.def.key) ?? t.krug.nemaUticaja}</Text>
      ) : (
        <View className="mt-2.5 flex-row items-center gap-2">
          <Lock size={14} color={PREMIUM} />
          <Text variant="body" className="flex-1 text-[14px] leading-[20px]">{t.krug.zakljucanaRecenica}</Text>
        </View>
      )}

      <View className="mt-3 self-start">
        <Button size="compact" istaknuto className="h-auto px-4 py-2" onPress={onSaznaj}>
          <Text className="text-[14px] leading-[18px]">{t.krug.saznajVise}</Text>
        </Button>
      </View>
    </View>
  );
}
