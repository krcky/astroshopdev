import * as React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { OblastIkona, OBLAST_BOJA } from '@/components/oblast-ikona';
import { OcenaTackice } from '@/components/ocena-oblasti';
import { IKONA_OBLASTI, RAZMERA_IKONE } from '@/components/krug-zivota';
import { PREMIUM } from '@/components/zakljucano';
import type { KrugDana } from '@/lib/krug';
import type { KrugKey } from '@/lib/krug-config';
import { useT } from '@/i18n';
import { MINUS_BOJA, PLUS_BOJA } from '@/components/ton';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

const RAZMAK = 10;
const BOK = 20; // = px-5 ekrana
/** Koliko cetvrte kartice viri sa desne strane (pt) — da se vidi da lista ide dalje. */
const VIRI = 58;
const IKONA = 40;
/** Prvo Zdravlje i Partner, pa ostale redom kojim su (Ivan, 12.10.2026). */
const REDOSLED: KrugKey[] = ['zdravlje', 'partner'];
/** Tackice su svetlo ljubicaste (`OBLAST_BOJA`), providnost raste sa ocenom: 1 = 60%, 2 = 70%, 3 = 80%, 4 = 90%, 5 = 100% (Ivan, 12.10.2026). Ime ocene je svetlo sivo. */
const bojaOcene = (ocena: number) => `${OBLAST_BOJA}${Math.round((0.5 + Math.min(5, Math.max(1, ocena)) * 0.1) * 255).toString(16).padStart(2, '0')}`;

const TROUGAO_GORE = 'M4.5 0 L9 8 L0 8 Z';
const TROUGAO_DOLE = 'M0 0 L9 0 L4.5 8 Z';

/**
 * Strelica kao na berzi: trougao gore (plavo) ili dole (roze) kad je danasnja ocena veca ili manja od jucerasnje; bez
 * promene ili bez jucerasnjeg dana ne crta se nista (Ivan, 12.10.2026).
 */
function Strelica({ ocena, juce }: { ocena: number; juce: number | null }) {
  if (juce === null || ocena === juce) return null;
  const gore = ocena > juce;
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={9} height={8} viewBox="0 0 9 8"><Path d={gore ? TROUGAO_GORE : TROUGAO_DOLE} fill={gore ? PLUS_BOJA : MINUS_BOJA} /></Svg>
    </View>
  );
}

/**
 * OBLASTI KAO KARTICE (pocetna v3, Ivan, 12.10.2026): umesto kruga zivota, vodoravna lista — po jedna kartica za svaku
 * od osam oblasti. Vide se tri cele, a cetvrta je odsecena (`VIRI`); lista ide do ivice ekrana. U kartici: ikonica, ime
 * oblasti, ime ocene (stanje) i tackice. Dodir otvara ceo list oblasti (`onOtvori`); zakljucana oblast (besplatni) ima
 * katanac uz ikonicu, a stanje i tackice vide svi.
 */
export function OblastiKartice({ rez, otkljucane, onOtvori }: {
  rez: KrugDana;
  /** Besplatni (`BESPLATNO.krug`): samo ove oblasti su potpuno otvorene; ostale imaju katanac. Bez ovoga: sve. */
  otkljucane?: readonly KrugKey[];
  onOtvori: (k: KrugKey) => void;
}) {
  const t = useT();
  const { width } = useWindowDimensions();
  const sirina = Math.floor((width - BOK - 3 * RAZMAK - VIRI) / 3);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={sirina + RAZMAK}
      snapToAlignment="start"
      className="-mx-5"
      contentContainerStyle={{ paddingHorizontal: BOK, gap: RAZMAK }}>
      {[...rez.oblasti].sort((a, b) => {
        const i = (x: KrugKey) => { const k = REDOSLED.indexOf(x); return k < 0 ? REDOSLED.length : k; };
        return i(a.def.key) - i(b.def.key);
      }).map((o) => {
        const otvorena = !otkljucane || otkljucane.includes(o.def.key);
        const naziv = t.krug.oblasti[o.def.key];
        const stanje = t.krug.stanja[o.stanje];
        return (
          <Pressable
            key={o.def.key}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onOtvori(o.def.key); }}
            accessibilityRole="button"
            accessibilityLabel={(otvorena ? t.krug.oblastA11y(naziv, stanje, o.ocena) : t.krug.oblastZakljucanaA11y(naziv, stanje))
              + (o.juce === null || o.juce === o.ocena ? '' : `, ${o.ocena > o.juce ? t.krug.odJuce.gore : t.krug.odJuce.dole}`)}
            style={{ width: sirina }}
            className={`${CARD_SURFACE} items-center px-2 pb-4 pt-4 active:opacity-80`}>
            <View style={{ width: IKONA, height: IKONA }} className="items-center justify-center">
              <OblastIkona oblast={IKONA_OBLASTI[o.def.key]} size={IKONA * (RAZMERA_IKONE[o.def.key] ?? 1)} />
              {!otvorena && (
                <View className="absolute items-center justify-center rounded-pill bg-white" style={{ right: -6, bottom: -4, width: 16, height: 16 }}>
                  <Lock size={10} color={PREMIUM} strokeWidth={2.4} />
                </View>
              )}
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={`mt-3 text-[14px] leading-[18px] ${tezina('chipIzabran')}`}>{naziv}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} className="mt-1.5 text-[12px] font-semibold leading-[16px]" style={{ color: neutral.inkSubtle }}>{stanje}</Text>
            {/* Tackice i strelica su jedna celina, centrirana u kartici (Ivan, 13.10.2026). */}
            <View className="mt-1.5 flex-row items-center justify-center" style={{ gap: 3 }}>
              <OcenaTackice ocena={o.ocena} boja={bojaOcene(o.ocena)} />
              <Strelica ocena={o.ocena} juce={o.juce} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
