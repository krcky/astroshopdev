import * as React from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { GLYPH_FONT } from '@/components/ui/glyph';
import { ZNAK_VIEWBOX, ZnakOblik } from '@/components/znak-ikona';
import { fontUloge } from '@/theme/tipografija';
import {
  ASPECT_STYLE, CENTAR, DEGREES_MIN_SIZE, OKVIR, TICK, TICK_STYLE, TOCAK_BOJE as COLORS, VIEW, ZNAK_TOCAK,
} from '@/lib/tocak-stil';
import { SIGNS, norm360, signFromLongitude } from '@/lib/zodiac';
import { findAspects } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import {
  chartAngle, degreeTickPaths, polar, spreadAngles,
  LABEL as NUM, LABEL_SEP, WHEEL_R as R,
} from '@/lib/wheel';

/* Poluprecnici i velicine ispisa stoje u `lib/wheel.ts` — proverava ih
   `npm run check:sky`, sekcija 10. Boje, crtice i linije aspekata su u
   `lib/tocak-stil.ts` (deli ih tocak u panelu za astrologa). */

/** Legenda "Šta je natalna karta" uvozi linije aspekata odavde. */
export { ASPECT_STYLE };

/*
 * Zasto minut stoji DESNO od stepena, a ne u svom prstenu.
 *
 * Prva verzija je imala dva prstena — stepen spolja, minut ka unutra. Problem
 * je sto "spolja" i "unutra" na ekranu menjaju smer: kod planete na vrhu tocka
 * minut je ISPOD stepena, kod planete na dnu je IZNAD njega, a levo i desno je
 * pored. Isti podatak se citao na cetiri nacina i nije se videlo sta je sta.
 *
 * Sada su stepen i minut jedan red, sa minutom kao indeksom gore-desno.
 * Smer je uvek isti bez obzira gde je planeta na krugu.
 *
 * Cena je sirina: "16 48'" je 23 jedinice, a sam glif ~14. Dva suseda na istom
 * poluprecniku traze tetivu duzu od toga — otud razmak od 14°, koji na r=102
 * daje 24.7. I zato se prsten planeta odmice na 125: na dijagonali se ugao
 * glifa i ugao bloka priblizavaju, pa je na blizim poluprecnicima Venera
 * zakacala svoj broj.
 *
 * Svaki put kad se `minSize` promeni, blok se siri i OVA TRI BROJA se menjaju
 * zajedno. Preveri `npm run check:sky`, sekcija 10.
 *
 * Izmereno na stvarnoj karti, 42 okvira: nijedno preklapanje, blok najblize
 * centru na r=89.3 (unutrasnji prsten je na 88), najveci pomak simbola od
 * pravog ugla 8.8° (check-natal dozvoljava 20°).
 */

/**
 * Koliko je donja ivica spoljnog kruga udaljena od vrha crteza, u tackama, za
 * tocak velicine `size`. Za dugme "i" koje stoji u liniji sa dnom kruga (`chart.tsx`).
 */
export function dnoKruga(size: number): number {
  return (size * (OKVIR + CENTAR + R.outer)) / VIEW;
}

/** Sve sto se crta na prstenu planeta — telo ili izvedena tacka. */
type Simbol = {
  key: string;
  glyph: string;
  longitude: number;
  retrograde?: boolean;
  /** Izvedena tacka (cvor, Lilit, Tacka srece), ne telo. */
  izvedena?: boolean;
};

/** Stepen i minut u znaku — isti brojevi koje ispisuje lista ispod tocka. */
function stepenMinut(longitude: number): { deg: number; min: string } {
  const p = signFromLongitude(longitude);
  return { deg: p.deg, min: String(p.min).padStart(2, '0') };
}

type Props = {
  chart: NatalChart;
  size?: number;
  /** Sakrij linije aspekata (citljivije na malom prikazu). */
  showAspects?: boolean;
  /**
   * Stepen i lucni minut u dva reda ispod svakog simbola.
   *
   * Bez vrednosti se odlucuje po `size`: ispod `DEGREES_MIN_SIZE` brojevi su
   * sitniji od granice citljivosti, pa se gase sami. Eksplicitna vrednost
   * nadjacava tu procenu.
   */
  showDegrees?: boolean;
  /**
   * Izvedene tacke uz planete — cvor, Lilit, Tacka srece.
   *
   * Idu u ISTO razmicanje kao planete, inace se simboli preklope cim se tacka
   * nadje na istom stepenu kao neko telo. Crtaju se prigusenom bojom, da se na
   * prvi pogled vidi sta je telo a sta racun.
   */
  points?: { key: string; glyph: string; longitude: number; retrograde?: boolean }[];
};

export function NatalWheel({ chart, size = 360, showAspects = true, showDegrees, points }: Props) {
  const cx = CENTAR;
  const cy = CENTAR;
  const asc = chart.houses.ascendant;
  const degrees = showDegrees ?? size >= DEGREES_MIN_SIZE;
  // Brojevi kuca bi upali u drugi red brojeva, pa se sklanjaju unutar prstena.
  const houseNumR = degrees ? R.houseNumIn : R.houseNum;
  const planetR = degrees ? R.planetUp : R.planet;

  /** Ekliptička longituda -> ugao na ekranu. ASC levo, longituda raste suprotno od kazaljke. */
  const angleOf = (lon: number) => chartAngle(lon, asc);
  const at = (lon: number, r: number) => polar(cx, cy, r, angleOf(lon));
  /** Za vec izracunat ugao (posle razmicanja). */
  const atAngle = (deg: number, r: number) => polar(cx, cy, r, deg);

  const simboli = React.useMemo<Simbol[]>(
    () => [
      ...chart.planets.map((p) => ({
        key: p.key, glyph: p.glyph, longitude: p.longitude, retrograde: p.retrograde,
      })),
      ...(points ?? []).map((t) => ({ ...t, izvedena: true })),
    ],
    [chart, points]
  );

  // Razmaknute pozicije simbola. Sa vise od deset simbola razmak mora da se
  // smanji, inace relaksacija gurne ceo klaster u stranu.
  //
  // Sa stepenima razmak mora da poraste: glif staje u 9.5°, ali blok "16 48'"
  // ispod njega je sirok 23 jedinice, sto na poluprecniku 102 trazi 13.1°.
  // Uzeto je 14° za rezervu. Cena je da simbol stoji dalje od svog stvarnog
  // stepena — zato crtica koja vodi do prstena postaje obavezna, a ne ukras.
  const minSep = degrees ? LABEL_SEP : (simboli.length > 11 ? 8.5 : 9.5);
  const symbolAngles = React.useMemo(
    () => spreadAngles(simboli.map((s) => angleOf(s.longitude)), minSep),
    [simboli, minSep]
  );

  const ticks = React.useMemo(
    () => degreeTickPaths(cx, cy, asc, R.zodiacIn, degrees ? TICK : { ...TICK, d5: 4 }),
    [asc, degrees]
  );

  const aspects = React.useMemo(
    () => (showAspects ? findAspects(chart.planets) : []),
    [chart, showAspects]
  );

  return (
    <Svg width={size} height={size} viewBox={`${-OKVIR} ${-OKVIR} ${VIEW} ${VIEW}`}>
      {/* --- prstenovi --- */}
      {/* Bela ispuna ispod svega: na sivoj pozadini ekrana tocak inace prosijava. */}
      <Circle cx={cx} cy={cy} r={R.outer} stroke={COLORS.line} strokeWidth={1} fill={COLORS.disk} />
      <Circle cx={cx} cy={cy} r={R.zodiacIn} stroke={COLORS.line} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={R.houseRing} stroke={COLORS.line} strokeWidth={1} fill="none" />

      {/* --- crtice za stepene --- */}
      <G>
        {degrees && (
          <Path d={ticks.d1} stroke={TICK_STYLE.fine.d1.color}
                strokeWidth={TICK_STYLE.fine.d1.width} fill="none" />
        )}
        <Path d={ticks.d5}
              stroke={(degrees ? TICK_STYLE.fine : TICK_STYLE.plain).d5.color}
              strokeWidth={(degrees ? TICK_STYLE.fine : TICK_STYLE.plain).d5.width}
              fill="none" />
        <Path d={ticks.d10}
              stroke={(degrees ? TICK_STYLE.fine : TICK_STYLE.plain).d10.color}
              strokeWidth={(degrees ? TICK_STYLE.fine : TICK_STYLE.plain).d10.width}
              fill="none" />
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
              {/* Ivanova ikonica znaka (`znak-ikona.tsx`), ZNAK_TOCAK jedinica, u sredini prstena. */}
              <G transform={`translate(${mid.x - ZNAK_TOCAK / 2} ${mid.y - ZNAK_TOCAK / 2}) scale(${ZNAK_TOCAK / ZNAK_VIEWBOX})`}>
                <ZnakOblik znak={s.key} element={s.element} />
              </G>
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
          const n = at(midLon, houseNumR);
          return (
            <G key={`h${i}`}>
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isAngle ? COLORS.ink : COLORS.line}
                    strokeWidth={isAngle ? 1.4 : 0.8} />
              {/* Uz stepene ovo su druge cifre na ekranu — sitnije i svetlije,
                  da se broj kuce ne procita kao stepen planete. */}
              <SvgText x={n.x} y={n.y + 3.5}
                       fontSize={degrees ? 8.5 : 9.5} fontFamily={fontUloge('tockKuca')}
                       fill={degrees ? COLORS.houseNum : COLORS.muted}
                       textAnchor="middle">
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
              opacity={0.65 + 0.35 * (1 - a.orb / a.aspect.orb)}
            />
          );
        })}
      </G>

      {/* --- planete i izvedene tacke --- */}
      <G>
        {simboli.map((p, i) => {
          const spread = symbolAngles[i];
          const pos = atAngle(spread, planetR);
          const boja = p.izvedena ? COLORS.muted : COLORS.ink;
          // Crtica koja povezuje simbol sa STVARNIM stepenom na prstenu.
          const trueOuter = at(p.longitude, R.zodiacIn);
          const trueInner = at(p.longitude, R.zodiacIn - 7);
          const leadFrom = atAngle(spread, planetR + 6);
          return (
            <G key={p.key}>
              <Line x1={trueOuter.x} y1={trueOuter.y} x2={trueInner.x} y2={trueInner.y}
                    stroke={boja} strokeWidth={p.izvedena ? 0.9 : 1.2} />
              <Line x1={trueInner.x} y1={trueInner.y} x2={leadFrom.x} y2={leadFrom.y}
                    stroke={COLORS.line} strokeWidth={0.7} />
              <SvgText
                x={pos.x} y={pos.y + 6}
                fontSize={p.izvedena ? 15 : 17} fontFamily={GLYPH_FONT} fill={boja}
                textAnchor="middle">
                {p.glyph}
              </SvgText>
              {p.retrograde && (() => {
                // Bez stepena "R" stoji kao indeks uz glif — pomak je EKRANSKI
                // (desno-dole) i to je u redu jer ispod glifa nema niceg.
                // Sa stepenima taj isti pomak kod planeta na levoj strani
                // tocka pada tacno u red sa brojevima, jer je tamo "desno"
                // ujedno i "ka centru". Zato se uz stepene "R" sklanja
                // RADIJALNO — po luku u stranu i malo ka spolja, gde brojeva
                // nema ni na jednoj strani kruga.
                const r = degrees ? atAngle(spread - 5.5, planetR + 2) : { x: pos.x + 11, y: pos.y + 10 };
                return (
                  <SvgText x={r.x} y={degrees ? r.y + 2.4 : r.y}
                           fontSize={degrees ? 7 : 8} fontFamily={fontUloge('tockKuca')} fill={COLORS.muted} textAnchor="middle">
                    R
                  </SvgText>
                );
              })()}
              {degrees && (() => {
                const { deg, min } = stepenMinut(p.longitude);
                const degSize = p.izvedena ? NUM.degSizeIzv : NUM.degSize;
                const minSize = p.izvedena ? NUM.minSizeIzv : NUM.minSize;
                const c = atAngle(spread, R.number);

                // Minut visi desno i gore od stepena — U EKRANSKIM koordinatama,
                // isto za svaku planetu bez obzira gde je na krugu.
                //
                // Zbog toga je blok NESIMETRICAN: siri je udesno nego ulevo.
                // Da je stepen postavljen tacno na radijalnu liniju, blok bi na
                // jednoj polovini tocka udarao u svoj glif. Zato se ceo blok
                // pomera za pola minutove sirine ulevo, pa je CENTAR BLOKA na
                // liniji, a ne stepen.
                const degW = String(deg).length * degSize * NUM.digit;
                const minW = `${min}'`.length * minSize * NUM.digitMin;
                const degX = c.x - (minW + NUM.gap) / 2;
                const base = c.y + degSize * 0.36;

                return (
                  <>
                    {/* Pismo aplikacije, ne AstroGlyphs — on nema cifre (rezervni font bi
                        pomerio visinu reda). Debljina je familija (`theme/font.ts`). */}
                    <SvgText x={degX} y={base}
                             fontSize={degSize} fontFamily={fontUloge('tockStepen')}
                             fill={boja} textAnchor="middle">
                      {deg}
                    </SvgText>
                    <SvgText x={degX + degW / 2 + NUM.gap} y={base - NUM.rise}
                             fontSize={minSize} fontFamily={fontUloge('tockMinut')}
                             fill={COLORS.muted} textAnchor="start">
                      {min}'
                    </SvgText>
                  </>
                );
              })()}
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
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.ugao} strokeWidth={1.5} />
              <SvgText x={t.x} y={t.y + 3.5} fontSize={9.5} fontFamily={fontUloge('tockUgao')}
                       fill={COLORS.ugao} textAnchor="middle">
                {label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}
