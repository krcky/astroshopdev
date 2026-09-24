import * as React from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
// Tip stize iz 'expo-router/js-tabs', ne iz korena paketa — koren izvozi samo
// komponentu <Tabs>, a tipove trake prosledjuje dalje ovaj ulaz.
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Text } from '@/components/ui/text';

const INK = '#141414';
const MUTED = '#9A9A9A';

/**
 * Boja aktivne kapsule — `--secondary` iz global.css, ispisana kao broj.
 *
 * NativeWind klase ne hvataju `Animated.View` pouzdano, a tema je zakljucana
 * na svetlu (pravilo 2), pa je konstanta ovde tacna i necе se razici sa temom.
 */
const KAPSULA = '#F5F5F5';

/**
 * Opruga za klizanje kapsule.
 *
 * Apple-ov prelaz je brz i jedva primetno elastican — ne skace. Veca krutost
 * uz jako prigusenje daje bas to: stigne odmah, a ne odzvanja.
 */
const OPRUGA = { damping: 20, stiffness: 260, mass: 0.7 } as const;

/**
 * Koliko prostora ekran mora da ostavi na dnu da traka ne prekrije sadrzaj.
 *
 * Traka lebdi IZNAD ekrana (`position: absolute`), pa ne zauzima mesto u
 * rasporedu — sadrzaj klizi ispod nje. Bez ovog razmaka poslednji red svakog
 * ekrana zavrsi sakriven. Broj je visina trake plus vazduh oko nje; donji
 * safe-area umetak se dodaje posebno jer se razlikuje po uredjaju.
 */
export const TAB_BAR_SPACE = 96;

/** Razmak od donje ivice ekrana kad uredjaj nema safe-area umetak. */
const DNO_BEZ_UMETKA = 14;

/**
 * Oblik pilule. Namerno kao `style`, ne kao Tailwind klasa — vidi komentar
 * uz `GlassView` nize.
 *
 * `borderRadius` je veci od pola visine trake, sto u React Native-u znaci
 * "sasvim okruglo" bez racunanja tacne visine.
 */
const pilula = {
  borderRadius: 999,
  overflow: 'hidden',
} as const;

/** Dodatak za rezervnu, neprovidnu traku — senka daje dubinu koju staklo ima samo po sebi. */
const rezerva = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E6E6E6',
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: Platform.OS === 'android' ? 8 : 0,
} as const;

/**
 * Prazan prostor na dnu ekrana ispod trake — ide kao POSLEDNJE dete ScrollView-a.
 *
 * Razdaljina se ne moze napisati kao Tailwind klasa jer zavisi od uredjaja:
 * telefon sa zarezom ima jos ~34px umetka, stariji nema nista. Zato spacer,
 * a ne `pb-32` — fiksan broj bi na jednom telefonu sekao sadrzaj, a na drugom
 * ostavljao rupu.
 */
export function TabBarSpacer() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: TAB_BAR_SPACE + insets.bottom }} />;
}

/**
 * Lebdeca traka u obliku pilule — iOS 26 izgled.
 *
 * Na iOS-u 26 koristi pravi Liquid Glass (`GlassView`): sistem sam racuna
 * zamucenje, prelamanje i senku, i traka se menja u skladu sa onim sto klizi
 * ispod nje. Na Androidu, starijem iOS-u i vebu `isLiquidGlassAvailable()`
 * vraca false pa se crta neprovidna bela pilula sa senkom — namerno, jer
 * lazni "glass" (poluprovidna bela) izgleda prljavo nad sarenim sadrzajem.
 *
 * Zasto rucna traka a ne `tabBarStyle`: podrazumevana traka je pravougaonik
 * prilepljen uz dno, sa ivicom preko cele sirine. Oblik pilule, aktivna
 * kapsula iza ikone i lebdenje ne mogu da se dobiju kroz njene opcije.
 */
type Mera = { x: number; y: number; w: number; h: number };

/**
 * Jedna stavka trake.
 *
 * Izdvojena u komponentu zato sto svaka ima SVOJU animaciju ikone, a kuke se
 * ne smeju zvati u `map` petlji — broj kuka po renderu mora biti stalan.
 */
function Stavka({
  aktivna,
  naslov,
  boja,
  ikona,
  onPress,
  onLongPress,
  onIzmereno,
  accessibilityLabel,
}: {
  aktivna: boolean;
  naslov: string;
  boja: string;
  ikona: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
  onIzmereno: (m: Mera) => void;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);
  const bezPokreta = useReducedMotion();
  const preth = React.useRef(aktivna);

  React.useEffect(() => {
    const postala = aktivna && !preth.current;
    preth.current = aktivna;
    if (!postala || bezPokreta) return;
    // Kratko uvuci pa pustiti — isti utisak koji ima Apple-ova traka.
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 400 }),
    );
  }, [aktivna, bezPokreta, scale]);

  const stil = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const meri = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    onIzmereno({ x, y, w: width, h: height });
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={meri}
      accessibilityRole="button"
      accessibilityState={aktivna ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      className="min-w-[64px] items-center gap-0.5 rounded-full px-3 py-2">
      {/* STYLE, ne className — NativeWind ne hvata pouzdano `Animated.View`,
          pa bi centriranje tiho otpalo i sadrzaj bi se rastegao ulevo.
          Ista zamka kao kod `GlassView` nize. */}
      <Animated.View style={[stil, { alignItems: 'center', gap: 2 }]}>
        {ikona}
        <Text numberOfLines={1} style={{ color: boja }} className="text-[10px] tracking-[0.4px]">
          {naslov}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const glass = isLiquidGlassAvailable();

  const [mere, setMere] = React.useState<Record<number, Mera>>({});
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const postavljena = React.useRef(false);
  const bezPokreta = useReducedMotion();

  const aktivnaMera = mere[state.index];

  React.useEffect(() => {
    if (!aktivnaMera) return;
    // Prvi put kapsula samo stane gde treba. Da i tada klizi, svaki start
    // aplikacije poceo bi animacijom niotkuda — izgleda kao kvar, ne kao pokret.
    if (!postavljena.current || bezPokreta) {
      postavljena.current = true;
      x.value = aktivnaMera.x;
      y.value = aktivnaMera.y;
      w.value = aktivnaMera.w;
      return;
    }
    x.value = withSpring(aktivnaMera.x, OPRUGA);
    y.value = withSpring(aktivnaMera.y, OPRUGA);
    w.value = withSpring(aktivnaMera.w, OPRUGA);
  }, [aktivnaMera, bezPokreta, x, y, w]);

  const kapsulaStil = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    width: w.value,
  }));

  const stavke = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const aktivna = state.index === index;
    const boja = aktivna ? INK : MUTED;
    const naslov = options.title ?? route.name;

    const pritisak = () => {
      // `emit` sa `canPreventDefault` je jedini nacin da ekran moze da odbije
      // prelazak (npr. nesacuvana izmena). Nikad ne zvati navigate direktno.
      const dogadjaj = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!aktivna && !dogadjaj.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <Stavka
        key={route.key}
        aktivna={aktivna}
        naslov={naslov}
        boja={boja}
        ikona={options.tabBarIcon?.({ focused: aktivna, color: boja, size: 22 })}
        onPress={pritisak}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        onIzmereno={(m) =>
          setMere((prev) =>
            prev[index] && prev[index].x === m.x && prev[index].w === m.w
              ? prev
              : { ...prev, [index]: m },
          )
        }
        accessibilityLabel={options.tabBarAccessibilityLabel ?? naslov}
      />
    );
  });

  const sadrzaj = (
    <View className="flex-row items-center gap-1 px-2 py-1.5">
      {/* Uvek u stablu, ne pod uslovom: dok prvo merenje ne stigne visina je nula,
          pa se nista ne vidi. Uslovno montiranje je znalo da je ostavi
          neiscrtanu i posle merenja. */}
      <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              // left/top MORAJU biti 0. Bez njih React Native uzima staticki
              // polozaj kapsule — pocetak sadrzaja reda, koji vec nosi padding
              // reda — pa se taj pomeraj sabere sa izmerenim x i y i kapsula
              // ispadne pomerena u odnosu na ikonu. Sa nulom je pocetna tacka
              // ista ona u odnosu na koju `onLayout` meri stavke.
              left: 0,
              top: 0,
              height: aktivnaMera?.h ?? 0,
              backgroundColor: KAPSULA,
              borderRadius: 999,
            },
            kapsulaStil,
          ]}
      />
      {stavke}
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: insets.bottom || DNO_BEZ_UMETKA }}>
      {glass ? (
        <GlassView
          glassEffectStyle="regular"
          // Tema je zakljucana na svetlu (pravilo 2 u CLAUDE.md), pa se i staklo
          // drzi svetlog izgleda bez obzira na sistemsko podesavanje.
          colorScheme="light"
          isInteractive
          // STYLE, ne className. `GlassView` je nativna komponenta i NativeWind
          // je ne poznaje, pa klase na njoj tiho nestanu — nema greske, samo
          // pravougaonik umesto pilule. Na vebu se to ne vidi jer tamo staklo
          // nije dostupno pa se crta rezervna grana, koja je obicni <View>.
          style={pilula}>
          {sadrzaj}
        </GlassView>
      ) : (
        <View style={[pilula, rezerva]}>{sadrzaj}</View>
      )}
    </View>
  );
}
