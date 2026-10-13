import * as React from 'react';
import { Pressable, View } from 'react-native';
import {
  ArrowUpRight, ChevronRight, Gem, LayoutGrid, MessageCircleQuestion, Orbit, Sparkles, Video, Watch,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { ELEMENT_BOJA } from '@/components/znak-ikona';
import type { CenaReda } from '@/components/ostalo/cene';
import type { ProizvodId } from '@/lib/proizvodi';
import { cn } from '@/lib/utils';
import { brand, neutral } from '@/theme/tokens';

/**
 * Kvadratic i ikona po proizvodu. Boje su boje ELEMENATA (`ELEMENT_BOJA`, iz Ivanovih ikonica znakova), ne nove;
 * Premium je indigo — boja Premium-a (pravilo 2) — sa belim simbolom.
 */
const IZGLED: Record<ProizvodId, { boja: string; Ikona: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }> = {
  widget: { boja: ELEMENT_BOJA.vazduh, Ikona: LayoutGrid },
  premium: { boja: brand.indigo, Ikona: Sparkles },
  natalna: { boja: ELEMENT_BOJA.vazduh, Ikona: Orbit },
  sat: { boja: ELEMENT_BOJA.voda, Ikona: Watch },
  pitanje: { boja: ELEMENT_BOJA.vatra, Ikona: MessageCircleQuestion },
  narukvica: { boja: ELEMENT_BOJA.zemlja, Ikona: Gem },
  konsultacije30: { boja: ELEMENT_BOJA.voda, Ikona: Video },
  konsultacije90: { boja: ELEMENT_BOJA.vatra, Ikona: Video },
};

/** Strana kvadratica u redu liste: dovoljno da ikona i dva reda teksta stoje u redu visokom 92 pt. */
const KVADRAT = 64;

/** Kvadratic sa ikonom proizvoda — u listi i na listu sa jednim proizvodom (`app/proizvod.tsx`). */
export function ProizvodKvadrat({ id, strana = KVADRAT }: { id: ProizvodId; strana?: number }) {
  const { boja, Ikona } = IZGLED[id];
  return (
    <View style={{ width: strana, height: strana, borderRadius: strana / 4, backgroundColor: boja }} className="items-center justify-center">
      <Ikona size={Math.round(strana * 0.47)} color={id === 'premium' ? neutral.white : brand.indigo} strokeWidth={1.9} />
    </View>
  );
}

/**
 * Jedan red liste "Proizvodi" (`ostalo/sadrzaj.tsx`): kvadratic sa ikonom, naziv, opis i cena. Strelica nagore sa
 * desne strane znaci da se kupovina zavrsava na sajtu; ostalo ima obicnu strelicu. Linije izmedju redova crta `Group`.
 */
export function ProizvodRed({ id, naziv, opis, cena, izlaz, a11y, onPress }: {
  id: ProizvodId;
  naziv: string;
  opis: string;
  cena: CenaReda | null;
  /** Vodi na sajt (strelica nagore). */
  izlaz: boolean;
  a11y: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} className="active:bg-fill">
      <View className="min-h-[92px] flex-row items-center gap-3 px-4 py-3">
        <ProizvodKvadrat id={id} />
        <View className="flex-1">
          <Text variant="h3" numberOfLines={2}>{naziv}</Text>
          <Text variant="caption" numberOfLines={1}>{opis}</Text>
          {cena ? (
            <View className="mt-1 flex-row items-baseline gap-2">
              <Text variant="row">{cena.cena}</Text>
              {cena.nastavak ? <Text variant="caption">{cena.nastavak}</Text> : null}
              {cena.stara ? <Text variant="caption" className={cn('line-through')}>{cena.stara}</Text> : null}
            </View>
          ) : null}
        </View>
        {izlaz
          ? <ArrowUpRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} />
          : <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />}
      </View>
    </Pressable>
  );
}
