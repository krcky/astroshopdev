import * as React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { Redirect, router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { ZnakIkona } from '@/components/znak-ikona';
import { useAuthStore } from '@/store/auth';
import { useDraft } from '@/store/draft';
import { completeSignup, routeAfterSignup } from '@/lib/signup';
import { placeFields, resolveProfile } from '@/store/profile';
import { traitsForSign } from '@/lib/traits';
import { signRulers } from '@/lib/rulers';
import type { ZodiacSign } from '@/lib/zodiac';

/** Ilustracije planeta — iste kao na karticama tranzita (`assets/images/planete/`). */
const PLANETA: Record<string, ImageSourcePropType> = {
  sun: require('../../../assets/images/planete/sun.png'),
  moon: require('../../../assets/images/planete/moon.png'),
  mercury: require('../../../assets/images/planete/mercury.png'),
  venus: require('../../../assets/images/planete/venus.png'),
  mars: require('../../../assets/images/planete/mars.png'),
  jupiter: require('../../../assets/images/planete/jupiter.png'),
  saturn: require('../../../assets/images/planete/saturn.png'),
};

export default function Reveal() {
  const draft = useDraft();
  const user = useAuthStore((s) => s.user);
  const [cuva, setCuva] = React.useState(false);
  const [greska, setGreska] = React.useState(false);

  // VEC PRIJAVLJEN (Ivan, 30.9.2026): nalog bez karte — npr. "Već imam nalog" sa emailom koji
  // jos nema kartu. Karta ide pravo na taj nalog i tok ide dalje (ime, prica...); do tada ga je
  // "Nastavi" slao na email, pa je email trazen dvaput. Bez naloga: "Napravi nalog" kao i uvek.
  const nastavi = async () => {
    if (!user) {
      router.push({ pathname: '/account', params: { nov: '1' } });
      return;
    }
    if (cuva) return;
    setCuva(true);
    setGreska(false);
    // Upis se ponavlja do 3 puta, kao posle koda (`code.tsx`): sveze osvezen token baza ume
    // sekund-dva da odbije (`PGRST303 JWT issued at future`, sat Auth-a je ispred baze) —
    // videno na telefonu 30.9.2026: prvi "Nastavi" je pao, drugi prosao.
    let ishod: Awaited<ReturnType<typeof completeSignup>> | null = null;
    for (let i = 0; i < 3 && ishod === null; i++) {
      try {
        ishod = await completeSignup(user.id, user.email ?? '');
      } catch (e) {
        if (__DEV__) console.log(`[reveal] upis karte pao, pokusaj ${i + 1}/3:`, (e as { code?: string })?.code, (e as Error)?.message);
        if (i < 2) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
    setCuva(false);
    if (ishod === null) { setGreska(true); return; }
    router.replace(routeAfterSignup(ishod));
  };

  const resolved = React.useMemo(() => {
    if (!draft.date || !draft.city) return null;
    return resolveProfile({
      name: '',
      birth: draft.date,
      time: draft.time,
      ...placeFields(draft.city),
    });
  }, [draft.date, draft.time, draft.city]);

  // Ako je draft izgubljen (npr. ponovo ucitana aplikacija), pocinje se ispocetka.
  if (!resolved) return <Redirect href="/welcome" />;

  // Bolje zaustaviti ovde nego pustiti korisnika da napravi nalog sa kartom
  // koju ne umemo da izracunamo.
  if (resolved.zoneUnreliable) {
    return (
      <OnboardingStep
        exit={{ kind: 'back', onPress: () => router.back() }}
        question="Ne možemo da izračunamo kartu"
        note={`Ne znamo pouzdano koliko je sati bilo po UTC-u u mestu ${resolved.city.name} na taj datum. Probaj drugo mesto rođenja, ili nam javi — zona: ${resolved.city.tz.name}`}
        primary={{ label: 'Nazad na mesto rođenja', onPress: () => router.back() }}
      />
    );
  }

  const sun = resolved.chart.planets.find((p) => p.key === 'sun')!;
  const moon = resolved.chart.planets.find((p) => p.key === 'moon')!;
  const asc = resolved.chart.ascendantSign.sign;
  const traits = traitsForSign(sun.position.sign.key);
  // Vladajuca planeta (Ivan, 29.9.2026): TRADICIONALNI vladar Ascendenta, isto kao
  // "vladar" svuda u aplikaciji (`lib/rulers.ts`). Bez vremena rodjenja Ascendenta
  // nema (pravilo 5) — tada vladar SUNCEVOG znaka, i natpis to kaze.
  const vladarZnaka = resolved.timeUnknown ? sun.position.sign : asc;
  const vladar = resolved.chart.planets.find((p) => p.key === signRulers(vladarZnaka.key, 'traditional')[0])!;

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      note={greska
        ? 'Karta nije sačuvana — nismo uspeli da stignemo do servera. Proveri internet pa pritisni Nastavi ponovo.'
        : 'Pozicije računamo iz podataka o kretanju planeta, za tvoj tačan trenutak i mesto rođenja.'}
      primary={{ label: 'Nastavi', onPress: nastavi, ucitava: cuva, disabled: cuva }}>

      <View className="items-center">
        <Image source={PLANETA[vladar.key]} style={{ width: 200, height: 200 }}
          resizeMode="contain" accessibilityLabel={`Vladajuća planeta: ${vladar.name}`} />
        <Text variant="muted" className="mt-3 text-center">
          {resolved.timeUnknown ? 'Vladar tvog znaka' : 'Vladar tvoje karte'}: {vladar.name}
        </Text>

        {/* Velika trojka kroz nase ikonice znakova (Ivan, 29.9.2026; ranije ☉ ☽ ↑). */}
        <View className="mt-8 w-full flex-row justify-center gap-8">
          <Placement uloga="Sunce" znak={sun.position.sign} />
          <Placement uloga="Mesec" znak={moon.position.sign} />
          <Placement uloga="Podznak" znak={resolved.timeUnknown ? null : asc} />
        </View>

        <View className="mt-10 items-center">
          {traits.map((t) => (
            <Text key={t} variant="display" className="py-1 text-center text-3xl">{t}</Text>
          ))}
        </View>

        {resolved.timeUnknown && (
          <Text variant="muted" className="mt-8 px-4 text-center text-xs">
            Bez vremena rođenja ascendent se ne može izračunati. Dopunićeš ga kasnije u profilu.
          </Text>
        )}
      </View>
    </OnboardingStep>
  );
}

/** Znak (nasa ikonica), ime znaka, ispod sitno cije je (Sunce / Mesec / Podznak). */
function Placement({ uloga, znak }: { uloga: string; znak: ZodiacSign | null }) {
  return (
    <View className="items-center" accessible accessibilityLabel={`${uloga}: ${znak ? znak.name : 'nepoznat'}`}>
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
