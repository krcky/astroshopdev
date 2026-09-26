import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { GlassIconButton } from '@/components/ui/glass-button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Group, ListRow } from '@/components/ui/list';
import { buildPersonalDaily, formatDate, formatUntil, type PersonalDaily, type SlowTransit } from '@/lib/horoscope';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { neutral } from '@/theme/tokens';
import { Logo } from '@/components/logo';
import { useTransitTexts, type TransitText } from '@/lib/transit-texts';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { useHeroLog } from '@/store/hero-log';
import { dayKey, briefBucket, type BriefBucket, type Transit } from '@/lib/transits';
import { cn } from '@/lib/utils';

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
  const daily = React.useMemo(
    () => (resolved ? buildPersonalDaily(resolved, date, heroHistory) : null),
    [resolved, date, heroHistory]
  );

  // Jedan upit za tekstove svih danasnjih tranzita — Hero, sazetak i liste
  // su podskupovi iste liste.
  const kljucevi = React.useMemo(
    () => (daily ? daily.entries.map((e) => e.transit.contentKey) : []),
    [daily]
  );
  const { texts, loading: textsLoading } = useTransitTexts(kljucevi);

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  return (
    <Screen label={<Logo full />}>
      {/* Bez naslova (Ivan, 26.9.2026): ekran pocinje datumom, blizu trake. */}
      <View className="pt-2" />

      <DateRow date={date} offset={offset} onChange={setOffset} />

      {/* Tranzit dana — Hero. Sta ulazi bira waterfall u `transits.ts`. */}
      <Hero daily={daily} date={date} isToday={offset === 0} texts={texts} loading={textsLoading} />

      {/* Ukratko — ide ti / koci te. Sta ulazi bira `pickBrief`. */}
      <Brief daily={daily} texts={texts} isToday={offset === 0} />

      {/* Svi danasnji tranziti, podeljeni po brzini planete. */}
      <TransitList
        naslov="Ovih dana"
        list={daily.bySpeed.fast}
        texts={texts}
        today={date}
      />
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

/**
 * Datum sa strelicama: dva dana unazad i dva unapred (Ivan, 26.9.2026).
 * Strelice su u Liquid Glass mehuru gde ga sistem ima, inace belo dugme.
 * Ispod datuma stoji rec za dan; kad nije danas, dodir na nju vraca na danas.
 */
function DateRow({ date, offset, onChange }: { date: Date; offset: number; onChange: (o: number) => void }) {
  const naPocetku = offset <= -DAY_RANGE;
  const naKraju = offset >= DAY_RANGE;
  return (
    <View className="mb-6 flex-row items-center justify-between">
      <GlassIconButton disabled={naPocetku} onPress={() => onChange(offset - 1)} accessibilityLabel="Dan unazad">
        <ChevronLeft size={22} color={naPocetku ? neutral.inkSubtle : neutral.ink} />
      </GlassIconButton>
      <Pressable
        onPress={() => onChange(0)}
        disabled={offset === 0}
        accessibilityRole="button"
        accessibilityLabel={offset === 0 ? formatDate(date) : 'Vrati na danas'}
        className="items-center active:opacity-60">
        <Text variant="row">{formatDate(date)}</Text>
        <Text variant="caption" className={cn(offset !== 0 && 'text-foreground')}>
          {offset === 0 ? RELATIVE[0] : `${RELATIVE[offset]} · vrati na danas`}
        </Text>
      </Pressable>
      <GlassIconButton disabled={naKraju} onPress={() => onChange(offset + 1)} accessibilityLabel="Dan unapred">
        <ChevronRight size={22} color={naKraju ? neutral.inkSubtle : neutral.ink} />
      </GlassIconButton>
    </View>
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
