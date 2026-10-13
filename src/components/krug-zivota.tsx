import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDecay, withDelay, withTiming, ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { AVATARI, AvatarProbni, SLIKE } from '@/components/avatar-probni';
import { KrugLoga } from '@/components/logo';
import { OBLAST_BOJA, OblastIkona, type IkonaOblasti } from '@/components/oblast-ikona';
import { PREMIUM } from '@/components/zakljucano';
import { StakloPovrsina } from '@/components/staklo-povrsina';
import type { KrugDana, KrugOblast } from '@/lib/krug';
import type { KrugKey } from '@/lib/krug-config';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

const PROBNI_AVATAR = true;

/**
 * SREDINA KRUGA, PROBA (Ivan, 13.10.2026): prvo je KRUG LOGA koji se vrti; dodir pokaze PRVI avatar, svaki sledeci dodir sledeceg,
 * a pa 12 slika iz `files/meseci` (kopije u `src/probni-avatari/`), a posle poslednje se vraca logo. Samo za gledanje avatara (`avatar-probni.tsx`) — izbaciti kad se odluci o stilu.
 */
function SredinaKruga({ size }: { size: number }) {
  const [i, setI] = React.useState(-1);
  return (
    <Pressable
      onPress={() => setI((x) => (x + 1 >= AVATARI.length + SLIKE.length ? -1 : x + 1))}
      accessibilityRole="button"
      accessibilityLabel={i < 0 ? 'Logo. Dodir pokazuje prvi avatar.' : `Probni avatar ${i + 1}. Dodir menja.`}
      style={{ width: size, height: size }}>
      <View pointerEvents="none">
        {i < 0 ? (
          <KrugLoga size={size} stalno />
        ) : i < AVATARI.length ? (
          <AvatarProbni size={size} index={i} />
        ) : (
          <Image source={SLIKE[i - AVATARI.length]} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />
        )}
      </View>
    </Pressable>
  );
}

/*
 * KRUG ZIVOTA (Ivan, 8.10.2026; varijanta A sa prototipa): pravi krug podeljen na osam isecaka, u svakom
 * pravougaonik od STAKLA (oblast, stanje, tackice). Isecak se puni od sredine ka ivici srazmerno danasnjoj
 * oceni, JEDNOM bojom (svetla lila, tamnija sto je ocena veca); stanje je rec na plocici. Boje po stanju
 * (plava/roze) su probane i odbijene (Ivan, 8.10.2026), a po oblasti nikad: plava i roze vec znace nesto.
 * U sredini je KRUG LOGA koji se okrece (`KrugLoga`; do 8.10.2026 ilustracija vladara podznaka) (Ivan, 8.10.2026; do tada znak Sunca sa prstenom price i podznak).
 *
 * Mere su u jedinicama prototipa (krug 308 x 308), pa se mnoze razmerom `k = precnik / 308`.
 */
const S = 308;
const CX = S / 2;
const RO = 154; // = polovina mere (S): krug dodiruje ivice, iste sirine kao kartica ispod
const RI = 46;
const RC = 108;
const PLOCICA_W = 68;
const PLOCICA_H = 64;
const POLA_UGLA = 22.5;
/** Punjenje je ISTE sirine kao isecak i ide do ivice kruga pri oceni 5 (Ivan, 8.10.2026: da se ne odvaja od isecka). */
const POLA_PUNJENJA = POLA_UGLA;
const NAJVECI = 480;

/**
 * TAMAN KRUG — PROBAN I ODBIJEN (Ivan, 8.10.2026: "ne svidja mi se tamni krug, vrati na svetli"); ostaje iskljucen (`false`). Povod bio: "da glass bude pravi glass". staklo prelama ono sto je iza njega, pa na
 * svetlosivoj podlozi izgleda kao bela plocica. Zato je podloga kruga duboki indigo iz loga, a punjenje svetla
 * lila koja "svetli" na njemu; plocice su tamno staklo sa belim tekstom. `false` = svetao krug (sivo-bela
 * podloga, crn tekst, staklo `regular`) — isti raspored, samo boje.
 */
const TAMAN_KRUG = false;

/**
 * Boja punjenja: JEDNA — svetla lila aplikacije (`OBLAST_BOJA`, ista kao izabrana plocica), jaca sto je danasnja
 * ocena veca. Stanje kaze RECJU na plocici, ne bojom (Ivan, 8.10.2026: "ne svidjaju mi se ove boje"; do tada
 * plava/siva/lila/roze po stanju).
 */
const PALETA = TAMAN_KRUG
  ? {
      staza: '#3B3A8E', stazaSpolja: '#3B3A8E', stazaIzabrana: '#6362BD', pocetak: 0.85, alfa: [0, 0.22, 0.36, 0.5, 0.66, 0.85],
      staklo: 'clear' as const, shema: 'dark' as const,
      izabrano: 'rgba(214, 201, 240, 0.62)', zakljucano: 'rgba(255, 255, 255, 0.04)', otvoreno: 'rgba(37, 36, 107, 0.3)',
      tekstIzabrano: '#25246B', tekstIzabranoBlag: 'rgba(37, 36, 107, 0.7)',
      rezervaOtvorena: 'rgba(255, 255, 255, 0.16)', rezervaZakljucana: 'rgba(255, 255, 255, 0.08)', rezervaOkvir: 'rgba(255, 255, 255, 0.28)',
      tekst: '#FFFFFF', tekstBlag: 'rgba(255, 255, 255, 0.72)', tackicaPuna: '#FFFFFF', tackicaPrazna: 'rgba(255, 255, 255, 0.28)',
      obris: '#FFFFFF',
    }
  : {
      staza: '#D9DDE8', stazaSpolja: '#EDEFF4', stazaIzabrana: brand.indigo, pocetak: 0.92, alfa: [0, 0.16, 0.28, 0.4, 0.54, 0.7],
      staklo: 'clear' as const, shema: 'light' as const,
      izabrano: 'rgba(255, 255, 255, 0.9)', zakljucano: 'rgba(64, 63, 152, 0.07)', otvoreno: undefined as string | undefined,
      tekstIzabrano: '#2B2A6B', tekstIzabranoBlag: 'rgba(43, 42, 107, 0.7)',
      rezervaOtvorena: neutral.white, rezervaZakljucana: '#F1F1FA', rezervaOkvir: 'transparent',
      tekst: neutral.ink, tekstBlag: '#6B6F76', tackicaPuna: brand.indigo, tackicaPrazna: 'rgba(43, 42, 107, 0.3)',
      obris: brand.indigo,
    };
export const punjenje = (ocena: number) => {
  const n = parseInt(OBLAST_BOJA.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${PALETA.alfa[Math.min(5, Math.max(1, ocena))]})`;
};

/** Isecak (prsten izmedju `r0` i `r1`) oko ugla `c`, u stepenima. */
function isecak(c: number, pola: number, r0: number, r1: number, k: number): string {
  const t = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${((CX + r * Math.cos(a)) * k).toFixed(2)} ${((CX + r * Math.sin(a)) * k).toFixed(2)}`;
  };
  return `M${t(r1, c - pola)}A${r1 * k} ${r1 * k} 0 0 1 ${t(r1, c + pola)}L${t(r0, c + pola)}A${r0 * k} ${r0 * k} 0 0 0 ${t(r0, c - pola)}Z`;
}

/** Piroza: isecak od sredine do `r` (u PIKSELIMA). `worklet` — crta se u svakom kadru punjenja. */
function piroza(cx: number, c: number, pola: number, r: number): string {
  'worklet';
  const a0 = ((c - pola) * Math.PI) / 180;
  const a1 = ((c + pola) * Math.PI) / 180;
  return `M${cx} ${cx}L${cx + r * Math.cos(a0)} ${cx + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cx + r * Math.sin(a1)}Z`;
}

const KORAK = 90;
const TRAJANJE = 800;
const UKUPNO = TRAJANJE + 7 * KORAK;

/**
 * Providnost na KRAJU indigo preliva izabranog isecka (Ivan, 8.10.2026: "duplo tamniji, manje providan"): do tada 0,
 * sada 0,45 — isecak se ne gubi pred ivicom kruga. Obicno punjenje i dalje iscezava do 0.
 */
const KRAJ_IZABRANOG = 0.7;

/**
 * Providnost na KRAJU obicnog punjenja po oceni (Ivan, 8.10.2026: "za 5 tackica ne deluje bas tako"): do tada 0 za sve,
 * pa je preliv pri oceni 5 iscezavao pred ivicom. Sad se sto veca ocena, to se preliv jace vidi do kraja.
 */
const KRAJ_PUNJENJA = [0, 0.03, 0.06, 0.09, 0.13, 0.18];

/**
 * Providnost na POCETKU punjenja (uz rupu) po oceni (Ivan, 8.10.2026: veca ocena jace, mala slabije, ali ne mnogo):
 * do tada 0,92 za sve. Ocena 5 je pun, ocena 1 oko tri cetvrtine.
 */
const POCETAK_PUNJENJA = [0, 0.5, 0.56, 0.62, 0.68, 0.74];

const AG = Animated.createAnimatedComponent(G);

/** Pocetni ugao ulaznog okreta (stepeni): krug se zavrti u smeru kazaljke i stane na 0 dok se isecci pojavljuju. */
const ULAZNI_OKRET = -100;

/** Trajanje pojavljivanja sive staze pri otvaranju kruga (ms). */
const STAZA_MS = 550;

/** Siva staza se POJAVLJUJE: raste od sredine, pre punjenja isecaka (Ivan, 8.10.2026). */
function StazaRaste({ napredak, cx, children }: { napredak: SharedValue<number>; cx: number; children: React.ReactNode }) {
  const props = useAnimatedProps(() => {
    const e0 = Math.min(1, Math.max(0, (napredak.get() * UKUPNO) / STAZA_MS));
    const e = 1 - Math.pow(1 - e0, 3);
    return { transform: [{ translateX: cx }, { translateY: cx }, { scale: Math.max(0.001, e) }, { translateX: -cx }, { translateY: -cx }] };
  });
  return <AG animatedProps={props}>{children}</AG>;
}

/**
 * Obojeni deo isecka kao PRELIV (Ivan, 8.10.2026: "bez ravne linije"): pun uz rupu u sredini, sve providniji ka
 * kraju punjenja, pa nema ivice nego senka koja iscezava. Dužina preliva je ocena. Raste od sredine (iza rupe),
 * jedan isecak za drugim u smeru kazaljke: grupa se SKALIRA oko sredine, pa se preliv siri zajedno sa isecakom.
 */
function Punjenje({ i, ugao, puni, rupa, boja, pocetak, kraj, napredak, cx }: {
  i: number; ugao: number; puni: number; rupa: number; boja: string; pocetak: number; kraj: number; napredak: SharedValue<number>; cx: number;
}) {
  const id = `krug-pr-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const props = useAnimatedProps(() => {
    const t = napredak.get() * UKUPNO - i * KORAK;
    const e0 = Math.min(1, Math.max(0, t / TRAJANJE));
    const e = 1 - Math.pow(1 - e0, 3);
    return { transform: [{ translateX: cx }, { translateY: cx }, { scale: Math.max(0.001, e) }, { translateX: -cx }, { translateY: -cx }] };
  });
  return (
    <AG animatedProps={props}>
      <Defs>
        <RadialGradient id={id} cx={cx} cy={cx} r={puni} gradientUnits="userSpaceOnUse">
          <Stop offset={Math.min(0.98, rupa / puni)} stopColor={boja} stopOpacity={pocetak} />
          <Stop offset={1} stopColor={boja} stopOpacity={kraj} />
        </RadialGradient>
      </Defs>
      <Path d={piroza(cx, ugao, POLA_PUNJENJA, puni)} fill={`url(#${id})`} />
    </AG>
  );
}

/** Prazne tackice su svetle lila; na izabranom (indigo) isecku bi nestale, pa tamo idu bele. */
function Tackice({ ocena, naLila }: { ocena: number; naLila: boolean }) {
  return (
    <View className="flex-row" style={{ gap: 2 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: i < ocena ? (naLila ? neutral.white : PALETA.tackicaPuna) : (naLila ? 'rgba(255, 255, 255, 0.35)' : PALETA.tackicaPrazna) }} />
      ))}
    </View>
  );
}

/** Katanac je DOLE DESNO uz ikonicu i malo PREKO nje (Ivan, 8.10.2026), beli krug BEZ obruba. */
function Katanac({ k }: { k: number }) {
  const d = 15 * k;
  return (
    <View
      pointerEvents="none"
      className="absolute items-center justify-center rounded-pill bg-white"
      style={{ bottom: -4 * k, right: -7 * k, width: d, height: d }}>
      <Lock size={9} color={PREMIUM} strokeWidth={2.4} />
    </View>
  );
}

/**
 * Ikonica oblasti kruga (Ivan, 8.10.2026) — 3D ikonice iz `assets/images/ikone/`: Karijera = torba, Zdravlje = lotos,
 * Porodica = kuca, Partner = srce, Licni razvoj = biljka, Finansije = novcici, Zabava = tuta sa konfetama,
 * Prijateljstvo = dva oblacica.
 */
export const IKONA_OBLASTI: Record<KrugKey, IkonaOblasti> = {
  karijera: 'karijera', zdravlje: 'zdravlje', porodica: 'kuca', partner: 'ljubav', licni_razvoj: 'basta',
  finansije: 'finansije', zabava: 'zabava', prijateljstvo: 'prijateljstvo',
};

/** Sira slika izgleda manja u kvadratu pa se crta veca (Ivan, 8.10.2026: Finansije). */
export const RAZMERA_IKONE: Partial<Record<KrugKey, number>> = { finansije: 1.3, zdravlje: 1.2, licni_razvoj: 1.2, prijateljstvo: 1.1, zabava: 1.1 };

function Plocica({ kljuc, naziv, stanje, ocena, otvorena, izabrana, onPress, k, indeks, D, rot, kasni, ulaz }: {
  kljuc: KrugKey; naziv: string; stanje: string; ocena: number; otvorena: boolean; izabrana: boolean; onPress: () => void;
  k: number; indeks: number; D: number; rot: SharedValue<number>; kasni: number; ulaz: boolean;
}) {
  const t = useT();
  const w = PLOCICA_W * k;
  const h = PLOCICA_H * k;
  // BEZ STAKLENE PLOCICE (Ivan, 8.10.2026): ikonica, naziv, REC STANJA (ispod naziva, iznad tackica) i tackice stoje direktno
  // na isecku. Na izabranom (indigo) isecku tekst je beo, na ostalima tamni.
  const naIndigu = izabrana;
  const a11y = otvorena ? t.krug.oblastA11y(naziv, stanje, ocena) : t.krug.oblastZakljucanaA11y(naziv, stanje);
  // Plocica ide po krugu zajedno sa okretanjem (ostaje uspravna, ne okrece se sama).
  const polozaj = useAnimatedStyle(() => {
    const a = ((indeks * 45 - 90 + rot.get()) * Math.PI) / 180;
    return { transform: [{ translateX: RC * k * Math.cos(a) }, { translateY: RC * k * Math.sin(a) }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: D / 2 - w / 2, top: D / 2 - h / 2, width: w, height: h }, polozaj]}>
    <Animated.View
      entering={ulaz ? ZoomIn.delay(kasni).duration(420).easing(Easing.out(Easing.back(1.4))).reduceMotion(ReduceMotion.Never) : undefined}
      style={{ width: w, height: h }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: izabrana }}
        style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', gap: 2.5 * k }}>
        <View>
          <OblastIkona oblast={IKONA_OBLASTI[kljuc]} size={26 * (RAZMERA_IKONE[kljuc] ?? 1) * k} />
          {!otvorena && <Katanac k={k} />}
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
          className={`text-[11px] leading-[12px] ${tezina('chipIzabran')}`}
          style={{ color: naIndigu ? neutral.white : PALETA.tekst, maxWidth: w - 4 }}>{naziv}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
          className="text-[9.5px] leading-[11px] font-semibold"
          style={{ color: naIndigu ? 'rgba(255, 255, 255, 0.88)' : brand.indigo, maxWidth: w + 4 * k }}>{stanje}</Text>
        <Tackice ocena={ocena} naLila={naIndigu} />
      </Pressable>
    </Animated.View>
    </Animated.View>
  );
}

const IVICA_KARTICE = 6;
const SIRINA_KARTICE = 236;
/** Zaustavljanje posle zamaha: sto blize 1, to duze klizi (0,997 po ms je blago, kao tocak na kolu). */
const KOCENJE = 0.997;

/**
 * STAKLENA KARTICA oblasti (Ivan, 12.10.2026): otvori se kad se dodirne isecak i plovi uz njega — ispod plocice
 * kad je ona u gornjem delu kruga, inace iznad — kao `TockPopover` na astroloskom krugu. Prati okretanje kruga
 * (polozaj se racuna u svakom kadru iz `rot`), a iz kruga ne izlazi. Staklo je sistemsko (`StakloPovrsina`), pa
 * kartica nema providnost u animaciji.
 */
function KarticaOblasti({ indeks, D, k, rot, children }: {
  indeks: number; D: number; k: number; rot: SharedValue<number>; children: React.ReactNode;
}) {
  const [mera, setMera] = React.useState<{ w: number; h: number } | null>(null);
  const w = Math.min(SIRINA_KARTICE, D - 2 * IVICA_KARTICE);
  const h = mera?.h ?? 0;
  const stil = useAnimatedStyle(() => {
    if (!mera) return { transform: [{ translateX: -2000 }, { translateY: 0 }] };
    const a = ((indeks * 45 - 90 + rot.get()) * Math.PI) / 180;
    const ax = D / 2 + RC * k * Math.cos(a);
    const ay = D / 2 + RC * k * Math.sin(a);
    const odmak = (PLOCICA_H * k) / 2 + 2;
    const dole = ay < D * 0.55;
    const gore = Math.max(IVICA_KARTICE, Math.min(D - h - IVICA_KARTICE, dole ? ay + odmak : ay - h - odmak));
    const levo = Math.max(IVICA_KARTICE, Math.min(D - w - IVICA_KARTICE, ax - w / 2));
    return { transform: [{ translateX: levo }, { translateY: gore }] };
  });
  return (
    <Animated.View
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        setMera((m) => (m && Math.abs(m.h - height) < 0.5 ? m : { w, h: height }));
      }}
      accessibilityLiveRegion="polite"
      style={[{ position: 'absolute', left: 0, top: 0, width: w }, stil]}>
      <StakloPovrsina radius={20} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>{children}</StakloPovrsina>
    </Animated.View>
  );
}

export function KrugZivota({ rez, izabrana, onIzbor, otkljucane, detalj }: {
  rez: KrugDana;
  /** Dodirnuta oblast; `null` = nista nije izabrano (podrazumevano, Ivan, 12.10.2026). */
  izabrana: KrugKey | null;
  onIzbor: (k: KrugKey | null) => void;
  /** Sadrzaj staklene kartice za izabranu oblast (`OblastKartica`). */
  detalj?: (o: KrugOblast) => React.ReactNode;
  /** Besplatni (`BESPLATNO.krug`): samo ove oblasti su potpuno otvorene; ostale imaju katanac. Bez ovoga: sve. */
  otkljucane?: readonly KrugKey[];
}) {
  const t = useT();
  const [sirina, setSirina] = React.useState(0);
  const D = Math.min(sirina, NAJVECI);
  const stazaId = `krug-staza-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const k = D / S;
  const bezPokreta = useReducedMotion();
  // Animacija se pusta SVAKI put kad se tab "Danas" pojavi (Ivan, 8.10.2026; do tada samo prvi put u sesiji): pri montiranju,
  // i pri svakom povratku na tab (tab ostaje montiran, pa se krug ponovo pokrece — `ciklus` ponovo montira plocice).
  const animiraj = !bezPokreta;
  const napredak = useSharedValue(animiraj ? 0 : 1);
  // Okretanje kruga: ugao u stepenima, pozitivno = u smeru kazaljke. Pri pojavljivanju se krug malo zavrti i smiri na 0 (Ivan, 12.10.2026).
  const rot = useSharedValue(animiraj ? ULAZNI_OKRET : 0);
  const zavrti = React.useCallback(() => {
    cancelAnimation(rot);
    rot.set(ULAZNI_OKRET);
    rot.set(withDelay(250, withTiming(0, { duration: UKUPNO, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never })));
  }, [rot]);
  const [ciklus, setCiklus] = React.useState(0);
  const prviFokus = React.useRef(true);
  React.useEffect(() => {
    if (animiraj) {
      napredak.set(withDelay(250, withTiming(1, { duration: UKUPNO, easing: Easing.linear, reduceMotion: ReduceMotion.Never })));
      zavrti();
    }
  }, [animiraj, napredak, zavrti]);
  // Animacija samo kad se TAB "Danas" pojavi (prelazak sa drugog taba) — NE kad se zatvori list ili prica koji su ga prekrili
  // (Ivan, 8.10.2026). Pri odlasku proverimo da li je preko tabova list/modal (koren navigacije vise nije "(tabs)").
  const navigation = useNavigation();
  const prekriven = React.useRef(false);
  useFocusEffect(React.useCallback(() => {
    if (prviFokus.current) { prviFokus.current = false; }
    else if (prekriven.current) { prekriven.current = false; }
    else if (animiraj) {
      napredak.set(0);
      napredak.set(withDelay(250, withTiming(1, { duration: UKUPNO, easing: Easing.linear, reduceMotion: ReduceMotion.Never })));
      zavrti();
      setCiklus((c) => c + 1);
    }
    return () => {
      let koren = navigation;
      while (koren.getParent()) koren = koren.getParent()!;
      const stanje = koren.getState();
      prekriven.current = !!stanje && stanje.routes[stanje.index]?.name !== '(tabs)';
    };
  }, [animiraj, napredak, navigation, zavrti]));

  const otvorena = (key: KrugKey) => !otkljucane || otkljucane.includes(key);
  // Okretanje kruga prstom (Ivan, 12.10.2026).
  // Kraj okretanja stize i kao obican dodir na plocicu: dok traje (i kratko posle) dodir ne bira nista.
  const gestDo = React.useRef(0);
  const oznaciGest = React.useCallback((traje: boolean) => { gestDo.current = traje ? Infinity : Date.now() + 350; }, []);
  const izaberi = (key: KrugKey) => {
    if (Date.now() < gestDo.current) return;
    if (key === izabrana) { onIzbor(null); return; }
    Haptics.selectionAsync().catch(() => {});
    onIzbor(key);
  };
  const okretStil = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.get()}deg` }] }));
  const kandidat = useSharedValue(false);
  const pocX = useSharedValue(0);
  const pocY = useSharedValue(0);
  const prethodni = useSharedValue(0);
  const okretanje = React.useMemo(() => {
    const c = D / 2;
    const ugao = (x: number, y: number) => { 'worklet'; return Math.atan2(y - c, x - c); };
    return Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown((e, upravljac) => {
        if (e.numberOfTouches !== 1) { kandidat.set(false); upravljac.fail(); return; }
        cancelAnimation(rot);
        pocX.set(e.allTouches[0].x); pocY.set(e.allTouches[0].y); kandidat.set(true);
      })
      .onTouchesMove((e, upravljac) => {
        if (!kandidat.get()) return;
        if (e.numberOfTouches !== 1) { kandidat.set(false); upravljac.fail(); return; }
        const dx = e.allTouches[0].x - pocX.get();
        const dy = e.allTouches[0].y - pocY.get();
        if (Math.hypot(dx, dy) < 8) return;
        kandidat.set(false);
        // Pokret ALONG kruga (tangenta) okrece; pokret ka ili od sredine pusta skrol strane.
        const rx = pocX.get() - c;
        const ry = pocY.get() - c;
        const r = Math.hypot(rx, ry) || 1;
        const tangenta = (dx * -ry + dy * rx) / r;
        const radijalno = (dx * rx + dy * ry) / r;
        if (Math.abs(tangenta) > Math.abs(radijalno)) upravljac.activate(); else upravljac.fail();
      })
      .onStart((e) => {
        prethodni.set(ugao(e.x, e.y));
        scheduleOnRN(oznaciGest, true);
      })
      .onUpdate((e) => {
        const a = ugao(e.x, e.y);
        let d = a - prethodni.get();
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        prethodni.set(a);
        rot.set(rot.get() + (d * 180) / Math.PI);
      })
      .onEnd((e) => {
        // Zamah: ugaona brzina = brzina prsta uz obim, podeljena poluprecnikom.
        const rx = e.x - c;
        const ry = e.y - c;
        const r = Math.max(30, Math.hypot(rx, ry));
        const stepeniUSekundi = (((e.velocityX * -ry + e.velocityY * rx) / r) / r) * (180 / Math.PI);
        rot.set(withDecay({ velocity: stepeniUSekundi, deceleration: KOCENJE }));
        scheduleOnRN(oznaciGest, false);
      });
  }, [D, rot, kandidat, pocX, pocY, prethodni, oznaciGest]);

  return (
    <View onLayout={(e) => setSirina(e.nativeEvent.layout.width)} className="w-full items-center">
      {D > 0 && (
        <View style={{ width: D, height: D }}>
         <GestureDetector gesture={okretanje}>
          <View style={{ width: D, height: D }}>
          <Animated.View style={[{ width: D, height: D }, okretStil]}>
          <Svg width={D} height={D}>
            {/* Staza je PRELIV, ne jedna boja (Ivan, 8.10.2026): tamnija uz rupu, svetlija ka ivici kruga. */}
            <Defs>
              <RadialGradient id={stazaId} cx={D / 2} cy={D / 2} r={RO * k} gradientUnits="userSpaceOnUse">
                <Stop offset={RI / RO} stopColor={PALETA.staza} />
                <Stop offset={1} stopColor={PALETA.stazaSpolja} />
              </RadialGradient>
            </Defs>
            <StazaRaste napredak={napredak} cx={D / 2}>
              {rez.oblasti.map((o, i) => (
                <Path key={`s-${o.def.key}`} d={isecak(i * 45 - 90, POLA_UGLA, RI, RO, k)} fill={`url(#${stazaId})`}
                  onPress={() => izaberi(o.def.key)} />
              ))}
            </StazaRaste>
            {rez.oblasti.map((o, i) => {
              // Izabrani isecak: INDIGO preliv preko celog isecka (pun uz rupu, providan uz ivicu kruga).
              const sel = o.def.key === izabrana;
              return (
                <Punjenje key={`p-${o.def.key}`} i={i} ugao={i * 45 - 90} cx={D / 2} rupa={RI * k}
                  puni={(sel ? RO : RI + (RO - RI) * (o.ocena / 5)) * k}
                  boja={sel ? brand.indigo : OBLAST_BOJA} pocetak={sel ? 1 : POCETAK_PUNJENJA[Math.min(5, Math.max(0, o.ocena))]} kraj={sel ? KRAJ_IZABRANOG : KRAJ_PUNJENJA[Math.min(5, Math.max(0, o.ocena))]} napredak={napredak} />
              );
            })}
            {/* Razmaci izmedju isecaka crtaju se IZNAD punjenja, da ono ide tacno do ivice isecka. */}
            {rez.oblasti.map((o, i) => (
              <Path key={`r-${o.def.key}`} d={isecak(i * 45 - 90, POLA_UGLA, RI, RO, k)} fill="none" stroke={neutral.grouped} strokeWidth={2.5} pointerEvents="none" />
            ))}
            <Circle cx={D / 2} cy={D / 2} r={RI * k} fill={neutral.grouped} />
          </Svg>
          </Animated.View>

          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: D, height: D, alignItems: 'center', justifyContent: 'center' }}>
            {/* KRUG LOGA koji se okrece (Ivan, 8.10.2026; do tada ilustracija vladara): isti `KrugLoga` kao u zaglavlju — uvodni okret
                pri fokusu, pa jedan krug u minut; vrti se STALNO (ne staje posle mirovanja, Ivan, 8.10.2026), stoji samo uz "Smanji pokrete" i u ustedi baterije. Precnik ~ rupa (92). */}
            {/* PROBA (Ivan, 13.10.2026): logo prvi, dodir menja avatare. Povratak: PROBNI_AVATAR = false. */}
            {PROBNI_AVATAR ? <SredinaKruga size={88 * k} /> : <KrugLoga size={88 * k} stalno />}
          </View>

          {rez.oblasti.map((o, i) => {
            return (
              <Plocica
                key={`${o.def.key}-${ciklus}`}
                kljuc={o.def.key}
                naziv={t.krug.oblasti[o.def.key]}
                stanje={t.krug.stanja[o.stanje]}
                ocena={o.ocena}
                otvorena={otvorena(o.def.key)}
                izabrana={o.def.key === izabrana}
                onPress={() => izaberi(o.def.key)}
                k={k}
                indeks={i}
                D={D}
                rot={rot}
                kasni={250 + 500 + i * KORAK}
                ulaz={animiraj}
              />
            );
          })}
          </View>
         </GestureDetector>
         {/* Kartica je POSLEDNJA (preko plocica) i van detektora gesta, pa dugmad u njoj ne okrecu krug. */}
         {detalj && izabrana && (() => {
           const idx = rez.oblasti.findIndex((x) => x.def.key === izabrana);
           return idx < 0 ? null : (
             <KarticaOblasti key={izabrana} indeks={idx} D={D} k={k} rot={rot}>{detalj(rez.oblasti[idx])}</KarticaOblasti>
           );
         })()}
        </View>
      )}
    </View>
  );
}
