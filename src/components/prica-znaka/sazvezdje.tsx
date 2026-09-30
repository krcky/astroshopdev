import * as React from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { ISKOK } from '@/components/prica/crtezi';
import { useNapredak, useSekunde } from '@/components/prica/sat';
import type { Sazvezdje as Podaci } from '@/lib/sazvezdja';

const AG = Animated.createAnimatedComponent(G);
const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);

/** Crtanje linija — isto ublazavanje kao crtezi dnevne price. */
const CRTANJE = Easing.bezierFn(0.5, 0, 0.2, 1);
/** Koliko sazvezdje zauzima od manje stranice prostora (ostatak su pozadinske zvezde). */
const POPUNA = 0.8;

/** Poluprecnik zvezde po magnitudi, u jedinicama sazvezdja (veca stranica = 1). */
const poluprecnik = (m: number) => Math.max(0.0035, (5.4 - m) * 0.0034);

/**
 * SAZVEZDJE ZNAKA na pravim polozajima (`lib/sazvezdja.ts`): pozadinske zvezde se pojave i trepere,
 * zvezde sazvezdja iskoce jedna za drugom, linije se iscrtaju. Sve po SATU SLIKE (`sat.tsx`) — u
 * videu kadar po kadar, bez sata (slika za deljenje) sve je nacrtano.
 */
export function Sazvezdje({ podaci, sirina, visina, boja = '#FFFFFF' }: {
  podaci: Podaci; sirina: number; visina: number; boja?: string;
}) {
  // Prostor u jedinicama sazvezdja, sa sredinom u (0, 0): sazvezdje zauzme POPUNA manje stranice.
  const k = (Math.min(sirina, visina) * POPUNA);
  const vw = sirina / k;
  const vh = visina / k;
  const grupe = [0, 1, 2].map((g) => podaci.pozadina.filter((_, i) => i % 3 === g));
  return (
    <Svg width={sirina} height={visina} viewBox={`${-vw / 2} ${-vh / 2} ${vw} ${vh}`} accessible={false}>
      {grupe.map((g, i) => <Pozadina key={i} zvezde={g} redni={i} boja={boja} />)}
      {podaci.linije.map((l, i) => <Linija key={i} tacke={l} kasni={900 + i * 260} boja={boja} />)}
      {podaci.zvezde.map(([x, y, m], i) => <Zvezda key={i} x={x} y={y} r={poluprecnik(m)} kasni={300 + i * 60} boja={boja} />)}
    </Svg>
  );
}

/** Jedna trecina pozadinskih zvezda: pojavi se, pa treperi svojim ritmom (jedan animiran sloj, ne sto). */
function Pozadina({ zvezde, redni, boja }: { zvezde: [number, number, number][]; redni: number; boja: string }) {
  const pojava = useNapredak(redni * 350, 1200, Easing.out(Easing.quad));
  const sek = useSekunde();
  const props = useAnimatedProps(() => {
    const t = sek.get();
    // Tam-amo za 6,8 s, svaka trecina pomerena: 1 -> 0,35 -> 1.
    const treptaj = 0.675 + 0.325 * Math.cos((2 * Math.PI * t) / 6.8 + redni * 2.1);
    return { opacity: pojava.get() * treptaj };
  });
  return (
    <AG animatedProps={props}>
      {zvezde.map(([x, y, m], i) => (
        <Circle key={i} cx={x} cy={y} r={poluprecnik(m) * 0.7} fill={boja} fillOpacity={Math.max(0.2, 0.8 - m * 0.1)} />
      ))}
    </AG>
  );
}

function Linija({ tacke, kasni, boja }: { tacke: [number, number][]; kasni: number; boja: string }) {
  let L = 0;
  for (let i = 1; i < tacke.length; i++) L += Math.hypot(tacke[i][0] - tacke[i - 1][0], tacke[i][1] - tacke[i - 1][1]);
  const p = useNapredak(kasni, 1600, CRTANJE);
  const props = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - p.get()) }));
  const d = `M${tacke.map(([x, y]) => `${x} ${y}`).join('L')}`;
  return (
    <APath d={d} fill="none" stroke={boja} strokeOpacity={0.62} strokeWidth={0.0042} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={[L, L]} animatedProps={props} />
  );
}

function Zvezda({ x, y, r, kasni, boja }: { x: number; y: number; r: number; kasni: number; boja: string }) {
  const p = useNapredak(kasni, 750, ISKOK);
  const props = useAnimatedProps(() => ({ r: r * Math.max(0, p.get()) }));
  return <ACircle cx={x} cy={y} fill={boja} animatedProps={props} />;
}
