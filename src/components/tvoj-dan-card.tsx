import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Info } from 'lucide-react-native';

import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NatalChart } from '@/lib/natal';
import { useTransitTexts } from '@/lib/transit-texts';
import { bezTacke, prveRecenice, stavkaZaPrikaz, triOdeljka, type Stavka } from '@/lib/tumacenje';
import type { TvojDanPick } from '@/lib/tvoj-dan';
import { dayKey } from '@/lib/transits';
import { useTvojDanLog } from '@/store/tvoj-dan-log';
import { useAuthStore } from '@/store/auth';
import { brand } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';
import { MINUS_BOJA, PLUS_BOJA } from '@/components/ton';
import { useT } from '@/i18n';

type OdeljakKljuc = 'efekat' | 'pazi' | 'savet';

/**
 * Boja oznake stavke (Ivan, 29.9.2026): EFEKAT "svetlo plava" kao plus u "Ide ti",
 * PAZI "roze" kao minus u "Koči te" (`DESIGN.md`, 2); SAVET ostaje lila (`OBLAST_BOJA`).
 */
// Natpisi "Pozitivni efekat" i "Izazov" (Ivan, 1.10.2026, B6 iz UX recenzije): isti nazivi
// kao odeljci celog teksta ("Pozitivni efekti", "Izazovi"), do tada "Efekat" i "Pazi".
// Boja se bira po KLJUCU, ne po natpisu — natpis zavisi od jezika.
const ODELJAK_BOJA: Partial<Record<OdeljakKljuc, string>> = { efekat: PLUS_BOJA, pazi: MINUS_BOJA };
/** Varijanta `oznaka` je 11/15; na ovoj kartici datum i oznake odeljaka idu 12/16 (Ivan, 28.9.2026). */
export const OZNAKA_12 = 'text-[12px] leading-[16px]';

/**
 * Slika u DONJEM DESNOM uglu gornjeg dela kartice (Ivan, 13.10.2026): cetiri crteza, svaki dan druga, redom (po danu u godini,
 * ne po slucaju — ista slika ceo dan i na svakom telefonu). Crtezi su kadrirani za taj ugao (isecaju se na desnoj i donjoj ivici).
 * Stoji uz desnu ivicu kartice i do linije ispod, a ispod dugmeta "Saznaj vise" je ostavljeno toliko mesta da ne dodiruje tekst
 * (`UGAO_VISINA`); ne hvata dodir. Raniji pokusaji (gore desno: obilazenje, fiksna zona, pozadina, traka) su u istoriji fajla.
 */
const UGAO = [
  { slika: require('../../assets/images/tema-dana/ugao-1.png'), w: 297, h: 280 },
  { slika: require('../../assets/images/tema-dana/ugao-2.png'), w: 344, h: 332 },
  { slika: require('../../assets/images/tema-dana/ugao-3.png'), w: 321, h: 340 },
  { slika: require('../../assets/images/tema-dana/ugao-4.png'), w: 245, h: 246 },
];
/** Visina slike (pt); sirina prati razmeru. */
const UGAO_VISINA = 120;
/** Padding kartice (`p-4`) i razmak do linije ispod gornjeg dela (`mt-5` na `Odeljci`). */
const PAD = 16;
const DO_LINIJE = 20;
/** Visina reda sa dugmetom "Saznaj vise" + razmak iznad njega (`mt-4`). */
const DUGME_RED = 40 + 16;
const ugaoZaDan = (d: Date) => UGAO[Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) % UGAO.length];

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
  const t = useT();
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

  const ime = t.danas.tranzit.ime(pick.transiting.name, pick.aspect.name, pick.natal.name);
  // Naslov kartice je naslov TEKSTA ("Planovi koji donose uspeh"); ime tranzita je u
  // listu "Zašto baš ovaj tekst" (Ivan, 28.9.2026). Bez teksta ostaje racunato ime.
  const naslov = duga?.title || kratka?.title || ime;
  const sazetak = kratka?.body ? prveRecenice(kratka.body) : duga?.body ? prveRecenice(duga.body) : '';

  // Tri stavke: iz duge verzije, sledeca pri svakom novom prikazu istog tranzita.
  // Bez duge verzije ostaju jedna recenica kratke (bez rotacije).
  const odeljci = duga ? triOdeljka(duga.sections) : null;
  const stavke: { key: OdeljakKljuc; oznaka: string; s: Stavka | null }[] = [
    { key: 'efekat', oznaka: t.danas.tvojDan.efekat, s: odeljci ? stavkaZaPrikaz(odeljci.efekat, pick.shownBefore) : kratka?.positive ? { tekst: kratka.positive } : null },
    { key: 'pazi', oznaka: t.danas.tvojDan.pazi, s: odeljci ? stavkaZaPrikaz(odeljci.pazi, pick.shownBefore) : kratka?.challenge ? { tekst: kratka.challenge } : null },
    { key: 'savet', oznaka: t.danas.tvojDan.savet, s: odeljci ? stavkaZaPrikaz(odeljci.savet, pick.shownBefore) : kratka?.advice ? { tekst: kratka.advice } : null },
  ];

  const ugao = ugaoZaDan(date);
  const slikaVisina = UGAO_VISINA;
  const slikaSirina = (UGAO_VISINA * ugao.w) / ugao.h;

  // Bez kartice (Ivan, 28.9.2026): stoji direktno na sivoj pozadini pocetne,
  // kao prvi slajd karusela.
  return (
    // CELO U JEDNOJ KARTICI (Ivan, 8.10.2026): oznaka "Tema dana", naslov (manji), sazetak i "Saznaj vise", pa ispod LINIJE
    // Pozitivni efekat / Izazov / Savet — redovi su u istoj kartici, odvojeni linijama od ivice do ivice.
    <View className={cn(CARD_SURFACE, 'overflow-hidden p-4')}>
      {/* Gornji deo kartice (do linije); slika je u njegovom donjem desnom uglu, a donji razmak ostavlja mesto za nju. */}
      <View style={{ paddingBottom: Math.max(0, slikaVisina - DUGME_RED - DO_LINIJE) }}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -PAD, bottom: -DO_LINIJE }}>
        <Image
          source={ugao.slika}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{ width: slikaSirina, height: slikaVisina }}
          resizeMode="contain"
        />
      </View>
      <View>
      <View>
      {/* Ikonica "i" je pored oznake "Tema dana" (Ivan, 13.10.2026), ne uz naslov. Otvara list "Zašto baš ovaj tekst". */}
      <View className="flex-row items-center gap-1.5">
        <Text variant="oznaka" className={OZNAKA_12}>{t.danas.tvojDan.temaDana}</Text>
        <Pressable
          // `day`: izabrani dan, da trajanje u listu bude za taj dan, ne za danas.
          onPress={() => router.push({ pathname: '/tvoj-dan-info', params: { key, day: dayKey(date) } })}
          accessibilityRole="button"
          accessibilityLabel={t.danas.tvojDan.zastoOvajTekst}
          // Dodirna povrsina 44pt preko `hitSlop`; red ne raste.
          hitSlop={14}
          className="active:opacity-60">
          {/* Svetla lila, kao "Savet" i izabrani tab (Ivan, 28.9.2026). */}
          <Info size={16} color={brand.indigo} strokeWidth={2} />
        </Pressable>
      </View>
      {/* Datum i naslov su jedna celina, planeta desno centrirana u odnosu na njih;
          sazetak ispod ide preko cele sirine (Ivan, 29.9.2026). */}
      <View>
        <View>
          {/* Oznaka "TVOJ DAN · datum" je sklonjena (Ivan, 8.10.2026); naslov i datum stoje iznad kruga zivota. */}

          {/* 2. Naslov teksta — najveca klasa u sistemu (`display`, Ivan 28.9.2026).
              TON je sklonjen za sada (Ivan, 28.9.2026: "dodacemo ga posle"); racun je u
              `lib/tone.ts`, prikaz u `components/tone-badge.tsx`. */}
          {/* Dok tekst ne stigne — traka, ne racunato ime: ime bi na promeni dana
              bljesnulo pre naslova teksta (Ivan, 28.9.2026). */}
          {loading && !duga?.title && !kratka?.title ? (
            <TextPlaceholder lines={0} title="display" className="mt-2" />
          ) : (
            // Dugme (i) odmah posle POSLEDNJEG SLOVA naslova (Ivan, 28.9.2026) — ugradjeno
            // u tekst, pa prati prelom u drugi red. Otvara list "Zašto baš ovaj
            // tekst" (`app/tvoj-dan-info.tsx`). Nerazdvojni razmak: ikonica se ne odvaja
            // od poslednje reci u novi red.
            <Text variant="display" className="mt-2 text-[25px] leading-[31px]">
              {naslov}
            </Text>
          )}

        </View>
      </View>
      </View>
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
          <Text className="text-[16px] leading-[20px]">{t.danas.tvojDan.saznajVise}</Text>
        </Button>
      </View>
      </View>

      {/* Trajanje (traka) je samo u listu "Zašto baš ovaj tekst" — sa pocetne izbaceno (Ivan, 28.9.2026). */}

      {/* Efekat, Pazi, Savet kao lista u beloj kartici (Ivan, 29.9.2026). */}
      <Odeljci stavke={stavke.filter((x): x is { key: OdeljakKljuc; oznaka: string; s: Stavka } => !!x.s)} />
    </View>
  );
}

/**
 * Bela kartica: Efekat / Pazi / Savet kao LISTA, jedno ispod drugog, bez ikonica
 * (Ivan, 29.9.2026; ranije staklene kapsule koje biraju jednu stavku). Svaki red:
 * oznaka, podebljan naslov stavke, tekst. Bez ijedne stavke kartice nema.
 */
function Odeljci({ stavke }: { stavke: { key: OdeljakKljuc; oznaka: string; s: Stavka }[] }) {
  if (stavke.length === 0) return null;
  return (
    // Linija od ivice do ivice kartice: kartica bez bocnog razmaka, red ga nosi sam.
    // Samo tekst, bez ikonica (Ivan, 29.9.2026).
    <View className="-mx-4 -mb-4 mt-5 border-t border-border">
      {stavke.map((x, i) => (
        <View key={x.key} className={cn('flex-row items-center gap-3 px-4 py-3.5', i > 0 && 'border-t border-border')}>
          <View className="flex-1">
            {/* Oznaka u lila boji ikonica i strelica (Ivan, 29.9.2026: "da budu ljubicasti"). */}
            <Text variant="oznaka" className={OZNAKA_12} style={{ color: ODELJAK_BOJA[x.key] ?? OBLAST_BOJA }}>{x.oznaka}</Text>
            {/* Podebljani deo u SVOM redu, tekst ispod njega (Ivan, 28.9.2026). */}
            {!!x.s.naslov && <Text variant="default" className={cn('mt-1', tezina('naslovUTekstu'))}>{x.s.naslov}</Text>}
            <Text variant="default" className={x.s.naslov ? undefined : 'mt-1'}>{bezTacke(x.s.tekst)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
