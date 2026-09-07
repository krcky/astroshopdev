import * as React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
// expo-router sam izvozi ovaj hook — nema potrebe dodavati @react-navigation/native
import { useIsFocused } from 'expo-router';

/**
 * Ambijentalna pozadina — tri meke mrlje boje koje polako plutaju.
 *
 * ZASTO OVAKO, a ne video kao na referentnom sajtu: tamo je to 5,7 MB .mp4
 * po ekranu. Cetiri taba bi bila preko 20 MB i dekoder bi radio non-stop.
 * Ovde su mrlje ciste matematika — nula bajtova assetsa, boje su parametri.
 *
 * ZASTO NE SKIA: za ovako blag efekat je nepotrebno teska zavisnost, a i ne
 * radi na vebu bez dodatnog podesavanja. Ovako se animira TRANSFORM celog
 * sloja, sto Reanimated radi na UI niti — jeftino i na starijim telefonima.
 *
 * Boje su namerno svetle (oko 95% svetline). Crn tekst preko njih ostaje
 * citljiv; jaci gradijent bi ga progutao.
 */

export type Palette = {
  /** Tri mrlje. Redosled: gore-levo, desno, dole-levo. */
  colors: [string, string, string];
};

/** Po jedna paleta za svaki tab — dovoljno razlicite da se oseti promena. */
export const TAB_PALETTES: Record<string, Palette> = {
  home:    { colors: ['#FFE3CC', '#FFEFDD', '#FFE0E6'] }, // topla: breskva, med, ruza
  daily:   { colors: ['#E4DCFF', '#E2E9FF', '#F0E4FF'] }, // hladna: lavanda, perla, ljubicasta
  chart:   { colors: ['#DCEBFF', '#DFF3EC', '#E9F0FF'] }, // vedra: nebo, menta
  profile: { colors: ['#E6F0E2', '#F5EFE2', '#EAF2E6'] }, // mirna: zalfija, pesak
};

type Blob = { cx: number; cy: number; r: number; dur: number; dx: number; dy: number };

/** Rasporedjene tako da pokriju uglove, a da se u sredini preklapaju. */
const BLOBS: Blob[] = [
  { cx: 0.18, cy: 0.12, r: 0.62, dur: 17000, dx: 0.10, dy: 0.07 },
  { cx: 0.88, cy: 0.42, r: 0.70, dur: 23000, dx: -0.09, dy: 0.11 },
  { cx: 0.28, cy: 0.92, r: 0.66, dur: 29000, dx: 0.12, dy: -0.08 },
];

type Props = {
  palette: Palette;
  /** Kad ekran nije u fokusu, animacija staje — inace trosi bateriju u pozadini. */
  active?: boolean;
};

export function AmbientGradient({ palette, active = true }: Props) {
  const { width, height } = useWindowDimensions();
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
          active={active}
        />
      ))}
    </View>
  );
}

function FloatingBlob({ blob, color, size, width, height, active }: {
  blob: Blob; color: string; size: number; width: number; height: number; active: boolean;
}) {
  const t = useSharedValue(0);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (!active || reduced) { t.value = 0; return; }
    t.value = withRepeat(
      withTiming(1, { duration: blob.dur, easing: Easing.inOut(Easing.sin) }),
      -1,
      true // napred-nazad, da nema skoka na kraju petlje
    );
  }, [active, reduced, blob.dur]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * blob.dx * width },
      { translateY: t.value * blob.dy * height },
      { scale: 1 + t.value * 0.12 },
    ],
  }));

  // Jedinstven id po instanci: url(#id) hvata PRVI element sa tim id-jem u
  // celom dokumentu, a navigacija drzi prethodne ekrane montirane.
  const gid = `blob-${React.useId().replace(/:/g, '')}`;
  const r = blob.r * size;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={blob.cx * width} cy={blob.cy * height} r={r} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

/** Pozadina jednog taba. Sama zna kad da stane. */
export function TabBackground({ tab }: { tab: keyof typeof TAB_PALETTES }) {
  const focused = useIsFocused();
  return <AmbientGradient palette={TAB_PALETTES[tab]} active={focused} />;
}
