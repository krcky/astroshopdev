import * as React from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { Redirect, Stack, router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { GlassIconButton } from '@/components/ui/glass-button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Group, ListRow } from '@/components/ui/list';
import { buildPersonalDaily, formatDate, formatTime, formatUntil, MESECI_KRATKO, type PersonalDaily, type SlowTransit } from '@/lib/horoscope';
import { Check, ChevronDown, ChevronRight, Minus, Plus, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headerBar, neutral, shadow, space } from '@/theme/tokens';
import { Logo } from '@/components/logo';
import { MoonDisc } from '@/components/moon-disc';
import { moonState, moonSignAt, formatIllumination, LUNAR_AREAS, type LunarArea } from '@/lib/moon';
import { useTransitTexts, type TransitText } from '@/lib/transit-texts';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { useHeroLog } from '@/store/hero-log';
import { dayKey, briefBucket, heroHistoryFor, type BriefBucket, type Transit } from '@/lib/transits';
import { cn } from '@/lib/utils';
import { STARI_IOS } from '@/lib/platform';
import { NativeDayMenu } from '@/components/native-day-menu';
import { SIGN_CASES } from '@/lib/zodiac';

/** Pregled dana — izlog, ne sadrzaj. Pun tekst je u tabu "Tranziti". */
export default function Home() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();

  const today = React.useMemo(() => new Date(), []);
  // Pomeraj dana: -2..2. Ceo ekran (Hero, sazetak, liste) se racuna za izabrani dan.
  const [offset, setOffset] = React.useState(0);
  const date = React.useMemo(() => {
    const d = new Date(today); d.setDate(today.getDate() + offset); return d;
  }, [today, offset]);
  const heroHistory = useHeroLog((s) => s.shown);
  // Za drugi dan dnevnik se odigra kao da je aplikacija otvarana svaki dan
  // (`heroHistoryFor`) — inace bi pregled juce/sutra ponavljao danasnji Hero.
  const daily = React.useMemo(
    () => (resolved
      ? buildPersonalDaily(resolved, date, heroHistoryFor(resolved.chart, date, heroHistory, resolved.timeUnknown, today))
      : null),
    [resolved, date, heroHistory, today]
  );

  // Jedan upit za tekstove svih danasnjih tranzita — Hero, sazetak i liste
  // su podskupovi iste liste.
  // Mesecev tranzit kartice ne mora biti u `entries`: egzaktan je negde tokom
  // dana, a `entries` su za trenutak otvaranja — zato se dodaje posebno.
  const kljucevi = React.useMemo(() => {
    if (!daily) return [];
    const k = daily.entries.map((e) => e.transit.contentKey);
    const mesec = daily.moonDay.strongest?.contentKey;
    return mesec && !k.includes(mesec) ? [...k, mesec] : k;
  }, [daily]);
  const { texts, loading: textsLoading } = useTransitTexts(kljucevi);

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  return (
    // Pun logo (ASTRO-krug-SHOP) je sacuvan pod git tagom `pun-logo-na-pocetnoj`; vraca se sa `<Logo full />`.
    <Screen
      label={<Logo />}
      // Gore desno: dan-meni i profil. Na iOS-u su to NATIVE stavke trake
      // (`unstable_headerRightItems` dole): UIMenu sa zamucenjem na dodir,
      // Liquid Glass dugmad (Ivan, 26.9.2026). Android nema tu traku, pa dobija
      // nas meni i stakleni krug.
      // iOS pre 26: native stavke stoje u traci od 44pt, pa su ~5pt iznad loga i
      // ne mogu da se spuste. Zato tamo crtamo svoje — goli natpis i ikona u
      // `ZAGLAVLJE_STARI_IOS`, centrirani u nasem redu; meni dana je ipak
      // sistemski UIMenu (`NativeDayMenu`) (Ivan, 27.9.2026).
      right={
        STARI_IOS ? (
          <View className="flex-row items-center gap-4" style={{ transform: [{ translateY: -5 }] }}>
            <NativeDayMenu
              label={dayLabel(today, offset)}
              color={ZAGLAVLJE_STARI_IOS}
              options={DAY_OFFSETS.map((o) => ({ value: o, title: RELATIVE[o] }))}
              selected={offset}
              onChange={setOffset}
            />
            <Pressable onPress={() => router.push('/profile')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Profil" className="active:opacity-60">
              <UserRound size={24} color={ZAGLAVLJE_STARI_IOS} />
            </Pressable>
          </View>
        ) : Platform.OS === 'ios' ? undefined : (
          <View className="flex-row items-center gap-2" style={{ transform: [{ translateY: -5 }] }}>
            <DayMenu today={today} offset={offset} onChange={setOffset} />
            <GlassIconButton onPress={() => router.push('/profile')} accessibilityLabel="Profil">
              <UserRound size={20} color={neutral.ink} />
            </GlassIconButton>
          </View>
        )
      }>
      {Platform.OS === 'ios' && !STARI_IOS && (
        <Stack.Screen
          options={{
            unstable_headerRightItems: () => [
              {
                type: 'menu',
                label: dayLabel(today, offset),
                icon: { type: 'sfSymbol', name: 'chevron.down' },
                changesSelectionAsPrimaryAction: true,
                menu: {
                  title: 'Dan',
                  items: DAY_OFFSETS.map((o) => ({
                    type: 'action' as const,
                    label: RELATIVE[o],
                    description: formatDate(dayAt(today, o)),
                    state: o === offset ? ('on' as const) : ('off' as const),
                    onPress: () => setOffset(o),
                  })),
                },
              },
              {
                type: 'button',
                label: 'Profil',
                icon: { type: 'sfSymbol', name: 'person' },
                accessibilityLabel: 'Profil',
                onPress: () => router.push('/profile'),
              },
            ],
          }}
        />
      )}
      {/* Bez naslova i bez datuma (Ivan, 26.9.2026): dan se vidi i bira u zaglavlju. */}
      <View className="pt-4" />

      {/* Tranzit dana — Hero. Sta ulazi bira waterfall u `transits.ts`. */}
      <Hero daily={daily} date={date} isToday={offset === 0} texts={texts} loading={textsLoading} />

      {/* Ukratko — ide ti / koci te. Sta ulazi bira `pickBrief`. */}
      <Brief daily={daily} texts={texts} isToday={offset === 0} />

      {/* Mesec — faza, znak, najjaci Mesecev tranzit dana. Posle sazetka (Ivan, 27.9.2026). */}
      <MoonCard daily={daily} texts={texts} date={date} offset={offset} />

      {/* Sledece promene na nebu i kuca u koju ulaze (Ivanov plan). */}
      <SkyEvents daily={daily} today={date} />

      {/* Spori tranziti — tema perioda. "Ovih dana" (brzi) je izbacen 27.9.2026
          (Ivan): ponavljao je sazetak, a Mesecevi tranziti su presli u karticu Mesec.
          Svi brzi tranziti ostaju u tabu "Tranziti". */}
      <TransitList
        naslov="Tema perioda"
        list={daily.bySpeed.slow}
        texts={texts}
        today={date}
      />
    </Screen>
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

/** Boja natpisa dana i ikone profila u zaglavlju na iOS-u pre 26 (Ivan, 27.9.2026). */
const ZAGLAVLJE_STARI_IOS = '#403F98';

/**
 * ANDROID varijanta dan-menija (iOS ima native UIMenu u traci, vidi gore).
 * Mehur sa danom: "Danas", ili skracenica dana (Pon, Uto…) kad je izabran
 * drugi dan. Dodir otvara meni ispod trake sa pet dana: dva pre, danas, dva posle.
 *
 * Meni je Modal, ne apsolutni panel u traci: traka je visoka 70pt i na iOS-u
 * dodir van roditelja ne stize do deteta, pa bi panel ispod trake bio mrtav.
 */
function DayMenu({ today, offset, onChange }: { today: Date; offset: number; onChange: (o: number) => void }) {
  const [otvoren, setOtvoren] = React.useState(false);
  const insets = useSafeAreaInsets();
  const dan = (o: number) => dayAt(today, o);
  const natpis = dayLabel(today, offset);
  const ponude = DAY_OFFSETS;

  return (
    <>
      {/* Goli natpis, bez mehura (Ivan, 27.9.2026). Visina ostaje kao kod dugmeta
          zaglavlja, da dodirna povrsina ne spadne ispod 40pt. */}
      <Pressable
        onPress={() => setOtvoren(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Izabran dan: ${natpis}. Promeni dan`}
        className="h-header-button flex-row items-center gap-1 px-1 active:opacity-60">
        <Text variant="chip">{natpis}</Text>
        <ChevronDown size={16} color={neutral.inkMuted} strokeWidth={2.4} />
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
                onPress={() => { onChange(o); setOtvoren(false); }}
                accessibilityRole="button"
                accessibilityState={o === offset ? { selected: true } : undefined}
                className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:bg-fill">
                <View className="flex-1">
                  <Text variant="row">{RELATIVE[o]}</Text>
                  <Text variant="caption">{formatDate(dan(o))}</Text>
                </View>
                {o === offset && <Check size={18} color={neutral.ink} strokeWidth={2.4} />}
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </Modal>
    </>
  );
}


/** Naslov Hero kartice — van skale iz tokens.ts, po Ivanovoj meri. */
const HERO_TITLE = 'text-[24px] leading-[30px] font-semibold tracking-[-0.3px]';
/** Prazan prostor za ilustraciju tranzita dana, dok ilustracije ne stignu. */
const ILLUSTRATION_HEIGHT = 150;

/**
 * Hero: naslov tumacenja krupno, tekst, pa sitno koji je to tranzit.
 * Bez natpisa prioriteta i bez glifova (Ivan, 26.9.2026) — prioritet i razlog
 * ostaju u podacima (`hero.priority`, `hero.reason`) za dnevnik i ilustraciju.
 */
function Hero({ daily, date, isToday, texts, loading }: {
  daily: PersonalDaily; date: Date; isToday: boolean; texts: Texts; loading: boolean;
}) {
  const { hero } = daily;
  const t = hero.transit;
  const record = useHeroLog((s) => s.record);

  // Upis u dnevnik — od sutra je ovaj tranzit na pauzi 7 dana (osim na vrhuncu).
  // SAMO za danasnji dan: pregled sutrasnjice je predvidjanje i ne sme da "potrosi"
  // sutrasnji Hero pre nego sto sutra svane.
  React.useEffect(() => {
    if (t && isToday) record(t.contentKey, dayKey(date));
  }, [t, isToday, record, date]);

  // Bez tranzita u orbisu Hero-a nema. Mesec ima svoju karticu i ne ulazi ovde.
  if (hero.priority === 4 || !t) return null;
  const tekst = texts.get(t.contentKey);
  const ime = `${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}`;

  return (
    <Pressable
      onPress={() => router.push('/daily')}
      accessibilityRole="button"
      accessibilityLabel={`Tranzit dana: ${ime}`}
      className={cn(CARD_SURFACE, 'p-5 active:opacity-60')}>
      {/* Ime tranzita na vrhu, pa mesto za ilustraciju (150pt; logika ilustracije
          je kod drugog agenta), pa tumacenje. Raspored: Ivan, 26.9.2026. */}
      <Text variant="caption">{ime}</Text>
      <View style={{ height: ILLUSTRATION_HEIGHT }} />
      {tekst ? (
        <>
          {/* Naslov tumacenja je glavna stvar na kartici: 24/30 polucrn (Ivan, 26.9.2026). */}
          {!!tekst.title && <Text className={HERO_TITLE}>{tekst.title}</Text>}
          <Text variant="body" className="mt-2" numberOfLines={3}>{tekst.body}</Text>
        </>
      ) : loading ? (
        <Text variant="muted">…</Text>
      ) : (
        // Bez teksta (ASC, MC, rupe u korpusu) ostaje samo racunato ime — ne izmislja se.
        <Text className={HERO_TITLE}>{ime}</Text>
      )}
      {/* Jedino primarno dugme na ekranu (pravilo: nikad dva). Vodi na detaljno
          tumacenje bas ovog tranzita; zakljucan pristup resava taj ekran. */}
      <Button
        size="compact"
        // Po Ivanovoj meri (26.9.2026): tekst 16, razmak 10 gore-dole i 20 levo-desno,
        // visina iz sadrzaja umesto fiksnih 46.
        className="mt-5 h-auto self-start px-5 py-[10px]"
        onPress={() => router.push({ pathname: '/transit', params: { key: t.contentKey } })}>
        <Text className="text-[16px] leading-[20px]">Saznaj više</Text>
      </Button>
    </Pressable>
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

/**
 * Rezerva na Hero: kad grupa ostane bez ijedne recenice (kao kad je jedini
 * napet tranzit dana otisao u Hero, a ostali su na ASC/MC bez teksta), uzme se
 * recenica Hero tranzita ako pripada toj grupi. Jeste ponavljanje, ali kratko i
 * samo u takvim danima. Redovi bez teksta ostaju ispod, do tri ukupno.
 */
function grupaSaRezervom(
  list: Transit[], polje: 'positive' | 'challenge', bucket: BriefBucket,
  hero: Transit | null, texts: Texts
) {
  const redovi = saTekstom(list, texts, polje);
  if (redovi.some((r) => r.recenica)) return redovi;
  const recenica = hero && briefBucket(hero) === bucket ? texts.get(hero.contentKey)?.[polje] : undefined;
  if (!recenica) return redovi;
  return [{ t: hero!, recenica }, ...redovi].slice(0, 3);
}

function Brief({ daily, texts, isToday }: { daily: PersonalDaily; texts: Texts; isToday: boolean }) {
  const hero = daily.hero.transit;
  const ide = grupaSaRezervom(daily.brief.ide, 'positive', 'ide', hero, texts);
  const koci = grupaSaRezervom(daily.brief.koci, 'challenge', 'koci', hero, texts);
  if (ide.length === 0 && koci.length === 0) return null;

  // Dve grupe jedna ispod druge, razdvojene linijom od ivice do ivice: "ide ti" sa
  // plusom, "koci te" sa minusom; samo recenice, bez imena tranzita (Ivan, 26.9.2026).
  // Boje ikona su Ivanove — jedino mesto boje na kartici, ikona je mala.
  return (
    <View className="mt-9">
      <Text variant="label" className="mb-3">{isToday ? 'Danas ukratko' : 'Ukratko'}</Text>
      {/* Svaki red je za sebe dodir i vodi na tumacenje tog tranzita; strelica to kaze. */}
      <View className={CARD_SURFACE}>
        {ide.length > 0 && <Grupa naslov="Ide ti" ikona={<Plus size={18} color={PLUS} strokeWidth={3} />} redovi={ide} />}
        {ide.length > 0 && koci.length > 0 && <View className="h-px bg-border" />}
        {koci.length > 0 && <Grupa naslov="Koči te" ikona={<Minus size={18} color={MINUS} strokeWidth={3} />} redovi={koci} />}
      </View>
    </View>
  );
}

const PLUS = '#7ACCEA';
const MINUS = '#F8B3C3';

function Grupa({ naslov, ikona, redovi }: { naslov: string; ikona: React.ReactNode; redovi: { t: Transit; recenica: string | null }[] }) {
  return (
    <View className="p-5">
      <View className="mb-2 flex-row items-center gap-1.5">
        {ikona}
        <Text variant="h3">{naslov}</Text>
      </View>
      {redovi.map(({ t, recenica }) => (
        <Pressable
          key={t.contentKey}
          onPress={() => router.push({ pathname: '/transit', params: { key: t.contentKey } })}
          accessibilityRole="button"
          accessibilityLabel={`${recenica ?? ''} ${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}`.trim()}
          className="flex-row items-center gap-3 py-2 active:opacity-60">
          {recenica ? (
            <Text variant="default" className="flex-1">{recenica}</Text>
          ) : (
            // Bez teksta ostaje samo ime tranzita, sivo — jedino sto se o njemu zna.
            <Text variant="muted" className="flex-1">{t.transiting.name} {t.aspect.name} natalni {t.natal.name}</Text>
          )}
          <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Kartica Mesec: crtez Meseca kakav je sada, faza, procenat i znak; ispod pet
 * oblasti lunarnog kalendara kao tabovi (emoji) i jedna recenica izabrane, pa najjaci Mesecev tranzit dana (`moonDay` u
 * `transits.ts`) sa satom. Gornji deo otvara ekran Mesec (`app/moon.tsx`) gde je
 * sve ostalo: element, deo biljke, lunarni dan, oblasti, svi Mesecevi tranziti.
 * Bez kruzica sa podacima na pocetnoj (Ivan, 27.9.2026).
 *
 * Tekstova za Mesec kao tranzitnu planetu jos NEMA (0/50, ceka astrologa), a ni
 * lunarnog kalendara (ceka aktuelne fajlove). Red tranzita postaje dodir ka
 * tumacenju tek kad tekst postoji; umesto saveta stoji da jos nisu stigli.
 */
function MoonCard({ daily, texts, date, offset }: { daily: PersonalDaily; texts: Texts; date: Date; offset: number }) {
  const { moon, moonDay } = daily;
  const t = moonDay.strongest;
  const tekst = t ? texts.get(t.contentKey) : undefined;
  const ime = t ? `${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}` : '';
  const stanje = React.useMemo(() => moonState(date), [date]);
  const znak = moonSignAt(moonDay, date);
  const [oblast, setOblast] = React.useState<LunarArea>('ljubav');
  // Saveti stizu iz baze kad Ivan posalje aktuelni lunarni kalendar; do tada nema recenice.
  const recenica: string | null = null;
  const otvori = () => router.push({ pathname: '/moon', params: { day: String(offset), area: oblast } });

  return (
    <View className="mt-9">
      <Text variant="label" className="mb-3">Mesec</Text>
      <View className={CARD_SURFACE}>
        <Pressable
          onPress={otvori}
          accessibilityRole="button"
          accessibilityLabel={`${moon.phase}, ${formatIllumination(stanje.illumination)} osvetljen, u ${SIGN_CASES[znak.key].loc}. Otvori Mesec`}
          className="flex-row items-center gap-4 p-5 active:opacity-60">
          <MoonDisc angle={stanje.angle} size={56} />
          <View className="flex-1">
            <Text variant="h3">{moon.phase}</Text>
            <Text variant="muted">{formatIllumination(stanje.illumination)} osvetljen · u {SIGN_CASES[znak.key].loc}</Text>
          </View>
          <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />
        </Pressable>

        {/* Oblasti kao tabovi: ikonica menja recenicu ispod (Ivan, 27.9.2026). Prva je
            Ljubav. Ekran Mesec se otvara na izabranoj oblasti. */}
        <View className="h-px bg-border" />
        <View className="px-5 pt-4">
          <View className="flex-row justify-between">
            {LUNAR_AREAS.map((a) => {
              const aktivna = a.key === oblast;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => setOblast(a.key)}
                  accessibilityRole="tab"
                  accessibilityLabel={a.name}
                  accessibilityState={{ selected: aktivna }}
                  hitSlop={6}
                  className={cn('h-11 w-11 items-center justify-center rounded-full', aktivna ? 'bg-fill' : 'opacity-40')}>
                  <Text className="text-[22px] leading-[28px]">{a.emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {/* Recenica se samo cita — ekran Mesec otvara jedino gornji deo (Ivan, 27.9.2026). */}
        <View className="px-5 pb-5 pt-3">
          {recenica ? (
            <Text variant="default">{recenica}</Text>
          ) : (
            <Text variant="muted">Saveti iz lunarnog kalendara još nisu stigli.</Text>
          )}
        </View>
        {t && (
          <>
            <View className="h-px bg-border" />
            <Pressable
              disabled={!tekst}
              onPress={() => router.push({ pathname: '/transit', params: { key: t.contentKey } })}
              accessibilityRole={tekst ? 'button' : undefined}
              accessibilityLabel={`${tekst?.title ?? ''} ${ime}, tačan u ${formatTime(t.exactAt)}`.trim()}
              className="flex-row items-center gap-3 p-5 active:opacity-60">
              <View className="flex-1">
                <Text variant="caption">Za tebe danas</Text>
                <Text variant="row" className="mt-1">{tekst?.title || ime}</Text>
                {!!tekst?.body && <Text variant="body" className="mt-1" numberOfLines={2}>{tekst.body}</Text>}
                <Text variant="muted" className="mt-1">
                  {[tekst?.title ? ime : null, `tačan u ${formatTime(t.exactAt)}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {tekst && <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Promene na nebu: do tri planete, svaka sa prvim sledecim dogadjajem —
 * ulazak u znak, postaje retrogradna ili ponovo direktna (`lib/sky-events.ts`). Licni deo je kuca
 * od podznaka; bez vremena rodjenja se izostavlja.
 *
 * Tekstova "planeta u kuci" jos nema (ceka astrologa), pa redovi ne vode
 * nigde — samo datumi i kuca. Znakovi idu u padezu (`SIGN_CASES`): "Mars
 * ulazi u Lava", "Retrogradna Venera u Skorpiji" (Ivan, 27.9.2026).
 */
function SkyEvents({ daily, today }: { daily: PersonalDaily; today: Date }) {
  if (daily.skyEvents.length === 0) return null;
  return (
    <View className="mt-9">
      <Text variant="label" className="mb-3">Promene na nebu</Text>
      <Group className="mx-0" inset={false}>
        {daily.skyEvents.map((e) => {
          // Venera je jedina planeta zenskog roda koja menja smer (Sunce nikad).
          const zenski = e.planet.key === 'venus';
          const znak = SIGN_CASES[e.sign.key];
          const naslov =
            e.kind === 'ingress' ? `${e.planet.name} ulazi u ${znak.acc}`
            : e.kind === 'retrograde' ? `${zenski ? 'Retrogradna' : 'Retrogradni'} ${e.planet.name} u ${znak.loc}`
            : `${e.planet.name} ponovo ${zenski ? 'direktna' : 'direktan'} u ${znak.loc}`;
          // Direktno kretanje nema kraj — tu stoji samo kuca.
          const trajanje = e.kind === 'direct' ? null
            : e.until ? `Traje ${formatUntil(e.until, today)}` : 'Traje godinama';
          const kuca = e.house === null ? null
            : e.kind === 'ingress' ? `ulazi u tvoju ${e.house}. kuću` : `u tvojoj ${e.house}. kući`;
          const podnaslov = [trajanje, kuca].filter(Boolean).join(' · ');
          return (
            <ListRow
              key={e.planet.key}
              leading={<CalendarDay date={e.at} />}
              title={naslov}
              subtitle={podnaslov ? podnaslov.charAt(0).toUpperCase() + podnaslov.slice(1) : undefined}
            />
          );
        })}
      </Group>
    </View>
  );
}

/** Kalendarski listic levo od reda: krupan dan, ispod skracen mesec (Ivan, 27.9.2026). */
function CalendarDay({ date }: { date: Date }) {
  return (
    <View className="w-11 items-center">
      <Text className="text-[26px] leading-[30px] font-semibold tracking-[-0.3px]">{date.getDate()}</Text>
      <Text variant="caption">{MESECI_KRATKO[date.getMonth()]}</Text>
    </View>
  );
}

/** Koliko redova stane na pocetni ekran pre nego sto lista uputi u tab "Tranziti". */
const MAX_ROWS = 5;

/** Da li red nosi i kraj tranzita (samo spori ga imaju). */
const imaKraj = (t: Transit | SlowTransit): t is SlowTransit => 'endsOn' in t;

function TransitList({ naslov, list, texts, today }: {
  naslov: string; list: (Transit | SlowTransit)[]; texts: Texts; today: Date;
}) {
  if (list.length === 0) return null;
  const prikaz = list.slice(0, MAX_ROWS);
  const ostalo = list.length - prikaz.length;

  return (
    <View className="mt-9">
      <Text variant="label" className="mb-3">{naslov}</Text>
      {/* Group nosi mx-screen, a ekran vec ima marginu — ponistava se. Redovi nemaju ikonu, linija ide od ivice do ivice. */}
      <Group className="mx-0" inset={false}>
        {prikaz.map((t) => {
          // Velikim: naslov tumacenja. Malim: sam tranzit, i dokle traje ako je spor.
          // Bez teksta se ne izmislja — tranzit ide u naslov, podnaslov ostaje kraj.
          const ime = `${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}`;
          const naslovTeksta = texts.get(t.contentKey)?.title;
          const kraj = imaKraj(t) ? formatUntil(t.endsOn, today) : null;
          const podnaslov = [naslovTeksta ? ime : null, kraj].filter(Boolean).join(' · ');
          return (
            <ListRow
              key={t.contentKey}
              title={naslovTeksta || ime}
              subtitle={podnaslov || undefined}
              onPress={() => router.push({ pathname: '/transit', params: { key: t.contentKey } })}
            />
          );
        })}
        {ostalo > 0 && (
          <ListRow
            title={`Još ${ostalo} u Tranzitima`}
            onPress={() => router.push('/daily')}
          />
        )}
      </Group>
    </View>
  );
}
