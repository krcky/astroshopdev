import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function Account() {
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [socialNote, setSocialNote] = React.useState(false);

  const valid = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.trim());

  const send = async () => {
    if (!valid || busy) return;
    if (!isSupabaseConfigured) { setError('Nalog još nije podešen.'); return; }

    setBusy(true);
    setError(null);
    // Isti poziv pravi nalog i prijavljuje postojeceg — nema odvojenog toka
    // za registraciju i prijavu, pa ne postoji ni "vec imas nalog" greska.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);

    if (error) {
      setError(
        /rate|limit|seconds/i.test(error.message)
          ? 'Previše pokušaja. Sačekaj minut pa probaj ponovo.'
          : 'Nismo uspeli da pošaljemo kod. Proveri email i internet.'
      );
      return;
    }
    router.push({ pathname: '/code', params: { email: email.trim().toLowerCase() } });
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      question="Koji ti je email?"
      note="Šaljemo ti kod za prijavu. Bez lozinke, bez reklama, i email ne delimo ni sa kim."
      primary={{ label: busy ? 'Šaljem…' : 'Pošalji mi kod', onPress: send, disabled: !valid || busy }}>

      <View className="items-center">
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          placeholder="email@primer.com"
          placeholderTextColor="#9A9A9A"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          autoFocus
          className="w-full border-b border-border pb-3 text-center text-2xl text-foreground"
        />

        {error && <Text className="mt-4 text-center text-sm text-destructive">{error}</Text>}

        <Text variant="muted" className="mt-14">Ili nastavi preko</Text>
        <View className="mt-4 flex-row gap-3">
          <SocialButton label="Apple" onPress={() => setSocialNote(true)} />
          <SocialButton label="Google" onPress={() => setSocialNote(true)} />
        </View>

        {socialNote && (
          <Text variant="muted" className="mt-4 px-6 text-center text-xs">
            Prijava preko Apple i Google naloga uključuje se u sledećoj verziji.
            Za sada koristi email — kod stiže odmah.
          </Text>
        )}
      </View>
    </OnboardingStep>
  );
}

function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Nastavi preko ${label} naloga`}
      className={cn(
        'h-14 w-28 items-center justify-center rounded-lg border border-border',
        'active:opacity-60'
      )}>
      <Text variant="label" className="text-foreground">{label}</Text>
    </Pressable>
  );
}
