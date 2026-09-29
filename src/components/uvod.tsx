import * as React from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';

import { LogoKrug, type LogoKrugRef } from '@/components/logo';
import { PrelivSloj } from '@/components/screen';
import {
  krajRupe, KRUG_NESTAJE, PRELIV_GASENJE, rupaPoluprecnik, UVOD_KRUG, UVOD_MS, ZALET, ZUM_SADRZAJA,
} from '@/lib/uvod';
import { backdrop, neutral } from '@/theme/tokens';

/*
 * UVOD PRI POKRETANJU (Ivan, 28.9.2026) — varijanta "Krug se otvori", po uzoru
 * na Luma. Tok, vremena i sav racun su u `lib/uvod.ts`; ovde je samo crtanje.
 *
 * Sloj stoji IZNAD cele aplikacije (`app/_layout.tsx`) i samo je POKRIVA — gde
 * korisnik ide i dalje odlucuje kapija (`app/index.tsx`, pravilo 11). Uvod ceka
 * isto sto i kapija (pismo, sesija sa diska, profil), NIKAD mrezu (pravilo 19).
 *
 * PRVI KADAR = SISTEMSKI SPLASH. Splash (`app.json`) je siva pozadina i krug iste
 * velicine na sredini, crtan iz istog Lottie-ja (`scripts/logo/build-splash.swift`).
 * Sklanja se tek kad Lottie javi da je ucitan, pa se zamena ne vidi.
 *
 * SLOJEVI, odozdo:
 *   1. zavesa   siva, sa kruznom rupom (bez oboda) kroz koju se vidi aplikacija
 *   2. preliv   isti kao na pocetnoj; bledi kad prozor stigne do njega
 *   3. krug     Lottie loga; vrti se dok se ceka, pri otvaranju se pretopi, ne zumira
 *
 * Pokret ide na niti za animaciju i zakazuje se unapred: vrtenje je ceo u Lottie
 * JSON-u (`logo-krug-uvod.json`), zalet i otvaranje u Reanimated-u; JS samo
 * odlucuje KAD se otvara. Aplikacija se montira tek kad uvod krene (`onPocetak`),
 * pa se njeno prvo crtanje, koje zauzme JS, odvija dok se krug vrti. Ako crtanje
 * potraje, krug se vrti dalje i otvaranje ceka — sto je i zeljeno.
 *
 * "SMANJI POKRETE": nema vrtenja, preliva ni rasta — kad je spremno, uvod se samo
 * pretopi.
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const clamp01 = (x: number) => {
  'worklet';
  return x < 0 ? 0 : x > 1 ? 1 : x;
};

type Faze = {
  /** Krug loga (spoljni poluprecnik), pt — skupi se u zaletu, malo naraste dok nestaje. */
  R: SharedValue<number>;
  /** Pocetak (pojava preliva): 0 -> 1 za `UVOD_MS.vrtenje`. */
  uvod: SharedValue<number>;
  /** Zalet: 0 -> 1. */
  zalet: SharedValue<number>;
  /** Otvaranje: 0 -> 1, linearno u vremenu. */
  otvor: SharedValue<number>;
};

export function Uvod({ spremno, zum, onPocetak, onKraj }: {
  /** Kapija zna gde korisnik ide (pismo ucitano, sesija i profil procitani sa diska). */
  spremno: boolean;
  /** Skala sadrzaja aplikacije ispod uvoda — "sleze" dok se prozor otvara. */
  zum: SharedValue<number>;
  /**
   * Uvod je krenuo — tek tada se montira aplikacija. Njeno prvo crtanje (pocetna)
   * zauzme JS, pa bi pre toga krug stajao (u dev modu i 1,5 s — snimljeno u
   * simulatoru, 28.9.2026); ovako se crta DOK se krug vrti, na drugoj niti.
   */
  onPocetak: () => void;
  /** Uvod je gotov i moze da se ukloni. */
  onKraj: () => void;
}) {
  const bezPokreta = useReducedMotion();
  const [vel, setVel] = React.useState<{ w: number; h: number } | null>(null);
  /** Lottie je ucitan (ili je prosla rezerva) — splash se sklanja, krug krece. */
  const [krenuo, setKrenuo] = React.useState(false);
  /** `spremno` + malo vremena da odredisni ekran stigne da se iscrta. */
  const [smiren, setSmiren] = React.useState(false);

  const krug = React.useRef<LogoKrugRef>(null);
  const R0 = UVOD_KRUG / 2;
  const faze: Faze = {
    R: useSharedValue(R0),
    uvod: useSharedValue(0),
    zalet: useSharedValue(0),
    otvor: useSharedValue(0),
  };
  const vidljivost = useSharedValue(1);

  // Pozivi napolje idu kroz ref: efekti ispod se ne smeju ponoviti ako roditelj
  // posalje novu funkciju. Kraj se javlja jednom, i kad ga javi i animacija i rezervni sat.
  const napolje = React.useRef({ onPocetak, onKraj, gotov: false, pocetak: 0 });
  React.useEffect(() => {
    napolje.current.onPocetak = onPocetak;
    napolje.current.onKraj = onKraj;
  }, [onPocetak, onKraj]);
  const zavrsi = React.useCallback(() => {
    if (napolje.current.gotov) return;
    napolje.current.gotov = true;
    zum.set(1);
    napolje.current.onKraj();
  }, [zum]);

  // Sistemski splash se sklanja kad Lottie javi da je ucitan — ili posle rezerve,
  // da uvod nikad ne zavisi od toga.
  const kreni = React.useCallback(() => setKrenuo(true), []);
  const lottieSpreman = React.useCallback(() => requestAnimationFrame(kreni), [kreni]);
  React.useEffect(() => {
    if (!vel) return;
    const t = setTimeout(kreni, UVOD_MS.lottieRezerva);
    return () => clearTimeout(t);
  }, [vel, kreni]);

  // 1. VRTENJE — od ovog trenutka JS je zauzet crtanjem aplikacije, pa se sve
  // pokrece u istom potezu: vrtenje je u Lottie-ju, preliv na niti za animaciju.
  const pokrenut = React.useRef(false);
  React.useEffect(() => {
    if (!krenuo || !vel || pokrenut.current) return;
    pokrenut.current = true;
    SplashScreen.hide();
    napolje.current.pocetak = Date.now();
    napolje.current.onPocetak();
    if (bezPokreta) return;
    zum.set(ZUM_SADRZAJA);
    krug.current?.zavrti();
    faze.uvod.set(withTiming(1, { duration: UVOD_MS.vrtenje, easing: Easing.out(Easing.cubic) }));
  }, [krenuo, vel, bezPokreta, zum, faze.uvod]);

  React.useEffect(() => {
    if (!spremno) return;
    const t = setTimeout(() => setSmiren(true), UVOD_MS.smirenje);
    return () => clearTimeout(t);
  }, [spremno]);

  // 2. ZALET + OTVARANJE — kad je aplikacija spremna, ali ne pre najkraceg vrtenja.
  const otvara = React.useRef(false);
  React.useEffect(() => {
    if (!smiren || !krenuo || !vel || !pokrenut.current || otvara.current) return;
    otvara.current = true;
    if (bezPokreta) {
      vidljivost.set(withTiming(0, { duration: UVOD_MS.bezPokreta }, (g) => { if (g) scheduleOnRN(zavrsi); }));
      setTimeout(zavrsi, UVOD_MS.bezPokreta + 500);
      return;
    }
    // Krug se vrti najmanje `vrtenje`, pa zalet; ako je aplikacija kasnila, odmah.
    const odmor = Math.max(0, UVOD_MS.vrtenje - (Date.now() - napolje.current.pocetak));
    faze.R.set(withDelay(odmor, withSequence(
      withTiming(R0 * ZALET, { duration: UVOD_MS.zalet, easing: Easing.inOut(Easing.quad) }),
      withTiming(R0 * KRUG_NESTAJE.rast, { duration: UVOD_MS.otvaranje * KRUG_NESTAJE.udeo, easing: Easing.out(Easing.quad) }),
    )));
    faze.zalet.set(withDelay(odmor, withTiming(1, { duration: UVOD_MS.zalet, easing: Easing.inOut(Easing.quad) })));
    const posle = odmor + UVOD_MS.zalet;
    faze.otvor.set(withDelay(posle, withTiming(1, { duration: UVOD_MS.otvaranje, easing: Easing.linear }, (g) => {
      if (g) scheduleOnRN(zavrsi);
    })));
    zum.set(withDelay(posle, withTiming(1, { duration: UVOD_MS.otvaranje, easing: Easing.out(Easing.cubic) })));
    // Rezerva: uvod koji ne javi kraj bi zauvek pokrio aplikaciju.
    setTimeout(zavrsi, posle + UVOD_MS.otvaranje + 500);
  }, [smiren, krenuo, vel, bezPokreta, zavrsi, zum, vidljivost, faze.R, faze.zalet, faze.otvor, R0]);

  const naRaspored = React.useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setVel((v) => (v && v.w === w && v.h === h ? v : { w, h }));
  }, []);

  const koren = useAnimatedStyle(() => ({ opacity: vidljivost.get() }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, koren]}
      onLayout={naRaspored}
      // Aplikacija ispod je vec montirana; VoiceOver je ne cita dok je uvod preko nje.
      accessibilityViewIsModal
      accessible
      accessibilityLabel="Astro Shop"
      accessibilityState={{ busy: !smiren }}>
      {!vel ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: neutral.grouped }]} />
      ) : (
        <>
          <Zavesa w={vel.w} h={vel.h} faze={faze} />
          {!bezPokreta && <PrelivUvoda faze={faze} />}
          <Krug cx={vel.w / 2} cy={vel.h / 2} faze={faze} krug={krug} onSpreman={lottieSpreman} />
        </>
      )}
    </Animated.View>
  );
}

/**
 * Siva preko cele aplikacije, sa kruznom rupom u sredini — BEZ oboda (Ivan,
 * 28.9.2026: dvostruki prsten koji se siri mu se nije svideo). Rupa je ogroman
 * potez oko kruga: `r - debljina/2` je ivica rupe, a spoljna ivica je daleko van
 * ekrana. Tako se animira samo jedan broj, bez sklapanja putanje u svakom kadru.
 */
function Zavesa({ w, h, faze }: { w: number; h: number; faze: Faze }) {
  const D = Math.hypot(w, h);
  const kraj = krajRupe(w, h);
  const rupa = useAnimatedProps(() => ({
    r: rupaPoluprecnik(faze.otvor.get(), UVOD_KRUG / 2, kraj) + D,
    strokeWidth: 2 * D,
  }));
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedCircle cx={w / 2} cy={h / 2} fill="none" stroke={neutral.grouped} animatedProps={rupa} />
    </Svg>
  );
}

/**
 * Preliv na vrhu — isti kao na pocetnoj (ljubicasti, sa mrljama koje plove), umesto
 * sjaja iza kruga (Ivan, 28.9.2026). Pojavi se dok se krug zavrti; pri otvaranju bledi
 * kad prozor stigne do vrha, jer je ispod vec preliv same aplikacije.
 *
 * Sopstveni sat mrlja: `ScreenBackdrop` je vezan za fokus ekrana, a uvod stoji van
 * navigacije. Oba sata krenu skoro istovremeno (aplikacija se montira kad uvod
 * krene), pa su mrlje pri pretapanju na skoro istom mestu.
 */
function PrelivUvoda({ faze }: { faze: Faze }) {
  const sat = useSharedValue(0);
  useFrameCallback((f) => {
    sat.set(sat.get() + (f.timeSincePreviousFrame ?? 0) / backdrop.drift.cycleMs);
  });
  const stil = useAnimatedStyle(() => ({
    opacity: faze.uvod.get() * (1 - clamp01((faze.otvor.get() - PRELIV_GASENJE) / (1 - PRELIV_GASENJE))),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: backdrop.height, overflow: 'hidden' }, stil]}>
      <PrelivSloj tint="purple" sat={sat} />
    </Animated.View>
  );
}

/** Lottie krug na sredini: vrti se, skupi se u zaletu, pa se pretopi dok malo raste. */
function Krug({ cx, cy, faze, krug, onSpreman }: {
  cx: number; cy: number; faze: Faze; krug: React.Ref<LogoKrugRef>; onSpreman: () => void;
}) {
  const stil = useAnimatedStyle(() => ({
    opacity: 1 - clamp01(faze.otvor.get() / KRUG_NESTAJE.udeo),
    transform: [{ scale: faze.R.get() / (UVOD_KRUG / 2) }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: cx - UVOD_KRUG / 2, top: cy - UVOD_KRUG / 2, width: UVOD_KRUG, height: UVOD_KRUG }, stil]}>
      <LogoKrug ref={krug} size={UVOD_KRUG} onSpreman={onSpreman} />
    </Animated.View>
  );
}
