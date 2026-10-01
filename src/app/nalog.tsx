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

/** Naslov sekcije kao na profilu — kao datum na pocetnoj (`oznaka` 12pt). */
const NASLOV = cn('ml-0', OZNAKA_12);
const dvo = (n: number) => String(n).padStart(2, '0');

/** Kako se korisnik prijavljuje — `app_metadata.provider` iz Supabase-a. */
const NACIN: Record<string, string> = {
  email: 'Kod na email',
  apple: 'Apple nalog',
  google: 'Google nalog',
};

/**
 * NALOG — list sa profila (Ivan, 29.9.2026): email (i njegova promena, `/email`),
 * PODACI O RODJENJU kao tabela — svaki red otvara list samo sa tim podatkom
 * (`/rodjenje-polje`, isto kao kod druge osobe) — i BRISANJE NALOGA, jedan korak
 * dalje od profila: Apple trazi da postoji u aplikaciji (5.1.1(v)), a Ivan da ne
 * stoji na dohvat palca. I dalje dva koraka — dugme pa potvrda.
 */
export default function NalogSheet() {
  const user = useAuthStore((s) => s.user);
  const profil = useProfileStore((s) => s.profile);
  const [brise, setBrise] = React.useState(false);
  const [odjavaSvuda, setOdjavaSvuda] = React.useState(false);

  // Odjava sa SVIH uredjaja (Ivan, 30.9.2026) — obicno "Odjavi se" na profilu odjavljuje
  // samo ovaj telefon. Potvrda, jer izbacuje i telefon, tablet i sve ostalo.
  const odjaviSvuda = () => {
    Alert.alert(
      'Odjaviti se sa svih uređaja?',
      'Bićeš odjavljen i na ovom telefonu i na svakom drugom uređaju na kom si prijavljen.',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Odjavi se svuda',
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
      'Obrisati nalog?',
      'Briše se nalog, ime, slika i svi podaci o rođenju. Ovo se ne može poništiti.\n\n' +
        'Pretplata se ovim NE otkazuje — nju otkazuješ u podešavanjima Apple ili Google naloga.',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši nalog',
          style: 'destructive',
          onPress: async () => {
            setBrise(true);
            const { error } = await deleteAccount();
            setBrise(false);
            if (error) {
              Alert.alert('Nije uspelo', 'Nalog nije obrisan. Proveri internet pa probaj ponovo.');
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
      <Text variant="naslovLista">Nalog</Text>

      {/* Ime prvo (Ivan, 29.9.2026), pa prijava; podaci o rodjenju ispod. */}
      <GroupHeader variant="oznaka" className={NASLOV}>Ime i prijava</GroupHeader>
      <Group className="mx-0">
        {profil && <ListRow title="Ime" trailing={<VrednostReda>{profil.name}</VrednostReda>} onPress={() => otvori('ime')} />}
        <ListRow
          title="Email"
          trailing={<VrednostReda>{user?.email ?? '—'}</VrednostReda>}
          onPress={menjaEmail ? () => router.push('/email') : undefined}
        />
        {!!provider && <ListRow title="Način prijave" trailing={<VrednostReda>{NACIN[provider] ?? provider}</VrednostReda>} />}
        {!!od && <ListRow title="Nalog od" trailing={<VrednostReda>{od}</VrednostReda>} />}
      </Group>

      {profil && (
        <>
          <GroupHeader variant="oznaka" className={NASLOV}>Podaci o rođenju</GroupHeader>
          <Group className="mx-0">
            <ListRow title="Datum rođenja" trailing={<VrednostReda>{datumRodjenja(profil.birth)}</VrednostReda>} onPress={() => otvori('datum')} />
            <ListRow
              title="Vreme rođenja"
              trailing={<VrednostReda>{t ? `${dvo(t.hour)}:${dvo(t.minute)}` : 'Ne znam'}</VrednostReda>}
              onPress={() => otvori('vreme')}
            />
            <ListRow title="Mesto rođenja" trailing={<VrednostReda>{profil.cityName}</VrednostReda>} onPress={() => otvori('mesto')} />
          </Group>
          {!t && (
            <Text variant="caption" className="mt-2 px-1">
              Bez vremena rođenja podznak i kuće nisu pouzdani. Dodirni „Vreme rođenja“ da ga dodaš.
            </Text>
          )}
        </>
      )}

      <Group className="mx-0 mt-8">
        <ListRow
          title="Odjavi se sa svih uređaja"
          chevron={false}
          onPress={odjavaSvuda ? undefined : odjaviSvuda}
          trailing={odjavaSvuda ? <ActivityIndicator color={neutral.inkSubtle} /> : undefined}
        />
      </Group>

      <Text variant="h3" className="mt-10">Brisanje naloga</Text>
      <Text variant="body" className="mt-2">
        Trajno briše nalog, podatke o rođenju, sliku i pitanja astrologu. Pretplata se ne otkazuje sama.
      </Text>
      <Button variant="outline" className="mt-5" ucitava={brise} onPress={obrisi}>
        <Text className="text-destructive">Obriši nalog</Text>
      </Button>
    </SheetScroll>
  );
}
