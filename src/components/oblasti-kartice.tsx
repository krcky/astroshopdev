import * as React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';

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
import { cn } from '@/lib/utils';
import { brand } from '@/theme/tokens';
import { dayKey } from '@/lib/transits';
import { ObrisKojiTece } from '@/components/prica/ulaz';
import { useAuthStore } from '@/store/auth';
import { usePricaPogledana } from '@/store/prica-log';

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

const PLAY = 'M3 1.9v8.2c0 .7.8 1.1 1.4.7l6.2-4.1c.5-.3.5-1.1 0-1.4L4.4 1.2C3.8.8 3 1.2 3 1.9z';
const KRUG_PRICE = 50;
/** Svetla ljubicasta, tri nijanse, za animirani obrub oko nepogledane price. */
const OBRUB_PRICE = ['#E6DCFB', '#B39DDB', '#CDBBF2'] as const;

/** Prsten koji se siri i bledi oko belog kruga dok priča nije pogledana — indikator "ovde ima nesto novo". */
function Puls() {
  const bezPokreta = useReducedMotion();
  const p = useSharedValue(0);
  React.useEffect(() => {
    if (bezPokreta) return;
    p.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
  }, [bezPokreta, p]);
  const stil = useAnimatedStyle(() => ({ opacity: bezPokreta ? 0.5 : 0.55 * (1 - p.get()), transform: [{ scale: bezPokreta ? 1.25 : 1 + 0.5 * p.get() }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: KRUG_PRICE, height: KRUG_PRICE, borderRadius: KRUG_PRICE / 2, borderWidth: 2, borderColor: '#FFFFFF' }, stil]} />;
}

/**
 * KARTICA "PRICA DANA" (v4, Ivan, 13.10.2026): PRVA u listi, indigo gradijent, beli krug sa play dugmetom, ispod natpis; iste
 * visine kao ostale kartice (razvuce se uz njih). Dok danasnja prica nije otvorena: beli prsten pulsira oko kruga i roze znacka
 * "1" u gornjem desnom uglu. Dodir otvara `/prica`.
 */
function PricaKartica({ datum, sirina }: { datum: Date; sirina: number }) {
  const t = useT();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const pogledana = usePricaPogledana(userId, dayKey(datum));
  const [m, setM] = React.useState({ w: 0, h: 0 });
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/prica'); }}
      accessibilityRole="button"
      accessibilityLabel={t.prica.ulaz.pricaDana}
      accessibilityHint={t.prica.ulaz.hint}
      style={{ width: sirina, alignSelf: 'stretch' }}
      className="active:opacity-90">
      <View className={cn('flex-1 items-center justify-center overflow-hidden rounded-lg px-2 pb-3 pt-4', pogledana && CARD_SURFACE)}
        onLayout={(e) => setM({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {!pogledana && m.w > 0 && (
          <Svg width={m.w} height={m.h} style={{ position: 'absolute' }} pointerEvents="none">
            <Defs>
              <LinearGradient id="prica-kartica" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#7C6BD6" />
                <Stop offset="1" stopColor={brand.indigo} />
              </LinearGradient>
            </Defs>
            <Rect width={m.w} height={m.h} fill="url(#prica-kartica)" />
          </Svg>
        )}
        <View style={{ width: KRUG_PRICE, height: KRUG_PRICE }} className="items-center justify-center">
          {!pogledana && <Puls />}
          <View className="items-center justify-center rounded-pill" style={{ width: KRUG_PRICE, height: KRUG_PRICE, backgroundColor: pogledana ? OBLAST_BOJA : '#FFFFFF' }}>
            <Svg width={18} height={18} viewBox="0 0 12 12"><Path d={PLAY} fill={pogledana ? '#FFFFFF' : brand.indigo} /></Svg>
          </View>
        </View>
        {/* Natpis u DVA reda ("Priča / dana"): prelom pre poslednje reci. */}
        <Text numberOfLines={2} className={cn('mt-2 text-center text-[14px] leading-[17px]', pogledana ? 'text-foreground' : 'text-white', tezina('chipIzabran'))}>
          {(() => { const r = t.prica.ulaz.pricaDana.trim().split(/\s+/); return r.length < 2 ? r[0] : `${r.slice(0, -1).join(' ')}\n${r[r.length - 1]}`; })()}
        </Text>
      </View>
      {/* Animirani gradijent obrub oko nepogledane price (isti kao nekadasnje dugme "Prica dana", `ObrisKojiTece`). */}
      {!pogledana && m.w > 0 && <ObrisKojiTece w={m.w} h={m.h} van={4} obris={2} radijus={12} boje={OBRUB_PRICE} />}
      {/* Znacka "1" (Ivan, 13.10.2026): u gornjem desnom uglu i MALO VIRI van kartice; svetlo ljubicasta, beo broj. */}
      {!pogledana && (
        <View pointerEvents="none" className="absolute items-center justify-center rounded-pill"
          style={{ top: -7, right: -7, minWidth: 22, height: 22, backgroundColor: OBLAST_BOJA }}>
          <Text className={`text-[13px] leading-[16px] text-white ${tezina('dugme')}`}>1</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * OBLASTI KAO KARTICE (pocetna v3, Ivan, 12.10.2026): umesto kruga zivota, vodoravna lista — po jedna kartica za svaku
 * od osam oblasti. Vide se tri cele, a cetvrta je odsecena (`VIRI`); lista ide do ivice ekrana. U kartici: ikonica, ime
 * oblasti, ime ocene (stanje) i tackice. Dodir otvara ceo list oblasti (`onOtvori`); zakljucana oblast (besplatni) ima
 * katanac uz ikonicu, a stanje i tackice vide svi.
 */
export function OblastiKartice({ rez, otkljucane, onOtvori, pricaDatum }: {
  rez: KrugDana;
  /** Ako je zadat, PRVA kartica je "Prica dana" za taj dan (v4). */
  pricaDatum?: Date;
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
      // Vertikalni vazduh (+ negativna margina): znacka price viri van kartice, a skrol sece sve van sebe.
      className="-mx-5 -my-2"
      contentContainerStyle={{ paddingHorizontal: BOK, paddingVertical: 8, gap: RAZMAK }}>
      {pricaDatum && <PricaKartica datum={pricaDatum} sirina={sirina} />}
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
