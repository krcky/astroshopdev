import * as React from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Group, GroupHeader, ListRow } from '@/components/ui/list';
import { VrednostReda } from '@/components/ui/vrednost-reda';
import { SheetScroll } from '@/components/sheet';
import { OZNAKA_12 } from '@/components/tvoj-dan-card';
import { deleteAccount, signOut, useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { datum, datumRodjenja } from '@/lib/horoscope';
import type { PoljeOsobe } from '@/lib/osobe';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { useT } from '@/i18n';

/** Naslov sekcije kao na profilu — kao datum na pocetnoj (`oznaka` 12pt). */
const NASLOV = cn('ml-0', OZNAKA_12);
const dvo = (n: number) => String(n).padStart(2, '0');

/**
 * NALOG — list sa profila (Ivan, 29.9.2026): email (i njegova promena, `/email`),
 * PODACI O RODJENJU kao tabela — svaki red otvara list samo sa tim podatkom
 * (`/rodjenje-polje`, isto kao kod druge osobe) — i BRISANJE NALOGA, jedan korak
 * dalje od profila: Apple trazi da postoji u aplikaciji (5.1.1(v)), a Ivan da ne
 * stoji na dohvat palca. I dalje dva koraka — dugme pa potvrda.
 */
export default function NalogSheet() {
  const tn = useT().onboarding.nalog;
  const user = useAuthStore((s) => s.user);
  const profil = useProfileStore((s) => s.profile);
  const [brise, setBrise] = React.useState(false);
  const [odjavaSvuda, setOdjavaSvuda] = React.useState(false);

  // Odjava sa SVIH uredjaja (Ivan, 30.9.2026) — obicno "Odjavi se" na profilu odjavljuje
  // samo ovaj telefon. Potvrda, jer izbacuje i telefon, tablet i sve ostalo.
  const odjaviSvuda = () => {
    Alert.alert(
      tn.odjavaNaslov,
      tn.odjavaTekst,
      [
        { text: tn.odustani, style: 'cancel' },
        {
          text: tn.odjaviSeSvuda,
          onPress: async () => {
            setOdjavaSvuda(true);
            await signOut('global');
            setOdjavaSvuda(false);
            router.dismissAll();
            router.replace('/');
          },
        },
      ],
    );
  };

  const provider = user?.app_metadata?.provider as string | undefined;
  const od = user?.created_at ? datum(new Date(user.created_at), { godina: true }) : null;

  // Brisanje je nepovratno i brise podatke o rodjenju koje je korisnik unosio
  // kroz ceo onboarding — jedan pogresan dodir ne sme da ih odnese.
  const obrisi = () => {
    Alert.alert(
      tn.obrisatiNaslov,
      tn.obrisatiTekst,
      [
        { text: tn.odustani, style: 'cancel' },
        {
          text: tn.obrisiNalog,
          style: 'destructive',
          onPress: async () => {
            setBrise(true);
            const { error } = await deleteAccount();
            setBrise(false);
            if (error) {
              Alert.alert(tn.nijeUspelo, tn.nijeObrisan);
              return;
            }
            router.dismissAll();
            router.replace('/');
          },
        },
      ],
    );
  };

  const otvori = (polje: PoljeOsobe) => router.push({ pathname: '/rodjenje-polje', params: { polje } });
  const t = profil?.time ?? null;
  // Email se menja samo kod prijave kodom — Apple i Google nalog ga nose sami.
  const menjaEmail = !provider || provider === 'email';

  return (
    <SheetScroll siva>
      <Text variant="naslovLista">{tn.naslov}</Text>

      {/* Ime prvo (Ivan, 29.9.2026), pa prijava; podaci o rodjenju ispod. */}
      <GroupHeader variant="oznaka" className={NASLOV}>{tn.imeIPrijava}</GroupHeader>
      <Group className="mx-0">
        {profil && <ListRow title={tn.ime} trailing={<VrednostReda>{profil.name}</VrednostReda>} onPress={() => otvori('ime')} />}
        <ListRow
          title={tn.email}
          trailing={<VrednostReda>{user?.email ?? '—'}</VrednostReda>}
          onPress={menjaEmail ? () => router.push('/email') : undefined}
        />
        {!!provider && <ListRow title={tn.nacinPrijave} trailing={<VrednostReda>{tn.nacin[provider] ?? provider}</VrednostReda>} />}
        {!!od && <ListRow title={tn.nalogOd} trailing={<VrednostReda>{od}</VrednostReda>} />}
      </Group>

      {profil && (
        <>
          <GroupHeader variant="oznaka" className={NASLOV}>{tn.podaciORodjenju}</GroupHeader>
          <Group className="mx-0">
            <ListRow title={tn.datumRodjenja} trailing={<VrednostReda>{datumRodjenja(profil.birth)}</VrednostReda>} onPress={() => otvori('datum')} />
            <ListRow
              title={tn.vremeRodjenja}
              trailing={<VrednostReda>{t ? `${dvo(t.hour)}:${dvo(t.minute)}` : tn.neZnam}</VrednostReda>}
              onPress={() => otvori('vreme')}
            />
            <ListRow title={tn.mestoRodjenja} trailing={<VrednostReda>{profil.cityName}</VrednostReda>} onPress={() => otvori('mesto')} />
          </Group>
          {!t && (
            <Text variant="caption" className="mt-2 px-1">
              {tn.bezVremena}
            </Text>
          )}
        </>
      )}

      <Group className="mx-0 mt-8">
        <ListRow
          title={tn.odjavaSvuda}
          chevron={false}
          onPress={odjavaSvuda ? undefined : odjaviSvuda}
          trailing={odjavaSvuda ? <ActivityIndicator color={neutral.inkSubtle} /> : undefined}
        />
      </Group>

      <Text variant="h3" className="mt-10">{tn.brisanjeNaslov}</Text>
      <Text variant="body" className="mt-2">
        {tn.brisanjeTekst}
      </Text>
      <Button variant="outline" className="mt-5" ucitava={brise} onPress={obrisi}>
        <Text className="text-destructive">{tn.obrisiNalog}</Text>
      </Button>
    </SheetScroll>
  );
}
