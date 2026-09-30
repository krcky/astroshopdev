import * as React from 'react';

import { SheetScroll } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { TamnaTacka } from '@/components/planeta-ikona';
import { AspektiOdeljak, IKONA, Odeljak, Stavka } from '@/components/info-list';
import { POINTS, type PointKey } from '@/lib/points';

/**
 * "Šta je trenutno nebo" — list odozdo sa ikonice "i" pored tocka na Nebu
 * (Ivan, 29.9.2026), kao "Šta je natalna karta" na "Ti".
 *
 * Iz natalnog lista su preuzeti krug (prilagodjen: Ascendent se SADA dize) i
 * aspekti (isti odeljak, `info-list.tsx`). Dodato je sto postoji samo ovde:
 * slovo R i tri tacke. Elementi i vreme rodjenja nisu preuzeti — elementi
 * stoje na natalnom listu, a vremena rodjenja ovde nema.
 *
 * Tacke su opisane CINJENICAMA (sta su, kako se krecu, koja je konvencija),
 * bez tumacenja — tumacenje je glas astrologa, a za tacke ga jos nema.
 * Brojevi su iz `lib/points.ts` i CLAUDE.md, pravilo 16.
 */
export default function NeboInfo() {
  return (
    <SheetScroll>
      <Text variant="naslovLista">Šta je trenutno nebo?</Text>
      <Text variant="reading" className="mt-3">
        Nebo u ovom trenutku, gledano sa izabranog mesta: u kom su znaku sada Sunce, Mesec i
        planete i kako stoje jedni prema drugima. Položaj planeta je isti za sve, bilo gde da si.
        Od mesta zavise kuće, 12 delova kruga, i one se pomeraju iz minuta u minut.
      </Text>
      <Text variant="reading" className="mt-3">
        Strelicama pomeraš sat i dan, a dodirom na datum biraš bilo koji dan.
      </Text>

      <Odeljak naslov="Krug">
        <Text variant="reading">
          Spoljni prsten je 12 znakova. Brojevi od 1 do 12 su kuće, simboli su planete. Levo je
          Ascendent: znak koji se upravo diže na istoku. Gore je MC, najviša tačka neba u ovom
          trenutku. Obojene linije u sredini su aspekti, a sivi simboli su tačke.
        </Text>
        <Text variant="reading" className="mt-3">
          R pored planete znači da je retrogradna: gledano sa Zemlje, prividno ide unazad kroz
          zodijak.
        </Text>
      </Odeljak>

      <Odeljak naslov="Tačke">
        <Text variant="reading" className="mb-4">
          Čvor, Lilit i Tačka sreće nisu nebeska tela, nego tačke koje se računaju. Linije aspekata
          se za njih ne crtaju.
        </Text>
        {POINTS.map((t) => (
          <Stavka key={t.key} ime={t.name} ikona={<TamnaTacka tacka={t} size={IKONA} />}>
            {OPIS_TACKE[t.key]}
          </Stavka>
        ))}
      </Odeljak>

      <AspektiOdeljak />
    </SheetScroll>
  );
}

const OPIS_TACKE: Record<PointKey, string> = {
  northNode:
    'Mesto gde Mesečeva putanja preseca prividni put Sunca, idući ka severu. Ide unazad i jedan ' +
    'znak prođe za oko godinu i po dana, zato uz njega skoro uvek stoji R. Prikazan je pravi čvor, ' +
    'ne srednji.',
  lilith:
    'Zove se i Crni Mesec: tačka Mesečeve putanje najudaljenija od Zemlje. Ide napred i ceo ' +
    'zodijak obiđe za oko devet godina. Prikazana je srednja Lilit, jer prava zna da odstupi i ' +
    'do 30°.',
  fortune:
    'Ne vidi se na nebu, nego se računa iz Ascendenta, Sunca i Meseca. Zato ide brzo kao ' +
    'Ascendent i za dan obiđe ceo krug. Danju i noću se računa po drugačijoj formuli.',
};
