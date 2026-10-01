import * as React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { ChevronDown, ChevronRight, ChevronUp, Lock } from 'lucide-react-native';
import { router } from 'expo-router';

import { NatalWheel } from '@/components/natal-wheel';
import { IznadPreliva } from '@/components/screen';
import { Text } from '@/components/ui/text';

import { cn } from '@/lib/utils';
import { datumRodjenja } from '@/lib/horoscope';
import { CARD_SURFACE } from '@/components/ui/card';
import { OZNAKA_12 } from '@/components/tvoj-dan-card';
import { ZnakIkona } from '@/components/znak-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import {
  AspektRed, BALON_PREKO, BALON_VISINA, KUCA_KOLONA, Tacka, TrojkaPlocica, ZnakKolona, redosledPlaneta, stepenMinut, TockInfo,
} from '@/components/karta-lista';
import { PREMIUM } from '@/components/zakljucano';
import { useAuthStore, useEntitlement } from '@/store/auth';
import { usePricaZnakaPogledana } from '@/store/prica-znaka-log';
import type { ResolvedProfile } from '@/store/profile';
import {
  allNatalKeys, isFreeNatalKey, moonSignForUnknownTime, natalAspects, natalTopic,
  type MoonSign, type NatalTopic,
} from '@/lib/natal-keys';
import { useNatalNaslovi, type NatalNaslov } from '@/lib/natal-texts';
import type { SignPosition } from '@/lib/zodiac';
import { useT, type Recnik } from '@/i18n';

type ZnakKljuc = keyof Recnik['nebo']['znaci'];
import type { NatalChart } from '@/lib/natal';
import { neutral } from '@/theme/tokens';

const KARTICA = CARD_SURFACE;

/**
 * Natalna karta — tocak, ime i podaci o rodjenju, velika trojka, planete i
 * aspekti. Tab "Ti" (korisnikova karta) i strana osobe (`app/osoba.tsx`,
 * 29.9.2026) crtaju ISTO; osoba se razlikuje samo po `osobaId`, koji ide uz
 * tumacenje (`/natal?tema=…&osoba=…`), da list otvori njenu kartu, ne tvoju.
 *
 * Ekran je od 28.9.2026 na SIVOJ pozadini sa indigo prelivom (Ivan; ranije bela
 * bez preliva), pa kartice nose standardnu povrsinu kao ostali tabovi — bela
 * kartica na sivom, preliv je boji kad prolazi ispod njega (pravilo 17).
 */
export function NatalnaKartaPrikaz({ resolved, osobaId, posleTrojke }: {
  resolved: ResolvedProfile;
  /** Karta druge osobe — ide uz svako tumacenje; bez njega je karta korisnikova. */
  osobaId?: string;
  /** Umetak posle velike trojke ("Tvoji ljudi" na tabu "Ti"). */
  posleTrojke?: React.ReactNode;
}) {
  const rec = useT();
  const tp = rec.karta.prikaz;
  const { width } = useWindowDimensions();

  // Aspekti izmedju planeta i na Ascendent (na MC ne — Ivan, 28.9.2026), najtesnji prvi.
  // Bez vremena rodjenja nema aspekata na ASC, a Mesecevi se ne tumace (`natal-keys.ts`).
  const aspects = React.useMemo(
    () => natalAspects(resolved.chart, resolved.timeUnknown),
    [resolved]
  );
  // Naslovi tumacenja za listu — i zakljucanih, bez teksta (`natal-naslovi.sql`).
  const kljucevi = React.useMemo(
    () => allNatalKeys(resolved.chart, resolved.timeUnknown, resolved.utc),
    [resolved]
  );
  const naslovi = useNatalNaslovi(kljucevi);
  const premium = !!useEntitlement()?.active;
  // Prica o znaku (pravilo 25) je samo za SVOJU kartu: Sunce u trojci je ulaz, a tumacenje je na njenoj poslednjoj slici.
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const sunceZnak = resolved.chart.planets.find((x) => x.key === 'sun')?.position.sign.key ?? null;
  const pricaPogledana = usePricaZnakaPogledana(userId, sunceZnak);
  const imaPricu = !osobaId && !resolved.zoneUnreliable;
  const zakljucan = (k: string) => !premium && !isFreeNatalKey(k);
  // Rasklopljena planeta; Sunce je otvoreno na ulazu, kao na sajtu.
  const [otvorena, setOtvorena] = React.useState<string | null>('sun');
  const mesecZnak = React.useMemo<MoonSign | null>(() => {
    if (resolved.timeUnknown) return moonSignForUnknownTime(resolved.utc);
    const m = resolved.chart.planets.find((x) => x.key === 'moon');
    return m ? { certain: true, sign: m.position.sign } : null;
  }, [resolved]);

  // Tumacenje: `/natal?tema=…`. Sta ekran pokazuje odlucuje karta, ne parametar.
  // `deo=kuca` — sa reda "u 2. kući": na listu ide prvo tekst kuce.
  const otvori = (tema: string, deo?: 'kuca') =>
    router.push({ pathname: '/natal', params: { tema, ...(deo ? { deo } : {}), ...(osobaId ? { osoba: osobaId } : {}) } });

  if (!mesecZnak) return null;

  const { chart, profile, city, timeUnknown, zoneUnreliable } = resolved;
  const b = profile.birth;
  const t = profile.time;
  const wheelSize = Math.min(width - 16, 430);
  const sunce = chart.planets.find((x) => x.key === 'sun')!;

  return (
    <>
      {zoneUnreliable ? (
        <View className={cn(KARTICA, 'mx-5 border-destructive/40 p-5')}>
          <Text variant="h3">{tp.nemozeNaslov}</Text>
          <Text variant="muted" className="mt-2">{tp.nemozeOpis(city.name)}</Text>
          <Text variant="muted" className="mt-3 text-xs">{tp.javiNam(city.tz.name)}</Text>
        </View>
      ) : (
        // Krug malo navise, blize zaglavlju (Ivan, 28.9.2026; isto na "Nebu"), i IZNAD
        // preliva — beo, ne obojen (Ivan, 30.9.2026). Na strani osobe preliva nema, pa je
        // `IznadPreliva` tamo obican View.
        <IznadPreliva
          className="-mt-3 items-center"
          // Bez vremena rodjenja krug nema kuca, ASC ni MC (Ivan, 30.9.2026; pravilo 5).
          podignuto={<NatalWheel chart={chart} size={wheelSize} bezKuca={timeUnknown} />}>
          {/* "i" DOLE desno od kruga, dno ikonice u liniji sa dnom kruga, svetlo ljubicasta
              (Ivan, 28.9.2026): sta je natalna karta, legenda aspekata, elementi. */}
          <TockInfo velicina={wheelSize} onPress={() => router.push('/natalna-karta-info')}
            accessibilityLabel={tp.infoA11y} />
        </IznadPreliva>
      )}

      {/* Ime i podaci o rodjenju ISPOD tocka, centrirano (Ivan, 28.9.2026) */}
      <View className="-mt-4 items-center px-5">
        <Text variant="h1" className="text-center">{profile.name}</Text>
        <Text variant="muted" className="mt-1 text-center">
          {tp.rodjenje(
            datumRodjenja(b),
            t ? `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}` : null,
            city.name,
          )}
        </Text>
      </View>

      {/* Velika trojka: Sunce, Mesec, podznak (Ivan, 28.9.2026 — kao na sajtu, plus Mesec) */}
      {!zoneUnreliable && (
        <View className="mx-5 mt-5 flex-row gap-2" style={imaPricu ? { paddingBottom: BALON_VISINA - BALON_PREKO - 8 } : undefined}>
          <TrojkaPlocica
            oznaka={rec.nebo.tela.sun}
            slika="sun"
            znak={sunce.position.sign}
            onPress={imaPricu ? () => router.push('/prica-znak') : () => otvori('sun')}
            prica={imaPricu ? { pogledana: pricaPogledana, natpis: tp.tvojZnak } : undefined}
          />
          {mesecZnak.certain ? (
            <TrojkaPlocica oznaka={rec.nebo.tela.moon} slika="moon" znak={mesecZnak.sign} onPress={() => otvori('moon')} />
          ) : (
            // Bez vremena rodjenja Mesec je tog dana presao u sledeci znak — oba imena,
            // a na slici znak pitanja umesto znaka: ne pogadja se.
            <TrojkaPlocica oznaka={rec.nebo.tela.moon} slika="moon" znak={null} ime={tp.znakIli(mesecZnak.from.name, mesecZnak.to.name)}
              onPress={() => otvori('moon')} />
          )}
          <TrojkaPlocica oznaka={rec.karta.podznak} slika="earth" znak={timeUnknown ? null : chart.ascendantSign.sign}
            onPress={timeUnknown ? undefined : () => otvori('ascendant')} />
        </View>
      )}

      {timeUnknown && (
        <View className={cn(KARTICA, 'mx-5 mt-4 p-4')}>
          <Text variant="muted">{tp.bezVremena}</Text>
        </View>
      )}

      {posleTrojke}

      {!zoneUnreliable && (
        <>
          {/* Planete: red se rasklapa na "u znaku" i "u kuci" sa naslovom tumacenja (kao sajt).
              Ascendent i MC su na kraju iste liste; ASC je i u trojki, ali ovde ima stepen. */}
          <View className={cn(KARTICA, 'mx-5 mt-4 overflow-hidden')}>
            {/* Redosled (Ivan, 28.9.2026): Ascendent, Sunce, Mesec, pa ostale planete; MC na kraju. */}
            {/* "Podznak", kao plocica iznad (UX recenzija 1.10.2026): isti pojam je na istom ekranu
                imao dva imena. Ikonica ASC ostaje i veze ga sa tockom. */}
            <UgaoRed tacka="ascendant" ime={rec.karta.podznak} pos={chart.ascendantSign} muted={timeUnknown}
              // Bez vremena rodjenja podznak nije poznat — nema ni tumacenja.
              onPress={timeUnknown ? undefined : () => otvori('ascendant')} />
            {redosledPlaneta(chart.planets).map((p) => {
              const topic = natalTopic(chart, timeUnknown, resolved.utc, p.key);
              if (topic?.kind !== 'planet') return null;
              return (
                <PlanetaRed
                  key={p.key}
                  planeta={p}
                  topic={topic}
                  otvoren={otvorena === p.key}
                  onToggle={() => setOtvorena(otvorena === p.key ? null : p.key)}
                  naslovi={naslovi}
                  zakljucan={zakljucan}
                  otvori={otvori}
                />
              );
            })}
            <UgaoRed tacka="midheaven" ime={rec.karta.mc} pos={chart.midheavenSign} muted={timeUnknown} last />
          </View>

          {/* Aspekti: naslov tumacenja je glavni red, ime aspekta i orbis sitno ispod (kao sajt). */}
          {/* Naslov U kartici, kao na Nebu (Ivan, 29.9.2026): prvi red, oznaka 12pt. */}
          <View className={cn(KARTICA, 'mx-5 mt-4 overflow-hidden')}>
            <View className="border-b border-border px-4 py-3">
              <Text variant="oznaka" className={OZNAKA_12} accessibilityRole="header">
                {rec.karta.aspektiNaslov(aspects.length)}
              </Text>
            </View>
            {aspects.map((a, i) => (
              <AspektRed
                key={a.key}
                aspekt={a}
                naslov={a.interpreted ? naslovi.get(a.key)?.subtitle ?? '' : ''}
                zakljucan={a.interpreted && zakljucan(a.key)}
                last={i === aspects.length - 1}
                onPress={a.interpreted ? () => otvori(a.key) : undefined}
              />
            ))}
          </View>
        </>
      )}
    </>
  );
}

type PlanetaKarte = NatalChart['planets'][number];

/**
 * Red planete: ikonica, ime i stepen; desno znak i kuca. Dodir rasklapa dva
 * reda — "u Raku" i "u 2. kući" — sa naslovom tumacenja i katancem kad je placen.
 */
function PlanetaRed({ planeta: p, topic, otvoren, onToggle, naslovi, zakljucan, otvori }: {
  planeta: PlanetaKarte;
  topic: Extract<NatalTopic, { kind: 'planet' }>;
  otvoren: boolean;
  onToggle: () => void;
  naslovi: Map<string, NatalNaslov>;
  zakljucan: (k: string) => boolean;
  otvori: (tema: string, deo?: 'kuca') => void;
}) {
  const t = useT();
  const neznan = !!topic.moon && !topic.moon.certain; // Mesec bez vremena rodjenja
  const Strelica = otvoren ? ChevronUp : ChevronDown;
  const znakTekst = neznan && topic.moon && !topic.moon.certain
    ? t.karta.prikaz.uZnakuIli(topic.moon.from.key as ZnakKljuc, topic.moon.to.key as ZnakKljuc)
    : t.nebo.uZnaku(p.position.sign.key as ZnakKljuc);
  return (
    <View className="border-b border-border">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: otvoren }}
        accessibilityLabel={t.karta.prikaz.planetaA11y(p.name, neznan ? null : p.position.sign.name, topic.houseKey ? p.house : null)}
        className="flex-row items-center py-3 pl-4 pr-3 active:opacity-60">
        <Tacka tacka={p.key} glyph={p.glyph} size={28} />
        {/* Ime i stepen u ISTOM redu (Ivan, 28.9.2026); stepen prelazi ispod samo kad ne stane. */}
        <View className="ml-3 mr-2 flex-1 flex-row flex-wrap items-baseline gap-x-1">
          <Text variant="row" numberOfLines={1}>{p.name}</Text>
          <Text variant="caption">{stepenMinut(p.position)}{p.retrograde ? ` ${t.karta.retro}` : ''}</Text>
        </View>
        {/* Rasklopljen red: znak i kuca su u redovima ispod, u zaglavlju se ne ponavljaju (Ivan, 28.9.2026). */}
        {!otvoren && (
          <>
            <ZnakKolona znak={neznan ? null : p.position.sign} />
            <View className="items-end" style={{ width: KUCA_KOLONA }}>
              {topic.houseKey && <KucaBroj kuca={p.house} />}
            </View>
          </>
        )}
        <Strelica size={18} color={neutral.inkSubtle} strokeWidth={2.2} style={{ marginLeft: 8 }} />
      </Pressable>
      {otvoren && (
        <View className="bg-fill/60">
          <PodRed
            ikona={neznan ? null : <ZnakIkona znak={p.position.sign.key} element={p.position.sign.element} size={20} />}
            tekst={znakTekst}
            naslov={topic.signKey ? naslovi.get(topic.signKey)?.subtitle ?? '' : ''}
            zakljucan={!!topic.signKey && zakljucan(topic.signKey)}
            onPress={() => otvori(p.key)}
          />
          {topic.houseKey && (
            <PodRed
              ikona={<KucaBroj kuca={p.house} size={20} />}
              tekst={t.karta.uKuci(p.house)}
              naslov={naslovi.get(topic.houseKey)?.subtitle ?? ''}
              zakljucan={zakljucan(topic.houseKey)}
              onPress={() => otvori(p.key, 'kuca')}
              prvi={false}
            />
          )}
        </View>
      )}
    </View>
  );
}

/** Rasklopljen red: "u Raku: Lojalni i brižni kolekcionar uspomena", katanac, strelica. */
function PodRed({ ikona, tekst, naslov, zakljucan, onPress, prvi = true }: {
  ikona: React.ReactNode;
  tekst: string;
  naslov: string;
  zakljucan: boolean;
  onPress: () => void;
  prvi?: boolean;
}) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.karta.prikaz.podRedA11y(tekst, naslov, zakljucan)}
      className={cn('min-h-[44px] flex-row items-center py-2.5 pl-4 pr-3 active:opacity-60', !prvi && 'border-t border-border')}>
      {/* Bez uvlacenja (Ivan, 28.9.2026): ikonica u koloni ikonice planete, tekst u liniji sa imenom. */}
      <View className="mr-3 items-center" style={{ width: 28 }}>{ikona}</View>
      <Text variant="muted" className="flex-1 text-foreground" numberOfLines={2}>
        <Text variant="muted">{tekst}{naslov ? ': ' : ''}</Text>
        {naslov}
      </Text>
      {zakljucan && <Lock size={13} color={PREMIUM} strokeWidth={2.4} style={{ marginLeft: 6 }} />}
      <ChevronRight size={16} color={neutral.inkSubtle} strokeWidth={2.2} style={{ marginLeft: 6 }} />
    </Pressable>
  );
}

/** Ascendent ili MC na kraju liste planeta: bez kuce, bez rasklapanja. */
function UgaoRed({ tacka, ime, pos, muted, onPress, last }: {
  tacka: 'ascendant' | 'midheaven';
  ime: string;
  pos: SignPosition;
  muted: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  const t = useT();
  const sadrzaj = (
    <>
      <View style={{ opacity: muted ? 0.5 : 1 }}><Tacka tacka={tacka} glyph={tacka === 'ascendant' ? 'ASC' : 'MC'} size={28} /></View>
      <View className="ml-3 mr-2 flex-1 flex-row flex-wrap items-baseline gap-x-1">
        <Text variant="row" numberOfLines={1} className={cn(muted && 'text-muted-foreground')}>{ime}</Text>
        <Text variant="caption">{stepenMinut(pos)}</Text>
      </View>
      <ZnakKolona znak={pos.sign} muted={muted} />
      {/* Mesto kuce ostaje prazno, da znak i strelica stoje u koloni sa planetama. */}
      <View style={{ width: KUCA_KOLONA }} />
      {/* Bez strelice ostaje isti razmak, da znak stoji u koloni sa ostalim redovima. */}
      {onPress ? <ChevronRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} style={{ marginLeft: 8 }} /> : <View style={{ width: 26 }} />}
    </>
  );
  const klasa = cn('flex-row items-center py-3 pl-4 pr-3', !last && 'border-b border-border');
  if (!onPress) return <View className={klasa}>{sadrzaj}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t.karta.prikaz.ugaoA11y(ime, pos.sign.key as ZnakKljuc)}
      className={cn(klasa, 'active:opacity-60')}>
      {sadrzaj}
    </Pressable>
  );
}
