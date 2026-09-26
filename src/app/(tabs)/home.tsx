import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { CARD_SURFACE } from '@/components/ui/card';
import { Group, ListRow } from '@/components/ui/list';
import { buildPersonalDaily, formatUntil, type PersonalDaily, type SlowTransit } from '@/lib/horoscope';
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
  const heroHistory = useHeroLog((s) => s.shown);
  const daily = React.useMemo(
    () => (resolved ? buildPersonalDaily(resolved, today, heroHistory) : null),
    [resolved, today, heroHistory]
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
    <Screen label={<Logo />}>
      <View className="pb-7 pt-6">
        <Text variant="display">Tvoj dan na dlanu</Text>
      </View>

      {/* Tranzit dana — Hero. Sta ulazi bira waterfall u `transits.ts`. */}
      <Hero daily={daily} today={today} texts={texts} loading={textsLoading} />

      {/* Danas ukratko — ide ti / koci te. Sta ulazi bira `pickBrief`. */}
      <Brief daily={daily} texts={texts} />

      {/* Svi danasnji tranziti, podeljeni po brzini planete. */}
      <TransitList
        naslov="Ovih dana"
        list={daily.bySpeed.fast}
        texts={texts}
        today={today}
      />
      <TransitList
        naslov="Tema perioda"
        list={daily.bySpeed.slow}
        texts={texts}
        today={today}
      />
    </Screen>
  );
}


type Texts = Map<string, TransitText>;

/**
 * Hero: naslov tumacenja krupno, tekst, pa sitno koji je to tranzit.
 * Bez natpisa prioriteta i bez glifova (Ivan, 26.9.2026) — prioritet i razlog
 * ostaju u podacima (`hero.priority`, `hero.reason`) za dnevnik i ilustraciju.
 */
function Hero({ daily, today, texts, loading }: { daily: PersonalDaily; today: Date; texts: Texts; loading: boolean }) {
  const { hero } = daily;
  const t = hero.transit;
  const record = useHeroLog((s) => s.record);

  // Upis u dnevnik — od sutra je ovaj tranzit na pauzi 7 dana (osim na vrhuncu).
  React.useEffect(() => {
    if (t) record(t.contentKey, dayKey(today));
  }, [t, record, today]);

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
      {tekst ? (
        <>
          {/* Naslov tumacenja je glavna stvar na kartici — velicina naslova sekcije. */}
          {!!tekst.title && <Text variant="section">{tekst.title}</Text>}
          <Text variant="body" className="mt-2" numberOfLines={3}>{tekst.body}</Text>
          <Text variant="caption" className="mt-3">{ime}</Text>
        </>
      ) : loading ? (
        <Text variant="muted">…</Text>
      ) : (
        // Bez teksta (ASC, MC, rupe u korpusu) ostaje samo racunato ime — ne izmislja se.
        <Text variant="section">{ime}</Text>
      )}
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

function Brief({ daily, texts }: { daily: PersonalDaily; texts: Texts }) {
  const hero = daily.hero.transit;
  const ide = grupaSaRezervom(daily.brief.ide, 'positive', 'ide', hero, texts);
  const koci = grupaSaRezervom(daily.brief.koci, 'challenge', 'koci', hero, texts);
  if (ide.length === 0 && koci.length === 0) return null;

  return (
    <View className="mt-9">
      <Text variant="label" className="mb-3">Danas ukratko</Text>
      <Pressable
        onPress={() => router.push('/daily')}
        accessibilityRole="button"
        className={cn(CARD_SURFACE, 'active:opacity-60')}>
        {ide.length > 0 && <Grupa naslov="Ide ti" redovi={ide} />}
        {ide.length > 0 && koci.length > 0 && <View className="h-px bg-border" />}
        {koci.length > 0 && <Grupa naslov="Koči te" redovi={koci} />}
      </Pressable>
    </View>
  );
}

function Grupa({ naslov, redovi }: { naslov: string; redovi: { t: Transit; recenica: string | null }[] }) {
  return (
    <View className="p-5">
      <Text variant="h3" className="mb-2">{naslov}</Text>
      {redovi.map(({ t, recenica }) => (
        <View key={t.contentKey} className="py-2">
          {recenica ? (
            <>
              <Text variant="default">{recenica}</Text>
              <Text variant="caption">{t.transiting.name} {t.aspect.name} natalni {t.natal.name}</Text>
            </>
          ) : (
            <>
              <Text variant="default">{t.transiting.name} {t.aspect.name} natalni {t.natal.name}</Text>
              <Text variant="caption">Tumačenje još nije napisano.</Text>
            </>
          )}
        </View>
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
