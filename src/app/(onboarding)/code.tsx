import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageSquareMore, UserRoundCheck } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { DUZINA_KODA, PoljeZaKod } from '@/components/polje-za-kod';
import { useTurnstile } from '@/components/turnstile';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { pullProfile } from '@/lib/sync';
import { datumRodjenja } from '@/lib/horoscope';
import { adoptRemote, completeSignup, routeAfterSignup, type SignupOutcome } from '@/lib/signup';
import { signOut } from '@/store/auth';
import type { Profile } from '@/store/profile';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/** Duzina koda — spregnuta sa Supabase-om (pravilo 15), `components/polje-za-kod.tsx`. */
const LENGTH = DUZINA_KODA;
/** Ponavljanje koraka posle potvrdjenog koda (vidi `verify`): 3 pokusaja, pauza 0,8 pa 1,6 s. */
const POKUSAJA = 3;
const PAUZA_MS = 800;

export default function Code() {
  // `nov` = dolazi se iz "Napravi nalog" (reveal -> account), vidi `lib/signup.ts`.
  const { email, nov } = useLocalSearchParams<{ email: string; nov?: string }>();
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resentAt, setResentAt] = React.useState<number | null>(null);
  /** Novi kod se trazi (captcha + mreza): spiner umesto veze, drugi dodir ne salje dvaput. */
  const [saljemNovi, setSaljemNovi] = React.useState(false);
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
        // Supabase ISTOM greskom javlja i pogresan i istekao kod ("Token has expired or
        // is invalid", `otp_expired`) — pa ne tvrdimo da je istekao (Ivan, 30.9.2026: "nije,
        // samo sto je stigao"). Najcesce je upisan kod iz STARIJEG mejla: svaki nov kod
        // ponistava prethodni.
        if (__DEV__) console.log('[kod] provera odbijena:', error?.code, error?.message);
        setError('Kod nije tačan ili više ne važi. Upiši kod iz najnovijeg mejla ili pošalji novi.');
        return;
      }
      id = data.session.user.id;
      setUserId(id);
    }

    // PRVI UPIT POSLE KODA ume da padne iako je sve u redu (Ivan, 30.9.2026: "prvi put
    // nece pa posle hoce", na telefonu i u simulatoru). IZMERENO: `PGRST303 JWT issued
    // at future` — sat Supabase Auth-a je malo ispred baze, pa token izdat tog trenutka
    // baza odbije sekund-dva. Zato se korak ponovi sam, do POKUSAJA puta, pre nego
    // sto korisnik vidi gresku. Navigacija je VAN ovoga: njena greska nije "internet".
    const idNaloga = id;
    const posleKoda = async (): Promise<SignupOutcome | 'zauzet'> => {
      if (nov) {
        const postojeca = await pullProfile(idNaloga);
        if (postojeca) { setZauzet(postojeca); return 'zauzet'; }
      }
      return completeSignup(idNaloga, String(email));
    };
    let ishod: SignupOutcome | 'zauzet' | null = null;
    for (let i = 0; i < POKUSAJA && ishod === null; i++) {
      try {
        ishod = await posleKoda();
      } catch (e) {
        if (__DEV__) console.log(`[kod] posle potvrde pao pokusaj ${i + 1}/${POKUSAJA}:`, (e as { code?: string })?.code, (e as Error)?.message);
        if (i < POKUSAJA - 1) await new Promise((r) => setTimeout(r, PAUZA_MS * (i + 1)));
      }
    }
    setBusy(false);
    if (ishod === null) {
      setError('Kod je potvrđen, ali nalog nije učitan. Proveri internet pa pritisni Potvrdi ponovo.');
      return;
    }
    if (ishod !== 'zauzet') router.replace(routeAfterSignup(ishod));
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
    if (saljemNovi) return;
    setError(null);
    setSaljemNovi(true);
    try {
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
    } finally {
      setSaljemNovi(false);
    }
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
        label: 'Potvrdi',
        onPress: verify,
        disabled: code.length !== LENGTH,
        ucitava: busy,
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
          disabled={saljemNovi}
          accessibilityRole="button"
          accessibilityLabel="Pošalji novi kod"
          accessibilityState={{ disabled: saljemNovi, busy: saljemNovi }}
          hitSlop={8}
          className="mt-6 py-2 active:opacity-60">
          {saljemNovi
            ? <ActivityIndicator color={neutral.ink} />
            : <Text variant="label" className="text-foreground underline">Pošalji novi kod</Text>}
        </Pressable>
      </View>

      {captcha.gate}

    </OnboardingStep>
  );
}
