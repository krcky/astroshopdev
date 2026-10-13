import * as React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';

import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ELEMENT_BOJA } from '@/components/znak-ikona';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';

const S = 92;
const C = S / 2;

/** 12 podela kruga: kratke crtice od unutrasnjeg prstena do ivice, na svakih 30 stepeni. */
const PODELE = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  return { x1: C + 33 * Math.sin(a), y1: C - 33 * Math.cos(a), x2: C + 44 * Math.sin(a), y2: C - 44 * Math.cos(a) };
});

/** Planete na kartici su UKRAS (ne pravi polozaji): kartica samo otvara ekran "Trenutno na nebu". */
const TACKE = [[26, 30], [66, 60], [60, 27], [31, 66], [46, 14]] as const;

/**
 * Kartica "Trenutno na nebu" na tabu "Ostalo": mali ukrasni krug, naslov i opis; dodir otvara `/nebo`
 * (do 14.10.2026 je to bio tab "Nebo"). Krug je namerno uprosceno nacrtan — pravi je na samom ekranu.
 */
export function NeboKartica({ onPress }: { onPress: () => void }) {
  const t = useT().ostalo.nebo;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t.oznaka}. ${t.naslov}`}
      className={cn(CARD_SURFACE, 'flex-row items-center gap-3 p-4 active:opacity-80')}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} accessibilityElementsHidden importantForAccessibility="no">
        <Circle cx={C} cy={C} r={44} fill={neutral.white} stroke={neutral.fillStrong} strokeWidth={1.2} />
        <Circle cx={C} cy={C} r={33} fill="none" stroke={neutral.fillStrong} strokeWidth={1} />
        <G stroke={neutral.fillStrong} strokeWidth={1}>
          {PODELE.map((p, i) => <Line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />)}
        </G>
        <Circle cx={C} cy={C} r={13} fill={neutral.grouped} stroke={neutral.fillStrong} strokeWidth={1} />
        <Line x1={26} y1={30} x2={66} y2={60} stroke={ELEMENT_BOJA.voda} strokeWidth={1.5} />
        <Line x1={31} y1={66} x2={60} y2={27} stroke={ELEMENT_BOJA.vatra} strokeWidth={1.5} />
        <Line x1={26} y1={30} x2={31} y2={66} stroke={ELEMENT_BOJA.voda} strokeWidth={1.5} strokeDasharray="3 3" />
        <G fill={brand.indigo}>
          {TACKE.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={3.2} />)}
        </G>
      </Svg>
      <View className="flex-1">
        <Text variant="oznaka">{t.oznaka}</Text>
        <Text variant="h3" className="mt-1">{t.naslov}</Text>
        <Text variant="caption" className="mt-1">{t.opis}</Text>
      </View>
      <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />
    </Pressable>
  );
}
