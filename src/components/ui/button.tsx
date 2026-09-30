import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';
import { neutral, obrubDugmetaAndroid, shadow } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/*
 * Dugme referentne aplikacije: KAPSULA preko cele sirine, 50pt visoko,
 * natpis 17pt polucrn. Crno na belom je jedina "glasna" povrsina na ekranu —
 * zato ekran nikad nema dva primarna dugmeta.
 *
 * Sve mere su izmerene sa snimaka (`src/theme/tokens.ts`), ukljucujuci
 * margine: dugme pocinje na 20pt od ivice ekrana, pa je `mx-screen` posao
 * ekrana, ne dugmeta.
 */
const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 overflow-hidden rounded-pill active:opacity-80',
  {
    variants: {
      variant: {
        /** Jedina glavna akcija na ekranu. */
        default: 'bg-primary',
        /** Sporedna akcija pored primarne ("Continue with Email"). */
        secondary: 'bg-fill',
        /**
         * Belo dugme na beloj pozadini. Drzi ga SENKA, ne ivica — vidi
         * `shadow.soft`. Senka se dodaje kroz `style`, jer NativeWind klase
         * za senku ne pokrivaju iOS i Android istom vrednoscu.
         */
        soft: 'bg-background',
        outline: 'border border-border bg-transparent',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive',
      },
      size: {
        default: 'h-button px-6',
        /** Nize dugme u modalnom listu i u redovima. */
        compact: 'h-button-compact px-5',
        sm: 'h-10 px-4',
        lg: 'h-button px-8',
        /** Kruzno dugme u zaglavlju ekrana (zupcanik, strelica nazad). */
        icon: 'h-header-button w-header-button px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

/** Klase za tekst UNUTAR dugmeta — parne se sa buttonVariants preko contexta. */
const buttonTextVariants = cva(tezina('dugme'), {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      soft: 'text-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
    size: {
      default: 'text-button',
      compact: 'text-button',
      sm: 'text-meta',
      lg: 'text-button',
      icon: 'text-button',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

/* ------------------------------------------------------------------ */
/* SJAJ NA IVICI CRNOG DUGMETA                                         */
/* ------------------------------------------------------------------ */

/*
 * Crno dugme u referentnoj aplikaciji NIJE ravna povrsina.
 *
 * Poprecni presek kroz sva cetiri crna dugmeta na snimcima daje ISTI niz
 * vrednosti (crveni kanal, od spoljne ivice ka unutra):
 *
 *   FF FF | 4E | 1F | 47 39 28 1E 1D 1B 1A 19 19 18 18 17 17 17 16 16 16 15 15 …
 *   belo    AA   ivica  svetlo jezgro  ——— dug, jedva vidljiv pad ka #151515
 *
 * Tri stvari se iz toga citaju:
 *
 *   1. Ivica od 1 PIKSELA je tamnija od ispune: #121212 prema #151515.
 *      NE crtamo je. Tri nivoa od 255 nijedan ekran ne prikaze, a na vebu
 *      react-native-web pretvara `style` u klasu pa je `borderWidth` svejedno
 *      pojela njegova osnovna klasa (provereno citanjem `getComputedStyle`).
 *      Ostaje zapisana ovde da se ne meri ponovo.
 *
 *   2. Odmah unutar ivice stoji SVETLA linija koja pada ka ispuni — ONO sto se
 *      zaista vidi kao "linijica" na vrhu dugmeta. Vrh je
 *      #474747, sto je bela preko #151515 na ~21% neprovidnosti.
 *
 *   3. Sjaj postoji SAMO gore i dole. Levo i desno presek ide belo → ivica →
 *      #151515 bez ijednog medjukoraka. I ne skalira se sa visinom: dugme od
 *      34,7pt i dugme od 50,7pt imaju identican profil, pa to nije preliv
 *      preko cele visine nego efekat na ivici, visok tacno 7pt.
 *
 * Svetla polja i polja za unos ovo NEMAJU — presek kroz polje (#F5F5F5) je
 * ravan od ivice do ivice. Efekat je iskljucivo na crnoj povrsini.
 *
 * Najverovatnije je u pitanju iOS 26 Liquid Glass sa crnim tonom. Namerno ga
 * NE crtamo preko `expo-glass-effect`: tamo bi postojao samo na iOS-u 26, a
 * ovako izgleda isto na Androidu, starijem iOS-u i vebu. Ako se ikad bude
 * htelo pravo staklo, ovo je fallback koji vec postoji.
 */

/** Visina sjaja. Fiksna — ne zavisi od visine dugmeta. */
const SJAJ = 7;

/** Neprovidnosti prepisane iz preseka, na 0, 1, 2, 3, 7 i 14 piksela od ivice. */
const SJAJ_BOJE = [
  'rgba(255,255,255,0.21)',
  'rgba(255,255,255,0.155)',
  'rgba(255,255,255,0.08)',
  'rgba(255,255,255,0.04)',
  'rgba(255,255,255,0.017)',
  'rgba(255,255,255,0.004)',
  'rgba(255,255,255,0)',
] as const;
const SJAJ_TACKE = [0, 0.048, 0.095, 0.143, 0.333, 0.667, 1] as const;

/** Iste vrednosti okrenute naglavce, za donju ivicu. */
const SJAJ_BOJE_DOLE = [...SJAJ_BOJE].reverse() as unknown as readonly [string, string, ...string[]];
const SJAJ_TACKE_DOLE = [...SJAJ_TACKE].reverse().map((t) => 1 - t);

function SjajIvice() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={SJAJ_BOJE as unknown as readonly [string, string, ...string[]]}
        locations={SJAJ_TACKE as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SJAJ }}
      />
      <LinearGradient
        colors={SJAJ_BOJE_DOLE}
        locations={SJAJ_TACKE_DOLE as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SJAJ }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* ISTAKNUTO CRNO DUGME ("Saznaj više")                                */
/* ------------------------------------------------------------------ */

/*
 * Ivan, 28.9.2026: crno dugme "previse flat — da ima neke sjajeve, senku".
 * Od 29.9.2026 (Ivan: "sva crna dugmad da budu fensi, svuda") ovako izgleda
 * SVAKO crno dugme — `istaknuto` je podrazumevano ukljuceno.
 *
 *   1. Ispuna nije ravna: svetlija crna gore, tamnija dole (kao zakrivljena povrsina).
 *   2. Sjaj preko gornje polovine — providna bela koja se gubi ka sredini.
 *   3. Tanka svetla linija na samom vrhu (odsjaj ivice) — pojacan `SjajIvice`.
 *   4. Tiha crna senka ispod, da dugme malo lebdi.
 *      Senka ide na SAMO dugme, a sjajevi su u svom zaobljenom sloju koji secka
 *      (`SjajCrnogDugmeta`): iOS ne crta senku pogleda koji secka svoj sadrzaj,
 *      pa dugme ne sme da ima `overflow-hidden`. Ranije je senku nosio omotac
 *      oko dugmeta — margine i poravnanje iz `className` su tada ostajali na
 *      unutrasnjem dugmetu, pa je svaki ekran morao da ga umota u svoj View.
 */
// Ublazeno (Ivan: "prejak sjaj"): ispuna blizu ravne, sjaj i linija na vrhu upola tisi.
const ISTAKNUTO_ISPUNA = ['#26262A', '#18181A', '#111112'] as const;
const ISTAKNUTO_ISPUNA_TACKE = [0, 0.55, 1] as const;
/**
 * Okvir belog dugmeta gde nema stakla — zaglavlje (`GlassIconButton`), mehur
 * (`GlassBubble`), kapsule (`ui/kapsule.tsx`). iOS: senka `shadow.soft`. Android: tanak
 * obrub bez senke (`obrubDugmetaAndroid`, Ivan 30.9.2026) — od `soft` tamo ostane samo
 * nevidljiva `elevation`.
 */
export const OKVIR_DUGMETA = Platform.OS === 'android' ? obrubDugmetaAndroid : shadow.soft;

export const ISTAKNUTO_SENKA = {
  // Prvo je bila indigo 0,35 / 14 — "previse naglaseno, i da nije ljubicasta" (Ivan):
  // sada crna, tisa i bliza dugmetu.
  shadowColor: '#000000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

function SjajIstaknuto() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={ISTAKNUTO_ISPUNA as unknown as readonly [string, string, ...string[]]}
        locations={ISTAKNUTO_ISPUNA_TACKE as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']}
        locations={[0, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
      />
      <View style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
    </View>
  );
}

/**
 * Svi sjajevi crnog dugmeta u jednom sloju zaobljenom kao dugme, koji ih secka —
 * dugme samo ne secka, da bi mu se videla senka. Izvezen za crna dugmad koja nisu
 * `Button` (okruglo play dugme u `glasovna-poruka.tsx`); senka je `ISTAKNUTO_SENKA`.
 * `istaknuto` false: samo odsjaj ivice, kao ravno crno dugme ranije.
 */
export function SjajCrnogDugmeta({ istaknuto = true }: { istaknuto?: boolean }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 999, overflow: 'hidden' }]}>
      {istaknuto ? <SjajIstaknuto /> : null}
      <SjajIvice />
    </View>
  );
}

type ButtonProps = React.ComponentProps<typeof Pressable> & VariantProps<typeof buttonVariants> & {
  /**
   * Crno dugme sa prelivom, sjajem i senkom (`SjajIstaknuto`). Podrazumevano
   * UKLJUCENO (Ivan, 29.9.2026) — `false` vraca ravno crno dugme.
   */
  istaknuto?: boolean;
  /**
   * Nesto se ceka (slanje, cuvanje, provera koda). Dugme ZADRZI svoj izgled, a
   * umesto natpisa se vrti sistemski spiner u boji natpisa (Ivan, 29.9.2026:
   * "Ucitavam" koji samo stoji ne kaze da se nesto desava). Do tada je ekran
   * menjao natpis ("Saljem…") i gasio dugme, pa je crno dugme za vreme cekanja
   * pobelelo kao da nesto nije u redu.
   *
   * Dugme se za to vreme ne moze pritisnuti — drugi dodir ne salje dvaput.
   * Natpis ostaje u stablu, samo nevidljiv: dugme zadrzi sirinu, a citac
   * ekrana i dalje zna koje je dugme (uz `busy`).
   */
  ucitava?: boolean;
};

export function Button({
  className,
  variant,
  size,
  disabled,
  style,
  children,
  istaknuto = true,
  ucitava = false,
  accessibilityState,
  ...props
}: ButtonProps) {
  /*
   * UGASENO DUGME JE SIVA KAPSULA (`bg-fill-strong`) sa sivim natpisom — SVUDA
   * (Ivan, 29.9.2026: "da ima neku boju a ne da bude samo tekst"; stil sa
   * "Postavi pitanje"). Nije prigusena verzija crnog: ta i dalje vuce oko kao
   * glavna akcija. Nije ni belo sa senkom (ranije): na belom listu se od njega
   * video samo natpis, pa je izgledalo kao tekst, ne kao dugme.
   */
  // Dok se ceka, dugme NIJE ugaseno na izgled — vidi `ucitava`.
  const ugaseno = Boolean(disabled) && !ucitava;
  const stvarni = ugaseno ? 'secondary' : (variant ?? 'default');
  const meka = stvarni === 'soft';
  const crno = stvarni === 'default' || stvarni === 'destructive';
  const sjajno = istaknuto && stvarni === 'default';

  return (
    <TextClassContext.Provider
      value={cn(buttonTextVariants({ variant: stvarni, size }), ugaseno && 'text-subtle')}>
      <Pressable
        accessibilityRole="button"
        disabled={Boolean(disabled) || ucitava}
        accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) || ucitava, busy: ucitava }}
        // Obican niz, ne funkcija: NativeWind uz `className` ODBACI `style` zadat
        // kao funkcija — senka mekog dugmeta i boja poslata spolja nisu stizale do
        // ekrana (izmereno na vebu, 28.9.2026). Funkcija ostaje samo kad ju je
        // pozivalac sam dao.
        // Senka istaknutog dugmeta je na samom dugmetu (vidi `ISTAKNUTO_SENKA`); na
        // Androidu `elevation` prati pozadinu i zaobljenje dugmeta.
        style={typeof style === 'function'
          ? (stanje) => [meka ? OKVIR_DUGMETA : null, sjajno ? ISTAKNUTO_SENKA : null, style(stanje)]
          : [meka ? OKVIR_DUGMETA : null, sjajno ? ISTAKNUTO_SENKA : null, style]}
        className={cn(
          buttonVariants({ variant: stvarni, size }),
          // Bez seckanja, inace iOS ne crta senku; sjajeve secka njihov sloj.
          sjajno && 'overflow-visible',
          ugaseno && 'bg-fill-strong',
          className,
        )}
        {...props}>
        {(stanje) => {
          const sadrzaj = typeof children === 'function' ? children(stanje) : children;
          return (
            <>
              {/* PRVI u stablu, da natpis ostane iznad njega. */}
              {crno ? <SjajCrnogDugmeta istaknuto={sjajno} /> : null}
              {ucitava ? (
                <>
                  <View className="flex-row items-center justify-center gap-2 opacity-0">{sadrzaj}</View>
                  <View pointerEvents="none" style={StyleSheet.absoluteFill} className="items-center justify-center">
                    <ActivityIndicator color={crno ? neutral.white : neutral.ink} />
                  </View>
                </>
              ) : sadrzaj}
            </>
          );
        }}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { buttonVariants, buttonTextVariants };
