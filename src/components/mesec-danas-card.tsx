import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Button } from '@/components/ui/button';
import { OblastIkona } from '@/components/oblast-ikona';
import { KapsuleRed } from '@/components/ui/kapsule';
import { ZnakIkona } from '@/components/znak-ikona';
import { OZNAKA_12 } from '@/components/tvoj-dan-card';
import { KarticaTranzita } from '@/components/tranziti-lista';
import { chartRulers, rulerRole } from '@/lib/rulers';
import { CARD_SURFACE } from '@/components/ui/card';
import { MoonDisc } from '@/components/moon-disc';
import { cn } from '@/lib/utils';
import { SIGN_CASES, signFromLongitude } from '@/lib/zodiac';
import type { NatalChart } from '@/lib/natal';
import {
  LUNAR_AREAS, PHASE_SUMMARY_PRIVREMENO, phaseDay, type LunarArea,
} from '@/lib/moon';
import { useLunarText } from '@/lib/lunar-texts';
import { useTransitTexts } from '@/lib/transit-texts';
import { moonDay, strongestMoonHit } from '@/lib/transits';
import { lunarneStavke, prveRecenice, type Stavka } from '@/lib/tumacenje';
import { tezina } from '@/theme/tipografija';
import { useNaMrezi } from '@/lib/mreza';

/** Nazivi tabova na kartici (brief). "Ljubav" je u tekstovima "Ljubav i odnosi". */
const TAB: Record<LunarArea, string> = {
  ljubav: 'Ljubav', zdravlje: 'Zdravlje i lepota', karijera: 'Karijera i finansije', kuca: 'Kuća', basta: 'Bašta',
};

/** Ilustracija Meseca desno od naslova i znak dole desno na njoj. */
const MESEC = 96;
const ZNAK = 28;

// Red "Dan ploda / korena…" na Basti izbacen (Ivan, 28.9.2026); deo biljke ostaje na ekranu Mesec.

/**
 * "Mesec danas" — Premium slajd: faza kao ilustracija, lunarni savet
 * isti za sve znakove po oblastima, i jedan licni red za Mlad i Pun Mesec.
 * Faza i znak se racunaju u `phaseDay` (`lib/moon.ts`); tekst je astrologov
 * lunarni kalendar po paru faza + znak (`lib/lunar-texts.ts`).
 *
 * Redosled tabova je fiksan: onboarding jos nema korak sa interesovanjima.
 */
export function MesecDanasCard({ date, offset, chart, timeUnknown, excludeKey = null }: {
  date: Date;
  offset: number;
  chart: NatalChart;
  timeUnknown: boolean;
  /** Vise se ne prikazuje ("Za tebe" bez imena, Ivan 28.9.2026); ostaje da pozivi ne pucaju. */
  name?: string;
  /** Tranzit vec prikazan u "Tvom danu" — ne ponavlja se ovde. */
  excludeKey?: string | null;
}) {
  const naMrezi = useNaMrezi();
  const faza = React.useMemo(() => phaseDay(date), [date]);
  const znak = signFromLongitude(faza.moonLongitude).sign;
  const [oblast, setOblast] = React.useState<LunarArea>('ljubav');
  const { body, loading } = useLunarText(faza.textPhase, znak.key, oblast);
  // Jedna stavka po oblasti (Ivan, 28.9.2026); Basta i dalje Uradi / Izbegavaj.
  // Jedna stavka po oblasti, i za Baštu (Ivan, 28.9.2026) — bez Uradi / Izbegavaj.
  const s = body ? lunarneStavke(body, 1) : null;
  const smer = faza.waxing ? 'raste' : 'opada';
  const naslov = `${faza.name} u ${SIGN_CASES[znak.key].loc}`;

  // LICNI DEO (Ivan, 28.9.2026): kako Mesec danas utice na tebe — najjaci
  // Mesecev aspekt na natalnu kartu koji postaje tacan tog dana (`moonDay`),
  // isti ceo dan. Bez njega (0—9 dana godisnje) red se ne prikazuje.
  const dan = React.useMemo(() => moonDay(chart, date, timeUnknown), [chart, date, timeUnknown]);
  const hit = strongestMoonHit(dan.hits, excludeKey);
  const kljucevi = React.useMemo(() => (hit ? [hit.contentKey] : []), [hit?.contentKey]);
  const { texts } = useTransitTexts(kljucevi);
  // Bez imena tranzita i sata (Ivan, 28.9.2026) — red postoji samo kad ima tekst.
  const hitTekst = hit ? texts.get(hit.contentKey) : undefined;

  // Red "Mlad/Pun Mesec u tvojoj N. kuci" (`lunationHouse`) ceka tekst astrologa;
  // kad stigne, ide u karticu "Za tebe".


  // Raspored kao prvi slajd (Ivan, 28.9.2026): bez kartice oko vrha — oznaka,
  // veliki naslov sa ilustracijom desno, recenica, dugme; ispod dve kartice.
  return (
    <View>
      <View className="flex-row items-start gap-4">
        <View className="flex-1">
          {/* Osvetljenost uz oznaku, ne ispod ilustracije; mala tacka, po dva razmaka (Ivan, 28.9.2026). */}
          <Text variant="oznaka" className={OZNAKA_12}>Mesec danas{'\u00A0\u00A0·\u00A0\u00A0'}{faza.illuminationPct}%</Text>
          <Text variant="display" className="mt-3">{naslov}</Text>
          {/* PRIVREMENA recenica faze dok astrolog ne posalje prave (`PHASE_SUMMARY_PRIVREMENO`).
              U koloni naslova, pored ilustracije, blizu naslova (Ivan, 28.9.2026). Ista mera
              kao sazetak na prvom slajdu (17/24). */}
          <Text variant="body" className="mt-2 text-[17px] leading-[24px]">{PHASE_SUMMARY_PRIVREMENO[faza.key]}</Text>
          {/* "Saznaj više" odmah ispod opisa (Ivan, 29.9.2026; ranije u kartici, ispod saveta).
              Poravnanje na omotacu (`istaknuto` dugme ima omotac sa senkom). */}
          <View className="mt-4 self-start">
            <Button
              size="compact"
              istaknuto
              className="h-auto px-5 py-[10px]"
              onPress={() => router.push({ pathname: '/moon', params: { day: String(offset), area: oblast } })}>
              <Text className="text-[16px] leading-[20px]">Saznaj više</Text>
            </Button>
          </View>
        </View>
        {/* Ilustracija faze, znak u kom je Mesec dole desno. */}
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${naslov}, osvetljenost ${faza.illuminationPct} posto, ${smer}`}
          // Spusteno u visinu naslova, ne uz oznaku (Ivan, 28.9.2026).
          className="mt-6 items-center">
          <View>
            <MoonDisc angle={faza.angle} size={MESEC} />
            <View className="absolute -bottom-1 -right-1 rounded-pill bg-grouped p-[2px]">
              <ZnakIkona znak={znak.key} element={znak.element} size={ZNAK} />
            </View>
          </View>
        </View>
      </View>

      {/* Oblasti: pravo staklo (bez sive nijanse), izabrana svetlo lila, U kartici sa
          savetom (Ivan, 29.9.2026). */}
      {/* Odmaknuto od crnog dugmeta (Ivan, 29.9.2026). */}
      <Kartica className="mt-8">
        <KapsuleRed
          stavke={LUNAR_AREAS.map((a) => ({
            key: a.key,
            label: TAB[a.key],
            icon: <OblastIkona oblast={a.key} size={20} aktivna={a.key === oblast} />,
          }))}
          izabrana={oblast}
          onIzbor={setOblast}
        />

        <View className="pt-4">
          {s && s.stavke.length ? (
            <Savet stavka={s.stavke[0]} />
          ) : loading ? (
            <TextPlaceholder lines={2} />
          ) : (
            // Bez interneta se ne tvrdi da saveti nisu stigli — mozda samo nisu sacuvani.
            <Text variant="muted">{naMrezi ? 'Saveti za ovu oblast još nisu stigli.' : 'Saveti će se pojaviti kad se veza vrati.'}</Text>
          )}
        </View>
      </Kartica>

      {/* "Za tebe" — kartica kao u tabu "Tranziti" (Ivan, 28.9.2026): "Za tebe" umesto
          imena tranzita, dva reda teksta umesto tona i trajanja. Dodir otvara ceo tekst. */}
      {hit && hitTekst && (
        <View className="mt-3">
          <KarticaTranzita
            red={{
              key: hit.contentKey,
              transiting: hit.transiting,
              aspect: hit.aspect,
              natal: hit.natal,
              ruler: rulerRole(hit.transiting.key, hit.natal.key, chartRulers(chart, timeUnknown)),
            }}
            oznaka="Za tebe"
            naslov={hitTekst.title ?? ''}
            loading={false}
            opis={hitTekst.body ? prveRecenice(hitTekst.body) : undefined}
          />
        </View>
      )}
    </View>
  );
}

/** Kartica ispod vrha: uvek bela (Ivan, 28.9.2026: staklo samo na kapsulama). */
function Kartica({ className, children }: { className?: string; children: React.ReactNode }) {
  // `overflow-hidden`: red staklenih oblasti se ne sece sam (`ui/kapsule.tsx`) — kartica ga
  // sece na svojoj ivici, i vodoravno pri skrolu.
  return <View className={cn(CARD_SURFACE, 'overflow-hidden p-4', className)}>{children}</View>;
}

/** Savet oblasti — samo tekst, bez tacke (Ivan, 28.9.2026); naslov stavke podebljan. */
function Savet({ stavka }: { stavka: Stavka }) {
  return (
    <Text variant="default">
      {stavka.naslov ? <Text variant="default" className={tezina('naslovUTekstu')}>{stavka.naslov} – </Text> : null}
      {stavka.tekst}
    </Text>
  );
}
