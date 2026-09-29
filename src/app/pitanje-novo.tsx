import * as React from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { AstrologSlika } from '@/components/astrolog-slika';
import { BezInterneta } from '@/components/bez-interneta';
import { PitajUvod } from '@/components/pitaj-uvod';
import {
  ASTROLOG, OKVIRNI_ROK, PITANJE_MAX, pitanjeSpremno, porukaGreske, snimakKarte,
} from '@/lib/pitanja';
import { posaljiKreditom, sacuvajNacrt, useKrediti, useMojaPitanja, useOsveziPitanja } from '@/lib/pitanja-api';
import { obrisiLokalno, procitajLokalno, upisiLokalno } from '@/lib/pitanje-lokalno';
import { kupiPitanje, useCenaPitanja, type IshodKupovine } from '@/lib/kupovina';
import { useNaMrezi } from '@/lib/mreza';
import { useAuthStore, useEntitlement } from '@/store/auth';
import { useResolvedProfile } from '@/store/profile';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/** Poruka posle kupovine koja nije zavrsena. Pitanje je u svakom slucaju sacuvano. */
const POSLE_KUPOVINE: Record<Exclude<IshodKupovine, 'placeno'>, string> = {
  odustao: 'Pitanje je sačuvano. Možeš da ga pošalješ kasnije.',
  ceka: `Plaćanje čeka odobrenje. Pitanje stiže ${ASTROLOG.dativ} čim se potvrdi.`,
  greska: 'Plaćanje nije završeno. Pitanje je sačuvano — pokušaj ponovo.',
  nedostupno: 'Plaćanje u aplikaciji još nije uključeno. Pitanje je sačuvano i čeka ovde.',
};

/**
 * Pisanje pitanja astrologu — list odozdo preko celog ekrana (`presentation:
 * 'modal'`, na iOS-u pageSheet), uredjen kao pismo, ne kao formular.
 *
 * ZASTO NE formSheet kao tumacenja: formSheet sadrzaju ne daje visinu (vidi
 * `SheetScroll`), a ovde polje mora da zauzme prostor, a dugme da stoji iznad
 * tastature. pageSheet daje punu visinu i zatvara se istim povlacenjem nadole.
 *
 * Redosled (specifikacija, 29.9.2026): pitanje se PRVO sacuva na serveru kao
 * nacrt (sa snimkom karte), pa tek onda ide placanje. Odustane li korisnik,
 * nacrt ostaje. Dok kuca, tekst se cuva i na telefonu (`pitanje-lokalno.ts`),
 * da ga slucajno povucen list ne obrise.
 *
 * `?korak=uvod` (Ivan, 29.9.2026): kad korisnik vec ima pitanja, na strani je samo
 * "Postavi pitanje" — uvod (astrolog, uslovi, cena) je tada prvi korak lista, a
 * polje dolazi na "Napiši pitanje". Bez pitanja je uvod na strani, pa list
 * otvara odmah polje.
 */
export default function PitanjeNovo() {
  const { korak: pocetniKorak } = useLocalSearchParams<{ korak?: string }>();
  const [korak, setKorak] = React.useState<'uvod' | 'pisanje'>(pocetniKorak === 'uvod' ? 'uvod' : 'pisanje');
  const uid = useAuthStore((s) => s.user?.id);
  const resolved = useResolvedProfile();
  const premium = !!useEntitlement()?.active;
  const cena = useCenaPitanja(premium);
  const pitanja = useMojaPitanja();
  const krediti = useKrediti().data ?? 0;
  const osvezi = useOsveziPitanja();
  const naMrezi = useNaMrezi();
  const insets = useSafeAreaInsets();

  const [tekst, setTekst] = React.useState('');
  const [ucitano, setUcitano] = React.useState(false);
  const [saljem, setSaljem] = React.useState(false);
  const [poslato, setPoslato] = React.useState(false);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  // Pocetni tekst: ono sto je kucano na telefonu, a ako toga nema, nacrt sa servera.
  // Ceka odgovor servera (ili gresku), da nacrt ne stigne posle praznog polja.
  const nacrt = pitanja.data?.find((p) => p.status === 'draft')?.tekst ?? null;
  const serverGotov = pitanja.isFetched || pitanja.isError || !uid;
  React.useEffect(() => {
    if (ucitano || !serverGotov) return;
    let otkazano = false;
    (uid ? procitajLokalno(uid) : Promise.resolve(null)).then((lokalno) => {
      if (otkazano) return;
      setTekst(lokalno ?? nacrt ?? '');
      setUcitano(true);
    });
    return () => { otkazano = true; };
  }, [ucitano, serverGotov, uid, nacrt]);

  // Cuvanje na telefonu dok se kuca — pola sekunde posle poslednjeg slova.
  React.useEffect(() => {
    if (!ucitano || !uid || poslato) return;
    const t = setTimeout(() => upisiLokalno(uid, tekst), 500);
    return () => clearTimeout(t);
  }, [tekst, ucitano, uid, poslato]);

  // Dugme i napomena stoje iznad tastature. Bez tastature: iznad home indikatora.
  const tastatura = useAnimatedKeyboard();
  const dno = insets.bottom + 12;
  const dnoStil = useAnimatedStyle(() => ({
    paddingBottom: Math.max(tastatura.height.value + 12, dno),
  }));

  const kreditom = krediti > 0;
  const spremno = pitanjeSpremno(tekst) && naMrezi && !saljem && !!uid;

  const zavrsi = async () => {
    await obrisiLokalno();
    setPoslato(true);
    setSaljem(false);
    osvezi();
  };

  const posalji = async () => {
    if (!spremno) return;
    setSaljem(true);
    setPoruka(null);
    try {
      const id = await sacuvajNacrt(tekst.trim(), resolved ? snimakKarte(resolved) : null);
      if (kreditom) {
        await posaljiKreditom(id);
        await zavrsi();
        return;
      }
      const ishod = await kupiPitanje(id, premium);
      if (ishod === 'placeno') { await zavrsi(); return; }
      setPoruka(POSLE_KUPOVINE[ishod]);
      osvezi();
    } catch (e) {
      setPoruka(porukaGreske((e as Error)?.message));
    }
    setSaljem(false);
  };

  if (poslato) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8" style={{ paddingBottom: dno }}>
        <AstrologSlika velicina={88} />
        <Text variant="h1" className="mt-6 text-center">Pitanje je poslato.</Text>
        <Text variant="body" className="mt-2 text-center">
          {ASTROLOG.kratko} odgovara {OKVIRNI_ROK}. Odgovor će se pojaviti u „Mojim pitanjima".
        </Text>
        <Button className="mt-8 self-stretch" onPress={() => router.back()}>
          <Text>Zatvori</Text>
        </Button>
      </View>
    );
  }

  if (korak === 'uvod') {
    return (
      <View className="flex-1 bg-background">
        <Rucica />
        <ScrollView className="flex-1" contentContainerClassName="px-6 pb-4 pt-6" showsVerticalScrollIndicator={false}>
          <PitajUvod naBelom />
        </ScrollView>
        <View className="px-6 pt-3" style={{ paddingBottom: dno }}>
          <Button istaknuto onPress={() => setKorak('pisanje')}>
            <Text>Napiši pitanje</Text>
          </Button>
        </View>
      </View>
    );
  }

  const napomena = !naMrezi
    ? 'Za slanje pitanja potreban je internet.'
    : kreditom
      ? 'Ovo pitanje je već plaćeno. Posle slanja ne može da se menja.'
      : `${cena ? `${cena} · jednokratno plaćanje. ` : ''}Posle plaćanja pitanje ne može da se menja.`;

  return (
    <View className="flex-1 bg-background">
      <Rucica />

      <View className="flex-row items-center gap-3 px-6 pt-5">
        <AstrologSlika velicina={44} />
        <View className="flex-1">
          <Text variant="h3">Pitanje za {ASTROLOG.genitiv}</Text>
          <Text variant="caption">
            {ASTROLOG.kratko} vidi tvoju kartu, pa ne moraš da pišeš datum ni mesto rođenja.
          </Text>
        </View>
      </View>

      <BezInterneta className="mx-6 mt-4" />

      <TextInput
        value={tekst}
        onChangeText={setTekst}
        editable={ucitano}
        multiline
        autoFocus
        maxLength={PITANJE_MAX}
        textAlignVertical="top"
        placeholder="Npr. Razmišljam da promenim posao ove jeseni. Šta moja karta kaže o tom periodu?"
        placeholderTextColor={neutral.inkSubtle}
        accessibilityLabel="Tvoje pitanje"
        // Bez okvira i bez sive podloge — polje je papir, kursor je jedini znak.
        className="mt-5 flex-1 px-6 font-sans text-row leading-[26px] text-foreground"
        style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : undefined}
      />

      {/* Animirani omotac nosi SAMO razmak za tastaturu — NativeWind klase na
          Reanimated-ovom `Animated.View` ne stizu (izmereno na vebu). */}
      <Animated.View style={dnoStil}>
        <View className="gap-3 px-6 pt-3">
          {/* Crveno kad je tekst duzi od granice (npr. nacrt iz vremena kad je bila 1000). */}
          <Text variant="caption" className={cn('text-right', tekst.length > PITANJE_MAX && 'text-destructive')}>
            {tekst.length} / {PITANJE_MAX}
          </Text>
          {poruka ? (
            <Text variant="note" className="text-foreground">{poruka}</Text>
          ) : (
            <Text variant="note">{napomena}</Text>
          )}
          {/* Ugaseno SIVO: belo dugme na belom listu je izgledalo kao sam natpis (Ivan). */}
          <Button istaknuto ugasenoSivo onPress={posalji} disabled={!spremno}>
            <Text>{saljem ? 'Šaljem…' : kreditom ? 'Pošalji pitanje' : 'Nastavi na plaćanje'}</Text>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

/** Ručica: pageSheet je nema sam, a zatvara se istim povlačenjem kao ostali listovi. */
function Rucica() {
  return (
    <View className="items-center pt-2" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="h-1 w-9 rounded-pill bg-subtle opacity-60" />
    </View>
  );
}
