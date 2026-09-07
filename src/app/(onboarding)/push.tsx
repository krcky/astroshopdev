import * as React from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { CelestialOrb } from '@/components/celestial-orb';

export default function Push() {
  const [busy, setBusy] = React.useState(false);

  const done = () => router.replace('/');

  const ask = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Sistemski upit se moze prikazati SAMO JEDNOM. Zato ga tražimo ovde,
      // posle objasnjenja zasto — a ne pri prvom pokretanju, gde bi vecina
      // odbila iz refleksa i vise se ne bi mogla pitati.
      const current = await Notifications.getPermissionsAsync();
      if (current.status === 'undetermined') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // Na vebu i u nekim okruzenjima ovo ne postoji — nije razlog da tok stane.
    }
    setBusy(false);
    done();
  };

  return (
    <OnboardingStep
      question="Da te podsetimo?"
      note={Platform.OS === 'web'
        ? 'Notifikacije rade na telefonu; na vebu ovaj korak preskačemo.'
        : 'Jedna poruka ujutru, sa horoskopom za taj dan. Ništa drugo ti nećemo slati.'}
      primary={{ label: busy ? 'Trenutak…' : 'Uključi podsetnik', onPress: ask, disabled: busy }}
      secondary={{ label: 'Ne, hvala', onPress: done }}>

      <View className="items-center">
        <CelestialOrb size={150} seed={29} />
        <Text variant="display" className="mt-10 text-center text-3xl">
          Horoskop te čeka{'\n'}svakog jutra
        </Text>
        <Text variant="muted" className="mt-4 px-6 text-center">
          Nebo se menja svakog dana. Podsetnik ti javi šta je novo za tvoju kartu.
        </Text>
      </View>
    </OnboardingStep>
  );
}
