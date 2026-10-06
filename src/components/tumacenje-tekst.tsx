import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { blokovi, prvaRecenica } from '@/lib/tumacenje';
import { tezina } from '@/theme/tipografija';
import { cn } from '@/lib/utils';

/**
 * Pasusi i liste teksta astrologa (duga verzija tranzita, lunarni kalendar).
 * Stavka je "• Naslov – tekst": naslov do prve crte podebljan u svom redu,
 * tekst ispod (Ivan, 27. i 28.9.2026). Oblik pravi izvoz korpusa, a deli ga
 * `lib/tumacenje.ts`.
 */
export function TumacenjeTekst({ tekst, listePrvo = false, uvod = false }: {
  tekst: string;
  /** Stavke (•) pre pasusa — saveti lunarnog kalendara (Ivan, 29.9.2026; od 1.10.2026 vise ne, vidi `uvod`). */
  listePrvo?: boolean;
  /**
   * Redosled kao duga verzija tranzita (Ivan, 1.10.2026): prva recenica PRVOG pasusa veca i
   * crna (`UvodRecenica`), ostatak tog pasusa siv, pa stavke, pa ostali pasusi.
   * Recenica duza od `UVOD_MAX` ostaje u pasusu (`prvaRecenica`).
   */
  uvod?: boolean;
}) {
  const b0 = blokovi(tekst);
  if (uvod) {
    const i = b0.findIndex((b) => b.vrsta === 'pasus');
    const prvi = i >= 0 ? b0[i] : null;
    const deo = prvi && prvi.vrsta === 'pasus' ? prvaRecenica(prvi.tekst) : null;
    const ostali = b0.filter((_, j) => j !== i);
    return (
      <View className="gap-3">
        {deo && <UvodRecenica>{deo.recenica}</UvodRecenica>}
        {prvi && prvi.vrsta === 'pasus' && (deo ? !!deo.ostatak : true) && (
          <Text variant="reading">{deo ? deo.ostatak : prvi.tekst}</Text>
        )}
        <TumacenjeTekst tekst={[...ostali.filter((b) => b.vrsta !== 'pasus'), ...ostali.filter((b) => b.vrsta === 'pasus')]
          .map((b) => (b.vrsta === 'pasus' ? b.tekst : b.stavke.map((s) => `• ${s.naslov ? `${s.naslov} – ` : ''}${s.tekst}`).join('\n')))
          .join('\n\n')} />
      </View>
    );
  }
  const redom = listePrvo ? [...b0.filter((b) => b.vrsta !== 'pasus'), ...b0.filter((b) => b.vrsta === 'pasus')] : b0;
  return (
    <View className="gap-3">
      {redom.map((b, i) =>
        b.vrsta === 'pasus' ? (
          <Text key={i} variant="reading">{b.tekst}</Text>
        ) : (
          <View key={i} className="gap-2">
            {b.stavke.map((s, j) => (
              <View key={j} className="flex-row">
                <Text variant="reading" className="w-5">•</Text>
                {/* Naslov stavke u SVOM redu, tekst ispod — ne u istom <Text>-u.
                    Podebljan deo usred reda + prored 26 iOS pogresno meri: poslednja
                    rec se odsece na ivici, a ispod ostane prazan red (Ivan, snimak
                    28.9.2026, "Nepotpuni podaci"). Bez ugnezdenog teksta nema ni greske. */}
                <View className="flex-1">
                  {!!s.naslov && <Text variant="reading" className={cn('text-foreground', tezina('naslovStavke'))}>{s.naslov}</Text>}
                  <Text variant="reading">{s.tekst}</Text>
                </View>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

/**
 * Prva recenica tumacenja — veca i crna (Ivan, 1.10.2026). Ista na dugom tekstu tranzita
 * i na savetima lunarnog kalendara.
 */
export function UvodRecenica({ children }: { children: string }) {
  return (
    <Text variant="default" className={cn('text-[20px] leading-[29px] tracking-[-0.2px]', tezina('naslovUTekstu'))}>
      {children}
    </Text>
  );
}
