import * as React from 'react';
import {
  Animated as RNAnimated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutRectangle,
  type ScrollViewProps,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { PostepenoZamucenje } from '@/components/postepeno-zamucenje';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';

import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { BezInterneta } from '@/components/bez-interneta';
import { backdrop, headerBar, neutral, space, type BackdropTint } from '@/theme/tokens';
import { useBackdropStore, type ScreenBackground } from '@/store/backdrop';
import { STARI_IOS } from '@/lib/platform';
import { TRAKA_VIDEA_VISINA, useTrakaVidea } from '@/components/prica/video-traka';
import { probudi, useBudnost, useUstedaBaterije } from '@/store/budnost';
import { useT } from '@/i18n';

/**
 * Zajednicki okvir ekrana — preliv na vrhu, zamucena traka, sadrzaj koji klizi
 * ispod oba, na sivoj pozadini.
 *
 * ZASTO OKVIR A NE TRI KOMPONENTE: razmak na vrhu sadrzaja mora da bude tacno
 * `insets.top + headerBar.height`. Da svaki ekran sam sabira ta dva broja,
 * prvi naslov bi se na jednom ekranu podvukao pod traku a na drugom odlepio —
 * i to bi se videlo tek na telefonu sa zarezom. Ovde se sabira na jednom mestu.
 *
 * POZADINA JE SIVA, KARTICE SU BELE. Obrnuto ne radi: bela kartica na beloj
 * pozadini je ista boja, a preliv koji stoji iznad oboji i nju i pozadinu
 * podjednako — pa se kartica koja prolazi kroz preliv uopste ne vidi kao
 * kartica. Recept povrsine je `CARD_SURFACE` u `ui/card.tsx`.
 *
 * ---------------------------------------------------------------------------
 * REDOSLED SLOJEVA (odozdo nagore) — prepisan iz reference, ne izmisljen:
 *
 *   1. sadrzaj (ScrollView)   ide ispod svega, bez svojih umetaka na vrhu
 *   2. zamucenje              visoko `insets.top + headerBar.height`, ostro se zavrsava
 *   3. preliv                 visok 230 od vrha ekrana, PREKO zamucenja
 *   3b. iznad preliva         samo ono sto ekran podigne kroz `IznadPreliva` (krug karte)
 *   4. natpis trake           preko svega
 *
 * U referenci je preliv dete trake koja nosi `backdrop-filter`, pa se crta
 * POSLE zamucenja i nastavlja ispod njega jos ~127px. Ovde je to isti redosled
 * pisanja u JSX-u. Ako preliv ode iznad zamucenja, gornji deo u visini trake izgubi boju i
 * traka pocne da izgleda kao siva pruga.
 *
 * Sva tri sloja su DIREKTNA deca korenskog `View`-a, namerno. Kad su preliv i
 * natpis uvuceni u zajednicki omotac visine trake, Android odsece preliv na
 * visinu trake jer podrazumevano secka ono sto izadje iz roditelja — a iOS ne secka,
 * pa bi se razlika videla tek na drugom telefonu.
 *
 * ---------------------------------------------------------------------------
 * ZAMUCENJE SE PALI TEK NA KLIZANJE.
 *
 * Na vrhu liste `intensity` je nula. Dok ispod trake nema niceg, nema sta ni
 * da se zamuti — traka tada samo posvetli prazan prostor i preko preliva se
 * procita kao siva pruga. Udeo raste sa pomerajem i stigne na pun posle
 * `headerBar.blurAt` pt.
 *
 * MORA preko Reanimated-ovog `animatedProps`. `intensity` je obican prop, ne
 * stil, i do njega se drugacije ne stize:
 *
 *   - RN-ov `Animated` ne pomaze. `BlurView` je klasna komponenta bez
 *     `setNativeProps`, pa animirana providnost na njemu NE STIGNE do ekrana —
 *     provereno, traka ostane na nuli i kad je stanje upaljeno.
 *   - `expo-blur` bas zato izvozi `getAnimatableRef()`: Reanimated preko njega
 *     menja nativni sloj. Provereno: `intensity` 20 daje `blur(4px)`.
 *
 * Zato je skrol `Animated.ScrollView` — pomeraj se cita u niti za pokret, bez
 * prolaska kroz JS na svaki kadar.
 *
 * ---------------------------------------------------------------------------
 * ANDROID NEMA ZAMUCENJA (Ivan, 30.9.2026) — traka je PUNA podloga u boji
 * pozadine ekrana, koja se pojavi istom rampom kao zamucenje (`trakaAndroid`).
 * `expo-blur` na Androidu (Dimezis) je u SVAKOM kadru snimao ceo sadrzaj ispod
 * trake i mutio ga — na 120 Hz aplikacija je seckala (Xiaomi 11T). Uz to je sa
 * `intensity` 0 obarao aplikaciju ("nativePtr is null": `configureBlurView` nulu
 * ne preskace). Punu traku imaju i Material aplikacije. Zato ni `BlurTargetView`
 * vise ne treba — na iOS-u je ionako bio obican `View`.
 */

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

/**
 * Koliko je traka na Androidu NIZE od statusne (`headerBar.androidVrh`) — i razmak na
 * vrhu sadrzaja (`traka`). Izvezeno za ono sto se ravna po traci van `Screen`-a (meni dana
 * na pocetnoj, gornji red onboardinga). iOS: 0.
 */
export const VRH_ANDROID = Platform.OS === 'android' ? headerBar.androidVrh : 0;
/**
 * POSTEPENO ZAMUCENJE (Ivan, 30.9.2026): u sopstvenom buildu traka nema ostru donju
 * ivicu — nativni modul (`components/postepeno-zamucenje.tsx`) bledi nadole. Expo Go
 * ga nema, pa tamo ostaje `AnimatedBlurView` gore. Traka je tada za `PRELAZ_ISPOD`
 * duza, a bledi od `PRELAZ_IZNAD` pre svoje dosadasnje ivice.
 */
const AnimatedPostepeno = PostepenoZamucenje ? Animated.createAnimatedComponent(PostepenoZamucenje) : null;
const PRELAZ_ISPOD = 24;
const PRELAZ_IZNAD = 12;

/**
 * Za koliko pt klizanja podignuti element (`IznadPreliva`) izbledi i ostane samo
 * njegov primerak u sadrzaju, ispod preliva. Krug karte na vrhu liste ukrsti
 * donju ivicu trake vec posle ~15 pt, pa do tada podignuti primerak spadne na
 * trecinu: ivica sloja (`traka`) se skoro ne vidi, a dalje krug ide ispod trake
 * i preliva kao sav ostali sadrzaj.
 */
const IZNAD_PRELIVA_BLEDI = 24;

/** Element koji `Screen` crta iznad preliva — gde je u sadrzaju i koliko je velik. */
type Podignuto = { element: React.ReactNode; x: number; y: number; w: number; h: number };

/**
 * ANDROID: JEDAN PRIMERAK (Ivan, 1.10.2026: "zasto uopste imamo dupli krug"). Na iOS-u primerak
 * u sadrzaju klizi pod ZAMUCENU traku, pa mora da postoji. Android traku ne muti (puna je, vidi
 * "ANDROID NEMA ZAMUCENJA"), pa tamo element postoji SAMO iznad preliva: klizi sa skrolom i
 * nestaje na ivici trake, a u sadrzaju stoji prazno mesto iste velicine (`velicina`). Tocak se
 * crtao dvaput — prelazak na "Ti" i "Nebo" je cekao (kadrovi od 130—200 ms, Xiaomi 11T).
 */
const JEDAN_PRIMERAK = Platform.OS === 'android';

/** `Screen` preko ovoga prima podignuti element; `null` kad ekran nema preliv. */
const IznadPrelivaContext = React.createContext<((p: Podignuto | null) => void) | null>(null);

/**
 * Koliko ekran koji ODLAZI jos drzi svoju boju i pozadinu.
 *
 * iOS pre 26: UITabBarController sam pretapa ekrane pri promeni taba (~0,15 s)
 * i za to vreme se VIDI i ekran koji odlazi. Da on odmah predje na zajednicku
 * nijansu (kao sto ekrani u pozadini rade), bljesnuo bi u boji novog taba —
 * snimljeno na iOS 18.6, Ivan 27.9.2026. Zato ceka da sistemsko pretapanje
 * prodje, pa tek onda prati zajednicku nijansu. iOS 26 ne pretapa: odmah.
 */
const ODLAZAK_MS = STARI_IOS ? 300 : 0;

/** Pozove `fn` posle `ODLAZAK_MS` (odmah ako je 0); vraca funkciju koja otkazuje. */
function posleOdlaska(fn: () => void): () => void {
  if (ODLAZAK_MS === 0) { fn(); return () => {}; }
  const t = setTimeout(fn, ODLAZAK_MS);
  return () => clearTimeout(t);
}

/**
 * Koliko prostora ekran ostavlja na dnu da native traka tabova ne prekrije
 * sadrzaj. Nas skrol ima `contentInsetAdjustmentBehavior="never"` (zbog vrha),
 * pa sistem ne moze sam da doda donji umetak. Broj je visina trake plus
 * vazduh; donji safe-area umetak se dodaje posebno jer zavisi od uredjaja.
 * iOS 26: plutajuca traka ~50pt iznad umetka. Android: Material traka 80pt.
 */
const TAB_BAR_SPACE = Platform.select({ ios: 62, default: 80 });

/**
 * Prazan prostor na dnu ekrana ispod trake — ide kao POSLEDNJE dete ScrollView-a.
 * Spacer, a ne `pb-*`: fiksan broj bi na telefonu sa zarezom sekao sadrzaj, a
 * na starijem ostavljao rupu.
 */
function TabBarSpacer() {
  return <View style={{ height: useTabBarSpace() }} />;
}

/**
 * Koliko je od dna ekrana do vrha trake tabova (sa vazduhom), na ovom uredjaju.
 * Za sve sto mora da stoji IZNAD trake nezavisno od visine ekrana — npr.
 * indikator slajdova na pocetnoj. Isti broj kao `TabBarSpacer`, da se ne raziđu.
 */
/** Od dna ekrana do vrha trake tabova, bez prostora za traku videa — gde ona pocinje (`video-traka.tsx`). */
export function useVisinaTrakeTabova(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_SPACE + insets.bottom;
}

export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  // Traka videa price iznad tabova (iOS 26, `video-traka.tsx`) pokrije jos toliko dna.
  const video = !!useTrakaVidea();
  return TAB_BAR_SPACE + insets.bottom + (video ? TRAKA_VIDEA_VISINA : 0);
}

type ScreenProps = {
  /** Ime strane u traci, pored kruga loga; ili gotov element umesto toga. */
  label: React.ReactNode;
  /**
   * Levo od natpisa. Gurnut ekran (`pushed`) sam dobija strelicu nazad — ovo je
   * samo za izuzetke.
   */
  left?: React.ReactNode;
  /** Sadrzaj desne strane trake (dugme, ikona). Opciono. */
  right?: React.ReactNode;
  /**
   * Nijansa preliva na vrhu; podrazumevano referentna ljubicasta, a na gurnutom
   * ekranu `none` (bez preliva, Ivan 27.9.2026).
   */
  tint?: BackdropTint;
  /**
   * Pozadina ekrana. Podrazumevano SIVA (`grouped`) — uslov da se preliv vidi na
   * belim karticama (DESIGN.md, poglavlje 5). `white` je izuzetak za ekran BEZ
   * preliva (Natalna karta, Ivan 26.9.2026); kartice na njemu moraju imati
   * ivicu (`border-border`), inace se ne vide.
   */
  background?: ScreenBackground;
  /**
   * Ekran GURNUT preko tabova (profil, tumacenje, izmena, mesto): klizi preko
   * taba koji ostaje vidljiv ispod. Zato NE dira zajednicku nijansu/pozadinu i
   * ne pretapa — crta svoje odmah. Bez ovoga tab ispod "pomisli" da je u
   * pozadini, preuzme boju gurnutog ekrana i preliv mu nestane u trenutku
   * (bljesak pri odlasku na profil, Ivan 26.9.2026), a pri povratku se vrati
   * tek posle klizanja.
   */
  pushed?: boolean;
  /**
   * Da li sadrzaj dobija bocnu marginu ekrana (20pt).
   *
   * Ekrani koji svaku sekciju sami uvlace (`mx-5`) — karta i nebo — salju
   * `false`, jer tocak i trake moraju da idu od ivice do ivice.
   */
  padded?: boolean;
  /**
   * Prazan prostor za lebdecu traku na dnu. Iskljuci na ekranima van tabova —
   * tada se umesto trake dodaje donji safe-area umetak, da poslednje dugme ne
   * zavrsi pod home indikatorom.
   */
  tabBarSpace?: boolean;
  children: React.ReactNode;
} & Omit<ScrollViewProps, 'children' | 'contentContainerStyle' | 'onScroll'>;

export function Screen({
  label,
  left,
  right,
  padded = true,
  tabBarSpace = true,
  tint: tintProp,
  background = 'grouped',
  pushed = false,
  children,
  ...scrollProps
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Unutrasnje strane (gurnute preko tabova) su bez preliva (Ivan, 27.9.2026).
  const tint: BackdropTint = tintProp ?? (pushed ? 'none' : 'purple');

  /*
   * Pozadina se PRETAPA kao i preliv (Ivan, 26.9.2026: prelaz sa bele Natalne
   * karte na sivi ekran je bljeskao — native tabovi menjaju ekran trenutno).
   * Boja pozadine ide siva <-> bela kroz `belina` (0 <-> 1);
   * u pozadini prati pozadinu aktivnog ekrana, da prvi kadar posle fokusa
   * bude isti kao poslednji pre njega.
   *
   * Boju nosi SAM SKROL, ne omotac. iOS 26 skuplja traku tabova na skrol samo
   * ako nadje skrol niz prvo dete svakog nivoa, a UIKit ne silazi duboko:
   * vec jedan `View` sa pozadinom izmedju ekrana i skrola je dovoljan da
   * traka stoji (provereno u iOS 26.5 simulatoru, Ivan 27.9.2026). Omotaci
   * koji nose samo raspored React Native izbaci iz native stabla, pa oni ne
   * smetaju. Zato je Reanimated (`useAnimatedStyle` na skrolu), ne RN `Animated`.
   */
  const bezPokreta = useReducedMotion();
  const bgGlobalna = useBackdropStore((s) => s.lastBg);
  const [bgAktivan, setBgAktivan] = React.useState(pushed);
  const belina = useSharedValue(pushed && background === 'white' ? 1 : 0);
  const pozadina = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(belina.get(), [0, 1], [neutral.grouped, neutral.white]),
  }));
  // Otkazivanje odlozenog "u pozadini" (vidi `ODLAZAK_MS`) — ako se ekran vrati pre isteka.
  const [odlazak] = React.useState(() => ({ otkazi: () => {} }));
  useFocusEffect(
    React.useCallback(() => {
      if (pushed) return; // gurnut ekran: svoje odmah, zajednicko stanje ne dira
      odlazak.otkazi();
      const prethodna = useBackdropStore.getState().lastBg;
      useBackdropStore.getState().setLastBg(background);
      const cilj = background === 'white' ? 1 : 0;
      if (prethodna !== background && !bezPokreta) {
        belina.set(prethodna === 'white' ? 1 : 0);
        belina.set(withTiming(cilj, { duration: 500 }));
      } else {
        belina.set(cilj);
      }
      setBgAktivan(true);
      return () => { cancelAnimation(belina); odlazak.otkazi = posleOdlaska(() => setBgAktivan(false)); };
    }, [background, bezPokreta, belina, pushed, odlazak])
  );
  React.useEffect(() => {
    if (!bgAktivan) belina.set(bgGlobalna === 'white' ? 1 : 0);
  }, [bgAktivan, bgGlobalna, belina]);

  /** Visina trake zajedno sa statusnom trakom — jedini broj koji se racuna. */
  const traka = insets.top + VRH_ANDROID + headerBar.height;

  const pomeraj = useSharedValue(0);
  const prati = useAnimatedScrollHandler((e) => {
    pomeraj.value = e.contentOffset.y;
  });
  const zamucenje = useAnimatedProps(() => ({
    intensity: interpolate(
      pomeraj.value,
      [0, headerBar.blurAt],
      [0, headerBar.intensity],
      Extrapolation.CLAMP
    ),
  }));
  // ANDROID (vidi "ANDROID NEMA ZAMUCENJA" gore): puna traka u boji pozadine ekrana
  // (ista `belina` kao skrol), na vrhu liste providna — pojavi se istom rampom kao
  // zamucenje. Samo providnost i boja, pa ide brzim putem Reanimated-a.
  const trakaAndroid = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(belina.get(), [0, 1], [neutral.grouped, neutral.white]),
    opacity: interpolate(pomeraj.value, [0, headerBar.blurAt], [0, 1], Extrapolation.CLAMP),
  }));

  // Sloj 3b: podignuti element prati skrol (isti pomeraj kao sadrzaj, u niti za
  // pokret) i bledi cim krene klizanje — vidi `IznadPreliva`.
  const [podignuto, setPodignuto] = React.useState<Podignuto | null>(null);
  const podignutoStil = useAnimatedStyle(() => ({
    // Android: jedini primerak, pa ne bledi (`JEDAN_PRIMERAK`).
    opacity: JEDAN_PRIMERAK ? 1 : interpolate(pomeraj.value, [0, IZNAD_PRELIVA_BLEDI], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: -pomeraj.value }],
  }));
  // Gornja ivica sloja 3b. iOS: ivica trake (iznad nje sadrzaj ide pod zamucenje). Android:
  // ne nize od samog elementa — krug je `-mt-3`, pa bi mu ivica trake odsekla vrh vec u miru;
  // tu jedini primerak nestaje dok klizi (traka je iste boje kao pozadina, ivica joj se ne vidi).
  const vrhPodignutog = podignuto && JEDAN_PRIMERAK ? Math.min(traka, podignuto.y) : traka;

  return (
    // Koren nosi SAMO raspored — bez pozadine, da ga React Native izbaci iz
    // native stabla i skrol ostane dovoljno plitko za iOS 26 (vidi `belina`).
    <View style={{ flex: 1 }}>
      {/* 1. sadrzaj — skrol nosi i pozadinu (siva <-> bela) */}
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={pozadina}
          showsVerticalScrollIndicator={false}
          // iOS ume sam da doda umetak za statusnu traku; ovde bi se sabrao sa
          // nasim i naslov bi pao predaleko. Razmak racunamo iskljucivo mi.
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{
            paddingTop: traka,
            paddingHorizontal: padded ? space.screen : 0,
            // U tabovima prostor na dnu pravi `TabBarSpacer` (zavisi od uredjaja).
            // Van tabova trake nema, pa umetak ide ovde.
            paddingBottom: tabBarSpace ? 0 : insets.bottom + space.xxl,
          }}
          // Bez ovoga klizac krene ispod trake i vidi se kao crtica u zamucenju.
          scrollIndicatorInsets={{ top: traka }}
          {...scrollProps}
          onScroll={prati}
          scrollEventThrottle={16}>
          {/* Bez interneta: jedna traka na vrhu SVAKOG ekrana, ne na svakom posebno. */}
          <BezInterneta className={padded ? 'mb-4' : 'mx-screen mb-4'} />
          {/* Bez preliva nema sta da se podigne — `IznadPreliva` je tada obican View. */}
          <IznadPrelivaContext.Provider value={tint === 'none' ? null : setPodignuto}>
            {children}
          </IznadPrelivaContext.Provider>
          {tabBarSpace && <TabBarSpacer />}
        </Animated.ScrollView>
      </View>

      {/* 2. zamucenje — Android: puna traka bez zamucenja; iOS: postepeno gde postoji
          nativni modul, inace sa ostrom ivicom */}
      {Platform.OS === 'android' ? (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: traka }, trakaAndroid]}
        />
      ) : AnimatedPostepeno ? (
        <AnimatedPostepeno
          pointerEvents="none"
          animatedProps={zamucenje}
          pocetakPrelaza={(traka - PRELAZ_IZNAD) / (traka + PRELAZ_ISPOD)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: traka + PRELAZ_ISPOD }}
        />
      ) : (
      <AnimatedBlurView
        pointerEvents="none"
        tint="systemUltraThinMaterialLight"
        animatedProps={zamucenje}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: traka }}
      />
      )}

      {/* 3. preliv */}
      <ScreenBackdrop tint={tint} pushed={pushed} />

      {/* 3b. iznad preliva — primerak podignutog elementa, tacno preko onog u sadrzaju.
          Pocinje ispod trake: iznad nje sadrzaj ide pod zamucenje, pa i krug. */}
      {podignuto && (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: vrhPodignutog, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <Animated.View
            style={[
              { position: 'absolute', left: podignuto.x, top: podignuto.y - vrhPodignutog, width: podignuto.w, height: podignuto.h },
              podignutoStil,
            ]}>
            {podignuto.element}
          </Animated.View>
        </View>
      )}

      {/* 4. natpis */}
      <View
        // `box-none` — sama traka ne hvata dodir (ispod nje klizi lista), ali
        // dugmad u `left` i `right` moraju da ga hvataju. `none` bi ubilo i njih.
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 flex-row items-center gap-2 px-screen"
        style={{ height: traka, paddingTop: insets.top + VRH_ANDROID }}>
        {left ?? (pushed ? <BackButton /> : null)}
        <View className="flex-1">
          {/* UNUTRASNJA STRANA (gurnuta, sa "nazad"): bez loga, samo ime strane u istoj
              liniji sa strelicom — `items-center` na traci ih centrira jedno prema
              drugom (Ivan, 27.9.2026). Tabovi zadrzavaju zaglavlje sa logom: krug +
              tekst; krug je brend indigo nad ljubicastim prelivom i na beloj bez
              preliva, nad ostalim bojama crn (Ivan, 26.9.2026). */}
          {typeof label !== 'string' ? label
            : pushed ? <Text variant="nav" accessibilityRole="header" numberOfLines={1}>{label}</Text>
            : <Logo title={label} color={tint === 'purple' || tint === 'none' ? undefined : neutral.ink} />}
        </View>
        {right}
      </View>
    </View>
  );
}

/**
 * Deo sadrzaja koji stoji IZNAD preliva, a ne ispod njega (Ivan, 30.9.2026:
 * astroloski krug na "Ti" i "Nebo" — beo, ne obojen prelivom).
 *
 * Preliv MORA da ostane iznad sadrzaja (pravilo 17: kartice ispod njega primaju
 * nijansu), pa krug ne moze samo da se spusti ispod njega. Umesto toga `Screen`
 * crta PRIMERAK `podignuto` u sloju 3b, tacno preko onog u sadrzaju i pomeren
 * za skrol. Primerak u sadrzaju ostaje: kad krug klizne pod traku, on je taj
 * koji se zamuti i oboji, kao sav ostali sadrzaj. Podignuti primerak zato bledi
 * cim krene klizanje (`IZNAD_PRELIVA_BLEDI`).
 *
 * Mesto se meri preko `onLayout`, pa `IznadPreliva` MORA biti DIREKTNO dete
 * sadrzaja `Screen`-a — samo tada je `y` omotaca meren od vrha sadrzaja, i samo
 * tada se `onLayout` javi kad se nesto iznad pomeri (npr. traka "Nema interneta").
 * `podignuto` mora imati stalnu velicinu (tocak je `size` x `size`).
 *
 * `useLayoutEffect`, ne `useEffect`: novi izgled podignutog stigne u ISTOM kadru
 * kao onaj u sadrzaju — inace bi pri pomeranju vremena na "Nebu" jedan kadar
 * stari krug stajao preko novog.
 *
 * Bez preliva (gurnut ekran, `tint="none"`) ovo je obican `View`.
 *
 * ANDROID (`JEDAN_PRIMERAK`, 1.10.2026): primerka u sadrzaju NEMA — tamo je samo prazno mesto
 * velicine `velicina`, a element se crta jednom, u sloju 3b. Bez `velicina` ostaju oba primerka.
 */
export function IznadPreliva({ podignuto, velicina, className, children }: {
  podignuto: React.ReactNode;
  /** Stalna velicina elementa (tocak: `size` x `size`) — za prazno mesto na Androidu. */
  velicina?: { w: number; h: number };
  className?: string;
  children?: React.ReactNode;
}) {
  const postavi = React.useContext(IznadPrelivaContext);
  const [omot, setOmot] = React.useState<LayoutRectangle | null>(null);
  const [unutra, setUnutra] = React.useState<LayoutRectangle | null>(null);
  const samoGore = !!postavi && JEDAN_PRIMERAK && !!velicina;

  React.useLayoutEffect(() => {
    if (!postavi || !omot || !unutra) return;
    postavi({ element: podignuto, x: omot.x + unutra.x, y: omot.y + unutra.y, w: unutra.width, h: unutra.height });
  }, [postavi, omot, unutra, podignuto]);
  React.useLayoutEffect(() => (postavi ? () => postavi(null) : undefined), [postavi]);

  return (
    <View className={className} onLayout={postavi ? (e) => setOmot(e.nativeEvent.layout) : undefined}>
      <View onLayout={postavi ? (e) => setUnutra(e.nativeEvent.layout) : undefined}>
        {samoGore ? <View style={{ width: velicina!.w, height: velicina!.h }} /> : podignuto}
      </View>
      {children}
    </View>
  );
}

/**
 * Strelica nazad na unutrasnjim stranama. Dodirna povrsina 44pt (iOS minimum);
 * `-ml-3` vraca samu strelicu na marginu ekrana, da ne odskoci od sadrzaja.
 */
function BackButton() {
  const t = useT();
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={t.opste.nazad}
      className="-ml-3 h-11 w-11 items-center justify-center active:opacity-60">
      <ChevronLeft size={26} color={neutral.ink} />
    </Pressable>
  );
}

/**
 * Sam preliv, bez trake i bez skrola.
 *
 * Za ekrane koji imaju svoj raspored i ne klize ispod trake — pocetni ekran i
 * koraci onboardinga. Tamo sadrzaj stoji u okviru sa dugmetom prikovanim za
 * dno, pa zamucenje nema sta da zamuti; preliv je jedino sto ide.
 *
 * Ide kao POSLEDNJE dete korenskog `View`-a, da se crta preko sadrzaja.
 *
 * PRETAPANJE NIJANSI (Ivan, 26.9.2026): kad ekran dodje u fokus, preliv krene
 * u nijansi PRETHODNOG ekrana i za pola sekunde pretopi u svoju. Native tabovi
 * menjaju ekran trenutno, pa je ovo jedini nacin da promena boje bude mekana:
 * dva preliva jedan preko drugog, gornji (svoj) ide 0 -> 1 providnosti. Boje
 * se ne animiraju direktno — `LinearGradient` ih pretvara u brojeve pri
 * renderu, pa animirane string boje ne bi stigle do native sloja.
 */
export function ScreenBackdrop({ tint = 'purple', pushed = false }: { tint?: BackdropTint; pushed?: boolean }) {
  const bezPokreta = useReducedMotion();
  /** Nijansa koju je poslednji fokusirani ekran ostavio — prati je svaki ekran u pozadini. */
  const globalna = useBackdropStore((s) => s.last);
  /*
   * Stanje preliva:
   *   - u pozadini (`aktivan` false): crta GLOBALNU nijansu, tj. boju ekrana koji
   *     je trenutno na ekranu. Tako ekran koji dolazi u fokus vec ima pravu
   *     pocetnu boju — snimak 26.9.2026 je pokazao dva kadra sopstvene boje pre
   *     pretapanja, jer se ekran u pozadini crtao u svojoj boji;
   *   - pri fokusu: `prelaz` = prethodna nijansa, stari sloj se gasi dok se
   *     novi pali (pravo pretapanje boje);
   *   - mirno u fokusu: sopstvena nijansa.
   * Pri montiranju ekran NISTA ne pretpostavlja: krece kao "u pozadini" (prati
   * globalnu) i tek fokus odlucuje. Native tabovi montiraju sve ekrane odmah,
   * pa bi pocetni "prelaz iz trenutne nijanse" ostao zamrznut u pozadini i pri
   * prvom fokusu pokazao POGRESNU staru boju (snimljeno 26.9.2026: sa Tranzita
   * na Natalnu kartu — dva kadra ljubicaste, skok na zlatnu, pa pretapanje).
   */
  const [prelaz, setPrelaz] = React.useState<BackdropTint | null>(null);
  // Gurnut ekran (vidi `pushed` u ScreenProps) je aktivan od pocetka i ostaje.
  const [aktivan, setAktivan] = React.useState(pushed);
  // RN Animated, ne Reanimated: vrednost se menja pozivom metode (setValue/timing),
  // sto pravilo React kompajlera dozvoljava; u state-u, jer se ref ne cita u renderu.
  const [udeo] = React.useState(() => new RNAnimated.Value(1));
  const [odlazak] = React.useState(() => ({ otkazi: () => {} }));

  /*
   * Sat zivog preliva (vidi `backdrop.drift`), u krugovima. Tece SAMO dok je
   * ekran u fokusu: tabovi ostaju montirani, pa bi inace pet ekrana crtalo
   * pokret koji niko ne gleda. Posle pauze nastavlja odakle je stao — mrlje ne
   * skacu. Jedan sat za oba sloja pretapanja, da se ne raziđu.
   */
  const sat = useSharedValue(0);
  /*
   * BATERIJA (Ivan, 28.9.2026): pokret tece samo dok je korisnik tu — posle
   * `MIROVANJE_MS` bez dodira mrlje uspore do nule i sat se ugasi, pa telefon
   * prestane da crta kadrove. Prvi dodir ih ponovo zaleti. U rezimu ustede
   * baterije pokreta nema uopste. Vidi `store/budnost.ts`.
   */
  const budan = useBudnost((s) => s.budan);
  const usteda = useUstedaBaterije();
  const brzina = useSharedValue(1);
  const kadar = useFrameCallback((f) => {
    sat.set(sat.get() + ((f.timeSincePreviousFrame ?? 0) / backdrop.drift.cycleMs) * brzina.get());
  }, false);
  // Promena taba ide kroz nativnu traku, mimo JS dodira — fokus je zato budjenje.
  // Pre efekta ispod, da on vec vidi budno stanje.
  useFocusEffect(React.useCallback(() => { probudi(); }, []));
  useFocusEffect(
    React.useCallback(() => {
      // ANDROID: mrlje STOJE (Ivan, 30.9.2026) — kao u ustedi baterije. Pokret je u
      // svakom kadru crtao ceo vrh ekrana i telefon nikad nije mirovao (seckanje na 120 Hz).
      if (Platform.OS === 'android' || bezPokreta || usteda || backdrop.blobs[tint].length === 0) return;
      kadar.setActive(true);
      if (budan) {
        brzina.set(withTiming(1, { duration: ZALET_MS }));
        return () => kadar.setActive(false);
      }
      // Meko zaustavljanje — naglo stajanje mrlje u pokretu se vidi.
      brzina.set(withTiming(0, { duration: KOCENJE_MS }));
      const t = setTimeout(() => kadar.setActive(false), KOCENJE_MS + 50);
      return () => { clearTimeout(t); kadar.setActive(false); };
    }, [bezPokreta, usteda, budan, tint, kadar, brzina])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (pushed) return; // svoje odmah, zajednicko stanje ne dira
      odlazak.otkazi();
      const prethodna = useBackdropStore.getState().last;
      useBackdropStore.getState().setLast(tint);
      // Providnost novog na nulu PRE nego sto React iscrta stanje sa oba sloja —
      // inace bi jedan kadar pokazao novi sloj pun (vrednost ostala 1 od proslog puta).
      const pretapa = prethodna !== tint && !bezPokreta;
      if (pretapa) udeo.setValue(0);
      setPrelaz(pretapa ? prethodna : null);
      setAktivan(true);
      let anim: RNAnimated.CompositeAnimation | null = null;
      if (pretapa) {
        anim = RNAnimated.timing(udeo, { toValue: 1, duration: 500, useNativeDriver: true });
        anim.start(({ finished }) => { if (finished) setPrelaz(null); });
      } else {
        udeo.setValue(1);
      }
      return () => {
        anim?.stop();
        // U pozadini: bez prelaza, prati globalnu nijansu — ali tek kad
        // sistemsko pretapanje prodje (vidi `ODLAZAK_MS`).
        odlazak.otkazi = posleOdlaska(() => { setPrelaz(null); setAktivan(false); });
      };
    }, [tint, bezPokreta, udeo, pushed, odlazak])
  );

  /*
   * Stari sloj se GASI dok se novi pali. Da bi ukupna providnost bila stalna
   * (prelivi su providni, ~0,40 na vrhu), stari ne ide linearno nego po krivoj
   * o(t) = (1 - t) / (1 - a t), a = 0,40, ovde u pet tacaka — inace se boje na
   * sredini sabiraju u jacu.
   */
  const stariUdeo = udeo.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.833, 0.625, 0.357, 0] });
  const sloj = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: backdrop.height };
  const mirna: BackdropTint = aktivan ? tint : globalna;

  return (
    // `overflow: hidden` na obe platforme: mrlje izlaze levo, desno i iznad, a
    // Android secka a iOS ne — ovako je isto svuda.
    <View pointerEvents="none" style={[sloj, { overflow: 'hidden' }]}>
      {prelaz ? (
        <>
          <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: stariUdeo }]}>
            <PrelivSloj tint={prelaz} sat={sat} />
          </RNAnimated.View>
          <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: udeo }]}>
            <PrelivSloj tint={tint} sat={sat} />
          </RNAnimated.View>
        </>
      ) : (
        <PrelivSloj tint={mirna} sat={sat} />
      )}
    </View>
  );
}

/**
 * Jedna nijansa preliva: mirni preliv + mrlje koje plove preko njega. Izvezen za
 * uvod pri pokretanju (`uvod.tsx`), koji stoji van navigacije pa `ScreenBackdrop`
 * (vezan za fokus ekrana) ne moze da koristi.
 */
export function PrelivSloj({ tint, sat }: { tint: BackdropTint; sat: SharedValue<number> }) {
  const mrlje: readonly (readonly [string, number])[] = backdrop.blobs[tint];
  return (
    <>
      <LinearGradient colors={backdrop.tints[tint]} locations={backdrop.locations} style={StyleSheet.absoluteFill} />
      {mrlje.map(([boja, alfa], i) => (
        <Mrlja key={i} redni={i} boja={boja} alfa={alfa} sat={sat} />
      ))}
    </>
  );
}

/**
 * Po mrlji: mesto u miru (udeo sirine ekrana), koliko puta obidje u jednom
 * krugu sata i pomeraj faze. Razliciti tempovi, da se sklop mrlja ne ponavlja
 * vidljivo; razlicita faza, da ne krenu obe iz sredine u istom smeru.
 */
/** Mrlje se posle mirovanja zaustave za 1,5 s, a na dodir zalete za 0,8 s. */
const KOCENJE_MS = 1500;
const ZALET_MS = 800;

const MRLJE = [
  { x: 0.2, puta: 2, faza: 0 },
  { x: 0.8, puta: 3, faza: 2 },
] as const;

/**
 * Meka elipsa koja od sredine bledi u nista. SVG se crta jednom; pomera se samo
 * `transform` na UI niti, pa pokret ne prolazi kroz JS ni kroz ponovno crtanje.
 */
function Mrlja({ redni, boja, alfa, sat }: { redni: number; boja: string; alfa: number; sat: SharedValue<number> }) {
  // Jedinstven id, bez dvotacaka iz `useId` (pravilo 13).
  const id = `mrlja-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { width: ekran } = useWindowDimensions();
  const d = backdrop.drift;
  const m = MRLJE[redni % MRLJE.length];
  const sirina = ekran * d.width;
  const visina = d.radiusY * 2;
  const pomak = d.sway * ekran;

  const pokret = useAnimatedStyle(() => {
    const ugao = 2 * Math.PI * m.puta * sat.get() + m.faza;
    return {
      transform: [
        { translateX: Math.sin(ugao) * pomak },
        { translateY: Math.cos(ugao * 1.5) * d.lift },
        { scale: 1 + Math.sin(ugao * 0.5) * d.breathe },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: ekran * m.x - sirina / 2, top: d.centerY - d.radiusY, width: sirina, height: visina },
        pokret,
      ]}>
      <Svg width={sirina} height={visina}>
        <Defs>
          {/* Priblizno zvono (gausovski pad), ne kupa — kod linearnog pada se vidi vrh. */}
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={boja} stopOpacity={alfa} />
            <Stop offset="0.35" stopColor={boja} stopOpacity={alfa * 0.8} />
            <Stop offset="0.7" stopColor={boja} stopOpacity={alfa * 0.3} />
            <Stop offset="1" stopColor={boja} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={sirina} height={visina} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
