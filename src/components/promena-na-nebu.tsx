import * as React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { ZnakIkona } from '@/components/znak-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { PlanetaZiva } from '@/components/planeta-ziva';
import { Zraci } from '@/components/prica/crtezi';
import { PricaPozadina, type MestoMrlje } from '@/components/prica/pozadina';
import { SatSlike } from '@/components/prica/sat';
import { useBudnost, useUstedaBaterije } from '@/store/budnost';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { backdrop, neutral } from '@/theme/tokens';
import { formatDatum, formatUntil } from '@/lib/horoscope';
import { useT } from '@/i18n';
import type { SkyEvent } from '@/lib/sky-events';

/**
 * Promena na nebu kao KARTICA TRANZITA (`KarticaTranzita`, tab "Tranziti"), Ivan 29.9.2026:
 * - oznaka gore = datum dogadjaja sa godinom ("14. oktobar 2026."), sitno, kao ime tranzita;
 * - naslov isti kao do sada ("Mars ulazi u Lava");
 * - umesto tona: broj kuce u kruzicu (`KucaBroj`) + "U tvojoj 1. kući", pa u ISTOM
 *   redu "Traje do …";
 * - umesto ilustracije aspekta: slika planete, dole desno znak u koji ulazi
 *   (odnosno u kom menja smer), u belom prstenu — kao velika trojka na "Ti".
 * Planeta je ANIMIRANA (`PlanetaZiva`, Ivan, 13.10.2026). `velika` = prva kartica u nizu: preko cele kartice pozadina poslednje
 * slike dnevne price (mrlje, ovde u boji preliva zaglavlja, + zraci iz loga koji se sporo okrecu), u sredini zraka planeta; tekst ispod, centriran, bez strelice.
 * Tekstova "planeta u znaku" jos nema, pa kartica ne vodi nigde; strelica ipak
 * stoji (Ivan, 27.9.2026) — odrediste se dodaje kad stignu tekstovi.
 */
/** Planeta i znak u belom prstenu dole desno (mere kao `TrojkaPlocica` na "Ti"). */
const PLANETA = 64;
const ZNAK = 26;
const PRSTEN = 3;

/** Velika kartica: razmak iznad planete, precnik zraka (krug u sredini je 0,3 precnika) i planeta u tom krugu. */
/** Pozadina je u BOJI PRELIVA U ZAGLAVLJU (`backdrop.blobs.purple`, jacina vrha preliva) na 50% (bilo 80%, "ipak ublaziti") (Ivan, 13.10.2026; probano pre toga: zlato iz price, roze). */
const POZADINA_JACINA = 0.5;
/** Boje mrlja preliva u zaglavlju (ljubicasta i plava), jacine vrha preliva (0,40 u `backdrop.colors`). */
/** Mrlje NISU gore kao u prici nego na sredini i dole (Ivan, 13.10.2026): ljubicasta iza planete i naslova, plava pri dnu. */
const RASPORED: readonly MestoMrlje[] = [
  { x: -0.25, y: 0.22, w: 1.5, h: 0.7, period: 16, dx: 0.12, dy: 0.04, ds: 0.08 },
  { x: -0.1, y: 0.62, w: 1.3, h: 0.6, period: 12, dx: -0.14, dy: -0.04, ds: -0.08 },
];
const POZADINA = backdrop.blobs.purple.map(([boja]) => [boja, 0.4] as const);
const VRH_VELIKE = 40;
const ZRACI = 620;
const PLANETA_VELIKA = 150;
const ZNAK_VELIKI = 40;

/**
 * Sat za zrake velike kartice (`sat.tsx`): tece samo na ekranu u fokusu i dok je korisnik budan (pravilo 17);
 * uz "Smanji pokrete" i u ustedi baterije sata nema, pa zraci stoje nacrtani.
 */
function SatKartice({ children }: { children: React.ReactNode }) {
  const budan = useBudnost((s) => s.budan);
  const usteda = useUstedaBaterije();
  const bezPokreta = useReducedMotion();
  const sat = useSharedValue(0);
  const kadar = useFrameCallback((f) => { sat.set(sat.get() + (f.timeSincePreviousFrame ?? 0)); }, false);
  const stoji = bezPokreta || usteda;
  useFocusEffect(React.useCallback(() => {
    if (stoji || !budan) return;
    kadar.setActive(true);
    return () => kadar.setActive(false);
  }, [stoji, budan, kadar]));
  return <SatSlike sat={stoji ? null : sat}>{children}</SatSlike>;
}

/** Planeta koja se vrti, dole desno znak u belom prstenu. */
function PlanetaSaZnakom({ e, size, znak }: { e: SkyEvent; size: number; znak: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <PlanetaZiva planeta={e.planet.key} size={size} />
      <View
        className="absolute items-center justify-center rounded-full bg-card"
        style={{ width: znak + 2 * PRSTEN, height: znak + 2 * PRSTEN, right: -PRSTEN * 2, bottom: -PRSTEN }}>
        <ZnakIkona znak={e.sign.key} element={e.sign.element} size={znak} />
      </View>
    </View>
  );
}

export function PromenaNaNebu({ e, today, velika = false }: { e: SkyEvent; today: Date; velika?: boolean }) {
  const t = useT();
  const p = t.danas.promena;
  const z = e.sign.key as keyof typeof t.nebo.znaci;
  // Venera je jedina planeta zenskog roda koja menja smer (Sunce nikad) — rod bira recnik po kljucu.
  const naslov =
    e.kind === 'ingress' ? p.ulazi(e.planet.name, t.nebo.uZnak(z))
    : e.kind === 'retrograde' ? p.retrogradna(e.planet.key, e.planet.name, t.nebo.uZnaku(z))
    : p.direktna(e.planet.key, e.planet.name, t.nebo.uZnaku(z));
  const kuca = e.house === null ? null : t.danas.tranzit.uTvojojKuci(e.house);
  // Direktno kretanje nema kraj — tu stoji samo kuca.
  const trajanje = e.kind === 'direct' ? null : p.traje(formatUntil(e.until, today));
  const datum = formatDatum(e.at);

  const oznaka = [datum, naslov, kuca, trajanje].filter(Boolean).join('. ') + '.';
  const podaci = (kuca || trajanje) && (
    <View className={cn('mt-2 flex-row flex-wrap items-center gap-1.5', velika && 'justify-center')}>
      {kuca && e.house !== null && (
        <View className="flex-row items-center gap-1.5">
          {/* Pun lila krug sa belim brojem, kao na karticama planeta natalne karte v2 (Ivan, 13.10.2026). */}
          <KucaBroj kuca={e.house} size={22} puna={{ slova: 11 }} />
          <Text variant="caption">{kuca}</Text>
        </View>
      )}
      {kuca && trajanje && <Text variant="caption">·</Text>}
      {trajanje && <Text variant="caption">{trajanje}</Text>}
    </View>
  );
  const strelica = <ChevronRight size={20} color={OBLAST_BOJA} strokeWidth={2.2} style={{ marginLeft: -6, marginRight: -4 }} />;

  if (velika) {
    // Podloga je CISTO BELA (Ivan, 13.10.2026; do tada siva iz price), ljubicaste mrlje ostaju na sredini i dole.
    // Pozadina price je preko CELE kartice; zraci su centrirani na planetu, tekst ispod je centriran (Ivan, 13.10.2026).
    return (
      <View className={cn(CARD_SURFACE, 'items-center overflow-hidden px-4 pb-6')} style={{ backgroundColor: neutral.white, paddingTop: VRH_VELIKE }}
        accessible accessibilityLabel={oznaka}>
        <SatKartice>
          <PricaPozadina nijansa="lila" mrlje={POZADINA} raspored={RASPORED} jacina={POZADINA_JACINA} />
          <View pointerEvents="none" className="absolute items-center"
            style={{ left: 0, right: 0, top: VRH_VELIKE + PLANETA_VELIKA / 2 - ZRACI / 2, height: ZRACI }}>
            <Zraci velicina={ZRACI} />
          </View>
        </SatKartice>
        <PlanetaSaZnakom e={e} size={PLANETA_VELIKA} znak={ZNAK_VELIKI} />
        <Text variant="oznaka" className="mt-7 text-center">{datum}</Text>
        <NaslovCeleReci size={28} lineHeight={33} min={18} variant="h2"
          className={cn('mt-2 text-center tracking-[-0.4px] text-foreground', tezina('karticaNaslov'))}>
          {naslov}
        </NaslovCeleReci>
        {podaci}
      </View>
    );
  }

  return (
    <View className={cn(CARD_SURFACE, 'flex-row items-center gap-3 py-4 pl-4 pr-3')} accessible accessibilityLabel={oznaka}>
      <View className="flex-1">
        <Text variant="oznaka">{datum}</Text>
        <NaslovCeleReci size={21} lineHeight={26} min={16} variant="h2"
          className={cn('mt-2 tracking-[-0.3px] text-foreground', tezina('karticaNaslov'))}>
          {naslov}
        </NaslovCeleReci>
        {podaci}
      </View>
      <View style={{ marginRight: PRSTEN }}>
        <PlanetaSaZnakom e={e} size={PLANETA} znak={ZNAK} />
      </View>
      {strelica}
    </View>
  );
}
