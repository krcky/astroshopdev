import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { NaslovSekcije } from '@/components/naslov-sekcije';
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
import { Planeta } from '@/components/planete-par';
import { TrakaNapretka } from '@/components/transit-trajanje';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import type { SignPosition } from '@/lib/zodiac';
import type { NatalChart } from '@/lib/natal';
import type { NatalTopic } from '@/lib/natal-keys';
import { SIMBOLIKA_ASPEKTA, SIMBOLIKA_KUCE, SIMBOLIKA_PLANETA, SIMBOLIKA_ZNAKA } from '@/lib/simbolika';
import { ZnakIkona } from '@/components/znak-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
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
  // `deo=kuca`: otvoreno sa reda "u 2. kući" na ekranu "Ti" — kuca ide prva.
  const { tema, deo } = useLocalSearchParams<{ tema: string; deo?: string }>();
  const resolved = useResolvedProfile();
  const premium = !!useEntitlement()?.active;

  const topic = React.useMemo(
    () => (resolved && tema ? natalTopic(resolved.chart, resolved.timeUnknown, resolved.utc, String(tema)) : null),
    [resolved, tema]
  );
  const kljucevi = React.useMemo(() => {
    if (!topic) return [];
    if (topic.kind === 'planet') {
      const redom = deo === 'kuca' ? [topic.houseKey, topic.signKey] : [topic.signKey, topic.houseKey];
      return redom.filter((k): k is string => !!k);
    }
    if (topic.kind === 'ascendant') return [topic.signKey];
    return [topic.aspect.key];
  }, [topic, deo]);
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
        slika={{ key: p.key, glyph: p.glyph }}
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

      <Simbolika stavke={simbolikaTeme(topic, chart)} />

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
/** Slika planete desno od naslova na tumacenju planete (Saturn sa prstenom se sam smanji u okvir). */
const SLIKA_PLANETE = 96;

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
function Glava({ tacke, aspekt, slika, oznaka, naslov, traka }: {
  tacke: { key: string; glyph: string }[];
  aspekt?: string;
  /**
   * Planeta u znaku i kuci (Ivan, 28.9.2026): SLIKA planete desno od naslova,
   * bez crne ikonice gore levo. Aspekt i podznak ostaju kao ranije.
   */
  slika?: { key: string; glyph: string };
  oznaka: string;
  naslov: string;
  traka: Traka | null;
}) {
  const ilustracija = !!aspekt && imaAspekt(aspekt) && tacke.length === 2;
  return (
    <>
      <View className={cn('flex-row gap-5', slika && 'items-center')}>
        <View className="flex-1 justify-between">
          {!slika && (
            <View className="flex-row items-center gap-2">
              <TamnaTacka tacka={tacke[0]} size={SIMBOL} />
              {aspekt && imaAspekt(aspekt) && (
                <AspektIkona aspekt={aspekt as AspektKljuc} size={15} potez={PLANETA_POTEZ * SIMBOL} />
              )}
              {tacke[1] && <TamnaTacka tacka={tacke[1]} size={SIMBOL} />}
            </View>
          )}
          <View className={slika ? undefined : 'mt-7'}>
            <Text variant="oznaka" className="text-foreground">{oznaka}</Text>
            {/* Cele reci, kao na tranzitu: duga rec ("Samoobmanjivanje") u uskoj koloni pored
                ilustracije smanji naslov umesto da se prelomi usred reci (32 -> najmanje 22). */}
            <NaslovCeleReci size={32} lineHeight={38} min={22} className="mt-2">{naslov}</NaslovCeleReci>
          </View>
        </View>
        {ilustracija && (
          <View className="justify-end">
            <AspektIlustracija aspekt={aspekt as AspektKljuc} tranzitna={tacke[0]} natalna={tacke[1]} width={120} />
          </View>
        )}
        {slika && <Planeta t={slika} size={SLIKA_PLANETE} />}
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
          <NaslovSekcije>{tekst.title}</NaslovSekcije>
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

type StavkaSimbolike = { key: string; ikona: React.ReactNode; ime: string; reci: string };

/**
 * Stavke "Simbolike" za temu (kao na sajtu): planeta, znak i kuca, odnosno obe
 * tacke i aspekt. Stavka bez reci se preskace; znak Meseca bez vremena
 * rodjenja se ne pogadja.
 */
function simbolikaTeme(topic: NatalTopic, chart: NatalChart): StavkaSimbolike[] {
  const out: (StavkaSimbolike | null)[] = [];
  const tacka = (key: string, glyph: string, ime: string) =>
    SIMBOLIKA_PLANETA[key] ? { key, ikona: <TamnaTacka tacka={{ key, glyph }} size={SIMBOL} />, ime, reci: SIMBOLIKA_PLANETA[key] } : null;
  const znak = (pos: SignPosition) =>
    SIMBOLIKA_ZNAKA[pos.sign.key]
      ? { key: pos.sign.key, ikona: <ZnakIkona znak={pos.sign.key} element={pos.sign.element} size={SIMBOL} />, ime: pos.sign.name, reci: SIMBOLIKA_ZNAKA[pos.sign.key] }
      : null;
  if (topic.kind === 'planet') {
    const p = chart.planets.find((x) => x.key === topic.planet)!;
    out.push(tacka(p.key, p.glyph, p.name));
    if (!topic.moon || topic.moon.certain) out.push(znak(p.position));
    if (topic.houseKey && SIMBOLIKA_KUCE[p.house]) {
      out.push({ key: `kuca${p.house}`, ikona: <KucaBroj kuca={p.house} size={SIMBOL} />, ime: `${p.house}. kuća`, reci: SIMBOLIKA_KUCE[p.house] });
    }
  } else if (topic.kind === 'ascendant') {
    out.push(tacka('ascendant', 'ASC', 'Ascendent'));
    out.push(znak(chart.ascendantSign));
  } else {
    const a = topic.aspect;
    out.push(tacka(a.a.key, a.a.glyph, a.a.name));
    out.push(tacka(a.b.key, a.b.glyph, a.b.name));
    const sim = SIMBOLIKA_ASPEKTA[a.aspect.key];
    if (sim && imaAspekt(a.aspect.key)) {
      out.push({
        key: a.aspect.key,
        ikona: <AspektIkona aspekt={a.aspect.key} size={18} potez={PLANETA_POTEZ * SIMBOL} />,
        // "Konjunkcija – Borba", kao u tekstu astrologa (`files/simbolika/`).
        ime: `${a.aspect.name.charAt(0).toUpperCase() + a.aspect.name.slice(1)} – ${sim.tema}`,
        reci: sim.opis,
      });
    }
  }
  return out.filter((x): x is StavkaSimbolike => !!x);
}

/** "Simbolika" iznad teksta: ikonica, ime verzalom, kljucne reci astrologa (`lib/simbolika.ts`). */
function Simbolika({ stavke }: { stavke: StavkaSimbolike[] }) {
  if (stavke.length === 0) return null;
  return (
    <View className="mt-6 gap-4">
      {stavke.map((s) => (
        <View key={s.key} className="flex-row items-center gap-3">
          <View className="items-center justify-center" style={{ width: SIMBOL, height: SIMBOL }}>{s.ikona}</View>
          <View className="flex-1">
            <Text variant="oznaka" className="text-foreground">{s.ime}</Text>
            <Text variant="muted" className="mt-0.5">{s.reci}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
