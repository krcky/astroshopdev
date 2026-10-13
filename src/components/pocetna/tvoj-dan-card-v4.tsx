import * as React from 'react';
import { Pressable, View } from 'react-native';
import { PlanetaZiva } from '@/components/planeta-ziva';
import { Planeta, SLIKA } from '@/components/planete-par';
import { AspektIkona, imaAspekt } from '@/components/aspekt-ikona';
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
import { OZNAKA_12 } from '@/components/tvoj-dan-card';

/** Planeta uz naslov (Ivan, 13.10.2026, v4): tranzitna planeta, animirana (`planeta-ziva.tsx`). */
const PLANETA = 38;
/**
 * "Tvoj dan" — Premium kartica sa najvaznijim tranzitom dana.
 * Izbor i rotacija su u `lib/tvoj-dan.ts`; ovde je samo prikaz.
 *
 * Tekst: podnaslov i tri stavke iz DUGE verzije (Premium je dobija od servera,
 * pravilo 8), sazetak iz kratke. Kad teksta nema, ostaje ono sto se racuna —
 * ime tranzita, ton, trajanje — i nista se ne izmislja.
 */
export function TvojDanCardV4({ pick, date, isToday }: {
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

  // Bez kartice (Ivan, 28.9.2026): stoji direktno na sivoj pozadini pocetne,
  // kao prvi slajd karusela.
  return (
    // CELO U JEDNOJ KARTICI (Ivan, 8.10.2026): oznaka "Tema dana", naslov (manji), sazetak i "Saznaj vise", pa ispod LINIJE
    // Pozitivni efekat / Izazov / Savet — redovi su u istoj kartici, odvojeni linijama od ivice do ivice.
    <View className={cn(CARD_SURFACE, 'overflow-hidden p-4')}>
      {/* Zaglavlje: levo oznaka, "i" i naslov, desno animirana planeta tranzita (Ivan, 13.10.2026, v4). */}
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text variant="oznaka" className={OZNAKA_12}>{t.danas.tvojDan.temaDana}</Text>
            <Pressable
              onPress={() => router.push({ pathname: '/tvoj-dan-info', params: { key, day: dayKey(date) } })}
              accessibilityRole="button"
              accessibilityLabel={t.danas.tvojDan.zastoOvajTekst}
              hitSlop={14}
              className="active:opacity-60">
              <Info size={16} color={brand.indigo} strokeWidth={2} />
            </Pressable>
          </View>
          {loading && !duga?.title && !kratka?.title ? (
            <TextPlaceholder lines={0} title="display" className="mt-2" />
          ) : (
            <Text variant="display" className="mt-2 text-[25px] leading-[31px]">{naslov}</Text>
          )}
        </View>
        {/* Obe planete tranzita (tranzitna pa natalna) i znak aspekta izmedju njih; natalna tacka bez slike (Ascendent, MC) ide kao ikonica. */}
        <View className="flex-row items-center" style={{ gap: 4, marginTop: 8, marginRight: 8 }}>
          <PlanetaZiva planeta={pick.transiting.key} size={PLANETA} />
          {imaAspekt(pick.aspect.key) && <AspektIkona aspekt={pick.aspect.key} size={14} />}
          {SLIKA[pick.natal.key]
            ? <PlanetaZiva planeta={pick.natal.key} size={PLANETA} faznoKasni={0.37} />
            : <Planeta t={pick.natal} size={PLANETA} />}
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
