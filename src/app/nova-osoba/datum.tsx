import * as React from 'react';
import { Redirect, router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { useT } from '@/i18n';
import { useNovaOsoba } from '@/store/nova-osoba';

/** Nova osoba, korak 3: datum rodjenja — isti tockic kao u onboardingu. */
export default function NovaOsobaDatum() {
  const t = useT();
  const nacrt = useNovaOsoba();
  const [datum, setDatum] = React.useState(() =>
    nacrt.datum ? new Date(nacrt.datum.year, nacrt.datum.month - 1, nacrt.datum.day, 12) : new Date(2000, 0, 1, 12)
  );
  // Kao u onboardingu: "Nastavi" tek kad se tockic pomeri (pocetni 1. 1. 2000 nije odgovor).
  const [izabran, setIzabran] = React.useState(!!nacrt.datum);

  if (!nacrt.ime) return <Redirect href="/nova-osoba" />;

  const dalje = () => {
    nacrt.postavi({ datum: { year: datum.getFullYear(), month: datum.getMonth() + 1, day: datum.getDate() } });
    router.push('/nova-osoba/vreme');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={CalendarDays}
      title={t.profil.rodjenje.datum}
      note={t.profil.novaOsoba.napomena}
      primary={{ label: izabran ? t.opste.nastavi : t.profil.novaOsoba.izaberiDatum, onPress: dalje, disabled: !izabran }}>
      <WheelPicker mode="date" value={datum} onChange={(d) => { setDatum(d); setIzabran(true); }} maximumDate={new Date()} />
    </OnboardingStep>
  );
}
