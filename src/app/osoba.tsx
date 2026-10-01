import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { KapsuleRed } from '@/components/ui/kapsule';
import { NatalnaKartaPrikaz } from '@/components/natalna-karta-prikaz';
import { TranzitiLista } from '@/components/tranziti-lista';
import { AstrologSlika } from '@/components/astrolog-slika';
import { PremiumKartica } from '@/components/zakljucano';
import { useKarta, useOsoba, useOtvoreneOsobe } from '@/lib/osobe-api';
import { useOblastiDana } from '@/lib/use-oblasti';
import { ASTROLOG } from '@/lib/pitanja';
import { BESPLATNO, PREMIUM as PREMIUM_GRANICE } from '@/lib/pristup';
import { usePremium } from '@/store/auth';
import { useDanas } from '@/store/danas';
import { cn } from '@/lib/utils';

type Strana = 'karta' | 'tranziti' | 'pitaj';

/** Tabovi strane osobe — staklene kapsule kao na pocetnoj (Ivan, 29.9.2026). */
const STRANE: readonly Strana[] = ['karta', 'tranziti', 'pitaj'];

/**
 * Strana druge osobe (Ivan, 29.9.2026): tabovi Natalna karta / Tranziti / Pitaj
 * (staklene kapsule kao na pocetnoj). Karta i tranziti su ISTI prikazi kao tab
 * "Ti" i tab "Tranziti", sa istim granicama za besplatne (pravilo 18c); "Pitaj"
 * vodi na pitanje astrologu o njoj (`/pitanje-novo?osoba=`).
 *
 * Posebna strana, a ne prekidac "ja / ona" na tabovima: "Danas" i "Tvoj dan" su
 * uvek korisnikovi, pa ne moze da se desi da neko cita tudji dan kao svoj.
 *
 * Osoba preko granice (Premium istekao, `otvoreneOsobe`) pokazuje samo poziv na
 * Premium; izmena i brisanje su i tada dostupni ("Izmeni" gore desno).
 */
export default function OsobaStrana() {
  const t = useT();
  const to = t.profil.osoba;
  const { id } = useLocalSearchParams<{ id: string }>();
  const osoba = useOsoba(id);
  const resolved = useKarta(id);
  const otvorene = useOtvoreneOsobe();
  const premium = usePremium();
  const danas = useDanas();
  const [strana, setStrana] = React.useState<Strana>('karta');
  const otvorena = !!osoba && otvorene.has(osoba.id);
  // Tranziti samo za otvorenu osobu sa pouzdanom zonom (pravilo 4).
  const rez = useOblastiDana(otvorena && resolved && !resolved.zoneUnreliable ? resolved : null, danas);

  if (!osoba || !resolved) {
    return (
      <Screen label={to.naslov} tabBarSpace={false} pushed>
        <Text variant="muted" className="mt-6">{t.profil.rodjenje.nemaVise}</Text>
      </Screen>
    );
  }

  const natpis: Record<Strana, string> = { karta: to.tabKarta, tranziti: to.tabTranziti, pitaj: to.tabPitaj };
  const stavke = STRANE.map((key) => ({ key, label: natpis[key] }));

  return (
    <Screen
      label={osoba.name}
      tabBarSpace={false}
      pushed
      padded={false}
      right={<IzmeniDugme id={osoba.id} />}>
      {!otvorena ? (
        <PremiumKartica
          className="mx-5 mt-10"
          naslov={to.uzPremium(osoba.name)}
          opis={to.uzPremiumOpis(PREMIUM_GRANICE.osobe)}
          dugme={to.otkljucajSve}
        />
      ) : (
        <>
          <View className="mb-6 px-5">
            <KapsuleRed tabovi stavke={stavke} izabrana={strana} onIzbor={setStrana} />
          </View>

          {strana === 'karta' ? (
            <NatalnaKartaPrikaz resolved={resolved} osobaId={osoba.id} />
          ) : strana === 'pitaj' ? (
            <PitajOOsobi id={osoba.id} />
          ) : resolved.zoneUnreliable ? (
            <View className={cn(CARD_SURFACE, 'mx-5 p-5')}>
              <Text variant="h3">{to.tranzitiNeMogu}</Text>
              <Text variant="muted" className="mt-2">
                {to.tranzitiNeMoguTekst(resolved.city.name)}
              </Text>
            </View>
          ) : rez ? (
            // `pt-6` liste je razmak ispod traka tabova — ovde ga vec daju tabovi.
            <View className="-mt-6 px-5">
              <TranzitiLista rez={rez} date={danas} osobaId={osoba.id}
                besplatno={premium ? undefined : BESPLATNO.tranzitiDana} />
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

/** "Izmeni" gore desno: podaci o rodjenju, odnos, brisanje (`/osoba-uredi`). */
function IzmeniDugme({ id }: { id: string }) {
  const t = useT();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/osoba-uredi', params: { id } })}
      accessibilityRole="button"
      accessibilityLabel={t.profil.osoba.izmeniOpis}
      hitSlop={8}
      className="-mr-2 h-11 justify-center px-2 active:opacity-60">
      <Text variant="row">{t.opste.izmeni}</Text>
    </Pressable>
  );
}

/**
 * Pitanje astrologu o ovoj osobi — ista cena kao pitanje o sebi (Ivan, 29.9.2026).
 * Na listu za pisanje ide sa izabranom osobom; tamo se bira i "o vama dvoma".
 */
function PitajOOsobi({ id }: { id: string }) {
  const t = useT().profil.osoba;
  return (
    <View className={cn(CARD_SURFACE, 'mx-5 p-5')}>
      <View className="flex-row items-center gap-3">
        <AstrologSlika velicina={44} />
        <View className="flex-1">
          <Text variant="h3">{t.pitajAstrologa}</Text>
          <Text variant="caption">
            {t.pitajTekst(ASTROLOG.kratko)}
          </Text>
        </View>
      </View>
      {/* Crno glavno dugme (Ivan, 29.9.2026) — na tabu "Pitaj" je ovo jedina radnja. */}
      <Button className="mt-4"
        // Prvi korak je uvod (astrolog, uslovi, cena), kao "Postavi pitanje" na tabu Pitaj.
        onPress={() => router.push({ pathname: '/pitanje-novo', params: { osoba: id, korak: 'uvod' } })}>
        <Text>{t.postaviPitanje}</Text>
      </Button>
    </View>
  );
}
