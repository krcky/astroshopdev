import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Crown } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { formatDay } from '@/lib/horoscope';
import { SIGN_CASES } from '@/lib/zodiac';
import type { NatalChart } from '@/lib/natal';
import { useTransitTexts, useTransitTone } from '@/lib/transit-texts';
import { transitTone, TONE_LABEL } from '@/lib/tone';
import { prveRecenice, stavkaZaPrikaz, triOdeljka, type Stavka } from '@/lib/tumacenje';
import { tvojDanWindow, type TvojDanPick } from '@/lib/tvoj-dan';
import { daysBetween, dayKey } from '@/lib/transits';
import { useTvojDanLog } from '@/store/tvoj-dan-log';

/** Naslov kartice — ista mera kao stari Hero (Ivan, 26.9.2026). */
const NASLOV = 'text-[24px] leading-[30px] font-semibold tracking-[-0.3px]';

/** "tvoje Sunce", "tvoju Veneru" — akuzativ sa prisvojnom zamenicom, za objasnjenje vladara. */
const TVOJ_AKUZATIV: Record<string, string> = {
  sun: 'tvoje Sunce', moon: 'tvoj Mesec', mercury: 'tvoj Merkur', venus: 'tvoju Veneru',
  mars: 'tvog Marsa', jupiter: 'tvog Jupitera', saturn: 'tvog Saturna', uranus: 'tvog Urana',
  neptune: 'tvog Neptuna', pluto: 'tvog Plutona', ascendant: 'tvoj Ascendent', midheaven: 'tvoj MC',
};

/** Ascendent i MC nisu u astroloskom fontu — idu obicnim slovima (vidi CLAUDE.md, "Jos nije uradjeno"). */
const UGAO: Record<string, string> = { ascendant: 'Asc', midheaven: 'MC' };

/** 1 dan, 2 dana, 5 dana, 21 dan, 11 dana. */
function dana(n: number): string {
  const jedan = n % 10 === 1 && n % 100 !== 11;
  return `${n} ${jedan ? 'dan' : 'dana'}`;
}

/**
 * "Tvoj dan" — Premium kartica sa najvaznijim tranzitom dana.
 * Izbor i rotacija su u `lib/tvoj-dan.ts`; ovde je samo prikaz.
 *
 * Tekst: podnaslov i tri stavke iz DUGE verzije (Premium je dobija od servera,
 * pravilo 8), sazetak iz kratke. Kad teksta nema, ostaje ono sto se racuna —
 * ime tranzita, ton, trajanje — i nista se ne izmislja.
 */
export function TvojDanCard({ pick, date, isToday, chart }: {
  pick: TvojDanPick;
  date: Date;
  isToday: boolean;
  chart: NatalChart;
}) {
  const key = pick.contentKey;
  const kljucevi = React.useMemo(() => [key], [key]);
  const { texts: kratke } = useTransitTexts(kljucevi, 'short');
  const { texts: duge, loading } = useTransitTexts(kljucevi, 'long');
  const rucniTon = useTransitTone(key);
  const record = useTvojDanLog((s) => s.record);
  const [objasnjenje, setObjasnjenje] = React.useState(false);

  // Upis prikaza — SAMO za danas; pregled sutrasnjice ne sme da "potrosi" sutrasnji izbor.
  React.useEffect(() => {
    if (isToday) record(dayKey(date), key);
  }, [isToday, date, key, record]);

  const prozor = React.useMemo(() => tvojDanWindow(pick, date), [pick, date]);
  const kratka = kratke.get(key);
  const duga = duge.get(key);

  const { tone } = transitTone(pick.transiting.key, pick.aspect.key, pick.natal.key, rucniTon);
  const ime = `${pick.transiting.name} ${pick.aspect.name} ${pick.natal.name}`;
  const podnaslov = duga?.title || kratka?.title || '';
  const sazetak = kratka?.body ? prveRecenice(kratka.body) : duga?.body ? prveRecenice(duga.body) : '';

  // Tri stavke: iz duge verzije, sledeca pri svakom novom prikazu istog tranzita.
  // Bez duge verzije ostaju jedna recenica kratke (bez rotacije).
  const odeljci = duga ? triOdeljka(duga.sections) : null;
  const stavke: { oznaka: string; s: Stavka | null }[] = [
    { oznaka: 'Efekat', s: odeljci ? stavkaZaPrikaz(odeljci.efekat, pick.shownBefore) : kratka?.positive ? { tekst: kratka.positive } : null },
    { oznaka: 'Pazi', s: odeljci ? stavkaZaPrikaz(odeljci.pazi, pick.shownBefore) : kratka?.challenge ? { tekst: kratka.challenge } : null },
    { oznaka: 'Savet', s: odeljci ? stavkaZaPrikaz(odeljci.savet, pick.shownBefore) : kratka?.advice ? { tekst: kratka.advice } : null },
  ];

  const znakAsc = SIGN_CASES[chart.ascendantSign.sign.key].loc;
  const vladar = pick.ruler === 'natal' ? pick.natal.name : pick.transiting.name;
  const tekstVladara =
    pick.ruler === 'natal'
      ? `${vladar} je vladar tvog Ascendenta u ${znakAsc}. Kad ga tranzit dodirne, dan se oseća ličnije i jače, zato ovaj tranzit danas ima prednost.`
      : `${vladar} je vladar tvog Ascendenta u ${znakAsc}, a danas pokreće ${TVOJ_AKUZATIV[pick.natal.key] ?? pick.natal.name}. Zato ovaj tranzit danas ima prednost.`;

  // Bez kartice (Ivan, 28.9.2026): stoji direktno na sivoj pozadini pocetne,
  // kao prvi slajd karusela.
  return (
    <View>
      {/* 1. Oznaka i ton */}
      <View className="flex-row items-center justify-between">
        <Text variant="caption">Tvoj dan</Text>
        <View className="rounded-pill bg-fill px-3 py-1" accessibilityLabel={`Ton: ${TONE_LABEL[tone]}`}>
          <Text variant="caption" className="font-medium text-foreground">{TONE_LABEL[tone]}</Text>
        </View>
      </View>

      {/* 2. Tranzitna planeta, aspekt, natalna tacka — krunica na vladaru */}
      <View
        className="mt-4 flex-row items-center gap-3"
        accessible
        accessibilityLabel={`${ime}${pick.ruler ? `, ${vladar} je tvoj vladar` : ''}`}>
        <Simbol glyph={pick.transiting.glyph} krunica={pick.ruler === 'transiting'} />
        <Glyph size={20} className="text-muted-foreground">{pick.aspect.glyph}</Glyph>
        <Simbol glyph={pick.natal.glyph} ugao={UGAO[pick.natal.key]} krunica={pick.ruler === 'natal'} />
      </View>

      {/* 3. Naslov i podnaslov */}
      <Text className={cn(NASLOV, 'mt-4')}>{ime}</Text>
      {!!podnaslov && <Text variant="lead" className="mt-1">{podnaslov}</Text>}

      {/* 4. Oznaka vladara — dodir otvara kratko objasnjenje */}
      {pick.ruler && (
        <View className="mt-3">
          <Pressable
            onPress={() => setObjasnjenje((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: objasnjenje }}
            accessibilityHint="Objašnjava zašto ovaj tranzit ima prednost"
            hitSlop={6}
            className="flex-row items-center gap-1.5 self-start rounded-pill border border-fill-strong px-3 py-1.5 active:opacity-70">
            <Crown size={14} color={neutral.ink} strokeWidth={2} />
            <Text variant="caption" className="font-medium text-foreground">Tranzit tvog vladara</Text>
          </Pressable>
          {objasnjenje && <Text variant="body" className="mt-2">{tekstVladara}</Text>}
        </View>
      )}

      {/* 5. Sazetak */}
      {!!sazetak && <Text variant="body" className="mt-4">{sazetak}</Text>}
      {!sazetak && loading && <Text variant="muted" className="mt-4">…</Text>}

      {/* 6. Trajanje */}
      <Trajanje start={prozor.start} end={prozor.end} date={date} mesec={pick.transiting.key === 'moon'} />

      {/* 7. Efekat, Pazi, Savet */}
      {stavke.some((x) => x.s) && (
        <View className="mt-5 gap-3">
          {stavke.map(({ oznaka, s }) =>
            s ? (
              <View key={oznaka}>
                <Text variant="caption">{oznaka}</Text>
                <Text variant="default" className="mt-0.5">
                  {s.naslov ? <Text variant="default" className="font-semibold">{s.naslov}: </Text> : null}
                  {s.tekst}
                </Text>
              </View>
            ) : null
          )}
        </View>
      )}

      {/* 8. Ceo tekst */}
      <Button
        size="compact"
        className="mt-5 h-auto self-start px-5 py-[10px]"
        onPress={() => router.push({ pathname: '/transit', params: { key } })}>
        <Text className="text-[16px] leading-[20px]">Pročitaj ceo tekst</Text>
      </Button>
    </View>
  );
}

function Simbol({ glyph, ugao, krunica }: { glyph: string; ugao?: string; krunica: boolean }) {
  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-fill">
      {ugao ? (
        <Text variant="h3">{ugao}</Text>
      ) : (
        <Glyph size={24} className="text-foreground">{glyph}</Glyph>
      )}
      {krunica && (
        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
          <Crown size={11} color={neutral.ink} strokeWidth={2.2} />
        </View>
      )}
    </View>
  );
}

/** Pocetak, "Jos N dana" i traka. Pocetak i kraj su ulazak u orbis i izlazak iz njega. */
function Trajanje({ start, end, date, mesec }: { start: Date | null; end: Date | null; date: Date; mesec: boolean }) {
  if (mesec) {
    return <Text variant="muted" className="mt-4">Samo danas</Text>;
  }
  const preostalo = end ? daysBetween(dayKey(date), end) : null;
  const desno = preostalo === null ? 'Traje godinama' : preostalo === 0 ? 'Poslednji dan' : `Još ${dana(preostalo)}`;
  const levo = start ? `Od ${formatDay(start, date)}` : 'Traje duže od tri godine';
  const ukupno = start && end ? daysBetween(dayKey(start), end) + 1 : null;
  const proslo = start ? daysBetween(dayKey(start), date) + 1 : null;
  const udeo = ukupno && proslo ? Math.min(1, proslo / ukupno) : null;

  return (
    <View className="mt-4" accessible accessibilityLabel={`${levo}. ${desno}.`}>
      <View className="flex-row justify-between">
        <Text variant="muted">{levo}</Text>
        <Text variant="muted">{desno}</Text>
      </View>
      {udeo !== null && (
        <View className="mt-2 h-1.5 overflow-hidden rounded-pill bg-fill">
          <View className="h-full rounded-pill bg-foreground" style={{ width: `${Math.round(udeo * 100)}%` }} />
        </View>
      )}
    </View>
  );
}
