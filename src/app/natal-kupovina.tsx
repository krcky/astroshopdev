import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { PREMIUM } from '@/components/zakljucano';
import { cn } from '@/lib/utils';
import { kupiNatalnuKartu, useCenaNatalneKarte, usePaketiPremium, vratiKupovine } from '@/lib/kupovina';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';

type Izbor = 'karta' | 'premium';

/**
 * Izbor kupovine natalne karte (Ivan, 13.10.2026; probna verzija 2 strane "Ti") — LIST odozdo sa
 * kartice "Otključaj zauvek" i sa svake zakljucane kartice: "Samo natalna karta" (JEDNOKRATNO, zauvek,
 * svoja i jos jedna karta) ili Premium (vodi na paywall `/premium`).
 *
 * KUPOVINA JOS NIJE UKLJUCENA (`lib/kupovina.ts`): dugme iskreno kaze da placanja nema, a cena je
 * probna i postoji samo u probnom buildu. Pravo pristupa ce upisivati samo server (pravilo 8).
 */
export default function NatalKupovinaList() {
  const t = useT();
  const tv = t.karta.v2;
  const tp = t.profil.premium;
  const cena = useCenaNatalneKarte();
  const godisnji = usePaketiPremium()?.find((p) => p.id === 'godisnje');
  const [izbor, setIzbor] = React.useState<Izbor>('karta');
  const [poruka, setPoruka] = React.useState<string | null>(null);
  const [radi, setRadi] = React.useState(false);

  const nastavi = async () => {
    if (izbor === 'premium') { leaveSheetTo('/premium'); return; }
    if (radi) return;
    setRadi(true);
    setPoruka(null);
    const ishod = await kupiNatalnuKartu();
    setRadi(false);
    if (ishod === 'nedostupno') setPoruka(tp.nijeUkljucena);
    else if (ishod === 'greska') setPoruka(tp.kupovinaNijeUspela);
    else if (ishod === 'ceka') setPoruka(tp.kupovinaCeka);
  };

  const vrati = async () => {
    setPoruka(null);
    const ishod = await vratiKupovine();
    if (ishod === 'nedostupno') setPoruka(tp.nijeUkljucena);
    else if (ishod === 'nema') setPoruka(tp.nemaPretplate);
    else if (ishod === 'greska') setPoruka(tp.proveraNijeUspela);
  };

  return (
    <SheetScroll siva>
      <View className="px-5 pb-2 pt-2">
        <Text variant="naslovLista" accessibilityRole="header">{tv.listNaslov}</Text>
        <Text variant="muted" className="mt-3">{tv.listOpis}</Text>

        <View className="mt-6 gap-3" accessibilityRole="radiogroup">
          <Opcija naslov={tv.samoKarta} ispod={tv.samoKartaIspod} cena={cena}
            izabrana={izbor === 'karta'} onPress={() => setIzbor('karta')} />
          <Opcija naslov={tv.premium} ispod={tv.premiumIspod} cena={godisnji?.cena ?? null}
            izabrana={izbor === 'premium'} onPress={() => setIzbor('premium')} />
        </View>

        <View className="mt-6 gap-2 px-1">
          {tv.stavke.map((s) => (
            <View key={s} className="flex-row items-center gap-3">
              <Check size={18} color={brand.indigo} strokeWidth={2.4} />
              <Text variant="default" className="flex-1">{s}</Text>
            </View>
          ))}
        </View>

        {!!poruka && <Text variant="muted" className="mt-6 text-center" accessibilityLiveRegion="polite">{poruka}</Text>}
        <Button className="mt-6" ucitava={radi} onPress={nastavi}>
          <Text>{izbor === 'karta' ? tv.kupiKartu : tv.pogledajPremium}</Text>
        </Button>
        <Text variant="caption" className="mt-3 text-center">{tv.napomena}</Text>
        <Pressable onPress={vrati} accessibilityRole="button" hitSlop={8}
          className="mt-1 min-h-[44px] items-center justify-center active:opacity-60">
          <Text variant="caption">{tp.vratiKupovine}</Text>
        </Pressable>
      </View>
    </SheetScroll>
  );
}

/** Jedan izbor: krug (izabran = indigo), naslov i sta se dobija, cena desno. */
function Opcija({ naslov, ispod, cena, izabrana, onPress }: {
  naslov: string;
  ispod: string;
  /** `null` = cena jos nije stigla iz prodavnice; ne prikazuje se nista. */
  cena: string | null;
  izabrana: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: izabrana }}
      className={cn(CARD_SURFACE, 'flex-row items-center gap-3 border-2 p-4 active:opacity-80')}
      style={{ borderColor: izabrana ? PREMIUM : 'transparent' }}>
      <View className="h-[22px] w-[22px] rounded-full"
        style={izabrana ? { borderWidth: 7, borderColor: PREMIUM } : { borderWidth: 1.5, borderColor: neutral.inkSubtle }} />
      <View className="flex-1">
        <Text variant="h3">{naslov}</Text>
        <Text variant="caption" className="mt-0.5">{ispod}</Text>
      </View>
      {!!cena && <Text variant="h3">{cena}</Text>}
    </Pressable>
  );
}
