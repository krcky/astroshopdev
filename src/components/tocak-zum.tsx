import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Minimize2 } from 'lucide-react-native';

import { useT } from '@/i18n';
import { VIEW } from '@/lib/tocak-stil';
import { BEZ_ZUMA, WHEEL_R, ZUM_MAX, ekranUKrug, krugUEkran, primeniPokret, type Zum } from '@/lib/wheel';
import { neutral } from '@/theme/tokens';

/**
 * Koliko se okvir zumiranog kruga uvlaci (pt): odozgo ispod hedera, odozdo iznad imena (Ivan, 8.10.2026: okvir
 * ne sme preko hedera, a sadrzaj ispod ne sme da se pomera). Krug stoji `-mt-3` ispod trake (12 pt iznad nje) i
 * ime `-mt-4` ispod kruga (16 pt ispod njegove ivice), uz 8 pt razmaka.
 */
export const UVLACENJE = { gore: 20, dole: 24 };

/**
 * OKRETANJE KRUGA PRSTOM (samo "Nebo", Ivan, 8.10.2026): jedan prst koji krene sa PRSTENA (zodijak i planete,
 * van polja aspekata) vodi krug kao kolo; unutrasnje polje i dalje klizi sa stranom. Krug je ukljesten na
 * ascendent, pa je okretanje u stvari VREME — `pomak` dobija koliko je stepeni krug obrnut u smeru kazaljke
 * (napred u vremenu), a ekran trazi vreme u kome je ascendent bas tamo (`vremeZaOkret`). Dok je zumirano
 * jedan prst pomera uvecan krug, pa okretanja nema.
 */
export type Okretanje = {
  pocetak: () => void;
  /** Ukupno obrnuto od pocetka pokreta, u stepenima; pozitivno = u smeru kazaljke (napred u vremenu). */
  pomak: (stepeni: number) => void;
  kraj: () => void;
};
/** Okretanje se hvata sa poluprecnika (jedinice viewBox-a) od kog pocinje prsten planeta. */
const OKRETANJE_OD = WHEEL_R.houseRing + 4;
/** Najcesce osvezavanje vremena dok se okrece (ms): krug se ponovo crta pri svakom. */
const OKRETANJE_RAZMAK = 40;
const RADIJUS = 22;

/**
 * ZUM KRUGA STEZANJEM (Ivan, 8.10.2026: "pinch to zoom je klasican nacin", ne dvostruki dodir). VERZIJA 2.
 *
 * Krug se crta CEO i UVECAN (`sr` = ZUM_MAX) cim se prvi put zumira, i vise se ne crta iznova: zum i
 * POMERANJE su samo transformacija (UI nit), pa nema cekanja i nema praznih ivica koje bi se dopunjavale
 * posle pokreta. Uvecan crtez se samo smanjuje do trazenog zuma, pa je uvek oster. Ponovno crtanje je samo pri
 * PRVOM stezanju (1 -> `sr`) i pri povratku na pun krug; `NatalWheel` je `memo`, pa pomeranje ne dira SVG.
 *
 * Cena ove verzije: pri prvom zumu se veliki krug crta tek na KRAJU stezanja, pa se na tren moze videti kako se crta
 * (V3—V7 su to pokusavale da izbegnu dodatnim velikim slojem — vidi istoriju u `docs/` i `CLAUDE.md`; Ivan je 8.10.2026
 * izabrao da se vrati na ovu).
 *
 * Racunica je u `lib/wheel.ts` (`primeniPokret`, `check:sky` deo 13) i vraca bas transformaciju koja ce biti
 * upisana, pa nema skoka kad se prsti puste. Jedan prst pomera uvecan krug (samo dok je zumirano — inace skrol strane
 * ostaje slobodan); dva prsta stezu. `ZumOkvir` ide oko kruga u OBA primerka (iOS), `gest` na providni sloj za dodir.
 */
export function useTockZum(size: number, okretanje?: Okretanje) {
  const [zum, setZum] = React.useState<Zum>(BEZ_ZUMA);
  const zumirano = zum.s > 1.001;
  /** Razmera na kojoj je krug NACRTAN: pun, ili uvecan za zum. */
  const sr = zumirano ? ZUM_MAX : 1;

  // Upisano stanje, za UI nit (gestovi ne smeju da citaju React stanje).
  const s = useSharedValue(1);
  const fx = useSharedValue(0.5);
  const fy = useSharedValue(0.5);
  /** Razmera na kojoj je trenutno nacrtan krug, kako ga vidi UI nit (kasni za `sr` do ponovnog crtanja). */
  const srUI = useSharedValue(1);
  /** Upis ceka ponovno crtanje kruga (promena `sr`); do tada ostaje stara slika i privremena transformacija. */
  const ceka = useSharedValue(false);
  // Privremena transformacija dok traje pokret: razmera `g` oko tacke (`ox`, `oy`) pa pomeraj (`tx`, `ty`).
  const g = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const ox = useSharedValue(size / 2);
  const oy = useSharedValue(size / 2);

  // Kraj stezanja / pomeranja stigne i kao obican dodir (Pressable ispod): bez ovoga posle zuma iskoci
  // slucajna kartica. Gest se belezi pri POCETKU (rano), dodir se odbija dok traje i kratko posle.
  const gestDo = React.useRef(0);
  const oznaciGest = React.useCallback((traje: boolean) => { gestDo.current = traje ? Infinity : Date.now() + 350; }, []);

  const okret = React.useRef(okretanje);
  okret.current = okretanje;
  const okretPocetak = React.useCallback(() => okret.current?.pocetak(), []);
  const okretPomak = React.useCallback((stepeni: number) => okret.current?.pomak(stepeni), []);
  const okretKraj = React.useCallback(() => okret.current?.kraj(), []);
  const mozeOkretanje = !!okretanje;
  // Stanje okretanja na UI niti: gde je prst presao pre pokreta, poslednji ugao, zbir i vreme poslednjeg osvezavanja.
  const zpKandidat = useSharedValue(false);
  const zpPocX = useSharedValue(0);
  const zpPocY = useSharedValue(0);
  const okPocX = useSharedValue(0);
  const okPocY = useSharedValue(0);
  const okKandidat = useSharedValue(false);
  const okPrethodni = useSharedValue(0);
  const okZbir = useSharedValue(0);
  const okPoslednje = useSharedValue(0);

  const prolazniStil = useAnimatedStyle(() => {
    const c = size / 2;
    // Razmera oko tacke f, pa pomeraj — ista preslikavanja kao `primeniPokret`.
    return {
      transform: [
        { translateX: (ox.get() - c) * (1 - g.get()) + tx.get() },
        { translateY: (oy.get() - c) * (1 - g.get()) + ty.get() },
        { scale: g.get() },
      ],
    };
  });
  // Okvir se pojavi ODMAH cim krene zum (ili je zumirano): uvuce se, dobije belu podlogu i senku. Bez tween-a:
  // dok se okvir uvlacio 140 ms, uvecan krug je na tren virio preko hedera i imena (Ivan: "nesto fleshne").
  const uvecan = useDerivedValue(() => (s.get() > 1.001 || g.get() > 1.001 ? 1 : 0));
  const okvirStil = useAnimatedStyle(() => {
    const u = uvecan.get();
    return {
      top: UVLACENJE.gore * u,
      bottom: UVLACENJE.dole * u,
      backgroundColor: `rgba(255,255,255,${u})`,
      shadowOpacity: 0.05 * u,
      elevation: 2 * u,
    };
  });
  // Sadrzaj se vraca za onoliko koliko se okvir uvukao odozgo, da krug ne bi skocio.
  const pomakStil = useAnimatedStyle(() => ({ top: -UVLACENJE.gore * uvecan.get() }));

  // Gde stoji nacrtani (uvecani) krug: razmera S/sr oko njegove sredine, pa pomeraj da sredina prikaza padne na (fx, fy).
  const osnovaStil = useAnimatedStyle(() => {
    const S = s.get();
    const R = srUI.get();
    const k = S / R;
    const rez = (size * R * (1 - k)) / 2;
    return {
      transform: [
        { translateX: size / 2 - fx.get() * S * size - rez },
        { translateY: size / 2 - fy.get() * S * size - rez },
        { scale: k },
      ],
    };
  });

  // Krug je ponovo nacrtan na novoj razmeri: sad se upisuje stanje i gasi privremena transformacija (isti kadar).
  React.useLayoutEffect(() => {
    if (!ceka.get()) return;
    srUI.set(sr); s.set(zum.s); fx.set(zum.fx); fy.set(zum.fy);
    g.set(1); tx.set(0); ty.set(0);
    ceka.set(false);
  }, [zum, sr, ceka, srUI, s, fx, fy, g, tx, ty]);

  const gest = React.useMemo(() => {
    const trenutni = (): Zum => { 'worklet'; return { s: s.get(), fx: fx.get(), fy: fy.get() }; };
    const primeni = (faktor: number, f: { x: number; y: number }, t: { x: number; y: number }) => {
      'worklet';
      const r = primeniPokret(trenutni(), size, faktor, f, t);
      g.set(r.g); tx.set(r.t.x); ty.set(r.t.y);
    };
    const upisi = () => {
      'worklet';
      const r = primeniPokret(trenutni(), size, g.get(), { x: ox.get(), y: oy.get() }, { x: tx.get(), y: ty.get() });
      if ((r.zum.s > 1.001) !== (srUI.get() > 1.5)) {
        // Menja se razmera crtanja (prvo stezanje ili povratak na pun krug): upis ceka novi crtez.
        ceka.set(true);
      } else {
        // Isti crtez: samo se premesta — sve odjednom, bez ponovnog crtanja.
        s.set(r.zum.s); fx.set(r.zum.fx); fy.set(r.zum.fy);
        g.set(1); tx.set(0); ty.set(0);
      }
      scheduleOnRN(setZum, r.zum);
    };

    const stezanje = Gesture.Pinch()
      .onStart((e) => {
        // Stezanje sa vec zumiranog kruga: prvi prst je mozda vec pomerao (gest pomeranja koji drugi prst OTKAZUJE).
        // Taj pomak se prvo UPISE (izgled ostaje isti), pa tek onda krece stezanje — inace bi ga prvo azuriranje
        // stezanja prepisalo i krug bi "poskocio" nazad.
        if (g.get() !== 1 || tx.get() !== 0 || ty.get() !== 0) upisi();
        ox.set(e.focalX); oy.set(e.focalY);
        scheduleOnRN(oznaciGest, true);
      })
      .onUpdate((e) => { primeni(e.scale, { x: ox.get(), y: oy.get() }, { x: e.focalX - ox.get(), y: e.focalY - oy.get() }); })
      .onEnd(() => { upisi(); scheduleOnRN(oznaciGest, false); });
    // Pomeranje uvecanog kruga: aktivira se RUCNO, samo dok je zumirano (`s`), pa se objekat gesta ne sklapa
    // iznova pri svakoj promeni zuma (to je moglo da prekine gest koji se upravo zavrsava).
    const pomeranje = Gesture.Pan()
      .manualActivation(true)
      .maxPointers(1)
      .onTouchesDown((e, upravljac) => {
        if (s.get() <= 1.001 || e.numberOfTouches !== 1) { zpKandidat.set(false); upravljac.fail(); return; }
        zpPocX.set(e.allTouches[0].x); zpPocY.set(e.allTouches[0].y); zpKandidat.set(true);
      })
      .onTouchesMove((e, upravljac) => {
        if (!zpKandidat.get()) return;
        if (e.numberOfTouches !== 1) { zpKandidat.set(false); upravljac.fail(); return; }
        if (Math.hypot(e.allTouches[0].x - zpPocX.get(), e.allTouches[0].y - zpPocY.get()) >= 8) { zpKandidat.set(false); upravljac.activate(); }
      })
      .onStart(() => { ox.set(size / 2); oy.set(size / 2); scheduleOnRN(oznaciGest, true); })
      .onUpdate((e) => { primeni(1, { x: size / 2, y: size / 2 }, { x: e.translationX, y: e.translationY }); })
      // Upis SAMO ako je pomeranje zavrseno, ne i kad ga otkaze drugi prst koji stize (stezanje sa vec zumiranog
      // kruga: prvi prst je vec pomerao pa ga drugi otkaze). `onEnd` se zove i pri otkazivanju, a `upisi` vraca
      // privremenu transformaciju na nulu — to je bio JEDAN kadar starog, uvecanog stanja usred stezanja
      // ("bljesne ovaj veliki", Ivan, 8.10.2026; nadjeno u snimku sa telefona, kadar 8,73 s).
      .onEnd((_e, uspesno) => { if (uspesno) upisi(); scheduleOnRN(oznaciGest, false); });
    const ugaoOko = (x: number, y: number) => { 'worklet'; return (Math.atan2(-(y - size / 2), x - size / 2) * 180) / Math.PI; };
    const okretanjeGest = Gesture.Pan()
      .enabled(mozeOkretanje)
      .manualActivation(true)
      .onTouchesDown((e, upravljac) => {
        const dodir = e.allTouches[0];
        // Dok je zumirano jedan prst pomera uvecan krug — okretanja nema.
        if (s.get() > 1.001) { okKandidat.set(false); upravljac.fail(); return; }
        const r = (Math.hypot(dodir.x - size / 2, dodir.y - size / 2) * VIEW) / size;
        if (e.numberOfTouches === 1 && r >= OKRETANJE_OD) {
          okPocX.set(dodir.x); okPocY.set(dodir.y); okKandidat.set(true);
        } else {
          okKandidat.set(false); upravljac.fail();
        }
      })
      .onTouchesMove((e, upravljac) => {
        if (!okKandidat.get()) return;
        if (e.numberOfTouches !== 1) { okKandidat.set(false); upravljac.fail(); return; }
        const dodir = e.allTouches[0];
        // Tek pri pravom pomeranju: obican dodir ostaje dodir (izbor na krugu).
        if (Math.hypot(dodir.x - okPocX.get(), dodir.y - okPocY.get()) >= 8) { okKandidat.set(false); upravljac.activate(); }
      })
      .onStart(() => {
        okPrethodni.set(ugaoOko(okPocX.get(), okPocY.get()));
        okZbir.set(0);
        okPoslednje.set(0);
        scheduleOnRN(oznaciGest, true);
        scheduleOnRN(okretPocetak);
      })
      .onUpdate((e) => {
        const a = ugaoOko(e.x, e.y);
        let d = a - okPrethodni.get();
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        okPrethodni.set(a);
        okZbir.set(okZbir.get() - d); // u smeru kazaljke = ugao opada = napred u vremenu
        const sad = Date.now();
        if (sad - okPoslednje.get() >= OKRETANJE_RAZMAK) {
          okPoslednje.set(sad);
          scheduleOnRN(okretPomak, okZbir.get());
        }
      })
      // `onEnd` (ne `onFinalize`): zove se samo posle pravog gesta; `onFinalize` i kad je gest otkazan na
      // dodiru, pa bi svaki obican dodir bio odbijen kao "gest u toku".
      .onEnd(() => { scheduleOnRN(okretPomak, okZbir.get()); scheduleOnRN(oznaciGest, false); scheduleOnRN(okretKraj); });
    return Gesture.Simultaneous(stezanje, pomeranje, okretanjeGest);
  }, [size, mozeOkretanje, oznaciGest, okretPocetak, okretPomak, okretKraj, s, fx, fy, srUI, ceka, g, tx, ty, ox, oy, zpKandidat, zpPocX, zpPocY, okPocX, okPocY, okKandidat, okPrethodni, okZbir, okPoslednje]);

  const vrati = React.useCallback(() => {
    ceka.set(true);
    setZum(BEZ_ZUMA);
  }, [ceka]);

  return {
    size,
    zum,
    zumirano,
    sr,
    prolazniStil,
    osnovaStil,
    okvirStil,
    pomakStil,
    gest,
    vrati,
    /** Traje li gest (ili je tek zavrsen): tada dodir ne sme da izabere nista. */
    gestTraje: () => Date.now() < gestDo.current,
    /** Dodir van uvucenog okvira (dok je zumirano) ne bira nista — tamo se nista ne vidi. */
    udarioOkvir: (y: number) => !zumirano || (y >= UVLACENJE.gore && y <= size - UVLACENJE.dole),
    /** Tacka na ekranu (u okviru kruga) -> tacka na krugu bez zuma; za pogodak. */
    uKrug: (x: number, y: number) => ekranUKrug(x, y, size, zum),
    /** Tacka na krugu bez zuma -> gde je sada na ekranu; za kartice kod elementa. */
    naEkran: (x: number, y: number) => krugUEkran(x, y, size, zum),
  };
}

/**
 * Okvir kruga: seca ono sto zum izvede napolje (zaobljeni uglovi, kad pun kvadrat postane vidljiv) i nosi
 * dve transformacije — privremenu (pokret u toku) i osnovnu (gde stoji nacrtani, uvecani krug). Dete je
 * krug nacrtan na `size * sr`.
 */
export function ZumOkvir({ z, children }: { z: ReturnType<typeof useTockZum>; children: (velicina: number) => React.ReactNode }) {
  return (
    // Spoljni View je pun okvir kruga i NE seca (senka okvira mora da izadje napolje); unutra je uvuceni okvir
    // sa senkom i belom podlogom, a tek u njemu sece.
    <View style={{ width: z.size, height: z.size }}>
      <Animated.View
        style={[
          { position: 'absolute', left: 0, right: 0, borderRadius: RADIJUS, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
          z.okvirStil,
        ]}>
        <View style={{ flex: 1, overflow: 'hidden', borderRadius: RADIJUS }}>
          <Animated.View style={[{ position: 'absolute', left: 0, width: z.size, height: z.size }, z.pomakStil]}>
            <Animated.View style={[{ width: z.size, height: z.size }, z.prolazniStil]}>
              <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: z.size * z.sr, height: z.size * z.sr }, z.osnovaStil]}>
                {children(z.size * z.sr)}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

/** Malo dugme u uglu kruga dok je zumirano: vraca pun krug (pored odzumiranja stezanjem). */
export function ZumVrati({ onPress }: { onPress: () => void }) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.karta.tockDodir.vratiZum}
      hitSlop={8}
      style={{ position: 'absolute', top: UVLACENJE.gore + 6, right: 6 }}
      className="h-8 w-8 items-center justify-center rounded-full bg-fill active:opacity-70">
      <Minimize2 size={15} color={neutral.ink} strokeWidth={2.2} />
    </Pressable>
  );
}
