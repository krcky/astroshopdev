import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { CARD_SURFACE } from '@/components/ui/card';
import { TranzitSimbol } from '@/components/tranzit-simbol';
import { TonOznaka } from '@/components/ton';
import { formatDate } from '@/lib/horoscope';
import { josTraje } from '@/lib/mnozina';
import { LISTA_ORB, tekstReda, type OblastiDana } from '@/lib/oblasti';
import { useTransitTexts } from '@/lib/transit-texts';
import { TONE_LABEL } from '@/lib/tone';
import { dayKey, daysBetween } from '@/lib/transits';
import { tvojDanEnd } from '@/lib/tvoj-dan';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

type Tranzit = OblastiDana['poVaznosti'][number];

/**
 * Premium tab "Tranziti": SVI tranziti dana, najvazniji prvi, svaki u svojoj
 * kartici — bez oblasti i bez ocena (Ivan, 28.9.2026: ocene su samo na
 * pocetnoj, slajd "Danas ukratko", kartica iznad sazetka). Vaznost = jacina iz `lib/oblasti.ts`
 * (planeta × aspekt × kljucna tacka/vladar × blizina).
 *
 * Tekst kartice: veci je naslov tumacenja iz korpusa, manji ime tranzita. Naslov
 * dolazi iz DUGE verzije (Premium je dobija od servera, pravilo 8), inace iz
 * kratke. Tranzit bez naslova se prikazuje imenom i belezi se za proveru.
 */
export function TranzitiLista({ rez, date, onZaProveru }: {
  rez: OblastiDana;
  date: Date;
  /** Kljucevi tranzita bez naslova tumacenja — za dev pregled i konzolu. */
  onZaProveru?: (keys: string[]) => void;
}) {
  const keys = React.useMemo(() => rez.poVaznosti.map((t) => t.red.key), [rez]);
  const { texts: kratke, loading: l1 } = useTransitTexts(keys, 'short');
  const { texts: duge, loading: l2 } = useTransitTexts(keys, 'long');
  const loading = l1 || l2;

  // Koliko jos traje: kraj je izlazak iz orbisa (`TD_ORB`, isto kao "Tvoj dan").
  const preostalo = React.useMemo(() => {
    const m = new Map<string, number | null>();
    for (const t of rez.poVaznosti) {
      // Kraj istim orbisom kojim je tranzit usao u listu (`LISTA_ORB`).
      const end = tvojDanEnd(t.red, date, LISTA_ORB(t.red.transiting.key, t.red.aspect.key));
      m.set(t.red.key, end ? daysBetween(dayKey(date), end) : null);
    }
    return m;
  }, [rez, date]);

  const naslov = (key: string) => duge.get(key)?.title || kratke.get(key)?.title || '';

  // Oznaka za proveru: tranzit bez naslova tumacenja, kad su tekstovi stigli.
  React.useEffect(() => {
    if (loading) return;
    const bez = rez.poVaznosti.filter((t) => tekstReda(t.red, naslov(t.red.key)).zaProveru).map((t) => t.red.key);
    onZaProveru?.(bez);
    if (__DEV__ && bez.length) console.warn(`[tranziti] bez naslova tumacenja, za proveru: ${bez.join(', ')}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, rez, kratke, duge]);

  return (
    <View className="pt-6">
      {/* Naslov "Tranziti" je u traci ekrana; ovde datum i broj. */}
      <Text variant="body">{formatDate(date)} {date.getFullYear()}.</Text>
      <Text variant="body" className="mt-0.5">Aktivnih: {rez.poVaznosti.length}</Text>

      {rez.poVaznosti.length === 0 && (
        <Text variant="body" className="mt-6">Danas nema tvojih tranzita.</Text>
      )}

      <View className="mt-5 gap-3">
        {rez.poVaznosti.map((t) => (
          <KarticaTranzita key={t.red.key} t={t} naslov={naslov(t.red.key)} loading={loading}
            trajanje={josTraje(preostalo.get(t.red.key) ?? null)} />
        ))}
      </View>
    </View>
  );
}

/**
 * Kartica: simboli (tranzitna planeta, aspekt, natalna tacka; krunica za
 * vladara), naslov tumacenja, ime tranzita, koliko jos traje, ton. Dodir
 * otvara ceo tekst na istom listu kao "Saznaj više" sa "Tvog dana" (`/transit`).
 */
function KarticaTranzita({ t, naslov, loading, trajanje }: {
  t: Tranzit;
  naslov: string;
  loading: boolean;
  trajanje: string;
}) {
  const r = t.red;
  const tekst = tekstReda(r, naslov);
  const ime = tekstReda(r, '').veci;
  const ceka = loading && tekst.zaProveru; // naslov mozda jos stize
  const a11y = [ceka ? ime : tekst.veci, tekst.manji, TONE_LABEL[t.ton], trajanje].filter(Boolean).join('. ') + '.';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transit', params: { key: r.key } })}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Otvara ceo tekst tranzita"
      className={cn(CARD_SURFACE, 'p-4 active:opacity-80')}>
      <View className="flex-row items-center gap-1.5">
        <TranzitSimbol glyph={r.transiting.glyph} vladar={r.ruler === 'transiting'} />
        <Glyph size={15} className="text-muted-foreground">{r.aspect.glyph}</Glyph>
        <TranzitSimbol glyph={r.natal.glyph} pointKey={r.natal.key} vladar={r.ruler === 'natal'} />
        <View className="flex-1" />
        <ChevronRight size={16} color={neutral.inkSubtle} />
      </View>
      {ceka ? (
        <>
          <TextPlaceholder lines={1} className="mt-3" />
          <Text variant="body" className="mt-0.5">{ime}</Text>
        </>
      ) : (
        <>
          <Text variant="h3" className="mt-2">{tekst.veci}</Text>
          {!!tekst.manji && <Text variant="body" className="mt-0.5">{tekst.manji}</Text>}
        </>
      )}
      {/* Ton pa trajanje, u jednom redu (Ivan, 28.9.2026). */}
      <View className="mt-2 flex-row flex-wrap items-center gap-x-2 gap-y-1">
        <TonOznaka tone={t.ton} />
        {!!trajanje && <Text variant="muted">·</Text>}
        <Text variant="muted">{trajanje}</Text>
      </View>
    </Pressable>
  );
}
