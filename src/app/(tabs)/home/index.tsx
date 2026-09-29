import * as React from 'react';
import { Modal, Platform, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Redirect, Stack, router } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Screen, useTabBarSpace } from '@/components/screen';
import { MINUS_BOJA, PLUS_BOJA } from '@/components/ton';
import { GlassBubble } from '@/components/ui/glass-button';
import { CARD_SURFACE } from '@/components/ui/card';
import { buildPersonalDaily, formatDate, type PersonalDaily, type SlowTransit } from '@/lib/horoscope';
import { Calendar, Check, ChevronRight, Lock, Minus, Plus, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { headerBar, neutral, shadow, size, space } from '@/theme/tokens';
import { Logo } from '@/components/logo';
import { fetchTransitTones, useTransitTexts, type TransitText } from '@/lib/transit-texts';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore, usePremium } from '@/store/auth';
import { BESPLATNO } from '@/lib/pristup';
import { ZakljucaniRedovi, otvoriPremium } from '@/components/zakljucano';
import { PREMIUM } from '@/components/zakljucano';
import { tvojDanShownFor, useTvojDanLog } from '@/store/tvoj-dan-log';
import { pickTvojDan, tvojDanLogFor } from '@/lib/tvoj-dan';
import { OZNAKA_12, TvojDanCard } from '@/components/tvoj-dan-card';
import { MesecDanasCard } from '@/components/mesec-danas-card';
import { PromenaNaNebu } from '@/components/promena-na-nebu';
import { OceneOblasti } from '@/components/ocena-oblasti';
import { KarticaTranzita } from '@/components/tranziti-lista';
import { chartRulers, rulerRole } from '@/lib/rulers';
import { transitTone } from '@/lib/tone';
import { trajanjeTekst, trajanjeTranzita } from '@/lib/oblasti';
import type { NatalChart } from '@/lib/natal';
import { useOblastiDana } from '@/lib/use-oblasti';
import { useDanas } from '@/store/danas';
import { pickBrief, type Transit } from '@/lib/transits';
import { cn } from '@/lib/utils';
import { STARI_IOS } from '@/lib/platform';
import { NativeDayMenu } from '@/components/native-day-menu';

/** Pregled dana — izlog, ne sadrzaj. Pun tekst je u tabu "Tranziti". */
export default function Home() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();

  // Tab ostaje montiran: dan se menja u ponoc i pri povratku u aplikaciju (`store/danas.ts`).
  const today = useDanas();
  // Pomeraj dana: -2..2. Ceo ekran (Tvoj dan, sazetak, liste) se racuna za izabrani dan.
  // Drugi dani su Premium (`BESPLATNO.danMeni`, Ivan 29.9.2026): besplatni je uvek
  // na danas, i kad je izbor ostao od ranije (npr. istekao Premium). Kalendar ipak
  // VIDI — ostali dani stoje u meniju sa katancem i vode na paywall (Ivan, 29.9.2026).
  const premium = usePremium();
  const smeDrugiDan = premium || BESPLATNO.danMeni;
  const zakljucan = (o: number) => !smeDrugiDan && o !== 0;
  const menjaDan = smeDrugiDan ? 'Promeni dan' : 'Drugi dani uz Premium';
  const [izabranDan, setOffset] = React.useState(0);
  const offset = smeDrugiDan ? izabranDan : 0;
  // Nov dan: nazad na "danas" — jucerasnje "sutra" ne sme da postane prekosutra.
  React.useEffect(() => { setOffset(0); }, [today]);
  // Dnevnici prikaza pripadaju nalogu (`store/tvoj-dan-log.ts`).
  const userId = useAuthStore((s) => s.user?.id ?? null);
  // Slajd karusela; indikator je van skrola pa stanje zivi ovde.
  const [slide, setSlide] = React.useState(0);
  const dno = useDnoKarusela();
  const date = React.useMemo(() => {
    const d = new Date(today); d.setDate(today.getDate() + offset); return d;
  }, [today, offset]);
  // Stari Hero (i njegov dnevnik) se na pocetnoj vise ne prikazuje (29.9.2026) —
  // `daily` ovde daje sazetak, Mesec, promene na nebu i spore tranzite.
  const daily = React.useMemo(
    () => (resolved ? buildPersonalDaily(resolved, date) : null),
    [resolved, date]
  );

  // Jedan upit za tekstove svih danasnjih tranzita — sazetak i liste
  // su podskupovi iste liste.
  // Mesecev tranzit kartice ne mora biti u `entries`: egzaktan je negde tokom
  // dana, a `entries` su za trenutak otvaranja — zato se dodaje posebno.
  const kljucevi = React.useMemo(() => {
    if (!daily) return [];
    const k = daily.entries.map((e) => e.transit.contentKey);
    const mesec = daily.moonDay.strongest?.contentKey;
    return mesec && !k.includes(mesec) ? [...k, mesec] : k;
  }, [daily]);
  const { texts } = useTransitTexts(kljucevi);

  // "Tvoj dan" i "Mesec danas" ZA SVE (Ivan, 29.9.2026; do tada su besplatni
  // videli stari Hero i karticu Mesec). Razlika je samo u tekstu: dugu verziju
  // salje server samo Premium-u (pravilo 8), besplatni dobija kratku, a ceo
  // tekst je iza "Saznaj više" (kartica "Otključaj" na `/transit`).
  const tvojDanLog = useTvojDanLog(tvojDanShownFor(userId));
  const tvojDan = React.useMemo(
    () => (resolved
      ? pickTvojDan(resolved.chart, date, resolved.timeUnknown,
          tvojDanLogFor(resolved.chart, date, tvojDanLog, resolved.timeUnknown, today))
      : null),
    [resolved, date, tvojDanLog, today]
  );
  // "Danas ukratko" izostavlja tranzit iz "Tvog dana".
  const brief = React.useMemo(
    () => (daily ? pickBrief(daily.entries.map((e) => e.transit), tvojDan?.contentKey ?? null) : null),
    [daily, tvojDan]
  );
  // Ocene oblasti — isti `useOblastiDana` kao lista na tabu "Tranziti".
  // Besplatni vidi ocenu samo za `BESPLATNO.oblasti`, ostale pod katancem.
  const oblasti = useOblastiDana(resolved, date);

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  // Grupe sazetka se racunaju ovde, ne u kartici: karusel mora unapred da zna
  // da li kartica uopste ima sta da pokaze.
  const b = brief ?? daily.brief;
  const briefGroups = {
    ide: saTekstom(b.ide, texts, 'positive'),
    koci: saTekstom(b.koci, texts, 'challenge'),
  };

  // Ukratko — ide ti / koci te. Sta ulazi bira `pickBrief`. Iznad sazetka zbijena
  // kartica sa ocenama oblasti (Ivan, 28.9.2026 — umesto zasebnog slajda "Oblasti danas").
  // Bez naslova iznad kartice: "Danas ukratko" je U kartici, istim pismom kao "Ide ti".
  const ukratko = briefGroups.ide.length > 0 || briefGroups.koci.length > 0 || oblasti ? (
    <Brief
      {...briefGroups}
      naslov={offset === 0 ? 'Danas ukratko' : 'Ukratko'}
      vrh={oblasti ? <OceneOblasti rez={oblasti} bare otkljucane={premium ? undefined : BESPLATNO.oblasti} /> : null}
    />
  ) : null;

  const slides: Slide[] = [
        // Prvi slajd: "Tvoj dan" (`lib/tvoj-dan.ts`), a ISPOD njega "Danas ukratko" —
        // do 29.9.2026 je sazetak bio zaseban drugi slajd (Ivan). Dan bez kandidata za
        // "Tvoj dan": na prvom slajdu ostaje samo sazetak.
        ...(tvojDan || ukratko
          ? [{
              key: 'day',
              node: (
                <View>
                  {tvojDan && <TvojDanCard pick={tvojDan} date={date} isToday={offset === 0} chart={resolved.chart} aktivan={slide === 0} />}
                  {ukratko && <View className={tvojDan ? 'mt-3' : undefined}>{ukratko}</View>}
                </View>
              ),
            }]
          : []),
        // "Mesec danas" — posle sazetka (Ivan, 27.9.2026); nosi svoju oznaku, kao datum
        // na prvom slajdu (Ivan, 28.9.2026). Lunarni kalendar je besplatan za sve.
        { key: 'moon', node: <MesecDanasCard date={date} offset={offset} chart={resolved.chart} timeUnknown={resolved.timeUnknown} name={resolved.profile.name} excludeKey={tvojDan?.contentKey ?? null} /> },
        // Sledece promene na nebu i kuca u koju ulaze (Ivanov plan).
        ...(daily.skyEvents.length > 0
          ? [{ key: 'sky', label: 'Promene na nebu', nadnaslov: 'Šta te čeka u narednom periodu', veliki: true, node: <SkyEvents daily={daily} today={date} /> }]
          : []),
        // Spori tranziti — tema perioda. "Ovih dana" (brzi) je izbacen 27.9.2026
        // (Ivan): ponavljao je sazetak, a Mesecevi tranziti su presli u karticu Mesec.
        // Svi brzi tranziti ostaju u tabu "Tranziti".
        ...(daily.bySpeed.slow.length > 0
          ? [{ key: 'slow', label: 'Tema perioda', nadnaslov: 'Tranziti koji traju nedeljama', veliki: true, node: <TransitList list={daily.bySpeed.slow} texts={texts} today={date} chart={resolved.chart} timeUnknown={resolved.timeUnknown} besplatno={premium ? undefined : BESPLATNO.temaPerioda} /> }]
          : []),
  ];

  return (
    // Indikator slajdova stoji VAN skrola, vezan za dno ekrana (`SlideDots`), pa je
    // uvek isto iznad trake tabova — ne zavisi od visine kartica ni ekrana (Ivan, 28.9.2026).
    <View style={{ flex: 1 }}>
    {/* Pun logo (ASTRO-krug-SHOP) je sacuvan pod git tagom `pun-logo-na-pocetnoj`; vraca se sa `<Logo full />`. */}
    <Screen
      label={<Logo />}
      // Gore desno: dan-meni i profil. Na iOS-u su to NATIVE stavke trake
      // (`unstable_headerRightItems` dole): UIMenu sa zamucenjem na dodir,
      // Liquid Glass dugmad (Ivan, 26.9.2026). Android nema tu traku, pa dobija
      // nas meni u mehuru.
      // iOS pre 26: native stavke stoje u traci od 44pt, pa su ~5pt iznad loga i
      // ne mogu da se spuste. Zato tamo crtamo svoj mehur, centriran u nasem redu;
      // meni dana je ipak sistemski UIMenu (`NativeDayMenu`) (Ivan, 27.9.2026).
      right={
        // Kalendar i profil, SVAKI U SVOM KRUGU (Ivan, 28.9.2026; pre toga isti dan
        // oba u jednom mehuru). Bez stakla `GlassBubble` je beo krug sa senkom.
        Platform.OS === 'ios' && !STARI_IOS ? undefined : (
          // Red ide 5pt vise KROZ RASPORED (`top`), ne `transform`-om: sa `transform`-om
          // na omotacu native meni kalendara je dodir hvatao 5pt ispod ikone (proba u
          // simulatoru, 28.9.2026).
          <View className="flex-row gap-2" style={{ top: -5 }}>
            {/* Kalendar i za besplatne; drugi dani su pod katancem (`zakljucan`).
                iOS 18: BEZ kruga, samo crna ikonica (Ivan, 29.9.2026); Android u krugu. */}
            {STARI_IOS ? (
              <View style={{ width: size.headerButton, height: size.headerButton }} className="items-center justify-center">
                <NativeDayMenu
                  systemImage="calendar"
                  povrsina={size.headerButton}
                  accessibilityLabel={`Izabran dan: ${RELATIVE[offset]}. ${menjaDan}`}
                  color={neutral.ink}
                  options={DAY_OFFSETS.map((o) => ({ value: o, title: RELATIVE[o], zakljucano: zakljucan(o) }))}
                  selected={offset}
                  onChange={setOffset}
                  onZakljucano={() => otvoriPremium()}
                />
              </View>
            ) : (
              <GlassBubble style={{ width: size.headerButton }}>
                <DayMenu today={today} offset={offset} onChange={setOffset} zakljucan={zakljucan} opis={menjaDan} />
              </GlassBubble>
            )}
            <GlassBubble style={{ width: size.headerButton }}>
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Profil"
                hitSlop={4}
                className="h-full w-full items-center justify-center active:opacity-60">
                <UserRound size={20} color={neutral.ink} />
              </Pressable>
            </GlassBubble>
          </View>
        )
      }>
      {Platform.OS === 'ios' && !STARI_IOS && (
        <Stack.Screen
          options={{
            // Kalendar i profil, SVAKI U SVOM staklenom krugu (Ivan, 28.9.2026; pre toga
            // isti dan oba u jednom mehuru). iOS 26 sam spaja susedne stavke u jedan
            // mehur dok im je `sharesBackground` ukljucen — zato je iskljucen na obe.
            // Dan je obicna ikona kalendara, bez broja (Ivan, 28.9.2026); izabran dan
            // pokazuje meni.
            // Kalendar i za besplatne: drugi dani imaju katanac (SF `lock`) i vode na
            // paywall umesto da se izaberu (Ivan, 29.9.2026).
            unstable_headerRightItems: (): NativeStackHeaderItem[] => [
              {
                type: 'menu',
                label: dayLabel(today, offset),
                icon: { type: 'sfSymbol', name: 'calendar' },
                accessibilityLabel: `Izabran dan: ${RELATIVE[offset]}. ${menjaDan}`,
                sharesBackground: false,
                menu: {
                  title: 'Dan',
                  items: DAY_OFFSETS.map((o) => zakljucan(o)
                    ? {
                      type: 'action' as const,
                      label: RELATIVE[o],
                      description: formatDate(dayAt(today, o)),
                      icon: { type: 'sfSymbol' as const, name: 'lock' as const },
                      onPress: () => otvoriPremium(),
                    }
                    : {
                      type: 'action' as const,
                      label: RELATIVE[o],
                      description: formatDate(dayAt(today, o)),
                      state: o === offset ? ('on' as const) : ('off' as const),
                      onPress: () => setOffset(o),
                    }),
                },
              },
              {
                type: 'button',
                label: 'Profil',
                icon: { type: 'sfSymbol', name: 'person' },
                accessibilityLabel: 'Profil',
                sharesBackground: false,
                onPress: () => router.push('/profile'),
              },
            ],
          }}
        />
      )}
      {/* Bez naslova i bez datuma (Ivan, 26.9.2026): dan se vidi i bira u zaglavlju. */}
      {/* Karusel malo ispod zaglavlja (Ivan, 29.9.2026: 32 -> 0 -> 16pt). */}
      <View className="pt-4" />

      {/* Sve kartice su karusel, jedna po slajdu (Ivan, 28.9.2026). Redosled je
          isti kao kad su stajale jedna ispod druge. Kartica bez sadrzaja ne dobija
          slajd — prazan slajd bi izgledao kao greska. */}
      <Carousel page={slide} onPage={setSlide} slides={slides} />
      {/* Vazduh ispod kartica: kraj kartice na dnu skrola staje tacno na vrh
          preliva, ne ispod pune sive (`useDnoKarusela`). */}
      <View style={{ height: dno.prostor }} />
    </Screen>
    <DnoPreliv visina={dno.vrh} />
    <SlideDots count={slides.length} active={Math.min(slide, slides.length - 1)} bottom={dno.tackice} />
    </View>
  );
}

/**
 * Razmak izmedju slajdova = dve margine ekrana: susedni slajd tada pocinje tacno
 * na ivici ekrana i ne viri (Ivan, 28.9.2026). Sa 12pt je virio 8pt sa strane.
 */
const SLIDE_GAP = space.screen * 2;

/**
 * Vodoravni karusel kartica. Slajd je sirok kao sadrzaj ekrana (bez margine), a
 * sam karusel izlazi do ivica ekrana da kartica pri pomeranju ne bude odsecena
 * na margini. Visina je visina NAJVISE kartice; kartice ostaju svoje visine
 * (poravnate gore), jer rastegnuta kartica sa praznim dnom izgleda kao greska.
 */
/** `veliki`: naslov slajda crn i krupan — `display`, ISTI kao naslov "Tvog dana"
 *  (Ivan, 29.9.2026) — umesto sive oznake u verzalu. */
type Slide = { key: string; label?: string; veliki?: boolean; nadnaslov?: string; node: React.ReactNode };

/** Razmak od vrha trake tabova do tackica (Ivan, 28.9.2026: 32). */
const DOTS_ABOVE_TAB_BAR = 32;
/** Visina tackica (`h-1.5`). */
const DOTS_HEIGHT = 6;
/** Pun sivi pojas iznad tackica, pre nego sto preliv pocne da bledi. */
const DNO_PUNO_IZNAD = 12;
/** Koliko preliv bledi — od pune sive do providnog. */
const DNO_BLEDI = 40;

/**
 * Mere dna pocetne: gde stoje tackice, gde pocinje preliv i koliko praznog
 * prostora skrol ostavlja ispod kartica. Jedno mesto, da se tri broja ne raziđu.
 *
 *   tackice  od dna prostora ekrana do tackica (vidi `SlideDots` za iOS/Android)
 *   vrh      od dna prostora ekrana do vrha preliva
 *   prostor  vazduh na kraju skrola, POVRH onog sto `Screen` vec dodaje za traku —
 *            kraj poslednje kartice tada staje na vrh preliva. iOS: 28, kao ranije.
 */
function useDnoKarusela() {
  const insets = useSafeAreaInsets();
  const traka = useTabBarSpace();
  const tackice = (Platform.OS === 'ios' ? insets.bottom : traka) + DOTS_ABOVE_TAB_BAR;
  const vrh = tackice + DOTS_HEIGHT + DNO_PUNO_IZNAD + DNO_BLEDI;
  return { tackice, vrh, prostor: Math.max(0, vrh - traka) };
}

/**
 * Preliv na dnu pocetne (Ivan, 28.9.2026): kartica koja klizi ispod tackica i
 * trake tabova se vise ne vidi kroz njih — dugacak slajd ("Tema perioda") je
 * tamo mesao tekst sa tackicama. Od vrha bledi 40pt, pa je puna siva boja
 * pozadine (`neutral.grouped`) od 12pt iznad tackica do dna ekrana, i iza
 * trake tabova (na iOS-u 26 staklo onda preuzima sivu, ne tekst).
 * Ide IZNAD skrola a ISPOD tackica; ne prima dodir.
 */
function DnoPreliv({ visina }: { visina: number }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[`${neutral.grouped}00`, neutral.grouped, neutral.grouped]}
      locations={[0, DNO_BLEDI / visina, 1]}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: visina }}
    />
  );
}

/**
 * Vodoravni karusel kartica. Slajd je sirok kao sadrzaj ekrana (bez margine), a
 * sam karusel izlazi do ivica ekrana da kartica pri pomeranju ne bude odsecena
 * na margini. Visina je visina NAJVISE kartice; kartice ostaju svoje visine
 * (poravnate gore), jer rastegnuta kartica sa praznim dnom izgleda kao greska.
 * Indikator NIJE ovde nego u `SlideDots`, van skrola.
 */
function Carousel({ slides, page, onPage }: { slides: Slide[]; page: number; onPage: (p: number) => void }) {
  const [width, setWidth] = React.useState(0);
  const slideWidth = width - space.screen * 2;
  const step = slideWidth + SLIDE_GAP;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (step <= 0) return;
    const p = Math.round(e.nativeEvent.contentOffset.x / step);
    if (p !== page) onPage(p);
  };

  if (slides.length === 0) return null;
  return (
    <View style={{ marginHorizontal: -space.screen }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: space.screen, gap: SLIDE_GAP, alignItems: 'flex-start' }}>
          {slides.map((s) => (
            <View key={s.key} style={{ width: slideWidth }}>
              {/* Naslov slajda ISTIM pismom kao datum na prvom slajdu — `oznaka` 12pt,
                  verzali (Ivan, 28.9.2026; ranije `display`). U istoj visini kao datum. Naslov
                  ima svaki slajd osim prvog. */}
              {/* Kratko objasnjenje IZNAD velikog naslova, istim slovima i razmakom kao
                  datum iznad naslova "Tvog dana" (Ivan, 29.9.2026). */}
              {!!s.nadnaslov && <Text variant="oznaka" className={OZNAKA_12}>{s.nadnaslov}</Text>}
              {!!s.label && (s.veliki
                ? <Text variant="display" className={s.nadnaslov ? 'mt-3 mb-5' : '-mt-2 mb-5'} accessibilityRole="header">{s.label}</Text>
                : <Text variant="oznaka" className={cn(OZNAKA_12, 'mb-3')} accessibilityRole="header">{s.label}</Text>)}
              {s.node}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Indikator slajdova — uvek na istom mestu, `DOTS_ABOVE_TAB_BAR` iznad trake
 * tabova, na svakom telefonu (Ivan, 28.9.2026). Ne zavisi od visine kartica.
 * Van skrola je, pa ne klizi; ne prima dodir.
 *
 * `bottom` se racuna od DNA PROSTORA EKRANA, ne od dna telefona. Izmereno sa
 * snimka iPhone-a (iOS 26, 28.9.2026): prostor ekrana se zavrsava 49pt iznad
 * dna telefona, a vrh plutajuce trake je jos tacno za donji safe-area umetak
 * (34pt) iznad toga. Zato na iOS-u: umetak + razmak. Na telefonu bez umetka
 * (Home dugme) umetak je 0 i traka pocinje tacno na dnu prostora.
 *
 * ANDROID je obrnuto: prostor ekrana ide do dna telefona, IZA Material trake
 * (edge-to-edge). Sa samo razmakom tackice su stajale 32dp od dna telefona,
 * sakrivene iza trake (Pixel 9 emulator, 28.9.2026). Tamo se dodaje cela
 * traka + umetak — `useTabBarSpace`, isti broj kojim `Screen` pravi mesto na dnu.
 */
function SlideDots({ count, active, bottom }: { count: number; active: number; bottom: number }) {
  if (count < 2) return null;
  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 flex-row justify-center gap-1.5"
      style={{ bottom }}
      accessible
      accessibilityLabel={`Kartica ${active + 1} od ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        // Neaktivne `bg-subtle` (#9C9C9D): `fill-strong` se na sivoj pozadini nije video (Ivan, 28.9.2026).
        <View key={i} className={cn('h-1.5 rounded-pill', i === active ? 'w-4 bg-foreground' : 'w-1.5 bg-subtle')} />
      ))}
    </View>
  );
}


type Texts = Map<string, TransitText>;

/** Koliko dana unapred i unazad se moze gledati. */
const DAY_RANGE = 2;
const RELATIVE: Record<number, string> = { [-2]: 'Prekjuče', [-1]: 'Juče', 0: 'Danas', 1: 'Sutra', 2: 'Prekosutra' };

/** Skracena imena dana, kao u iOS kalendaru. */
const DANI_KRATKO = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
/** Ponudjeni dani: dva pre, danas, dva posle. */
const DAY_OFFSETS = [-DAY_RANGE, -1, 0, 1, DAY_RANGE];
const dayAt = (today: Date, o: number) => { const d = new Date(today); d.setDate(today.getDate() + o); return d; };
/** Natpis na dugmetu: "Danas", ili skracenica dana kad je izabran drugi. */
const dayLabel = (today: Date, offset: number) => (offset === 0 ? 'Danas' : DANI_KRATKO[dayAt(today, offset).getDay()]);


/**
 * ANDROID varijanta dan-menija (iOS ima native UIMenu u traci, vidi gore).
 * Mehur sa danom: "Danas", ili skracenica dana (Pon, Uto…) kad je izabran
 * drugi dan. Dodir otvara meni ispod trake sa pet dana: dva pre, danas, dva posle.
 *
 * Meni je Modal, ne apsolutni panel u traci: traka je visoka 70pt i na iOS-u
 * dodir van roditelja ne stize do deteta, pa bi panel ispod trake bio mrtav.
 */
function DayMenu({ today, offset, onChange, zakljucan, opis }: {
  today: Date;
  offset: number;
  onChange: (o: number) => void;
  /** Dan koji besplatni ne otvara: katanac (`PREMIUM`) umesto kvacice, dodir vodi na paywall. */
  zakljucan: (o: number) => boolean;
  /** Drugi deo natpisa za citac ekrana ("Promeni dan" / "Drugi dani uz Premium"). */
  opis: string;
}) {
  const [otvoren, setOtvoren] = React.useState(false);
  const insets = useSafeAreaInsets();
  const dan = (o: number) => dayAt(today, o);
  const ponude = DAY_OFFSETS;

  return (
    <>
      {/* Ikona kalendara, u svom krugu pored profila (Ivan, 28.9.2026). */}
      <Pressable
        onPress={() => setOtvoren(true)}
        accessibilityRole="button"
        accessibilityLabel={`Izabran dan: ${RELATIVE[offset]}. ${opis}`}
        hitSlop={4}
        className="h-full w-full items-center justify-center active:opacity-60">
        <Calendar size={20} color={neutral.ink} />
      </Pressable>

      <Modal visible={otvoren} transparent animationType="fade" onRequestClose={() => setOtvoren(false)}>
        {/* Providna pozadina: dodir bilo gde zatvara meni. */}
        <Pressable className="flex-1" onPress={() => setOtvoren(false)} accessibilityLabel="Zatvori meni" />
        <View
          className="absolute overflow-hidden rounded-lg bg-background"
          style={{ top: insets.top + headerBar.height - 4, right: space.screen, width: 260, ...shadow.floating }}>
          {ponude.map((o, i) => (
            <React.Fragment key={o}>
              {i > 0 && <View className="h-px bg-border" />}
              <Pressable
                onPress={() => {
                  setOtvoren(false);
                  if (zakljucan(o)) otvoriPremium();
                  else onChange(o);
                }}
                accessibilityRole="button"
                accessibilityLabel={zakljucan(o) ? `${RELATIVE[o]}. Uz Premium` : undefined}
                accessibilityState={o === offset ? { selected: true } : undefined}
                className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:bg-fill">
                <View className="flex-1">
                  <Text variant="row">{RELATIVE[o]}</Text>
                  <Text variant="caption">{formatDate(dan(o))}</Text>
                </View>
                {zakljucan(o)
                  ? <Lock size={16} color={PREMIUM} />
                  : o === offset && <Check size={18} color={neutral.ink} strokeWidth={2.4} />}
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </Modal>
    </>
  );
}


/**
 * Do tri reda koja IMAJU tekst; tranziti bez teksta se preskacu, ne izmisljaju.
 * Ako nijedan nema tekst a kandidata ima, vracaju se prva tri BEZ recenice —
 * grupa tada pokazuje sta je napeto (ili skladno) i priznaje da tumacenja nema,
 * umesto da nestane sa ekrana.
 */
function saTekstom(list: Transit[], texts: Texts, polje: 'positive' | 'challenge') {
  const out: { t: Transit; recenica: string | null }[] = [];
  for (const t of list) {
    const recenica = texts.get(t.contentKey)?.[polje];
    if (recenica) out.push({ t, recenica });
    if (out.length === 3) break;
  }
  if (out.length === 0) return list.slice(0, 3).map((t) => ({ t, recenica: null }));
  return out;
}

type Redovi = { t: Transit; recenica: string | null }[];

function Brief({ ide, koci, vrh = null, naslov }: { ide: Redovi; koci: Redovi; vrh?: React.ReactNode; naslov?: string }) {
  // Dve grupe jedna ispod druge, razdvojene linijom od ivice do ivice: "ide ti" sa
  // plusom, "koci te" sa minusom; samo recenice, bez imena tranzita (Ivan, 26.9.2026).
  // Boje ikona su Ivanove — jedino mesto boje na kartici, ikona je mala.
  // Svaki red je za sebe dodir i vodi na tumacenje tog tranzita; strelica to kaze.
  // Naslov "Danas ukratko" je U PRVOJ kartici, istim pismom kao "Ide ti" (`h3`) —
  // Ivan, 29.9.2026; ranije sitna oznaka iznad kartica. Kartice su razmaknute 12pt,
  // isto kao od kartice "Tvog dana" iznad.
  const zaglavlje = naslov ? <Text variant="h3" className="px-4 pt-4" accessibilityRole="header">{naslov}</Text> : null;
  return (
    <View>
      {!!vrh && (
        <View className={CARD_SURFACE}>
          {zaglavlje}
          {/* Ocene imaju svoj gornji razmak (14pt); ispod naslova je dovoljno 10, kao u "Ide ti". */}
          <View className={zaglavlje ? '-mt-1' : undefined}>{vrh}</View>
        </View>
      )}
      {ide.length > 0 && (
        <View className={cn(CARD_SURFACE, !!vrh && 'mt-3')}>
          {!vrh && zaglavlje}
          <Grupa naslov="Ide ti" ikona={<Plus size={16} color={PLUS} strokeWidth={3} />} redovi={ide} />
        </View>
      )}
      {koci.length > 0 && (
        <View className={cn(CARD_SURFACE, (!!vrh || ide.length > 0) && 'mt-3')}>
          {!vrh && ide.length === 0 && zaglavlje}
          <Grupa naslov="Koči te" ikona={<Minus size={16} color={MINUS} strokeWidth={3} />} redovi={koci} />
        </View>
      )}
    </View>
  );
}

// Iste boje nosi i ton na tabu "Tranziti" (`components/ton.tsx`).
const PLUS = PLUS_BOJA;
const MINUS = MINUS_BOJA;

// Zbijeno (Ivan, 28.9.2026): manji okvir i razmak medju redovima.
function Grupa({ naslov, ikona, redovi }: { naslov: string; ikona: React.ReactNode; redovi: Redovi }) {
  return (
    <View className="px-4 py-4">
      <View className="mb-1 flex-row items-center gap-1.5">
        {ikona}
        <Text variant="h3">{naslov}</Text>
      </View>
      {redovi.map(({ t, recenica }) => (
        <Pressable
          key={t.contentKey}
          onPress={() => router.push({ pathname: '/transit', params: { key: t.contentKey } })}
          accessibilityRole="button"
          accessibilityLabel={`${recenica ?? ''} ${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}`.trim()}
          className="flex-row items-center gap-3 py-1.5 active:opacity-60">
          {recenica ? (
            <Text variant="default" className="flex-1">{recenica}</Text>
          ) : (
            // Bez teksta ostaje samo ime tranzita, sivo — jedino sto se o njemu zna.
            <Text variant="muted" className="flex-1">{t.transiting.name} {t.aspect.name} natalni {t.natal.name}</Text>
          )}
          <ChevronRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Promene na nebu: do tri planete, svaka sa prvim sledecim dogadjajem —
 * ulazak u znak, postaje retrogradna ili ponovo direktna (`lib/sky-events.ts`). Licni deo je kuca
 * od podznaka; bez vremena rodjenja se izostavlja.
 *
 * Tekstova "planeta u kuci" jos nema (ceka astrologa), pa kartice ne vode
 * nigde — samo datumi i kuca. Strelica ipak stoji na svakoj (Ivan, 27.9.2026):
 * odrediste se dodaje kad stignu tekstovi. Znakovi idu u padezu (`SIGN_CASES`): "Mars
 * ulazi u Lava", "Retrogradna Venera u Skorpiji" (Ivan, 27.9.2026).
 */
function SkyEvents({ daily, today }: { daily: PersonalDaily; today: Date }) {
  if (daily.skyEvents.length === 0) return null;
  // Kartice kao na tabu "Tranziti" (Ivan, 29.9.2026) — `promena-na-nebu.tsx`.
  return (
    <View className="gap-3">
      {daily.skyEvents.map((e) => <PromenaNaNebu key={e.planet.key} e={e} today={today} />)}
    </View>
  );
}

/** Koliko redova stane na pocetni ekran pre nego sto lista uputi u tab "Tranziti". */
const MAX_ROWS = 5;

function TransitList({ list, texts, today, chart, timeUnknown, besplatno }: {
  list: (Transit | SlowTransit)[]; texts: Texts; today: Date; chart: NatalChart; timeUnknown: boolean;
  /** Besplatni: koliko kartica je otvoreno (`BESPLATNO.temaPerioda`); ostale po imenu pod katancem. */
  besplatno?: number;
}) {
  // Rucne oznake tona astrologa, jednim upitom — isto kao na tabu "Tranziti".
  const potpis = list.map((t) => t.contentKey).join('|');
  const [tonovi, setTonovi] = React.useState<Map<string, string>>(new Map());
  React.useEffect(() => {
    if (!potpis) return;
    let otkazano = false;
    fetchTransitTones(potpis.split('|')).then((m) => { if (!otkazano) setTonovi(m); });
    return () => { otkazano = true; };
  }, [potpis]);

  if (list.length === 0) return null;
  const prikaz = list.slice(0, besplatno ?? MAX_ROWS);
  // Besplatni: ostali spori tranziti po imenu, pod katancem (do `MAX_ROWS` ukupno).
  const zakljucani = besplatno === undefined ? [] : list.slice(prikaz.length, MAX_ROWS);
  const ostalo = list.length - prikaz.length - zakljucani.length;
  const vladari = chartRulers(chart, timeUnknown);

  // Iste kartice kao na tabu "Tranziti" (Ivan, 28.9.2026): ime, naslov tumacenja,
  // ton i trajanje, ilustracija aspekta. Trajanje je isto kao na listi i na celom
  // tekstu tranzita (`trajanjeTranzita`).
  return (
    <View className="gap-3">
      {prikaz.map((t) => {
        return (
          <KarticaTranzita
            key={t.contentKey}
            red={{
              key: t.contentKey,
              transiting: { key: t.transiting.key, name: t.transiting.name, glyph: t.transiting.glyph },
              aspect: t.aspect,
              natal: t.natal,
              ruler: rulerRole(t.transiting.key, t.natal.key, vladari),
            }}
            ton={transitTone(t.transiting.key, t.aspect.key, t.natal.key, tonovi.get(t.contentKey)).tone}
            naslov={texts.get(t.contentKey)?.title ?? ''}
            loading={false}
            trajanje={trajanjeTekst(trajanjeTranzita(t, today))}
          />
        );
      })}
      <ZakljucaniRedovi
        redovi={zakljucani.map((t) => ({
          key: t.contentKey,
          naslov: `${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}`,
          ispod: trajanjeTekst(trajanjeTranzita(t, today)),
        }))}
      />
      {ostalo > 0 && besplatno === undefined && (
        <Pressable onPress={() => router.navigate('/daily')} accessibilityRole="link" className="py-1 active:opacity-60">
          <Text variant="muted">Još {ostalo} u Tranzitima</Text>
        </Pressable>
      )}
    </View>
  );
}
