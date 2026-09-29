import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { CARD_SURFACE } from '@/components/ui/card';
import { PlanetePar } from '@/components/planete-par';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { imaAspekt } from '@/components/aspekt-ikona';
import { TonOznaka } from '@/components/ton';
import { tekstReda, trajanjeTekst, trajanjeTranzita, type OblastiDana, type TranzitRed } from '@/lib/oblasti';
import { useTransitTexts } from '@/lib/transit-texts';
import { TONE_LABEL, type Tone } from '@/lib/tone';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { PremiumKartica, ZakljucaniRedovi } from '@/components/zakljucano';
import { mnozina, TRANZIT } from '@/lib/mnozina';

/** Precnik slike planete na kartici (dve se preklapaju, `planete-par.tsx`). */
const PLANETA = 36;
/** Sirina ilustracije aspekta na kartici (`aspekt-ilustracija.tsx`). */
const ILUSTRACIJA = 88; // Ivan, 28.9.2026: "povecati malo" (bilo 80); dugo trajanje se na telefonu blago smanji


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
export function TranzitiLista({ rez, date, onZaProveru, besplatno, osobaId }: {
  rez: OblastiDana;
  date: Date;
  /** Tranziti na kartu druge osobe (strana osobe, 29.9.2026) — ide uz ceo tekst (`/transit?osoba=`). */
  osobaId?: string;
  /**
   * Besplatni: koliko kartica je otvoreno (`BESPLATNO.tranzitiDana`); ostali su
   * zakljucani redovi sa imenom i trajanjem, pa kartica "Otključaj". Premium: bez granice.
   */
  besplatno?: number;
  /** Kljucevi tranzita bez naslova tumacenja — za dev pregled i konzolu. */
  onZaProveru?: (keys: string[]) => void;
}) {
  const keys = React.useMemo(() => rez.poVaznosti.map((t) => t.red.key), [rez]);
  const { texts: kratke, loading: l1 } = useTransitTexts(keys, 'short');
  const { texts: duge, loading: l2 } = useTransitTexts(keys, 'long');
  const loading = l1 || l2;

  // Koliko jos traje — isto racunanje kao na celom tekstu tranzita (`trajanjeTranzita`).
  const trajanja = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const t of rez.poVaznosti) m.set(t.red.key, trajanjeTekst(trajanjeTranzita(t.red, date)));
    return m;
  }, [rez, date]);

  const otvoreni = besplatno === undefined ? rez.poVaznosti : rez.poVaznosti.slice(0, besplatno);
  const zakljucani = rez.poVaznosti.slice(otvoreni.length);

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
    // Bez datuma i broja iznad liste (Ivan, 28.9.2026): naslov "Tranziti" je u
    // traci ekrana, a kartice pocinju odmah ispod.
    <View className="pt-6">
      {rez.poVaznosti.length === 0 && (
        <Text variant="body">{osobaId ? 'Danas nema tranzita na ovu kartu.' : 'Danas nema tvojih tranzita.'}</Text>
      )}

      <View className="gap-3">
        {otvoreni.map((t) => (
          <KarticaTranzita key={t.red.key} red={t.red} ton={t.ton} naslov={naslov(t.red.key)} loading={loading}
            trajanje={trajanja.get(t.red.key) ?? ''} osobaId={osobaId} />
        ))}
      </View>

      {/* Besplatni (Ivan, 29.9.2026): ostali tranziti po imenu, pod katancem — vidi se
          da postoje, ne i sta pisu. */}
      {zakljucani.length > 0 && (
        <>
          <ZakljucaniRedovi
            className="mt-3"
            redovi={zakljucani.map((t) => ({
              key: t.red.key,
              naslov: tekstReda(t.red, '').veci,
              ispod: trajanja.get(t.red.key),
            }))}
          />
          <PremiumKartica
            className="mt-3"
            naslov="Svi tranziti dana"
            opis={`Još ${zakljucani.length} ${mnozina(zakljucani.length, TRANZIT)} danas, sa celim tekstom za svaki.`}
          />
        </>
      )}
    </View>
  );
}

/**
 * Kartica: simboli (tranzitna planeta, aspekt, natalna tacka; krunica za
 * vladara), naslov tumacenja, ime tranzita, koliko jos traje, ton. Dodir
 * otvara ceo tekst na istom listu kao "Saznaj više" sa "Tvog dana" (`/transit`).
 */
export type KarticaRed = Pick<TranzitRed, 'key' | 'transiting' | 'aspect' | 'natal' | 'ruler'>;

/**
 * Kartica jednog tranzita — tab "Tranziti" i slajd "Tema perioda" na pocetnoj
 * (Ivan, 28.9.2026: "ovakve iste kartice i na stranici tema perioda").
 */
export function KarticaTranzita({ red, ton, naslov, loading, trajanje, opis, oznaka, osobaId }: {
  red: KarticaRed;
  /** Karta druge osobe: ceo tekst se racuna za nju, ne za korisnika. */
  osobaId?: string;
  /** Bez tona i trajanja kad je dat `opis`. */
  ton?: Tone;
  naslov: string;
  loading: boolean;
  trajanje?: string;
  /** Dva reda teksta UMESTO tona i trajanja — "Za tebe" na slajdu Mesec danas (Ivan, 28.9.2026). */
  opis?: string;
  /** Oznaka iznad naslova umesto imena tranzita ("Za tebe", Ivan 28.9.2026). */
  oznaka?: string;
}) {
  const r = red;
  const tekst = tekstReda(r, naslov);
  const ime = tekstReda(r, '').veci;
  const ceka = loading && tekst.zaProveru; // naslov mozda jos stize
  const a11y = [ceka ? ime : tekst.veci, tekst.manji, opis ?? (ton && TONE_LABEL[ton]), !opis && trajanje].filter(Boolean).join('. ') + '.';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transit', params: osobaId ? { key: r.key, osoba: osobaId } : { key: r.key } })}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Otvara ceo tekst tranzita"
      className={cn(CARD_SURFACE, 'flex-row items-center gap-3 py-4 pl-4 pr-3 active:opacity-80')}>
      <View className="flex-1">
        {/* Oznaka: verzal 11pt, siva (Ivan, 28.9.2026). Strelica je skroz desno na kartici. */}
        {(() => {
          const naslovTu = !ceka && !tekst.zaProveru;
          return (
            <>
              <TekstSaStrelicom strelica={false} numberOfLines={2}
                variant="oznaka">
                {oznaka ?? ime}
              </TekstSaStrelicom>
              {ceka ? (
                <TextPlaceholder lines={1} className="mt-3" />
              ) : naslovTu ? (
                <NaslovCeleReci size={21} lineHeight={26} min={16} variant="h2"
                  className={cn('mt-2 tracking-[-0.3px] text-foreground', tezina('karticaNaslov'))}>
                  {tekst.veci}
                </NaslovCeleReci>
              ) : null}
            </>
          );
        })()}
      {opis ? (
        <Text variant="caption" className="mt-2" numberOfLines={2}>{opis}</Text>
      ) : ton ? (
        // Ton pa trajanje u ISTOM redu (Ivan, 28.9.2026).
        <View className="mt-2 flex-row items-center gap-1.5">
          <TonOznaka tone={ton} />
          {!!trajanje && <Text variant="caption">·</Text>}
          <Text variant="caption" className="flex-shrink" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{trajanje}</Text>
        </View>
      ) : null}
      </View>
      {/* Ilustracija DESNO, tekst levo (Ivan, 28.9.2026). Slike planeta preko tackica:
          tranzitna van kruga, natalna unutra. Ako aspekt nema ilustraciju,
          ostaju dve planete jedna preko druge. */}
      {imaAspekt(r.aspect.key) ? (
        <AspektIlustracija
          aspekt={r.aspect.key}
          tranzitna={{ key: r.transiting.key, glyph: r.transiting.glyph, vladar: r.ruler === 'transiting' }}
          natalna={{ key: r.natal.key, glyph: r.natal.glyph, vladar: r.ruler === 'natal' }}
          width={ILUSTRACIJA}
        />
      ) : (
        <PlanetePar
          levo={{ key: r.transiting.key, glyph: r.transiting.glyph, vladar: r.ruler === 'transiting' }}
          desno={{ key: r.natal.key, glyph: r.natal.glyph, vladar: r.ruler === 'natal' }}
          size={PLANETA}
        />
      )}
      {/* Strelica skroz desno, na sredini visine kartice (Ivan, 28.9.2026). */}
      <ChevronRight size={20} color={OBLAST_BOJA} strokeWidth={2.2} style={{ marginLeft: -6, marginRight: -4 }} />
    </Pressable>
  );
}

/**
 * Tekst sa strelicom na SREDINI svoje visine, odmah uz NAJDUZI red (Ivan,
 * 28.9.2026). Prelomljen tekst u RN-u zauzme celu sirinu kolone, pa bi strelica
 * stajala uz desnu ivicu; zato se posle prvog crtanja sirina suzi na najduzi red
 * (`onTextLayout`). Na webu `onTextLayout` ne postoji — tamo ostaje uz ivicu kolone.
 * `className` sa marginom ide na red, ostalo na tekst.
 */
function TekstSaStrelicom({ children, className, strelica, numberOfLines, variant }: {
  children: string;
  variant?: React.ComponentProps<typeof Text>['variant'];
  className?: string;
  strelica: boolean;
  numberOfLines?: number;
}) {
  const [sirina, setSirina] = React.useState<number | null>(null);
  React.useEffect(() => setSirina(null), [children]);
  const margina = (className ?? '').split(' ').filter((k) => /^m[tb]-/.test(k)).join(' ');
  const ostalo = (className ?? '').split(' ').filter((k) => !/^m[tb]-/.test(k)).join(' ');
  return (
    <View className={cn('flex-row items-center gap-1', margina)}>
      <Text
        variant={variant}
        className={cn('flex-shrink', ostalo)}
        numberOfLines={numberOfLines}
        style={strelica && sirina !== null ? { width: sirina } : undefined}
        onTextLayout={(e) => {
          if (!strelica || sirina !== null) return;
          const najduzi = Math.max(0, ...e.nativeEvent.lines.map((l) => l.width));
          if (najduzi > 0) setSirina(Math.ceil(najduzi) + 1);
        }}>
        {children}
      </Text>
      {strelica && <ChevronRight size={20} color={OBLAST_BOJA} strokeWidth={2.2} />}
    </View>
  );
}
