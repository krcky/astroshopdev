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
import { KarticaZaDeljenje } from '@/components/prica/kartica';
import { SLIKE, tamnaSlika, type OkvirSlike } from '@/components/prica/slajdovi';
import { SatKojiTece } from '@/components/prica/sat';
import { KrugNapretka, procenat } from '@/components/prica/video-traka';
import { usePonudiVideo } from '@/components/prica/ponudi-video';
import { posaoDnevnePrice } from '@/components/prica/poslovi-videa';
import { usePricaDana, type PricaDana } from '@/lib/use-prica';
import type { SlikaKljuc } from '@/lib/prica';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { usePricaLog } from '@/store/prica-log';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/**
 * DNEVNA PRICA (verzija C, Ivan 30.9.2026) — sest slika o danasnjem danu, preko
 * celog ekrana, sa ulaza na pocetnoj (prsten oko planete "Tvog dana").
 *
 *  - Dodir desno: sledeca slika, levo (30%): prethodna. Drzanje: pauza, traka i
 *    dugmad se sklone. Povlacenje nadole: zatvaranje, ispod se vidi pocetna.
 *  - Traka napretka tece na UI niti (`useFrameCallback`), NE preko `withTiming`:
 *    uz "Smanji pokrete" `withTiming` odmah skoci na kraj i prica bi proletela
 *    (tako je Wrapped 2021 preskakao slajdove).
 *  - Uz "Smanji pokrete" i uz VoiceOver prica NE ide sama dalje — samo dodirom
 *    (WCAG 2.2.2, Apple "Reduced Motion").
 *  - Staje kad aplikacija ode u pozadinu, kad se otvori meni za deljenje i kad
 *    se preko nje otvori drugi ekran (ceo tekst, Premium).
 *  - Poslednja slika = prica POGLEDANA (`store/prica-log.ts`): prsten na pocetnoj
 *    posle toga miruje do sutra.
 *
 * Dodir ide kroz RN "responder", ne kroz Gesture Handler: dugmad u slikama
 * (Podeli, Pročitaj ceo tekst) su dublje u stablu i dobiju dodir pre roditelja, pa dodir
 * na dugme ne pomera i sliku.
 *
 * UVOD (`uvod`, Ivan 30.9.2026): ista prica u onboardingu, posle imena a PRE
 * obavestenja i paywalla (`(onboarding)/prva-prica.tsx`) — prvo vrednost, pa zahtevi.
 * Bez zaglavlja (logo, datum, X), bez "Podeli" i bez zatvaranja povlacenjem; na
 * poslednjoj slici umesto dugmadi saveta jedno dugme "Nastavi", koje vodi na obavestenja.
 */
export default function Prica() {
  return <PricaDanaEkran />;
}

export function PricaDanaEkran({ uvod = false }: { uvod?: boolean }) {
  const prica = usePricaDana();
  const dalje = useDaljeIzUvoda();
  // Bez karte nema ni price (npr. nepouzdana zona, pravilo 4): ne ostaje se na
  // krugu koji se vrti — uvod ide dalje (obavestenja), a sa pocetne se prica zatvara.
  React.useEffect(() => {
    if (prica) return;
    const t = setTimeout(uvod ? dalje : zatvori, 2500);
    return () => clearTimeout(t);
  }, [prica, uvod, dalje]);
  // Prica se "zamrzne" kad tekstovi stignu (najvise 2,5 s): redosled slika se ne
  // menja dok je otvorena, cak i ako neki tekst stigne kasnije.
  const [z, setZ] = React.useState<PricaDana | null>(null);
  React.useEffect(() => {
    if (z || !prica) return;
    if (!prica.ucitava) { setZ(prica); return; }
    const t = setTimeout(() => setZ(prica), 2500);
    return () => clearTimeout(t);
  }, [prica, z]);

  if (!z) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: neutral.grouped, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={neutral.inkMuted} />
      </View>
    );
  }
  return <Plejer p={z} uvod={uvod} onDalje={dalje} />;
}

const LOGO_KRUG = require('../../assets/images/logo-krug.png');
/**
 * Beli krug na tamnim slikama (naslovna, Mesec): Ivanov NEGATIV (`files/logo-negativ.svg`) — lice belo,
 * oci i usta u boji pozadine. Do 30.9.2026 pozitiv obojen `tintColor`-om u belo, pa je lice bilo naopako.
 */
const LOGO_KRUG_NEGATIV = require('../../assets/images/logo-krug-negativ.png');
/** Uvod: visina "Nastavi" (50) + razmak + red ispod dugmeta. */
const UVOD_DUGME = 50 + 8 + 20;

/** Zatvaranje: nazad na pocetnu; bez nje (otvoreno linkom) na kapiju, pravilo 11. */
function zatvori() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/**
 * Posle price u onboardingu: obavestenja (`push.tsx`) — prica se zavrsava sa "Nova priča
 * stiže svakog dana", a obavestenja je donose (Ivan, 30.9.2026). Dalje ide `push.tsx`.
 */
function useDaljeIzUvoda() {
  return React.useCallback(() => router.replace('/push'), []);
}

function Plejer({ p, uvod, onDalje }: { p: PricaDana; uvod: boolean; onDalje: () => void }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const slike = p.slike;
  const n = slike.length;

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
  const trajanje = useSharedValue(p.trajanja[slike[0]]);
  const indeks = useSharedValue(0);
  const drzi = useSharedValue(0);
  const vuce = useSharedValue(0);
  const pauzaJs = useSharedValue(0);
  const ceka = useSharedValue(0);
  const samaIdeSv = useSharedValue(samaIde ? 1 : 0);
  React.useEffect(() => { samaIdeSv.set(samaIde ? 1 : 0); }, [samaIde, samaIdeSv]);
  const tece = useDerivedValue(() => (drzi.get() || vuce.get() || pauzaJs.get() ? 0 : 1));

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const oznaci = usePricaLog((s) => s.oznaci);

  // Tekuca slika i van renderovanja: dva brza dodira pre novog crtanja inace vide isto `i`.
  const tekuca = React.useRef(0);
  const idi = React.useCallback((cilj: number, x?: number, y?: number) => {
    if (cilj < 0 || cilj >= n) return;
    tekuca.current = cilj;
    const id = brojac.current++;
    setI(cilj);
    setSlojevi((s) => [...s, { id, idx: cilj, x: x ?? W * 0.85, y: y ?? H * 0.55, animiraj: true }]);
    napredak.set(0);
    trajanje.set(p.trajanja[slike[cilj]]);
    indeks.set(cilj);
    ceka.set(0);
  }, [n, W, H, napredak, trajanje, indeks, ceka, p.trajanja, slike]);

  // Poslednja slika = prica pogledana.
  React.useEffect(() => {
    if (i === n - 1 && userId) oznaci(userId, p.dan);
  }, [i, n, userId, oznaci, p.dan]);

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
  const ulaz = useSharedValue(bezPokreta ? 1 : 0);
  React.useEffect(() => { ulaz.set(withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) })); }, [ulaz]);
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
    pomak.set(withTiming(H, { duration: 240, easing: Easing.in(Easing.cubic) }, (g) => { if (g) scheduleOnRN(zatvori); }));
  }, [pomak, H]);

  // --- dodir: responder (vidi komentar gore)
  const pocetak = React.useRef<{ x: number; y: number; t: ReturnType<typeof setTimeout> | null; drzi: boolean; vuce: boolean } | null>(null);
  const hromStil = useAnimatedStyle(() => ({ opacity: withTiming(drzi.get() ? 0 : 1, { duration: 200 }) }));
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
        pomak.set(withTiming(0, { duration: 220 }));
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
      if (s?.vuce) { pomak.set(withTiming(0, { duration: 220 })); vuce.set(0); }
    },
  };

  // --- deljenje: kartica ispod price se snimi, svede na 1080 × 1920 i preda sistemskom meniju
  const [deli, setDeli] = React.useState<SlikaKljuc | null>(null);
  const kartica = React.useRef<View>(null);
  const mozeDeljenje = Platform.OS !== 'web';
  const podeli = React.useCallback((k: SlikaKljuc) => {
    if (!mozeDeljenje || deli) return;
    pauzaJs.set(1);
    setDeli(k);
  }, [mozeDeljenje, deli, pauzaJs]);
  React.useEffect(() => {
    if (!deli) return;
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
        const fajl = new File(Paths.cache, `Astro Shop ${p.dan}.png`);
        await new File(gotova.uri).move(fajl, { overwrite: true });
        if (otkazano) return;
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fajl.uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Podeli svoj dan' });
        }
      } catch {
        // Otkazano deljenje ili pad snimka: prica samo nastavlja.
      } finally {
        if (!otkazano) { setDeli(null); pauzaJs.set(0); }
      }
    })();
    return () => { otkazano = true; };
  }, [deli, pauzaJs, p.dan]);

  // --- VIDEO (Ivan, 30.9.2026): "Podeli" nudi sliku ili celu pricu kao video (`ponudi-video.tsx`,
  // isto kao prica o znaku). Video se pravi van ekrana dok korisnik radi sta hoce; prica ide dalje.
  const posao = React.useMemo(() => posaoDnevnePrice(p), [p]);
  const pauza = React.useCallback((stoji: boolean) => pauzaJs.set(stoji ? 1 : 0), [pauzaJs]);
  const { ponudi: ponudiVideo, video } = usePonudiVideo({ posao, pauza, naslov: 'Podeli svoj dan' });
  const ponudi = React.useCallback((k: SlikaKljuc) => ponudiVideo(() => podeli(k)), [ponudiVideo, podeli]);

  const k = slike[i];
  const tamno = tamnaSlika(k);
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
  const procitaj = () => {
    const kljuc = p.savet?.kljuc ?? p.tvojDan?.kljuc;
    if (kljuc) router.push({ pathname: '/transit', params: { key: kljuc } });
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: neutral.grouped }, korenStil]}>
      <StatusBar style={tamno ? 'light' : 'dark'} animated />
      {/* Kartica za deljenje: ispod slika, u istom prozoru, samo dok se deli. */}
      {deli && (
        <View ref={kartica} collapsable={false} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
          <KarticaZaDeljenje p={p} k={deli} />
        </View>
      )}

      <View style={StyleSheet.absoluteFill} {...naDodir}>
        {slojevi.map((s, j) => {
          const Slika = SLIKE[slike[s.idx]];
          return (
            <Otkrivanje
              key={s.id}
              x={s.x}
              y={s.y}
              animiraj={s.animiraj}
              onGotovo={() => setSlojevi((sv) => sv.slice(Math.max(0, sv.findIndex((sl) => sl.id === s.id))))}
              zIndex={j}>
              {/* Svaka slika ima svoj sat od trenutka kad se pojavi (`sat.tsx`); drzanje ga zaustavi. */}
              <SatKojiTece tece={tece} pokret={!bezPokreta}>
                <Slika
                  p={p}
                  okvir={okvirZa(s.idx)}
                  uvod={uvod}
                  onPodeli={() => ponudi(slike[s.idx])}
                  onProcitaj={procitaj}
                />
              </SatKojiTece>
            </Otkrivanje>
          );
        })}
      </View>

      {/* Traka napretka i zaglavlje; drzanjem se sklone. */}
      <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, hromStil]}>
        <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 10, right: 10, flexDirection: 'row', gap: 4 }}>
          {slike.map((_, j) => (
            <Traka key={j} j={j} indeks={indeks} napredak={napredak} tamno={tamno} samaIde={samaIde} />
          ))}
        </View>
        {!uvod && (
        <View style={{ position: 'absolute', top: insets.top + 18, left: 14, right: 6, height: 42, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={tamno ? LOGO_KRUG_NEGATIV : LOGO_KRUG} style={{ width: 26, height: 26 }} accessibilityIgnoresInvertColors />
          <Text className={cn('text-[14px] leading-[18px]', tezina('row'))} style={{ color: boja }}>Astro Shop</Text>
          <Text className="flex-1 text-[14px] leading-[18px]" style={{ color: boja, opacity: 0.65 }}>{p.datumTekst}</Text>
          <Pressable
            onPress={zatvoriAnimirano}
            accessibilityRole="button"
            accessibilityLabel="Zatvori priču"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center active:opacity-60">
            <X size={22} color={boja} strokeWidth={2.2} />
          </Pressable>
        </View>
        )}
      </Animated.View>

      {/* "Podeli" dole desno — na poslednjoj slici je veliko dugme u samoj slici. */}
      {mozeDeljenje && !uvod && k !== 'savet' && (
        <Animated.View style={[{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }, hromStil]}>
          <Pressable
            onPress={() => ponudi(k)}
            accessibilityRole="button"
            accessibilityLabel={video?.stanje === 'pravi' ? `Podeli. Video se pravi, ${procenat(video.napredak)}` : 'Podeli'}
            className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2.5 active:opacity-80"
            style={{ backgroundColor: tamno ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: tamno ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.95)' }}>
            {deli
              ? <ActivityIndicator size="small" color={boja} />
              : video?.stanje === 'pravi'
                ? <KrugNapretka napredak={video.napredak} velicina={18} boja={boja} podloga={tamno ? 'rgba(255,255,255,0.28)' : 'rgba(21,21,21,0.16)'} />
                : <Share size={17} color={boja} strokeWidth={2} />}
            <Text className={cn('text-[14px] leading-[18px]', tezina('dugme'))} style={{ color: boja }}>Podeli</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Uvod: na poslednjoj slici "Nastavi" vodi na obavestenja, pa na paywall (Ivan, 30.9.2026).
          NE "Počinjemo": to obecava aplikaciju, a iza dugmeta su jos dva koraka. */}
      {uvod && i === n - 1 && (
        <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 16 }, hromStil]}>
          <Animated.View entering={FadeInDown.delay(bezPokreta ? 0 : 700).duration(500)} style={{ gap: 8 }}>
            <Button variant={tamno ? 'soft' : 'default'} onPress={onDalje}>
              <Text>Nastavi</Text>
            </Button>
            <Text className="text-center text-[13px] leading-[20px]" style={{ color: tamno ? 'rgba(255,255,255,0.8)' : neutral.inkMuted }}>
              Nova priča stiže svakog dana, na početnoj.
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Uz VoiceOver: sledeca/prethodna kao dugmad (prica tada ne ide sama). */}
      {citac && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 70, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Prethodna slika" onPress={() => idi(tekuca.current - 1)} className="h-11 w-11" />
          <Pressable accessibilityRole="button" accessibilityLabel={`Sledeća slika, ${i + 1} od ${n}`} onPress={() => idi(tekuca.current + 1)} className="h-11 w-11" />
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
 * Prelaz: nova slika se otkriva krugom koji se siri iz mesta dodira (iz verzije B).
 * Krug je obican `View` sa `overflow: hidden` i zaobljenjem, a slika u njemu stoji
 * u mestu (pomera se suprotno krugu). Uz "Smanji pokrete" samo pretapanje.
 */
function Otkrivanje({ x, y, animiraj, onGotovo, zIndex, children }: {
  x: number; y: number; animiraj: boolean; onGotovo: () => void; zIndex: number; children: React.ReactNode;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const bezPokreta = useReducedMotion();
  const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 2;
  const r = useSharedValue(animiraj && !bezPokreta ? 0 : R);
  const o = useSharedValue(animiraj && bezPokreta ? 0 : 1);
  React.useEffect(() => {
    if (!animiraj) return;
    const gotovo = (g?: boolean) => { 'worklet'; if (g) scheduleOnRN(onGotovo); };
    if (bezPokreta) o.set(withTiming(1, { duration: 300, reduceMotion: ReduceMotion.Never }, gotovo));
    else r.set(withTiming(R, { duration: 750, easing: Easing.bezier(0.7, 0, 0.2, 1), reduceMotion: ReduceMotion.Never }, gotovo));
    // Jednom, pri montiranju.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const krug = useAnimatedStyle(() => ({
    left: x - r.get(), top: y - r.get(), width: 2 * r.get(), height: 2 * r.get(), borderRadius: r.get(), opacity: o.get(),
  }));
  const unutra = useAnimatedStyle(() => ({ left: r.get() - x, top: r.get() - y }));
  return (
    <Animated.View style={[{ position: 'absolute', overflow: 'hidden', zIndex }, krug]}>
      <Animated.View style={[{ position: 'absolute', width: W, height: H }, unutra]}>{children}</Animated.View>
    </Animated.View>
  );
}
