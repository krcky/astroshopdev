import { useMemo } from 'react';

import { SIGNS, norm360, signFromLongitude } from '@/lib/zodiac';
import { findAspects } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import {
  chartAngle, degreeTickPaths, levaTacka, naOsi, oseKarte, polar, spreadAngles, LABEL as NUM, LABEL_SEP, WHEEL_R as R,
} from '@/lib/wheel';
import { ELEMENT_BOJA, ZNAK_CENTAR, ZNAK_OBLIK, ZNAK_VIEWBOX } from '@/lib/znak-oblici';
import {
  ASPECT_STYLE, CENTAR, OKVIR, TACKA_PLANETE, TICK, TICK_STYLE, TOCAK_BOJE as COLORS, VIEW, ZNAK_TOCAK,
} from '@/lib/tocak-stil';

/**
 * Natalni tocak za panel — isti crtez kao `src/components/natal-wheel.tsx` u
 * aplikaciji, samo u obicnom SVG-u pregledaca (aplikacija crta kroz
 * react-native-svg, koji panel nema). Geometrija (`lib/wheel.ts`), izgled
 * (`lib/tocak-stil.ts`) i ikonice znakova (`lib/znak-oblici.ts`) su ZAJEDNICKI,
 * pa se tocak menja na jednom mestu. Uvek sa stepenima — panel je sirok.
 *
 * Kad se crtez u aplikaciji promeni (raspored, sta se crta), ista izmena ide i
 * ovde; brojevi i boje dolaze sami. Poslednja: kuce do malog kruga u sredini,
 * polje aspekata bez linije sa tackama planeta, bez vremena rodjenja Ovan levo
 * (30.9.2026).
 */
const PISMO = "'Plus Jakarta Sans', system-ui, sans-serif";
const GLIFOVI = "'AstroGlyphs', 'Plus Jakarta Sans', sans-serif";

/** `bezKuca`: vreme rodjenja nije poznato — kuce, ASC i MC se ne crtaju (racunati su za podne), levo je 0° Ovna. */
export function Tocak({ chart, bezKuca = false }: { chart: NatalChart; bezKuca?: boolean }) {
  const cx = CENTAR;
  const cy = CENTAR;
  const leva = levaTacka(chart.houses.ascendant, bezKuca);
  const at = (lon: number, r: number) => polar(cx, cy, r, chartAngle(lon, leva));
  const atAngle = (deg: number, r: number) => polar(cx, cy, r, deg);

  const simboli = chart.planets;
  const uglovi = useMemo(() => spreadAngles(simboli.map((p) => chartAngle(p.longitude, leva)), LABEL_SEP), [simboli, leva]);
  const ticks = useMemo(() => degreeTickPaths(cx, cy, leva, R.zodiacIn, TICK), [leva]);
  const ose = useMemo(() => oseKarte(chart.houses.ascendant, chart.houses.midheaven), [chart]);
  // Bez vremena rodjenja Mesec moze biti i 7° dalje — njegovi aspekti se ne crtaju (kao ni u tabeli).
  const aspekti = useMemo(
    () => findAspects(chart.planets).filter((a) => !bezKuca || (a.a.key !== 'moon' && a.b.key !== 'moon')),
    [chart, bezKuca]
  );

  return (
    <svg viewBox={`${-OKVIR} ${-OKVIR} ${VIEW} ${VIEW}`} width="100%" style={{ display: 'block', maxWidth: 520, margin: '0 auto' }}
         role="img" aria-label="Natalna karta">
      {/* prstenovi — polje aspekata nema svoj krug, ivicu pokazuju tacke planeta */}
      <circle cx={cx} cy={cy} r={R.outer} stroke={COLORS.line} strokeWidth={1} fill={COLORS.disk} />
      <circle cx={cx} cy={cy} r={R.zodiacIn} stroke={COLORS.line} strokeWidth={1} fill="none" />

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

      {/* kuspide od malog kruga do zodijaka, ose deblje (iz ASC i MC, ne iz rednog broja kuspide) */}
      {!bezKuca && (
        <g>
          {chart.houses.cusps.filter((c) => !naOsi(c, ose)).map((cusp, i) => {
            const a = at(cusp, R.hub);
            const b = at(cusp, R.zodiacIn);
            return <line key={`k${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.line} strokeWidth={0.8} />;
          })}
          {ose.map((lon, i) => {
            const a = at(lon, R.hub);
            const b = at(lon, R.zodiacIn);
            return <line key={`o${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.ink} strokeWidth={1.4} />;
          })}
          <circle cx={cx} cy={cy} r={R.hub} stroke={COLORS.line} strokeWidth={1} fill={COLORS.disk} />
        </g>
      )}

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

      {/* brojevi kuca oko malog kruga, na sredini kuce, sa belim oreolom preko linija */}
      {!bezKuca && chart.houses.cusps.map((cusp, i) => {
        const sledeca = chart.houses.cusps[(i + 1) % 12];
        const n = at(cusp + norm360(sledeca - cusp) / 2, R.houseNum);
        return (
          <text key={`n${i}`} x={n.x} y={n.y + NUM.houseSize * 0.38} fontSize={NUM.houseSize} fontFamily={PISMO} fontWeight={400}
                fill={COLORS.muted} stroke={COLORS.disk} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke"
                textAnchor="middle">
            {i + 1}
          </text>
        );
      })}

      {/* planete: tacka na ivici polja, simbol, crtica do pravog stepena, stepen i minut */}
      {simboli.map((p, i) => {
        const spread = uglovi[i];
        const pos = atAngle(spread, R.planetUp);
        const trueOuter = at(p.longitude, R.zodiacIn);
        const trueInner = at(p.longitude, R.zodiacIn - 7);
        const leadFrom = atAngle(spread, R.planetUp + 6);
        const tacka = at(p.longitude, R.houseRing);
        const { deg, min } = signFromLongitude(p.longitude);
        const minTekst = `${String(min).padStart(2, '0')}'`;
        const c = atAngle(spread, R.number);
        const degW = String(deg).length * NUM.degSize * NUM.digit;
        const minW = minTekst.length * NUM.minSize * NUM.digitMin;
        const degX = c.x - (minW + NUM.gap) / 2;
        const base = c.y + NUM.degSize * 0.36;
        const r = atAngle(spread - 6.3, R.planetUp + 2);
        return (
          <g key={p.key}>
            <title>{`${p.name} ${p.position.formatted}${p.retrograde ? ' (R)' : ''}`}</title>
            <line x1={trueOuter.x} y1={trueOuter.y} x2={trueInner.x} y2={trueInner.y} stroke={COLORS.ink} strokeWidth={1.2} />
            <line x1={trueInner.x} y1={trueInner.y} x2={leadFrom.x} y2={leadFrom.y} stroke={COLORS.line} strokeWidth={0.7} />
            <circle cx={tacka.x} cy={tacka.y} r={TACKA_PLANETE} fill={COLORS.ink} />
            <text x={pos.x} y={pos.y + NUM.glyphSize * 0.353} fontSize={NUM.glyphSize} fontFamily={GLIFOVI} fill={COLORS.ink} textAnchor="middle">{p.glyph}</text>
            {p.retrograde && (
              <text x={r.x} y={r.y + 2.7} fontSize={NUM.rSize} fontFamily={PISMO} fill={COLORS.muted} textAnchor="middle">R</text>
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
