import * as React from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpLeft, ChevronDown, ChevronRight, ChevronUp, X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GlassIconButton } from '@/components/ui/glass-button';
import { VRH_ANDROID } from '@/components/screen';
import { AstrologSlika } from '@/components/astrolog-slika';
import { BezInterneta } from '@/components/bez-interneta';
import { PitajUvod } from '@/components/pitaj-uvod';
import { OblastIkona } from '@/components/oblast-ikona';
import { OdeljakIkona } from '@/components/odeljak-ikona';
import { KapsuleRed } from '@/components/ui/kapsule';
import { useJezik, useT } from '@/i18n';
import { pitajTeme } from '@/i18n/sr/pitaj-teme';
import { Kvacica } from '@/components/ui/kvacica';
import {
  ASTROLOG, PITANJE_MAX, imaTemePitanja, pitanjeKratko, pitanjeSpremno, porukaGreske, snimakKarte, snimakODrugoj,
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
import { FONT } from '@/theme/font';

/** Izbor "Ja" u redu "O kome je pitanje". */
const JA = 'ja';

/** Najmanja visina polja i kad su ispod njega teme i gotova pitanja: tri reda teksta (prored 26). */
const POLJE_PRAZNO = 78;

/**
 * Ikonica teme na kapsuli (Ivan, 13.10.2026) — postojece 3D slike, iste kao na tabu Mesec i u tumacenjima:
 * srce, torba, novcanik, kuca; za teme bez svoje slike kompas (odluka), pescani sat (period) i bocica "sustine" (ja).
 */
const IKONA_TEME: Record<string, React.ReactNode> = {
  ljubav: <OblastIkona oblast="ljubav" size={20} />,
  posao: <OblastIkona oblast="karijera" size={20} />,
  novac: <OblastIkona oblast="finansije" size={20} />,
  porodica: <OblastIkona oblast="kuca" size={20} />,
  odluka: <OdeljakIkona odeljak="preporuke" size={20} />,
  period: <OdeljakIkona odeljak="dugorocno" size={20} />,
  ja: <OdeljakIkona odeljak="sustina" size={20} />,
};

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
 *
 * TEME I GOTOVA PITANJA (Ivan, 13.10.2026): da korisnik ne pita ono na sta astrolog ne moze da
 * odgovori. Dok je polje PRAZNO, ispod njega su kapsule sa temama i tri pitanja; dodir pitanje
 * UPISE u polje (ne salje) i otvori tastaturu, pa ga korisnik prepravi u svoje. Cim polje ima
 * tekst, predlozi nestaju i polje dobija ceo prostor; tada ih otvara red "Teme i primeri pitanja"
 * (bez njega ih korisnik sa sacuvanim nacrtom nikad ne bi video — Ivan, 13.10.2026), a gotovo
 * pitanje pre zamene napisanog teksta PITA. Tastatura zato vise ne iskace sama na
 * prazno polje — pokrila bi predloge. Ispod je red "Na šta Boban ne odgovara" (`pitanje-pravila`),
 * a prekratko pitanje pred placanje JEDNOM dobije predlog da se dopuni (ne blokira).
 * Sve to SAMO NA SRPSKOM (`imaTemePitanja`, tekst u `i18n/sr/pitaj-teme.ts` ceka astrologa);
 * na drugim jezicima ekran je kakav je bio.
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

  // Teme i gotova pitanja — samo na srpskom, i samo dok je polje prazno.
  const predlozi = imaTemePitanja(useJezik());
  const [izabranaTema, setIzabranaTema] = React.useState<string | null>(null);
  // Predlog da se prekratko pitanje dopuni: `kratko` = kartica je na ekranu, `kratkoVidjeno` = vec je
  // jednom pokazana, pa sledeci pritisak salje.
  const [kratko, setKratko] = React.useState(false);
  const [kratkoVidjeno, setKratkoVidjeno] = React.useState(false);
  const polje = React.useRef<TextInput>(null);
  // Uz prazno polje su predlozi uvek tu; uz napisan tekst samo kad ih korisnik otvori.
  const [otvoreni, setOtvoreni] = React.useState(false);
  const prazno = tekst.trim() === '';
  // Uz otvorenu tastaturu predlozi se sklanjaju (nema mesta za polje); tada ih otvara red ispod polja.
  const [tastaturaGore, setTastaturaGore] = React.useState(false);
  React.useEffect(() => {
    const ios = Platform.OS === 'ios';
    const a = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setTastaturaGore(true));
    const b = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setTastaturaGore(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  const samiOdSebe = prazno && !tastaturaGore;
  const prikaziPredloge = predlozi && ucitano && (samiOdSebe || otvoreni);
  const gotovaPitanja = osoba
    ? (oOdnosu ? pitajTeme.oOdnosu : pitajTeme.oOsobi)
    : pitajTeme.teme.find((x) => x.key === izabranaTema)?.pitanja ?? pitajTeme.mesano;

  const promeniTekst = (novi: string) => { setTekst(novi); setKratko(false); setOtvoreni(false); };
  const upisiPitanje = (p: string) => {
    const upisi = () => { promeniTekst(p); polje.current?.focus(); };
    if (prazno || tekst.trim() === p) return upisi();
    const z = pitajTeme.zameni;
    Alert.alert(z.naslov, z.opis, [{ text: t.opste.otkazi, style: 'cancel' }, { text: z.da, onPress: upisi }]);
  };

  // Sa predlozima polje nema `autoFocus`; tastatura se otvara sama samo kad se nastavlja zapocet tekst.
  React.useEffect(() => {
    if (predlozi && ucitano && korak === 'pisanje' && tekst.trim() !== '') polje.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predlozi, ucitano, korak]);

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
  // Na ekranu za pisanje ispod dugmeta je jos sitan red sa cenom, pa dno ide NIZE nego na ostalim koracima
  // (Ivan, 13.10.2026: "ima praznog belog mesta posle poslednje recenice"): tik iznad home indikatora.
  const dnoPisanja = Math.max(insets.bottom - 14, 12);
  const dnoStil = useAnimatedStyle(() => ({
    paddingBottom: Math.max(tastatura.height.value + 12, dnoPisanja),
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
    if (predlozi && !kratkoVidjeno && pitanjeKratko(tekst)) {
      setKratko(true);
      setKratkoVidjeno(true);
      return;
    }
    setKratko(false);
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
      // Npr. `nema_kredita`: broj placenih pitanja na telefonu je bio zastareo — posle osvezavanja
      // dugme sam postane "Nastavi na plaćanje".
      osvezi();
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
          <Text variant="oznaka" className="mb-2">{tn.oKome}</Text>
          {/* "O nama dvoma" DESNO od osoba, u istom redu (Ivan, 13.10.2026) — red manje iznad polja. */}
          <View className="flex-row items-center gap-3">
            <View className="shrink">
              <KapsuleRed
                stavke={[{ key: JA, label: tn.ja, icon: null }, ...izbor.map((o) => ({ key: o.id, label: o.name, icon: null }))]}
                izabrana={osobaId ?? JA}
                onIzbor={(k) => { setOsobaId(k === JA ? null : k); if (k === JA) setOOdnosu(false); }}
                pravoStaklo
              />
            </View>
            {osoba && (
              <Kvacica uRedu ukljuceno={oOdnosu} onPromena={setOOdnosu} className="shrink-0">
                {tn.oNamaDvoma}
              </Kvacica>
            )}
          </View>
        </View>
      )}

      <BezInterneta className="mx-6 mt-4" />

      <TextInput
        ref={polje}
        value={tekst}
        onChangeText={promeniTekst}
        onFocus={() => setOtvoreni(false)}
        editable={ucitano}
        multiline
        autoFocus={!predlozi}
        maxLength={PITANJE_MAX}
        textAlignVertical="top"
        placeholder={predlozi
          ? (!osoba ? pitajTeme.polje.ja : oOdnosu ? pitajTeme.polje.odnos : pitajTeme.polje.osoba)
          : !osoba
            ? tn.primerJa
            : oOdnosu
              ? tn.primerOdnos
              : tn.primerOsoba}
        placeholderTextColor={neutral.inkSubtle}
        accessibilityLabel={tn.poljeOpis}
        // Bez okvira i bez sive podloge — polje je papir, kursor je jedini znak.
        className="mt-5 flex-1 px-6 font-sans text-row leading-[26px] text-foreground"
        // `font-sans` je Jakarta; pismo tekuceg jezika (makedonski = Manrope, `theme/font.ts`).
        style={[
          { fontFamily: FONT.regular, minHeight: POLJE_PRAZNO },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
        ]}
      />

      {/* Teme i gotova pitanja — DOLE, uz dugme (Ivan, 13.10.2026: "sve pomeri na dole da ima vise mesta
          za pisanje"); polje iznad dobija sav preostali prostor. Skrol se skuplja na malom telefonu. */}
      {prikaziPredloge && (
        <>
          {/* HIJERARHIJA (Ivan, 13.10.2026: "sve je slicno i nabacano"): na strani je CRNO i 17 pt samo ono sto
              korisnik pise; primeri su sivi 15 pt, a oznake ("Primeri pitanja", veze u dnu) crn sitan verzal.
              Linija iznad odvaja primere od polja.
              Oznaka i kapsule su VAN skrola: skrol se skuplja (mali telefon, tastatura koja se jos spusta), a
              natpis kapsule ima `adjustsFontSizeToFit` — u stisnutoj visini se smanjio na par tacaka i tako
              ostao (snimak sa Ivanovog telefona, 13.10.2026). */}
          <View className="border-t border-border px-6 pt-4">
            <Text variant="oznaka" className={cn('text-foreground', !osoba && 'mb-3')}>{pitajTeme.naslov}</Text>
            {/* Tema ne mora biti izabrana (`''` = nijedna); dodir na izabranu je skida. Pravo staklo, kao na tabu Mesec. */}
            {!osoba && (
              <KapsuleRed
                stavke={pitajTeme.teme.map((x) => ({ key: x.key, label: x.naziv, icon: IKONA_TEME[x.key] ?? null }))}
                izabrana={izabranaTema ?? ''}
                onIzbor={(k) => setIzabranaTema(k === izabranaTema ? null : k)}
                pravoStaklo
              />
            )}
          </View>
          <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} className="mt-3" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Linije od ivice do ivice lista. */}
            <View className="border-t border-border">
              {gotovaPitanja.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => upisiPitanje(p)}
                  accessibilityRole="button"
                  accessibilityHint={pitajTeme.upisiOpis}
                  className="flex-row items-start gap-3 border-b border-border px-6 py-3 active:opacity-80">
                  <Text variant="body" className="flex-1">{p}</Text>
                  <ArrowUpLeft size={16} color={neutral.inkSubtle} style={{ marginTop: 3 }} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* Animirani omotac nosi SAMO razmak za tastaturu — NativeWind klase na
          Reanimated-ovom `Animated.View` ne stizu (izmereno na vebu). */}
      <Animated.View style={dnoStil}>
        <View className="gap-3 px-6 pt-3">
          {predlozi && ucitano && !samiOdSebe && (
            <Pressable
              onPress={() => { if (!otvoreni) Keyboard.dismiss(); setOtvoreni(!otvoreni); }}
              accessibilityRole="button"
              accessibilityState={{ expanded: otvoreni }}
              hitSlop={8}
              className="flex-row items-center justify-between py-1 active:opacity-80">
              <Text variant="oznaka" className="text-foreground">{otvoreni ? pitajTeme.sakrij : pitajTeme.otvori}</Text>
              {otvoreni
                ? <ChevronDown size={14} color={neutral.inkSubtle} />
                : <ChevronUp size={14} color={neutral.inkSubtle} />}
            </Pressable>
          )}
          {/* Jedan red: pravila levo, brojac desno. Crveno kad je tekst duzi od granice (npr. nacrt iz vremena kad je bila 1000). */}
          <View className="flex-row items-center justify-between gap-3">
            {predlozi ? (
              <Pressable
                onPress={() => router.push('/pitanje-pravila')}
                accessibilityRole="button"
                hitSlop={8}
                className="shrink flex-row items-center gap-1 py-1 active:opacity-80">
                <Text variant="oznaka" numberOfLines={1} className="shrink text-foreground">{pitajTeme.pravila.naslov(ASTROLOG.kratko)}</Text>
                <ChevronRight size={14} color={neutral.inkSubtle} />
              </Pressable>
            ) : <View />}
            <Text variant="caption" className={cn(tekst.length > PITANJE_MAX && 'text-destructive')}>
              {tn.brojac(tekst.length, PITANJE_MAX)}
            </Text>
          </View>
          {kratko ? (
            // Prekratko pitanje: predlog umesto dugmeta, da izbor bude jasan. "Pošalji ovako" ide dalje.
            <View className="gap-3 rounded-lg border border-border p-4">
              <Text variant="body" className="text-foreground">{pitajTeme.kratko.poruka}</Text>
              <View className="flex-row gap-2">
                <Button size="compact" className="flex-1" onPress={() => { setKratko(false); polje.current?.focus(); }}>
                  <Text>{pitajTeme.kratko.dopuni}</Text>
                </Button>
                <Button size="compact" variant="secondary" className="flex-1" onPress={posalji}>
                  <Text>{pitajTeme.kratko.posalji}</Text>
                </Button>
              </View>
            </View>
          ) : (
            <>
              {/* Greska ostaje IZNAD dugmeta — nju korisnik mora da vidi. */}
              {poruka ? <Text variant="note" className="text-foreground">{poruka}</Text> : null}
              {/* Ugaseno SIVO: belo dugme na belom listu je izgledalo kao sam natpis (Ivan). */}
              <Button istaknuto onPress={posalji} disabled={!spremno} ucitava={saljem}>
                <Text>{kreditom ? tn.posalji : tn.naPlacanje}</Text>
              </Button>
            </>
          )}
          {/* Cena i uslov ISPOD dugmeta, sitno (Ivan, 13.10.2026) — vise mesta za pisanje. */}
          {/* Druga recenica u NOVOM redu (Ivan, 13.10.2026): prelom posle prve tacke iza koje je razmak —
              vazi za sve jezike, a tacka u ceni ("2.340") nema razmak iza sebe. */}
          <Text variant="caption" className="-mt-1 text-center">{napomena.replace(/\. (?=\S)/, '.\n')}</Text>
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
