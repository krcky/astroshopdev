import * as React from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Text } from '@/components/ui/text';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { cn } from '@/lib/utils';
import { brand, neutral, size } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/**
 * Red staklenih kapsula u beloj kartici — oblasti na slajdu "Mesec danas" i
 * Efekat / Pazi / Savet na "Tvom danu" (Ivan, 28.9.2026). Vodoravni skrol, da
 * duzi nazivi i Dynamic Type ne lome red. Kartica oko reda ima `p-4`.
 */
export function KapsuleRed<K extends string>({ stavke, izabrana, onIzbor, sveVidljive = false, tabovi = false, naStrani = false, pravoStaklo = naStrani }: {
  stavke: { key: K; label: string; icon?: React.ReactNode }[];
  izabrana: K;
  onIzbor: (k: K) => void;
  /**
   * Sve odjednom, bez skrola (lunarni kalendar, Ivan 29.9.2026): jednake USPRAVNE
   * plocice — ikonica iznad natpisa — koje dele sirinu reda. Za pet oblasti; kapsule
   * sa natpisom pored ikonice u taj red ne staju.
   */
  sveVidljive?: boolean;
  /**
   * Tabovi strane (pocetna, Ivan 29.9.2026): kapsule u jednom redu, bez skrola, svaka
   * siroka koliko natpis + razmak. Za 3—4 kratka natpisa.
   */
  tabovi?: boolean;
  /**
   * Vodoravni red NA STRANI, ne u kartici (tab "Mesec" na pocetnoj, Ivan 29.9.2026):
   * pravo staklo kao tabovi (bez sive nijanse, jedna grupa, izabrana svetlo lila), a skrol
   * ide do ivica ekrana umesto do ivica kartice.
   */
  naStrani?: boolean;
  /** Pravo staklo i U KARTICI, izabrana svetlo lila (tab "Mesec" na pocetnoj, Ivan 29.9.2026). */
  pravoStaklo?: boolean;
}) {
  if (tabovi) {
    // PRAVO STAKLO (Ivan, 29.9.2026: "izgleda kao lazni glass"): neizabrane BEZ sive
    // nijanse — tabovi stoje na prelivu pocetne, pa staklo ima sta da prelomi, kao
    // sistemska dugmad u traci. `GlassContainer` ih vodi kao jednu grupu stakla
    // (zajednicko prelamanje i spajanje pri dodiru), kao susedne stavke trake.
    const red = stavke.map((s) => (
      <Kapsula key={s.key} label={s.label} icon={s.icon} selected={s.key === izabrana} onPress={() => onIzbor(s.key)} cisto indigo />
    ));
    return isLiquidGlassAvailable() ? (
      <GlassContainer spacing={8} accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8 }}>{red}</GlassContainer>
    ) : (
      <View accessibilityRole="tablist" className="flex-row gap-2">{red}</View>
    );
  }
  if (sveVidljive) {
    // Pravo staklo, kao tabovi pocetne (Ivan, 29.9.2026: "a ne ovi lazni"): bez sive
    // nijanse, jedna grupa stakla. Izabrana svetlo lila — INDIGO je samo na glavnim
    // tabovima pocetne (Ivan, 29.9.2026: "svuda osim na glavnim tabovima gore").
    const red = stavke.map((s) => (
      <Kapsula key={s.key} label={s.label} icon={s.icon} selected={s.key === izabrana} onPress={() => onIzbor(s.key)} uspravna cisto />
    ));
    return isLiquidGlassAvailable() ? (
      <GlassContainer spacing={6} accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 6 }}>{red}</GlassContainer>
    ) : (
      <View accessibilityRole="tablist" className="flex-row gap-1.5">{red}</View>
    );
  }
  const red = stavke.map((s) => (
    <Kapsula key={s.key} label={s.label} icon={s.icon} selected={s.key === izabrana} onPress={() => onIzbor(s.key)}
      cisto={pravoStaklo} />
  ));
  return (
    // PRAVO STAKLO SE NE SECE (Ivan, 30.9.2026): staklo ima siroku meku senku, a pri dodiru
    // (`isInteractive`) se uveca. Skrol ga je secao na svojim granicama — videlo se kao siv
    // pravougaonik oko reda i odsecen vrh i dno pri dodiru; ni 20pt vazduha nije bilo dosta
    // (izmereno). Zato skrol sa pravim staklom NE SECE (`overflow: visible`), a vodoravno
    // SECE KARTICA oko reda (`overflow-hidden` kod pozivaoca, npr. `mesec-danas-card.tsx`) —
    // njena ivica je ionako prava ivica.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={pravoStaklo ? { overflow: 'visible' } : undefined}
      className={naStrani ? '-mx-5' : '-mx-4'}
      contentContainerClassName={naStrani ? 'px-5' : pravoStaklo ? 'px-4' : 'gap-2 px-4'}>
      {pravoStaklo && isLiquidGlassAvailable() ? (
        <GlassContainer spacing={8} style={{ flexDirection: 'row', gap: 8 }}>{red}</GlassContainer>
      ) : pravoStaklo ? (
        <View className="flex-row gap-2">{red}</View>
      ) : red}
    </ScrollView>
  );
}

/**
 * Izabrana kapsula: lila izabrane ikonice oblasti (`OBLAST_BOJA`), providna. 0,3 -> 0,45
 * (Ivan, 29.9.2026: "malo jaca") — svuda isto: tabovi, oblasti, izabran dan u kalendaru.
 */
export const LILA_SVETLA = hexAlpha(OBLAST_BOJA, 0.45);

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

/** Uspravna plocica (`sveVidljive`): ikonica iznad natpisa, deli sirinu reda sa ostalima. */
const USPRAVNA: ViewStyle = {
  height: 64, borderRadius: 18, overflow: 'hidden',
  alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4,
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
function Kapsula({ label, icon, selected, onPress, uspravna = false, cisto = false, indigo = false }: {
  label: string; icon?: React.ReactNode; selected: boolean; onPress: () => void; uspravna?: boolean;
  /** Neizabrana bez sive nijanse — cisto staklo (tabovi na prelivu). */
  cisto?: boolean;
  /** Izabrana u INDIGU iz loga (`brand.indigo`), beli natpis — tabovi pocetne (Ivan, 29.9.2026). */
  indigo?: boolean;
}) {
  const izabranaBoja = indigo ? brand.indigo : LILA_SVETLA;
  const beo = indigo && selected;
  const sadrzaj = (
    <>
      {icon}
      {uspravna ? (
        // Najduzi natpis ("Karijera", "Zdravlje") mora da stane u petinu reda.
        <Text variant="caption" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
          style={beo ? { color: neutral.white } : undefined}
          className={cn('text-foreground', selected && tezina('chipIzabran'))}>{label}</Text>
      ) : (
        <Text variant="chip" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={beo ? { color: neutral.white } : undefined} className={cn(selected && tezina('chipIzabran'))}>{label}</Text>
      )}
    </>
  );
  if (!isLiquidGlassAvailable()) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        style={[uspravna ? USPRAVNA : null, selected ? { backgroundColor: izabranaBoja } : null]}
        className={cn(
          uspravna ? 'flex-1 active:opacity-70' : 'h-chip flex-row items-center gap-2 rounded-pill px-4 active:opacity-70',
          !selected && 'bg-fill',
        )}>
        {sadrzaj}
      </Pressable>
    );
  }
  return (
    // BEZ `active:opacity-*`: iOS pokvari staklo cim je bilo koji roditelj providan
    // (UIVisualEffectView uz alpha < 1), pa je kapsula pri dodiru treptala sivo.
    // Odziv na dodir daje samo staklo (`isInteractive`).
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected }} style={uspravna ? { flex: 1 } : undefined}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme="light"
        isInteractive
        tintColor={selected ? izabranaBoja : cisto ? undefined : SIVO_STAKLO}
        style={uspravna ? USPRAVNA : KAPSULA}>
        {sadrzaj}
      </GlassView>
    </Pressable>
  );
}
