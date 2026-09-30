import * as React from 'react';
import { Image, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { OblastIkona } from '@/components/oblast-ikona';
import { ZnakIkona } from '@/components/znak-ikona';
import { MoonDisc } from '@/components/moon-disc';
import { PricaPozadina } from '@/components/prica/pozadina';
import { INDIGO, INK, LILA, MINUS, PLUS, SIVA, TON_MASTILO } from '@/components/prica/boje';
import { FazeMeseca, KrugOko, Reci, TackiceOcene, Tocak, TrakeTona, UgaoAspekta, Zraci } from '@/components/prica/crtezi';
import type { Nijansa } from '@/components/prica/boje';
import { boljeNegoJuce, fazaOsmina, reciZaPrelom, type SlikaKljuc } from '@/lib/prica';
import type { PricaDana } from '@/lib/use-prica';
import { mnozina, TRANZIT } from '@/lib/mnozina';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/** Veliki tekst u komadu, ali jednoslovna rec vezana za sledecu — isti prelom kao reci na slici price. */
const slog = (tekst: string) => reciZaPrelom(tekst).join(' ');

/**
 * KARTICA ZA DELJENJE — 360 × 640 pt, na ekranu 3x tacno 1080 × 1920 (ostale gustine
 * se posle snimanja svode na tu meru, `app/prica.tsx`).
 *
 * Pravila (Ivan, 30.9.2026):
 *  - sadrzaj je ISTI kao na slici price; nista se ne izbacuje, samo se smanje Mesec, planete i krugovi;
 *  - obracanje u prvom licu ("Moj dan", "Ide mi"), jer sliku objavljuje korisnik;
 *  - gore datum i sajt, dole mali logo (na punoj boji negativ);
 *  - sadrzaj u sigurnoj zoni Instagram PRICE (~250 px gore i dole od 1920), ne Reels-a;
 *  - katanaca nema: i besplatni vidi i deli sve cetiri ocene (Ivan, 30.9.2026).
 * Imena tranzita i tocak ostaju, iako uz datum odaju datum rodjenja u razmaku od par dana — Ivan je to prihvatio.
 *
 * Bez stakla i zamucenja: na Androidu ih snimak ne bi preziveo.
 */
export const KARTICA = { w: 360, h: 640 } as const;

const LOGO_POZITIV = require('../../../assets/images/logo-story-pozitiv.png');
const LOGO_NEGATIV = require('../../../assets/images/logo-story-negativ.png');
const LOGO_W = 132;
const LOGO_H = (LOGO_W * 112) / 420;

const BELA = neutral.white;
const BELA_80 = 'rgba(255,255,255,0.8)';
const MUTNO = neutral.inkMuted;

const OZN = cn('uppercase', tezina('statOznaka'));

function Okvir({ pozadina, nijansa, datum, boja, negativ = false, ekstra, children, poravnanje = 'center' }: {
  pozadina: string;
  nijansa?: Nijansa;
  datum: string;
  /** Boja datuma gore. */
  boja: string;
  negativ?: boolean;
  ekstra?: React.ReactNode;
  children: React.ReactNode;
  poravnanje?: 'center' | 'flex-start';
}) {
  return (
    <View style={{ width: KARTICA.w, height: KARTICA.h, backgroundColor: pozadina, overflow: 'hidden' }} collapsable={false}>
      {nijansa && <PricaPozadina nijansa={nijansa} sirina={KARTICA.w} visina={KARTICA.h} />}
      {ekstra}
      <Text
        className={OZN}
        style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.5, color: boja }}>
        {`${datum} · astroshop.rs`}
      </Text>
      <View style={{ position: 'absolute', left: 22, right: 22, top: 116, bottom: 138, justifyContent: 'center', alignItems: poravnanje === 'center' ? 'stretch' : 'flex-start' }}>
        {children}
      </View>
      <Image
        source={negativ ? LOGO_NEGATIV : LOGO_POZITIV}
        style={{ position: 'absolute', top: 512, left: (KARTICA.w - LOGO_W) / 2, width: LOGO_W, height: LOGO_H }}
        resizeMode="contain"
      />
    </View>
  );
}

const Ozn = ({ children, boja, style }: { children: string; boja: string; style?: object }) => (
  <Text className={OZN} style={[{ fontSize: 10, lineHeight: 13, letterSpacing: 1.6, color: boja }, style]}>{children}</Text>
);

/* ------------------------------------------------------------------------- */

function KNaslovna({ p }: { p: PricaDana }) {
  const n = p.naslovna.broj;
  return (
    <Okvir pozadina={INDIGO} nijansa="noc" datum={p.datumTekst} boja="rgba(255,255,255,0.75)" negativ>
      <View style={{ alignItems: 'center' }}>
        <Tocak tetive={p.naslovna.tetive} levo={p.naslovna.levo} velicina={186} animiraj={false} />
      </View>
      <Ozn boja={BELA_80} style={{ marginTop: 14 }}>{p.datumTekst}</Ozn>
      <Text className={cn('text-[58px] leading-[60px] tracking-[-2.5px]', tezina('display'))} style={{ color: BELA, marginTop: 4 }}>Moj dan</Text>
      {n > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 14 }}>
          <TrakeTona tonovi={p.naslovna.tonovi} maxSirina={110} animiraj={false} />
          <View style={{ flexShrink: 1 }}>
            <Text className={cn('text-[22px] leading-[25px] tracking-[-0.4px]', tezina('display'))} style={{ color: BELA }}>
              {`${n} ${mnozina(n, TRANZIT)}`}
            </Text>
            <Text className="text-[11.5px] leading-[15px]" style={{ color: BELA_80 }} numberOfLines={1} adjustsFontSizeToFit>
              {p.naslovna.legenda}
            </Text>
          </View>
        </View>
      )}
    </Okvir>
  );
}

function KTvojDan({ p }: { p: PricaDana }) {
  const td = p.tvojDan!;
  return (
    <Okvir pozadina={SIVA} nijansa="indigo" datum={p.datumTekst} boja={MUTNO}>
      <View style={{ alignItems: 'flex-start', marginBottom: 18 }}>
        <UgaoAspekta ugao={td.aspekt.angle} imeAspekta={td.aspekt.name} tranzitna={td.tranzitna} natalna={td.natalna} sirina={180} animiraj={false} />
      </View>
      <Ozn boja={MUTNO}>{`Najvažnije danas · ${td.momenat}`}</Ozn>
      <Text className={cn('mt-1.5 text-[31px] leading-[34px] tracking-[-0.9px]', tezina('display'))}>{slog(td.naslov)}</Text>
      {!!td.sazetak && <Text className={cn('mt-2.5 text-[14px] leading-[20px]', tezina('reading'))} style={{ color: MUTNO }}>{td.sazetak}</Text>}
      {td.ime !== td.naslov && (
        <View className="mt-3 self-start rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
          <Text className={cn('text-[12.5px] leading-[17px]', tezina('muted'))}>{td.ime}</Text>
        </View>
      )}
    </Okvir>
  );
}

function KOcene({ p }: { p: PricaDana }) {
  const o = p.ocene!;
  const naj = o.najbolja;
  return (
    <Okvir pozadina={SIVA} datum={p.datumTekst} boja={MUTNO}>
      {naj && <View style={{ marginBottom: 8 }}><OblastIkona oblast={naj.key} size={60} /></View>}
      <Ozn boja={MUTNO}>Najbolje mi ide</Ozn>
      {naj && <Text className={cn('mt-1.5 text-[34px] leading-[38px] tracking-[-1px]', tezina('display'))}>{naj.name}</Text>}
      <View className="mt-4 overflow-hidden rounded-lg border border-card bg-card/80">
        {o.redovi.map((r, i) => {
          const bolje = boljeNegoJuce(r.ocena, r.juce);
          return (
            <View key={r.key} className={cn('flex-row items-center gap-2.5 px-3.5 py-2.5', i > 0 && 'border-t border-border')}>
              <OblastIkona oblast={r.key} size={24} />
              <View style={{ flex: 1 }}>
                <Text className="text-[16px] leading-[20px]">{r.name}</Text>
                {bolje && (
                  <Text className={cn('text-[9.5px] leading-[12px] uppercase tracking-[1.1px]', tezina('statOznaka'))} style={{ color: TON_MASTILO.povoljno }}>
                    ↑ bolje nego juče
                  </Text>
                )}
              </View>
              <TackiceOcene ocena={r.ocena} velicina={8} animiraj={false} />
              <View style={{ width: 26, alignItems: 'flex-end' }}>
                <Text className={cn('text-[26px] leading-[28px] tracking-[-0.8px]', tezina('display'))}>{r.ocena}</Text>
                {r.ocena === 5 && <KrugOko sirina={50} animiraj={false} />}
              </View>
            </View>
          );
        })}
      </View>
    </Okvir>
  );
}

function KIdeKoci({ p }: { p: PricaDana }) {
  const { ide, koci } = p.ideKoci!;
  const blok = (znak: 'plus' | 'minus', natpis: string, t: { tekst: string; ime: string }) => {
    const Ikona = znak === 'plus' ? Plus : Minus;
    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View className="items-center justify-center rounded-pill bg-background" style={{ width: 30, height: 30 }}>
            <Ikona size={15} color={INK} strokeWidth={3} />
          </View>
          <Text className={cn('text-[17px] leading-[22px]', tezina('display'))}>{natpis}</Text>
        </View>
        <Text className={cn('mt-2.5 text-[25px] leading-[30px] tracking-[-0.6px]', tezina('display'))}>{slog(t.tekst)}</Text>
        <Text className="mt-1.5 text-[12px] leading-[16px]" style={{ color: INK, opacity: 0.6 }}>{t.ime}</Text>
      </View>
    );
  };
  if (ide && koci) {
    // Svaka recenica u svojoj polovini — granica boja je uvek izmedju njih.
    return (
      <View style={{ width: KARTICA.w, height: KARTICA.h, backgroundColor: MINUS, overflow: 'hidden' }} collapsable={false}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: KARTICA.h / 2, backgroundColor: PLUS }} />
        <Text className={OZN} style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.5, color: 'rgba(21,21,21,0.6)' }}>
          {`${p.datumTekst} · astroshop.rs`}
        </Text>
        <View style={{ position: 'absolute', left: 22, right: 22, bottom: KARTICA.h / 2 + 22 }}>{blok('plus', 'Ide mi', ide)}</View>
        <View style={{ position: 'absolute', left: 22, right: 22, top: KARTICA.h / 2 + 22 }}>{blok('minus', 'Koči me', koci)}</View>
        <Image source={LOGO_NEGATIV} style={{ position: 'absolute', top: 512, left: (KARTICA.w - LOGO_W) / 2, width: LOGO_W, height: LOGO_H }} resizeMode="contain" />
      </View>
    );
  }
  const jedna = ide ?? koci!;
  return (
    <Okvir pozadina={ide ? PLUS : MINUS} datum={p.datumTekst} boja="rgba(21,21,21,0.6)" negativ>
      {blok(ide ? 'plus' : 'minus', ide ? 'Ide mi' : 'Koči me', jedna)}
    </Okvir>
  );
}

function KMesec({ p }: { p: PricaDana }) {
  const m = p.mesec;
  return (
    <Okvir pozadina={INDIGO} nijansa="noc" datum={p.datumTekst} boja="rgba(255,255,255,0.75)" negativ>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ shadowColor: LILA, shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } }}>
          <MoonDisc angle={m.faza.angle} size={116} />
        </View>
        <Text className={cn('text-[70px] leading-[72px] tracking-[-4px]', tezina('display'))} style={{ color: BELA }}>
          {m.faza.illuminationPct}
          <Text className={cn('text-[26px] leading-[28px] tracking-[0px]', tezina('display'))} style={{ color: BELA }}> %</Text>
        </Text>
      </View>
      <View style={{ marginTop: 14 }}>
        <FazeMeseca trenutna={fazaOsmina(m.faza.angle)} velicina={22} animiraj={false} />
      </View>
      <Ozn boja={BELA_80} style={{ marginTop: 14 }}>{`Mesec danas · ${m.sledeca}`}</Ozn>
      <View style={{ marginTop: 6 }}>
        <Reci
          tekst={m.naslov}
          animiraj={false}
          className={cn('text-[28px] leading-[32px] tracking-[-0.8px]', tezina('display'))}
          style={{ color: BELA }}
          pre={<View style={{ marginRight: 8 }}><ZnakIkona znak={m.znak.key} element={m.znak.element} size={26} /></View>}
        />
      </View>
      {m.zaTebe && (
        <View style={{ marginTop: 12, borderRadius: 12, padding: 11, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }}>
          <Ozn boja={BELA_80}>Za mene</Ozn>
          <Text className={cn('mt-0.5 text-[15px] leading-[19px]', tezina('naslovUTekstu'))} style={{ color: BELA }}>{m.zaTebe.naslov}</Text>
          {!!m.zaTebe.tekst && <Text className="text-[13px] leading-[18px]" style={{ color: BELA_80 }}>{m.zaTebe.tekst}</Text>}
        </View>
      )}
    </Okvir>
  );
}

function KSavet({ p }: { p: PricaDana }) {
  const s = p.savet!;
  // Blok je centriran na sredistu zraka (282 od 640), kao na slici price.
  const SREDINA = 282;
  return (
    <View style={{ width: KARTICA.w, height: KARTICA.h, backgroundColor: SIVA, overflow: 'hidden' }} collapsable={false}>
      <PricaPozadina nijansa="zlato" sirina={KARTICA.w} visina={KARTICA.h} />
      <View style={{ position: 'absolute', left: (KARTICA.w - 700) / 2, top: SREDINA - 350 }}>
        <Zraci velicina={700} animiraj={false} />
      </View>
      <Text className={OZN} style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.5, color: MUTNO }}>
        {`${p.datumTekst} · astroshop.rs`}
      </Text>
      <View style={{ position: 'absolute', left: 22, right: 22, top: 116, height: (SREDINA - 116) * 2, justifyContent: 'center', alignItems: 'center' }}>
        <Ozn boja={MUTNO}>Savet dana</Ozn>
        <Text className={cn('mt-3 text-center text-[39px] leading-[43px] tracking-[-1.4px]', tezina('display'))}>{slog(s.tekst)}</Text>
        <Text className="mt-3.5 text-center text-[13px] leading-[18px]" style={{ color: MUTNO }}>{`Iz tumačenja tranzita ${s.ime}.`}</Text>
      </View>
      <Image source={LOGO_POZITIV} style={{ position: 'absolute', top: 512, left: (KARTICA.w - LOGO_W) / 2, width: LOGO_W, height: LOGO_H }} resizeMode="contain" />
    </View>
  );
}

const KARTICE: Record<SlikaKljuc, (props: { p: PricaDana }) => React.ReactElement> = {
  naslovna: KNaslovna,
  tvojDan: KTvojDan,
  ocene: KOcene,
  ideKoci: KIdeKoci,
  mesec: KMesec,
  savet: KSavet,
};

/** Kartica za deljenje slike `k` — ista kao slika price. */
export function KarticaZaDeljenje({ p, k }: { p: PricaDana; k: SlikaKljuc }) {
  const K = KARTICE[k];
  return <K p={p} />;
}

