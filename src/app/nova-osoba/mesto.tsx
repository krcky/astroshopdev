import * as React from 'react';
import { Redirect, router } from 'expo-router';
import { MapPin } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { PoljeMesto } from '@/components/polje-mesto';
import type { City } from '@/lib/cities';
import { NAPOMENA_PODACI } from '@/lib/osobe';
import { useNovaOsoba } from '@/store/nova-osoba';

/** Nova osoba, korak 5: mesto rodjenja — ista pretraga kao onboarding. */
export default function NovaOsobaMesto() {
  const nacrt = useNovaOsoba();
  const [grad, setGrad] = React.useState<City | null>(nacrt.grad);

  if (!nacrt.ime || !nacrt.datum) return <Redirect href="/nova-osoba" />;

  const dalje = () => {
    if (!grad) return;
    nacrt.postavi({ grad });
    router.push('/nova-osoba/pregled');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={MapPin}
      title="Mesto rođenja"
      center={false}
      // Kao u onboardingu: dok se bira, lista treba prostor iznad tastature.
      note={grad ? NAPOMENA_PODACI : null}
      pretapanje
      primary={{ label: 'Nastavi', onPress: dalje, disabled: !grad }}>
      <PoljeMesto grad={grad} onGrad={setGrad} povrsina="siva" autoFocus linija="border-fill-strong" broj={8} />
    </OnboardingStep>
  );
}
