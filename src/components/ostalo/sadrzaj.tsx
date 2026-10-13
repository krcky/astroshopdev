import * as React from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';

import { NeboKartica } from '@/components/ostalo/nebo-kartica';
import { ProizvodRed } from '@/components/ostalo/proizvod-red';
import { UporedniKartica } from '@/components/ostalo/uporedni-kartica';
import { useCeneProizvoda } from '@/components/ostalo/cene';
import { useMojZnak } from '@/components/ostalo/moj-znak';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { otvoriPremium } from '@/components/zakljucano';
import { dodajWidgetNaEkran } from '@/lib/nebo-widget';
import { PROIZVODI, type Proizvod } from '@/lib/proizvodi';
import type { ZodiacSign } from '@/lib/zodiac';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

/**
 * Sadrzaj taba "Ostalo" (Ivan, 14.10.2026; dizajn: claude.ai/artifact/FVnAxJEdj9KGet8QQHUjPa): Uporedni horoskop
 * (prvi i najveci — ono sto ljudi najvise vole), Trenutno na nebu, pa lista "Proizvodi". Zasebna komponenta da je
 * mogu da prikazu i tab i razvojni ekran bez naloga.
 *
 * LISTA JE JEDNA (Ivan): ono sto se kupuje u aplikaciji i ono sto vodi na sajt stoje zajedno, a sajt prepoznaje
 * strelica nagore. Svaki red vodi u svoj tok: Premium na paywall, natalna karta na izbor kupovine, pitanje na
 * pisanje pitanja, widget na uputstvo; sajt i sat na list sa jednim proizvodom (`app/proizvod.tsx`).
 */
export function OstaloSadrzaj({ znak: znakProp }: {
  /** Znak zadat rucno (razvojni ekran `/dev-ostalo`); bez njega se cita iz profila. */
  znak?: ZodiacSign | null;
}) {
  const t = useT().ostalo;
  const izProfila = useMojZnak();
  const znak = znakProp !== undefined ? znakProp : izProfila;
  const cene = useCeneProizvoda();

  const otvori = async (p: Proizvod) => {
    switch (p.id) {
      case 'widget':
        // Android: sistemski dijalog dodaje widget jednim dodirom; iOS ne moze sam, pa uputstvo (kao kartica na Nebu).
        if (Platform.OS === 'android' && (await dodajWidgetNaEkran())) return;
        router.push('/widget-uputstvo');
        return;
      case 'premium':
        otvoriPremium();
        return;
      case 'natalna':
        router.push('/natal-kupovina');
        return;
      case 'pitanje':
        router.push({ pathname: '/pitanje-novo', params: { korak: 'uvod' } });
        return;
      default:
        router.push({ pathname: '/proizvod', params: { id: p.id } });
    }
  };

  // `pt-4`: prva kartica malo nize od zaglavlja (Ivan, 14.10.2026).
  return (
    <View className="gap-3 pb-6 pt-4">
      <UporedniKartica znak={znak} onPress={() => router.push('/uporedni')} />
      <NeboKartica onPress={() => router.push('/nebo')} />

      <View className="mt-6">
        <Text variant="oznaka">{t.proizvodi.oznaka}</Text>
        <Text variant="title" className="mt-1">{t.proizvodi.naslov}</Text>
        <Text variant="muted" className="mt-2">{t.proizvodi.napomena}</Text>

        <View className={cn(CARD_SURFACE, 'mt-4 overflow-hidden')}>
          {PROIZVODI.map((p, i) => {
            const stavka = t.proizvodi.stavke[p.id];
            const cena = cene[p.id];
            const izlaz = p.vrsta === 'sajt';
            return (
              <View key={p.id} className={i < PROIZVODI.length - 1 ? 'border-b border-border' : undefined}>
                <ProizvodRed
                  id={p.id}
                  naziv={stavka.naziv}
                  opis={stavka.opis}
                  cena={cena}
                  izlaz={izlaz}
                  a11y={[stavka.naziv, stavka.opis, cena ? `${cena.cena} ${cena.nastavak ?? ''}`.trim() : null, izlaz ? t.proizvodi.izlazA11y : null].filter(Boolean).join('. ')}
                  onPress={() => { void otvori(p); }}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
