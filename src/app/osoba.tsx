import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { PodvuceniTabovi } from '@/components/ui/podvuceni-tabovi';
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

type Strana = 'karta' | 'danas';

const STRANE = [
  { key: 'karta', natpis: 'Karta' },
  { key: 'danas', natpis: 'Danas' },
] as const;

/**
 * Strana druge osobe (Ivan, 29.9.2026): njena natalna karta i danasnji tranziti
 * na nju — ISTI prikazi kao tab "Ti" i tab "Tranziti", sa istim granicama za
 * besplatne (pravilo 18c). Dole je pitanje astrologu o njoj (`/pitanje-novo?osoba=`).
 *
 * Posebna strana, a ne prekidac "ja / ona" na tabovima: "Danas" i "Tvoj dan" su
 * uvek korisnikovi, pa ne moze da se desi da neko cita tudji dan kao svoj.
 *
 * Osoba preko granice (Premium istekao, `otvoreneOsobe`) pokazuje samo poziv na
 * Premium; izmena i brisanje su i tada dostupni ("Izmeni" gore desno).
 */
export default function OsobaStrana() {
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
      <Screen label="Osoba" tabBarSpace={false} pushed>
        <Text variant="muted" className="mt-6">Ova osoba više nije na tvojoj listi.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      label={osoba.name}
      tabBarSpace={false}
      pushed
      padded={false}
      right={<IzmeniDugme id={osoba.id} />}>
      {!otvorena ? (
        <PremiumKartica
          className="mx-5 mt-6"
          naslov="Karta i tranziti"
          opis={`Uz Premium možeš da imaš do ${PREMIUM_GRANICE.osobe} osoba. Bez njega je otvorena samo prva osoba na listi.`}
        />
      ) : (
        <>
          <PodvuceniTabovi className="mx-5 mb-6" stavke={STRANE} izabrana={strana} onIzbor={setStrana} />

          {strana === 'karta' ? (
            <NatalnaKartaPrikaz resolved={resolved} osobaId={osoba.id} />
          ) : resolved.zoneUnreliable ? (
            <View className={cn(CARD_SURFACE, 'mx-5 p-5')}>
              <Text variant="h3">Tranziti ne mogu da se izračunaju</Text>
              <Text variant="muted" className="mt-2">
                Za mesto {resolved.city.name} na taj datum ne znamo pouzdano koliko je sati bilo po UTC-u,
                pa ni karta ni tranziti na nju ne bi bili tačni.
              </Text>
            </View>
          ) : rez ? (
            // `pt-6` liste je razmak ispod traka tabova — ovde ga vec daju tabovi.
            <View className="-mt-6 px-5">
              <TranzitiLista rez={rez} date={danas} osobaId={osoba.id}
                besplatno={premium ? undefined : BESPLATNO.tranzitiDana} />
            </View>
          ) : null}

          <PitajOOsobi id={osoba.id} />
        </>
      )}
    </Screen>
  );
}

/** "Izmeni" gore desno: podaci o rodjenju, odnos, brisanje (`/osoba-uredi`). */
function IzmeniDugme({ id }: { id: string }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/osoba-uredi', params: { id } })}
      accessibilityRole="button"
      accessibilityLabel="Izmeni podatke o rođenju"
      hitSlop={8}
      className="-mr-2 h-11 justify-center px-2 active:opacity-60">
      <Text variant="row">Izmeni</Text>
    </Pressable>
  );
}

/**
 * Pitanje astrologu o ovoj osobi — ista cena kao pitanje o sebi (Ivan, 29.9.2026).
 * Na listu za pisanje ide sa izabranom osobom; tamo se bira i "o vama dvoma".
 */
function PitajOOsobi({ id }: { id: string }) {
  return (
    <View className={cn(CARD_SURFACE, 'mx-5 mt-8 p-5')}>
      <View className="flex-row items-center gap-3">
        <AstrologSlika velicina={44} />
        <View className="flex-1">
          <Text variant="h3">Pitaj astrologa</Text>
          <Text variant="caption">
            {ASTROLOG.kratko} vidi ovu kartu, pa možeš da pitaš o ovoj osobi ili o vama dvoma.
          </Text>
        </View>
      </View>
      <Button variant="secondary" className="mt-4"
        // Prvi korak je uvod (astrolog, uslovi, cena), kao "Postavi pitanje" na tabu Pitaj.
        onPress={() => router.push({ pathname: '/pitanje-novo', params: { osoba: id, korak: 'uvod' } })}>
        <Text>Postavi pitanje</Text>
      </Button>
    </View>
  );
}
