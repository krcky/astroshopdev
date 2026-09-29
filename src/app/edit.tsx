import * as React from 'react';
import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { RodjenjeForma, pocetniUnos, profilIzUnosa } from '@/components/rodjenje-forma';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { pushProfile } from '@/lib/sync';

/**
 * Izmena podataka o rodjenju — SVE na jednom ekranu, ne kroz cetiri koraka.
 * Onboarding vodi kroz korake jer korisnik tada ne zna sta ga ceka; kod izmene
 * zna tacno sta menja i hoce da stigne do toga u jednom dodiru. Polja su ista
 * kao kod unosa druge osobe (`components/rodjenje-forma.tsx`).
 */
export default function EditBirthData() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const user = useAuthStore((s) => s.user);
  const resolved = useResolvedProfile();

  const [unos, setUnos] = React.useState(() => pocetniUnos(profile));
  const [busy, setBusy] = React.useState(false);

  if (!profile || !resolved) return <Redirect href="/" />;

  const updated = profilIzUnosa(unos);

  const save = async () => {
    if (!updated || busy) return;
    setBusy(true);
    setProfile(updated);
    if (user) await pushProfile(user.id, updated);
    setBusy(false);
    router.back();
  };

  return (
    <Screen
      label="Podaci o rođenju"
      tabBarSpace={false}
      pushed
      keyboardShouldPersistTaps="handled">
      <RodjenjeForma unos={unos} onChange={setUnos} imePlaceholder="Tvoje ime" />

      <Button className="mt-8" size="lg" disabled={!updated} ucitava={busy} onPress={save}>
        <Text>Sačuvaj</Text>
      </Button>
    </Screen>
  );
}
