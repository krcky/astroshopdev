import * as React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, ReduceMotion, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming, ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { KrugLoga } from '@/components/logo';
import { OBLAST_BOJA, OblastIkona, type IkonaOblasti } from '@/components/oblast-ikona';
import { PREMIUM } from '@/components/zakljucano';
import type { KrugDana } from '@/lib/krug';
import type { KrugKey } from '@/lib/krug-config';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

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
const PLOCICA_H = 50;
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

/** Prvo otvaranje u ovoj sesiji pokazuje punjenje; posle toga krug stoji gotov (tab se ponovo montira). */
let vecPokazano = false;

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
const KRAJ_PUNJENJA = [0, 0.05, 0.09, 0.14, 0.2, 0.28];

/**
 * Providnost na POCETKU punjenja (uz rupu) po oceni (Ivan, 8.10.2026: veca ocena jace, mala slabije, ali ne mnogo):
 * do tada 0,92 za sve. Ocena 5 je pun, ocena 1 oko tri cetvrtine.
 */
const POCETAK_PUNJENJA = [0, 0.7, 0.78, 0.86, 0.93, 1];

const AG = Animated.createAnimatedComponent(G);

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
const IKONA_OBLASTI: Record<KrugKey, IkonaOblasti> = {
  karijera: 'karijera', zdravlje: 'zdravlje', porodica: 'kuca', partner: 'ljubav', licni_razvoj: 'basta',
  finansije: 'finansije', zabava: 'zabava', prijateljstvo: 'prijateljstvo',
};

/** Sira slika izgleda manja u kvadratu pa se crta veca (Ivan, 8.10.2026: Finansije). */
const RAZMERA_IKONE: Partial<Record<KrugKey, number>> = { finansije: 1.3, zdravlje: 1.2, licni_razvoj: 1.2, prijateljstvo: 1.1, zabava: 1.1 };

function Plocica({ kljuc, naziv, stanje, ocena, otvorena, izabrana, onPress, k, left, top, kasni, ulaz }: {
  kljuc: KrugKey; naziv: string; stanje: string; ocena: number; otvorena: boolean; izabrana: boolean; onPress: () => void;
  k: number; left: number; top: number; kasni: number; ulaz: boolean;
}) {
  const t = useT();
  const w = PLOCICA_W * k;
  const h = PLOCICA_H * k;
  // BEZ STAKLENE PLOCICE i BEZ RECI STANJA (Ivan, 8.10.2026): ikonica, naziv i tackice stoje direktno na isecku (stanje je
  // na kartici ispod i u opisu za citac ekrana). Na izabranom (indigo) isecku tekst je beo, na ostalima tamni.
  const naIndigu = izabrana;
  const a11y = otvorena ? t.krug.oblastA11y(naziv, stanje, ocena) : t.krug.oblastZakljucanaA11y(naziv, stanje);
  return (
    <Animated.View
      entering={ulaz ? ZoomIn.delay(kasni).duration(420).easing(Easing.out(Easing.back(1.4))).reduceMotion(ReduceMotion.Never) : undefined}
      style={{ position: 'absolute', left, top, width: w, height: h }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: izabrana }}
        style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', gap: 3.5 * k }}>
        <View>
          <OblastIkona oblast={IKONA_OBLASTI[kljuc]} size={26 * (RAZMERA_IKONE[kljuc] ?? 1) * k} />
          {!otvorena && <Katanac k={k} />}
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
          className={`text-[11px] leading-[12px] ${tezina('chipIzabran')}`}
          style={{ color: naIndigu ? neutral.white : PALETA.tekst, maxWidth: w - 4 }}>{naziv}</Text>
        <Tackice ocena={ocena} naLila={naIndigu} />
      </Pressable>
    </Animated.View>
  );
}

export function KrugZivota({ rez, izabrana, onIzbor, otkljucane }: {
  rez: KrugDana;
  izabrana: KrugKey;
  onIzbor: (k: KrugKey) => void;
  /** Besplatni (`BESPLATNO.krug`): samo ove oblasti su potpuno otvorene; ostale imaju katanac. Bez ovoga: sve. */
  otkljucane?: readonly KrugKey[];
}) {
  const t = useT();
  const [sirina, setSirina] = React.useState(0);
  const D = Math.min(sirina, NAJVECI);
  const stazaId = `krug-staza-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const k = D / S;
  const bezPokreta = useReducedMotion();
  const [animiraj] = React.useState(() => !vecPokazano && !bezPokreta);
  const napredak = useSharedValue(animiraj ? 0 : 1);
  React.useEffect(() => {
    vecPokazano = true;
    if (animiraj) napredak.set(withDelay(250, withTiming(1, { duration: UKUPNO, easing: Easing.linear, reduceMotion: ReduceMotion.Never })));
  }, [animiraj, napredak]);

  const otvorena = (key: KrugKey) => !otkljucane || otkljucane.includes(key);
  const izaberi = (key: KrugKey) => {
    if (key !== izabrana) Haptics.selectionAsync().catch(() => {});
    onIzbor(key);
  };

  return (
    <View onLayout={(e) => setSirina(e.nativeEvent.layout.width)} className="w-full items-center">
      {D > 0 && (
        <View style={{ width: D, height: D }}>
          <Svg width={D} height={D}>
            {/* Staza je PRELIV, ne jedna boja (Ivan, 8.10.2026): tamnija uz rupu, svetlija ka ivici kruga. */}
            <Defs>
              <RadialGradient id={stazaId} cx={D / 2} cy={D / 2} r={RO * k} gradientUnits="userSpaceOnUse">
                <Stop offset={RI / RO} stopColor={PALETA.staza} />
                <Stop offset={1} stopColor={PALETA.stazaSpolja} />
              </RadialGradient>
            </Defs>
            {rez.oblasti.map((o, i) => (
              <Path key={`s-${o.def.key}`} d={isecak(i * 45 - 90, POLA_UGLA, RI, RO, k)} fill={`url(#${stazaId})`}
                onPress={() => izaberi(o.def.key)} />
            ))}
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

          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: D, height: D, alignItems: 'center', justifyContent: 'center' }}>
            {/* KRUG LOGA koji se okrece (Ivan, 8.10.2026; do tada ilustracija vladara): isti `KrugLoga` kao u zaglavlju — uvodni okret
                pri fokusu, pa jedan krug u minut; vrti se STALNO (ne staje posle mirovanja, Ivan, 8.10.2026), stoji samo uz "Smanji pokrete" i u ustedi baterije. Precnik ~ rupa (92). */}
            <KrugLoga size={88 * k} stalno />
          </View>

          {rez.oblasti.map((o, i) => {
            const a = ((i * 45 - 90) * Math.PI) / 180;
            const x = (CX + RC * Math.cos(a)) * k;
            const y = (CX + RC * Math.sin(a)) * k;
            return (
              <Plocica
                key={o.def.key}
                kljuc={o.def.key}
                naziv={t.krug.oblasti[o.def.key]}
                stanje={t.krug.stanja[o.stanje]}
                ocena={o.ocena}
                otvorena={otvorena(o.def.key)}
                izabrana={o.def.key === izabrana}
                onPress={() => izaberi(o.def.key)}
                k={k}
                left={x - (PLOCICA_W * k) / 2}
                top={y - (PLOCICA_H * k) / 2}
                kasni={250 + 500 + i * KORAK}
                ulaz={animiraj}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
