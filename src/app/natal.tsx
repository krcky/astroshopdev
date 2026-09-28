import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Glyph } from '@/components/ui/glyph';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { cn } from '@/lib/utils';
import { SIGN_CASES } from '@/lib/zodiac';
import { isFreeNatalKey, natalTopic } from '@/lib/natal-keys';
import { useNatalTexts, type NatalText } from '@/lib/natal-texts';
import { useResolvedProfile } from '@/store/profile';
import { useEntitlement } from '@/store/auth';

/** Ista zlatna kao na zakljucanom tumacenju tranzita (`transit.tsx`) — jedino mesto gde se placa. */
const GOLD = '#A7731B';

/**
 * Tumacenje iz natalne karte: planeta (u znaku i u kuci), podznak ili aspekt.
 * Otvara se sa ekrana "Ti" (`/natal?tema=sun`, `tema=ascendant`,
 * `tema=natal.moon.square.sun`). Sta se prikazuje odlucuje KARTA korisnika
 * (`natalTopic`), parametar samo bira.
 *
 * Tekst salje server po RLS-u (pravilo 8). Red koji nije stigao je zakljucan
 * (placen, a pristupa nema) ili nije mogao da se ucita — to se ovde razlikuje,
 * da se kupovina ne nudi kad je problem u vezi.
 */
export default function NatalTumacenje() {
  const { tema } = useLocalSearchParams<{ tema: string }>();
  const resolved = useResolvedProfile();
  const premium = !!useEntitlement()?.active;

  const topic = React.useMemo(
    () => (resolved && tema ? natalTopic(resolved.chart, resolved.timeUnknown, resolved.utc, String(tema)) : null),
    [resolved, tema]
  );
  const kljucevi = React.useMemo(() => {
    if (!topic) return [];
    if (topic.kind === 'planet') return [topic.signKey, topic.houseKey].filter((k): k is string => !!k);
    if (topic.kind === 'ascendant') return [topic.signKey];
    return [topic.aspect.key];
  }, [topic]);
  const { texts, loading } = useNatalTexts(kljucevi);

  if (!resolved) return <Redirect href="/" />;
  if (!topic) {
    return (
      <SheetScroll>
        <Text variant="muted">Ovo tumačenje nije deo tvoje karte.</Text>
      </SheetScroll>
    );
  }

  const { chart } = resolved;
  const zakljucani = kljucevi.filter((k) => !texts.has(k) && !loading && !premium && !isFreeNatalKey(k));

  let zaglavlje: React.ReactNode = null;
  if (topic.kind === 'planet') {
    const p = chart.planets.find((x) => x.key === topic.planet)!;
    zaglavlje = (
      <Glava znaci={[p.glyph]} naslov={p.name}
        podnaslov={[topic.moon && !topic.moon.certain ? null : p.position.formatted, topic.houseKey ? `${p.house}. kuća` : null].filter(Boolean).join(' · ')} />
    );
  } else if (topic.kind === 'ascendant') {
    zaglavlje = <Glava znaci={[chart.ascendantSign.sign.glyph]} naslov="Ascendent" podnaslov={chart.ascendantSign.formatted} />;
  } else {
    const a = topic.aspect;
    zaglavlje = (
      <Glava znaci={[a.a.glyph, a.aspect.glyph, a.b.glyph]} naslov={`${a.a.name} ${a.aspect.name} ${a.b.name}`}
        podnaslov={`orbis ${a.orb.toFixed(1)}°`} />
    );
  }

  return (
    // Nativni list odozdo, kao sva tumacenja (`_layout.tsx`, Ivan 28.9.2026).
    <SheetScroll>
      {zaglavlje}

      {/* Mesec bez vremena rodjenja: tog dana je presao iz znaka u znak — ne pogadja se. */}
      {topic.kind === 'planet' && topic.moon && !topic.moon.certain && (
        <View className={cn(CARD_SURFACE, 'mt-6 p-5')}>
          <Text variant="body">
            Na dan tvog rođenja Mesec je bio u {SIGN_CASES[topic.moon.from.key].loc}, pa prešao u {SIGN_CASES[topic.moon.to.key].acc}.
            Bez vremena rođenja ne znamo u kom je znaku bio kad si se rodio, pa tumačenje ne prikazujemo.
          </Text>
          <Button variant="secondary" className="mt-4 self-start" onPress={() => leaveSheetTo('/edit')}>
            <Text>Dodaj vreme rođenja</Text>
          </Button>
        </View>
      )}

      {kljucevi.map((k) => (
        <Odeljak key={k} tekst={texts.get(k)} loading={loading} zakljucan={zakljucani.includes(k)} />
      ))}

      {/* Kuca zavisi od vremena rodjenja — bez njega se ne tumaci (pravilo 5). */}
      {topic.kind === 'planet' && !topic.houseKey && (
        <Text variant="muted" className="mt-8">
          U kojoj je kući planeta zavisi od tačnog vremena rođenja. Kad ga uneseš, ovde će biti i tumačenje kuće.
        </Text>
      )}

      {zakljucani.length > 0 && (
        <View className={cn(CARD_SURFACE, 'mt-8 border-gold/40 p-6')}>
          <View className="h-12 w-12 items-center justify-center self-center rounded-full bg-gold/10">
            <Lock size={20} color={GOLD} />
          </View>
          <Text variant="h3" className="mt-4 text-center">Cela natalna karta</Text>
          <Text variant="muted" className="mt-2 text-center">
            Sve planete u znakovima i kućama i svi aspekti tvoje karte. Sunce, Mesec i podznak su besplatni.
          </Text>
          <Button className="mt-5 w-full" onPress={() => leaveSheetTo('/profile')}>
            <Text>Otključaj</Text>
          </Button>
        </View>
      )}
    </SheetScroll>
  );
}

/** Simboli u kapsuli (krug za jedan), pa naslov. Kod aspekta su tri simbola u jednom redu. */
function Glava({ znaci, naslov, podnaslov }: { znaci: string[]; naslov: string; podnaslov: string }) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-14 min-w-14 flex-row items-center justify-center gap-2 rounded-full bg-fill px-3">
        {znaci.map((z, i) =>
          // ASC nije u astroloskom fontu — obicnim slovima (vidi CLAUDE.md).
          z === 'ASC' ? (
            <Text key={i} variant="h3">Asc</Text>
          ) : (
            <Glyph key={i} size={znaci.length > 1 && i === 1 ? 18 : 24} className={znaci.length > 1 && i === 1 ? 'text-muted-foreground' : 'text-foreground'}>{z}</Glyph>
          )
        )}
      </View>
      <View className="flex-1">
        <Text variant="h2">{naslov}</Text>
        {!!podnaslov && <Text variant="muted" className="mt-0.5">{podnaslov}</Text>}
      </View>
    </View>
  );
}

/** Jedan tekst: "Sunce u Lavu" krupno, podnaslov astrologa, pa tekst. */
function Odeljak({ tekst, loading, zakljucan }: { tekst?: NatalText; loading: boolean; zakljucan: boolean }) {
  if (zakljucan) return null; // jedna kartica za otkljucavanje ispod svih
  return (
    <View className="mt-8">
      {tekst ? (
        <>
          <Text variant="display">{tekst.title}</Text>
          {!!tekst.subtitle && <Text variant="lead" className="mt-1">{tekst.subtitle}</Text>}
          <View className="mt-4">
            <TumacenjeTekst tekst={tekst.body} />
          </View>
        </>
      ) : loading ? (
        <TextPlaceholder title="display" lines={6} />
      ) : (
        // Korpus je kompletan (`npm run check:natal-tekst`): tekst koji ne stigne
        // je problem veze ili prijave, ne nenapisan tekst.
        <Text variant="muted">Tumačenje trenutno ne može da se učita. Proveri vezu sa internetom.</Text>
      )}
    </View>
  );
}
