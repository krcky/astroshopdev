import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { brand } from '@/theme/tokens';
import { leaveSheetTo } from '@/components/sheet';
import { cn } from '@/lib/utils';

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
export function PremiumKartica({ naslov, opis, izLista = false, className }: {
  naslov: string;
  opis: string;
  izLista?: boolean;
  className?: string;
}) {
  return (
    <View className={cn(CARD_SURFACE, 'p-6', className)} style={{ borderColor: PREMIUM_OBOD }}>
      <View className="h-12 w-12 items-center justify-center self-center rounded-full" style={{ backgroundColor: PREMIUM_POVRSINA }}>
        <Lock size={20} color={PREMIUM} />
      </View>
      <Text variant="h3" className="mt-4 text-center">{naslov}</Text>
      <Text variant="muted" className="mt-2 text-center">{opis}</Text>
      <Button className="mt-5 w-full" onPress={() => otvoriPremium(izLista)}>
        <Text>Otključaj</Text>
      </Button>
    </View>
  );
}

/**
 * Zakljucani redovi u jednoj beloj kartici: ime (i sitno ispod) levo, katanac
 * desno. Pokazuje STA postoji, ne i sta pise — ime tranzita se ionako racuna
 * na telefonu. Ceo red vodi na `/premium`.
 */
export function ZakljucaniRedovi({ redovi, className }: {
  redovi: { key: string; naslov: string; ispod?: string }[];
  className?: string;
}) {
  if (redovi.length === 0) return null;
  return (
    <View className={cn(CARD_SURFACE, 'py-1', className)}>
      {redovi.map((r, i) => (
        <React.Fragment key={r.key}>
          {i > 0 && <View className="mx-4 h-px bg-border" />}
          <Pressable
            onPress={() => otvoriPremium()}
            accessibilityRole="button"
            accessibilityLabel={`${r.naslov}. Uz Premium`}
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
