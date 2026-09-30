import * as React from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { ScreenBackdrop } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Planeta } from '@/components/planete-par';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { ZnakIkona } from '@/components/znak-ikona';
import { PREMIUM as PREMIUM_GRANICE } from '@/lib/pristup';
import {
  cenaBezPopusta, cenaPoMesecu, kupiPremium, usePaketiPremium, ustedaGodisnje, vratiKupovine, type PaketPremium,
} from '@/lib/kupovina';
import { PRIVATNOST, USLOVI } from '@/lib/pravila';
import { dana } from '@/lib/mnozina';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { PREMIUM, PREMIUM_IZABRAN } from '@/components/zakljucano';
import { neutral } from '@/theme/tokens';

/** Prostor za rucicu i X iznad naslova. */
const RUCICA_PROSTOR = 44;
/** Sirina mesta za ilustraciju levo od teksta. */
const ILUSTRACIJA = 76;

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
function zatvoriList() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function Premium() {
  return <PaywallEkran />;
}

/**
 * Paywall. `uOnboardingu` (Ivan, 29.9.2026): poslednji korak onboardinga, posle
 * obavestenja (`(onboarding)/ponuda.tsx`) — CEO EKRAN, ne list: bez rucice, a X
 * i kupovina vode na kapiju (pravilo 11), ne nazad na obavestenja.
 */
export function PaywallEkran({ uOnboardingu = false }: { uOnboardingu?: boolean }) {
  const insets = useSafeAreaInsets();
  // Otvoren preko drugog ekrana = iOS list; utvrdjuje se jednom, pri otvaranju.
  const [kaoList] = React.useState(() => !uOnboardingu && Platform.OS === 'ios' && router.canGoBack());
  const zatvori = uOnboardingu ? () => router.replace('/') : zatvoriList;
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

  const telo = (
    <>
      {/* U onboardingu (ceo ekran, Ivan 30.9.2026): naslov GORE, odmah ispod X-a; visak
          visine ide IZMEDJU delova (vidi dole), ne iznad naslova. */}
      <View style={uOnboardingu ? { height: RUCICA_PROSTOR + 12 } : kaoList ? { height: RUCICA_PROSTOR } : { flexGrow: 1, minHeight: RUCICA_PROSTOR }} />
      <View className="px-5">

        <Text variant="naslovLista" className="text-center" accessibilityRole="header">
          Otvori sva tumačenja
        </Text>
        {/* Uze od ekrana, da se prelomi u dva ujednacena reda — ne jedna rec sama u drugom (Ivan, 29.9.2026). */}
        <Text variant="muted" className="mt-3 self-center text-center" style={{ maxWidth: 280 }}>
          Svi tvoji tranziti, teme perioda i pogled na sutra i prekosutra.
        </Text>

        <View className={uOnboardingu ? 'mt-10 gap-7' : 'mt-7 gap-5'}>
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
            // "Sledeća dva dana" vise nije stavka (Ivan, 29.9.2026) — samo deo ovog teksta.
            tekst="Svi tranziti dana sa celim tumačenjem — i za sutra i prekosutra."
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
          {/* Druge osobe (29.9.2026): besplatno jedna, uz Premium do `PREMIUM.osobe`. */}
          <Stavka
            slika={
              <View className="flex-row items-center">
                {/* Dva znaka ISTE velicine (Ivan, 29.9.2026), drugi preko prvog sa belim obodom. */}
                <View className="rounded-full bg-background p-0.5">
                  <ZnakIkona znak="libra" element="vazduh" size={36} />
                </View>
                <View className="-ml-3 rounded-full bg-background p-0.5">
                  <ZnakIkona znak="cancer" element="voda" size={36} />
                </View>
              </View>
            }
            naslov="Tvoji ljudi"
            tekst={`Karte i tranziti do ${PREMIUM_GRANICE.osobe} bliskih osoba.`}
          />
        </View>

      </View>

      {/* Izmedju stavki i paketa NAJVISE 32pt (Ivan, 29.9.2026: "preveliki razmak"); visak
          visine ide iznad naslova, pa ceo sadrzaj stoji zajedno, uz pakete i dugme na dnu. */}
      <View style={uOnboardingu ? { flexGrow: 1, minHeight: 32 } : kaoList ? { height: 32 } : { flexGrow: 1, minHeight: 20, maxHeight: 32 }} />

      <View className="px-5">
        {/* Paketi — samo kad je cena stigla iz prodavnice. */}
        {godisnji && mesecni ? (
          <View className="flex-row gap-3" accessibilityRole="radiogroup">
            <PaketKartica
              paket={godisnji}
              naslov="Godišnje"
              period="godišnje"
              ispod={`${cenaPoMesecu(godisnji.iznos, godisnji.valuta)} mesečno`}
              precrtano={cenaBezPopusta(godisnji.iznos, mesecni.iznos, godisnji.valuta)}
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
      <View className={uOnboardingu ? 'px-5 pt-6' : 'px-5 pt-5'}>
        {!!poruka && <Text variant="muted" className="mb-3 text-center" accessibilityLiveRegion="polite">{poruka}</Text>}
        <Button disabled={!paket} ucitava={radi} onPress={kupi}>
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
    </>
  );
  // X gore desno, MALI (Ivan, 29.9.2026: native stavka trake je bila prevelika) —
  // siv krug kao zatvaranje sistemskih listova, ne staklo. Dodir 44pt kroz `hitSlop`.
  const dugmeX = (
      <Pressable
        onPress={zatvori}
        accessibilityRole="button"
        accessibilityLabel="Zatvori"
        hitSlop={10}
        className="absolute right-4 h-[30px] w-[30px] items-center justify-center rounded-pill bg-fill active:opacity-60"
        style={{ top: (kaoList ? 0 : insets.top) + 14 }}>
        <X size={16} color={neutral.inkSubtle} strokeWidth={2.6} />
      </Pressable>
  );

  // KAO LIST (iOS, otvoren iz aplikacije — Ivan, 30.9.2026: "ne mora da bude 100%"):
  // `formSheet` sa visinom koja odgovara sadrzaju (`PAYWALL_LIST` u `_layout.tsx`). List
  // sadrzaju NE DAJE visinu, pa je KOREN SKROL (kao `SheetScroll`) — sa `flex-1` omotacem
  // ili skrolom bez visine list je bio prazan (izmereno). X je u sadrzaju, rucicu crta sistem.
  if (kaoList) {
    return (
      <ScrollView
        className="flex-1 bg-grouped"
        contentContainerStyle={{ paddingBottom: insets.bottom + 4 }}
        showsVerticalScrollIndicator={false}>
        {telo}
        {dugmeX}
      </ScrollView>
    );
  }

  return (
    // LIST PREKO CELOG EKRANA (Ivan, 29.9.2026: "povecaj na 100%", vise vazduha).
    // `modal` (ne `formSheet`, koji sadrzaju ne daje visinu): gore naslov i stavke,
    // dole paketi, dugme i pravila; visak visine ide IZMEDJU, da paketi ostanu uz
    // dugme. Na malom telefonu se sve skroluje. (Android i onboarding.)
    <View className="flex-1 bg-grouped" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 4 }}
        showsVerticalScrollIndicator={false}>
        {telo}
      </ScrollView>

      {/* Rucica: `modal` je nema sam (Ivan, 29.9.2026) — zatvara se i povlacenjem nadole.
          U onboardingu je ceo ekran, pa rucice nema; kao list je crta sistem. */}
      {!uOnboardingu && !kaoList && <View
        pointerEvents="none"
        className="absolute inset-x-0 items-center"
        style={{ top: (kaoList ? 0 : insets.top) + 6 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View className="h-[5px] w-9 rounded-pill bg-subtle opacity-50" />
      </View>}

      {/* Ljubicasti preliv na vrhu kao na svim koracima onboardinga (Ivan, 30.9.2026) —
          IZNAD sadrzaja i bez dodira (pravilo 17); X ide posle njega, da ostane iznad. */}
      {uOnboardingu && <ScreenBackdrop />}

      {dugmeX}
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
function PaketKartica({ paket, naslov, period, ispod, precrtano, oznaka, izabran, onPress }: {
  paket: PaketPremium;
  naslov: string;
  period: string;
  ispod?: string;
  /** Puna cena bez popusta, precrtana iznad prave (`cenaBezPopusta`). */
  precrtano?: string | null;
  oznaka?: string;
  izabran: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: izabran }}
      accessibilityLabel={[naslov, paket.probaDana ? `${dana(paket.probaDana)} besplatno` : null, `${paket.cena} ${period}`, precrtano ? `umesto ${precrtano}` : null, ispod, oznaka].filter(Boolean).join(', ')}
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
        {/* Cena podebljana (Ivan, 29.9.2026). Uz precrtanu punu cenu (Ivan, 30.9.2026): prvo
            prava, pa precrtana, u istom redu — BEZ reci "godišnje", da red uvek stane (naslov
            kartice to vec kaze, a recenica o obnavljanju ispod dugmeta nosi i period). */}
        <Text variant="default">
          <Text variant="default" className={tezina('naslovUTekstu')}>{paket.cena}</Text>
          {precrtano
            ? <>{' '}<Text variant="default" className="text-muted-foreground line-through">{precrtano}</Text></>
            : ` ${period}`}
        </Text>
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
