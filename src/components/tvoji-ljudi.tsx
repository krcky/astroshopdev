import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Lock, Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { RowHead } from '@/components/ui/row';
import { ZnakIkona } from '@/components/znak-ikona';
import { PREMIUM, otvoriPremium } from '@/components/zakljucano';
import { useOsobe, useOtvoreneOsobe } from '@/lib/osobe-api';
import { mozeDaDoda, nazivOdnosa, type Osoba } from '@/lib/osobe';
import { PREMIUM as PREMIUM_GRANICE } from '@/lib/pristup';
import type { ZodiacSign } from '@/lib/zodiac';
import { resolveProfile } from '@/store/profile';
import { usePremium } from '@/store/auth';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/** Precnik ikonice u redu — isti kao ikonice planeta u listi karte. */
const IKONA = 28;

/**
 * "Tvoji ljudi" na tabu "Ti" (Ivan, 29.9.2026): druge osobe, redom dodavanja —
 * znak Sunca, ime, odnos. Dodir otvara stranu osobe (`/osoba`): njena karta i
 * tranziti. Poslednji red dodaje novu (`/osoba-uredi`).
 *
 * Besplatno 1, uz Premium 10 (`lib/pristup.ts`). Osobe preko granice (Premium
 * istekao) ostaju na listi sa katancem; strana im se otvara, ali pokazuje samo
 * poziv na Premium i izmenu. Kad je granica popunjena, "Dodaj osobu" nosi
 * katanac i vodi na paywall.
 */
export function TvojiLjudi({ className }: { className?: string }) {
  const osobe = useOsobe();
  const otvorene = useOtvoreneOsobe();
  const premium = usePremium();
  // Znak Sunca svake osobe — karta se racuna jednom po spisku, ne pri crtanju.
  const sunca = React.useMemo(() => {
    const m = new Map<string, ZodiacSign | null>();
    for (const o of osobe) {
      const r = resolveProfile(o);
      // Bez pouzdane zone ne tvrdimo ni znak (pravilo 4) — rodjenje na granici znaka.
      m.set(o.id, r && !r.zoneUnreliable ? r.chart.planets.find((p) => p.key === 'sun')?.position.sign ?? null : null);
    }
    return m;
  }, [osobe]);

  const moze = mozeDaDoda(osobe.length, premium);
  // Premium sa popunjenih 10: reda za dodavanje nema, broj u naslovu kaze zasto.
  const dodavanje = moze || !premium;

  return (
    <View className={cn(CARD_SURFACE, 'overflow-hidden', className)}>
      <RowHead>{osobe.length > 0 ? `Tvoji ljudi · ${osobe.length}` : 'Tvoji ljudi'}</RowHead>
      {osobe.map((o, i) => (
        <RedOsobe
          key={o.id}
          osoba={o}
          znak={sunca.get(o.id) ?? null}
          zakljucana={!otvorene.has(o.id)}
          last={!dodavanje && i === osobe.length - 1}
        />
      ))}
      {dodavanje && <DodajRed prazno={osobe.length === 0} zakljucan={!moze} />}
    </View>
  );
}

function RedOsobe({ osoba, znak, zakljucana, last }: {
  osoba: Osoba;
  znak: ZodiacSign | null;
  zakljucana: boolean;
  last: boolean;
}) {
  const ispod = [nazivOdnosa(osoba.odnos), znak?.name].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/osoba', params: { id: osoba.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${osoba.name}${ispod ? `, ${ispod}` : ''}${zakljucana ? '. Uz Premium' : ''}`}
      className={cn('min-h-row flex-row items-center py-3 pl-4 pr-3 active:opacity-60', !last && 'border-b border-border')}>
      {znak ? (
        <ZnakIkona znak={znak.key} element={znak.element} size={IKONA} />
      ) : (
        <View className="items-center justify-center rounded-full bg-fill-strong" style={{ width: IKONA, height: IKONA }}>
          <Text variant="caption" className="text-foreground">?</Text>
        </View>
      )}
      <View className="ml-3 mr-2 flex-1">
        <Text variant="row" numberOfLines={1}>{osoba.name}</Text>
        {!!ispod && <Text variant="caption" numberOfLines={1}>{ispod}</Text>}
      </View>
      {zakljucana
        ? <Lock size={16} color={PREMIUM} />
        : <ChevronRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} />}
    </Pressable>
  );
}

/**
 * "Dodaj osobu". Prazan spisak: rec-dve o tome sta se dobija. Popunjena
 * besplatna granica: katanac i Premium, ne forma koja bi pala na serveru.
 */
function DodajRed({ prazno, zakljucan }: { prazno: boolean; zakljucan: boolean }) {
  const ispod = zakljucan
    ? `Uz Premium do ${PREMIUM_GRANICE.osobe} osoba`
    : prazno ? 'Karta i tranziti partnera, deteta ili prijatelja' : null;
  return (
    <Pressable
      onPress={() => (zakljucan ? otvoriPremium() : router.push('/osoba-uredi'))}
      accessibilityRole="button"
      accessibilityLabel={`Dodaj osobu${ispod ? `. ${ispod}` : ''}`}
      className="min-h-row flex-row items-center py-3 pl-4 pr-3 active:opacity-60">
      <View className="items-center justify-center rounded-full bg-fill" style={{ width: IKONA, height: IKONA }}>
        <Plus size={16} color={neutral.ink} strokeWidth={2.2} />
      </View>
      <View className="ml-3 mr-2 flex-1">
        <Text variant="row">Dodaj osobu</Text>
        {!!ispod && <Text variant="caption" numberOfLines={2}>{ispod}</Text>}
      </View>
      {zakljucan
        ? <Lock size={16} color={PREMIUM} />
        : <ChevronRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} />}
    </Pressable>
  );
}
