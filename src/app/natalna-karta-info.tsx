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
      <Text variant="naslovLista">Šta je natalna karta?</Text>
      <Text variant="reading" className="mt-3">
        Natalna karta je slika neba u trenutku tvog rođenja: gde su bili Sunce, Mesec i
        planete, u kojim znacima i u kojim kućama. Zato je svačija karta drugačija, kao
        nebeska lična karta.
      </Text>

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

      <Odeljak naslov="Kako se čita">
        <Stavka ime="Planete — šta" ikona={<IkonaTacke tacka={primer.planeta} size={IKONA} />}>
          Svaka planeta je jedna vrsta energije koja te pokreće.
        </Stavka>
        <Stavka ime="Znakovi — kako" ikona={<ZnakIkona znak={primer.znak.key} element={primer.znak.element} size={IKONA} />}>
          Znak pokazuje kako se ta energija izražava. Ista planeta u svakom od 12 znakova deluje drugačije.
        </Stavka>
        <Stavka ime="Kuće — gde" ikona={<KucaBroj kuca={primer.kuca} size={IKONA} />}>
          Krug je podeljen na 12 kuća, a svaka je jedna oblast života. Kuća pokazuje gde planeta deluje.
        </Stavka>
        <Stavka ime="Aspekti — kako se slažu" ikona={<AspektIkona aspekt={primer.aspekt} size={18} potez={PLANETA_POTEZ * IKONA} />}>
          Uglovi između planeta pokazuju da li im se energije dopunjuju ili sudaraju.
        </Stavka>
        {/* Krunica na planetama tranzita nigde nije bila objasnjena (UX recenzija 1.10.2026). */}
        <Stavka ime="Krunica — tvoj vladar" ikona={<Crown size={20} color={neutral.ink} strokeWidth={2} />}>
          Planeta sa krunicom vlada znakom tvog podznaka. Tranzit u kom ona učestvuje ima veću težinu.
        </Stavka>
      </Odeljak>

      <Odeljak naslov="Krug">
        <Text variant="reading">
          Spoljni prsten je 12 znakova, a boja kruga oko znaka je njegov element. Brojevi od 1 do 12
          su kuće, simboli su planete. Levo je Ascendent, odnosno podznak: znak koji se dizao na
          istoku u trenutku tvog rođenja. Gore je MC, najviša tačka neba u tom trenutku. Obojene linije u
          sredini su aspekti.
        </Text>
        {/* Isto kao u listu "Šta je trenutno nebo" — karta ima R, a ovde nije bilo objasnjeno. */}
        <Text variant="reading" className="mt-3">
          R pored planete znači da je retrogradna: gledano sa Zemlje, prividno ide unazad kroz
          zodijak.
        </Text>
      </Odeljak>

      <AspektiOdeljak />

      <Odeljak naslov="Elementi">
        <Text variant="reading">Svaki znak pripada jednom od četiri elementa.</Text>
        <View className="mt-4 gap-4">
          {ELEMENTI.map((e) => {
            const znaci = SIGNS.filter((s) => s.element === e.key);
            return (
              <View key={e.key} className="flex-row items-center gap-3" accessible
                accessibilityLabel={`${e.ime}: ${znaci.map((s) => s.name).join(', ')}`}>
                <ElementIkona element={e.key} size={36} />
                <View className="flex-1">
                  <Text variant="row">{e.ime}</Text>
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

      <Odeljak naslov="Vreme rođenja">
        <Text variant="reading">
          Podznak i kuće zavise od tačnog vremena rođenja. Za sat vremena Zemlja se okrene toliko da
          se podznak pomeri za pola znaka. Kad vreme rođenja nije uneto, krug nema kuća, Ascendenta
          ni MC-a, a levo je Ovan, prvi znak zodijaka.
        </Text>
      </Odeljak>
    </SheetScroll>
  );
}

const ELEMENTI: { key: Element; ime: string }[] = [
  { key: 'vatra', ime: 'Vatra' },
  { key: 'zemlja', ime: 'Zemlja' },
  { key: 'vazduh', ime: 'Vazduh' },
  { key: 'voda', ime: 'Voda' },
];

/** Sirina / visina ilustracije (1774 x 1520). */
const ILUSTRACIJA_ODNOS = 1774 / 1520;

/** Deset planeta za primer (crne ikonice iz `planeta-ikona.tsx`). */
const PLANETE = BODIES.map((b) => ({ key: b.key, glyph: b.glyph }));

function nasumicno<T>(niz: readonly T[]): T {
  return niz[Math.floor(Math.random() * niz.length)];
}
