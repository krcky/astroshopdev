import * as React from 'react';
import { Pressable, View, type ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, Keyframe, LinearTransition } from 'react-native-reanimated';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { ZnakIkona } from '@/components/znak-ikona';
import { ElementIkona } from '@/components/element-ikona';
import { BiljkaIkona } from '@/components/biljka-ikona';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { SheetScroll } from '@/components/sheet';
import { GlassIconButton } from '@/components/ui/glass-button';
import { CARD_SURFACE } from '@/components/ui/card';
import { MoonDisc } from '@/components/moon-disc';
import { OblastIkona } from '@/components/oblast-ikona';
import { KapsuleRed, LILA_SVETLA } from '@/components/ui/kapsule';
import { KarticaTranzita } from '@/components/tranziti-lista';
import { chartRulers, rulerRole } from '@/lib/rulers';
import { cn } from '@/lib/utils';
import { moonPhase } from '@/lib/astro';
import { dayKey, moonDay } from '@/lib/transits';
import {
  DANI_U_NEDELJI, MESECI_PUNO, glavneFazeMeseca, istiDan, mrezaMeseca, naDan, nedeljaDana, pomeriDan, ugaoDana,
} from '@/lib/lunarni-kalendar';
import { OZNAKA_12 } from '@/components/tvoj-dan-card';
import { useDanas } from '@/store/danas';
import { tezina } from '@/theme/tipografija';
import { formatDatumKratko, formatDay, formatTime } from '@/lib/horoscope';
import {
  moonState, moonSignAt, moonElement, formatIllumination, phaseDay, LUNAR_AREAS, MAIN_PHASES, naslovMeseca, type LunarArea,
} from '@/lib/moon';
import { SIGN_CASES, signFromLongitude } from '@/lib/zodiac';
import { useLunarTexts } from '@/lib/lunar-texts';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { useTransitTexts } from '@/lib/transit-texts';
import { useResolvedProfile } from '@/store/profile';
import { brand, neutral } from '@/theme/tokens';
import { useNaMrezi } from '@/lib/mreza';

/** Klizanje blokova na novo mesto kad se visina iznad promeni (tekst, oblast, dan). */
const KLIZANJE = LinearTransition.duration(260);

/** Ulazak bez providnosti — za blokove sa staklom. Nov objekat svaki put: `delay` menja Keyframe. */
const doplovi = (kasnjenje: number) => new Keyframe({
  0: { transform: [{ translateY: 16 }] },
  100: { transform: [{ translateY: 0 }] },
}).duration(320).delay(kasnjenje);

/** Nov dan: crtez i tekst se pretope i malo "doplove" (kao listanje). */
const PROMENA_DANA = new Keyframe({
  0: { opacity: 0.2, transform: [{ scale: 0.97 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(240);

/** Crtez Meseca na vrhu i znak u belom prstenu dole desno (kao velika trojka na tabu "Ti"). */
const DISK = 128;
const ZNACKA = 36;
const PRSTEN = 3;
/** Ikonice biljke i elementa — bez sivog kruga (Ivan, 29.9.2026). */
const PODATAK_IKONA = 20;
/** Mesec u celiji kalendara. */
const CELIJA_MESEC = 26;

/**
 * Ekran Mesec — otvara se sa kartice na pocetnoj. Sve sto se o Mesecu izabranog
 * dana zna: crtez sa znakom, faza, procenat, lunarni dan, do kad je u znaku, deo
 * biljke i element, saveti po oblastima i Mesecevi tranziti na kartu.
 *
 * REDIZAJN (Ivan, 29.9.2026): znak je malo dole desno uz crtez, a ne ponavlja se
 * u redu podataka (ostali su biljka i element); dan se pomera strelicama (dan
 * unapred/unazad) i MESECNIM KALENDAROM — svaki dan sa oblikom Meseca, glavne
 * faze obelezene, meseci se listaju. Racun: `lib/lunarni-kalendar.ts`.
 *
 * `day` je pomeraj dana sa pocetne (-2..2) — ekran se OTVARA na tom danu, dalje
 * se dan menja ovde. `area` je oblast izabrana na pocetnoj, da se otvori bas taj tab.
 * Saveti po oblastima su lunarni kalendar astrologa (`lunar_texts`, 28.9.2026):
 * faza i znak dolaze iz `phaseDay()`, istog izvora kao kartica na pocetnoj. Na
 * dan glavne faze znak je onaj iz TRENUTKA faze, pa ekran kaze na sta se tekst
 * odnosi ("Pun mesec u Biku"). Bez teksta tab to kaze, ne izmislja.
 */
export default function MoonScreen() {
  const naMrezi = useNaMrezi();
  const { day, area } = useLocalSearchParams<{ day?: string; area?: string }>();
  const resolved = useResolvedProfile();
  const danas = useDanas();
  // Otvara se na oblasti koja je bila izabrana na pocetnoj.
  const [oblast, setOblast] = React.useState<LunarArea>(
    LUNAR_AREAS.some((a) => a.key === area) ? (area as LunarArea) : 'ljubav'
  );

  // Izabran dan: sat i minut "sada", da procenat za danas bude trenutni.
  const [date, setDate] = React.useState(() => pomeriDan(new Date(), Number(day) || 0));
  const jeDanas = istiDan(date, danas);
  // Ceo mesec je ZASEBAN PRIKAZ u listu — samo kalendar, strelica nazad gore levo
  // (Ivan, 29.9.2026). Otvara ga dodir na datum gore ili "Ceo mesec" ispod nedelje;
  // izbor dana ga zatvara i vraca na taj dan.
  const [samoKalendar, setSamoKalendar] = React.useState(false);

  // POKRET (Ivan, 29.9.2026: "nesto ne izgleda smooth"). Ulazak blokova jedan za drugim
  // samo pri PRVOM otvaranju lista; posle toga promene idu pretapanjem i klizanjem.
  // Reanimated po podrazumevanom postuje "Smanji pokrete" (ReduceMotion.System).
  // Stanje, ne ref (ref se ne cita tokom crtanja): posle prvog kadra je `false`.
  const [prviPut, setPrviPut] = React.useState(true);
  React.useEffect(() => { const t = setTimeout(() => setPrviPut(false), 0); return () => clearTimeout(t); }, []);
  // Blok se montira ponovo i pri prelazu dan <-> kalendar: tada se samo pretopi.
  const ulaz = (i: number) => (prviPut ? FadeInDown.duration(320).delay(i * 45) : FadeIn.duration(220));
  // Blokovi sa STAKLOM (strelice, oblasti) ulaze BEZ providnosti: providan roditelj
  // kvari staklo na iOS-u i ono se ne vrati (`ui/kapsule.tsx`) — samo doplove odozdo.
  const ulazStaklo = (i: number) => (prviPut ? doplovi(i * 45) : undefined);

  // Kalendar se otvara od vrha; povratak vraca na mesto gde je dan bio skrolovan.
  const skrol = React.useRef<ScrollView>(null);
  const skrolY = React.useRef(0);
  const skrolDana = React.useRef(0);
  const otvoriKalendar = () => { skrolDana.current = skrolY.current; setSamoKalendar(true); };
  const prviPrikaz = React.useRef(true);
  React.useEffect(() => {
    if (prviPrikaz.current) { prviPrikaz.current = false; return; }
    const y = samoKalendar ? 0 : skrolDana.current;
    requestAnimationFrame(() => skrol.current?.scrollTo({ y, animated: false }));
  }, [samoKalendar]);
  const dan = React.useMemo(
    () => (resolved ? moonDay(resolved.chart, date, resolved.timeUnknown) : null),
    [resolved, date]
  );
  const stanje = React.useMemo(() => moonState(date), [date]);
  const kljucevi = React.useMemo(() => (dan ? dan.hits.map((h) => h.contentKey) : []), [dan]);
  const { texts, loading: tekstoviLoading } = useTransitTexts(kljucevi);
  const vladari = React.useMemo(
    () => (resolved ? chartRulers(resolved.chart, resolved.timeUnknown) : []),
    [resolved]
  );
  const faza = React.useMemo(() => phaseDay(date), [date]);
  const lunarniZnak = signFromLongitude(faza.moonLongitude).sign;
  const { texts: lunarni, loading: lunarniLoading } = useLunarTexts(faza.textPhase, lunarniZnak.key);

  if (!resolved || !dan) return <Redirect href="/" />;

  const znak = moonSignAt(dan, date);
  const { element, plant } = moonElement(znak);
  // Znak je u naslovu; ispod samo kad Mesec tog dana menja znak.
  // Znak u naslovu je onaj u izabranom trenutku; posle prelaska red kaze od kad.
  const prelazak = !dan.ingress ? null
    : date >= dan.ingress.at
      ? `Od ${formatTime(dan.ingress.at)}, pre toga u ${SIGN_CASES[dan.sign.key].loc}`
      : `Do ${formatTime(dan.ingress.at)}, zatim u ${SIGN_CASES[dan.ingress.sign.key].loc}`;
  const savet = lunarni.get(oblast);

  // Oba prikaza su ISTI `SheetScroll` (isti koren), pa skrol zivi; sadrzaj se pretopi.
  const skrolProps = { siva: true, skrolRef: skrol, onScrollY: (y: number) => { skrolY.current = y; } };

  if (samoKalendar) {
    return (
      <SheetScroll {...skrolProps}>
        {/* Samo kalendar: strelica nazad gore levo vraca na dan (Ivan, 29.9.2026). */}
        {/* Naslov na sredini lista, `h2` (Ivan, 29.9.2026); strelica ostaje levo, preko reda. */}
        <View className="h-11 justify-center">
          <Text variant="h2" className="text-center" accessibilityRole="header">Lunarni kalendar</Text>
          <View className="absolute left-0">
            <DanDugme smer={-1} onPress={() => setSamoKalendar(false)} label="Nazad" />
          </View>
        </View>
        <Animated.View entering={FadeIn.duration(220)}>
          <Kalendar
            izabran={date}
            danas={danas}
            onIzbor={(d) => { setDate(naDan(d, new Date())); setSamoKalendar(false); }}
            otvoren
          />
        </Animated.View>
      </SheetScroll>
    );
  }

  return (
    // List odozdo do vrha, bez zaglavlja i strelice nazad — zatvara se povlacenjem
    // (Ivan, 29.9.2026; ranije unutrasnja strana sa ljubicastim prelivom).
    <SheetScroll {...skrolProps}>
      {/* Dan: strelice za dan unazad/unapred, "Danas" kad je izabran drugi dan. */}
      <Animated.View entering={ulazStaklo(0)} className="flex-row items-center justify-between">
        <DanDugme smer={-1} onPress={() => setDate((d) => pomeriDan(d, -1))} />
        <View className="items-center">
          {/* Dodir na datum otvara kalendar celog meseca. */}
          <Pressable
            onPress={otvoriKalendar}
            accessibilityRole="button"
            accessibilityLabel={`${formatDatumKratko(date)}. Otvori kalendar`}
            hitSlop={8}
            className="flex-row items-center gap-1 active:opacity-60">
            <Text variant="oznaka" className={OZNAKA_12}>{formatDatumKratko(date)}</Text>
            <ChevronDown size={14} color={neutral.inkMuted} strokeWidth={2.2} />
          </Pressable>
          {jeDanas ? (
            <Text variant="caption" className="mt-0.5">Danas</Text>
          ) : (
            <Pressable onPress={() => setDate(naDan(danas, new Date()))} accessibilityRole="button" hitSlop={8} className="active:opacity-60">
              <Text variant="caption" className="mt-0.5 text-foreground underline">Nazad na danas</Text>
            </Pressable>
          )}
        </View>
        <DanDugme smer={1} onPress={() => setDate((d) => pomeriDan(d, 1))} />
      </Animated.View>

      {/* Crtez i tekst dana: nov dan se kratko pretopi i "doplovi" (key = dan). */}
      <Animated.View key={dayKey(date)} entering={prviPut ? ulaz(1) : PROMENA_DANA} layout={KLIZANJE}>
      <View className="items-center pt-6">
        {/* Znak dole desno uz crtez, u belom prstenu — kao velika trojka na tabu "Ti". */}
        <View style={{ width: DISK, height: DISK }}>
          <MoonDisc angle={stanje.angle} size={DISK} vrti />
          <View
            className="absolute items-center justify-center rounded-full bg-grouped"
            // Dno znaka na dnu Meseca (Ivan, 29.9.2026): beli prsten viri ispod za svoju debljinu.
            style={{ width: ZNACKA + 2 * PRSTEN, height: ZNACKA + 2 * PRSTEN, right: 0, bottom: -PRSTEN }}>
            <ZnakIkona znak={znak.key} element={znak.element} size={ZNACKA} />
          </View>
        </View>
        <Text variant="title" className="mt-5 text-center">{naslovMeseca(moonPhase(date).name, SIGN_CASES[znak.key].loc)}</Text>
        <Text variant="muted" className="mt-1 text-center">
          {formatIllumination(stanje.illumination)} osvetljen · {stanje.lunarDay}. lunarni dan
        </Text>
        {prelazak && <Text variant="muted" className="text-center">{prelazak}</Text>}
      </View>

      {/* Biljka i element — tiho, bez kartice, male ikonice ispod naslova (Ivan, 29.9.2026:
          "ne treba da su ovoliko istaknuti"). */}
      <View className="mt-3 flex-row items-center justify-center gap-5">
        <Podatak oznaka="Biljka" vrednost={plant}>
          <BiljkaIkona element={znak.element} size={PODATAK_IKONA} />
        </Podatak>
        <Podatak oznaka="Element" vrednost={element}>
          <ElementIkona element={znak.element} size={PODATAK_IKONA} />
        </Podatak>
      </View>
      </Animated.View>

      <Animated.View entering={ulaz(2)} layout={KLIZANJE}>
        <Kalendar
          izabran={date}
          danas={danas}
          onIzbor={(d) => setDate(naDan(d, new Date()))}
          otvoren={false}
          onCeoMesec={otvoriKalendar}
        />
      </Animated.View>

      {/* Saveti po oblastima (Ivan, 29.9.2026): staklene plocice IZNAD kartice, na sivoj
          pozadini, bez naslova — svih pet odjednom, pravo staklo, izabrana svetlo lila. U kartici je
          samo tekst. */}
      <Animated.View entering={ulazStaklo(3)} layout={KLIZANJE} className="mt-6">
        <KapsuleRed
          sveVidljive
          stavke={LUNAR_AREAS.map((a) => ({
            key: a.key,
            label: a.name,
            // Sve ikonice pune, i neizabrane (Ivan, 29.9.2026) — izbor pokazuje lila plocica.
            icon: <OblastIkona oblast={a.key} size={24} />,
          }))}
          izabrana={oblast}
          onIzbor={setOblast}
        />
      </Animated.View>
      {/* Kartica klizi na novu visinu; nov tekst se pretopi (key = pocetak teksta). Dok
          stize tekst za drugi dan, stari ostaje prigusen (`useLunarTexts`). */}
      <Animated.View entering={ulaz(4)} layout={KLIZANJE} className={cn(CARD_SURFACE, 'mt-3 overflow-hidden p-4')}>
        <Animated.View key={savet ? `${oblast}|${savet.slice(0, 48)}` : lunarniLoading ? 'ceka' : 'nema'} entering={FadeIn.duration(220)}
          style={{ opacity: savet && lunarniLoading ? 0.45 : 1 }}>
          {savet ? (
            <TumacenjeTekst tekst={savet} listePrvo />
          ) : lunarniLoading ? (
            <TextPlaceholder lines={4} />
          ) : (
            <Text variant="muted">{naMrezi ? 'Saveti za ovu oblast još nisu stigli.' : 'Saveti će se pojaviti kad se veza vrati.'}</Text>
          )}
        </Animated.View>
      </Animated.View>

      {/* Mesecevi tranziti na kartu tog dana, po satu — iste kartice kao na tabu
          "Tranziti" (Ivan, 29.9.2026), sa satom tacnosti umesto tona i trajanja. */}
      {dan.hits.length > 0 && (
        <Animated.View entering={ulaz(5)} layout={KLIZANJE} className="mt-9">
          <Text variant="label" className="mb-3 text-foreground" accessibilityRole="header">
            {jeDanas ? 'Za tebe danas' : `Za tebe · ${formatDay(date, danas)}`}
          </Text>
          <View className="gap-3">
            {dan.hits.map((h) => (
              <KarticaTranzita
                key={h.contentKey}
                red={{
                  key: h.contentKey,
                  transiting: h.transiting,
                  aspect: h.aspect,
                  natal: h.natal,
                  ruler: rulerRole(h.transiting.key, h.natal.key, vladari),
                }}
                naslov={texts.get(h.contentKey)?.title ?? ''}
                loading={tekstoviLoading}
                opis={`Tačan u ${formatTime(h.exactAt)}`}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </SheetScroll>
  );
}

/** Biljka ili element: ikonica levo, oznaka i vrednost desno (stil velike trojke na tabu "Ti"). */
function Podatak({ oznaka, vrednost, children }: { oznaka: string; vrednost: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-1.5" accessible accessibilityLabel={`${oznaka}: ${vrednost}`}>
      {children}
      <Text variant="muted">{vrednost}</Text>
    </View>
  );
}

/** Stakleno okruglo dugme (Ivan, 29.9.2026) — isto kao nazad u onboardingu (`GlassIconButton`). */
function DanDugme({ smer, onPress, label }: { smer: 1 | -1; onPress: () => void; label?: string }) {
  const Ikona = smer < 0 ? ChevronLeft : ChevronRight;
  return (
    <GlassIconButton onPress={onPress} accessibilityLabel={label ?? (smer < 0 ? 'Dan ranije' : 'Dan kasnije')}>
      <Ikona size={22} color={neutral.ink} strokeWidth={2} />
    </GlassIconButton>
  );
}

/**
 * Mesecni kalendar: svaki dan sa oblikom Meseca u podne. Izabran dan je u crnom
 * krugu, danas je indigo, dani glavne faze imaju tacku ispod. Meseci se listaju
 * strelicama; izbor dana iz drugog meseca prebaci i kalendar na njega.
 */
function Kalendar({ izabran, danas, onIzbor, otvoren, onCeoMesec }: {
  izabran: Date; danas: Date; onIzbor: (d: Date) => void;
  /** Ceo mesec (zaseban prikaz); inace samo nedelja izabranog dana (Ivan, 29.9.2026: "zauzima mnogo mesta"). */
  otvoren: boolean;
  /** "Ceo mesec" ispod nedelje — samo u sklopljenom. */
  onCeoMesec?: () => void;
}) {
  const [prikaz, setPrikaz] = React.useState(() => ({ g: izabran.getFullYear(), m: izabran.getMonth() }));
  // Dan pomeren strelicama gore u drugi mesec — kalendar ga prati (podesavanje
  // stanja tokom crtanja, React-ov nacin za "stanje izvedeno iz propa").
  const mesecIzabranog = `${izabran.getFullYear()}-${izabran.getMonth()}`;
  const [pratim, setPratim] = React.useState(mesecIzabranog);
  if (pratim !== mesecIzabranog) {
    setPratim(mesecIzabranog);
    setPrikaz({ g: izabran.getFullYear(), m: izabran.getMonth() });
  }

  // Sklopljen: jedna nedelja, i preko granice meseca. Otvoren: mreza meseca.
  const nedelje = React.useMemo(
    () => (otvoren ? mrezaMeseca(prikaz.g, prikaz.m) : [nedeljaDana(izabran)]),
    [otvoren, prikaz, izabran]
  );
  const faze = React.useMemo(() => {
    if (otvoren) return glavneFazeMeseca(prikaz.g, prikaz.m);
    const n = nedeljaDana(izabran);
    return new Map([
      ...glavneFazeMeseca(n[0].getFullYear(), n[0].getMonth()),
      ...glavneFazeMeseca(n[6].getFullYear(), n[6].getMonth()),
    ]);
  }, [otvoren, prikaz, izabran]);
  const uglovi = React.useMemo(() => {
    const u = new Map<string, number>();
    for (const d of nedelje.flat()) if (d) u.set(dayKey(d), ugaoDana(d));
    return u;
  }, [nedelje]);
  const listaj = (n: number) => setPrikaz(({ g, m }) => {
    const d = new Date(g, m + n, 1);
    return { g: d.getFullYear(), m: d.getMonth() };
  });
  const mesec = otvoren ? prikaz : { g: izabran.getFullYear(), m: izabran.getMonth() };
  const naslov = MESECI_PUNO[mesec.m].charAt(0).toUpperCase() + MESECI_PUNO[mesec.m].slice(1);
  const redFaza = otvoren ? [...faze.values()].sort((a, b) => a.at.getTime() - b.at.getTime()) : [];

  return (
    <View className={cn(CARD_SURFACE, 'mt-6 px-3 pt-3', otvoren ? 'pb-4' : 'pb-2')}>
      {/* Mesec sa strelicama samo u celom kalendaru; sklopljena nedelja je bez naslova
          (Ivan, 29.9.2026) — datum je vec gore. */}
      {otvoren && (
        <View className="h-11 flex-row items-center justify-between pb-2">
          <Pressable onPress={() => listaj(-1)} accessibilityRole="button" accessibilityLabel="Prethodni mesec" hitSlop={8} className="h-11 w-11 items-center justify-center active:opacity-60">
            <ChevronLeft size={20} color={neutral.ink} strokeWidth={2} />
          </Pressable>
          <Text variant="h3" accessibilityRole="header">{naslov} {mesec.g}</Text>
          <Pressable onPress={() => listaj(1)} accessibilityRole="button" accessibilityLabel="Sledeći mesec" hitSlop={8} className="h-11 w-11 items-center justify-center active:opacity-60">
            <ChevronRight size={20} color={neutral.ink} strokeWidth={2} />
          </Pressable>
        </View>
      )}

      <View className="flex-row">
        {DANI_U_NEDELJI.map((d, i) => (
          <Text key={i} variant="oznaka" className="flex-1 text-center">{d}</Text>
        ))}
      </View>

      {nedelje.map((n, i) => (
        <View key={i} className="mt-1 flex-row">
          {n.map((d, j) => {
            if (!d) return <View key={j} className="flex-1" />;
            const k = dayKey(d);
            const izabranDan = istiDan(d, izabran);
            const danasDan = istiDan(d, danas);
            const faza = faze.get(k);
            return (
              <Pressable
                key={j}
                onPress={() => onIzbor(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: izabranDan }}
                accessibilityLabel={`${formatDatumKratko(d)}${faza ? `, ${MAIN_PHASES.find((p) => p.key === faza.key)!.name}` : ''}`}
                // Izabran dan: cela celija svetlo lila, kao izabrana kapsula (Ivan, 29.9.2026).
                style={izabranDan ? { backgroundColor: LILA_SVETLA } : undefined}
                className="mx-0.5 flex-1 items-center rounded-xl py-1.5 active:opacity-60">
                <View className="h-7 w-7 items-center justify-center">
                  <Text
                    variant="caption"
                    // Danas u indigu iz loga (`brand.indigo`) — kao tackica novog odgovora.
                    style={danasDan ? { color: brand.indigo } : undefined}
                    className={cn('text-foreground', (izabranDan || danasDan) && tezina('izabranRed'))}>
                    {d.getDate()}
                  </Text>
                </View>
                <View className="mt-1">
                  <MoonDisc angle={uglovi.get(k)!} size={CELIJA_MESEC} />
                </View>
                {/* Tacka ispod dana glavne faze; prazno mesto drzi red iste visine. */}
                <View className={cn('mt-1 h-1 w-1 rounded-full', faza ? 'bg-foreground' : 'bg-transparent')} />
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Glavne faze meseca, istim redom kao u kalendaru. */}
      {redFaza.length > 0 && (
        <View className="mt-3 border-t border-border pt-3">
          {redFaza.map((f) => (
            <View key={f.at.toISOString()} className="flex-row items-center justify-between py-1">
              <Text variant="default">{MAIN_PHASES.find((p) => p.key === f.key)!.name}</Text>
              <Text variant="muted">{formatDay(f.at, danas)} u {formatTime(f.at)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Ceo mesec otvara zaseban prikaz sa kalendarom. */}
      {!otvoren && onCeoMesec && (
        <Pressable
          onPress={onCeoMesec}
          accessibilityRole="button"
          className="mt-1 flex-row items-center justify-center gap-1 py-2 active:opacity-60">
          <Text variant="caption" className="text-foreground">Ceo mesec</Text>
          <ChevronDown size={16} color={neutral.ink} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
