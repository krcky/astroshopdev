import * as React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { ZnakIkona } from '@/components/znak-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { formatDatum, formatUntil } from '@/lib/horoscope';
import { SIGN_CASES } from '@/lib/zodiac';
import type { SkyEvent } from '@/lib/sky-events';

/**
 * Promena na nebu kao KARTICA TRANZITA (`KarticaTranzita`, tab "Tranziti"), Ivan 29.9.2026:
 * - oznaka gore = datum dogadjaja sa godinom ("14. oktobar 2026."), sitno, kao ime tranzita;
 * - naslov isti kao do sada ("Mars ulazi u Lava");
 * - umesto tona: broj kuce u kruzicu (`KucaBroj`) + "U tvojoj 1. kući", pa u ISTOM
 *   redu "Traje do …";
 * - umesto ilustracije aspekta: slika planete, dole desno znak u koji ulazi
 *   (odnosno u kom menja smer), u belom prstenu — kao velika trojka na "Ti".
 * Tekstova "planeta u znaku" jos nema, pa kartica ne vodi nigde; strelica ipak
 * stoji (Ivan, 27.9.2026) — odrediste se dodaje kad stignu tekstovi.
 */
const SLIKA: Record<string, ImageSourcePropType> = {
  sun: require('../../assets/images/planete/sun.png'),
  mercury: require('../../assets/images/planete/mercury.png'),
  venus: require('../../assets/images/planete/venus.png'),
  mars: require('../../assets/images/planete/mars.png'),
  jupiter: require('../../assets/images/planete/jupiter.png'),
  saturn: require('../../assets/images/planete/saturn.png'),
  uranus: require('../../assets/images/planete/uranus.png'),
  neptune: require('../../assets/images/planete/neptune.png'),
  pluto: require('../../assets/images/planete/pluto.png'),
};

/** Planeta i znak u belom prstenu dole desno (mere kao `TrojkaPlocica` na "Ti"). */
const PLANETA = 64;
const ZNAK = 26;
const PRSTEN = 3;

export function PromenaNaNebu({ e, today }: { e: SkyEvent; today: Date }) {
  // Venera je jedina planeta zenskog roda koja menja smer (Sunce nikad).
  const zenski = e.planet.key === 'venus';
  const znak = SIGN_CASES[e.sign.key];
  const naslov =
    e.kind === 'ingress' ? `${e.planet.name} ulazi u ${znak.acc}`
    : e.kind === 'retrograde' ? `${zenski ? 'Retrogradna' : 'Retrogradni'} ${e.planet.name} u ${znak.loc}`
    : `${e.planet.name} ponovo ${zenski ? 'direktna' : 'direktan'} u ${znak.loc}`;
  const kuca = e.house === null ? null : `U tvojoj ${e.house}. kući`;
  // Direktno kretanje nema kraj — tu stoji samo kuca.
  const trajanje = e.kind === 'direct' ? null : `Traje ${formatUntil(e.until, today)}`;
  const datum = formatDatum(e.at);

  return (
    <View
      className={cn(CARD_SURFACE, 'flex-row items-center gap-3 py-4 pl-4 pr-3')}
      accessible
      accessibilityLabel={[datum, naslov, kuca, trajanje].filter(Boolean).join('. ') + '.'}>
      <View className="flex-1">
        <Text variant="oznaka">{datum}</Text>
        <NaslovCeleReci size={21} lineHeight={26} min={16} variant="h2"
          className={cn('mt-2 tracking-[-0.3px] text-foreground', tezina('karticaNaslov'))}>
          {naslov}
        </NaslovCeleReci>
        {(kuca || trajanje) && (
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            {kuca && e.house !== null && (
              <View className="flex-row items-center gap-1.5">
                {/* Broj kuce u kruzicu, kao u listi planeta na "Ti" (Ivan, 29.9.2026). */}
                <KucaBroj kuca={e.house} size={20} />
                <Text variant="caption">{kuca}</Text>
              </View>
            )}
            {kuca && trajanje && <Text variant="caption">·</Text>}
            {trajanje && <Text variant="caption">{trajanje}</Text>}
          </View>
        )}
      </View>

      {/* Planeta, dole desno znak u belom prstenu. */}
      {SLIKA[e.planet.key] && (
        <View style={{ width: PLANETA, height: PLANETA, marginRight: PRSTEN }}>
          <Image source={SLIKA[e.planet.key]} style={{ width: PLANETA, height: PLANETA }}
            resizeMode="contain" accessibilityIgnoresInvertColors />
          <View
            className="absolute items-center justify-center rounded-full bg-card"
            style={{ width: ZNAK + 2 * PRSTEN, height: ZNAK + 2 * PRSTEN, right: -PRSTEN * 2, bottom: -PRSTEN }}>
            <ZnakIkona znak={e.sign.key} element={e.sign.element} size={ZNAK} />
          </View>
        </View>
      )}
      <ChevronRight size={20} color={OBLAST_BOJA} strokeWidth={2.2} style={{ marginLeft: -6, marginRight: -4 }} />
    </View>
  );
}
