import * as React from 'react';

import { SheetScroll } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { IkonaTacke } from '@/components/planeta-ikona';
import { AspektiOdeljak, IKONA, Odeljak, Stavka } from '@/components/info-list';
import { POINTS } from '@/lib/points';
import { useT } from '@/i18n';

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
  const t = useT();
  const ti = t.karta.neboInfo;
  return (
    <SheetScroll>
      <Text variant="naslovLista">{ti.naslov}</Text>
      <Text variant="reading" className="mt-3">{ti.uvod}</Text>
      <Text variant="reading" className="mt-3">{ti.strelice}</Text>

      <Odeljak naslov={t.karta.info.krug}>
        <Text variant="reading">{ti.krug}</Text>
        <Text variant="reading" className="mt-3">{t.karta.info.retro}</Text>
      </Odeljak>

      <Odeljak naslov={ti.tacke}>
        <Text variant="reading" className="mb-4">{ti.tackeUvod}</Text>
        {POINTS.map((p) => (
          <Stavka key={p.key} ime={p.name} ikona={<IkonaTacke tacka={p} size={IKONA} />}>
            {ti.opisTacke[p.key]}
          </Stavka>
        ))}
      </Odeljak>

      <AspektiOdeljak />
    </SheetScroll>
  );
}
