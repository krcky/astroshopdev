import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, {
  Easing, useAnimatedProps, useSharedValue, withDelay, withTiming, ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { Okret } from '@/components/okret';
import { Planeta, SLIKA, skalaSlike } from '@/components/planete-par';
import { INDIGO, PRSTEN_PRELIV } from '@/components/prica/boje';
import { dayKey } from '@/lib/transits';
import { useAuthStore } from '@/store/auth';
import { usePricaPogledana } from '@/store/prica-log';
import { shadow } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';
import { cn } from '@/lib/utils';

const ACircle = Animated.createAnimatedComponent(Circle);

/**
 * Spoljni precnik prstena. Okrugla planeta je 80 (Ivan, 30.9.2026: manja; do tada 96),
 * kao na "Tvom danu" za druge dane: 91 = 80 + 2 × 3 (prsten) + 2 × 2,5 (razmak).
 */
const D = 91;
const POTEZ = 3;
const PLANETA = 80;
/** Planete sa prstenom: telo ~0,52 prstena (Ivan: "smanji malo Saturn"); udeo tela u slici je izmeren. */
const TELO: Record<string, number> = { saturn: 0.4, uranus: 0.6 };
const TELO_U_PRSTENU = 0.52;
const BEDZ = 30;
/**
 * Balon (Ivan, 30.9.2026): prelazi preko donjeg dela planete, ali ISPOD male planete, i
 * pomeren ulevo da mala planeta ne pokrije natpis. `BALON_GORE`: koliko balon (sa
 * tackicama) ulazi u krug; `BALON_LEVO`: pomak ulevo od sredine planete. Okvir je
 * sirok `SIRINA` da balon stane, planeta je uz desnu ivicu.
 */
const BALON_GORE = 20;
const BALON_LEVO = 12;
const BALON_VISINA = 45; // tackice 5 + 1 + 8, razmak 2, balon 29
const SIRINA = 114;

/**
 * ULAZ U DNEVNU PRICU (Ivan, 30.9.2026) — planeta "Tvog dana" u prstenu, ispod nje balon.
 *
 *  - Prsten je preliv svetla ljubicasta -> indigo DIJAGONALNO preko celog kruga (kao
 *    Instagram), bez pocetka i kraja; stoji IZA planete, pa ga Saturnovi prstenovi prekrivaju.
 *  - Dok prica nije pogledana, prsten se puni u krug i balon iskace svaki put kad se
 *    pocetna otvori; posle stoje mirno do sutra (`store/prica-log.ts`).
 *  - Dodir bilo gde (planeta, prsten, balon) otvara `/prica`.
 */
export function UlazUPricu({ tranzitna, natalna, datum }: {
  tranzitna: { key: string; glyph: string; name?: string };
  natalna: { key: string; glyph: string };
  datum: Date;
}) {
  const t = useT();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const pogledana = usePricaPogledana(userId, dayKey(datum));
  // Svaki fokus pocetne = nov ciklus animacije (dok prica nije pogledana).
  const [ciklus, setCiklus] = React.useState(0);
  useFocusEffect(React.useCallback(() => {
    if (!pogledana) setCiklus((c) => c + 1);
  }, [pogledana]));

  const prsten = TELO[tranzitna.key];
  const slika = SLIKA[tranzitna.key];
  const sirinaSlike = prsten ? (D * TELO_U_PRSTENU) / prsten : PLANETA;
  // Planeta se polako okrece kao na pocetnoj (`okret.tsx`) — osim onih sa prstenom i Neptuna.
  const okrece = !prsten && tranzitna.key !== 'neptune';
  const planeta = slika
    ? <Image source={slika} style={{ width: sirinaSlike, height: sirinaSlike }} resizeMode="contain" />
    : <Planeta t={tranzitna} size={PLANETA} />;

  // Planeta uz desnu ivicu okvira; znacka natalne tacke dole desno, na prstenu (45°).
  const x0 = SIRINA - D;
  const c = D / 2 + (D / 2) * Math.SQRT1_2 * 0.96;
  // Sredina balona: sredina planete pomerena ulevo.
  const balon = x0 + D / 2 - BALON_LEVO;

  // Slojevi redom: prsten i planeta, pa balon, pa mala planeta — balon je IZMEDJU njih.
  return (
    <Pressable
      onPress={() => router.push('/prica')}
      accessibilityRole="button"
      accessibilityLabel={t.prica.ulaz.pricaDana}
      accessibilityHint={t.prica.ulaz.hint}
      style={{ width: SIRINA, height: D - BALON_GORE + BALON_VISINA }}
      className="active:opacity-80">
      <View style={{ position: 'absolute', left: x0, top: 0, width: D, height: D, alignItems: 'center', justifyContent: 'center' }}>
        <Prsten key={pogledana ? 'miran' : `puni-${ciklus}`} puni={!pogledana} />
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          {okrece ? <Okret>{planeta}</Okret> : planeta}
        </View>
      </View>
      {/* Sirina 2 × `balon`, pa je sredina tacno na `balon` — sirina balona se ne meri. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, width: 2 * balon, top: D - BALON_GORE, alignItems: 'center' }}>
        <Balon key={pogledana ? 'miran' : `balon-${ciklus}`} animiraj={!pogledana} />
      </View>
      <View
        pointerEvents="none"
        className="absolute items-center justify-center rounded-pill bg-grouped"
        style={{ left: x0 + c - BEDZ / 2 - 3, top: c - BEDZ / 2 - 3, padding: 3 }}>
        <View style={{ width: BEDZ, height: BEDZ }} className="items-center justify-center">
          <Planeta t={natalna} size={BEDZ / skalaSlike(natalna.key)} />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Prsten: preliv dole levo (svetla ljubicasta) -> gore desno (indigo); puni se od vrha u smeru kazaljke.
 * Isti prsten je i ulaz u pricu o znaku (Sunce u velikoj trojci, `karta-lista.tsx`) — zato `D` kao prop.
 */
export function Prsten({ puni, D = 91 }: { puni: boolean; D?: number }) {
  const id = `prica-prsten-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const r = (D - POTEZ) / 2;
  const O = 2 * Math.PI * r;
  const p = useSharedValue(puni ? 0 : 1);
  React.useEffect(() => {
    if (puni) p.set(withDelay(300, withTiming(1, { duration: 1300, easing: Easing.bezier(0.65, 0, 0.25, 1) })));
  }, [puni, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: O * (1 - p.get()) }));
  return (
    <Svg width={D} height={D} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={PRSTEN_PRELIV[0]} />
          <Stop offset="0.45" stopColor={PRSTEN_PRELIV[1]} />
          <Stop offset="1" stopColor={PRSTEN_PRELIV[2]} />
        </LinearGradient>
      </Defs>
      <ACircle
        cx={D / 2}
        cy={D / 2}
        r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={POTEZ}
        strokeDasharray={[O, O]}
        animatedProps={props}
        transform={`rotate(-90 ${D / 2} ${D / 2})`}
      />
    </Svg>
  );
}

const PLAY = 'M3 1.9v8.2c0 .7.8 1.1 1.4.7l6.2-4.1c.5-.3.5-1.1 0-1.4L4.4 1.2C3.8.8 3 1.2 3 1.9z';

/** Balon ispod planete, kao beleska na Instagramu: dve tackice pa balon sa "▶ Priča dana" (ili `natpis`). */
export function Balon({ animiraj, natpis }: { animiraj: boolean; natpis?: string }) {
  const t = useT();
  const ulaz = (kasni: number) => (animiraj ? ZoomIn.delay(kasni).duration(420).easing(Easing.out(Easing.back(1.8))) : undefined);
  return (
    <View style={{ alignItems: 'center' }} pointerEvents="none">
      <Animated.View entering={ulaz(600)} className="rounded-pill bg-background" style={{ width: 5, height: 5, marginLeft: -12, ...shadow.soft }} />
      <Animated.View entering={ulaz(720)} className="rounded-pill bg-background" style={{ width: 8, height: 8, marginLeft: -20, marginTop: 1, ...shadow.soft }} />
      <Animated.View
        entering={ulaz(840)}
        className="mt-0.5 flex-row items-center gap-1.5 rounded-pill bg-background px-3 py-1.5"
        style={shadow.soft}>
        <Svg width={11} height={11} viewBox="0 0 12 12"><Path d={PLAY} fill={INDIGO} /></Svg>
        <Text className={cn('text-[13px] leading-[17px]', tezina('dugme'))}>{natpis ?? t.prica.ulaz.pricaDana}</Text>
      </Animated.View>
    </View>
  );
}
