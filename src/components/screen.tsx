import * as React from 'react';
import { Platform, View, type ScrollViewProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from '@/components/logo';
import { backdrop, headerBar, space } from '@/theme/tokens';

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
  /** Levo od natpisa: strelica nazad na ekranima koji se otvaraju preko taba. */
  left?: React.ReactNode;
  /** Sadrzaj desne strane trake (dugme, ikona). Opciono. */
  right?: React.ReactNode;
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
  children,
  ...scrollProps
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const cilj = React.useRef<View>(null);

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
      <ScreenBackdrop />

      {/* 4. natpis */}
      <View
        // `box-none` — sama traka ne hvata dodir (ispod nje klizi lista), ali
        // dugmad u `left` i `right` moraju da ga hvataju. `none` bi ubilo i njih.
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 flex-row items-center gap-2 px-screen"
        style={{ height: traka, paddingTop: insets.top }}>
        {left}
        <View className="flex-1">
          {/* Ime strane ide u isto zaglavlje kao na pocetnom ekranu: krug + tekst (Ivan, 26.9.2026). */}
          {typeof label === 'string' ? <Logo title={label} /> : label}
        </View>
        {right}
      </View>
    </View>
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
 */
export function ScreenBackdrop() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={backdrop.colors}
      locations={backdrop.locations}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: backdrop.height }}
    />
  );
}
