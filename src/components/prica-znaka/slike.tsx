import * as React from 'react';
import { Image, Pressable, View, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Share } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { ElementIkona } from '@/components/element-ikona';
import { ZnakIkona, ELEMENT_BOJA } from '@/components/znak-ikona';
import { SLIKA as SLIKA_PLANETE, skalaSlike } from '@/components/planete-par';
import { PricaPozadina } from '@/components/prica/pozadina';
import { INDIGO, LILA, SIVA, type Nijansa } from '@/components/prica/boje';
import { ISKOK, Pojava, Reci, Zraci } from '@/components/prica/crtezi';
import { useNapredak, useOkret, useSekunde } from '@/components/prica/sat';
import type { OkvirSlike } from '@/components/prica/slajdovi';
import { IkonaOsnove } from '@/components/prica-znaka/ikona-osnove';
import { Sazvezdje } from '@/components/prica-znaka/sazvezdje';
import { SLIKE_ZNAKA, SRCE, TORBA, type Slika } from '@/components/prica-znaka/slike-znaka';
import { NATPIS_SAZVEZDJA, NATPISI, sunceU, velicinaNaslova, type PricaZnaka, type SlikaZnaka } from '@/lib/prica-znaka';
import { SAZVEZDJA } from '@/lib/sazvezdja';
import type { Element } from '@/lib/zodiac';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/**
 * PRICA O ZNAKU — devet slika (pravilo 25). Svaka se crta i u prici i kao KARTICA ZA DELJENJE
 * (360 × 640, `kartica.tsx`) — ISTA komponenta u manjoj razmeri (`s`), pa su pokreti isti, istim
 * redom i vremenima (uslov za video, `sat.tsx`). Na kartici je prvo lice ("Moje sazvežđe"), bez
 * dugmadi i bez stepena Sunca (uz ime znaka bi odao dan rodjenja).
 *
 * Svi pokreti su iz `crtezi.tsx` / `sat.tsx` — NIKAD Reanimated `entering` ni `withTiming` u slici.
 */
export type SlikaZnakaProps = {
  p: PricaZnaka;
  okvir: OkvirSlike;
  /** Kartica za deljenje: prvo lice, bez dugmadi. */
  kartica?: boolean;
  /** Prica u onboardingu: bez dugmadi na poslednjoj slici — dole je "Nastavi" (`plejer.tsx`). */
  uvod?: boolean;
  onPodeli?: () => void;
  onProcitaj?: () => void;
};

const BELA = neutral.white;
const BELA_85 = 'rgba(255,255,255,0.85)';
const MUTNO = neutral.inkMuted;
/** Dublje nijanse boje elementa, za potez ispod naslova (pastelne bi se na lila utopile). Iz prototipa. */
const ELEMENT_MASTILO: Record<Element, string> = { vatra: '#E0708D', zemlja: '#7E6464', vazduh: '#7B82C4', voda: '#3FA9D6' };
/** Ulaz gravire i planete — isto ublazavanje kao u prototipu. */
const IZRON = Easing.bezierFn(0.16, 0.9, 0.24, 1);

const OZN = cn('uppercase', tezina('statOznaka'));
const DISP = tezina('display');

/** Razmera: na ekranu prema visini prostora (manji telefon, manja slova), na kartici stalna. */
function razmera(okvir: OkvirSlike, kartica?: boolean) {
  if (kartica) return 0.74;
  return Math.max(0.82, Math.min(1, (okvir.visina - okvir.vrh - okvir.dno) / 620));
}

function tipovi(s: number) {
  return {
    oznaka: { fontSize: Math.max(9.5, 11 * s), lineHeight: Math.max(13, 15 * s), letterSpacing: 1.7 * s } as TextStyle,
    tekst: { fontSize: 17 * s, lineHeight: 24 * s } as TextStyle,
    manji: { fontSize: 15.5 * s, lineHeight: 22 * s } as TextStyle,
    naslov: (vel: number): TextStyle => ({ fontSize: vel, lineHeight: Math.round(vel * 1.1), letterSpacing: -0.03 * vel }),
  };
}

/**
 * Tanka linija preko cele sirine. Traka visine 1, NE `borderTopWidth`: ivicu samo sa jedne strane RN crta kao
 * sliku, a `layer.render` (video) je razvuce u debelu sivu prugu (Ivan, 1.10.2026; pravilo 23).
 */
function Linija() {
  return <View style={{ height: 1, backgroundColor: 'rgba(21,21,21,0.12)' }} />;
}

/** Prostor sadrzaja: izmedju zaglavlja i dugmeta "Podeli", sa stranicnim marginama. */
function sadrzaj(okvir: OkvirSlike, kartica?: boolean) {
  const strana = kartica ? 22 : 24;
  return { position: 'absolute' as const, top: okvir.vrh, bottom: okvir.dno, left: strana, right: strana };
}

function Pozadina({ nijansa, okvir, kartica }: { nijansa: Nijansa; okvir: OkvirSlike; kartica?: boolean }) {
  return kartica ? <PricaPozadina nijansa={nijansa} sirina={okvir.sirina} visina={okvir.visina} /> : <PricaPozadina nijansa={nijansa} />;
}

/** Merenje prostora koji ostane za crtez (sazvezdje, gravira, planeta). */
function useMera() {
  const [m, setM] = React.useState<{ w: number; h: number } | null>(null);
  const onLayout = React.useCallback((e: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = e.nativeEvent.layout;
    setM((s) => (s && Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }));
  }, []);
  return [m, onLayout] as const;
}

/** Mere slike koja staje u okvir (bez rastezanja), po njenim merama iz `slike-znaka.ts`. */
function staje(sl: Slika, w: number, h: number) {
  const k = Math.min(w / sl.w, h / sl.h);
  return { width: sl.w * k, height: sl.h * k };
}

/* ------------------------------------------------------------------------- *
 * 1 · Sazvezdje
 * ------------------------------------------------------------------------- */

function SlikaSazvezdje({ p, okvir, kartica }: SlikaZnakaProps) {
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  const [m, onLayout] = useMera();
  const naslov = kartica ? NATPISI.sazvezdjeNaslov.ja : NATPISI.sazvezdjeNaslov.ti;
  useT(); // NATPISI cita recnik; crta se iznova kad se jezik promeni
  return (
    <View style={{ flex: 1, backgroundColor: INDIGO }}>
      <Pozadina nijansa="noc" okvir={okvir} kartica={kartica} />
      <View style={sadrzaj(okvir, kartica)}>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          {m && (
            <Sazvezdje
              podaci={SAZVEZDJA[p.znak.key]} sirina={m.w} visina={m.h} razmera={s}
              natpis={p.latinsko} natpisKlasa={OZN}
              natpisStil={{ fontSize: 12 * s, lineHeight: NATPIS_SAZVEZDJA.red * s, letterSpacing: 3.2 * s, color: 'rgba(255,255,255,0.62)' }}
            />
          )}
        </View>
        <View style={{ paddingTop: 12 * s }}>
          <Pojava kasni={1600}>
            <Text className={OZN} style={[T.oznaka, { color: BELA_85 }]}>
              {kartica ? NATPISI.sazvezdjeOznaka.ja : NATPISI.sazvezdjeOznaka.ti}
            </Text>
          </Pojava>
          <View style={{ marginTop: 10 * s }}>
            <Reci tekst={naslov} kasni={1750} korak={90} className={DISP} style={[T.naslov(36 * s), { color: BELA }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 2 · Naslovna: gravira, ime, datumi, element i vladar
 * ------------------------------------------------------------------------- */

function Gravira({ sl, sirina, visina, s }: { sl: Slika; sirina: number; visina: number; s: number }) {
  const ulaz = useNapredak(100, 1500, IZRON);
  const sek = useSekunde();
  const stil = useAnimatedStyle(() => {
    const u = ulaz.get();
    // Lebdenje tam-amo za 14 s (kao u prototipu: 7 s pa nazad).
    const t = (1 - Math.cos((2 * Math.PI * sek.get()) / 14)) / 2;
    return {
      opacity: u,
      transform: [
        { translateX: -6 * s * t },
        { translateY: 30 * s * (1 - u) + 5 * s * t },
        { rotate: `${-1.5 * t}deg` },
        { scale: 0.94 + 0.06 * u },
      ],
    };
  });
  return (
    <Animated.View style={stil}>
      <Image source={sl.src} style={staje(sl, sirina, visina)} resizeMode="contain" accessibilityIgnoresInvertColors />
    </Animated.View>
  );
}

function Cip({ ikona, tekst, s }: { ikona?: React.ReactNode; tekst: string; s: number }) {
  return (
    <View
      className="flex-row items-center rounded-pill"
      style={{ gap: 7 * s, paddingVertical: 5 * s, paddingLeft: ikona ? 5 * s : 12 * s, paddingRight: 12 * s, backgroundColor: 'rgba(255,255,255,0.75)' }}>
      {ikona}
      <Text className={tezina('row')} style={{ fontSize: 14 * s, lineHeight: 18 * s }}>{tekst}</Text>
    </View>
  );
}

function SlikaNaslovna({ p, okvir, kartica }: SlikaZnakaProps) {
  const t = useT();
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  const [m, onLayout] = useMera();
  const planeta = SLIKA_PLANETE[p.vladar.key];
  const ikona = 24 * s;
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <Pozadina nijansa="lila" okvir={okvir} kartica={kartica} />
      <View style={sadrzaj(okvir, kartica)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={onLayout}>
          {m && <Gravira sl={SLIKE_ZNAKA[p.znak.key].gravira} sirina={m.w} visina={m.h - 8 * s} s={s} />}
        </View>
        <View style={{ paddingTop: 12 * s }}>
          <Pojava kasni={700} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 * s }}>
            <ZnakIkona znak={p.znak.key} element={p.element} size={34 * s} />
            <Text className={OZN} style={[T.oznaka, { color: MUTNO }]}>{p.redni}</Text>
          </Pojava>
          <View style={{ marginTop: 8 * s }}>
            <Reci tekst={p.znak.name} kasni={850} korak={110} className={DISP}
              style={{ fontSize: 72 * s, lineHeight: 74 * s, letterSpacing: -3.2 * s }} />
          </View>
          <Pojava kasni={1150} style={{ marginTop: 10 * s }}>
            <Text className={tezina('naslovUTekstu')} style={{ fontSize: 17 * s, lineHeight: 22 * s }}>{p.datumi}</Text>
          </Pojava>
          <Pojava kasni={1400} style={{ marginTop: 16 * s, flexDirection: 'row', flexWrap: 'wrap', gap: 8 * s }}>
            <Cip s={s} ikona={<ElementIkona element={p.element} size={ikona} />} tekst={p.elementIme} />
            <Cip s={s} ikona={planeta ? <Image source={planeta} style={{ width: ikona, height: ikona }} resizeMode="contain" /> : undefined} tekst={p.vladar.ime} />
            {/* Stepen samo u prici, i samo uz tacno vreme rodjenja (bez njega Sunce je ±0,5°). */}
            {!kartica && p.stepen !== null && <Cip s={s} tekst={t.prica.znak.sunceNa(p.stepen)} />}
          </Pojava>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 3 · Ukratko i najvece vrednosti
 * ------------------------------------------------------------------------- */

const CRTA = 'M2 10C30 3 60 14 118 5';
const CRTA_DUZINA = 120;
const APath = Animated.createAnimatedComponent(Path);

function Crta({ boja, kasni, s }: { boja: string; kasni: number; s: number }) {
  const p = useNapredak(kasni, 800, Easing.bezierFn(0.5, 0, 0.2, 1));
  const props = useAnimatedProps(() => ({ strokeDashoffset: CRTA_DUZINA * (1 - p.get()) }));
  return (
    <Svg width={120 * s} height={16 * s} viewBox="0 0 120 16" style={{ marginTop: 16 * s }} accessible={false}>
      <APath d={CRTA} fill="none" stroke={boja} strokeWidth={3} strokeLinecap="round" strokeDasharray={[CRTA_DUZINA, CRTA_DUZINA]} animatedProps={props} />
    </Svg>
  );
}

function SlikaUkratko({ p, okvir, kartica }: SlikaZnakaProps) {
  const t = useT();
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  const sirina = okvir.sirina - 2 * (kartica ? 22 : 24);
  const vel = velicinaNaslova(p.ukratko, sirina, 44 * s, 30 * s, 3);
  const najduza = Math.max(...p.opis.vrednosti.map((v) => v.length));
  const velVr = Math.min(30 * s, Math.floor(sirina / (najduza * 0.58)));
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <Pozadina nijansa="lila" okvir={okvir} kartica={kartica} />
      {/* Sadrzaj na sredini visine (Ivan, 1.10.2026) — i na kartici, pa je isti raspored. */}
      <View style={[sadrzaj(okvir, kartica), { justifyContent: 'center' }]}>
        <Pojava kasni={300}>
          <Text className={OZN} style={[T.oznaka, { color: MUTNO }]}>{t.prica.znak.ukratko(p.znak.name)}</Text>
        </Pojava>
        <View style={{ marginTop: 10 * s }}>
          <Reci tekst={p.ukratko} kasni={450} korak={110} className={DISP} style={T.naslov(vel)} />
        </View>
        <Crta boja={ELEMENT_MASTILO[p.element]} kasni={1200} s={s} />
        {p.ukratkoRecenica && (
          <Pojava kasni={1500} style={{ marginTop: 12 * s }}>
            <Text className={tezina('reading')} style={[T.manji, { color: MUTNO }]}>{p.ukratkoRecenica}</Text>
          </Pojava>
        )}
        <Pojava kasni={2100} style={{ marginTop: 24 * s }}>
          <Linija />
          <Text className={OZN} style={[T.oznaka, { color: MUTNO, marginTop: 16 * s }]}>{t.prica.znak.najveceVrednosti}</Text>
        </Pojava>
        <View style={{ marginTop: 8 * s }}>
          {p.opis.vrednosti.map((v, i) => (
            <Pojava key={v} kasni={2300 + i * 200} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 * s }}>
              <View className="rounded-pill" style={{ width: 9 * s, height: 9 * s, backgroundColor: ELEMENT_BOJA[p.element] }} />
              <Text className={DISP} style={{ fontSize: velVr, lineHeight: velVr * 1.2, letterSpacing: -0.035 * velVr }}>{v}</Text>
            </Pojava>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 4 · U ljubavi  ·  5 · Na poslu — isti raspored, da idu kao par
 * ------------------------------------------------------------------------- */

function SlikaTema({ okvir, kartica, nijansa, ikona, sirinaIkone, oznaka, naslov, recenica }: {
  okvir: OkvirSlike; kartica?: boolean; nijansa: Nijansa; ikona: Slika; sirinaIkone: number;
  oznaka: string; naslov: string; recenica: string | null;
}) {
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  const sirina = okvir.sirina - 2 * (kartica ? 22 : 24);
  const vel = velicinaNaslova(naslov, sirina, 40 * s, 30 * s, 3);
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <Pozadina nijansa={nijansa} okvir={okvir} kartica={kartica} />
      {/* Ikonica, natpis i tekst na sredini visine (Ivan, 1.10.2026), kao "ukratko". */}
      <View style={[sadrzaj(okvir, kartica), { justifyContent: 'center' }]}>
        <Pojava kasni={300} trajanje={600} ublazavanje={ISKOK} zum bledi={false} pomak={0} style={{ alignSelf: 'flex-start', marginBottom: 20 * s }}>
          <Image source={ikona.src} style={staje(ikona, sirinaIkone * s, sirinaIkone * s)} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Pojava>
        <Pojava kasni={500}>
          <Text className={OZN} style={[T.oznaka, { color: MUTNO }]}>{oznaka}</Text>
        </Pojava>
        <View style={{ marginTop: 10 * s }}>
          <Reci tekst={naslov} kasni={650} className={DISP} style={T.naslov(vel)} />
        </View>
        {recenica && (
          <Pojava kasni={1400} style={{ marginTop: 14 * s }}>
            <Text className={tezina('reading')} style={[T.tekst, { color: MUTNO }]}>{recenica}</Text>
          </Pojava>
        )}
      </View>
    </View>
  );
}

function SlikaLjubav({ p, okvir, kartica }: SlikaZnakaProps) {
  const t = useT();
  return <SlikaTema okvir={okvir} kartica={kartica} nijansa="roze" ikona={SRCE} sirinaIkone={112} oznaka={t.prica.znak.uLjubavi} naslov={p.opis.ljubav} recenica={p.ljubavRecenica} />;
}

function SlikaPosao({ p, okvir, kartica }: SlikaZnakaProps) {
  const t = useT();
  return <SlikaTema okvir={okvir} kartica={kartica} nijansa="zlato" ikona={TORBA} sirinaIkone={106} oznaka={t.prica.znak.naPoslu} naslov={p.opis.posao} recenica={p.posaoRecenica} />;
}

/* ------------------------------------------------------------------------- *
 * 6 · Kako te osvojiti — citat na indigu
 * ------------------------------------------------------------------------- */

function SlikaOsvojiti({ p, okvir, kartica }: SlikaZnakaProps) {
  useT(); // NATPISI cita recnik
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  const sirina = okvir.sirina - 2 * (kartica ? 22 : 24);
  const vel = velicinaNaslova(p.opis.osvojiti, sirina, 36 * s, 24 * s, 6);
  return (
    <View style={{ flex: 1, backgroundColor: INDIGO }}>
      <Pozadina nijansa="noc" okvir={okvir} kartica={kartica} />
      <View style={[sadrzaj(okvir, kartica), { justifyContent: 'center' }]}>
        {/* Navodnik je crtez, ne slovo: ogromno slovo „ ima visinu reda i odgura tekst. */}
        <Pojava kasni={200} trajanje={600} ublazavanje={ISKOK} zum bledi={false} pomak={0} style={{ alignSelf: 'flex-start', marginBottom: 22 * s }}>
          <Navodnik velicina={70 * s} />
        </Pojava>
        <Pojava kasni={500}>
          <Text className={OZN} style={[T.oznaka, { color: BELA_85 }]}>
            {kartica ? NATPISI.osvojitiOznaka.ja : NATPISI.osvojitiOznaka.ti}
          </Text>
        </Pojava>
        <View style={{ marginTop: 14 * s }}>
          <Reci tekst={p.opis.osvojiti} kasni={700} korak={90} className={DISP} style={[T.naslov(vel), { color: BELA }]} />
        </View>
      </View>
    </View>
  );
}

/** Srpski otvoreni navodnik „ (dve kapi dole), lila. */
function Navodnik({ velicina }: { velicina: number }) {
  const kap = 'M14 0C22 0 28 6 28 15C28 30 18 42 3 48L0 42C9 37 14 30 15 24C6 23 0 17 0 11C0 5 6 0 14 0Z';
  return (
    <Svg width={velicina} height={velicina * (48 / 64)} viewBox="0 0 64 48" accessible={false}>
      <Path d={kap} fill={LILA} />
      <Path d={kap} fill={LILA} transform="translate(34 0)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------------- *
 * 7 · Osnove znaka — svaki red svoja kartica, jedna za drugom (Ivan, 30.9.2026)
 * ------------------------------------------------------------------------- */

function KarticaOsnove({ ikona, oznaka, vrednost, opis, dugo, kasni, s, T }: {
  ikona: React.ReactNode; oznaka: string; vrednost: string; opis?: string; dugo?: boolean; kasni: number; s: number;
  T: ReturnType<typeof tipovi>;
}) {
  return (
    // `overflow-hidden`: kartica sa ivicom koja NE sece sadrzaj dobija od RN-a poseban sloj podloge, a `layer.render`
    // (video) ga crta PREKO teksta — u videu je sve bilo bledo (Ivan, 1.10.2026; pravilo 23).
    <Pojava kasni={kasni} className={cn(CARD_SURFACE, 'overflow-hidden')}
      style={{ flexDirection: 'row', alignItems: dugo ? 'flex-start' : 'center', gap: 14 * s, paddingVertical: 10 * s, paddingHorizontal: 16 * s }}>
      <View style={{ width: 40 * s, height: 40 * s, alignItems: 'center', justifyContent: 'center' }}>{ikona}</View>
      <View style={{ flex: 1 }}>
        <Text className={OZN} style={{ fontSize: Math.max(9, 10.5 * s), lineHeight: Math.max(12, 14 * s), letterSpacing: 1.3 * s, color: MUTNO }}>{oznaka}</Text>
        {dugo ? (
          <Text className={tezina('reading')} style={{ fontSize: 14.5 * s, lineHeight: 20 * s, marginTop: 3 * s }}>{vrednost}</Text>
        ) : (
          <Text className={tezina('naslovUTekstu')} style={{ fontSize: 18 * s, lineHeight: 22 * s, marginTop: 2 * s }}>{vrednost}</Text>
        )}
        {!!opis && <Text className={tezina('muted')} style={{ fontSize: 13.5 * s, lineHeight: 18 * s, color: MUTNO, marginTop: 1 }}>{opis}</Text>}
      </View>
    </Pojava>
  );
}

function SlikaOsnove({ p, okvir, kartica }: SlikaZnakaProps) {
  const t = useT();
  // Sest kartica sa izgledom od 3—4 reda: na kartici za deljenje manja razmera, inace idu preko loga.
  const s = kartica ? 0.62 : razmera(okvir, kartica);
  const T = tipovi(s);
  const sirina = okvir.sirina - 2 * (kartica ? 22 : 24);
  const vel = velicinaNaslova(p.osnove, sirina, 34 * s, 26 * s, 2);
  const ik = 40 * s;
  const kvalitet = { kardinalan: 'kvalitet-kardinalni', fiksni: 'kvalitet-fiksni', promenljiv: 'kvalitet-promenljivi' }[p.kvalitetKljuc];
  const z = t.prica.znak;
  // Pol sa sajta je uvek isti kao polaritet (muski = pozitivan; drzi `check:prica-znaka`, deo 2), pa
  // ikonica pola ide po polaritetu — bez poredjenja sa tekstom sa sajta.
  const muski = p.polaritetKljuc === 'pozitivan';
  const redovi = [
    { ikona: <ElementIkona element={p.element} size={34 * s} />, oznaka: z.oznakaElement, vrednost: p.elementIme, opis: p.srodni },
    { ikona: <IkonaOsnove ime={kvalitet} size={ik} />, oznaka: z.oznakaKvalitet, vrednost: p.kvalitet, opis: p.doba },
    { ikona: <IkonaOsnove ime={muski ? 'pol-muski' : 'pol-zenski'} size={ik} />, oznaka: z.oznakaPol, vrednost: p.opis.pol },
    { ikona: <IkonaOsnove ime={muski ? 'polaritet-pozitivni' : 'polaritet-zenski'} size={ik} />, oznaka: z.oznakaPolaritet, vrednost: p.polaritet, opis: p.polaritetOpis },
    { ikona: <IkonaOsnove ime="izgled" size={ik} />, oznaka: z.oznakaIzgled, vrednost: p.opis.izgled, dugo: true },
    { ikona: <IkonaOsnove ime="deo-tela" size={ik} />, oznaka: p.teloOznaka, vrednost: p.opis.telo, dugo: true },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <View style={[sadrzaj(okvir, kartica), { paddingTop: 8 * s }]}>
        <Pojava kasni={300}>
          <Text className={OZN} style={[T.oznaka, { color: MUTNO }]}>{z.osnoveZnaka}</Text>
        </Pojava>
        <View style={{ marginTop: 10 * s }}>
          <Reci tekst={p.osnove} kasni={450} className={DISP} style={T.naslov(vel)} />
        </View>
        <View style={{ marginTop: 16 * s, gap: 7 * s }}>
          {redovi.map((r, i) => <KarticaOsnove key={r.oznaka} {...r} kasni={800 + i * 170} s={s} T={T} />)}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 8 · Kamen, boja, biljka i hrana — ceo slajd beo, fotografije sa sajta bez granice (Ivan, 1.10.2026)
 * ------------------------------------------------------------------------- */

function SlikaStvari({ p, okvir, kartica }: SlikaZnakaProps) {
  const t = useT();
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  const sl = SLIKE_ZNAKA[p.znak.key];
  const stvari: [Slika, string, string][] = [
    [sl.kamen, t.prica.znak.dragiKamen, p.opis.kamen],
    [sl.boja, t.prica.znak.boja, p.opis.boja],
    [sl.biljka, t.prica.znak.biljka, p.opis.biljka],
    [sl.hrana, t.prica.znak.hrana, p.opis.hrana],
  ];
  const z = p.opis.zivotinja;
  const velZ = (z.length < 40 ? 22 : z.length < 90 ? 17 : 14.5) * s;
  const strana = kartica ? 22 : 24;
  const plocica = (okvir.sirina - 2 * strana - 10 * s) / 2;
  const foto = 92 * s;
  return (
    <View style={{ flex: 1, backgroundColor: BELA }}>
      <View style={[sadrzaj(okvir, kartica), { paddingTop: 8 * s }]}>
        <Pojava kasni={300}>
          <Text className={OZN} style={[T.oznaka, { color: MUTNO }]}>{t.prica.znak.znakUStvarima}</Text>
        </Pojava>
        <View style={{ marginTop: 10 * s }}>
          <Reci tekst={t.prica.znak.stvariNaslov} kasni={420} className={DISP} style={T.naslov(30 * s)} />
        </View>
        {/* Fotografije sa sajta su na belom, pa je i slajd beo: granica slike se ne vidi. Ne providnost ni
            mesanje boja — video ih ne bi snimio. */}
        <View style={{ marginTop: 16 * s, flexDirection: 'row', flexWrap: 'wrap', gap: 10 * s }}>
          {stvari.map(([src, ozn, vr], i) => (
            <Pojava key={ozn} kasni={800 + i * 180} trajanje={600} ublazavanje={ISKOK} zum pomak={0}
              className="items-center" style={{ width: plocica, padding: 8 * s, paddingBottom: 10 * s }}>
              <View style={{ height: foto, width: plocica - 16 * s, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={src.src} style={staje(src, plocica - 16 * s, foto)} resizeMode="contain" accessibilityIgnoresInvertColors />
              </View>
              <Text className={OZN} style={{ fontSize: Math.max(8.5, 9.5 * s), lineHeight: Math.max(11, 12 * s), letterSpacing: 1.3 * s, marginTop: 6 * s }}>{ozn}</Text>
              <Text className={cn('text-center', tezina('muted'))} style={{ fontSize: 13 * s, lineHeight: 17 * s, color: MUTNO, marginTop: 2 * s }}>{vr}</Text>
            </Pojava>
          ))}
        </View>
        <Pojava kasni={1700} style={{ marginTop: 16 * s }}>
          <Linija />
          <Text className={OZN} style={[T.oznaka, { color: MUTNO, marginTop: 12 * s }]}>{t.prica.znak.zivotinja}</Text>
          <Text className={tezina('naslovUTekstu')} style={{ fontSize: velZ, lineHeight: velZ * 1.25, marginTop: 4 * s }}>{z}</Text>
        </Pojava>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 9 · Vladar — planeta u zracima, pa deljenje i tumacenje Sunca
 * ------------------------------------------------------------------------- */

/** Crno dugme + "Pročitaj: Sunce u …" (kao na poslednjoj slici dnevne price). */
export const DUGMAD_ZNAKA = 50 + 6 + 44;

function Planeta({ planetKey, velicina }: { planetKey: string; velicina: number }) {
  const src = SLIKA_PLANETE[planetKey];
  const ulaz = useNapredak(0, 1600, IZRON);
  const okret = useOkret(240);
  const stil = useAnimatedStyle(() => ({
    opacity: ulaz.get(),
    transform: [{ translateY: 40 * (1 - ulaz.get()) }, { scale: 0.8 + 0.2 * ulaz.get() }, { rotate: `${okret.get()}deg` }],
  }));
  if (!src) return null;
  const d = velicina * skalaSlike(planetKey);
  return (
    <Animated.View style={stil}>
      <Image source={src} style={{ width: d, height: d }} resizeMode="contain" accessibilityIgnoresInvertColors />
    </Animated.View>
  );
}

function SlikaVladar({ p, okvir, kartica, uvod, onPodeli, onProcitaj }: SlikaZnakaProps) {
  const t = useT();
  const s = razmera(okvir, kartica);
  const T = tipovi(s);
  // U uvodu dugmad crta plejer ("Nastavi") i vec je uracunao u `okvir.dno`.
  const dno = kartica || uvod ? okvir.dno : okvir.donjiUmetak + 16 + DUGMAD_ZNAKA + 12;
  const strana = kartica ? 22 : 24;
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: dno, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ height: 240 * s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute' }} pointerEvents="none">
            <Zraci velicina={okvir.sirina * 1.64} />
          </View>
          <Planeta planetKey={p.vladar.key} velicina={200 * s} />
        </View>
        <View style={{ alignSelf: 'stretch', paddingHorizontal: strana, marginTop: 28 * s }}>
          <Pojava kasni={500}>
            <Text className={OZN} style={[T.oznaka, { color: MUTNO }]}>{t.prica.znak.vladarZnaka}</Text>
          </Pojava>
          <View style={{ marginTop: 10 * s }}>
            <Reci tekst={p.vladarNaslov} kasni={650} className={DISP} style={T.naslov(40 * s)} />
          </View>
          {/* "U tvojoj natalnoj karti Mars je u Biku." — samo u prici: na slici za deljenje bi uz ime znaka odala jos podataka o rodjenju. */}
          {!kartica && !!p.vladarRecenica && (
            <Pojava kasni={1200} style={{ marginTop: 12 * s }}>
              <Text className={tezina('reading')} style={[T.tekst, { color: MUTNO }]}>{p.vladarRecenica}</Text>
            </Pojava>
          )}
        </View>
      </View>
      {!kartica && !uvod && (
        <Pojava kasni={1600} style={{ position: 'absolute', left: 24, right: 24, bottom: okvir.donjiUmetak + 16, gap: 6 }}>
          <Button onPress={onPodeli} accessibilityLabel={t.prica.znak.podeliSvojZnak}>
            <View className="flex-row items-center gap-2">
              <Share size={19} color={BELA} strokeWidth={2} />
              <Text>{t.prica.znak.podeliSvojZnak}</Text>
            </View>
          </Button>
          <Pressable onPress={onProcitaj} accessibilityRole="button" className="h-11 items-center justify-center active:opacity-60">
            <Text className={cn('text-[16px] leading-[20px]', tezina('dugme'))}>{t.prica.znak.procitaj(sunceU(p.znak))}</Text>
          </Pressable>
        </Pojava>
      )}
    </View>
  );
}

export const SLIKE_PRICE_ZNAKA: Record<SlikaZnaka, (props: SlikaZnakaProps) => React.ReactElement> = {
  sazvezdje: SlikaSazvezdje,
  naslovna: SlikaNaslovna,
  ukratko: SlikaUkratko,
  ljubav: SlikaLjubav,
  posao: SlikaPosao,
  osvojiti: SlikaOsvojiti,
  osnove: SlikaOsnove,
  stvari: SlikaStvari,
  vladar: SlikaVladar,
};
