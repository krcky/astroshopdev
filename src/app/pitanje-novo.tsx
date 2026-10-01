import * as React from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GlassIconButton } from '@/components/ui/glass-button';
import { VRH_ANDROID } from '@/components/screen';
import { AstrologSlika } from '@/components/astrolog-slika';
import { BezInterneta } from '@/components/bez-interneta';
import { PitajUvod } from '@/components/pitaj-uvod';
import { KapsuleRed } from '@/components/ui/kapsule';
import { useT } from '@/i18n';
import { Kvacica } from '@/components/ui/kvacica';
import {
  ASTROLOG, PITANJE_MAX, pitanjeSpremno, porukaGreske, snimakKarte, snimakODrugoj,
} from '@/lib/pitanja';
import { useKarta, useOsobe, useOtvoreneOsobe } from '@/lib/osobe-api';
import { posaljiKreditom, sacuvajNacrt, useKrediti, useMojaPitanja, useOsveziPitanja } from '@/lib/pitanja-api';
import { obrisiLokalno, procitajLokalno, upisiLokalno } from '@/lib/pitanje-lokalno';
import { kupiPitanje, useCenaPitanja, type IshodKupovine } from '@/lib/kupovina';
import { useNaMrezi } from '@/lib/mreza';
import { useAuthStore, useEntitlement } from '@/store/auth';
import { useResolvedProfile } from '@/store/profile';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/** Izbor "Ja" u redu "O kome je pitanje". */
const JA = 'ja';

/** Poruka posle kupovine koja nije zavrsena. Pitanje je u svakom slucaju sacuvano. */
function posleKupovine(ishod: Exclude<IshodKupovine, 'placeno'>, t: ReturnType<typeof useT>): string {
  const p = t.pitaj.novo.posleKupovine;
  return ishod === 'ceka' ? p.ceka(ASTROLOG.dativ) : p[ishod];
}

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
  const t = useT();
  const tn = t.pitaj.novo;
  // `osoba`: otvoreno sa strane osobe (29.9.2026) — pitanje je o njoj.
  // `tema`: otvoreno sa lista tranzita ("Pitaj astrologa o ovom tranzitu", 1.10.2026) — ime
  // tranzita je pocetak teksta, ali samo kad nema necega vec kucanog ni nacrta.
  const { korak: pocetniKorak, osoba: pocetnaOsoba, tema } = useLocalSearchParams<{ korak?: string; osoba?: string; tema?: string }>();
  const [korak, setKorak] = React.useState<'uvod' | 'pisanje'>(pocetniKorak === 'uvod' ? 'uvod' : 'pisanje');
  const uid = useAuthStore((s) => s.user?.id);
  const resolved = useResolvedProfile();

  // O KOME JE PITANJE (29.9.2026): o sebi, o drugoj osobi, ili o vama dvoma.
  // Nude se samo otvorene osobe (`otvoreneOsobe`) — zakljucane su zakljucane svuda.
  const sveOsobe = useOsobe();
  const otvorene = useOtvoreneOsobe();
  const izbor = React.useMemo(() => sveOsobe.filter((o) => otvorene.has(o.id)), [sveOsobe, otvorene]);
  const [osobaId, setOsobaId] = React.useState<string | null>(
    pocetnaOsoba && otvorene.has(pocetnaOsoba) ? pocetnaOsoba : null
  );
  const [oOdnosu, setOOdnosu] = React.useState(false);
  const osoba = izbor.find((o) => o.id === osobaId) ?? null;
  const kartaOsobe = useKarta(osoba?.id ?? null);
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
  const nacrtRed = pitanja.data?.find((p) => p.status === 'draft') ?? null;
  const nacrt = nacrtRed?.tekst ?? null;
  const serverGotov = pitanja.isFetched || pitanja.isError || !uid;
  React.useEffect(() => {
    if (ucitano || !serverGotov) return;
    let otkazano = false;
    (uid ? procitajLokalno(uid) : Promise.resolve(null)).then((lokalno) => {
      if (otkazano) return;
      setTekst(lokalno ?? nacrt ?? (tema ? `${tema}: ` : ''));
      // Nacrt o drugoj osobi vraca i izbor — osim kad je list otvoren sa strane osobe.
      if (!pocetnaOsoba && nacrtRed?.osoba_id && otvorene.has(nacrtRed.osoba_id)) {
        setOsobaId(nacrtRed.osoba_id);
        setOOdnosu(!!nacrtRed.karta_par);
      }
      setUcitano(true);
    });
    return () => { otkazano = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ucitano, serverGotov, uid, nacrt]);

  // Cuvanje na telefonu dok se kuca — pola sekunde posle poslednjeg slova.
  React.useEffect(() => {
    if (!ucitano || !uid || poslato) return;
    const tajmer = setTimeout(() => upisiLokalno(uid, tekst), 500);
    return () => clearTimeout(tajmer);
  }, [tekst, ucitano, uid, poslato]);

  // Dugme i napomena stoje iznad tastature. Bez tastature: iznad home indikatora.
  const tastatura = useAnimatedKeyboard();
  const dno = insets.bottom + 12;
  const dnoStil = useAnimatedStyle(() => ({
    paddingBottom: Math.max(tastatura.height.value + 12, dno),
  }));

  const kreditom = krediti > 0;
  // Pitanje o drugoj osobi ide samo sa njenom kartom (bez karte astrolog ne zna o kome je).
  const spremno = pitanjeSpremno(tekst) && naMrezi && !saljem && !!uid && (!osoba || !!kartaOsobe);

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
      const karta = osoba && kartaOsobe && resolved
        ? snimakODrugoj(kartaOsobe, osoba.odnos, resolved, oOdnosu)
        : resolved ? snimakKarte(resolved) : null;
      const id = await sacuvajNacrt(tekst.trim(), karta, osoba?.id ?? null);
      if (kreditom) {
        await posaljiKreditom(id);
        await zavrsi();
        return;
      }
      const ishod = await kupiPitanje(id, premium);
      if (ishod === 'placeno') { await zavrsi(); return; }
      setPoruka(posleKupovine(ishod, t));
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
        <Text variant="h1" className="mt-6 text-center">{tn.poslatoNaslov}</Text>
        <Text variant="body" className="mt-2 text-center">
          {tn.poslatoOpis(ASTROLOG.kratko)}
        </Text>
        <Button className="mt-8 self-stretch" onPress={() => router.back()}>
          <Text>{t.opste.zatvori}</Text>
        </Button>
      </View>
    );
  }

  if (korak === 'uvod') {
    return (
      <View className="flex-1 bg-background">
        <Vrh />
        <ScrollView className="flex-1" contentContainerClassName="px-6 pb-4 pt-6" showsVerticalScrollIndicator={false}>
          <PitajUvod naBelom />
        </ScrollView>
        <View className="px-6 pt-3" style={{ paddingBottom: dno }}>
          <Button istaknuto onPress={() => setKorak('pisanje')}>
            <Text>{tn.napisi}</Text>
          </Button>
        </View>
      </View>
    );
  }

  const napomena = !naMrezi
    ? tn.bezInterneta
    : kreditom
      ? tn.vecPlaceno
      : tn.placanje(cena ?? null);

  return (
    <View className="flex-1 bg-background">
      <Vrh />

      <View className="flex-row items-center gap-3 px-6 pt-5">
        <AstrologSlika velicina={44} />
        <View className="flex-1">
          <Text variant="h3">{tn.naslov(ASTROLOG.genitiv)}</Text>
          <Text variant="caption">
            {!osoba
              ? tn.vidiTvoju(ASTROLOG.kratko)
              : oOdnosu
                ? tn.vidiObe(ASTROLOG.kratko)
                : tn.vidiOsobe(ASTROLOG.kratko)}
          </Text>
        </View>
      </View>

      {/* O kome je pitanje — samo kad korisnik ima druge osobe ("Tvoji ljudi" na tabu "Ti"). */}
      {izbor.length > 0 && (
        <View className="mt-5 px-6">
          <Text variant="label" className="mb-2">{tn.oKome}</Text>
          <KapsuleRed
            stavke={[{ key: JA, label: tn.ja, icon: null }, ...izbor.map((o) => ({ key: o.id, label: o.name, icon: null }))]}
            izabrana={osobaId ?? JA}
            onIzbor={(k) => { setOsobaId(k === JA ? null : k); if (k === JA) setOOdnosu(false); }}
          />
          {osoba && (
            <Kvacica ukljuceno={oOdnosu} onPromena={setOOdnosu} className="mt-3">
              {tn.oNamaDvoma}
            </Kvacica>
          )}
        </View>
      )}

      <BezInterneta className="mx-6 mt-4" />

      <TextInput
        value={tekst}
        onChangeText={setTekst}
        editable={ucitano}
        multiline
        autoFocus
        maxLength={PITANJE_MAX}
        textAlignVertical="top"
        placeholder={!osoba
          ? tn.primerJa
          : oOdnosu
            ? tn.primerOdnos
            : tn.primerOsoba}
        placeholderTextColor={neutral.inkSubtle}
        accessibilityLabel={tn.poljeOpis}
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
            {tn.brojac(tekst.length, PITANJE_MAX)}
          </Text>
          {poruka ? (
            <Text variant="note" className="text-foreground">{poruka}</Text>
          ) : (
            <Text variant="note">{napomena}</Text>
          )}
          {/* Ugaseno SIVO: belo dugme na belom listu je izgledalo kao sam natpis (Ivan). */}
          <Button istaknuto onPress={posalji} disabled={!spremno} ucitava={saljem}>
            <Text>{kreditom ? tn.posalji : tn.naPlacanje}</Text>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Vrh strane. iOS: ručica — pageSheet se zatvara povlačenjem. ANDROID (Ivan, 30.9.2026,
 * Xiaomi 11T): `modal` je preko celog ekrana, pa je sadržaj išao pod statusnu traku, a
 * povlačenje nadole je otvaralo sistemski meni umesto da zatvori stranu. Zato umetak
 * statusne trake i X gore DESNO (Ivan, 30.9.2026; prvo je bio levo, kao Material strana
 * preko celog ekrana); sistemsko "nazad" i dalje radi.
 */
function Vrh() {
  const t = useT();
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android') return <Rucica />;
  return (
    <View className="flex-row justify-end px-5" style={{ paddingTop: insets.top + VRH_ANDROID }}>
      <GlassIconButton onPress={() => router.back()} accessibilityLabel={t.opste.zatvori}>
        <X size={20} color={neutral.ink} />
      </GlassIconButton>
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
