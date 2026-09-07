import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { completeSignup, routeAfterSignup } from '@/lib/signup';

const LENGTH = 6;

export default function Code() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resentAt, setResentAt] = React.useState<number | null>(null);

  const verify = async () => {
    if (code.length !== LENGTH || busy) return;
    setBusy(true);
    setError(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email: String(email),
      token: code,
      type: 'email',
    });

    if (error || !data.session) {
      setBusy(false);
      setError(/expired/i.test(error?.message ?? '')
        ? 'Kod je istekao. Pošalji novi.'
        : 'Kod nije tačan. Proveri poštu još jednom.');
      return;
    }

    const outcome = await completeSignup(data.session.user.id, String(email));
    setBusy(false);
    router.replace(routeAfterSignup(outcome));
  };

  const resend = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: String(email) });
    if (error) setError('Sačekaj minut pre nego što tražiš novi kod.');
    else setResentAt(Date.now());
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      question="Unesi kod"
      note={`Poslali smo šestocifreni kod na ${email}. Stiže za nekoliko sekundi.`}
      primary={{
        label: busy ? 'Proveravam…' : 'Potvrdi',
        onPress: verify,
        disabled: code.length !== LENGTH || busy,
      }}
      secondary={{ label: 'Pošalji novi kod', onPress: resend }}>

      <View className="items-center">
        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t.replace(/\D/g, '').slice(0, LENGTH)); setError(null); }}
          placeholder="000000"
          placeholderTextColor="#C8C8C8"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          autoFocus
          maxLength={LENGTH}
          className="w-64 border-b border-border pb-3 text-center text-4xl tracking-[10px] text-foreground"
        />
        {error && <Text className="mt-5 text-center text-sm text-destructive">{error}</Text>}
        {resentAt && !error && (
          <Text variant="muted" className="mt-5 text-center text-sm">Novi kod je poslat.</Text>
        )}
      </View>
    </OnboardingStep>
  );
}

