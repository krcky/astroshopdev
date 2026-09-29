import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { KapsuleRed } from '@/components/ui/kapsule';
import { BezInterneta } from '@/components/bez-interneta';
import { RodjenjeForma, Sekcija, pocetniUnos, profilIzUnosa } from '@/components/rodjenje-forma';
import { otvoriPremium } from '@/components/zakljucano';
import { dodajOsobu, izmeniOsobu, obrisiOsobu, useOsoba } from '@/lib/osobe-api';
import { ODNOSI, porukaOsobe, type OdnosKljuc } from '@/lib/osobe';
import { useNaMrezi } from '@/lib/mreza';
import { ASTROLOG } from '@/lib/pitanja';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/**
 * Unos ili izmena druge osobe (Ivan, 29.9.2026) — sve na jednom ekranu, kao
 * `/edit` (pravilo 10), plus "Ko ti je". Bez `id` je nova osoba.
 *
 * Upis ide PRVO na server (`lib/osobe-api.ts`): baza proverava granicu (1
 * besplatno, 10 uz Premium) i daje id. Bez mreze se ne cuva nista, i to se kaze.
 *
 * PRISTANAK: pri dodavanju korisnik potvrdi da osoba zna da unosi njene podatke,
 * a za dete da je roditelj ili staratelj. Konacan tekst ide pravniku uz politiku
 * privatnosti (unosimo podatke trece osobe, a vidi ih i astrolog kad se pita o njoj).
 */
export default function OsobaUredi() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const osoba = useOsoba(id);
  const uid = useAuthStore((s) => s.user?.id);
  const naMrezi = useNaMrezi();

  const [unos, setUnos] = React.useState(() => pocetniUnos(osoba));
  const [odnos, setOdnos] = React.useState<OdnosKljuc | null>(osoba?.odnos ?? null);
  // Kod izmene je pristanak vec dat pri dodavanju.
  const [pristanak, setPristanak] = React.useState(!!id);
  const [radi, setRadi] = React.useState<'cuvam' | 'brisem' | null>(null);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  if (id && !osoba) {
    return (
      <Screen label="Izmena" tabBarSpace={false} pushed>
        <Text variant="muted" className="mt-6">Ova osoba više nije na tvojoj listi.</Text>
      </Screen>
    );
  }

  const podaci = profilIzUnosa(unos);
  const spremno = !!podaci && pristanak && !!uid && naMrezi && radi === null;

  const sacuvaj = async () => {
    if (!spremno || !podaci || !uid) return;
    setRadi('cuvam');
    setPoruka(null);
    try {
      if (id) {
        await izmeniOsobu(uid, id, { ...podaci, odnos });
        router.back();
      } else {
        const nova = await dodajOsobu(uid, { ...podaci, odnos });
        // Na stranu nove osobe, a forma izlazi iz istorije (nazad vodi na "Ti").
        router.replace({ pathname: '/osoba', params: { id: nova.id } });
      }
    } catch (e) {
      const m = (e as Error)?.message;
      setPoruka(porukaOsobe(m));
      setRadi(null);
      // Granica je na serveru (npr. Premium istekao dok je forma bila otvorena).
      if (/granica_osoba/.test(m ?? '')) otvoriPremium();
    }
  };

  const obrisi = () => {
    if (!id || !uid || !osoba) return;
    Alert.alert(
      'Obrisati osobu?',
      `${osoba.name} nestaje sa tvoje liste, na svim uređajima. Već postavljena pitanja o ovoj osobi ostaju.`,
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            setRadi('brisem');
            setPoruka(null);
            try {
              await obrisiOsobu(uid, id);
              // Strana osobe iza ove vise nema sta da pokaze — nazad na "Ti".
              router.dismissTo('/chart');
            } catch (e) {
              setPoruka(porukaOsobe((e as Error)?.message));
              setRadi(null);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen
      label={id ? 'Izmena' : 'Nova osoba'}
      tabBarSpace={false}
      pushed
      keyboardShouldPersistTaps="handled">
      <BezInterneta className="mt-4" />

      <RodjenjeForma
        unos={unos}
        onChange={setUnos}
        imePlaceholder="Ime ili nadimak"
        posleImena={
          <Sekcija naslov="Ko ti je">
            <KapsuleRed
              stavke={ODNOSI.map((o) => ({ key: o.key, label: o.naziv, icon: null }))}
              // Nista izabrano dok korisnik ne izabere — odnos nije obavezan.
              izabrana={(odnos ?? '') as OdnosKljuc}
              onIzbor={(k) => setOdnos(k === odnos ? null : k)}
            />
          </Sekcija>
        }
      />

      {!id && (
        <Pressable
          onPress={() => setPristanak(!pristanak)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: pristanak }}
          className="mt-7 flex-row gap-3 active:opacity-60">
          <View
            className={cn('mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2 border-foreground', pristanak && 'bg-foreground')}>
            {pristanak && <Check size={16} color={neutral.white} strokeWidth={3} />}
          </View>
          <Text variant="default" className="flex-1">
            Osoba zna da unosim njene podatke o rođenju. Ako je dete, ja sam roditelj ili staratelj.
          </Text>
        </Pressable>
      )}
      <Text variant="muted" className="mt-3">
        Ove podatke vidiš samo ti. Ako postaviš pitanje o ovoj osobi, vidi ih i {ASTROLOG.kratko}.
      </Text>

      {!!poruka && <Text variant="note" className="mt-6 text-foreground">{poruka}</Text>}

      <Button className="mt-6" size="lg" disabled={!spremno} ucitava={radi === 'cuvam'} onPress={sacuvaj}>
        <Text>{id ? 'Sačuvaj' : 'Dodaj osobu'}</Text>
      </Button>

      {id && (
        <Pressable
          onPress={obrisi}
          disabled={radi !== null}
          accessibilityRole="button"
          accessibilityState={{ disabled: radi !== null, busy: radi === 'brisem' }}
          className="mt-4 items-center py-3 active:opacity-60">
          {radi === 'brisem'
            ? <ActivityIndicator color={neutral.inkSubtle} />
            : <Text variant="muted" className="text-destructive">Obriši osobu</Text>}
        </Pressable>
      )}
    </Screen>
  );
}
