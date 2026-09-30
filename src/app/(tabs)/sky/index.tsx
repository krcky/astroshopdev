import * as React from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { NatalWheel } from '@/components/natal-wheel';
import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { IznadPreliva, Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { StakloDugme } from '@/components/staklo-dugme';
import { OZNAKA_12 } from '@/components/tvoj-dan-card';
import { AspektRed, TackaRed, TockInfo, redosledPlaneta } from '@/components/karta-lista';
import { buildSky, danZaKalendar, shiftDays, zoneClock, zoneShift } from '@/lib/sky';
import { formatDatum } from '@/lib/horoscope';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useSkyPlaceStore } from '@/store/sky-place';
import { useSkyTimeStore } from '@/store/sky-time';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/**
 * Trenutno na nebu — gde su planete SADA, nad gradom iz profila.
 *
 * Razlika u odnosu na tab "Karta": tamo je nebo zamrznuto na trenutak rodjenja
 * i tice se samo korisnika, ovde se pomera dok gledas i isto je za sve.
 *
 * Izgleda kao natalna karta (Ivan, 28.9.2026): tocak, ispod njega sat i mesto
 * kao ime i podaci o rodjenju, lista sa ikonicama tacaka i kolonama znaka i
 * kuce, aspekti. Velike trojke NEMA — samo lista. Delovi su zajednicki (`karta-lista.tsx`),
 * da se dva ekrana ne razidju.
 *
 * Nista se ne tumaci. Ekran prikazuje IZRACUNATO stanje — znak, stepen, kucu,
 * retrogradnost — a ne tekst astrologa, pa redovi nigde ne vode. Tumacenja
 * tranzita na licnu kartu su i dalje u tabu "Tranziti", jer se tamo placaju.
 */
export default function Sky() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();
  const { width } = useWindowDimensions();

  // Mesto posmatranja je zaseban izbor; `null` znaci grad iz profila. Ceka se i
  // njegova hidratacija, inace bi ekran nakratko pokazao kartu za pogresan grad
  // i onda je zamenio — a razlika je ceo ascendent.
  // Isti izbor kao `useMestoNeba()` (list sa kalendarom), ali bez drugog
  // `useResolvedProfile()` — on pri svakom pozivu racuna natalnu kartu.
  const izabranGrad = useSkyPlaceStore((s) => s.city);
  const mestoHydrated = useSkyPlaceStore((s) => s.hydrated);
  const grad = izabranGrad ?? resolved?.city ?? null;

  const [sada, setSada] = React.useState(() => new Date());
  // Pomeren trenutak je u store-u: menja ga i list sa kalendarom (`sky-datum.tsx`).
  const izabran = useSkyTimeStore((s) => s.izabran);
  const setIzabran = useSkyTimeStore((s) => s.setIzabran);
  const izaberiDan = useSkyTimeStore((s) => s.izaberiDan);
  const now = izabran ?? sada;

  // Osvezavanje ide SAMO dok je ekran u fokusu i dok se gleda sadasnjost.
  // Tabovi ostaju montirani i kad se sa njih ode, pa bi obican `useEffect`
  // racunao efemeride u pozadini do kraja rada aplikacije. Minut je dovoljno
  // gusto: za to vreme se ascendent pomeri 15', a Mesec manje od jednog
  // lucnog minuta.
  useFocusEffect(
    React.useCallback(() => {
      if (izabran) return;
      setSada(new Date());
      const id = setInterval(() => setSada(new Date()), 60_000);
      return () => clearInterval(id);
    }, [izabran])
  );

  // Zavisnosti su BROJEVI, ne `resolved` — profil ponovo stigao sa servera je
  // nov objekat sa istim podacima, pa bi se cela karta racunala iznova bez
  // ikakvog povoda.
  const latitude = grad?.latitude;
  const longitude = grad?.longitude;
  const sky = React.useMemo(
    () => (latitude === undefined || longitude === undefined
      ? null
      : buildSky(now, latitude, longitude)),
    [now, latitude, longitude]
  );

  if (!hydrated || !mestoHydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !grad || !sky) return <Redirect href="/" />;

  // Ispod kapije, da se do grada dolazi bez `!`.
  const pomeriSat = (smer: number) =>
    setIzabran(new Date(now.getTime() + smer * 3_600_000));
  const pomeriDan = (smer: number) =>
    setIzabran(shiftDays(now, grad.tz, smer));
  // Kalendar: na iOS-u (i vebu) list odozdo, na Androidu sistemski dijalog —
  // Android nema kalendar koji se ugradjuje u list.
  const otvoriKalendar = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: danZaKalendar(now, grad.tz),
        mode: 'date',
        onValueChange: (_e, d) => izaberiDan(d, grad.tz),
      });
      return;
    }
    router.push('/sky-datum');
  };
  // Zid-sat mesta posmatranja — samo za ispis (vidi `zoneShift`).
  const zid = zoneShift(now, grad.tz);
  const datum = formatDatum(zid, true);

  const { chart, points } = sky;
  // Najtesnji prvi, kao na natalnoj karti. `findAspects` ih vraca po skoru
  // (tesnoca x tezina tela), sto je redosled za izbor teksta, ne za citanje.
  const aspects = [...sky.aspects].sort((x, y) => x.orb - y.orb);
  const wheelSize = Math.min(width - 16, 430);

  return (
    <Screen label="Trenutno na nebu" padded={false} tint="pink" right={<ProfileButton />}>
      {/* Krug malo navise, blize zaglavlju (Ivan, 28.9.2026; isto na "Ti"), i IZNAD
          preliva — beo, ne obojen roze (Ivan, 30.9.2026). */}
      <IznadPreliva
        className="-mt-3 items-center"
        podignuto={<NatalWheel chart={chart} size={wheelSize} points={points} />}>
        {/* "i" kao na "Ti" (Ivan, 29.9.2026): krug, tacke, aspekti — i legenda
            linija, pa je legenda ispod liste uklonjena. */}
        <TockInfo velicina={wheelSize} onPress={() => router.push('/nebo-info')}
          accessibilityLabel="Šta je trenutno nebo?" />
      </IznadPreliva>

      {/* Sat ISPOD tocka, centrirano — na mestu imena na natalnoj karti.
          Veliki, `display` (Ivan, 28.9.2026: "font za vreme povecati"). */}
      <View className="-mt-4 items-center px-5">
        <Text variant="display" className="text-center">{zoneClock(now, grad.tz)}</Text>
      </View>

      {/* Datum i mesto u staklu, JEDNO PORED DRUGOG, malo odmaknuti od sata
          (Ivan, 29.9.2026): datum otvara kalendar, mesto list sa gradovima. Sa
          godinom — kalendar skace i u druge godine. Kad dugo ime grada ne stane,
          prelazi u sledeci red, centrirano. */}
      <View className="mx-5 mt-5 flex-row flex-wrap justify-center gap-2">
        <StakloDugme
          sfIkona="calendar"
          ikona={<CalendarDays size={IKONA} color={neutral.ink} strokeWidth={2} />}
          tekst={datum}
          onPress={otvoriKalendar}
          accessibilityLabel={`Datum: ${datum} Dodirni da izabereš dan.`}
        />
        <StakloDugme
          sfIkona="mappin.and.ellipse"
          ikona={<MapPin size={IKONA} color={neutral.ink} strokeWidth={2} />}
          tekst={grad.name}
          onPress={() => router.push('/sky-place')}
          accessibilityLabel={`Mesto posmatranja: ${grad.name}. Dodirni da promeniš.`}
        />
      </View>

      {/* Sat i dan napred i nazad, "Trenutno" u sredini (Ivan, 28.9.2026). Dan
          ide preko zid-sata (`shiftDays`) da bi u noci kad se sat pomera i dalje
          pogadjao isti sat; sat je prostih 60 minuta stvarnog vremena — vidi
          komentar u `lib/sky.ts`. Mesec i godinu pokriva kalendar. */}
      <View className="mx-5 mt-3 flex-row gap-2">
        <StakloDugme siroko strelica="levo" tekst="dan" onPress={() => pomeriDan(-1)} accessibilityLabel="Dan nazad" />
        <StakloDugme siroko strelica="levo" tekst="sat" onPress={() => pomeriSat(-1)} accessibilityLabel="Sat nazad" />
        {/* Ivice nema, pa neaktivno "Trenutno" (vec gledas sadasnjost) razlikuje samo siv natpis. */}
        <StakloDugme
          tekst="Trenutno"
          onPress={() => setIzabran(null)}
          disabled={!izabran}
          accessibilityLabel="Vrati se na sadašnji trenutak"
        />
        <StakloDugme siroko strelica="desno" tekst="sat" onPress={() => pomeriSat(1)} accessibilityLabel="Sat napred" />
        <StakloDugme siroko strelica="desno" tekst="dan" onPress={() => pomeriDan(1)} accessibilityLabel="Dan napred" />
      </View>

      {/* Bez velike trojke (Ivan, 28.9.2026: "samo lista") — Sunce, Mesec i
          Ascendent su prvi redovi liste. */}
      {chart.houses.fellBack && (
        <View className={cn(CARD_SURFACE, 'mx-5 mt-4 p-4')}>
          <Text variant="muted">
            Na geografskoj širini mesta {grad.name} Placidus kuće ne postoje — tačke
            ekliptike koje ih određuju nikad ne izlaze nad horizont. Prikazane
            su Whole Sign kuće.
          </Text>
        </View>
      )}

      {/* Jedna tabela (Ivan, 29.9.2026: tacke spojene sa planetama): Ascendent,
          Sunce, Mesec, ostale planete, cvor, Lilit, Tacka srece, MC — MC ostaje
          poslednji, kao na natalnoj karti. Iste kolone, bez rasklapanja i strelica. */}
      <View className={cn(CARD_SURFACE, 'mx-5 mt-4 overflow-hidden')}>
        <TackaRed tacka="ascendant" glyph="ASC" ime="Ascendent" pos={chart.ascendantSign} />
        {redosledPlaneta(chart.planets).map((p) => (
          <TackaRed
            key={p.key}
            tacka={p.key}
            glyph={p.glyph}
            ime={p.name}
            pos={p.position}
            retro={p.retrograde}
            kuca={p.house}
          />
        ))}
        {points.map((t) => (
          <TackaRed
            key={t.key}
            tacka={t.key}
            glyph={t.glyph}
            ime={t.name}
            pos={t.position}
            retro={t.retrograde}
            kuca={t.house}
          />
        ))}
        <TackaRed tacka="midheaven" glyph="MC" ime="MC" pos={chart.midheavenSign} last />
      </View>

      {/* Aspekti — bez tumacenja, pa bez strelice; ime nije sivo jer ovde
          nijedan aspekt nema tekst i sivo ne bi nista razlikovalo. */}
      <View className={cn(CARD_SURFACE, 'mx-5 mt-4 overflow-hidden')}>
        {/* Naslov istim pismom kao datum na pocetnoj (`oznaka` 12pt, verzali —
            Ivan, 29.9.2026), ne `RowHead`. */}
        <View className="border-b border-border px-4 py-3">
          <Text variant="oznaka" className={OZNAKA_12} accessibilityRole="header">
            Aspekti{'\u00A0\u00A0·\u00A0\u00A0'}{aspects.length}
          </Text>
        </View>
        {aspects.map((a, i) => (
          <AspektRed key={a.contentKey} aspekt={a} muted={false} last={i === aspects.length - 1} />
        ))}
      </View>
    </Screen>
  );
}

/** Ikonice u rezervnim staklenim dugmadima (kalendar, mesto) — uz natpis od 15pt. */
const IKONA = 18;
