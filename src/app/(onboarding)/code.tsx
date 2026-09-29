import * as React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageSquareMore, UserRoundCheck } from 'lucide-react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { OnboardingStep } from '@/components/onboarding-step';
import { useTurnstile } from '@/components/turnstile';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { pullProfile } from '@/lib/sync';
import { datumRodjenja } from '@/lib/horoscope';
import { adoptRemote, completeSignup, routeAfterSignup } from '@/lib/signup';
import { signOut } from '@/store/auth';
import type { Profile } from '@/store/profile';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

const LENGTH = 6;

export default function Code() {
  // `nov` = dolazi se iz "Napravi nalog" (reveal -> account), vidi `lib/signup.ts`.
  const { email, nov } = useLocalSearchParams<{ email: string; nov?: string }>();
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resentAt, setResentAt] = React.useState<number | null>(null);
  /** Kod je vec potvrdjen — ponovni pokusaj posle pada mreze ga ne trosi opet. */
  const [userId, setUserId] = React.useState<string | null>(null);
  /** "Napravi nalog", a pod ovim emailom vec stoji karta. */
  const [zauzet, setZauzet] = React.useState<Profile | null>(null);
  const captcha = useTurnstile();

  const verify = async () => {
    if (code.length !== LENGTH || busy) return;
    setBusy(true);
    setError(null);

    let id = userId;
    if (!id) {
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
      id = data.session.user.id;
      setUserId(id);
    }

    try {
      if (nov) {
        const postojeca = await pullProfile(id);
        if (postojeca) { setZauzet(postojeca); return; }
      }
      const outcome = await completeSignup(id, String(email));
      router.replace(routeAfterSignup(outcome));
    } catch {
      setError('Kod je potvrđen, ali nalog nije učitan. Proveri internet pa pritisni Potvrdi ponovo.');
    } finally {
      setBusy(false);
    }
  };

  // Odjava samo sa OVOG telefona: globalna bi vlasnika starog naloga izbacila i
  // sa drugih uredjaja. Draft ostaje, pa se na novi email nastavlja bez ponovnog unosa.
  const drugiEmail = async () => {
    await signOut('local');
    router.dismissTo({ pathname: '/account', params: { nov: '1', zauzet: String(email) } });
  };

  const udjiUPostojeci = () => {
    if (!zauzet) return;
    adoptRemote(zauzet);
    router.replace('/home');
  };

  const resend = async () => {
    setError(null);
    let captchaToken: string | undefined;
    try {
      captchaToken = await captcha.getToken();
    } catch {
      setError('Nismo uspeli da potvrdimo da nisi robot. Probaj ponovo.');
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: String(email),
      options: { captchaToken },
    });
    if (error) setError('Sačekaj minut pre nego što tražiš novi kod.');
    else setResentAt(Date.now());
  };

  if (zauzet) {
    return (
      <OnboardingStep
        exit={{ kind: 'back', onPress: drugiEmail }}
        icon={UserRoundCheck}
        title="Ovaj email već ima nalog"
        subtitle={
          <>
            Na nalogu <Text className={tezina('naslovUTekstu')}>{email}</Text> je karta za{' '}
            {datumRodjenja(zauzet.birth)}, {zauzet.cityName}. Za nov nalog unesi drugi email.
          </>
        }
        note="Ako uđeš u postojeći nalog, podaci iz prethodnih koraka se ne čuvaju."
        primary={{ label: 'Unesi drugi email', onPress: drugiEmail }}
        secondary={{ label: 'Uđi u taj nalog', onPress: udjiUPostojeci }}
      />
    );
  }

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={MessageSquareMore}
      title="Unesi kod"
      subtitle={
        <>
          Poslali smo šestocifreni kod na{'\n'}
          <Text className={tezina('naslovUTekstu')}>{email}</Text>.
        </>
      }
      center={false}
      note={null}
      primary={{
        label: busy ? 'Proveravam…' : 'Potvrdi',
        onPress: verify,
        disabled: code.length !== LENGTH || busy,
      }}>

      <View className="items-center">
        <PoljeZaKod
          value={code}
          onChange={(t) => { setCode(t); setError(null); }}
        />

        {error && <Text className="mt-4 px-2 text-center text-sm text-destructive">{error}</Text>}
        {resentAt && !error && (
          <Text variant="muted" className="mt-4 text-center text-sm">Novi kod je poslat.</Text>
        )}

        {/* Ispod polja, a ne ispod dugmeta: sa otvorenom tastaturom dno je samo
            glavno dugme, kao na referentnom ekranu. */}
        <Pressable
          onPress={resend}
          accessibilityRole="button"
          hitSlop={8}
          className="mt-6 py-2 active:opacity-60">
          <Text variant="label" className="text-foreground underline">Pošalji novi kod</Text>
        </Pressable>
      </View>

      {captcha.gate}

    </OnboardingStep>
  );
}

/* ------------------------------------------------------------------ */
/* POLJE ZA KOD                                                        */
/* ------------------------------------------------------------------ */

/*
 * Bela kapsula sa sest crtica (Ivan, 29.9.2026, po referentnoj prijavi): svaka
 * crtica je mesto za jednu cifru, a trepcuci kursor stoji tamo gde ide sledeca.
 *
 * Kucanje hvata PRAVO polje razvuceno preko cele kapsule, samo nevidljivo —
 * zato rade i dodir, nalepljivanje dugim pritiskom i predlog koda iznad
 * tastature (`oneTimeCode`: iOS ga cita iz Poste i Poruka). Kursor polja je
 * prikovan za kraj (`selection`): dodir u sredinu bi inace umetao cifre izmedju
 * vec unetih, a na ekranu bi stajale redom.
 */
function PoljeZaKod({ value, onChange }: { value: string; onChange: (kod: string) => void }) {
  const [fokus, setFokus] = React.useState(false);

  return (
    <View className="h-16 flex-row items-center justify-center gap-2.5 rounded-pill bg-card px-7">
      {Array.from({ length: LENGTH }, (_, i) => {
        const cifra = value[i];
        // Kursor stoji ISPRED mesta koje je na redu; kad su sva puna — iza poslednjeg.
        const kursor = fokus && (i === value.length || (value.length === LENGTH && i === LENGTH - 1));
        return (
          <View key={i} className="h-10 w-6 items-center justify-center">
            {cifra
              ? <Text variant="naslovLista">{cifra}</Text>
              : <View className="h-0.5 w-4 rounded-pill bg-subtle opacity-60" />}
            {kursor && (
              <View
                pointerEvents="none"
                style={[styles.kursorMesto, value.length === LENGTH ? { right: -2 } : { left: -2 }]}>
                <Kursor />
              </View>
            )}
          </View>
        );
      })}

      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, LENGTH))}
        onFocus={() => setFokus(true)}
        onBlur={() => setFokus(false)}
        selection={{ start: value.length, end: value.length }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={LENGTH}
        caretHidden
        selectionColor="transparent"
        accessibilityLabel="Šestocifreni kod"
        style={styles.skrivenoPolje}
      />
    </View>
  );
}

/** Trepce kao sistemski kursor: pola sekunde vidljiv, pola sekunde ne. */
function Kursor() {
  const vidljivost = useSharedValue(1);
  React.useEffect(() => {
    vidljivost.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withDelay(530, withTiming(0, { duration: 0 })),
        withDelay(530, withTiming(1, { duration: 0 })),
      ),
      -1,
    );
    return () => cancelAnimation(vidljivost);
  }, [vidljivost]);
  const stil = useAnimatedStyle(() => ({ opacity: vidljivost.value }));
  return <Animated.View style={[styles.kursor, stil]} />;
}

const styles = StyleSheet.create({
  kursorMesto: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  kursor: { width: 2, height: 30, borderRadius: 1, backgroundColor: neutral.ink },
  // Pravo polje preko cele kapsule, bez vidljivog teksta i kursora.
  skrivenoPolje: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'transparent', fontSize: 1 },
});
