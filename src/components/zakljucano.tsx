import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { brand, neutral, shadow } from '@/theme/tokens';
import { leaveSheetTo } from '@/components/sheet';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';

/**
 * BOJA PREMIUM-A (Ivan, 29.9.2026: "umesto gold boje koristi indigo za sve premium"):
 * indigo iz loga. Jedino mesto — katanci, kartica "Otključaj" i paywall citaju odavde.
 * Stilovi idu kroz `style`, jer za indigo nema Tailwind klase.
 */
export const PREMIUM = brand.indigo;
/** Svetla povrsina (krug oko katanca, izabran paket). */
export const PREMIUM_POVRSINA = 'rgba(64, 63, 152, 0.08)';
/**
 * Pozadina izabranog paketa na paywall-u — NEPROVIDNA bledo indigo (Ivan, 29.9.2026:
 * providna preko poluprovidne bele kartice je izlazila siva). Indigo 10% preko bele.
 */
export const PREMIUM_IZABRAN = '#ECECF6';
/** Obod kartice "Otključaj". */
export const PREMIUM_OBOD = 'rgba(64, 63, 152, 0.30)';

/**
 * Zakljucan sadrzaj za besplatne (Ivan, 29.9.2026) — granice su u `lib/pristup.ts`.
 * Boja Premium-a (`PREMIUM`) je ovde namerno: to je jedino mesto gde se placa (pravilo 2).
 *
 * Sve vodi na `/premium` (list sa spiskom sta Premium daje). Sa lista (tumacenje)
 * se ide kroz `leaveSheetTo`, da se list ne otvori preko lista.
 */
export function otvoriPremium(izLista = false) {
  if (izLista) leaveSheetTo('/premium');
  else router.push('/premium');
}

/** Kartica sa katancem i dugmetom "Otključaj" — ispod zakljucane liste ili teksta. */
export function PremiumKartica({ naslov, opis, dugme, izLista = false, ilustracija = true, className }: {
  naslov: string;
  opis: string;
  /** Natpis na dugmetu; podrazumevano "Otključaj". */
  dugme?: string;
  izLista?: boolean;
  /**
   * Ilustracija kruga u pozadini, zalepljena uz gornju ivicu, indigo krug sa katancem koji
   * viri iznad, i meka senka (Ivan, 30.9.2026) — PODRAZUMEVANO, isti izgled na svim mestima.
   * Krug viri 24pt iznad kartice, pa pozivalac daje veci razmak iznad (`mt-10` i vise).
   * Slika je `files/footer-illustration@2x.png` rotirana za 90° (`assets/images/kartica-premium-krug.png`).
   * `false` = stara ravna kartica.
   */
  ilustracija?: boolean;
  className?: string;
}) {
  const t = useT();
  const [sirina, setSirina] = React.useState(0);
  const tekstIDugme = (
    <>
      {/* Uz ilustraciju naslov veci i deblji (21pt, Bold — Ivan, 30.9.2026). */}
      <Text variant={ilustracija ? 'title' : 'h3'} className={cn('mt-4 text-center', ilustracija && tezina('naslovStrane'))}>{naslov}</Text>
      <Text variant="muted" className="mt-2 text-center">{opis}</Text>
      <Button className="mt-5 w-full" onPress={() => otvoriPremium(izLista)}>
        <Text>{dugme ?? t.opste.otkljucaj}</Text>
      </Button>
    </>
  );
  if (!ilustracija) {
    return (
      <View className={cn(CARD_SURFACE, 'p-6', className)} style={{ borderColor: PREMIUM_OBOD }}>
        <View className="h-12 w-12 items-center justify-center self-center rounded-full" style={{ backgroundColor: PREMIUM_POVRSINA }}>
          <Lock size={20} color={PREMIUM} />
        </View>
        {tekstIDugme}
      </View>
    );
  }
  // Senka na SPOLJNOM sloju (puna bela, bez `overflow-hidden` — iOS inace ne crta senku),
  // a slika se sece na UNUTRASNJEM, po zaobljenju kartice. Sirina slike se racuna iz
  // IZMERENE sirine kartice: `width: '100%'` + `aspectRatio` na apsolutnoj slici ju je
  // crtao ~2x vecom.
  //
  // Ivan, 30.9.2026: slika 70% sirine kartice, na sredini (+4pt udesno, 3pt ispod ivice);
  // krug sa katancem INDIGO (`PREMIUM`), katanac beo, a pola kruga viri IZNAD kartice —
  // zato je krug na spoljnom sloju (unutrasnji sece), a tekst ima mesta za donju polovinu.
  const sirinaSlike = sirina * SLIKA_UDEO;
  return (
    // `className` (razmak od teksta iznad) na OMOTACU: `marginTop` za krug u `style` bi ga pregazio.
    <View className={className}>
    <View className="rounded-lg bg-card" style={[shadow.soft, { marginTop: KATANAC / 2 }]}>
      <View
        className="overflow-hidden rounded-lg border px-6 pb-6"
        style={{ borderColor: PREMIUM_OBOD, paddingTop: KATANAC / 2 + SPUSTI_TEKST }}
        onLayout={(e) => setSirina(e.nativeEvent.layout.width)}>
        {sirina > 0 && (
          <>
            <Image
              source={KRUG}
              style={{
                position: 'absolute', top: POMERI_DOLE, left: (sirina - sirinaSlike) / 2 + POMERI_DESNO,
                width: sirinaSlike, height: sirinaSlike * KRUG_RAZMERA,
              }}
              accessible={false}
            />
            {/* Slika PUNA (Ivan, 30.9.2026), a preko nje, ispod teksta, preliv od providnog
                ka beloj — da se tekst cita. Belo je boja kartice (`bg-card`). */}
            <LinearGradient
              pointerEvents="none"
              colors={[BELA_PROVIDNA, BELA_POLA, neutral.white]}
              locations={[0, 0.4, 0.8]}
              style={{ position: 'absolute', top: POMERI_DOLE, left: 0, width: sirina, height: sirinaSlike * KRUG_RAZMERA }}
            />
          </>
        )}
        {tekstIDugme}
      </View>
      <View
        className="absolute items-center justify-center self-center rounded-full"
        style={{ top: -KATANAC / 2, width: KATANAC, height: KATANAC, backgroundColor: PREMIUM }}>
        <Lock size={20} color={neutral.white} strokeWidth={2.2} />
      </View>
    </View>
    </View>
  );
}

/** Precnik indigo kruga sa katancem na kartici sa ilustracijom; pola viri iznad kartice. */
const KATANAC = 48;
/** Sirina pozadinske slike kao udeo sirine kartice (Ivan: "smanji za 30%"). */
const SLIKA_UDEO = 0.7;
/** Slika malo desno od sredine i malo ispod ivice (Ivan: "za 2px", pa jos 2 udesno i 3 dole). */
const POMERI_DESNO = 4;
const POMERI_DOLE = 3;
/** Koliko je tekst spusten ispod kruga sa katancem (Ivan: "spusti malo dole"). */
const SPUSTI_TEKST = 16;
/** Preliv preko slike: bela kartice, providna pa napola pa puna. */
const BELA_PROVIDNA = 'rgba(255,255,255,0)';
const BELA_POLA = 'rgba(255,255,255,0.7)';
const KRUG = require('../../assets/images/kartica-premium-krug.png');
/** Visina / sirina slike (676 x 358 px). */
const KRUG_RAZMERA = 358 / 676;

/**
 * Zakljucani redovi u jednoj beloj kartici: ime (i sitno ispod) levo, katanac
 * desno. Pokazuje STA postoji, ne i sta pise — ime tranzita se ionako racuna
 * na telefonu. Ceo red vodi na `/premium`.
 */
export function ZakljucaniRedovi({ redovi, className }: {
  redovi: { key: string; naslov: string; ispod?: string }[];
  className?: string;
}) {
  const t = useT();
  if (redovi.length === 0) return null;
  return (
    <View className={cn(CARD_SURFACE, 'py-1', className)}>
      {redovi.map((r, i) => (
        <React.Fragment key={r.key}>
          {i > 0 && <View className="h-px bg-border" />}
          <Pressable
            onPress={() => otvoriPremium()}
            accessibilityRole="button"
            accessibilityLabel={t.profil.zakljucano.red(r.naslov)}
            className="flex-row items-center gap-3 px-4 py-3 active:opacity-80">
            <View className="flex-1">
              <Text variant="default" numberOfLines={2}>{r.naslov}</Text>
              {!!r.ispod && <Text variant="caption" className="mt-0.5" numberOfLines={1}>{r.ispod}</Text>}
            </View>
            <Lock size={16} color={PREMIUM} />
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}
