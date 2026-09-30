import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { PlejerPrice, type OpisPrice } from '@/components/prica/plejer';
import { KarticaZnaka } from '@/components/prica-znaka/kartica';
import { SLIKE_PRICE_ZNAKA } from '@/components/prica-znaka/slike';
import { imeSlikeZnaka, pricaZnaka, SLIKE_ZNAKA, tamnaSlikaZnaka } from '@/lib/prica-znaka';
import { useAuthStore } from '@/store/auth';
import { usePricaZnakaLog } from '@/store/prica-znaka-log';
import { useResolvedProfile } from '@/store/profile';
import { neutral } from '@/theme/tokens';

/**
 * PRICA O ZNAKU (Ivan, 30.9.2026; pravilo 25) — devet slika o Suncevom znaku korisnika, preko celog
 * ekrana, sa ulaza na tabu "Ti" (prsten oko Sunca u velikoj trojci). Isti plejer i isti okvir kao
 * dnevna prica; tekst je sa astroshop.rs, element/kvalitet/doba se racunaju (`lib/prica-znaka.ts`).
 * Stepen Sunca stoji samo uz tacno vreme rodjenja (bez njega je Sunce ±0,5°).
 */
export default function PricaZnakaEkran() {
  const resolved = useResolvedProfile();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const oznaci = usePricaZnakaLog((s) => s.oznaci);

  const p = React.useMemo(() => {
    if (!resolved || resolved.zoneUnreliable) return null;
    const sunce = resolved.chart.planets.find((x) => x.key === 'sun');
    if (!sunce) return null;
    return pricaZnaka(sunce.position.sign.key, resolved.timeUnknown ? null : sunce.position.deg);
  }, [resolved]);

  // Bez karte nema price (npr. nepouzdana zona, pravilo 4): ne ostaje se na krugu koji se vrti.
  React.useEffect(() => {
    if (p) return;
    const t = setTimeout(zatvori, 1500);
    return () => clearTimeout(t);
  }, [p]);

  const opis = React.useMemo<OpisPrice | null>(() => {
    if (!p) return null;
    return {
      trajanja: p.trajanja,
      podnaslov: 'Tvoj znak',
      tamna: (i) => tamnaSlikaZnaka(SLIKE_ZNAKA[i]),
      slika: (i, { okvir, onPodeli }) => {
        const Slika = SLIKE_PRICE_ZNAKA[SLIKE_ZNAKA[i]];
        return <Slika p={p} okvir={okvir} onPodeli={onPodeli} onProcitaj={procitaj} />;
      },
      kartica: (i) => <KarticaZnaka p={p} k={SLIKE_ZNAKA[i]} />,
      // Poslednja slika ima veliko "Podeli svoj znak".
      bezMalogPodeli: (i) => SLIKE_ZNAKA[i] === 'vladar',
      imeFajla: imeSlikeZnaka(p.znak),
      naslovDeljenja: 'Podeli svoj znak',
      onPoslednja: () => { if (userId) oznaci(userId, p.znak.key); },
    };
  }, [p, userId, oznaci]);

  if (!opis) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: neutral.grouped, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={neutral.inkMuted} />
      </View>
    );
  }
  return <PlejerPrice opis={opis} />;
}

/** "Pročitaj: Sunce u Ovnu" — tumacenje Sunca u znaku (list preko price, prica za to vreme stoji). */
function procitaj() {
  router.push({ pathname: '/natal', params: { tema: 'sun' } });
}

function zatvori() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
