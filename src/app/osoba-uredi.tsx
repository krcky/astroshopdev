import * as React from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { BezInterneta } from '@/components/bez-interneta';
import { Group, ListRow } from '@/components/ui/list';
import { VrednostReda } from '@/components/ui/vrednost-reda';
import { obrisiOsobu, useOsoba } from '@/lib/osobe-api';
import { porukaOsobe, type PoljeOsobe } from '@/lib/osobe';
import { datumRodjenja, sat } from '@/lib/horoscope';
import { ASTROLOG } from '@/lib/pitanja';
import { useAuthStore } from '@/store/auth';
import { neutral } from '@/theme/tokens';


/**
 * Izmena druge osobe (Ivan, 29.9.2026): TABELA sa svim podacima; dodir na red
 * otvara list odozdo samo sa tim poljem (`/rodjenje-polje`), koji cuva odmah.
 * Nova osoba se unosi korak po korak (`app/nova-osoba/`), ne ovde.
 *
 * Dole je brisanje. Pitanja o osobi ostaju — snimak karte je u pitanju.
 */
export default function OsobaUredi() {
  const tt = useT();
  const tu = tt.profil.osobaUredi;
  const tp = tt.profil.rodjenje;
  const { id } = useLocalSearchParams<{ id: string }>();
  const osoba = useOsoba(id);
  const uid = useAuthStore((s) => s.user?.id);
  const [brisem, setBrisem] = React.useState(false);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  if (!osoba) {
    return (
      <Screen label={tu.naslov} tabBarSpace={false} pushed>
        <Text variant="muted" className="mt-6">{tp.nemaVise}</Text>
      </Screen>
    );
  }

  const otvori = (polje: PoljeOsobe) => router.push({ pathname: '/rodjenje-polje', params: { osoba: osoba.id, polje } });
  const t = osoba.time;

  const obrisi = () => {
    if (!uid) return;
    Alert.alert(
      tu.obrisatiNaslov,
      tu.obrisatiTekst(osoba.name),
      [
        { text: tu.odustani, style: 'cancel' },
        {
          text: tt.opste.obrisi,
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
        <ListRow title={tp.ime} trailing={<VrednostReda>{osoba.name}</VrednostReda>} onPress={() => otvori('ime')} />
        <ListRow
          title={tp.koTiJeNaslov}
          trailing={<VrednostReda>{(osoba.odnos ? tt.profil.odnosi[osoba.odnos] : null) ?? tu.nijeIzabrano}</VrednostReda>}
          onPress={() => otvori('odnos')}
        />
        <ListRow title={tp.datum} trailing={<VrednostReda>{datumRodjenja(osoba.birth)}</VrednostReda>} onPress={() => otvori('datum')} />
        <ListRow
          title={tp.vreme}
          trailing={<VrednostReda>{t ? sat(t.hour, t.minute) : tu.neZnaSe}</VrednostReda>}
          onPress={() => otvori('vreme')}
        />
        <ListRow title={tp.mesto} trailing={<VrednostReda>{osoba.cityName}</VrednostReda>} onPress={() => otvori('mesto')} />
      </Group>

      <Text variant="muted" className="mx-screen mt-3">
        {tu.napomena(ASTROLOG.kratko, !t)}
      </Text>

      {!!poruka && <Text variant="note" className="mx-screen mt-6 text-foreground">{poruka}</Text>}

      <Group className="mt-8">
        <ListRow
          title={tu.obrisiOsobu}
          destructive
          chevron={false}
          onPress={brisem ? undefined : obrisi}
          trailing={brisem ? <ActivityIndicator color={neutral.inkSubtle} /> : undefined}
        />
      </Group>
    </Screen>
  );
}
