import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { PremiumKartica } from '@/components/zakljucano';
import { Text } from '@/components/ui/text';
import { NaslovSekcije } from '@/components/naslov-sekcije';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { cn } from '@/lib/utils';
import { useT, tr, type Recnik } from '@/i18n';
import { isFreeNatalKey, natalTopic, tacnostAspekta, udeoUZnaku } from '@/lib/natal-keys';
import { AspektIkona, imaAspekt, type AspektKljuc } from '@/components/aspekt-ikona';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { PLANETA_POTEZ, IkonaTacke } from '@/components/planeta-ikona';
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
import { useKarta } from '@/lib/osobe-api';
import { useEntitlement } from '@/store/auth';


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
  // `osoba`: karta druge osobe (strana osobe, 29.9.2026) — bez njega korisnikova.
  const { tema, deo, osoba } = useLocalSearchParams<{ tema: string; deo?: string; osoba?: string }>();
  const t = useT();
  const tt = t.karta.tumacenje;
  const resolved = useKarta(osoba);
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

  if (!resolved) {
    // Osoba je u medjuvremenu obrisana (ili je drugi nalog) — list to kaze, ne salje na kapiju.
    if (osoba) return <SheetScroll><Text variant="muted">{tt.osobaObrisana}</Text></SheetScroll>;
    return <Redirect href="/" />;
  }
  if (!topic) {
    return (
      <SheetScroll>
        <Text variant="muted">{osoba ? tt.nijeDeoOveKarte : tt.nijeDeoKarte}</Text>
      </SheetScroll>
    );
  }

  const { chart } = resolved;
  // Zakljucano je ono sto PRIKAZ kaze da nije otvoreno (Ivan, 30.9.2026): test prekidac
  // "Besplatan" na nalogu sa Premium-om je inace pokazivao sve, jer tekst stigne po pravom
  // stanju. Dok tekst jos stize, red se ne zakljucava (ceka se).
  const zakljucani = kljucevi.filter((k) => !premium && !isFreeNatalKey(k) && (texts.has(k) || !loading));

  // Veliki naslov je podnaslov astrologa iz PRVOG teksta ("Druzeljubivi vizionar"),
  // kao sto je na tranzitu naslov teksta; racunato ime ide u oznaku iznad njega.
  const prvi = kljucevi.length > 0 && !zakljucani.includes(kljucevi[0]) ? texts.get(kljucevi[0]) : undefined;
  let zaglavlje: React.ReactNode = null;
  if (topic.kind === 'planet') {
    const p = chart.planets.find((x) => x.key === topic.planet)!;
    const neznan = !!topic.moon && !topic.moon.certain; // Mesec bez vremena rodjenja
    zaglavlje = (
      <Glava
        tacke={[{ key: p.key, glyph: p.glyph }]}
        slika={{ key: p.key, glyph: p.glyph }}
        oznaka={[neznan ? p.name : t.karta.uZnaku(p.name, p.position.sign.key as ZnakKljuc), topic.houseKey ? t.karta.kuca(p.house) : null].filter(Boolean).join(' · ')}
        naslov={prvi?.subtitle || p.name}
        traka={neznan ? null : trakaZnaka(p.position)}
      />
    );
  } else if (topic.kind === 'ascendant') {
    const asc = chart.ascendantSign;
    zaglavlje = (
      <Glava
        tacke={[{ key: 'ascendant', glyph: 'ASC' }]}
        oznaka={t.karta.uZnaku(t.karta.ascendent, asc.sign.key as ZnakKljuc)}
        naslov={prvi?.subtitle || t.karta.ascendent}
        traka={trakaZnaka(asc)}
      />
    );
  } else {
    const a = topic.aspect;
    const tacnost = tacnostAspekta(a.aspect.key, a.orb);
    const ime = t.karta.aspekt(a.a.name, a.aspect.name, a.b.name);
    zaglavlje = (
      <Glava
        tacke={[a.a, a.b]}
        aspekt={a.aspect.key}
        oznaka={ime}
        naslov={prvi?.subtitle || ime}
        traka={tacnost && { levo: tt.tacnostAspekta, desno: tt.orbisOd(t.karta.stepenDecimalno(a.orb), tacnost.max), udeo: tacnost.udeo }}
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
            {(osoba ? tt.mesecPresaoOsoba : tt.mesecPresao)(topic.moon.from.key as ZnakKljuc, topic.moon.to.key as ZnakKljuc)}
          </Text>
          <Button variant="secondary" className="mt-4 self-start"
            onPress={() => leaveSheetTo({ pathname: '/rodjenje-polje', params: osoba ? { osoba, polje: 'vreme' } : { polje: 'vreme' } })}>
            <Text>{tt.dodajVreme}</Text>
          </Button>
        </View>
      )}

      {kljucevi.map((k, i) => (
        <Odeljak key={k} tekst={texts.get(k)} loading={loading} zakljucan={zakljucani.includes(k)} prvi={i === 0}
          bezNaslova={topic.kind === 'aspect'} />
      ))}

      {/* Kuca zavisi od vremena rodjenja — bez njega se ne tumaci (pravilo 5). */}
      {topic.kind === 'planet' && !topic.houseKey && (
        <Text variant="muted" className="mt-8">{tt.kucaBezVremena}</Text>
      )}

      {zakljucani.length > 0 && (
        <PremiumKartica
          izLista
          className="mt-12"
          naslov={osoba ? tt.premiumNaslovOsoba : tt.premiumNaslov}
          opis={tt.premiumOpis}
          dugme={tt.premiumDugme}
        />
      )}
    </SheetScroll>
  );
}

/** Precnik crnih ikonica tacaka — isti kao na tumacenju tranzita (`transit.tsx`). */
const SIMBOL = 26;
/** Slika planete desno od naslova na tumacenju planete (Saturn sa prstenom se sam smanji u okvir). */
const SLIKA_PLANETE = 96;

type Traka = { levo: string; desno: string; udeo: number };

/** Kljuc znaka u recniku (`SIGNS[].key` je `string`). */
type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/** Traka polozaja u znaku: koliko je tacka odmakla kroz svojih 30°. Van crtanja — `tr()`. */
function trakaZnaka(pos: SignPosition): Traka {
  const tt = tr().karta.tumacenje;
  return {
    levo: tt.polozajUZnaku(pos.sign.key as ZnakKljuc),
    desno: tt.stepenOd30(pos.deg, String(pos.min).padStart(2, '0')),
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
              <IkonaTacke tacka={tacke[0]} size={SIMBOL} />
              {aspekt && imaAspekt(aspekt) && (
                <AspektIkona aspekt={aspekt as AspektKljuc} size={15} potez={PLANETA_POTEZ * SIMBOL} />
              )}
              {tacke[1] && <IkonaTacke tacka={tacke[1]} size={SIMBOL} />}
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
function Odeljak({ tekst, loading, zakljucan, prvi, bezNaslova = false }: {
  tekst?: NatalText; loading: boolean; zakljucan: boolean; prvi: boolean;
  /**
   * Aspekt: naslov astrologa je samo ime aspekta ("Sunce opozicija Mesec"), koje vec stoji
   * u oznaci iznad — i to cesto obrnutim redom tela, pa je ekran pisao isti aspekt na dva
   * nacina (UX recenzija 1.10.2026). Tada se naslov sekcije ne ponavlja.
   */
  bezNaslova?: boolean;
}) {
  const t = useT();
  if (zakljucan) return null; // jedna kartica za otkljucavanje ispod svih
  return (
    <View className="mt-7">
      {tekst ? (
        <>
          {!bezNaslova && <NaslovSekcije>{tekst.title}</NaslovSekcije>}
          {!prvi && !!tekst.subtitle && <Text variant="h3" className="mb-2">{tekst.subtitle}</Text>}
          <TumacenjeTekst tekst={tekst.body} />
        </>
      ) : loading ? (
        <TextPlaceholder lines={6} />
      ) : (
        // Korpus je kompletan (`npm run check:natal-tekst`): tekst koji ne stigne
        // je problem veze ili prijave, ne nenapisan tekst.
        <Text variant="muted">{t.karta.tumacenje.nijeUcitano}</Text>
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
  const t = tr().karta;
  const out: (StavkaSimbolike | null)[] = [];
  const tacka = (key: string, glyph: string, ime: string) =>
    SIMBOLIKA_PLANETA[key] ? { key, ikona: <IkonaTacke tacka={{ key, glyph }} size={SIMBOL} />, ime, reci: SIMBOLIKA_PLANETA[key] } : null;
  const znak = (pos: SignPosition) =>
    SIMBOLIKA_ZNAKA[pos.sign.key]
      ? { key: pos.sign.key, ikona: <ZnakIkona znak={pos.sign.key} element={pos.sign.element} size={SIMBOL} />, ime: pos.sign.name, reci: SIMBOLIKA_ZNAKA[pos.sign.key] }
      : null;
  if (topic.kind === 'planet') {
    const p = chart.planets.find((x) => x.key === topic.planet)!;
    out.push(tacka(p.key, p.glyph, p.name));
    if (!topic.moon || topic.moon.certain) out.push(znak(p.position));
    if (topic.houseKey && SIMBOLIKA_KUCE[p.house]) {
      out.push({ key: `kuca${p.house}`, ikona: <KucaBroj kuca={p.house} size={SIMBOL} />, ime: t.kuca(p.house), reci: SIMBOLIKA_KUCE[p.house] });
    }
  } else if (topic.kind === 'ascendant') {
    out.push(tacka('ascendant', 'ASC', t.ascendent));
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
        ime: t.tumacenje.simbolikaAspekta(a.aspect.name, sim.tema),
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
