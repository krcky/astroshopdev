import * as React from 'react';
import { Redirect, router } from 'expo-router';
import { Users } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { IzborOdnosa } from '@/components/izbor-odnosa';
import { useT } from '@/i18n';
import type { OdnosKljuc } from '@/lib/osobe';
import { useNovaOsoba } from '@/store/nova-osoba';

/**
 * Nova osoba, korak 2: ko ti je. Nije obavezno ("Preskoči") — sluzi kao oznaka
 * na listi i astrologu kao kontekst. Ime u naslovu je u nominativu ("Ko ti je
 * Ana?"), jer unetom imenu ne znamo padeze.
 */
export default function NovaOsobaOdnos() {
  const t = useT();
  const nacrt = useNovaOsoba();
  const [odnos, setOdnos] = React.useState<OdnosKljuc | null>(nacrt.odnos);

  // Nacrt je izgubljen (npr. ponovo ucitana aplikacija) — tok ide ispocetka.
  if (!nacrt.ime) return <Redirect href="/nova-osoba" />;

  const dalje = (o: OdnosKljuc | null) => {
    nacrt.postavi({ odnos: o });
    router.push('/nova-osoba/datum');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      skip={{ label: t.opste.preskoci, onPress: () => dalje(null) }}
      icon={Users}
      title={t.profil.rodjenje.koTiJe(nacrt.ime)}
      center={false}
      note={null}
      primary={{ label: t.opste.nastavi, onPress: () => dalje(odnos), disabled: !odnos }}>
      <IzborOdnosa izabran={odnos} onIzbor={setOdnos} />
    </OnboardingStep>
  );
}
