import * as React from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Planeta } from '@/components/planete-par';
import { MoonDisc } from '@/components/moon-disc';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import {
  cenaPoMesecu, kupiPremium, usePaketiPremium, ustedaGodisnje, vratiKupovine, type PaketPremium,
} from '@/lib/kupovina';
import { dana } from '@/lib/mnozina';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { PREMIUM, PREMIUM_IZABRAN } from '@/components/zakljucano';
import { neutral } from '@/theme/tokens';

/** Prostor za rucicu i X iznad naslova. */
const RUCICA_PROSTOR = 44;
/** Sirina mesta za ilustraciju levo od teksta. */
const ILUSTRACIJA = 76;
/** Pravila na sajtu (`web/`, pravila.astroshop.rs) — Apple trazi linkove na paywall-u. */
const USLOVI = 'https://pravila.astroshop.rs/uslovi';
const PRIVATNOST = 'https://pravila.astroshop.rs/privatnost';

/**
 * Paywall (Ivan, 29.9.2026, po uzoru na CHANI): sta Premium daje, dva paketa,
 * jedno crno dugme, pa Uslovi / Vrati kupovine / Privatnost. Otvara se sa
 * svakog "Otključaj" i zakljucanog reda (`components/zakljucano.tsx`); granice
 * besplatnog su u `lib/pristup.ts`.
 *
 * Po nasim pravilima, ne po CHANI-ju: siva pozadina i bele kartice (pravilo 2),
 * indigo Premium-a (`PREMIUM`) SAMO na paketu i oznaci, bez uzvika i bez "Oops". Cena i
 * proba stizu IZ PRODAVNICE (`usePaketiPremium`, RevenueCat) — dok je nema,
 * paketi se ne crtaju i ekran to kaze. Bez polja za promo kod (Apple 3.1.1;
 * kampanje idu kroz Offer Codes, pravilo 8).
 */
/**
 * Zatvaranje: nazad na ekran sa kog je paywall otvoren. Kad je paywall PRVI ekran
 * (otvoren linkom, posle osvezavanja) nazad ne postoji i `back()` ne radi nista —
 * tada na kapiju (pravilo 11), koja sama zna gde korisnik ide.
 */
function zatvori() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function Premium() {
  const insets = useSafeAreaInsets();
  // Otvoren preko drugog ekrana = iOS list; utvrdjuje se jednom, pri otvaranju.
  const [kaoList] = React.useState(() => Platform.OS === 'ios' && router.canGoBack());
  const paketi = usePaketiPremium();
  const [izabran, setIzabran] = React.useState<PaketPremium['id']>('godisnje');
  const [poruka, setPoruka] = React.useState<string | null>(null);
  const [radi, setRadi] = React.useState(false);

  const godisnji = paketi?.find((p) => p.id === 'godisnje');
  const mesecni = paketi?.find((p) => p.id === 'mesecno');
  const usteda = godisnji && mesecni ? ustedaGodisnje(godisnji.iznos, mesecni.iznos) : null;
  const paket = paketi?.find((p) => p.id === izabran) ?? null;

  const kupi = async () => {
    if (!paket || radi) return;
    setRadi(true);
    setPoruka(null);
    const ishod = await kupiPremium(paket.id);
    setRadi(false);
    if (ishod === 'nedostupno') setPoruka('Kupovina u aplikaciji još nije uključena.');
    else if (ishod === 'greska') setPoruka('Kupovina nije uspela. Pokušaj ponovo za koji trenutak.');
    else if (ishod === 'ceka') setPoruka('Kupovina čeka odobrenje. Premium se uključuje čim stigne.');
    else if (ishod === 'placeno') zatvori();
  };

  const vrati = async () => {
    setPoruka(null);
    const ishod = await vratiKupovine();
    if (ishod === 'nedostupno') setPoruka('Kupovina u aplikaciji još nije uključena.');
    else if (ishod === 'nema') setPoruka('Na ovom nalogu prodavnice nema pretplate za Astroshop.');
    else if (ishod === 'greska') setPoruka('Provera nije uspela. Pokušaj ponovo za koji trenutak.');
    else zatvori();
  };

  return (
    // LIST PREKO CELOG EKRANA (Ivan, 29.9.2026: "povecaj na 100%", vise vazduha).
    // `modal` (ne `formSheet`, koji sadrzaju ne daje visinu): gore naslov i stavke,
    // dole paketi, dugme i pravila; visak visine ide IZMEDJU, da paketi ostanu uz
    // dugme. Na malom telefonu se sve skroluje.
    <View className="flex-1 bg-grouped" style={{ paddingTop: kaoList ? 0 : insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 4 }}
        showsVerticalScrollIndicator={false}>
      <View className="px-5" style={{ paddingTop: RUCICA_PROSTOR }}>

        <Text variant="naslovLista" className="text-center" accessibilityRole="header">
          Otvori sva tumačenja
        </Text>
        {/* Uze od ekrana, da se prelomi u dva ujednacena reda — ne jedna rec sama u drugom (Ivan, 29.9.2026). */}
        <Text variant="muted" className="mt-3 self-center text-center" style={{ maxWidth: 280 }}>
          Svi tvoji tranziti, teme perioda i pogled na sutra i prekosutra.
        </Text>

        <View className="mt-7 gap-5">
          <Stavka
            slika={
              <Image
                source={require('../../assets/images/natalna-karta-objasnjenje.png')}
                style={{ width: ILUSTRACIJA, height: ILUSTRACIJA * (1520 / 1774) }}
                resizeMode="contain"
                accessible={false}
              />
            }
            naslov="Natalna karta"
            tekst="Tumačenje svake planete po znaku i kući i svih aspekata."
          />
          <Stavka
            slika={
              <AspektIlustracija
                aspekt="trine"
                tranzitna={{ key: 'jupiter', glyph: '♃\uFE0E' }}
                natalna={{ key: 'venus', glyph: '♀\uFE0E' }}
                width={ILUSTRACIJA - 12}
              />
            }
            naslov="Tranziti"
            tekst="Svi tranziti dana, svaki dan, sa celim tumačenjem."
          />
          {/* Spori tranziti (Jupiter—Pluton), slajd "Tema perioda"; besplatni vidi prvi. */}
          <Stavka
            slika={
              <View className="flex-row items-center">
                <Planeta t={{ key: 'saturn', glyph: '♄\uFE0E' }} size={40} />
                <View className="-ml-2">
                  <Planeta t={{ key: 'pluto', glyph: '♇\uFE0E' }} size={28} />
                </View>
              </View>
            }
            naslov="Teme perioda"
            tekst="Spori tranziti koji traju mesecima."
          />
          <Stavka
            slika={<MoonDisc angle={60} size={48} />}
            naslov="Sledeća dva dana"
            tekst="Pogledaj tumačenja za dva dana unapred."
          />
        </View>

      </View>

      {/* Sav visak visine ovde — izmedju stavki i paketa. */}
      <View className="min-h-4 flex-1" />

      <View className="px-5">
        {/* Paketi — samo kad je cena stigla iz prodavnice. */}
        {godisnji && mesecni ? (
          <View className="flex-row gap-3" accessibilityRole="radiogroup">
            <PaketKartica
              paket={godisnji}
              naslov="Godišnje"
              period="godišnje"
              ispod={`${cenaPoMesecu(godisnji.iznos, godisnji.valuta)} mesečno`}
              oznaka={usteda ? `Uštedi ${usteda}%` : undefined}
              izabran={izabran === 'godisnje'}
              onPress={() => setIzabran('godisnje')}
            />
            <PaketKartica
              paket={mesecni}
              naslov="Mesečno"
              period="mesečno"
              izabran={izabran === 'mesecno'}
              onPress={() => setIzabran('mesecno')}
            />
          </View>
        ) : (
          <Text variant="muted" className="text-center">
            Kupovina u aplikaciji još nije uključena.
          </Text>
        )}
      </View>

      {/* Dno: jedno dugme i pravila, odmah ispod paketa (Ivan: manja rupa). */}
      <View className="px-5 pt-5">
        {!!poruka && <Text variant="muted" className="mb-3 text-center" accessibilityLiveRegion="polite">{poruka}</Text>}
        <Button disabled={!paket} ucitava={radi} className={cn(!paket && 'opacity-40')} onPress={kupi}>
          <Text>{paket?.probaDana ? `Probaj ${dana(paket.probaDana)} besplatno` : 'Pretplati se'}</Text>
        </Button>
        {!!paket && (
          <Text variant="caption" className="mt-3 text-center">
            {paket.probaDana
              ? `Posle probe ${paket.cena} ${paket.id === 'godisnje' ? 'godišnje' : 'mesečno'}. `
              : ''}
            Pretplata se obnavlja sama dok je ne otkažeš u podešavanjima {Platform.OS === 'ios' ? 'App Store-a' : 'Google Play-a'}.
          </Text>
        )}
        <View className="mt-2 flex-row items-center justify-center">
          <Veza onPress={() => WebBrowser.openBrowserAsync(USLOVI)}>Uslovi</Veza>
          <Crta />
          <Veza onPress={vrati}>Vrati kupovine</Veza>
          <Crta />
          <Veza onPress={() => WebBrowser.openBrowserAsync(PRIVATNOST)}>Privatnost</Veza>
        </View>
      </View>
      </ScrollView>

      {/* Rucica: `modal` je nema sam (Ivan, 29.9.2026) — zatvara se i povlacenjem nadole. */}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 items-center"
        style={{ top: (kaoList ? 0 : insets.top) + 6 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View className="h-[5px] w-9 rounded-pill bg-subtle opacity-50" />
      </View>

      {/* X gore desno, MALI (Ivan, 29.9.2026: native stavka trake je bila prevelika) —
          siv krug kao zatvaranje sistemskih listova, ne staklo. Dodir 44pt kroz `hitSlop`. */}
      <Pressable
        onPress={zatvori}
        accessibilityRole="button"
        accessibilityLabel="Zatvori"
        hitSlop={10}
        className="absolute right-4 h-[30px] w-[30px] items-center justify-center rounded-pill bg-fill active:opacity-60"
        style={{ top: (kaoList ? 0 : insets.top) + 14 }}>
        <X size={16} color={neutral.inkSubtle} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

/** Red: ilustracija levo, podebljan naslov i recenica desno. */
function Stavka({ slika, naslov, tekst }: { slika: React.ReactNode; naslov: string; tekst: string }) {
  return (
    <View className="flex-row items-center gap-4" accessible accessibilityLabel={`${naslov}. ${tekst}`}>
      <View style={{ width: ILUSTRACIJA }} className="items-center justify-center">{slika}</View>
      <View className="flex-1">
        {/* Naslov veci i bold (Ivan, 29.9.2026). */}
        <Text variant="default" className={cn('text-[17px] leading-[22px]', tezina('paywallStavka'))}>{naslov}</Text>
        <Text variant="default" className="mt-0.5">{tekst}</Text>
      </View>
    </View>
  );
}

/**
 * Paket: bela kartica; izabran dobija indigo obod i svetlu indigo povrsinu
 * (`PREMIUM`) — boja Premium-a je ovde na mestu, to je jedino sto se placa.
 */
function PaketKartica({ paket, naslov, period, ispod, oznaka, izabran, onPress }: {
  paket: PaketPremium;
  naslov: string;
  period: string;
  ispod?: string;
  oznaka?: string;
  izabran: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: izabran }}
      accessibilityLabel={[naslov, paket.probaDana ? `${dana(paket.probaDana)} besplatno` : null, `${paket.cena} ${period}`, ispod, oznaka].filter(Boolean).join(', ')}
      className={cn(CARD_SURFACE, 'flex-1 border-2 p-4 active:opacity-80', !izabran && 'border-transparent')}
      style={izabran ? { borderColor: PREMIUM, backgroundColor: PREMIUM_IZABRAN } : undefined}>
      {!!oznaka && (
        <View className="absolute -top-3 right-3 rounded-pill px-2.5 py-1" style={{ backgroundColor: PREMIUM }}>
          <Text variant="caption" className={cn('text-white', tezina('naslovUTekstu'))}>{oznaka}</Text>
        </View>
      )}
      <View className="flex-row items-center gap-2">
        <View className={cn('h-5 w-5 items-center justify-center rounded-pill border-2', !izabran && 'border-fill-strong')} style={izabran ? { borderColor: PREMIUM } : undefined}>
          {izabran && <View className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: PREMIUM }} />}
        </View>
        <Text variant="h3">{naslov}</Text>
      </View>
      <View className="mt-3">
        {!!paket.probaDana && <Text variant="default">{dana(paket.probaDana)} besplatno</Text>}
        {/* Cena podebljana (Ivan, 29.9.2026). */}
        <Text variant="default"><Text variant="default" className={tezina('naslovUTekstu')}>{paket.cena}</Text> {period}</Text>
        {!!ispod && <Text variant="caption" className="mt-1">{ispod}</Text>}
      </View>
    </Pressable>
  );
}

function Veza({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} className="px-3 py-1 active:opacity-60">
      <Text variant="caption">{children}</Text>
    </Pressable>
  );
}

function Crta() {
  return <View className="h-3 w-px bg-fill-strong" />;
}
