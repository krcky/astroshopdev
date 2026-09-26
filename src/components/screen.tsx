import * as React from 'react';
import { Animated as RNAnimated, Platform, Pressable, StyleSheet, View, type ScrollViewProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';

import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { backdrop, headerBar, neutral, space, type BackdropTint } from '@/theme/tokens';
import { useBackdropStore, type ScreenBackground } from '@/store/backdrop';
import { STARI_IOS } from '@/lib/platform';

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
 *   3. preliv                 visok 180 od vrha ekrana, PREKO zamucenja
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
 * ANDROID: `blurMethod` bez `blurTarget` TIHO postane `none`.
 *
 * `ExpoBlurView.kt` radi `if (blurTarget != null) method else BlurMethod.NONE`
 * — nema greske, nema izuzetka, samo providna traka bez zamucenja. Zato je
 * sadrzaj obmotan u `BlurTargetView` i njegov `ref` ide traci. Na iOS-u je
 * `BlurTargetView` obican `View` (vidi `BlurTargetView.js`), pa ne kosta nista.
 */

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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
  const insets = useSafeAreaInsets();
  return <View style={{ height: TAB_BAR_SPACE + insets.bottom }} />;
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
  const cilj = React.useRef<View>(null);
  // Unutrasnje strane (gurnute preko tabova) su bez preliva (Ivan, 27.9.2026).
  const tint: BackdropTint = tintProp ?? (pushed ? 'none' : 'purple');

  /*
   * Pozadina se PRETAPA kao i preliv (Ivan, 26.9.2026: prelaz sa bele Natalne
   * karte na sivi ekran je bljeskao — native tabovi menjaju ekran trenutno).
   * Koren je uvek siv, a preko njega beli sloj cija providnost ide 0 <-> 1;
   * u pozadini prati pozadinu aktivnog ekrana, da prvi kadar posle fokusa
   * bude isti kao poslednji pre njega.
   */
  const bezPokreta = useReducedMotion();
  const bgGlobalna = useBackdropStore((s) => s.lastBg);
  const [bgAktivan, setBgAktivan] = React.useState(pushed);
  const [belina] = React.useState(() => new RNAnimated.Value(pushed && background === 'white' ? 1 : 0));
  // Otkazivanje odlozenog "u pozadini" (vidi `ODLAZAK_MS`) — ako se ekran vrati pre isteka.
  const [odlazak] = React.useState(() => ({ otkazi: () => {} }));
  useFocusEffect(
    React.useCallback(() => {
      if (pushed) return; // gurnut ekran: svoje odmah, zajednicko stanje ne dira
      odlazak.otkazi();
      const prethodna = useBackdropStore.getState().lastBg;
      useBackdropStore.getState().setLastBg(background);
      const cilj = background === 'white' ? 1 : 0;
      let anim: RNAnimated.CompositeAnimation | null = null;
      if (prethodna !== background && !bezPokreta) {
        belina.setValue(prethodna === 'white' ? 1 : 0);
        anim = RNAnimated.timing(belina, { toValue: cilj, duration: 500, useNativeDriver: true });
        anim.start();
      } else {
        belina.setValue(cilj);
      }
      setBgAktivan(true);
      return () => { anim?.stop(); odlazak.otkazi = posleOdlaska(() => setBgAktivan(false)); };
    }, [background, bezPokreta, belina, pushed, odlazak])
  );
  React.useEffect(() => {
    if (!bgAktivan) belina.setValue(bgGlobalna === 'white' ? 1 : 0);
  }, [bgAktivan, bgGlobalna, belina]);

  /** Visina trake zajedno sa statusnom trakom — jedini broj koji se racuna. */
  const traka = insets.top + headerBar.height;

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

  return (
    <View className="flex-1 bg-grouped">
      {/* 0. bela pozadina, providnost se pretapa (vidi gore) */}
      <RNAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: neutral.white, opacity: belina }]} />
      {/* 1. sadrzaj */}
      <BlurTargetView ref={cilj} style={{ flex: 1 }}>
        <Animated.ScrollView
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
          {children}
          {tabBarSpace && <TabBarSpacer />}
        </Animated.ScrollView>
      </BlurTargetView>

      {/* 2. zamucenje */}
      <AnimatedBlurView
        pointerEvents="none"
        tint="systemUltraThinMaterialLight"
        animatedProps={zamucenje}
        // Na starijem Androidu je Dimezis skup, pa tamo radije nista nego
        // trzanje pri klizanju — `...Sdk31Plus` sam padne na `none` ispod 31.
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={cilj}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: traka }}
      />

      {/* 3. preliv */}
      <ScreenBackdrop tint={tint} pushed={pushed} />

      {/* 4. natpis */}
      <View
        // `box-none` — sama traka ne hvata dodir (ispod nje klizi lista), ali
        // dugmad u `left` i `right` moraju da ga hvataju. `none` bi ubilo i njih.
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 flex-row items-center gap-2 px-screen"
        style={{ height: traka, paddingTop: insets.top }}>
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
 * Strelica nazad na unutrasnjim stranama. Dodirna povrsina 44pt (iOS minimum);
 * `-ml-3` vraca samu strelicu na marginu ekrana, da ne odskoci od sadrzaja.
 */
function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Nazad"
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
    <View pointerEvents="none" style={sloj}>
      {prelaz ? (
        <>
          <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: stariUdeo }]}>
            <LinearGradient colors={backdrop.tints[prelaz]} locations={backdrop.locations} style={StyleSheet.absoluteFill} />
          </RNAnimated.View>
          <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: udeo }]}>
            <LinearGradient colors={backdrop.tints[tint]} locations={backdrop.locations} style={StyleSheet.absoluteFill} />
          </RNAnimated.View>
        </>
      ) : (
        <LinearGradient colors={backdrop.tints[mirna]} locations={backdrop.locations} style={StyleSheet.absoluteFill} />
      )}
    </View>
  );
}
