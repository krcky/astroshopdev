import * as React from 'react';
import { Image as RNImage, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { SLIKA } from '@/components/planete-par';
import { probudi, useBudnost, useUstedaBaterije } from '@/store/budnost';

/** Planete sa prstenovima: telo je mali deo slike, pa se klizanje teksture ne primenjuje (stoje mirno). */
const SA_PRSTENOM = new Set(['saturn', 'uranus']);
/** Jedan prolaz teksture preko diska (s). */
const PERIOD_S = 9;
/** Tekstura je veca od diska za ovoliko, da klizanje ima po cemu da se krece. */
const UVECANJE = 1.55;

/**
 * PLANETA KOJA SE VRTI (Ivan, 13.10.2026, po snimku druge aplikacije; brze, 9 s po prolazu — Ivan: "neka se okrecu brze"): disk planete cija se POVRSINA polako krece zdesna
 * ulevo ispod NEPOMICNE senke (svetlo gore levo, tamno dole desno), pa izgleda kao da se kugla okrece oko uspravne ose.
 * Bez prave 3D teksture: dve kopije fotografije klize jedna za drugom; donja je neprovidna, a gornja se pretapa (`sin^2`), pa nema ni skoka ni vidljivog sava. Senka je SVG radijalni preliv preko diska.
 *
 * Ukrasni pokret koji traje (pravilo 17): samo na ekranu u fokusu, staje 20 s posle poslednjeg dodira (`useBudnost`), uz
 * "Smanji pokrete" i u ustedi baterije stoji. Saturn i Uran (prstenovi) stoje mirno.
 */
export function PlanetaZiva({ planeta, size, period = PERIOD_S, faznoKasni = 0 }: { planeta: string; size: number; period?: number; faznoKasni?: number }) {
  const slika = SLIKA[planeta];
  const budan = useBudnost((s) => s.budan);
  const usteda = useUstedaBaterije();
  const bezPokreta = useReducedMotion();
  const faza = useSharedValue(faznoKasni);
  const kadar = useFrameCallback((f) => {
    faza.set((faza.get() + (f.timeSincePreviousFrame ?? 0) / 1000 / period) % 1);
  }, false);
  const miruje = bezPokreta || usteda || !budan || !slika || SA_PRSTENOM.has(planeta);
  useFocusEffect(React.useCallback(() => {
    probudi();
    if (miruje) return;
    kadar.setActive(true);
    return () => kadar.setActive(false);
  }, [miruje, kadar]));

  const d = size * UVECANJE;
  const hod = (d - size) / 2 + size * 0.1; // koliko klizi na svaku stranu od sredine
  const sloj = (pomak: number, providan: boolean) => useAnimatedStyle(() => { // eslint-disable-line react-hooks/rules-of-hooks
    const p = (faza.get() + pomak) % 1;
    return { opacity: providan ? Math.sin(Math.PI * p) ** 2 : 1, transform: [{ translateX: hod * (1 - 2 * p) }] };
  });
  // Donja kopija je UVEK neprovidna, samo gornja se pretapa: dve poluprovidne bi se videle preko tamne podloge i potamnile planetu.
  // Skok donje kopije (kraj prolaza) pada tacno kad je gornja puna, pa se ne vidi.
  const a = sloj(0, false);
  const b = sloj(0.5, true);
  const id = `planeta-senka-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (!slika) return <View style={{ width: size, height: size }} />;
  if (SA_PRSTENOM.has(planeta)) {
    const sir = size * (planeta === 'saturn' ? 1.9 : 1.5);
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <RNImage source={slika} style={{ width: sir, height: sir }} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  const texture = (stil: object) => (
    <Animated.View style={[{ position: 'absolute', left: (size - d) / 2, top: (size - d) / 2, width: d, height: d }, stil]}>
      <RNImage source={slika} style={{ width: d, height: d }} resizeMode="cover" accessibilityIgnoresInvertColors />
    </Animated.View>
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#14141F' }} accessibilityElementsHidden importantForAccessibility="no">
      {texture(a)}
      {texture(b)}
      <Svg width={size} height={size} style={{ position: 'absolute' }} pointerEvents="none">
        <Defs>
          <RadialGradient id={id} cx="35%" cy="30%" r="80%">
            <Stop offset="0" stopColor="#000" stopOpacity={0} />
            <Stop offset="0.6" stopColor="#000" stopOpacity={0.04} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.3} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
