import * as React from 'react';
import {
  AccessibilityInfo, Animated, Easing, Platform, StyleSheet, useWindowDimensions, View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
// expo-router sam izvozi ovaj hook — nema potrebe dodavati @react-navigation/native
import { useIsFocused } from 'expo-router';

/**
 * Ambijentalna pozadina — tri meke mrlje boje koje polako plutaju.
 *
 * ZASTO OVAKO, a ne video kao na referentnom sajtu: tamo je to 5,7 MB .mp4 po
 * ekranu. Cetiri taba bi bila preko 20 MB uz dekoder koji radi non-stop. Ovde
 * su mrlje ciste matematike — nula bajtova assetsa, boje su parametri.
 *
 * ZASTO UGRADJENI Animated, a ne Reanimated: za pomeranje jednog sloja nam ne
 * trebaju worklet-i, a Reanimated 4 zahteva poseban Babel dodatak koji, ako
 * nedostaje, TIHO ne radi — animacija stoji bez ijedne greske. Ugradjeni
 * Animated sa `useNativeDriver` radi na UI niti bez ijedne dodatne postavke.
 *
 * Boje su namerno svetle. Crn tekst preko njih mora da ostane citljiv;
 * najgori kontrast u trenutnim paletama je 10,5:1 (AAA trazi 7:1).
 */

export type Palette = {
  /** Tri mrlje. Redosled: gore-levo, desno, dole-levo. */
  colors: [string, string, string];
};

export const TAB_PALETTES: Record<string, Palette> = {
  home:    { colors: ['#B9C1F2', '#CDD3F8', '#DCD6FB'] }, // periwinkle, lavanda, ljubicasta
  daily:   { colors: ['#FFD9C2', '#FFE8D4', '#FFD6DE'] }, // breskva, med, ruza
  chart:   { colors: ['#C8E2FF', '#CFEEE4', '#DCE8FF'] }, // nebo, menta
  profile: { colors: ['#D8E8D2', '#F0E7D2', '#DFEcd9'] }, // zalfija, pesak
};

type Blob = { cx: number; cy: number; r: number; dur: number; dx: number; dy: number; o: [number, number] };

/**
 * Polja su NAMERNO veca od ekrana (r > 1). Tako se ne vide kao tri mrlje nego
 * kao velike povrsine boje koje se preplavljuju — to je karakter reference.
 *
 * Pored pomeranja, menja se i PROZIRNOST svake povrsine, pa se menjaju
 * proporcije boja: jedna preuzima ekran dok se druga povlaci. To je ono sto
 * pomeranje samo po sebi ne daje.
 *
 * Ciklusi su namerno neuporedivi (17/23/29 s) da se kompozicija ne ponavlja
 * ocigledno — najmanji zajednicki sadrzalac je preko tri minuta.
 */
const BLOBS: Blob[] = [
  { cx: 0.12, cy: 0.02, r: 0.82, dur: 17000, dx:  0.62, dy:  0.48, o: [1.00, 0.30] },
  { cx: 1.00, cy: 0.28, r: 0.90, dur: 23000, dx: -0.58, dy:  0.52, o: [0.35, 1.00] },
  { cx: 0.20, cy: 1.02, r: 0.78, dur: 29000, dx:  0.55, dy: -0.60, o: [0.90, 0.25] },
];

type Props = {
  palette: Palette;
  /** Kad ekran nije u fokusu animacija staje — inace trosi bateriju u pozadini. */
  active?: boolean;
};

export function AmbientGradient({ palette, active = true }: Props) {
  const { width, height } = useWindowDimensions();
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduced(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; sub?.remove?.(); };
  }, []);

  const size = Math.max(width, height);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BLOBS.map((b, i) => (
        <FloatingBlob
          key={i}
          blob={b}
          color={palette.colors[i]}
          size={size}
          width={width}
          height={height}
          active={active && !reduced}
        />
      ))}
    </View>
  );
}

function FloatingBlob({ blob, color, size, width, height, active }: {
  blob: Blob; color: string; size: number; width: number; height: number; active: boolean;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!active) { t.setValue(0); return; }
    // Napred-nazad, da nema skoka na kraju ciklusa.
    const leg = (to: number) =>
      Animated.timing(t, {
        toValue: to,
        duration: blob.dur,
        easing: Easing.inOut(Easing.sin),
        // Na vebu native driver ne postoji: animacija bi "radila" na strani
        // koje nema i nijedan stil se ne bi azurirao. Na telefonu ostaje
        // ukljucen, jer tamo radi na UI niti i ne opterecuje JS.
        useNativeDriver: Platform.OS !== 'web',
      });
    const loop = Animated.loop(Animated.sequence([leg(1), leg(0)]));
    loop.start();
    return () => loop.stop();
  }, [active, blob.dur, t]);

  const range = (to: number) => t.interpolate({ inputRange: [0, 1], outputRange: [0, to] });

  // Jedinstven id po instanci: url(#id) hvata PRVI element sa tim id-jem u
  // celom dokumentu, a navigacija drzi prethodne ekrane montirane.
  const gid = `blob-${React.useId().replace(/:/g, '')}`;

  // Dovoljno veliko da polje nikad ne dodirne ivicu platna:
  // najveci poluprecnik (0.9) + najveci pomeraj (0.62) + uvecanje (1.45).
  const canvas = size * 2.6;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: blob.o }),
          transform: [
            { translateX: range(blob.dx * width) },
            { translateY: range(blob.dy * height) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) },
          ],
        },
      ]}>
      {/*
        Platno je NAMERNO vece od ekrana i centrirano preko njega. Polja su
        veca od ekrana i putuju daleko; da je platno velicine ekrana, SVG bi ih
        odsekao i videla bi se prava ivica umesto mekog prelaza.
      */}
      <Svg
        width={canvas}
        height={canvas}
        style={{ position: 'absolute', left: (width - canvas) / 2, top: (height - canvas) / 2 }}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="45%" stopColor={color} stopOpacity={0.75} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={blob.cx * width - (width - canvas) / 2}
          cy={blob.cy * height - (height - canvas) / 2}
          r={blob.r * size}
          fill={`url(#${gid})`}
        />
      </Svg>
    </Animated.View>
  );
}

/** Pozadina jednog taba. Sama zna kad da stane. */
export function TabBackground({ tab }: { tab: keyof typeof TAB_PALETTES }) {
  const focused = useIsFocused();
  return <AmbientGradient palette={TAB_PALETTES[tab]} active={focused} />;
}
