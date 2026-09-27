import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { TvojDanCard } from '@/components/tvoj-dan-card';
import { MesecDanasCard } from '@/components/mesec-danas-card';
import { formatDate } from '@/lib/horoscope';
import { kartaSaAscendentom } from '@/lib/test-karta';
import { pickTvojDan } from '@/lib/tvoj-dan';
import { DEV_TOOLS_ENABLED } from '@/store/dev';

/** Koliko dana unapred se trazi dan sa tranzitom vladara. */
const TRAZI_DANA = 60;

/**
 * SAMO ZA RAZVOJ: kartice "Tvoj dan" i "Mesec danas" za test korisnika kome
 * je Ascendent u Ribama (vladar Jupiter), da se vidi oznaka vladara.
 * Karta i dan se RACUNAJU: prvi dan od danas kad "Tvoj dan" pada na tranzit
 * vladara. Otvara se direktno: /dev-kartice. U release bildu vodi na pocetak.
 *
 * Kartica se crta sa `isToday={false}`, pa ne upisuje nista u pravi dnevnik.
 * Tekstove salje server po RLS-u — bez prijave i pristupa ostaje samo racun.
 */
export default function DevKartice() {
  const podaci = React.useMemo(() => {
    const chart = kartaSaAscendentom('pisces');
    const danas = new Date();
    for (let o = 0; o < TRAZI_DANA; o++) {
      const d = new Date(danas.getFullYear(), danas.getMonth(), danas.getDate() + o, 12);
      const pick = pickTvojDan(chart, d, false);
      if (pick?.ruler) return { chart, date: d, pick };
    }
    return { chart, date: danas, pick: pickTvojDan(chart, danas, false) };
  }, []);

  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;
  const { chart, date, pick } = podaci;

  return (
    <Screen label="Pregled kartica" tabBarSpace={false} pushed>
      <Text variant="muted" className="pt-2">
        Test karta: Beograd, {chart.birth.date.toISOString().slice(0, 16).replace('T', ' ')} UT, Ascendent {chart.ascendantSign.formatted}.
        Dan: {formatDate(date)}.
      </Text>
      <View className="mt-4">
        {pick ? (
          <TvojDanCard pick={pick} date={date} isToday={false} chart={chart} />
        ) : (
          <Text variant="muted">Nema tranzita za taj dan.</Text>
        )}
      </View>
      <View className="mt-9">
        <Text variant="label" className="mb-3">Mesec danas</Text>
        <MesecDanasCard date={date} offset={0} chart={chart} timeUnknown={false} name="Test" excludeKey={pick?.contentKey ?? null} />
      </View>
    </Screen>
  );
}
