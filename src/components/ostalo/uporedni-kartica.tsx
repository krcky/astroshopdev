import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Heart, Plus } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ZnakIkona } from '@/components/znak-ikona';
import type { ZodiacSign } from '@/lib/zodiac';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';

const KRUG = 60;

/**
 * Velika kartica "Uporedni horoskop" na vrhu taba "Ostalo" (Ivan, 14.10.2026: ono sto ljudi najvise vole, zato je
 * prva i najveca). Levo korisnikov znak, desno prazan krug "Izaberi znak"; i krug i dugme vode na `/uporedni`.
 * Bez pouzdanog znaka (`null`) levo stoji samo "Ti" — ekran poredjenja kaze zasto (pravilo 4).
 */
export function UporedniKartica({ znak, onPress }: { znak: ZodiacSign | null; onPress: () => void }) {
  const t = useT().ostalo.uporedni;
  return (
    <View className={cn(CARD_SURFACE, 'p-5')}>
      <Text variant="oznaka" style={{ color: brand.indigo }}>{t.oznaka}</Text>
      <Text variant="title" className="mt-2">{t.naslov}</Text>
      <Text variant="muted" className="mt-2">{t.opis}</Text>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t.dugme}
        className="mt-5 flex-row items-start justify-center gap-4 active:opacity-80">
        <View className="w-24 items-center gap-2">
          {znak ? (
            <ZnakIkona znak={znak.key} element={znak.element} size={KRUG} accessibilityLabel={t.znakA11y(znak.name)} />
          ) : (
            <View style={{ width: KRUG, height: KRUG, borderRadius: KRUG / 2, backgroundColor: neutral.fillStrong }} />
          )}
          <Text variant="caption" className="text-center text-foreground">{znak ? t.ti(znak.name) : t.tiBezZnaka}</Text>
        </View>

        <View
          className="mt-4 items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${brand.indigo}1A` }}>
          <Heart size={15} color={brand.indigo} fill={brand.indigo} strokeWidth={0} />
        </View>

        <View className="w-24 items-center gap-2">
          <View
            className="items-center justify-center"
            style={{ width: KRUG, height: KRUG, borderRadius: KRUG / 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: neutral.inkSubtle }}>
            <Plus size={22} color={brand.indigo} strokeWidth={2.4} />
          </View>
          <Text variant="caption" className="text-center">{t.izaberi}</Text>
        </View>
      </Pressable>

      <Button className="mt-5 self-start" onPress={onPress}>
        <Text>{t.dugme}</Text>
      </Button>
    </View>
  );
}
