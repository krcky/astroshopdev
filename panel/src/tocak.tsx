import { useMemo } from 'react';

import { SIGNS, norm360, signFromLongitude } from '@/lib/zodiac';
import { findAspects } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import { chartAngle, degreeTickPaths, polar, spreadAngles, LABEL as NUM, LABEL_SEP, WHEEL_R as R } from '@/lib/wheel';
import { ELEMENT_BOJA, ZNAK_CENTAR, ZNAK_OBLIK, ZNAK_VIEWBOX } from '@/lib/znak-oblici';
import { ASPECT_STYLE, CENTAR, OKVIR, TICK, TICK_STYLE, TOCAK_BOJE as COLORS, VIEW, ZNAK_TOCAK } from '@/lib/tocak-stil';

/**
 * Natalni tocak za panel — isti crtez kao `src/components/natal-wheel.tsx` u
 * aplikaciji, samo u obicnom SVG-u pregledaca (aplikacija crta kroz
 * react-native-svg, koji panel nema). Geometrija (`lib/wheel.ts`), izgled
 * (`lib/tocak-stil.ts`) i ikonice znakova (`lib/znak-oblici.ts`) su ZAJEDNICKI,
 * pa se tocak menja na jednom mestu. Uvek sa stepenima — panel je sirok.
 *
 * Kad se crtez u aplikaciji promeni (raspored, sta se crta), ista izmena ide i
 * ovde; brojevi i boje dolaze sami.
 */
const PISMO = "'Plus Jakarta Sans', system-ui, sans-serif";
const GLIFOVI = "'AstroGlyphs', 'Plus Jakarta Sans', sans-serif";

/** `bezKuca`: vreme rodjenja nije poznato — kuce, ASC i MC se ne crtaju (racunati su za podne). */
export function Tocak({ chart, bezKuca = false }: { chart: NatalChart; bezKuca?: boolean }) {
  const cx = CENTAR;
  const cy = CENTAR;
  const asc = chart.houses.ascendant;
  const at = (lon: number, r: number) => polar(cx, cy, r, chartAngle(lon, asc));
  const atAngle = (deg: number, r: number) => polar(cx, cy, r, deg);

  const simboli = chart.planets;
  const uglovi = useMemo(() => spreadAngles(simboli.map((p) => chartAngle(p.longitude, asc)), LABEL_SEP), [simboli, asc]);
  const ticks = useMemo(() => degreeTickPaths(cx, cy, asc, R.zodiacIn, TICK), [asc]);
  // Bez vremena rodjenja Mesec moze biti i 7° dalje — njegovi aspekti se ne crtaju (kao ni u tabeli).
  const aspekti = useMemo(
    () => findAspects(chart.planets).filter((a) => !bezKuca || (a.a.key !== 'moon' && a.b.key !== 'moon')),
    [chart, bezKuca]
  );

  return (
    <svg viewBox={`${-OKVIR} ${-OKVIR} ${VIEW} ${VIEW}`} width="100%" style={{ display: 'block', maxWidth: 520, margin: '0 auto' }}
         role="img" aria-label="Natalna karta">
      {/* prstenovi */}
      <circle cx={cx} cy={cy} r={R.outer} stroke={COLORS.line} strokeWidth={1} fill={COLORS.disk} />
      <circle cx={cx} cy={cy} r={R.zodiacIn} stroke={COLORS.line} strokeWidth={1} fill="none" />
      <circle cx={cx} cy={cy} r={R.houseRing} stroke={COLORS.line} strokeWidth={1} fill="none" />

      {/* crtice za stepene */}
      <path d={ticks.d1} stroke={TICK_STYLE.fine.d1.color} strokeWidth={TICK_STYLE.fine.d1.width} fill="none" />
      <path d={ticks.d5} stroke={TICK_STYLE.fine.d5.color} strokeWidth={TICK_STYLE.fine.d5.width} fill="none" />
      <path d={ticks.d10} stroke={TICK_STYLE.fine.d10.color} strokeWidth={TICK_STYLE.fine.d10.width} fill="none" />

      {/* granice znakova + ikonice */}
      {SIGNS.map((s, i) => {
        const start = i * 30;
        const edge = at(start, R.outer);
        const inner = at(start, R.zodiacIn);
        const mid = at(start + 15, (R.outer + R.zodiacIn) / 2);
        const z = ZNAK_OBLIK[s.key];
        return (
          <g key={s.key}>
            <line x1={inner.x} y1={inner.y} x2={edge.x} y2={edge.y} stroke={COLORS.line} strokeWidth={1} />
            <g transform={`translate(${mid.x - ZNAK_TOCAK / 2} ${mid.y - ZNAK_TOCAK / 2}) scale(${ZNAK_TOCAK / ZNAK_VIEWBOX})`}>
              <title>{s.name}</title>
              <circle cx={ZNAK_CENTAR} cy={ZNAK_CENTAR} r={ZNAK_CENTAR} fill={ELEMENT_BOJA[s.element]} />
              {z && <path d={z.d} fill="#FFFFFF" fillRule={z.evenodd ? 'evenodd' : 'nonzero'} />}
            </g>
          </g>
        );
      })}

      {/* kuspide + brojevi kuca */}
      {!bezKuca && chart.houses.cusps.map((cusp, i) => {
        const ugao = i === 0 || i === 3 || i === 6 || i === 9; // ASC, IC, DSC, MC
        const a = at(cusp, R.houseRing);
        const b = at(cusp, R.zodiacIn);
        const sledeca = chart.houses.cusps[(i + 1) % 12];
        const n = at(cusp + norm360(sledeca - cusp) / 2, R.houseNumIn);
        return (
          <g key={`k${i}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ugao ? COLORS.ink : COLORS.line} strokeWidth={ugao ? 1.4 : 0.8} />
            <text x={n.x} y={n.y + 3.5} fontSize={8.5} fontFamily={PISMO} fontWeight={400} fill={COLORS.houseNum} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* linije aspekata */}
      {aspekti.map((a, i) => {
        const st = ASPECT_STYLE[a.aspect.key];
        const p1 = at(a.a.longitude, R.houseRing);
        const p2 = at(a.b.longitude, R.houseRing);
        return (
          <line key={`a${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={st.color} strokeWidth={st.width}
                strokeDasharray={st.dash} opacity={0.65 + 0.35 * (1 - a.orb / a.aspect.orb)}>
            <title>{`${a.a.name} ${a.aspect.name} ${a.b.name}`}</title>
          </line>
        );
      })}

      {/* planete: simbol, crtica do pravog stepena, stepen i minut */}
      {simboli.map((p, i) => {
        const spread = uglovi[i];
        const pos = atAngle(spread, R.planetUp);
        const trueOuter = at(p.longitude, R.zodiacIn);
        const trueInner = at(p.longitude, R.zodiacIn - 7);
        const leadFrom = atAngle(spread, R.planetUp + 6);
        const { deg, min } = signFromLongitude(p.longitude);
        const minTekst = `${String(min).padStart(2, '0')}'`;
        const c = atAngle(spread, R.number);
        const degW = String(deg).length * NUM.degSize * NUM.digit;
        const minW = minTekst.length * NUM.minSize * NUM.digitMin;
        const degX = c.x - (minW + NUM.gap) / 2;
        const base = c.y + NUM.degSize * 0.36;
        const r = atAngle(spread - 5.5, R.planetUp + 2);
        return (
          <g key={p.key}>
            <title>{`${p.name} ${p.position.formatted}${p.retrograde ? ' (R)' : ''}`}</title>
            <line x1={trueOuter.x} y1={trueOuter.y} x2={trueInner.x} y2={trueInner.y} stroke={COLORS.ink} strokeWidth={1.2} />
            <line x1={trueInner.x} y1={trueInner.y} x2={leadFrom.x} y2={leadFrom.y} stroke={COLORS.line} strokeWidth={0.7} />
            <text x={pos.x} y={pos.y + 6} fontSize={17} fontFamily={GLIFOVI} fill={COLORS.ink} textAnchor="middle">{p.glyph}</text>
            {p.retrograde && (
              <text x={r.x} y={r.y + 2.4} fontSize={7} fontFamily={PISMO} fill={COLORS.muted} textAnchor="middle">R</text>
            )}
            <text x={degX} y={base} fontSize={NUM.degSize} fontFamily={PISMO} fontWeight={600} fill={COLORS.ink} textAnchor="middle">{deg}</text>
            <text x={degX + degW / 2 + NUM.gap} y={base - NUM.rise} fontSize={NUM.minSize} fontFamily={PISMO} fontWeight={400}
                  fill={COLORS.muted} textAnchor="start">{minTekst}</text>
          </g>
        );
      })}

      {/* ASC i MC van kruga */}
      {!bezKuca && ([['ASC', chart.houses.ascendant], ['MC', chart.houses.midheaven]] as const).map(([natpis, lon]) => {
        const a = at(lon, R.outer);
        const b = at(lon, R.outer + 7);
        const t = at(lon, R.outer + 16);
        return (
          <g key={natpis}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.ugao} strokeWidth={1.5} />
            <text x={t.x} y={t.y + 3.5} fontSize={9.5} fontFamily={PISMO} fontWeight={600} fill={COLORS.ugao} textAnchor="middle">{natpis}</text>
          </g>
        );
      })}
    </svg>
  );
}
