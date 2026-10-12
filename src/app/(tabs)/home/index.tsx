import * as React from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, Stack, router } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Screen, VRH_ANDROID } from '@/components/screen';
import { KapsuleRed } from '@/components/ui/kapsule';
import { PricaDugme } from '@/components/prica/ulaz';
import { GlassBubble } from '@/components/ui/glass-button';
import { buildPersonalDaily, formatDate, formatDatumKratko, type PersonalDaily, type SlowTransit } from '@/lib/horoscope';
import { Calendar, Check, Lock, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { KrugZivota } from '@/components/krug-zivota';
import { OblastKartica } from '@/components/oblast-kartica';
import { KarticaTranzita } from '@/components/tranziti-lista';
import { chartRulers, rulerRole } from '@/lib/rulers';
import { transitTone } from '@/lib/tone';
import { trajanjeTekst, trajanjeTranzita } from '@/lib/oblasti';
import type { NatalChart } from '@/lib/natal';
import { useKrug } from '@/lib/use-krug';
import { recenicaOblasti } from '@/lib/krug-tekst';
import { KRUG, type KrugKey } from '@/lib/krug-config';
import { useDanas } from '@/store/danas';
import { dayKey, type Transit } from '@/lib/transits';
import { cn } from '@/lib/utils';
import { STARI_IOS } from '@/lib/platform';
import { NativeDayMenu } from '@/components/native-day-menu';
import { useT, type Recnik } from '@/i18n';

/** Pregled dana — izlog, ne sadrzaj. Pun tekst je u tabu "Tranziti". */
export default function Home() {
  const t = useT();
  const p = t.danas.pocetna;
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
  const menjaDan = smeDrugiDan ? p.promeniDan : p.drugiDaniUzPremium;
  const [izabranDan, setOffset] = React.useState(0);
  const offset = smeDrugiDan ? izabranDan : 0;
  // Nov dan: nazad na "danas" — jucerasnje "sutra" ne sme da postane prekosutra.
  React.useEffect(() => { setOffset(0); }, [today]);
  // Dnevnici prikaza pripadaju nalogu (`store/tvoj-dan-log.ts`).
  const userId = useAuthStore((s) => s.user?.id ?? null);
  // Tab strane (Ivan, 29.9.2026: umesto karusela — stakleni tabovi gore, izabran lila).
  const [tab, setTab] = React.useState<TabPocetne>('danas');
  const izaberiTab = (t: TabPocetne) => setTab(t);
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
  // KRUG ZIVOTA (Ivan, 8.10.2026): osam oblasti, stanje iz proseka tri dana, tackice su danasnje.
  // Zamenjuje "Danas ukratko" (ocene cetiri oblasti i "Ide ti / Koci te"). Besplatni: potpuno otvorene
  // su oblasti iz `BESPLATNO.krug`, ostale imaju katanac (stanje i tackice vide svi).
  const { rez: krug } = useKrug(resolved, date);
  const [izabranaOblast, setIzabranaOblast] = React.useState<KrugKey | null>(null);
  // Recenice za danas: kratki tekst najjaceg tranzita svake oblasti (`lib/krug-tekst.ts`, privremeno).
  const krugKljucevi = React.useMemo(() => {
    const k = new Set<string>();
    for (const o of krug?.oblasti ?? []) {
      for (const s of o.stavke.slice(0, 3)) if (s.red.kind === 'tranzit') k.add(s.red.key);
    }
    return [...k];
  }, [krug]);
  const { texts: krugTekstovi } = useTransitTexts(krugKljucevi);

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  // Sadrzaj svakog taba — redosled isti kao nekadasnji slajdovi karusela.
  // Tab bez sadrzaja kaze to recenicom; tabovi se ne sklanjaju (red bi skakao).
  const sadrzaj: Record<TabPocetne, React.ReactNode> = {
    // Krug zivota (`components/krug-zivota.tsx`), ispod njega kartica izabrane oblasti, pa "Tvoj dan"
    // (`lib/tvoj-dan.ts`). Prica dana je u sredini kruga, ne vise oko planete "Tvog dana".
    danas: krug || tvojDan ? (
      <View>
        {krug && (
          <>
            {/* Datum sitnim slovima, ispod njega naslov krupnim crnim ali manjim nego na tabu Mesec (Ivan, 12.10.2026). */}
            <Text variant="oznaka" className={OZNAKA_12}>{formatDatumKratko(date)}</Text>
            <Text variant="display" className="mb-4 mt-1" accessibilityRole="header">
              {offset === 0 ? t.krug.naslov : t.krug.naslovDrugiDan}
            </Text>
            {/* Nista nije izabrano dok se ne dodirne; detalji su u staklenoj kartici uz isecak (Ivan, 12.10.2026). */}
            <KrugZivota
              rez={krug}
              izabrana={izabranaOblast}
              onIzbor={setIzabranaOblast}
              otkljucane={premium ? undefined : BESPLATNO.krug}
              detalj={(o) => (
                <OblastKartica
                  oblast={o}
                  otvorena={premium || BESPLATNO.krug.includes(o.def.key)}
                  recenica={recenicaOblasti(o, krugTekstovi)}
                  onSaznaj={() => router.push({ pathname: '/oblast', params: { k: o.def.key, day: dayKey(date) } })}
                  onZatvori={() => setIzabranaOblast(null)}
                />
              )}
            />
          </>
        )}
        {tvojDan && (
          <View className={krug ? 'mt-3' : undefined}>
            <TvojDanCard pick={tvojDan} date={date} isToday={offset === 0} chart={resolved.chart} aktivan={tab === 'danas'} />
          </View>
        )}
      </View>
    ) : <Prazno>{p.nemaTranzitaDana}</Prazno>,
    // Lunarni kalendar je besplatan za sve.
    mesec: <MesecDanasCard date={date} offset={offset} chart={resolved.chart} timeUnknown={resolved.timeUnknown} name={resolved.profile.name} excludeKey={tvojDan?.contentKey ?? null} />,
    // Sledece promene na nebu i kuca u koju ulaze.
    promene: (
      <Odeljak nadnaslov={p.promeneNadnaslov} naslov={p.promeneNaslov}>
        {daily.skyEvents.length > 0
          ? <SkyEvents daily={daily} today={date} />
          : <Prazno>{p.nemaPromena}</Prazno>}
      </Odeljak>
    ),
    // Spori tranziti — tema perioda. Svi brzi tranziti su u tabu "Tranziti".
    // Naziv i opis isti kao na paywallu (UX recenzija 1.10.2026).
    teme: (
      <Odeljak nadnaslov={p.temeNadnaslov} naslov={p.temeNaslov}>
        {daily.bySpeed.slow.length > 0
          ? <TransitList list={daily.bySpeed.slow} texts={texts} today={date} chart={resolved.chart} timeUnknown={resolved.timeUnknown} besplatno={premium ? undefined : BESPLATNO.temaPerioda} />
          : <Prazno>{p.nemaTema}</Prazno>}
      </Odeljak>
    ),
  };

  return (
    <View style={{ flex: 1 }}>
    {/* Pun logo (ASTRO-krug-SHOP) je sacuvan pod git tagom `pun-logo-na-pocetnoj`; vraca se sa `<Logo full />`. */}
    <Screen
      label={<Logo mirno />}
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
                  accessibilityLabel={p.izabranDan(relativ(t, offset), menjaDan)}
                  color={neutral.ink}
                  options={DAY_OFFSETS.map((o) => ({ value: o, title: relativ(t, o), zakljucano: zakljucan(o) }))}
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
                accessibilityLabel={p.profil}
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
                label: dayLabel(t, today, offset),
                icon: { type: 'sfSymbol', name: 'calendar' },
                accessibilityLabel: p.izabranDan(relativ(t, offset), menjaDan),
                sharesBackground: false,
                menu: {
                  title: p.dan,
                  items: DAY_OFFSETS.map((o) => zakljucan(o)
                    ? {
                      type: 'action' as const,
                      label: relativ(t, o),
                      description: formatDate(dayAt(today, o)),
                      icon: { type: 'sfSymbol' as const, name: 'lock' as const },
                      onPress: () => otvoriPremium(),
                    }
                    : {
                      type: 'action' as const,
                      label: relativ(t, o),
                      description: formatDate(dayAt(today, o)),
                      state: o === offset ? ('on' as const) : ('off' as const),
                      onPress: () => setOffset(o),
                    }),
                },
              },
              {
                type: 'button',
                label: p.profil,
                icon: { type: 'sfSymbol', name: 'person' },
                accessibilityLabel: p.profil,
                sharesBackground: false,
                onPress: () => router.push('/profile'),
              },
            ],
          }}
        />
      )}
      {/* Bez naslova i bez datuma (Ivan, 26.9.2026): dan se vidi i bira u zaglavlju. */}
      {/* Tabovi strane ispod zaglavlja (Ivan, 29.9.2026, umesto karusela): staklene
          kapsule sirine natpisa, izabrana svetlo lila — kao oblasti na "Mesec danas".
          Na promenu taba sadrzaj ulazi sa strane taba, BEZ pretapanja: u sadrzaju ima
          stakla, a providan roditelj ga kvari na iOS-u (`ui/kapsule.tsx`). */}
      {/* Red ostaje ISPOD preliva, i na Androidu: neizabrane kapsule su providne, sa
          nijansom preliva (Ivan, 30.9.2026 — podignute iznad preliva, cisto bele, probane
          istog dana i vracene: "ipak da budu providni"). */}
      <View className="pt-4">
        <KapsuleRed tabovi pocetak={<PricaDugme datum={date} />} stavke={tabovi(t)} izabrana={tab} onIzbor={izaberiTab} />
      </View>
      <Animated.View key={tab} entering={ODOZDO} className="pt-7">
        {sadrzaj[tab]}
      </Animated.View>
    </Screen>
    </View>
  );
}

type TabPocetne = 'danas' | 'mesec' | 'promene' | 'teme';
const tabovi = (t: Recnik): { key: TabPocetne; label: string }[] => [
  { key: 'danas', label: t.danas.pocetna.tabTvojDan },
  { key: 'mesec', label: t.danas.pocetna.tabMesec },
  { key: 'promene', label: t.danas.pocetna.tabPromene },
  { key: 'teme', label: t.danas.pocetna.tabTeme },
];

/** Promena taba: sadrzaj ulazi sa strane, bez providnosti (staklo), kao listanje. */
/** Sadrzaj taba ulazi ODOZDO NAGORE uz pretapanje (Ivan, 29.9.2026; do tada zdesna/sleva po smeru taba). */
const ODOZDO = FadeInDown.duration(280);

/**
 * Naslov taba "Promene" i "Teme": veliki naslov, pa ispod kratko objasnjenje istim
 * slovima kao datum na "Tvom danu" (Ivan, 29.9.2026).
 */
function Odeljak({ nadnaslov, naslov, children }: { nadnaslov: string; naslov: string; children: React.ReactNode }) {
  return (
    <View>
      {/* Prvo veliki naslov, pa sitno objasnjenje ispod (Ivan, 29.9.2026). */}
      <Text variant="display" accessibilityRole="header">{naslov}</Text>
      <Text variant="oznaka" className={cn(OZNAKA_12, 'mb-7 mt-2')}>{nadnaslov}</Text>
      {children}
    </View>
  );
}

/** Tab bez sadrzaja: jedna tiha recenica umesto prazne strane. */
function Prazno({ children }: { children: string }) {
  return <Text variant="muted" className="mt-2">{children}</Text>;
}

type Texts = Map<string, TransitText>;

/** Koliko dana unapred i unazad se moze gledati. */
const DAY_RANGE = 2;
/** "Juče", "Danas", "Sutra"… za pomeraj -2..2. */
const relativ = (t: Recnik, o: number) => t.danas.pocetna.relativniDani[o + DAY_RANGE];

/** Ponudjeni dani: dva pre, danas, dva posle. */
const DAY_OFFSETS = [-DAY_RANGE, -1, 0, 1, DAY_RANGE];
const dayAt = (today: Date, o: number) => { const d = new Date(today); d.setDate(today.getDate() + o); return d; };
/** Natpis na dugmetu: "Danas", ili skracenica dana kad je izabran drugi ("Pon", kao u iOS kalendaru). */
const dayLabel = (t: Recnik, today: Date, offset: number) =>
  (offset === 0 ? relativ(t, 0) : t.gramatika.veliko(t.datum.daniKratko[dayAt(today, offset).getDay()]));


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
  const t = useT();
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
        accessibilityLabel={t.danas.pocetna.izabranDan(relativ(t, offset), opis)}
        hitSlop={4}
        className="h-full w-full items-center justify-center active:opacity-60">
        <Calendar size={20} color={neutral.ink} />
      </Pressable>

      <Modal visible={otvoren} transparent animationType="fade" onRequestClose={() => setOtvoren(false)}>
        {/* Providna pozadina: dodir bilo gde zatvara meni. */}
        <Pressable className="flex-1" onPress={() => setOtvoren(false)} accessibilityLabel={t.danas.pocetna.zatvoriMeni} />
        <View
          className="absolute overflow-hidden rounded-lg bg-background"
          style={{ top: insets.top + VRH_ANDROID + headerBar.height - 4, right: space.screen, width: 260, ...shadow.floating }}>
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
                accessibilityLabel={zakljucan(o) ? t.danas.pocetna.danUzPremium(relativ(t, o)) : undefined}
                accessibilityState={o === offset ? { selected: true } : undefined}
                className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:bg-fill">
                <View className="flex-1">
                  <Text variant="row">{relativ(t, o)}</Text>
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
 * Promene na nebu: do tri planete, svaka sa prvim sledecim dogadjajem —
 * ulazak u znak, postaje retrogradna ili ponovo direktna (`lib/sky-events.ts`). Licni deo je kuca
 * od podznaka; bez vremena rodjenja se izostavlja.
 *
 * Tekstova "planeta u znaku" jos nema (ceka astrologa, `sky-events.ts`), pa kartice ne vode
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
  const tx = useT();
  // Rucne oznake tona astrologa, jednim upitom — isto kao na tabu "Tranziti".
  const potpis = list.map((t) => t.contentKey).join('|');
  // Naslov kao na tabu "Tranziti": prvo iz DUGE verzije, pa iz kratke. Do 1.10.2026 je
  // ovde stajao naslov kratke, pa je isti tranzit na dva taba imao dva razlicita naslova.
  const kljucevi = React.useMemo(() => list.map((t) => t.contentKey), [potpis]); // eslint-disable-line react-hooks/exhaustive-deps
  const { texts: duge } = useTransitTexts(kljucevi, 'long');
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
            naslov={duge.get(t.contentKey)?.title || texts.get(t.contentKey)?.title || ''}
            loading={false}
            trajanje={trajanjeTekst(trajanjeTranzita(t, today))}
          />
        );
      })}
      <ZakljucaniRedovi
        redovi={zakljucani.map((t) => ({
          key: t.contentKey,
          naslov: tx.danas.tranzit.imeNatalni(t.transiting.name, t.aspect.name, t.natal.name),
          ispod: trajanjeTekst(trajanjeTranzita(t, today)),
        }))}
      />
      {ostalo > 0 && besplatno === undefined && (
        <Pressable onPress={() => router.navigate('/daily')} accessibilityRole="link" className="py-1 active:opacity-60">
          <Text variant="muted">{tx.danas.pocetna.josUTranzitima(ostalo)}</Text>
        </Pressable>
      )}
    </View>
  );
}
