import * as React from 'react';
import { Pressable, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { ChevronRight, X } from 'lucide-react-native';

import { AspektIkona, imaAspekt } from '@/components/aspekt-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { Tacka, stepenMinut } from '@/components/karta-lista';
import { StakloPovrsina } from '@/components/staklo-povrsina';
import { Text } from '@/components/ui/text';
import { ZnakIkona } from '@/components/znak-ikona';
import { findAspects } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import { signRulers } from '@/lib/rulers';
import { SIGNS, signFromLongitude, type SignPosition } from '@/lib/zodiac';
import type { Pogodak } from '@/lib/wheel';
import { useT, type Recnik } from '@/i18n';
import { neutral } from '@/theme/tokens';

type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/** Planeta ili izvedena tacka — sve sto tocak crta na prstenu planeta. */
type Telo = {
  key: string;
  glyph: string;
  readonly name: string;
  longitude: number;
  position: SignPosition;
  house?: number;
  retrograde?: boolean;
};

/** Mere kartice. Simboli su sitni (Ivan, 8.10.2026: "smanjiti dosta") — kartica je uz krug, ne umesto njega. */
const IKONA = 22;
const MALA = 16;
const KRUGLICA = 14;
const ASPEKT = 11;
const RAZMAK = 14;
const IVICA = 6;
const SIRINA = 232;

const KARTICA: ViewStyle = { maxWidth: SIRINA, paddingHorizontal: 12, paddingVertical: 10 };

/**
 * Detalji izabranog sa tocka — STAKLENA kartica koja plovi PREKO kruga, kod dodirnutog mesta
 * (Ivan, 8.10.2026), a ne jedna ispod kruga. Crta se kroz `IznadPreliva` (`povrsina`), u
 * koordinatama kruga: `sidro` je tacka na krugu, `okvir` njegova velicina.
 *
 * Ne tumaci nista sama: pokazuje izracunato i vodi dalje (`onProcitaj` na "Ti"; Nebo ga nema).
 * Planete i aspekti u njoj su kapsule koje premestaju izbor.
 *
 * Staklo je SISTEMSKO (SwiftUI `.glassEffect`, `StakloPovrsina`), ne `GlassView`; drugde bela kartica
 * sa tankom ivicom. Bez providnosti u animaciji — alpha kvari staklo.
 */
export function TockPopover({ izbor, sidro, okvir, chart, points, bezKuca = false, onIzbor, onProcitaj }: {
  izbor: Pogodak;
  /** Tacka na krugu (pt, od gornjeg levog ugla kruga) kod koje kartica stoji. */
  sidro: { x: number; y: number };
  /** Velicina kruga (pt) — kartica ne izlazi iz njega. */
  okvir: number;
  chart: NatalChart;
  /** Cvor, Lilit, Tacka srece (samo Nebo). */
  points?: Telo[];
  bezKuca?: boolean;
  onIzbor: (p: Pogodak | null) => void;
  /** Tema tumacenja (`/natal?tema=`) za planetu ili ugao; bez ovoga nema dugmeta "Pročitaj". */
  onProcitaj?: (tema: string) => void;
}) {
  const t = useT();
  const tk = t.karta.tockDodir;
  const sva = React.useMemo<Telo[]>(() => [...chart.planets, ...(points ?? [])], [chart, points]);
  const aspekti = React.useMemo(() => findAspects(chart.planets), [chart]);
  const [mera, setMera] = React.useState<{ w: number; h: number } | null>(null);

  // JEDAN odskok (Ivan, 8.10.2026, drugi put): 0,92 -> 1,05 -> 1 i stane. Kreće TEK KAD JE KARTICA IZMERENA I
  // POSTAVLJENA — dok je van ekrana (`mera == null`) animacije nema, pa se ne gleda kako kartica skace sa
  // mesta na mesto usred odskoka (to je bilo "dva"). Prva verzija jednog odskoka (isti tajming) je vracena na
  // oprugu jer je bila pokrenuta pre merenja. Samo razmera, bez providnosti.
  const razmera = useSharedValue(1);
  const odskocio = React.useRef(false);
  React.useEffect(() => {
    if (!mera || odskocio.current) return;
    odskocio.current = true;
    razmera.value = withSequence(
      withTiming(0.92, { duration: 0 }),
      withTiming(1.05, { duration: 130, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 110, easing: Easing.inOut(Easing.quad) }),
    );
  }, [mera, razmera]);
  const stil = useAnimatedStyle(() => ({ transform: [{ scale: razmera.value }] }));

  let ikona: React.ReactNode;
  let naslov: string;
  let podnaslov: string | null = null;
  let dodatak: React.ReactNode = null;
  let tema: string | null = null;

  if (izbor.tip === 'planeta') {
    const p = sva.find((x) => x.key === izbor.key);
    if (!p) return null;
    ikona = <Tacka tacka={p.key} glyph={p.glyph} size={IKONA} />;
    naslov = p.name;
    podnaslov = `${stepenMinut(p.position)}${p.retrograde ? ` ${t.karta.retro}` : ''}`;
    tema = chart.planets.some((x) => x.key === p.key) ? p.key : null;
    const njeni = aspekti.filter((a) => a.a.key === p.key || a.b.key === p.key);
    dodatak = (
      <>
        <View className="mt-2 flex-row items-center gap-1.5">
          <ZnakIkona znak={p.position.sign.key} element={p.position.sign.element} size={KRUGLICA} />
          <Text className="text-[13px] leading-[17px] text-foreground">
            {p.position.sign.name}{p.house && !bezKuca ? ` · ${t.karta.kuca(p.house)}` : ''}
          </Text>
        </View>
        {njeni.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {njeni.map((a) => {
              const drugi = a.a.key === p.key ? a.b : a.a;
              return (
                <Cip key={a.contentKey} onPress={() => onIzbor({ tip: 'planeta', key: drugi.key })}
                     label={`${a.aspect.name} ${drugi.name}`}>
                  {imaAspekt(a.aspect.key) && <AspektIkona aspekt={a.aspect.key} size={ASPEKT} />}
                  <Tacka tacka={drugi.key} glyph={drugi.glyph} size={MALA} />
                </Cip>
              );
            })}
          </View>
        )}
      </>
    );
  } else if (izbor.tip === 'kuca') {
    const kuspida = signFromLongitude(chart.houses.cusps[izbor.broj - 1]);
    ikona = <KucaBroj kuca={izbor.broj} size={IKONA} />;
    naslov = t.karta.kuca(izbor.broj);
    podnaslov = tk.pocinjeU(kuspida.sign.key as ZnakKljuc, stepenMinut(kuspida));
    // Vladar kuce = vladar znaka na kuspidi (tradicionalni, `signRulers`), i u kojoj kuci je on (Ivan, 8.10.2026).
    const vladar = sva.find((x) => x.key === signRulers(kuspida.sign.key)[0]);
    dodatak = (
      <>
        {vladar ? (
          <View className="mt-2">
            <Text variant="caption" className="text-[12px] leading-[15px]">{tk.vladarKuce}</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Cip label={vladar.name} onPress={() => onIzbor({ tip: 'planeta', key: vladar.key })}>
                <Tacka tacka={vladar.key} glyph={vladar.glyph} size={MALA} />
                <Text variant="chip" className="text-[12px] text-foreground">{vladar.name}</Text>
              </Cip>
              {vladar.house ? <Text className="text-[13px] leading-[17px] text-foreground">{t.karta.uKuci(vladar.house)}</Text> : null}
            </View>
          </View>
        ) : null}
        <ListaTela tela={sva.filter((x) => x.house === izbor.broj)} onIzbor={onIzbor} />
      </>
    );
  } else if (izbor.tip === 'znak') {
    const znak = SIGNS[izbor.indeks];
    ikona = <ZnakIkona znak={znak.key} element={znak.element} size={IKONA} />;
    naslov = znak.name;
    // Podznak i MC u ovom znaku idu u isti spisak (Ivan, 13.10.2026: znak kod ascendenta nije pokazivao ascendent);
    // bez vremena rodjenja uglova nema (pravilo 5).
    const uglovi = bezKuca ? [] : ([
      { key: 'ascendant', ime: t.karta.podznak, glyph: 'ASC', pos: chart.ascendantSign },
      { key: 'midheaven', ime: t.karta.mc, glyph: 'MC', pos: chart.midheavenSign },
    ] as const).filter((u) => u.pos.sign.key === znak.key);
    dodatak = <ListaTela tela={sva.filter((x) => x.position.sign.key === znak.key)} uglovi={uglovi} onIzbor={onIzbor} />;
  } else {
    const asc = izbor.key === 'ascendant';
    const pos = asc ? chart.ascendantSign : chart.midheavenSign;
    ikona = <Tacka tacka={izbor.key} glyph={asc ? 'ASC' : 'MC'} size={IKONA} />;
    naslov = asc ? t.karta.podznak : t.karta.mc;
    podnaslov = `${stepenMinut(pos)} · ${pos.sign.name}`;
    tema = asc ? 'ascendant' : null;
  }

  // Ispod dodirnute tacke kad je ona u gornjoj polovini kruga, inace iznad; uvek unutar kruga.
  const w = mera?.w ?? SIRINA;
  const h = mera?.h ?? 0;
  const dole = sidro.y < okvir * 0.55;
  const top = Math.max(IVICA, Math.min(okvir - h - IVICA, dole ? sidro.y + RAZMAK : sidro.y - h - RAZMAK));
  const left = Math.max(IVICA, Math.min(okvir - w - IVICA, sidro.x - w / 2));
  // Dok se ne izmeri, kartica stoji van ekrana — bez providnosti, jer ona kvari staklo.
  const polozaj: ViewStyle = mera ? { top, left } : { top: 0, left: -2000 };

  const sadrzaj = (
    <>
      <View className="flex-row items-center gap-2">
        {ikona}
        <View className="flex-shrink">
          <Text variant="row" className="text-[15px] leading-[19px]" numberOfLines={1}>{naslov}</Text>
          {podnaslov ? <Text variant="caption" className="text-[12px] leading-[15px]">{podnaslov}</Text> : null}
        </View>
        {onProcitaj && tema ? (
          <Pressable
            onPress={() => onProcitaj(tema)}
            accessibilityRole="button"
            accessibilityLabel={`${tk.procitaj}: ${naslov}`}
            hitSlop={6}
            className="ml-1 h-7 flex-row items-center rounded-pill bg-fill pl-3 pr-2 active:opacity-70">
            <Text variant="chip" className="text-[13px]">{tk.procitaj}</Text>
            <ChevronRight size={13} color={neutral.inkSubtle} strokeWidth={2.4} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => onIzbor(null)}
          accessibilityRole="button"
          accessibilityLabel={tk.zatvori}
          hitSlop={10}
          className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-fill active:opacity-70">
          <X size={12} color={neutral.inkSubtle} strokeWidth={2.6} />
        </Pressable>
      </View>
      {dodatak}
    </>
  );

  const naMeri = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMera((m) => (m && Math.abs(m.w - width) < 0.5 && Math.abs(m.h - height) < 0.5 ? m : { w: width, h: height }));
  };

  return (
    <Animated.View
      onLayout={naMeri}
      accessibilityLiveRegion="polite"
      style={[{ position: 'absolute', maxWidth: SIRINA }, polozaj, stil]}>
      <StakloPovrsina radius={18} style={KARTICA}>{sadrzaj}</StakloPovrsina>
    </Animated.View>
  );
}

/** Sitna kapsula koja se dodirne i premesta izbor. */
function Cip({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className="h-[26px] flex-row items-center gap-1 rounded-pill bg-fill/80 px-2 active:opacity-70">
      {children}
    </Pressable>
  );
}

/** Naslov "Planete" pa planete kao kapsule (da se ne mesaju sa vladarom kuce), ili "Nema planeta". */
function ListaTela({ tela, uglovi = [], onIzbor }: {
  tela: Telo[];
  /** Podznak i MC koji su u ovom znaku — kapsule ispred planeta, biraju ugao na krugu. */
  uglovi?: readonly { key: 'ascendant' | 'midheaven'; ime: string; glyph: string }[];
  onIzbor: (p: Pogodak) => void;
}) {
  const t = useT();
  if (tela.length === 0 && uglovi.length === 0) {
    return <Text variant="caption" className="mt-2 text-[12px]">{t.karta.tockDodir.prazno}</Text>;
  }
  return (
    <View className="mt-2">
      <Text variant="caption" className="text-[12px] leading-[15px]">{t.karta.tockDodir.planete}</Text>
      <View className="mt-1 flex-row flex-wrap gap-1.5">
        {uglovi.map((u) => (
          <Cip key={u.key} label={u.ime} onPress={() => onIzbor({ tip: 'ugao', key: u.key })}>
            <Tacka tacka={u.key} glyph={u.glyph} size={MALA} />
            <Text variant="chip" className="text-[12px] text-foreground">{u.ime}</Text>
          </Cip>
        ))}
        {tela.map((p) => (
          <Cip key={p.key} label={p.name} onPress={() => onIzbor({ tip: 'planeta', key: p.key })}>
            <Tacka tacka={p.key} glyph={p.glyph} size={MALA} />
            <Text variant="chip" className="text-[12px] text-foreground">{p.name}</Text>
          </Cip>
        ))}
      </View>
    </View>
  );
}
