import * as React from 'react';
import { Image, useWindowDimensions, View } from 'react-native';

import { Crown } from 'lucide-react-native';

import { SheetScroll } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { AspektIkona, imaAspekt, type AspektKljuc } from '@/components/aspekt-ikona';
import { PLANETA_POTEZ, IkonaTacke } from '@/components/planeta-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { ElementIkona } from '@/components/element-ikona';
import { ZnakIkona } from '@/components/znak-ikona';
import { AspektiOdeljak, IKONA, Odeljak, Stavka } from '@/components/info-list';
import { ASPECTS, BODIES } from '@/lib/astro';
import { SIGNS, type Element } from '@/lib/zodiac';
import { neutral } from '@/theme/tokens';
import { useT } from '@/i18n';

/**
 * "Šta je natalna karta" — list odozdo sa ikonice "i" pored tocka na tabu "Ti"
 * (Ivan, 28.9.2026). Sazetak strane astroshop.rs/natalna-karta, prepisan na
 * "ti" i bez "sudbine" (aplikacija tumaci, ne prorice), plus legenda aspekata
 * i elementi. Legenda ispod tocka je zato uklonjena.
 *
 * Aspekti: zajednicki odeljak sa listom "Šta je trenutno nebo"
 * (`components/info-list.tsx`). Elementi: samo znakovi (Ivan) — opisa
 * elementa od astrologa nema, pa ga nema ni ovde.
 */
export default function NatalnaKartaInfo() {
  const t = useT();
  const ti = t.karta.natalnaInfo;
  // Sirina teksta na listu: ekran minus bokovi `SheetScroll`-a (24 + 24).
  const sirina = useWindowDimensions().width - 48;
  // Po jedan nasumican primer uz svaku kategoriju (Ivan, 28.9.2026); bira se
  // jednom po otvaranju lista, da se ne menja dok se skroluje.
  const [primer] = React.useState(() => ({
    planeta: nasumicno(PLANETE),
    znak: nasumicno(SIGNS),
    kuca: 1 + Math.floor(Math.random() * 12),
    aspekt: nasumicno(ASPECTS.filter((a) => imaAspekt(a.key))).key as AspektKljuc,
  }));
  return (
    <SheetScroll>
      {/* Naslov lista `naslovLista`, podnaslovi sekcija `h2` (Ivan, 28.9.2026). */}
      <Text variant="naslovLista">{ti.naslov}</Text>
      <Text variant="reading" className="mt-3">{ti.uvod}</Text>

      {/* Ilustracija (Ivan, 28.9.2026; izvor `files/natalna-karta-ilustracija-objasnjenje@2x`),
          sirine teksta, pre "Kako se čita". Pozadina je vec providna. */}
      <Image
        source={require('../../assets/images/natalna-karta-objasnjenje.png')}
        // Mere iz sirine ekrana: `width: '100%'` + `aspectRatio` na webu zadrzi prirodnu visinu slike (1520).
        style={{ width: sirina, height: sirina / ILUSTRACIJA_ODNOS, marginTop: 24 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
      />

      <Odeljak naslov={ti.kakoSeCita}>
        <Stavka ime={ti.planete} ikona={<IkonaTacke tacka={primer.planeta} size={IKONA} />}>
          {ti.planeteOpis}
        </Stavka>
        <Stavka ime={ti.znakovi} ikona={<ZnakIkona znak={primer.znak.key} element={primer.znak.element} size={IKONA} />}>
          {ti.znakoviOpis}
        </Stavka>
        <Stavka ime={ti.kuce} ikona={<KucaBroj kuca={primer.kuca} size={IKONA} />}>
          {ti.kuceOpis}
        </Stavka>
        <Stavka ime={ti.aspekti} ikona={<AspektIkona aspekt={primer.aspekt} size={18} potez={PLANETA_POTEZ * IKONA} />}>
          {ti.aspektiOpis}
        </Stavka>
        {/* Krunica na planetama tranzita nigde nije bila objasnjena (UX recenzija 1.10.2026). */}
        <Stavka ime={ti.krunica} ikona={<Crown size={20} color={neutral.ink} strokeWidth={2} />}>
          {ti.krunicaOpis}
        </Stavka>
      </Odeljak>

      <Odeljak naslov={t.karta.info.krug}>
        <Text variant="reading">{ti.krug}</Text>
        {/* Isto kao u listu "Šta je trenutno nebo" — karta ima R, a ovde nije bilo objasnjeno. */}
        <Text variant="reading" className="mt-3">{t.karta.info.retro}</Text>
      </Odeljak>

      <AspektiOdeljak />

      <Odeljak naslov={ti.elementi}>
        <Text variant="reading">{ti.elementiUvod}</Text>
        <View className="mt-4 gap-4">
          {ELEMENTI.map((e) => {
            const znaci = SIGNS.filter((s) => s.element === e);
            return (
              <View key={e} className="flex-row items-center gap-3" accessible
                accessibilityLabel={ti.elementA11y(t.karta.elementi[e], znaci.map((s) => s.name))}>
                <ElementIkona element={e} size={36} />
                <View className="flex-1">
                  <Text variant="row">{t.karta.elementi[e]}</Text>
                  <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
                    {znaci.map((s) => (
                      <View key={s.key} className="flex-row items-center gap-1">
                        <ZnakIkona znak={s.key} element={s.element} size={16} />
                        <Text variant="muted">{s.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Odeljak>

      <Odeljak naslov={ti.vremeRodjenja}>
        <Text variant="reading">{ti.vremeRodjenjaOpis}</Text>
      </Odeljak>
    </SheetScroll>
  );
}

/** Redosled elemenata; imena su u recniku (`karta.elementi`). */
const ELEMENTI: Element[] = ['vatra', 'zemlja', 'vazduh', 'voda'];

/** Sirina / visina ilustracije (1774 x 1520). */
const ILUSTRACIJA_ODNOS = 1774 / 1520;

/** Deset planeta za primer (crne ikonice iz `planeta-ikona.tsx`). */
const PLANETE = BODIES.map((b) => ({ key: b.key, glyph: b.glyph }));

function nasumicno<T>(niz: readonly T[]): T {
  return niz[Math.floor(Math.random() * niz.length)];
}
