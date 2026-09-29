import * as React from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { NaslovSekcije } from '@/components/naslov-sekcije';
import { AspektIkona, imaAspekt } from '@/components/aspekt-ikona';
import { ASPECT_STYLE } from '@/components/natal-wheel';
import { ASPECTS } from '@/lib/astro';
import { SIMBOLIKA_ASPEKTA } from '@/lib/simbolika';

/**
 * Delovi listova sa objasnjenjem tocka — "Šta je natalna karta" (tab "Ti") i
 * "Šta je trenutno nebo" (Nebo). Zajednicki su da dva lista izgledaju isto,
 * a legenda aspekata da ne moze da se razidje sa tockom (Ivan, 29.9.2026).
 */

/** Precnik ikonica uz stavke — kao crne ikonice u listi planeta. */
export const IKONA = 28;

/** Odeljak lista: podnaslov (`NaslovSekcije`) i sadrzaj. */
export function Odeljak({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <View className="mt-8">
      <NaslovSekcije>{naslov}</NaslovSekcije>
      {children}
    </View>
  );
}

/** Stavka: ikonica levo, ime i sitan opis desno. */
export function Stavka({ ime, ikona, children }: { ime: string; ikona: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="mb-4 flex-row gap-3">
      <View className="items-center justify-center" style={{ width: IKONA, height: IKONA }}>{ikona}</View>
      <View className="flex-1">
        <Text variant="row">{ime}</Text>
        <Text variant="muted" className="mt-0.5">{children}</Text>
      </View>
    </View>
  );
}

/** Sirina kolone sa ikonicom i uzorkom linije aspekta. */
const LINIJA = 36;

/** Komad linije aspekta, nacrtan kao na tocku (boja, debljina, isprekidanost). */
function LinijaAspekta({ boja, debljina, crta }: { boja: string; debljina: number; crta?: string }) {
  return (
    <Svg width={LINIJA} height={10} style={{ marginTop: 6 }}>
      <Line x1={2} y1={5} x2={LINIJA - 2} y2={5} stroke={boja} strokeWidth={debljina * 1.4} strokeDasharray={crta} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Odeljak "Aspekti": ISTE linije kao na tocku (`ASPECT_STYLE`) i isti tekst
 * kao "Simbolika" na tumacenju (`lib/simbolika.ts`).
 */
export function AspektiOdeljak() {
  return (
    <Odeljak naslov="Aspekti">
      <Text variant="reading">Skladni su plavi, napeti roze, a konjunkcija je siva.</Text>
      <View className="mt-4 gap-5">
        {ASPECTS.map((a) => {
          const sim = SIMBOLIKA_ASPEKTA[a.key];
          const st = ASPECT_STYLE[a.key];
          const ime = a.name.charAt(0).toUpperCase() + a.name.slice(1);
          return (
            <View key={a.key} className="flex-row gap-3" accessible
              accessibilityLabel={`${a.angle} stepeni, ${ime}${sim ? ` – ${sim.tema}. ${sim.opis}` : ''}`}>
              <View className="items-center pt-1" style={{ width: LINIJA }}>
                {imaAspekt(a.key) && <AspektIkona aspekt={a.key} size={16} />}
                {st && <LinijaAspekta boja={st.color} debljina={st.width} crta={st.dash} />}
              </View>
              <View className="flex-1">
                <Text variant="oznaka">{a.angle}° · {ime}{sim ? ` – ${sim.tema}` : ''}</Text>
                {sim && <Text variant="muted" className="mt-1">{sim.opis}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </Odeljak>
  );
}
