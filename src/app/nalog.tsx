import * as React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SheetGrabber, dnoLista } from '@/components/sheet';
import { deleteAccount, useAuthStore } from '@/store/auth';
import { datum } from '@/lib/horoscope';

/** Kako se korisnik prijavljuje — `app_metadata.provider` iz Supabase-a. */
const NACIN: Record<string, string> = {
  email: 'Kod na email',
  apple: 'Apple nalog',
  google: 'Google nalog',
};

/**
 * NALOG — list sa profila (Ivan, 29.9.2026). Ovde je BRISANJE NALOGA, jedan korak
 * dalje od profila: Apple trazi da postoji u aplikaciji (5.1.1(v)), a Ivan da ne
 * stoji na dohvat palca. I dalje dva koraka — dugme pa potvrda.
 */
export default function NalogSheet() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [brise, setBrise] = React.useState(false);

  const provider = user?.app_metadata?.provider as string | undefined;
  const od = user?.created_at ? datum(new Date(user.created_at), { godina: true }) : null;

  // Brisanje je nepovratno i brise podatke o rodjenju koje je korisnik unosio
  // kroz ceo onboarding — jedan pogresan dodir ne sme da ih odnese.
  const obrisi = () => {
    Alert.alert(
      'Obrisati nalog?',
      'Briše se nalog, ime, slika i svi podaci o rođenju. Ovo se ne može poništiti.\n\n' +
        'Pretplata se ovim NE otkazuje — nju otkazuješ u podešavanjima Apple ili Google naloga.',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši nalog',
          style: 'destructive',
          onPress: async () => {
            setBrise(true);
            const { error } = await deleteAccount();
            setBrise(false);
            if (error) {
              Alert.alert('Nije uspelo', 'Nalog nije obrisan. Proveri internet pa probaj ponovo.');
              return;
            }
            router.dismissAll();
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      <Text variant="naslovLista">Nalog</Text>

      <View className="mt-5 gap-4">
        <Podatak naziv="Email" vrednost={user?.email ?? '—'} />
        {!!provider && <Podatak naziv="Prijava" vrednost={NACIN[provider] ?? provider} />}
        {!!od && <Podatak naziv="Nalog od" vrednost={od} />}
      </View>

      <View className="mt-8 h-px bg-border" />
      <Text variant="h3" className="mt-6">Brisanje naloga</Text>
      <Text variant="body" className="mt-2">
        Trajno briše nalog, podatke o rođenju, sliku i pitanja astrologu. Pretplata se ne otkazuje sama.
      </Text>
      <Button variant="outline" className="mt-5" ucitava={brise} onPress={obrisi}>
        <Text className="text-destructive">Obriši nalog</Text>
      </Button>
    </View>
  );
}

function Podatak({ naziv, vrednost }: { naziv: string; vrednost: string }) {
  return (
    <View>
      <Text variant="caption">{naziv}</Text>
      <Text variant="row" className="mt-0.5" numberOfLines={1}>{vrednost}</Text>
    </View>
  );
}
