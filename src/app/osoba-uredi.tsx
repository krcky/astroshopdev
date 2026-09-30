import * as React from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { BezInterneta } from '@/components/bez-interneta';
import { Group, ListRow } from '@/components/ui/list';
import { VrednostReda } from '@/components/ui/vrednost-reda';
import { obrisiOsobu, useOsoba } from '@/lib/osobe-api';
import { ODNOSI, porukaOsobe, type PoljeOsobe } from '@/lib/osobe';
import { datumRodjenja } from '@/lib/horoscope';
import { ASTROLOG } from '@/lib/pitanja';
import { useAuthStore } from '@/store/auth';
import { neutral } from '@/theme/tokens';

const dvo = (n: number) => String(n).padStart(2, '0');

/**
 * Izmena druge osobe (Ivan, 29.9.2026): TABELA sa svim podacima; dodir na red
 * otvara list odozdo samo sa tim poljem (`/rodjenje-polje`), koji cuva odmah.
 * Nova osoba se unosi korak po korak (`app/nova-osoba/`), ne ovde.
 *
 * Dole je brisanje. Pitanja o osobi ostaju — snimak karte je u pitanju.
 */
export default function OsobaUredi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const osoba = useOsoba(id);
  const uid = useAuthStore((s) => s.user?.id);
  const [brisem, setBrisem] = React.useState(false);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  if (!osoba) {
    return (
      <Screen label="Izmena" tabBarSpace={false} pushed>
        <Text variant="muted" className="mt-6">Ova osoba više nije na tvojoj listi.</Text>
      </Screen>
    );
  }

  const otvori = (polje: PoljeOsobe) => router.push({ pathname: '/rodjenje-polje', params: { osoba: osoba.id, polje } });
  const t = osoba.time;

  const obrisi = () => {
    if (!uid) return;
    Alert.alert(
      'Obrisati osobu?',
      `${osoba.name} nestaje sa tvoje liste, na svim uređajima. Već postavljena pitanja o ovoj osobi ostaju.`,
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            setBrisem(true);
            setPoruka(null);
            try {
              await obrisiOsobu(uid, osoba.id);
              // Strana osobe iza ove vise nema sta da pokaze — nazad na "Ti".
              router.dismissTo('/chart');
            } catch (e) {
              setPoruka(porukaOsobe((e as Error)?.message));
              setBrisem(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen label={osoba.name} tabBarSpace={false} pushed padded={false}>
      <BezInterneta className="mx-screen mt-4" />

      <Group className="mt-6">
        <ListRow title="Ime" trailing={<VrednostReda>{osoba.name}</VrednostReda>} onPress={() => otvori('ime')} />
        <ListRow
          title="Ko ti je"
          trailing={<VrednostReda>{ODNOSI.find((o) => o.key === osoba.odnos)?.naziv ?? 'Nije izabrano'}</VrednostReda>}
          onPress={() => otvori('odnos')}
        />
        <ListRow title="Datum rođenja" trailing={<VrednostReda>{datumRodjenja(osoba.birth)}</VrednostReda>} onPress={() => otvori('datum')} />
        <ListRow
          title="Vreme rođenja"
          trailing={<VrednostReda>{t ? `${dvo(t.hour)}:${dvo(t.minute)}` : 'Ne zna se'}</VrednostReda>}
          onPress={() => otvori('vreme')}
        />
        <ListRow title="Mesto rođenja" trailing={<VrednostReda>{osoba.cityName}</VrednostReda>} onPress={() => otvori('mesto')} />
      </Group>

      <Text variant="muted" className="mx-screen mt-3">
        {t ? '' : 'Bez vremena rođenja karta nema podznak ni kuće. '}
        Ove podatke vidiš samo ti. Ako postaviš pitanje o ovoj osobi, vidi ih i {ASTROLOG.kratko}.
      </Text>

      {!!poruka && <Text variant="note" className="mx-screen mt-6 text-foreground">{poruka}</Text>}

      <Group className="mt-8">
        <ListRow
          title="Obriši osobu"
          destructive
          chevron={false}
          onPress={brisem ? undefined : obrisi}
          trailing={brisem ? <ActivityIndicator color={neutral.inkSubtle} /> : undefined}
        />
      </Group>
    </Screen>
  );
}
