import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { KARTICA } from '@/components/prica/kartica';
import { LogoPrice } from '@/components/prica/logo-price';
import type { OkvirSlike } from '@/components/prica/slajdovi';
import { SLIKE_PRICE_ZNAKA } from '@/components/prica-znaka/slike';
import { tamnaSlikaZnaka, type PricaZnaka, type SlikaZnaka } from '@/lib/prica-znaka';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/**
 * KARTICA ZA DELJENJE price o znaku — 360 × 640 (na 3x tacno 1080 × 1920), ista mera i okvir kao
 * dnevna (`components/prica/kartica.tsx`): gore "Ovan · astroshop.rs", dole mali logo (na indigu
 * negativ), sadrzaj u sigurnoj zoni Instagram price (116—502). Sadrzaj je ISTA slika price u
 * razmeri kartice (`kartica` u `slike.tsx`), pa su pokreti isti i u videu. Bez stakla i zamucenja.
 */
const OKVIR: OkvirSlike = { vrh: 116, dno: 138, sirina: KARTICA.w, visina: KARTICA.h, donjiUmetak: 0 };
/** Logo kao na dnevnoj kartici (`components/prica/kartica.tsx`; Ivan 1.10.2026: 1,5× veci) — sirina 198, vrh na 532 od 640. */
const LOGO_W = 198;
const LOGO_VRH = 532;

/**
 * @param bezZaglavlja VIDEO priče o znaku (Ivan, 1.10.2026): bez "Ovan · astroshop.rs" gore — adresa je na
 *   završnom kadru, a ime znaka na naslovnoj. Slika za deljenje (PNG) ga zadržava.
 */
export function KarticaZnaka({ p, k, bezZaglavlja = false }: { p: PricaZnaka; k: SlikaZnaka; bezZaglavlja?: boolean }) {
  const t = useT();
  const Slika = SLIKE_PRICE_ZNAKA[k];
  const tamno = tamnaSlikaZnaka(k);
  return (
    <View style={{ width: KARTICA.w, height: KARTICA.h, overflow: 'hidden' }} collapsable={false}>
      <Slika p={p} okvir={OKVIR} kartica />
      {!bezZaglavlja && (
      <Text
        className={cn('uppercase', tezina('statOznaka'))}
        style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.5, color: tamno ? 'rgba(255,255,255,0.75)' : neutral.inkMuted }}>
        {t.prica.uzSajt(p.znak.name)}
      </Text>
      )}
      <LogoPrice sirina={LOGO_W} negativ={tamno} style={{ position: 'absolute', top: LOGO_VRH, left: (KARTICA.w - LOGO_W) / 2 }} />
    </View>
  );
}
