import * as React from 'react';
import { Image, StyleSheet, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing, FadeInDown, useAnimatedProps, useAnimatedStyle, useFrameCallback, useReducedMotion,
  useSharedValue, withDelay, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { Planeta, SLIKA, skalaSlike } from '@/components/planete-par';
import type { Tece } from '@/components/prica/pozadina';
import { INDIGO, LILA, TON_BOJA, TON_MASTILO } from '@/components/prica/boje';
import { moonLitPath } from '@/lib/moon';
import {
  luk, podeociKruga, podeociTocka, reciZaPrelom, tackaNaKrugu, tackaNaTocku, ugloviCrteza, zraciDuzina, zraciPutanja,
} from '@/lib/prica';
import type { Tetiva as TetivaPodatak } from '@/lib/use-prica';
import type { Tone } from '@/lib/tone';
import { FONT } from '@/theme/font';
import { tezina } from '@/theme/tipografija';

const APath = Animated.createAnimatedComponent(Path);
const ALine = Animated.createAnimatedComponent(Line);
const ACircle = Animated.createAnimatedComponent(Circle);
const ATextInput = Animated.createAnimatedComponent(TextInput);

const CRTANJE = Easing.bezier(0.5, 0, 0.2, 1);

/**
 * 0 -> 1 posle `kasni` ms. Bez animacije (kartica za deljenje) odmah 1. Uz
 * "Smanji pokrete" Reanimated sam skoci na kraj — crtez se pojavi ceo.
 */
function useNapredak(kasni: number, trajanje: number, animiraj: boolean) {
  const p = useSharedValue(animiraj ? 0 : 1);
  React.useEffect(() => {
    if (animiraj) p.set(withDelay(kasni, withTiming(1, { duration: trajanje, easing: CRTANJE })));
  }, [animiraj, kasni, trajanje, p]);
  return p;
}

/**
 * Sat za spor okret (tocak, zraci, Mesec): tece samo dok prica tece i bez
 * "Smanji pokrete". Vraca ugao u stepenima; jedan krug za `period` sekundi.
 */
export function useOkret(tece: Tece | undefined, period: number) {
  const bezPokreta = useReducedMotion();
  const ugao = useSharedValue(0);
  useFrameCallback((f) => {
    if (!tece || tece.get() === 0 || bezPokreta) return;
    ugao.set((ugao.get() + ((f.timeSincePreviousFrame ?? 0) / 1000 / period) * 360) % 360);
  }, !!tece);
  return ugao;
}

/* ------------------------------------------------------------------------- *
 * Tekst koji ulazi: reci jedna za drugom, broj koji se odbrojava
 * ------------------------------------------------------------------------- */

/** Naslov koji se dize rec po rec. Bez animacije — obican tekst u istom rasporedu. */
export function Reci({ tekst, kasni = 0, korak = 70, animiraj = true, className, style, centar = false, pre }: {
  tekst: string;
  kasni?: number;
  korak?: number;
  animiraj?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
  centar?: boolean;
  /** Ispred prve reci, u istom redu (npr. znak ispred naslova Meseca); prelom ide ispod njega. */
  pre?: React.ReactNode;
}) {
  const reci = reciZaPrelom(tekst);
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={tekst}
      style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: centar ? 'center' : 'flex-start', alignItems: pre ? 'center' : undefined }}>
      {pre}
      {reci.map((r, i) => (
        <Animated.View
          key={`${i}-${r}`}
          entering={animiraj ? FadeInDown.delay(kasni + i * korak).duration(650).easing(Easing.out(Easing.cubic)) : undefined}>
          <Text className={className} style={style}>{i < reci.length - 1 ? `${r} ` : r}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

/** Blok koji uđe odozdo uz pretapanje. */
export function Pojava({ kasni = 0, animiraj = true, style, className, children }: {
  kasni?: number; animiraj?: boolean; style?: StyleProp<ViewStyle>; className?: string; children: React.ReactNode;
}) {
  return (
    <Animated.View
      entering={animiraj ? FadeInDown.delay(kasni).duration(650).easing(Easing.out(Easing.cubic)) : undefined}
      style={style}
      className={className}>
      {children}
    </Animated.View>
  );
}

/** Broj koji se odbrojava od 0 (TextInput, jer se tekst menja na UI niti). */
export function Broj({ do: cilj, kasni = 0, animiraj = true, style }: {
  do: number; kasni?: number; animiraj?: boolean; style: StyleProp<TextStyle>;
}) {
  const p = useNapredak(kasni, 1400, animiraj);
  const props = useAnimatedProps(() => {
    const n = String(Math.round(cilj * p.get()));
    return { text: n, defaultValue: n } as any;
  });
  return (
    <ATextInput
      editable={false}
      caretHidden
      underlineColorAndroid="transparent"
      accessibilityLabel={String(cilj)}
      // Sirina polja se racuna po POCETNOM tekstu i posle se ne menja — zato konacan
      // broj, inace bi "10" ostalo "1" (videno u simulatoru). Odbrojavanje pise preko njega,
      // poravnato udesno, da "4" dok broji ne stoji daleko od "%" i od reci iza broja.
      defaultValue={String(cilj)}
      animatedProps={props}
      style={[{ padding: 0, margin: 0, fontFamily: FONT.semibold, includeFontPadding: false, textAlign: 'right', fontVariant: ['tabular-nums'] } as TextStyle, style]}
    />
  );
}

/* ------------------------------------------------------------------------- *
 * Naslovna: dvostruki tocak i trake tona
 * ------------------------------------------------------------------------- */

/**
 * Dvostruki tocak (iz verzije B): spoljni krug je nebo danas, unutrasnji tvoja
 * karta. Svaka linija je jedan tranzit na PRAVIM polozajima — od tranzitne
 * planete (prazan kruzic) do natalne tacke (pun), u boji tona. Ascendent je levo.
 */
export function Tocak({ tetive, levo, velicina, animiraj = true, tece }: {
  tetive: TetivaPodatak[];
  levo: number;
  velicina: number;
  animiraj?: boolean;
  tece?: Tece;
}) {
  const okret = useOkret(animiraj ? tece : undefined, 160);
  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${okret.get()}deg` }] }));
  const spolja = useNapredak(100, 1400, animiraj);
  const unutra = useNapredak(400, 1400, animiraj);
  const podeoci = useNapredak(800, 800, animiraj);
  const O1 = 2 * Math.PI * 170;
  const O2 = 2 * Math.PI * 112;
  const krug1 = useAnimatedProps(() => ({ strokeDashoffset: O1 * (1 - spolja.get()) }));
  const krug2 = useAnimatedProps(() => ({ strokeDashoffset: O2 * (1 - unutra.get()) }));
  const pod = useAnimatedProps(() => ({ strokeOpacity: 0.55 * podeoci.get() }));
  return (
    <Animated.View style={[{ width: velicina, height: velicina }, stil]} accessible={false}>
      <Svg width={velicina} height={velicina} viewBox="0 0 360 360">
        <ACircle cx={180} cy={180} r={170} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1}
          strokeDasharray={[O1, O1]} animatedProps={krug1} transform="rotate(-90 180 180)" />
        <APath d={podeociTocka(levo, 180, 170)} stroke="#FFFFFF" strokeWidth={1} fill="none" animatedProps={pod} />
        <ACircle cx={180} cy={180} r={112} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1}
          strokeDasharray={[O2, O2]} animatedProps={krug2} transform="rotate(-90 180 180)" />
        {tetive.map((t, k) => {
          const a = tackaNaTocku(t.tranzit, levo, 180, 152);
          const b = tackaNaTocku(t.natal, levo, 180, 112);
          return <TetivaCrtez key={k} a={a} b={b} ton={t.ton} kasni={800 + k * 130} animiraj={animiraj} />;
        })}
      </Svg>
    </Animated.View>
  );
}

function TetivaCrtez({ a, b, ton, kasni, animiraj }: {
  a: { x: number; y: number }; b: { x: number; y: number }; ton: Tone; kasni: number; animiraj: boolean;
}) {
  const L = Math.max(0.5, Math.hypot(b.x - a.x, b.y - a.y));
  const p = useNapredak(kasni, 900, animiraj);
  const q = useNapredak(kasni, 350, animiraj);
  const r = useNapredak(kasni + 250, 350, animiraj);
  const linija = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - p.get()) }));
  const tacka1 = useAnimatedProps(() => ({ r: 4.5 * q.get() }));
  const tacka2 = useAnimatedProps(() => ({ r: 4 * r.get() }));
  return (
    <>
      <ALine x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={TON_MASTILO[ton]} strokeWidth={2.4} strokeLinecap="round"
        strokeDasharray={[L, L]} animatedProps={linija} />
      <ACircle cx={a.x} cy={a.y} fill="none" stroke="#FFFFFF" strokeWidth={1.6} animatedProps={tacka1} />
      <ACircle cx={b.x} cy={b.y} fill="#FFFFFF" animatedProps={tacka2} />
    </>
  );
}

/** Trake tona: po jedna uspravna traka za svaki tranzit, najvazniji prvi, izrastaju redom. */
export function TrakeTona({ tonovi, maxSirina, visina = 46, kasni = 1900, animiraj = true }: {
  tonovi: Tone[]; maxSirina: number; visina?: number; kasni?: number; animiraj?: boolean;
}) {
  if (tonovi.length === 0) return null;
  // Sirina trake: 7 pt, uza kad ih je mnogo, da red stane pored natpisa.
  const n = tonovi.length;
  const w = Math.max(3, Math.min(7, maxSirina / (n + 0.85 * (n - 1))));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: w * 0.85 }} accessible={false}>
      {tonovi.map((t, k) => <Traka key={k} boja={TON_BOJA[t]} w={w} h={visina} kasni={kasni + k * 70} animiraj={animiraj} />)}
    </View>
  );
}

function Traka({ boja, w, h, kasni, animiraj }: { boja: string; w: number; h: number; kasni: number; animiraj: boolean }) {
  const p = useNapredak(kasni, 600, animiraj);
  const stil = useAnimatedStyle(() => ({ transform: [{ scaleY: p.get() }] }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: 2, backgroundColor: boja, transformOrigin: 'bottom' }, stil]} />;
}

/* ------------------------------------------------------------------------- *
 * Tvoj dan: pravi ugao aspekta
 * ------------------------------------------------------------------------- */

const UGAO_W = 340;
const UGAO_H = 290;
const CX = 170;
const CY = 185;
const R = 124;

/**
 * Dve planete na krugu zodijaka razmaknute TACNO za ugao aspekta, gledano iz
 * sredine (sa Zemlje): tranzitna levo (slika u boji), natalna desno. Luk u roze
 * boji meri ugao. Razmak podeoka je pravih 5°, a orijentacija kruga shematska.
 */
export function UgaoAspekta({ ugao, imeAspekta, tranzitna, natalna, sirina, animiraj = true }: {
  ugao: number;
  imeAspekta: string;
  tranzitna: { key: string; glyph: string };
  natalna: { key: string; glyph: string };
  sirina: number;
  animiraj?: boolean;
}) {
  const s = sirina / UGAO_W;
  const u = ugloviCrteza(ugao);
  const A = tackaNaKrugu(u.tranzitna, CX, CY, R);
  let B = tackaNaKrugu(u.natalna, CX, CY, R);
  // Konjunkcija: obe su na istom mestu — natalna ide malo ukoso ispod, da se vidi.
  if (ugao < 1) B = { x: B.x + 40, y: B.y + 34 };
  const O = 2 * Math.PI * R;
  const krug = useNapredak(150, 1400, animiraj);
  const podeoci = useNapredak(800, 800, animiraj);
  const zraci = useNapredak(700, 700, animiraj);
  const lukP = useNapredak(1300, 800, animiraj);
  const lukD = (Math.PI * 44 * Math.abs(u.tranzitna - u.natalna)) / 180 + 1;
  const krugProps = useAnimatedProps(() => ({ strokeDashoffset: O * (1 - krug.get()) }));
  const podProps = useAnimatedProps(() => ({ strokeOpacity: 0.4 * podeoci.get() }));
  const zrakProps = useAnimatedProps(() => ({ strokeOpacity: 0.55 * zraci.get() }));
  const lukProps = useAnimatedProps(() => ({ strokeDashoffset: lukD * (1 - lukP.get()) }));
  const pl1 = useNapredak(300, 900, animiraj);
  const pl2 = useNapredak(1100, 600, animiraj);
  const pl1Stil = useAnimatedStyle(() => ({ opacity: pl1.get(), transform: [{ scale: 0.9 + 0.1 * pl1.get() }] }));
  const pl2Stil = useAnimatedStyle(() => ({ opacity: pl2.get(), transform: [{ scale: 0.4 + 0.6 * pl2.get() }] }));
  const oznaka = useNapredak(1500, 600, animiraj);
  const oznakaStil = useAnimatedStyle(() => ({ opacity: oznaka.get() }));

  const velika = 100 * s;
  const slika = SLIKA[tranzitna.key];
  const d1 = velika * skalaSlike(tranzitna.key);
  const mala = 58 * s;
  return (
    <View style={{ width: sirina, height: UGAO_H * s }} accessible={false}>
      <Svg width={sirina} height={UGAO_H * s} viewBox={`0 0 ${UGAO_W} ${UGAO_H}`}>
        <ACircle cx={CX} cy={CY} r={R} fill="none" stroke={INDIGO} strokeOpacity={0.3} strokeWidth={1.2}
          strokeDasharray={[O, O]} animatedProps={krugProps} transform={`rotate(-90 ${CX} ${CY})`} />
        <APath d={podeociKruga(CX, CY, R)} stroke={INDIGO} strokeWidth={1} fill="none" animatedProps={podProps} />
        <APath d={`M${CX} ${CY}L${A.x.toFixed(1)} ${A.y.toFixed(1)}M${CX} ${CY}L${B.x.toFixed(1)} ${B.y.toFixed(1)}`}
          stroke={INDIGO} strokeWidth={1.2} strokeDasharray={[3, 5]} fill="none" animatedProps={zrakProps} />
        {ugao >= 1 && (
          <APath d={luk(CX, CY, 44, u.tranzitna, u.natalna)} stroke={TON_MASTILO.izazovno} strokeWidth={2.6}
            strokeLinecap="round" fill="none" strokeDasharray={[lukD, lukD]} animatedProps={lukProps} />
        )}
        <Circle cx={CX} cy={CY} r={4.5} fill={INDIGO} />
      </Svg>
      {/* Ugao i ime aspekta ISPOD sredine: iznad su planete (kod sekstila i konjunkcije
          blizu vrha), pa bi ih natpis dodirivao (videno u simulatoru, 30.9.2026). */}
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: (CY + 16) * s, alignItems: 'center' }, oznakaStil]}>
        <Text className={tezina('display')} style={{ fontSize: 34 * s, lineHeight: 36 * s, color: INDIGO, letterSpacing: -1 }}>{Math.round(ugao)}°</Text>
        <Text className={tezina('statOznaka')} style={{ fontSize: 10 * s, letterSpacing: 1.6 * s, color: INDIGO, opacity: 0.75, textTransform: 'uppercase' }}>{imeAspekta}</Text>
      </Animated.View>
      {/* Planete u boji na svojim mestima: tranzitna veca, natalna manja. */}
      <Animated.View style={[{ position: 'absolute', left: A.x * s - d1 / 2, top: A.y * s - d1 / 2, width: d1, height: d1 }, pl1Stil]}>
        {slika
          ? <Image source={slika} style={{ width: d1, height: d1 }} resizeMode="contain" />
          : <Planeta t={tranzitna} size={velika} />}
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: B.x * s - mala / 2, top: B.y * s - mala / 2 }, pl2Stil]}>
        <Planeta t={natalna} size={mala} />
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * Mesec: osam faza
 * ------------------------------------------------------------------------- */

/** Osam faza kao crtezi (mlad -> pun -> mlad), danasnja istaknuta roze krugom. */
export function FazeMeseca({ trenutna, velicina = 28, kasni = 1200, animiraj = true, boja = '#FFFFFF' }: {
  trenutna: number; velicina?: number; kasni?: number; animiraj?: boolean; boja?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessible={false}>
      {Array.from({ length: 8 }, (_, k) => (
        <Pojava key={k} kasni={kasni + k * 90} animiraj={animiraj}>
          <Svg width={velicina} height={velicina} viewBox="-6 -6 42 42">
            <Circle cx={15} cy={15} r={13} fill="none" stroke={boja} strokeWidth={k === trenutna ? 2 : 1} strokeOpacity={k === trenutna ? 1 : 0.55} />
            {k > 0 && (
              <Path d={moonLitPath(k * 45, 13)} transform="translate(2 2)" fill={boja} fillOpacity={k === trenutna ? 1 : 0.55} />
            )}
            {k === trenutna && <Circle cx={15} cy={15} r={19.5} fill="none" stroke={TON_BOJA.izazovno} strokeWidth={1.8} />}
          </Svg>
        </Pojava>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * Savet: zraci iz loga
 * ------------------------------------------------------------------------- */

/** Zraci iz loga (gravira sunca) — iscrtaju se jedan za drugim i sporo se okrecu. */
export function Zraci({ velicina, animiraj = true, tece }: { velicina: number; animiraj?: boolean; tece?: Tece }) {
  const okret = useOkret(animiraj ? tece : undefined, 200);
  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${okret.get()}deg` }] }));
  const L = zraciDuzina(110, 150, 318);
  const O = 2 * Math.PI * 96;
  const p = useNapredak(200, 2400, animiraj);
  const q = useNapredak(600, 1400, animiraj);
  const zrak = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - p.get()) }));
  const krug = useAnimatedProps(() => ({ strokeDashoffset: O * (1 - q.get()) }));
  return (
    <Animated.View style={[{ width: velicina, height: velicina }, stil]} pointerEvents="none" accessible={false}>
      <Svg width={velicina} height={velicina} viewBox="0 0 640 640">
        <APath d={zraciPutanja(320, 110, 150, 318)} stroke={INDIGO} strokeOpacity={0.22} strokeWidth={1} fill="none"
          strokeDasharray={[L, L]} animatedProps={zrak} />
        <ACircle cx={320} cy={320} r={96} stroke={INDIGO} strokeOpacity={0.22} strokeWidth={1} fill="none"
          strokeDasharray={[O, O]} animatedProps={krug} />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------------- *
 * Ocene: krug nacrtan rukom oko petice
 * ------------------------------------------------------------------------- */

const KRUG_OKO = 'M50 8C38 1 14 3 6 17c-8 14 6 30 26 30 22 0 32-12 28-26-2-7-9-11-16-12';
const KRUG_OKO_DUZINA = 180;

export function KrugOko({ sirina, kasni = 2300, animiraj = true }: { sirina: number; kasni?: number; animiraj?: boolean }) {
  const p = useNapredak(kasni, 900, animiraj);
  const props = useAnimatedProps(() => ({ strokeDashoffset: KRUG_OKO_DUZINA * (1 - p.get()) }));
  const visina = (sirina * 52) / 64;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} accessible={false}>
      <Svg width={sirina} height={visina} viewBox="0 0 64 52" style={{ transform: [{ translateX: sirina * 0.08 }] }}>
        <APath d={KRUG_OKO} fill="none" stroke={TON_MASTILO.izazovno} strokeWidth={2.4} strokeLinecap="round"
          strokeDasharray={[KRUG_OKO_DUZINA, KRUG_OKO_DUZINA]} animatedProps={props} />
      </Svg>
    </View>
  );
}

/** Tackice ocene 1—5 (lila), pune se jedna za drugom. */
export function TackiceOcene({ ocena, velicina = 9, kasni = 0, animiraj = true }: {
  ocena: number; velicina?: number; kasni?: number; animiraj?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: velicina * 0.55 }} accessible={false}>
      {Array.from({ length: 5 }, (_, k) => (
        <Tackica key={k} puna={k < ocena} velicina={velicina} kasni={kasni + k * 90} animiraj={animiraj} />
      ))}
    </View>
  );
}

function Tackica({ puna, velicina, kasni, animiraj }: { puna: boolean; velicina: number; kasni: number; animiraj: boolean }) {
  const p = useNapredak(kasni, 450, animiraj && puna);
  const stil = useAnimatedStyle(() => ({ transform: [{ scale: puna ? 0.4 + 0.6 * p.get() : 1 }], opacity: puna ? p.get() : 1 }));
  return (
    <View style={{ width: velicina, height: velicina }}>
      <View className="absolute inset-0 rounded-pill bg-fill-strong" />
      {puna && <Animated.View className="absolute inset-0 rounded-pill" style={[{ backgroundColor: LILA }, stil]} />}
    </View>
  );
}
