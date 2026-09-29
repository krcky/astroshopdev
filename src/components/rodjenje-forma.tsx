import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { cn } from '@/lib/utils';
import type { City } from '@/lib/cities';
import { useCitySearch } from '@/lib/city-search';
import { gradProfila, placeFields, type Profile } from '@/store/profile';

/**
 * Podaci o rodjenju na JEDNOM ekranu (pravilo 10) — izmena svojih (`/edit`) i
 * unos druge osobe (`/osoba-uredi`, 29.9.2026). Isti oblik polja, pa i ista
 * pravila: bez vremena nema ascendenta ni kuca (pravilo 5), grad nosi
 * koordinate i zonu (pravilo 4).
 */
export type RodjenjeUnos = {
  ime: string;
  /** Kalendarski dan; sat je podne, da pomeranje zone ne promeni datum. */
  datum: Date;
  vreme: Date;
  vremePoznato: boolean;
  grad: City | null;
};

/** Pocetno stanje forme: iz postojecih podataka, ili prazno (1.1.2000, podne). */
export function pocetniUnos(p: Profile | null): RodjenjeUnos {
  const vreme = new Date(2000, 0, 1, 12, 0);
  if (p?.time) { vreme.setHours(p.time.hour); vreme.setMinutes(p.time.minute); }
  return {
    ime: p?.name ?? '',
    datum: p ? new Date(p.birth.year, p.birth.month - 1, p.birth.day, 12) : new Date(2000, 0, 1, 12),
    vreme,
    vremePoznato: Boolean(p?.time),
    // Grad iz SACUVANIH koordinata — grad dijaspore nije u ugradjenoj listi,
    // pa bi pretraga po id-u vratila nista i korisnik bi morao ponovo da ga bira.
    grad: p ? gradProfila(p) : null,
  };
}

/** Unos -> polja profila; null dok ime ili grad fale. */
export function profilIzUnosa(u: RodjenjeUnos): Profile | null {
  if (!u.ime.trim() || !u.grad) return null;
  return {
    name: u.ime.trim(),
    birth: { year: u.datum.getFullYear(), month: u.datum.getMonth() + 1, day: u.datum.getDate() },
    time: u.vremePoznato ? { hour: u.vreme.getHours(), minute: u.vreme.getMinutes() } : null,
    ...placeFields(u.grad),
  };
}

export function RodjenjeForma({ unos, onChange, imePlaceholder, posleImena }: {
  unos: RodjenjeUnos;
  onChange: (u: RodjenjeUnos) => void;
  imePlaceholder: string;
  /** Sekcija izmedju imena i datuma ("Ko ti je" kod druge osobe). */
  posleImena?: React.ReactNode;
}) {
  const [upit, setUpit] = React.useState('');
  const { results: gradovi, loading: trazi } = useCitySearch(unos.grad ? '' : upit, 6);
  const menjaj = (d: Partial<RodjenjeUnos>) => onChange({ ...unos, ...d });

  return (
    <>
      <Sekcija naslov="Ime">
        <Input
          value={unos.ime}
          onChangeText={(ime) => menjaj({ ime })}
          placeholder={imePlaceholder}
          autoCapitalize="words"
          maxLength={60}
        />
      </Sekcija>

      {posleImena}

      <Sekcija naslov="Datum">
        <WheelPicker mode="date" value={unos.datum} onChange={(datum) => menjaj({ datum })} maximumDate={new Date()} />
      </Sekcija>

      <Sekcija naslov="Vreme">
        {unos.vremePoznato ? (
          <WheelPicker mode="time" value={unos.vreme} onChange={(vreme) => menjaj({ vreme })} />
        ) : (
          <Text variant="muted" className="py-4 text-center">
            Vreme nije uneto — ascendent i kuće nisu pouzdani.
          </Text>
        )}
        <Pressable
          onPress={() => menjaj({ vremePoznato: !unos.vremePoznato })}
          accessibilityRole="button"
          className="mt-2 items-center py-2 active:opacity-60">
          <Text variant="label" className="text-foreground underline">
            {unos.vremePoznato ? 'Ne znam vreme' : 'Znam vreme, hoću da ga unesem'}
          </Text>
        </Pressable>
      </Sekcija>

      <Sekcija naslov="Mesto">
        <Input
          value={unos.grad ? (unos.grad.country ? `${unos.grad.name}, ${unos.grad.country}` : unos.grad.name) : upit}
          onChangeText={(t) => { setUpit(t); menjaj({ grad: null }); }}
          placeholder="Grad"
          autoCorrect={false}
        />
        {!unos.grad && (
          <View className="mt-3">
            {gradovi.map((c) => (
              <Pressable
                key={`${c.name}-${c.country}`}
                onPress={() => { menjaj({ grad: c }); setUpit(''); }}
                className="flex-row items-center justify-between border-b border-border py-3 active:opacity-60">
                <Text className="text-base">{c.name}</Text>
                <Text variant="muted">{c.country}</Text>
              </Pressable>
            ))}
            {trazi && (
              <Text variant="muted" className="py-3 text-center text-sm">Tražim dalje…</Text>
            )}
          </View>
        )}
      </Sekcija>
    </>
  );
}

export function Sekcija({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <View className="mt-7">
      <Text variant="label" className="mb-3">{naslov}</Text>
      {/* Sadrzaj sekcije ide na BELU karticu. Na sivoj pozadini podvlaka polja
          (#F0F0F0) skoro nestane — razlika prema #F6F7F8 je sest nivoa. */}
      <View className={cn(CARD_SURFACE, 'px-4 py-4')}>{children}</View>
    </View>
  );
}
