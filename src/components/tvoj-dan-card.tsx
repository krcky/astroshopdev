import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Info } from 'lucide-react-native';

import { OBLAST_BOJA, OBLAST_TEKST } from '@/components/oblast-ikona';
import { Planeta, skalaSlike } from '@/components/planete-par';
import { Okret } from '@/components/okret';
import { UlazUPricu } from '@/components/prica/ulaz';
import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDatumKratko } from '@/lib/horoscope';
import type { NatalChart } from '@/lib/natal';
import { useTransitTexts } from '@/lib/transit-texts';
import { prveRecenice, stavkaZaPrikaz, triOdeljka, type Stavka } from '@/lib/tumacenje';
import type { TvojDanPick } from '@/lib/tvoj-dan';
import { dayKey } from '@/lib/transits';
import { useTvojDanLog } from '@/store/tvoj-dan-log';
import { useAuthStore } from '@/store/auth';
import { tezina } from '@/theme/tipografija';
import { MINUS_TEKST, PLUS_TEKST } from '@/components/ton';

/**
 * Boja oznake stavke (Ivan, 29.9.2026): EFEKAT "svetlo plava" kao plus u "Ide ti",
 * PAZI "roze" kao minus u "Koči te" (`DESIGN.md`, 2); SAVET ostaje lila (`OBLAST_BOJA`).
 */
// Tekst ide u tamnijem tonu istih boja (UX recenzija 1.10.2026, kontrast bar 4,5:1).
const ODELJAK_BOJA: Record<string, string> = { Efekat: PLUS_TEKST, Pazi: MINUS_TEKST };
/** Varijanta `oznaka` je 11/15; na ovoj kartici datum i oznake odeljaka idu 12/16 (Ivan, 28.9.2026). */
export const OZNAKA_12 = 'text-[12px] leading-[16px]';

/**
 * Planete desno od naslova — isti raspored kao Mesec na slajdu "Mesec danas"
 * (Ivan, 29.9.2026): VELIKA je tranzitna (ona pravi dogadjaj), MALA dole desno je
 * natalna (deo tvoje karte koji je pogodjen), kao znak na Mesecu. Mere iste kao tamo.
 */
// 80 (Ivan, 30.9.2026: manja; do tada 96) — ista kao u prstenu price danas (`prica/ulaz.tsx`).
const PLANETA = 80;
const BEDZ = 28;
/**
 * Planete sa prstenovima: koliki deo slike je TELO (izmereno, `planete-par.tsx`)
 * i koliko telo treba da bude kao udeo `PLANETA` — vece nego ranije, ali ne kao
 * ostale (Ivan, 29.9.2026, za oba).
 */
const PRSTEN: Record<string, { telo: number; cilj: number }> = {
  saturn: { telo: 0.4, cilj: 0.65 },
  uranus: { telo: 0.6, cilj: 0.82 },
};
/** Koliko prstenovi smeju da izadju van okvira sa svake strane (razmak do naslova je 16). */
const PRSTEN_VAN = 16;

/**
 * "Tvoj dan" — Premium kartica sa najvaznijim tranzitom dana.
 * Izbor i rotacija su u `lib/tvoj-dan.ts`; ovde je samo prikaz.
 *
 * Tekst: podnaslov i tri stavke iz DUGE verzije (Premium je dobija od servera,
 * pravilo 8), sazetak iz kratke. Kad teksta nema, ostaje ono sto se racuna —
 * ime tranzita, ton, trajanje — i nista se ne izmislja.
 */
export function TvojDanCard({ pick, date, isToday }: {
  pick: TvojDanPick;
  date: Date;
  isToday: boolean;
  /** Vise se ne koristi (ilustracija koja se okretala je uklonjena 28.9.2026); ostaje da pozivi ne pucaju. */
  aktivan?: boolean;
  /** Vise se ne koristi (objasnjenje vladara je u `/tvoj-dan-info`); ostaje da pozivi ne pucaju. */
  chart?: NatalChart;
}) {
  const key = pick.contentKey;
  const kljucevi = React.useMemo(() => [key], [key]);
  const { texts: kratke, loading: l1 } = useTransitTexts(kljucevi, 'short');
  const { texts: duge, loading: l2 } = useTransitTexts(kljucevi, 'long');
  const loading = l1 || l2;
  const record = useTvojDanLog((s) => s.record);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  // Upis prikaza — SAMO za danas; pregled sutrasnjice ne sme da "potrosi" sutrasnji izbor.
  React.useEffect(() => {
    if (isToday && userId) record(userId, dayKey(date), key);
  }, [isToday, date, key, record, userId]);

  const kratka = kratke.get(key);
  const duga = duge.get(key);

  const ime = `${pick.transiting.name} ${pick.aspect.name} ${pick.natal.name}`;
  // Naslov kartice je naslov TEKSTA ("Planovi koji donose uspeh"); ime tranzita je u
  // listu "Zašto baš ovaj tekst" (Ivan, 28.9.2026). Bez teksta ostaje racunato ime.
  const naslov = duga?.title || kratka?.title || ime;
  const sazetak = kratka?.body ? prveRecenice(kratka.body) : duga?.body ? prveRecenice(duga.body) : '';

  // Tri stavke: iz duge verzije, sledeca pri svakom novom prikazu istog tranzita.
  // Bez duge verzije ostaju jedna recenica kratke (bez rotacije).
  const odeljci = duga ? triOdeljka(duga.sections) : null;
  const stavke: { oznaka: string; s: Stavka | null }[] = [
    { oznaka: 'Efekat', s: odeljci ? stavkaZaPrikaz(odeljci.efekat, pick.shownBefore) : kratka?.positive ? { tekst: kratka.positive } : null },
    { oznaka: 'Pazi', s: odeljci ? stavkaZaPrikaz(odeljci.pazi, pick.shownBefore) : kratka?.challenge ? { tekst: kratka.challenge } : null },
    { oznaka: 'Savet', s: odeljci ? stavkaZaPrikaz(odeljci.savet, pick.shownBefore) : kratka?.advice ? { tekst: kratka.advice } : null },
  ];

  // Bez kartice (Ivan, 28.9.2026): stoji direktno na sivoj pozadini pocetne,
  // kao prvi slajd karusela.
  return (
    <View>
      {/* Datum i naslov su jedna celina, planeta desno centrirana u odnosu na njih;
          sazetak ispod ide preko cele sirine (Ivan, 29.9.2026). */}
      <View className="flex-row items-center gap-4">
        <View className="flex-1">
          {/* 1. Datum izabranog dana (Ivan, 28.9.2026). */}
          {/* `oznaka`, ali 12pt — datum i Efekat/Pazi/Savet (Ivan, 28.9.2026). */}
          {/* "TVOJ DAN · UTO, 29. SEP 2026" — ista tacka i razmaci kao "Mesec danas · 91%" (Ivan, 29.9.2026). */}
          <Text variant="oznaka" className={OZNAKA_12}>Tvoj dan{'\u00A0\u00A0·\u00A0\u00A0'}{formatDatumKratko(date)}</Text>

          {/* 2. Naslov teksta — najveca klasa u sistemu (`display`, Ivan 28.9.2026).
              TON je sklonjen za sada (Ivan, 28.9.2026: "dodacemo ga posle"); racun je u
              `lib/tone.ts`, prikaz u `components/tone-badge.tsx`. */}
          {/* Dok tekst ne stigne — traka, ne racunato ime: ime bi na promeni dana
              bljesnulo pre naslova teksta (Ivan, 28.9.2026). */}
          {loading && !duga?.title && !kratka?.title ? (
            <TextPlaceholder lines={0} title="display" className="mt-3" />
          ) : (
            // Dugme (i) odmah posle POSLEDNJEG SLOVA naslova (Ivan, 28.9.2026) — ugradjeno
            // u tekst, pa prati prelom u drugi red. Otvara list "Zašto baš ovaj
            // tekst" (`app/tvoj-dan-info.tsx`). Nerazdvojni razmak: ikonica se ne odvaja
            // od poslednje reci u novi red.
            <Text variant="display" className="mt-3">
              {naslov}{'\u00A0'}
              <Pressable
                // `day`: izabrani dan, da trajanje u listu bude za taj dan, ne za danas.
                onPress={() => router.push({ pathname: '/tvoj-dan-info', params: { key, day: dayKey(date) } })}
                accessibilityRole="button"
                accessibilityLabel="Zašto baš ovaj tekst?"
                // Dodirna povrsina 44pt preko `hitSlop`; red ne raste.
                hitSlop={14}
                // Ugradjen element stoji na osnovnoj liniji teksta; podignut da bude u
                // visini slova, ne na dnu reda (Ivan, 28.9.2026); -5 -> -3, 2pt nize (29.9.2026).
                style={{ transform: [{ translateY: -3 }] }}
                className="active:opacity-60">
                {/* Svetla lila, kao "Savet" i izabrani tab (Ivan, 28.9.2026). */}
                <Info size={20} color={OBLAST_BOJA} strokeWidth={2} />
              </Pressable>
            </Text>
          )}

        </View>

        {/* Tranzitna planeta, natalna dole desno. DANAS je planeta ulaz u dnevnu pricu:
            prsten oko nje i balon "Priča dana" ispod (Ivan, 30.9.2026; `components/prica/ulaz.tsx`). */}
        {isToday ? (
          <UlazUPricu tranzitna={pick.transiting} natalna={pick.natal} datum={date} />
        ) : (
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={ime}
            className="items-center">
            <PlanetaSaBedzom tranzitna={pick.transiting} natalna={pick.natal} />
          </View>
        )}
      </View>

      {/* 5. Sazetak — preko cele sirine, ispod celine datum + naslov + planeta. */}
      {/* Malo veci od `body` (15/20): 17/24 (Ivan, 28.9.2026). */}
      {!!sazetak && <Text variant="body" className="mt-3 text-[17px] leading-[24px]">{sazetak}</Text>}
      {!sazetak && loading && <TextPlaceholder lines={3} lineType="veliki" className="mt-3" />}

      {/* "Saznaj više" odmah ispod opisa, iznad kartice (Ivan, 29.9.2026; ranije u kartici).
          Poravnanje na omotacu: `istaknuto` dugme je umotano u View sa senkom. */}
      <View className="mt-4 self-start">
        <Button
          size="compact"
          istaknuto
          className="h-auto px-5 py-[10px]"
          onPress={() => router.push({ pathname: '/transit', params: { key } })}>
          <Text className="text-[16px] leading-[20px]">Saznaj više</Text>
        </Button>
      </View>

      {/* Trajanje (traka) je samo u listu "Zašto baš ovaj tekst" — sa pocetne izbaceno (Ivan, 28.9.2026). */}

      {/* Efekat, Pazi, Savet kao lista u beloj kartici (Ivan, 29.9.2026). */}
      <Odeljci stavke={stavke.filter((x): x is { oznaka: string; s: Stavka } => !!x.s)} />
    </View>
  );
}

/**
 * Bela kartica: Efekat / Pazi / Savet kao LISTA, jedno ispod drugog, bez ikonica
 * (Ivan, 29.9.2026; ranije staklene kapsule koje biraju jednu stavku). Svaki red:
 * oznaka, podebljan naslov stavke, tekst. Bez ijedne stavke kartice nema.
 */
function Odeljci({ stavke }: { stavke: { oznaka: string; s: Stavka }[] }) {
  if (stavke.length === 0) return null;
  return (
    // Linija od ivice do ivice kartice: kartica bez bocnog razmaka, red ga nosi sam.
    // Samo tekst, bez ikonica (Ivan, 29.9.2026).
    <View className={cn(CARD_SURFACE, 'mt-8 overflow-hidden py-1')}>
      {stavke.map((x, i) => (
        <View key={x.oznaka} className={cn('flex-row items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
          <View className="flex-1">
            {/* Oznaka u lila boji ikonica i strelica (Ivan, 29.9.2026: "da budu ljubicasti"). */}
            <Text variant="oznaka" className={OZNAKA_12} style={{ color: ODELJAK_BOJA[x.oznaka] ?? OBLAST_TEKST }}>{x.oznaka}</Text>
            {/* Podebljani deo u SVOM redu, tekst ispod njega (Ivan, 28.9.2026). */}
            {!!x.s.naslov && <Text variant="default" className={cn('mt-1', tezina('naslovUTekstu'))}>{x.s.naslov}</Text>}
            <Text variant="default" className={x.s.naslov ? undefined : 'mt-1'}>{x.s.tekst}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Velika tranzitna planeta + natalna u krugu dole desno. Saturn i Uran imaju
 * prstenove siroke 1,5 precnika, pa bi na 96 telo ispalo sitno. Ivan, 29.9.2026:
 * "veci, ne skroz isti po visini kao ostale" — telo ~2/3 ostalih, a okvir se za
 * njih prosiri toliko da prstenovi izadju najvise `PRSTEN_VAN` u razmak do naslova
 * i u marginu ekrana. U bedzu slika staje u krug.
 */
function PlanetaSaBedzom({ tranzitna, natalna }: {
  tranzitna: { key: string; glyph: string };
  natalna: { key: string; glyph: string };
}) {
  const skala = skalaSlike(tranzitna.key);
  const p = PRSTEN[tranzitna.key];
  // Precnik koji `Planeta` dobija; slika je `skala` puta sira, telo je `p.telo` slike.
  const velika = p ? (PLANETA * p.cilj) / (p.telo * skala) : PLANETA;
  const sirina = Math.max(PLANETA, velika * skala - 2 * PRSTEN_VAN);
  const mala = BEDZ / skalaSlike(natalna.key);
  // Bedz se kaci na TELO, ne na ugao okvira: kod Saturna i Urana je okvir siri i
  // telo manje, pa bi ugao ostao daleko od planete (Ivan, 29.9.2026). Centar bedza
  // je 0,75 poluprecnika tela dole desno od centra — kod obicne planete (80) to je
  // tacno mesto na kom je bio i stoji znak na Mesecu.
  const r = (p ? PLANETA * p.cilj : PLANETA) / 2;
  const spolja = BEDZ + 4; // sa sivim obodom (`p-[2px]`)
  const levo = sirina / 2 + r * 0.75 - spolja / 2;
  const gore = PLANETA / 2 + r * 0.75 - spolja / 2;
  return (
    <View style={{ width: sirina, height: PLANETA }} className="items-center justify-center">
      {/* Planeta se polako okrece kao Mesec (Ivan, 30.9.2026) — osim onih sa prstenom
          (Saturn, Uran): okrenut prsten izgleda kao da se planeta prevrce. */}
      {p
        ? <Planeta t={tranzitna} size={velika} />
        : <Okret><Planeta t={tranzitna} size={velika} /></Okret>}
      <View
        style={{ left: levo, top: gore }}
        className="absolute items-center justify-center rounded-pill bg-grouped p-[2px]">
        <View style={{ width: BEDZ, height: BEDZ }} className="items-center justify-center">
          <Planeta t={natalna} size={mala} />
        </View>
      </View>
    </View>
  );
}
