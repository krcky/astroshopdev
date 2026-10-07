import * as React from 'react';
import {
  AccessibilityInfo, ActivityIndicator, AppState, Image, Platform, Pressable, StyleSheet, useWindowDimensions, View,
  type GestureResponderEvent,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing, FadeInDown, ReduceMotion, useAnimatedStyle, useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue,
  withTiming, type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { Share, X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { SatKojiTece } from '@/components/prica/sat';
import { usePonudiVideo } from '@/components/prica/ponudi-video';
import { KrugNapretka, procenat } from '@/components/prica/video-traka';
import type { OkvirSlike } from '@/components/prica/slajdovi';
import { cn } from '@/lib/utils';
import type { PosaoVidea } from '@/store/video-price';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/**
 * OPSTI PLEJER PRICE (30.9.2026, za pricu o znaku) — isto ponasanje kao dnevna prica
 * (`app/prica.tsx`), ali bez njenih podataka: slike, trajanja i kartice daje `OpisPrice`.
 *
 *  - Dodir desno: sledeca slika, levo (30%): prethodna. Drzanje: pauza, traka i dugmad se
 *    sklone. Povlacenje nadole: zatvaranje.
 *  - Traka napretka tece na UI niti (`useFrameCallback`), ne preko `withTiming` — uz "Smanji
 *    pokrete" bi ovaj skocio na kraj. Uz "Smanji pokrete" i VoiceOver prica NE ide sama dalje, ali se pokreti crtaju (7.10.2026).
 *  - Stoji u pozadini aplikacije, dok je otvoren meni za deljenje i dok je preko nje drugi ekran.
 *  - Svaka slika ima svoj SAT SLIKE (`sat.tsx`) od trenutka kad se pojavi; drzanje ga zaustavi.
 *  - "Podeli" nudi OVU SLIKU ili CELU PRICU KAO VIDEO (`ponudi-video.tsx`, isto kao dnevna; bez
 *    `video` u opisu samo slika). Slika: KARTICA tekuce slike (360 × 640, skrivena ispod price),
 *    svedena na 1080 × 1920, u sistemski meni. Video: `video-radionica.tsx`, van ekrana.
 *
 * Dodir ide kroz RN "responder", ne Gesture Handler: dugmad u slikama dobiju dodir pre roditelja.
 * Dnevna prica jos ima svoj plejer (`app/prica.tsx`); kad se prebaci na ovaj, dupliranja nema.
 *
 * UVOD (`uvod`, Ivan 1.10.2026: u onboardingu prica o znaku umesto dnevne, ista pravila): bez
 * zaglavlja (logo, natpis, X), bez "Podeli" i bez zatvaranja povlacenjem — prica se mora odgledati.
 * Na poslednjoj slici jedno dugme "Nastavi" (`onDalje`) i red ispod njega; sadrzaj slike ide iznad.
 */
export type OpisPrice = {
  /** Trajanje svake slike (ms); broj slika = duzina niza. */
  trajanja: number[];
  /** Posle "Astro Shop" u zaglavlju (npr. "Tvoj znak"). */
  podnaslov: string;
  /** Tamna slika: beli natpisi, traka i statusna traka. */
  tamna: (i: number) => boolean;
  slika: (i: number, a: { okvir: OkvirSlike; onPodeli: () => void }) => React.ReactElement;
  /** Kartica za deljenje tekuce slike, 360 × 640. */
  kartica: (i: number) => React.ReactElement;
  /** Slike na kojima je veliko dugme za deljenje u samoj slici — bez malog "Podeli" dole desno. */
  bezMalogPodeli?: (i: number) => boolean;
  /** Ime fajla slike, bez nastavka ("Astro Shop Ovan"). */
  imeFajla: string;
  /** Naslov sistemskog menija za deljenje. */
  naslovDeljenja: string;
  /** Stigao do poslednje slike = prica pogledana. */
  onPoslednja?: () => void;
  /** Video cele price (`poslovi-videa.tsx`); bez njega "Podeli" deli samo sliku. */
  video?: PosaoVidea;
};

const LOGO_KRUG = require('../../../assets/images/logo-krug.png');
const LOGO_KRUG_NEGATIV = require('../../../assets/images/logo-krug-negativ.png');
/** Uvod: visina "Nastavi" (50) + razmak + red ispod dugmeta — isto kao dnevna (`app/prica.tsx`). */
const UVOD_DUGME = 50 + 8 + 20;

/** Zatvaranje: nazad; bez prethodnog ekrana (otvoreno linkom) na kapiju, pravilo 11. */
function zatvori() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function PlejerPrice({ opis, uvod = false, onDalje }: { opis: OpisPrice; uvod?: boolean; onDalje?: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const n = opis.trajanja.length;

  // --- ko sme da ide sam dalje
  const bezPokreta = useReducedMotion();
  const [citac, setCitac] = React.useState(false);
  React.useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setCitac).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setCitac);
    return () => sub.remove();
  }, []);
  const samaIde = !bezPokreta && !citac;

  // --- stanje: koja slika, i slojevi za prelaz krugom
  const [i, setI] = React.useState(0);
  const [slojevi, setSlojevi] = React.useState<{ id: number; idx: number; x: number; y: number; animiraj: boolean }[]>(
    () => [{ id: 0, idx: 0, x: W / 2, y: H / 2, animiraj: false }]
  );
  const brojac = React.useRef(1);

  // --- tok vremena (UI nit)
  const napredak = useSharedValue(0);
  const trajanje = useSharedValue(opis.trajanja[0]);
  const indeks = useSharedValue(0);
  const drzi = useSharedValue(0);
  const vuce = useSharedValue(0);
  const pauzaJs = useSharedValue(0);
  const ceka = useSharedValue(0);
  const samaIdeSv = useSharedValue(samaIde ? 1 : 0);
  React.useEffect(() => { samaIdeSv.set(samaIde ? 1 : 0); }, [samaIde, samaIdeSv]);
  const tece = useDerivedValue(() => (drzi.get() || vuce.get() || pauzaJs.get() ? 0 : 1));

  // Tekuca slika i van renderovanja: dva brza dodira pre novog crtanja inace vide isto `i`.
  const tekuca = React.useRef(0);
  const idi = React.useCallback((cilj: number, x?: number, y?: number) => {
    if (cilj < 0 || cilj >= n) return;
    tekuca.current = cilj;
    const id = brojac.current++;
    setI(cilj);
    setSlojevi((s) => [...s, { id, idx: cilj, x: x ?? W * 0.85, y: y ?? H * 0.55, animiraj: true }]);
    napredak.set(0);
    trajanje.set(opis.trajanja[cilj]);
    indeks.set(cilj);
    ceka.set(0);
  }, [n, W, H, napredak, trajanje, indeks, ceka, opis.trajanja]);

  const onPoslednja = opis.onPoslednja;
  React.useEffect(() => {
    if (i === n - 1) onPoslednja?.();
  }, [i, n, onPoslednja]);

  const krajSlike = React.useCallback(() => { idi(tekuca.current + 1); }, [idi]);

  useFrameCallback((f) => {
    if (tece.get() === 0 || samaIdeSv.get() === 0 || ceka.get() === 1) return;
    const sledece = napredak.get() + (f.timeSincePreviousFrame ?? 0) / trajanje.get();
    if (sledece >= 1) {
      napredak.set(1);
      ceka.set(1);
      scheduleOnRN(krajSlike);
    } else {
      napredak.set(sledece);
    }
  });

  // --- pauza: pozadina aplikacije, drugi ekran preko price
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => pauzaJs.set(st === 'active' ? 0 : 1));
    return () => sub.remove();
  }, [pauzaJs]);
  useFocusEffect(React.useCallback(() => {
    pauzaJs.set(0);
    return () => pauzaJs.set(1);
  }, [pauzaJs]));

  // --- ulaz i zatvaranje
  const ulaz = useSharedValue(0);
  React.useEffect(() => { ulaz.set(withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never })); }, [ulaz]);
  const pomak = useSharedValue(0);
  const korenStil = useAnimatedStyle(() => {
    const d = pomak.get();
    return {
      opacity: ulaz.get(),
      borderRadius: d > 0 ? 28 : 0,
      transform: [
        { translateY: d * 0.6 },
        { scale: (0.94 + 0.06 * ulaz.get()) * Math.max(0.82, 1 - (d / H) * 0.5) },
      ],
    };
  });
  const zatvoriAnimirano = React.useCallback(() => {
    pomak.set(withTiming(H, { duration: 240, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.Never }, (g) => { if (g) scheduleOnRN(zatvori); }));
  }, [pomak, H]);

  // --- dodir: responder (vidi komentar gore)
  const pocetak = React.useRef<{ x: number; y: number; t: ReturnType<typeof setTimeout> | null; drzi: boolean; vuce: boolean } | null>(null);
  const hromStil = useAnimatedStyle(() => ({ opacity: withTiming(drzi.get() ? 0 : 1, { duration: 200, reduceMotion: ReduceMotion.Never }) }));
  const naDodir = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      const t = setTimeout(() => { if (pocetak.current) { pocetak.current.drzi = true; drzi.set(1); } }, 200);
      pocetak.current = { x: pageX, y: pageY, t, drzi: false, vuce: false };
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const s = pocetak.current;
      if (!s) return;
      const dy = e.nativeEvent.pageY - s.y;
      const dx = e.nativeEvent.pageX - s.x;
      if (!uvod && !s.vuce && dy > 14 && dy > Math.abs(dx)) {
        s.vuce = true;
        if (s.t) clearTimeout(s.t);
        drzi.set(0);
        vuce.set(1);
      }
      if (s.vuce) pomak.set(Math.max(0, dy));
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      const s = pocetak.current;
      pocetak.current = null;
      if (!s) return;
      if (s.t) clearTimeout(s.t);
      if (s.vuce) {
        const dy = e.nativeEvent.pageY - s.y;
        if (dy > 110) { zatvoriAnimirano(); return; }
        pomak.set(withTiming(0, { duration: 220, reduceMotion: ReduceMotion.Never }));
        vuce.set(0);
        return;
      }
      if (s.drzi) { drzi.set(0); return; }
      const { pageX, pageY } = e.nativeEvent;
      if (pageX < W * 0.3) idi(tekuca.current - 1, pageX, pageY);
      else idi(tekuca.current + 1, pageX, pageY);
    },
    onResponderTerminate: () => {
      const s = pocetak.current;
      pocetak.current = null;
      if (s?.t) clearTimeout(s.t);
      drzi.set(0);
      if (s?.vuce) { pomak.set(withTiming(0, { duration: 220, reduceMotion: ReduceMotion.Never })); vuce.set(0); }
    },
  };

  // --- deljenje: kartica ispod price se snimi, svede na 1080 × 1920 i preda sistemskom meniju
  const [deli, setDeli] = React.useState<number | null>(null);
  const kartica = React.useRef<View>(null);
  const mozeDeljenje = Platform.OS !== 'web';
  const podeli = React.useCallback((idx: number) => {
    if (!mozeDeljenje || deli !== null) return;
    pauzaJs.set(1);
    setDeli(idx);
  }, [mozeDeljenje, deli, pauzaJs]);
  const { imeFajla, naslovDeljenja } = opis;
  // Slika ili video (`ponudi-video.tsx`); meni zaustavi pricu dok je otvoren.
  const pauza = React.useCallback((stoji: boolean) => pauzaJs.set(stoji ? 1 : 0), [pauzaJs]);
  const { ponudi: ponudiVideo, video } = usePonudiVideo({ posao: opis.video ?? null, pauza, naslov: naslovDeljenja });
  const ponudi = React.useCallback((idx: number) => ponudiVideo(() => podeli(idx)), [ponudiVideo, podeli]);
  React.useEffect(() => {
    if (deli === null) return;
    let otkazano = false;
    (async () => {
      try {
        // Kartica je tek montirana: dva kadra za raspored i slike (lokalne, vec dekodirane).
        await new Promise((r) => setTimeout(r, 350));
        if (otkazano || !kartica.current) return;
        const snimak = await captureRef(kartica, { format: 'png', quality: 1, result: 'tmpfile' });
        const uri = snimak.startsWith('file://') ? snimak : `file://${snimak}`;
        const slika = await ImageManipulator.manipulate(uri).resize({ width: 1080, height: 1920 }).renderAsync();
        const gotova = await slika.saveAsync({ format: SaveFormat.PNG });
        // Citljivo ime umesto nasumicnog — vidi se u meniju za deljenje, u Fajlovima i preko AirDrop-a.
        const fajl = new File(Paths.cache, `${imeFajla}.png`);
        await new File(gotova.uri).move(fajl, { overwrite: true });
        if (otkazano) return;
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fajl.uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: naslovDeljenja });
        }
      } catch {
        // Otkazano deljenje ili pad snimka: prica samo nastavlja.
      } finally {
        if (!otkazano) { setDeli(null); pauzaJs.set(0); }
      }
    })();
    return () => { otkazano = true; };
  }, [deli, pauzaJs, imeFajla, naslovDeljenja]);

  const tamno = opis.tamna(i);
  const boja = tamno ? neutral.white : neutral.ink;
  const okvir: OkvirSlike = {
    vrh: insets.top + 64,
    dno: insets.bottom + 76,
    sirina: W,
    visina: H,
    donjiUmetak: insets.bottom,
  };
  // U uvodu poslednja slika ima dole "Nastavi" i red ispod njega — sadrzaj ide iznad.
  const okvirZa = (idx: number): OkvirSlike => (uvod && idx === n - 1 ? { ...okvir, dno: insets.bottom + 16 + UVOD_DUGME + 12 } : okvir);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: neutral.grouped }, korenStil]}>
      <StatusBar style={tamno ? 'light' : 'dark'} animated />
      {/* Kartica za deljenje: ispod slika, u istom prozoru, samo dok se deli. */}
      {deli !== null && (
        <View ref={kartica} collapsable={false} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
          {opis.kartica(deli)}
        </View>
      )}

      <View style={StyleSheet.absoluteFill} {...naDodir}>
        {slojevi.map((s, j) => (
          <Otkrivanje
            key={s.id}
            x={s.x}
            y={s.y}
            animiraj={s.animiraj}
            onGotovo={() => setSlojevi((sv) => sv.slice(Math.max(0, sv.findIndex((sl) => sl.id === s.id))))}
            zIndex={j}>
            <SatKojiTece tece={tece} pokret>
              {opis.slika(s.idx, { okvir: okvirZa(s.idx), onPodeli: () => ponudi(s.idx) })}
            </SatKojiTece>
          </Otkrivanje>
        ))}
      </View>

      {/* Traka napretka i zaglavlje; drzanjem se sklone. */}
      <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, hromStil]}>
        <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 10, right: 10, flexDirection: 'row', gap: 4 }}>
          {opis.trajanja.map((_, j) => (
            <Traka key={j} j={j} indeks={indeks} napredak={napredak} tamno={tamno} samaIde={samaIde} />
          ))}
        </View>
        {!uvod && (
        <View style={{ position: 'absolute', top: insets.top + 18, left: 14, right: 6, height: 42, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={tamno ? LOGO_KRUG_NEGATIV : LOGO_KRUG} style={{ width: 26, height: 26 }} accessibilityIgnoresInvertColors />
          <Text className={cn('text-[14px] leading-[18px]', tezina('row'))} style={{ color: boja }}>{t.opste.imeAplikacije}</Text>
          <Text className="flex-1 text-[14px] leading-[18px]" style={{ color: boja, opacity: 0.65 }}>{opis.podnaslov}</Text>
          <Pressable
            onPress={zatvoriAnimirano}
            accessibilityRole="button"
            accessibilityLabel={t.prica.plejer.zatvori}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center active:opacity-60">
            <X size={22} color={boja} strokeWidth={2.2} />
          </Pressable>
        </View>
        )}
      </Animated.View>

      {/* "Podeli" dole desno — slike sa velikim dugmetom ga nemaju, a ni uvod. */}
      {mozeDeljenje && !uvod && !opis.bezMalogPodeli?.(i) && (
        <Animated.View style={[{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }, hromStil]}>
          <Pressable
            onPress={() => ponudi(i)}
            accessibilityRole="button"
            accessibilityLabel={video?.stanje === 'pravi' ? t.prica.plejer.podeliVideoSePravi(procenat(video.napredak)) : t.opste.podeli}
            className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2.5 active:opacity-80"
            style={{ backgroundColor: tamno ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: tamno ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.95)' }}>
            {deli !== null
              ? <ActivityIndicator size="small" color={boja} />
              : video?.stanje === 'pravi'
                ? <KrugNapretka napredak={video.napredak} velicina={18} boja={boja} podloga={tamno ? 'rgba(255,255,255,0.28)' : 'rgba(21,21,21,0.16)'} />
                : <Share size={17} color={boja} strokeWidth={2} />}
            <Text className={cn('text-[14px] leading-[18px]', tezina('dugme'))} style={{ color: boja }}>{t.opste.podeli}</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Uvod: na poslednjoj slici "Nastavi" vodi dalje (obavestenja, pa paywall) — kao dnevna.
          NE "Počinjemo": iza dugmeta su jos dva koraka. */}
      {uvod && i === n - 1 && (
        <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 16 }, hromStil]}>
          <Animated.View entering={FadeInDown.delay(700).duration(500).reduceMotion(ReduceMotion.Never)} style={{ gap: 8 }}>
            <Button variant={tamno ? 'soft' : 'default'} onPress={onDalje}>
              <Text>{t.opste.nastavi}</Text>
            </Button>
            <Text className="text-center text-[13px] leading-[20px]" style={{ color: tamno ? 'rgba(255,255,255,0.8)' : neutral.inkMuted }}>
              {t.prica.plejer.novaPricaStize}
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Uz VoiceOver: sledeca/prethodna kao dugmad (prica tada ne ide sama). */}
      {citac && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 70, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t.prica.plejer.prethodnaSlika} onPress={() => idi(tekuca.current - 1)} className="h-11 w-11" />
          <Pressable accessibilityRole="button" accessibilityLabel={t.prica.plejer.sledecaSlika(i + 1, n)} onPress={() => idi(tekuca.current + 1)} className="h-11 w-11" />
        </View>
      )}
    </Animated.View>
  );
}

/** Deo trake napretka: pune su prosle slike, tekuca raste, buduce su prazne. */
function Traka({ j, indeks, napredak, tamno, samaIde }: {
  j: number; indeks: SharedValue<number>; napredak: SharedValue<number>; tamno: boolean; samaIde: boolean;
}) {
  const stil = useAnimatedStyle(() => {
    const idx = indeks.get();
    const deo = j < idx ? 1 : j === idx ? (samaIde ? napredak.get() : 1) : 0;
    return { transform: [{ scaleX: deo }] };
  });
  return (
    <View style={{ flex: 1, height: 2.6, borderRadius: 2, overflow: 'hidden', backgroundColor: tamno ? 'rgba(255,255,255,0.28)' : 'rgba(21,21,21,0.16)' }}>
      <Animated.View style={[{ flex: 1, backgroundColor: tamno ? neutral.white : neutral.ink, transformOrigin: 'left' }, stil]} />
    </View>
  );
}

/**
 * Prelaz: nova slika se otkriva krugom koji se siri iz mesta dodira. I uz "Smanji pokrete"
 * (Ivan, 7.10.2026). Isto kao u dnevnoj prici.
 */
function Otkrivanje({ x, y, animiraj, onGotovo, zIndex, children }: {
  x: number; y: number; animiraj: boolean; onGotovo: () => void; zIndex: number; children: React.ReactNode;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 2;
  const r = useSharedValue(animiraj ? 0 : R);
  React.useEffect(() => {
    if (!animiraj) return;
    const gotovo = (g?: boolean) => { 'worklet'; if (g) scheduleOnRN(onGotovo); };
    r.set(withTiming(R, { duration: 750, easing: Easing.bezier(0.7, 0, 0.2, 1), reduceMotion: ReduceMotion.Never }, gotovo));
    // Jednom, pri montiranju.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const krug = useAnimatedStyle(() => ({
    left: x - r.get(), top: y - r.get(), width: 2 * r.get(), height: 2 * r.get(), borderRadius: r.get(),
  }));
  const unutra = useAnimatedStyle(() => ({ left: r.get() - x, top: r.get() - y }));
  return (
    <Animated.View style={[{ position: 'absolute', overflow: 'hidden', zIndex }, krug]}>
      <Animated.View style={[{ position: 'absolute', width: W, height: H }, unutra]}>{children}</Animated.View>
    </Animated.View>
  );
}
