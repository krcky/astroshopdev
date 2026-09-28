import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { TranzitiLista } from '@/components/tranziti-lista';
import { OceneOblasti } from '@/components/ocena-oblasti';
import { primerZaOblasti } from '@/lib/test-karta';
import { useOblastiDana } from '@/lib/use-oblasti';
import { DEV_TOOLS_ENABLED } from '@/store/dev';

/**
 * SAMO ZA RAZVOJ: tab "Tranziti" (Premium) za test korisnika sa poznatim
 * vremenom rodjenja, i ispod njega ocene oblasti sa pocetne za isti dan. Karta
 * i dan se RACUNAJU (`primerZaOblasti`): prvi dan od danas kad svaka oblast ima
 * bar jedan tranzit, a bar jedan tranzit nije ni u jednoj. Na dnu su tranziti
 * bez naslova tumacenja — za proveru korpusa.
 * Otvara se direktno: /dev-tranziti. U release bildu vodi na pocetak.
 */
export default function DevTranziti() {
  const primer = React.useMemo(() => primerZaOblasti(new Date()), []);
  const profil = React.useMemo(() => (primer ? { chart: primer.chart, timeUnknown: false } : null), [primer]);
  const rez = useOblastiDana(profil, primer?.date ?? new Date());
  const [zaProveru, setZaProveru] = React.useState<string[]>([]);

  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;

  return (
    <Screen label="Pregled tranzita" tabBarSpace={false} pushed>
      {primer ? (
        <Text variant="muted" className="pt-2">
          Test karta: Beograd, {primer.chart.birth.date.toISOString().slice(0, 16).replace('T', ' ')} UT,
          Ascendent {primer.chart.ascendantSign.formatted}.
        </Text>
      ) : (
        <Text variant="muted" className="pt-2">Nema dana sa tranzitom u svakoj oblasti u narednih 30 dana.</Text>
      )}
      {rez && primer && <TranzitiLista rez={rez} date={primer.date} onZaProveru={setZaProveru} />}
      {rez && (
        <View className="mt-8">
          <Text variant="label" className="mb-2">Ocene oblasti (slajd „Danas ukratko“)</Text>
          <OceneOblasti rez={rez} />
        </View>
      )}
      {zaProveru.length > 0 && (
        <View className="mt-8">
          <Text variant="label" className="mb-2">Bez naslova tumačenja — za proveru</Text>
          {zaProveru.map((k) => <Text key={k} variant="muted">{k}</Text>)}
        </View>
      )}
    </Screen>
  );
}
