import * as React from 'react';
import { Pressable, ScrollView, type ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Text } from '@/components/ui/text';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { cn } from '@/lib/utils';
import { size } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/**
 * Red staklenih kapsula u beloj kartici — oblasti na slajdu "Mesec danas" i
 * Efekat / Pazi / Savet na "Tvom danu" (Ivan, 28.9.2026). Vodoravni skrol, da
 * duzi nazivi i Dynamic Type ne lome red. Kartica oko reda ima `p-4`.
 */
export function KapsuleRed<K extends string>({ stavke, izabrana, onIzbor }: {
  stavke: { key: K; label: string; icon: React.ReactNode }[];
  izabrana: K;
  onIzbor: (k: K) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      className="-mx-4"
      contentContainerClassName="gap-2 px-4">
      {stavke.map((s) => (
        <Kapsula key={s.key} label={s.label} icon={s.icon} selected={s.key === izabrana} onPress={() => onIzbor(s.key)} />
      ))}
    </ScrollView>
  );
}

/** Izabrana kapsula: svetla lila izabrane ikonice oblasti (`OBLAST_BOJA`), providna. */
const LILA_SVETLA = hexAlpha(OBLAST_BOJA, 0.3);

/**
 * Neizabrana kapsula: staklo sa SIVOM nijansom (Ivan, 29.9.2026: "loše izgleda").
 * Bez nijanse je belo staklo na beloj kartici — nema sta da prelomi, pa se od
 * kapsule video samo tanak obod i red je izgledao kao natpisi bez dugmadi.
 * `neutral.ink` na 6%: na belom daje ~#F0F0F0, blizu `bg-fill` rezerve ispod.
 */
const SIVO_STAKLO = 'rgba(21, 21, 21, 0.06)';

/** `GlassView` ne poznaje klase — sve kroz `style`. Visina = `h-chip`. */
const KAPSULA: ViewStyle = {
  height: size.chip, borderRadius: size.chip / 2, overflow: 'hidden',
  flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16,
};

function hexAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * Kapsula kao staklo dugmad u zaglavlju (`ui/glass-button.tsx`): `GlassView` je
 * OMOTAC, sadrzaj je U NJEMU. Probano i ne valja (28.9.2026): staklo kao apsolutni
 * sloj iza sadrzaja, i senka/obod oko njega — kapsula ostane siva ili bela.
 * Bez stakla (iOS 18, Android, veb): siva ispuna, izabrana ista lila.
 */
function Kapsula({ label, icon, selected, onPress }: {
  label: string; icon: React.ReactNode; selected: boolean; onPress: () => void;
}) {
  const sadrzaj = (
    <>
      {icon}
      <Text variant="chip" className={cn(selected && tezina('chipIzabran'))}>{label}</Text>
    </>
  );
  if (!isLiquidGlassAvailable()) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        style={selected ? { backgroundColor: LILA_SVETLA } : undefined}
        className={cn('h-chip flex-row items-center gap-2 rounded-pill px-4 active:opacity-70', !selected && 'bg-fill')}>
        {sadrzaj}
      </Pressable>
    );
  }
  return (
    // BEZ `active:opacity-*`: iOS pokvari staklo cim je bilo koji roditelj providan
    // (UIVisualEffectView uz alpha < 1), pa je kapsula pri dodiru treptala sivo.
    // Odziv na dodir daje samo staklo (`isInteractive`).
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected }}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme="light"
        isInteractive
        tintColor={selected ? LILA_SVETLA : SIVO_STAKLO}
        style={KAPSULA}>
        {sadrzaj}
      </GlassView>
    </Pressable>
  );
}
