import * as React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { CARD_SURFACE } from '@/components/ui/card';
import { OblastIkona } from '@/components/oblast-ikona';
import { IKONA_OBLASTI, RAZMERA_IKONE } from '@/components/krug-zivota';
import { MINUS, PLUS } from '@/components/prica/boje';
import { Pojava, TackiceOcene } from '@/components/prica/crtezi';
import type { PricaDana } from '@/lib/use-prica';
import type { KrugKey } from '@/lib/krug-config';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/** Mere celije: slika price i kartica za deljenje (360 x 640, manje mesta). */
const MERE = {
  slika: { razmak: 8, pad: 10, ikona: 30, ime: 'text-[15px] leading-[19px]', stanje: 'text-[12px] leading-[15px]', tackica: 8 },
  kartica: { razmak: 6, pad: 8, ikona: 26, ime: 'text-[13.5px] leading-[17px]', stanje: 'text-[11px] leading-[14px]', tackica: 7 },
} as const;

/** Ikonica oblasti kruga zivota, sa istim faktorom velicine kao na krugu. */
export function IkonaKruga({ oblast, size }: { oblast: KrugKey; size: number }) {
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <OblastIkona oblast={IKONA_OBLASTI[oblast]} size={size * (RAZMERA_IKONE[oblast] ?? 1)} />
    </View>
  );
}

/** Trougao kao na karticama oblasti na pocetnoj: gore (plavo) / dole (roze) u odnosu na juce; bez promene nista. */
function Strelica({ ocena, juce }: { ocena: number; juce: number | null }) {
  if (juce === null || ocena === juce) return null;
  const gore = ocena > juce;
  return (
    <Svg width={9} height={8} viewBox="0 0 9 8">
      <Path d={gore ? 'M4.5 0 L9 8 L0 8 Z' : 'M0 0 L9 0 L4.5 8 Z'} fill={gore ? PLUS : MINUS} />
    </Svg>
  );
}

/**
 * OCENE U PRICI = OSAM OBLASTI KRUGA ZIVOTA (Ivan, 13.10.2026; do tada cetiri reda sa brojem): mreza 2 x 4, u celiji
 * ikonica, ime oblasti, rec stanja, tackice i strelica od juce — isto sto i kartice oblasti na pocetnoj. Ista
 * komponenta za sliku price i za karticu (PNG / video): svi pokreti po satu slike (`Pojava`, `TackiceOcene`), a celija
 * ima PUNU ivicu uz `overflow-hidden` (pravilo 23 — `layer.render` u videu).
 */
export function OceneKruga({ redovi, kartica = false }: { redovi: NonNullable<PricaDana['ocene']>['redovi']; kartica?: boolean }) {
  const t = useT();
  const m = kartica ? MERE.kartica : MERE.slika;
  const parovi: (typeof redovi)[] = [];
  for (let i = 0; i < redovi.length; i += 2) parovi.push(redovi.slice(i, i + 2));
  return (
    <View style={{ gap: m.razmak }}>
      {parovi.map((par, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: m.razmak }}>
          {par.map((o, k) => {
            const i = r * 2 + k;
            const promena = o.juce === null || o.juce === o.ocena ? '' : `, ${o.ocena > o.juce ? t.krug.odJuce.gore : t.krug.odJuce.dole}`;
            return (
              <Pojava
                key={o.key}
                kasni={900 + i * 110}
                style={{ flex: 1 }}
                className={cn(kartica ? 'rounded-lg border border-card bg-card/80' : CARD_SURFACE, 'overflow-hidden')}>
                <View
                  accessible
                  accessibilityLabel={t.krug.oblastA11y(o.name, o.oznaka, o.ocena) + promena}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: m.pad, padding: m.pad }}>
                  <IkonaKruga oblast={o.key} size={m.ikona} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={cn(m.ime, tezina('chipIzabran'))}>{o.name}</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={cn(m.stanje, 'font-semibold')} style={{ color: neutral.inkSubtle }}>{o.oznaka}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <TackiceOcene ocena={o.ocena} velicina={m.tackica} kasni={1300 + i * 130} />
                      <Strelica ocena={o.ocena} juce={o.juce} />
                    </View>
                  </View>
                </View>
              </Pojava>
            );
          })}
        </View>
      ))}
    </View>
  );
}
