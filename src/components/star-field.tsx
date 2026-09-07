import * as React from 'react';
import { View } from 'react-native';

/** Deterministicni PRNG — iste zvezde pri svakom renderu, bez treperenja. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = { count?: number; seed?: number };

export function StarField({ count = 90, seed = 7 }: Props) {
  const stars = React.useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const size = rand() < 0.85 ? 1.5 : 2.5;
      return {
        top: `${rand() * 100}%`,
        left: `${rand() * 100}%`,
        size,
        opacity: 0.15 + rand() * 0.6,
      };
    });
  }, [count, seed]);

  return (
    <View style={{ pointerEvents: 'none' }} className="absolute inset-0">
      {stars.map((s, i) => (
        <View
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top as any,
            left: s.left as any,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}
