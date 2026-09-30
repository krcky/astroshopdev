import * as React from 'react';
import { router } from 'expo-router';
import { UserRound } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { Input } from '@/components/ui/input';
import { useNovaOsoba } from '@/store/nova-osoba';

/**
 * Nova osoba, korak 1: ime. Tok je kao onboarding (Ivan, 29.9.2026) — jedno
 * pitanje po ekranu, isti okvir (`OnboardingStep`); na server ide tek u pregledu.
 * X zatvara ceo tok.
 */
export default function NovaOsobaIme() {
  const nacrt = useNovaOsoba();
  const [ime, setIme] = React.useState(nacrt.ime);
  const valid = ime.trim().length > 0 && ime.trim().length <= 60;

  const dalje = () => {
    if (!valid) return;
    nacrt.postavi({ ime: ime.trim() });
    router.push('/nova-osoba/odnos');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'cancel', onPress: () => router.back() }}
      icon={UserRound}
      title="Kako se zove?"
      subtitle="Ime ili nadimak — vidiš ga samo ti."
      center={false}
      note={null}
      primary={{ label: 'Nastavi', onPress: dalje, disabled: !valid }}>
      <Input
        povrsina="siva"
        value={ime}
        onChangeText={setIme}
        placeholder="Ime ili nadimak"
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={dalje}
        autoFocus
        maxLength={60}
      />
    </OnboardingStep>
  );
}
