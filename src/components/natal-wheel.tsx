import * as React from 'react';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { GLYPH_FONT } from '@/components/ui/glyph';
import { SIGNS, norm360 } from '@/lib/zodiac';
import { findAspects } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import { chartAngle, polar, spreadAngles } from '@/lib/wheel';

/* Poluprecnici, u koordinatama viewBox-a (0—360). */
const R = {
  outer: 174,      // spoljasnji krug
  zodiacIn: 144,   // unutrasnja ivica zodijackog prstena
  tick: 136,       // kraj crtica za stepene
  planet: 116,     // gde stoje simboli planeta
  houseRing: 88,   // unutrasnji krug, granica polja aspekata
  houseNum: 97,    // brojevi kuca
};

const COLORS = {
  ink: '#141414',
  line: '#D8D8D8',
  faint: '#ECECEC',
  muted: '#8A8A8A',
  gold: '#A7731B',
  /** Napeti aspekti — kvadrat, opozicija. */
  tense: '#C4453A',
  /** Skladni aspekti — trigon, sekstil. */
  easy: '#3B6FA8',
};

const ASPECT_STYLE: Record<string, { color: string; width: number; dash?: string }> = {
  conjunction: { color: COLORS.muted, width: 1, dash: '3 3' },
  sextile: { color: COLORS.easy, width: 0.8, dash: '4 3' },
  trine: { color: COLORS.easy, width: 1.1 },
  square: { color: COLORS.tense, width: 1.1 },
  opposition: { color: COLORS.tense, width: 1.3 },
};

type Props = {
  chart: NatalChart;
  size?: number;
  /** Sakrij linije aspekata (citljivije na malom prikazu). */
  showAspects?: boolean;
};

export function NatalWheel({ chart, size = 360, showAspects = true }: Props) {
  const cx = 180;
  const cy = 180;
  const asc = chart.houses.ascendant;

  /** Ekliptička longituda -> ugao na ekranu. ASC levo, longituda raste suprotno od kazaljke. */
  const angleOf = (lon: number) => chartAngle(lon, asc);
  const at = (lon: number, r: number) => polar(cx, cy, r, angleOf(lon));
  /** Za vec izracunat ugao (posle razmicanja). */
  const atAngle = (deg: number, r: number) => polar(cx, cy, r, deg);

  // Razmaknute pozicije simbola planeta.
  const planetAngles = React.useMemo(
    () => spreadAngles(chart.planets.map((p) => angleOf(p.longitude)), 9.5),
    [chart]
  );

  const aspects = React.useMemo(
    () => (showAspects ? findAspects(chart.planets) : []),
    [chart, showAspects]
  );

  return (
    <Svg width={size} height={size} viewBox="-30 -30 420 420">
      {/* --- prstenovi --- */}
      <Circle cx={cx} cy={cy} r={R.outer} stroke={COLORS.line} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={R.zodiacIn} stroke={COLORS.line} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={R.houseRing} stroke={COLORS.line} strokeWidth={1} fill="none" />

      {/* --- crtice za stepene: svakih 5°, duze svakih 10° --- */}
      <G>
        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5;
          const long = i % 2 === 0;
          const a = at(lon, R.zodiacIn);
          const b = at(lon, long ? R.tick : R.tick + 4);
          return (
            <Line key={`t${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={COLORS.faint} strokeWidth={long ? 1 : 0.6} />
          );
        })}
      </G>

      {/* --- granice znakova + simboli --- */}
      <G>
        {SIGNS.map((s, i) => {
          const start = i * 30;
          const edge = at(start, R.outer);
          const inner = at(start, R.zodiacIn);
          const mid = at(start + 15, (R.outer + R.zodiacIn) / 2);
          return (
            <G key={s.key}>
              <Line x1={inner.x} y1={inner.y} x2={edge.x} y2={edge.y}
                    stroke={COLORS.line} strokeWidth={1} />
              <SvgText
                x={mid.x} y={mid.y + 6}
                fontSize={17} fontFamily={GLYPH_FONT} fill={COLORS.ink}
                textAnchor="middle">
                {s.glyph}
              </SvgText>
            </G>
          );
        })}
      </G>

      {/* --- kuspide kuca + brojevi --- */}
      <G>
        {chart.houses.cusps.map((cusp, i) => {
          const isAngle = i === 0 || i === 3 || i === 6 || i === 9; // ASC, IC, DSC, MC
          const a = at(cusp, R.houseRing);
          const b = at(cusp, R.zodiacIn);
          // Broj kuce ide na sredinu izmedju ove i sledece kuspide.
          const next = chart.houses.cusps[(i + 1) % 12];
          const midLon = cusp + norm360(next - cusp) / 2;
          const n = at(midLon, R.houseNum);
          return (
            <G key={`h${i}`}>
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isAngle ? COLORS.ink : COLORS.line}
                    strokeWidth={isAngle ? 1.4 : 0.8} />
              <SvgText x={n.x} y={n.y + 3.5} fontSize={9.5} fill={COLORS.muted} textAnchor="middle">
                {i + 1}
              </SvgText>
            </G>
          );
        })}
      </G>

      {/* --- linije aspekata --- */}
      <G>
        {aspects.map((a, i) => {
          const st = ASPECT_STYLE[a.aspect.key];
          const p1 = at(a.a.longitude, R.houseRing);
          const p2 = at(a.b.longitude, R.houseRing);
          return (
            <Line
              key={`a${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={st.color}
              strokeWidth={st.width}
              strokeDasharray={st.dash}
              opacity={0.45 + 0.45 * (1 - a.orb / a.aspect.orb)}
            />
          );
        })}
      </G>

      {/* --- planete --- */}
      <G>
        {chart.planets.map((p, i) => {
          const spread = planetAngles[i];
          const pos = atAngle(spread, R.planet);
          // Crtica koja povezuje simbol sa STVARNIM stepenom na prstenu.
          const trueOuter = at(p.longitude, R.zodiacIn);
          const trueInner = at(p.longitude, R.zodiacIn - 7);
          const leadFrom = atAngle(spread, R.planet + 11);
          return (
            <G key={p.key}>
              <Line x1={trueOuter.x} y1={trueOuter.y} x2={trueInner.x} y2={trueInner.y}
                    stroke={COLORS.ink} strokeWidth={1.2} />
              <Line x1={trueInner.x} y1={trueInner.y} x2={leadFrom.x} y2={leadFrom.y}
                    stroke={COLORS.line} strokeWidth={0.7} />
              <SvgText
                x={pos.x} y={pos.y + 6}
                fontSize={17} fontFamily={GLYPH_FONT} fill={COLORS.ink}
                textAnchor="middle">
                {p.glyph}
              </SvgText>
              {p.retrograde && (
                <SvgText x={pos.x + 11} y={pos.y + 10} fontSize={8} fill={COLORS.muted} textAnchor="middle">
                  R
                </SvgText>
              )}
            </G>
          );
        })}
      </G>

      {/* --- oznake uglova: crtica van kruga + natpis, da ne udju u zodijacki prsten --- */}
      <G>
        {([['ASC', chart.houses.ascendant], ['MC', chart.houses.midheaven]] as const).map(([label, lon]) => {
          const a = at(lon, R.outer);
          const b = at(lon, R.outer + 7);
          const t = at(lon, R.outer + 16);
          return (
            <G key={label}>
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.gold} strokeWidth={1.5} />
              <SvgText x={t.x} y={t.y + 3.5} fontSize={9.5} fontWeight="600"
                       fill={COLORS.gold} textAnchor="middle">
                {label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}
