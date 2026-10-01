import * as React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { Kvacica } from '@/components/ui/kvacica';
import { ZnakIkona } from '@/components/znak-ikona';
import { otvoriPremium } from '@/components/zakljucano';
import { dodajOsobu } from '@/lib/osobe-api';
import { nazivOdnosa, porukaOsobe } from '@/lib/osobe';
import { datumRodjenja } from '@/lib/horoscope';
import { useNaMrezi } from '@/lib/mreza';
import { ASTROLOG } from '@/lib/pitanja';
import type { ZodiacSign } from '@/lib/zodiac';
import { useAuthStore } from '@/store/auth';
import { useNovaOsoba } from '@/store/nova-osoba';
import { placeFields, resolveProfile } from '@/store/profile';

const dvo = (n: number) => String(n).padStart(2, '0');

/**
 * Nova osoba, poslednji korak: velika trojka te osobe (kao "reveal" u
 * onboardingu), pristanak, pa "Dodaj osobu".
 *
 * Tek ovde ide na server (`dodajOsobu`): baza proverava granicu (1 besplatno,
 * 10 uz Premium) i daje id. Posle toga ceo tok ustupa mesto strani osobe.
 *
 * PRISTANAK: korisnik potvrdi da osoba zna da unosi njene podatke, a za dete da
 * je roditelj ili staratelj. Konacan tekst ide pravniku uz politiku privatnosti.
 */
export default function NovaOsobaPregled() {
  const t = useT();
  const tn = t.profil.novaOsoba;
  const nacrt = useNovaOsoba();
  const uid = useAuthStore((s) => s.user?.id);
  const naMrezi = useNaMrezi();
  const [pristanak, setPristanak] = React.useState(false);
  const [radi, setRadi] = React.useState(false);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  const profil = React.useMemo(() => (nacrt.datum && nacrt.grad ? {
    name: nacrt.ime,
    birth: nacrt.datum,
    time: nacrt.vreme,
    ...placeFields(nacrt.grad),
  } : null), [nacrt.ime, nacrt.datum, nacrt.vreme, nacrt.grad]);
  const resolved = React.useMemo(() => resolveProfile(profil), [profil]);

  if (!profil || !resolved) return <Redirect href="/nova-osoba" />;

  // Kao onboarding: karta koja ne moze pouzdano da se izracuna se ne cuva (pravilo 4).
  if (resolved.zoneUnreliable) {
    return (
      <OnboardingStep
        exit={{ kind: 'back', onPress: () => router.back() }}
        question={tn.neMozemoKartu}
        note={tn.neMozemoKartuTekst(resolved.city.name, resolved.city.tz.name)}
        primary={{ label: tn.nazadNaMesto, onPress: () => router.back() }}
      />
    );
  }

  const sunce = resolved.chart.planets.find((p) => p.key === 'sun')!.position.sign;
  const mesec = resolved.chart.planets.find((p) => p.key === 'moon')!.position.sign;
  const podznak = resolved.timeUnknown ? null : resolved.chart.ascendantSign.sign;
  const odnos = nazivOdnosa(nacrt.odnos);
  const rodjenje = [
    profil.time
      ? tn.datumUVreme(datumRodjenja(profil.birth), `${dvo(profil.time.hour)}:${dvo(profil.time.minute)}`)
      : datumRodjenja(profil.birth),
    profil.cityName,
  ].join(' · ');

  const dodaj = async () => {
    if (!uid || radi) return;
    setRadi(true);
    setPoruka(null);
    try {
      const nova = await dodajOsobu(uid, { ...profil, odnos: nacrt.odnos });
      // Ceo tok ustupa mesto strani osobe; nazad sa nje vodi na "Ti". Nacrt se NE
      // brise ovde — prazan bi ovaj korak preusmerio na pocetak toka usred prelaza;
      // brise se pri sledecem ulasku u tok (`TvojiLjudi`).
      router.replace({ pathname: '/osoba', params: { id: nova.id } });
    } catch (e) {
      const m = (e as Error)?.message ?? '';
      setPoruka(porukaOsobe(m));
      setRadi(false);
      // Granica je na serveru (npr. Premium istekao dok je tok bio otvoren).
      if (/granica_osoba/.test(m)) otvoriPremium();
    }
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      title={nacrt.ime}
      subtitle={odnos ? `${odnos} · ${rodjenje}` : rodjenje}
      note={poruka ?? (naMrezi
        ? tn.vidisSamoTi(ASTROLOG.kratko)
        : tn.trebaInternet)}
      primary={{ label: tn.dodajOsobu, onPress: dodaj, disabled: !pristanak || !naMrezi || !uid, ucitava: radi }}>
      <View className="items-center">
        {/* Velika trojka, kao na kraju onboardinga. */}
        <View className="w-full flex-row justify-center gap-8">
          <Placement uloga={tn.sunce} znak={sunce} />
          <Placement uloga={tn.mesec} znak={mesec} />
          <Placement uloga={tn.podznak} znak={podznak} />
        </View>
        {resolved.timeUnknown && (
          <Text variant="muted" className="mt-6 px-4 text-center text-xs">
            {tn.bezVremena}
          </Text>
        )}
      </View>
      <Kvacica ukljuceno={pristanak} onPromena={setPristanak} className="mt-10">
        {tn.pristanak}
      </Kvacica>
    </OnboardingStep>
  );
}

/** Znak, ime znaka, ispod sitno cije je — isto kao na kraju onboardinga (`reveal.tsx`). */
function Placement({ uloga, znak }: { uloga: string; znak: ZodiacSign | null }) {
  const t = useT();
  return (
    <View className="items-center" accessible accessibilityLabel={t.profil.novaOsoba.ulogaZnak(uloga, znak ? znak.name : null)}>
      {znak ? (
        <ZnakIkona znak={znak.key} element={znak.element} size={40} />
      ) : (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-fill-strong">
          <Text variant="caption" className="text-foreground">?</Text>
        </View>
      )}
      <Text variant="row" className={znak ? 'mt-2' : 'mt-2 text-muted-foreground'}>{znak ? znak.name : '—'}</Text>
      <Text variant="oznaka" className="mt-0.5">{uloga}</Text>
    </View>
  );
}
