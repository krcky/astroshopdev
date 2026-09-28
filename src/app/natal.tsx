import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { cn } from '@/lib/utils';
import { SIGN_CASES } from '@/lib/zodiac';
import { isFreeNatalKey, natalTopic, tacnostAspekta, udeoUZnaku } from '@/lib/natal-keys';
import { AspektIkona, imaAspekt, type AspektKljuc } from '@/components/aspekt-ikona';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { PLANETA_POTEZ, TamnaTacka } from '@/components/planeta-ikona';
import { TrakaNapretka } from '@/components/transit-trajanje';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import type { SignPosition } from '@/lib/zodiac';
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

  // Veliki naslov je podnaslov astrologa iz PRVOG teksta ("Druzeljubivi vizionar"),
  // kao sto je na tranzitu naslov teksta; racunato ime ide u oznaku iznad njega.
  const prvi = kljucevi.length > 0 ? texts.get(kljucevi[0]) : undefined;
  let zaglavlje: React.ReactNode = null;
  if (topic.kind === 'planet') {
    const p = chart.planets.find((x) => x.key === topic.planet)!;
    const neznan = !!topic.moon && !topic.moon.certain; // Mesec bez vremena rodjenja
    zaglavlje = (
      <Glava
        tacke={[{ key: p.key, glyph: p.glyph }]}
        oznaka={[neznan ? p.name : `${p.name} u ${SIGN_CASES[p.position.sign.key].loc}`, topic.houseKey ? `${p.house}. kuća` : null].filter(Boolean).join(' · ')}
        naslov={prvi?.subtitle || p.name}
        traka={neznan ? null : trakaZnaka(p.position)}
      />
    );
  } else if (topic.kind === 'ascendant') {
    const asc = chart.ascendantSign;
    zaglavlje = (
      <Glava
        tacke={[{ key: 'ascendant', glyph: 'ASC' }]}
        oznaka={`Ascendent u ${SIGN_CASES[asc.sign.key].loc}`}
        naslov={prvi?.subtitle || 'Ascendent'}
        traka={trakaZnaka(asc)}
      />
    );
  } else {
    const a = topic.aspect;
    const t = tacnostAspekta(a.aspect.key, a.orb);
    zaglavlje = (
      <Glava
        tacke={[a.a, a.b]}
        aspekt={a.aspect.key}
        oznaka={`${a.a.name} ${a.aspect.name} ${a.b.name}`}
        naslov={prvi?.subtitle || `${a.a.name} ${a.aspect.name} ${a.b.name}`}
        traka={t && { levo: 'Tačnost aspekta', desno: `orbis ${stepen(a.orb)} od ${t.max}°`, udeo: t.udeo }}
      />
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

      {kljucevi.map((k, i) => (
        <Odeljak key={k} tekst={texts.get(k)} loading={loading} zakljucan={zakljucani.includes(k)} prvi={i === 0} />
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

/** Precnik crnih ikonica tacaka — isti kao na tumacenju tranzita (`transit.tsx`). */
const SIMBOL = 26;

type Traka = { levo: string; desno: string; udeo: number };

/** "2,3°" — decimalni zarez. */
const stepen = (x: number) => `${x.toFixed(1).replace('.', ',')}°`;

/** Traka polozaja u znaku: koliko je tacka odmakla kroz svojih 30°. */
function trakaZnaka(pos: SignPosition): Traka {
  return {
    levo: `Položaj u ${SIGN_CASES[pos.sign.key].loc}`,
    desno: `${pos.deg}° ${String(pos.min).padStart(2, '0')}' od 30°`,
    udeo: udeoUZnaku(pos.degree),
  };
}

/**
 * Zaglavlje u obliku tumacenja tranzita (Ivan, 28.9.2026: "iste ikonice, isti
 * progress bar"): crne ikonice tacaka (kod aspekta sa znakom aspekta izmedju),
 * oznaka verzalom, veliki naslov; desno ilustracija aspekta; ispod cele sirine
 * ista lila traka. Traka ovde NIJE trajanje (natalna karta se ne menja) nego
 * polozaj u znaku, odnosno tacnost aspekta.
 */
function Glava({ tacke, aspekt, oznaka, naslov, traka }: {
  tacke: { key: string; glyph: string }[];
  aspekt?: string;
  oznaka: string;
  naslov: string;
  traka: Traka | null;
}) {
  const ilustracija = !!aspekt && imaAspekt(aspekt) && tacke.length === 2;
  return (
    <>
      <View className="flex-row gap-5">
        <View className="flex-1 justify-between">
          <View className="flex-row items-center gap-2">
            <TamnaTacka tacka={tacke[0]} size={SIMBOL} />
            {aspekt && imaAspekt(aspekt) && (
              <AspektIkona aspekt={aspekt as AspektKljuc} size={15} potez={PLANETA_POTEZ * SIMBOL} />
            )}
            {tacke[1] && <TamnaTacka tacka={tacke[1]} size={SIMBOL} />}
          </View>
          <View className="mt-7">
            <Text variant="oznaka">{oznaka}</Text>
            <Text variant="display" className="mt-2">{naslov}</Text>
          </View>
        </View>
        {ilustracija && (
          <View className="justify-end">
            <AspektIlustracija aspekt={aspekt as AspektKljuc} tranzitna={tacke[0]} natalna={tacke[1]} width={120} />
          </View>
        )}
      </View>
      {traka && <TrakaNapretka {...traka} boja={OBLAST_BOJA} className="mt-8" />}
      <View className="mb-2" />
    </>
  );
}

/**
 * Jedan tekst, kao sekcija duge verzije tranzita: naslov astrologa ("Sunce u
 * Lavu") u sivom natpisu sa linijom ispod, pa tekst. Podnaslov prvog teksta je
 * vec veliki naslov gore, pa se ovde ponavlja samo kod drugog (kuca).
 */
function Odeljak({ tekst, loading, zakljucan, prvi }: { tekst?: NatalText; loading: boolean; zakljucan: boolean; prvi: boolean }) {
  if (zakljucan) return null; // jedna kartica za otkljucavanje ispod svih
  return (
    <View className="mt-7">
      {tekst ? (
        <>
          {/* Linija ispod naslova: list je beo, pa `border-border` (pravilo 17). */}
          <View className="mb-3 border-b border-border pb-2">
            <Text variant="label">{tekst.title}</Text>
          </View>
          {!prvi && !!tekst.subtitle && <Text variant="h3" className="mb-2">{tekst.subtitle}</Text>}
          <TumacenjeTekst tekst={tekst.body} />
        </>
      ) : loading ? (
        <TextPlaceholder lines={6} />
      ) : (
        // Korpus je kompletan (`npm run check:natal-tekst`): tekst koji ne stigne
        // je problem veze ili prijave, ne nenapisan tekst.
        <Text variant="muted">Tumačenje trenutno ne može da se učita. Proveri vezu sa internetom.</Text>
      )}
    </View>
  );
}
