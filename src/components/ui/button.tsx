import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';
import { shadow } from '@/theme/tokens';
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
 * Samo uz `istaknuto`; ostala crna dugmad ostaju kakva su bila.
 *
 *   1. Ispuna nije ravna: svetlija crna gore, tamnija dole (kao zakrivljena povrsina).
 *   2. Sjaj preko gornje polovine — providna bela koja se gubi ka sredini.
 *   3. Tanka svetla linija na samom vrhu (odsjaj ivice) — pojacan `SjajIvice`.
 *   4. Tiha crna senka ispod, da dugme malo lebdi.
 *      Senka ide na OMOTAC: dugme ima `overflow-hidden` (zbog zaobljenja
 *      sjaja), a iOS ne crta senku pogleda koji secka svoj sadrzaj.
 */
// Ublazeno (Ivan: "prejak sjaj"): ispuna blizu ravne, sjaj i linija na vrhu upola tisi.
const ISTAKNUTO_ISPUNA = ['#26262A', '#18181A', '#111112'] as const;
const ISTAKNUTO_ISPUNA_TACKE = [0, 0.55, 1] as const;
const ISTAKNUTO_SENKA = {
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

type ButtonProps = React.ComponentProps<typeof Pressable> & VariantProps<typeof buttonVariants> & {
  /** Crno dugme sa prelivom, sjajem i indigo senkom (`SjajIstaknuto`). */
  istaknuto?: boolean;
};

export function Button({
  className,
  variant,
  size,
  disabled,
  style,
  children,
  istaknuto = false,
  ...props
}: ButtonProps) {
  /*
   * Neaktivno dugme u referentnoj aplikaciji NIJE prigusena verzija crnog —
   * ono postane belo sa sivim natpisom. Razlika je vazna: prigusena crna i
   * dalje vuce oko kao glavna akcija, a belo jasno kaze "jos ne moze".
   */
  const ugaseno = Boolean(disabled);
  const stvarni = ugaseno ? 'soft' : (variant ?? 'default');
  const meka = stvarni === 'soft';
  const crno = stvarni === 'default' || stvarni === 'destructive';
  const sjajno = istaknuto && stvarni === 'default';

  const dugme = (
    <TextClassContext.Provider
      value={cn(buttonTextVariants({ variant: stvarni, size }), ugaseno && 'text-subtle')}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        // Obican niz, ne funkcija: NativeWind uz `className` ODBACI `style` zadat
        // kao funkcija — senka mekog dugmeta i boja poslata spolja nisu stizale do
        // ekrana (izmereno na vebu, 28.9.2026). Funkcija ostaje samo kad ju je
        // pozivalac sam dao.
        style={typeof style === 'function'
          ? (stanje) => [meka ? shadow.soft : null, style(stanje)]
          : [meka ? shadow.soft : null, style]}
        className={cn(buttonVariants({ variant: stvarni, size }), className)}
        {...props}>
        {(stanje) => (
          <>
            {/* PRVI u stablu, da natpis ostane iznad njega. */}
            {sjajno ? <SjajIstaknuto /> : null}
            {crno ? <SjajIvice /> : null}
            {typeof children === 'function' ? children(stanje) : children}
          </>
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
  if (!sjajno) return dugme;
  // Omotac nosi senku (vidi `ISTAKNUTO_SENKA`); na Androidu `elevation` trazi pozadinu i oblik.
  return (
    <View style={[ISTAKNUTO_SENKA, { borderRadius: 999, backgroundColor: '#111112' }]}>
      {dugme}
    </View>
  );
}

export { buttonVariants, buttonTextVariants };
