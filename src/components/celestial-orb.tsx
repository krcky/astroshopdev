import * as React from 'react';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';

/**
 * Nebesko telo, crtano proceduralno.
 *
 * Namerno nije slika: vektor je ostar na svakoj rezoluciji, tezi par kilobajta
 * i menja se kroz `seed` bez novog asseta. Ako kasnije dodje prava ilustracija,
 * menja se samo ova komponenta.
 */

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = { size?: number; seed?: number };

export function CelestialOrb({ size = 200, seed = 11 }: Props) {
  const R = 100;

  // ID-jevi gradijenata MORAJU biti jedinstveni po instanci.
  // `url(#orb)` se razresava na PRVI element sa tim id-jem u celom dokumentu.
  // React Navigation drzi prethodne ekrane montirane (sakrivene, 0x0), pa bi
  // dva orba delila id i vidljivi bi ostao bez ispune. useId to resava;
  // dvotacke se skidaju jer razbijaju url(#...) selektor.
  const uid = React.useId().replace(/[:]/g, '');
  const orbId = `orb-${uid}`;
  const haloId = `halo-${uid}`;

  // Krateri i zrnastost — deterministicno, da se ne "prevrce" pri svakom renderu.
  const specks = React.useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: 260 }, () => {
      // Ravnomerno po povrsini diska: koren daje gustinu koja ne beži u centar.
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * (R - 6);
      return {
        cx: 110 + r * Math.cos(a),
        cy: 110 + r * Math.sin(a),
        r: 0.6 + rand() * 3.2,
        o: 0.04 + rand() * 0.22,
      };
    });
  }, [seed]);

  return (
    <Svg width={size} height={size} viewBox="0 0 220 220">
      <Defs>
        <RadialGradient id={orbId} cx="38%" cy="32%" r="78%">
          <Stop offset="0%" stopColor="#3A3A3A" stopOpacity={1} />
          <Stop offset="55%" stopColor="#1E1E1E" stopOpacity={1} />
          <Stop offset="100%" stopColor="#0C0C0C" stopOpacity={1} />
        </RadialGradient>
        <RadialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <Stop offset="72%" stopColor="#141414" stopOpacity={0.16} />
          <Stop offset="100%" stopColor="#141414" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Circle cx={110} cy={110} r={108} fill={`url(#${haloId})`} />
      <Circle cx={110} cy={110} r={R} fill={`url(#${orbId})`} />

      <G>
        {specks.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#FFFFFF" opacity={s.o} />
        ))}
      </G>
    </Svg>
  );
}
