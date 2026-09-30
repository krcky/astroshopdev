import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetScroll } from '@/components/sheet';
import { DUZINA_KODA, PoljeZaKod } from '@/components/polje-za-kod';
import { supabase } from '@/lib/supabase';
import { useNaMrezi } from '@/lib/mreza';
import { useAuthStore } from '@/store/auth';

type Korak = 'adresa' | 'kod' | 'stari';

/**
 * PROMENA EMAILA — list sa "Nalog" (Ivan, 29.9.2026). Nova adresa -> kod sa mejla
 * na NOVU adresu -> potvrda (`verifyOtp`, `type: 'email_change'`). Isti sestocifreni
 * kod kao prijava (`PoljeZaKod`, pravilo 15).
 *
 * SUPABASE (Authentication -> Emails): sablon "Change Email Address" mora da nosi
 * `{{ .Token }}` — inace stize samo link, a aplikacija trazi kod. Ako je ukljucen
 * "Secure email change", kod stize na OBE adrese i trazi se i onaj sa stare
 * (korak `stari`); posle prve potvrde `getUser()` jos pokazuje staru adresu.
 */
export default function PromenaEmaila() {
  const user = useAuthStore((s) => s.user);
  const naMrezi = useNaMrezi();
  const stari = user?.email ?? '';
  const [korak, setKorak] = React.useState<Korak>('adresa');
  const [novi, setNovi] = React.useState('');
  const [kod, setKod] = React.useState('');
  const [radi, setRadi] = React.useState(false);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  const adresa = novi.trim().toLowerCase();
  const ispravna = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adresa) && adresa !== stari.toLowerCase();

  const posalji = async () => {
    if (!ispravna || radi) return;
    setRadi(true);
    setPoruka(null);
    const { error } = await supabase.auth.updateUser({ email: adresa });
    setRadi(false);
    if (error) { setPoruka(porukaEmaila(error.message)); return; }
    setKod('');
    setKorak('kod');
  };

  const potvrdi = async (unet: string) => {
    if (unet.length !== DUZINA_KODA || radi) return;
    setRadi(true);
    setPoruka(null);
    const { error } = await supabase.auth.verifyOtp({
      email: korak === 'stari' ? stari : adresa,
      token: unet,
      type: 'email_change',
    });
    if (error) { setRadi(false); setPoruka(porukaEmaila(error.message)); return; }
    // Da li je promena gotova — ili ceka i potvrdu sa stare adrese ("Secure email change").
    const { data } = await supabase.auth.getUser();
    setRadi(false);
    if (data.user?.email?.toLowerCase() === adresa) {
      router.back();
      return;
    }
    setKod('');
    setKorak('stari');
  };

  const menjajKod = (k: string) => {
    setKod(k);
    if (k.length === DUZINA_KODA) potvrdi(k);
  };

  return (
    <SheetScroll siva keyboardShouldPersistTaps="handled">
      <Text variant="naslovLista">Promena emaila</Text>

      {korak === 'adresa' ? (
        <>
          <Text variant="body" className="mt-2">
            Sadašnja adresa je {stari}. Na novu šaljemo kod, pa se prijavljuješ njome.
          </Text>
          <View className="mt-6">
          <Input
            povrsina="siva"
            value={novi}
            onChangeText={setNovi}
            placeholder="Nova email adresa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={posalji}
            autoFocus
          />
          </View>
        </>
      ) : (
        <>
          <Text variant="body" className="mt-2">
            {korak === 'kod'
              ? `Upiši kod koji smo poslali na ${adresa}.`
              : `Još jedan korak: upiši kod koji smo poslali na staru adresu, ${stari}.`}
          </Text>
          <View className="mt-6">
            <PoljeZaKod key={korak} value={kod} onChange={menjajKod} />
          </View>
        </>
      )}

      {!!poruka && <Text variant="note" className="mt-5 text-foreground">{poruka}</Text>}
      {!naMrezi && !poruka && <Text variant="note" className="mt-5">Za promenu emaila potreban je internet.</Text>}

      {korak === 'adresa' ? (
        <Button className="mt-6" disabled={!ispravna || !naMrezi} ucitava={radi} onPress={posalji}>
          <Text>Pošalji kod</Text>
        </Button>
      ) : (
        <>
          <Button className="mt-6" disabled={kod.length !== DUZINA_KODA || !naMrezi} ucitava={radi} onPress={() => potvrdi(kod)}>
            <Text>Potvrdi</Text>
          </Button>
          {korak === 'kod' && (
            <Pressable onPress={() => { setKorak('adresa'); setPoruka(null); }} accessibilityRole="button"
              className="mt-4 items-center py-2 active:opacity-60">
              <Text variant="label" className="text-foreground underline">Promeni adresu ili pošalji kod ponovo</Text>
            </Pressable>
          )}
        </>
      )}
    </SheetScroll>
  );
}

/** Greska Supabase-a -> recenica: sta se desilo, pa sta moze (copywriter-sr). */
function porukaEmaila(m: string): string {
  if (/already|registered|exists/i.test(m)) return 'Ova adresa već ima nalog. Upiši drugu.';
  if (/rate|security purposes|seconds|too many/i.test(m)) return 'Kod je upravo poslat. Sačekaj minut pa probaj ponovo.';
  if (/invalid|expired|token/i.test(m)) return 'Kod nije tačan ili je istekao. Proveri ga, ili zatraži nov.';
  if (/fetch|network|timed? ?out/i.test(m)) return 'Nema veze sa serverom. Probaj kad se internet vrati.';
  const razvoj = __DEV__ ? ` (${m})` : '';
  return `Promena nije uspela. Probaj ponovo za minut.${razvoj}`;
}
