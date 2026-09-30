import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Minus, Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { OblastIkona } from '@/components/oblast-ikona';
import { ZnakIkona } from '@/components/znak-ikona';
import { MoonDisc } from '@/components/moon-disc';
import { LogoPrice } from '@/components/prica/logo-price';
import { PricaPozadina } from '@/components/prica/pozadina';
import { INDIGO, INK, LILA, MINUS, PLUS, SIVA, TON_MASTILO } from '@/components/prica/boje';
import {
  BLAGO, Broj, FazeMeseca, ISKOK, KrugOko, Pojava, Reci, TackiceOcene, Tocak, TrakeTona, UgaoAspekta, ZAVESA, Zraci,
} from '@/components/prica/crtezi';
import { useOkret } from '@/components/prica/sat';
import type { Nijansa } from '@/components/prica/boje';
import { boljeNegoJuce, fazaOsmina, korakReci, velicinaSaveta, VELICINE_SAVETA_KARTICA, visinaNatpisa, type SlikaKljuc } from '@/lib/prica';
import type { PricaDana } from '@/lib/use-prica';
import { mnozina, TRANZIT } from '@/lib/mnozina';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

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
 * VIDEO (Ivan, 30.9.2026): ista kartica je i kadar videa price (`video-radionica.tsx`). Pokreti su
 * ISTI kao na slici price, istim redom i vremenima, i idu po satu slike (`sat.tsx`) — bez sata (slika
 * za deljenje) sve je u konacnom stanju. Datum, sajt i logo stoje od prvog kadra.
 *
 * Bez stakla i zamucenja: na Androidu ih snimak ne bi preziveo.
 */
export const KARTICA = { w: 360, h: 640 } as const;

const LOGO_W = 132;
/**
 * Logo dole (Ivan, 30.9.2026: "spusti jos dole"; do tada vrh na 512). Dno mu je na ~575 od 640,
 * tj. ~195 px od dna u 1080 × 1920 — tik iznad polja za odgovor koje Instagram crta preko price.
 * U videu mu se krug vrti (`logo-price.tsx`).
 */
const LOGO_VRH = 540;

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
      <LogoPrice sirina={LOGO_W} negativ={negativ} style={{ position: 'absolute', top: LOGO_VRH, left: (KARTICA.w - LOGO_W) / 2 }} />
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
        <Tocak tetive={p.naslovna.tetive} levo={p.naslovna.levo} velicina={186} />
      </View>
      <Pojava kasni={400} style={{ marginTop: 14 }}>
        <Ozn boja={BELA_80}>{p.datumTekst}</Ozn>
      </Pojava>
      <View style={{ marginTop: 4 }}>
        <Reci tekst="Moj dan" kasni={520} korak={110} className={cn('text-[58px] leading-[60px] tracking-[-2.5px]', tezina('display'))} style={{ color: BELA }} />
      </View>
      {n > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 14 }}>
          <TrakeTona tonovi={p.naslovna.tonovi} maxSirina={110} />
          <Pojava kasni={2200} style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Broj do={n} kasni={2200} style={{ fontSize: 22, lineHeight: 25, color: BELA, letterSpacing: -0.4 }} />
              <Text className={cn('text-[22px] leading-[25px] tracking-[-0.4px]', tezina('display'))} style={{ color: BELA }}>
                {` ${mnozina(n, TRANZIT)}`}
              </Text>
            </View>
            <Text className="text-[11.5px] leading-[15px]" style={{ color: BELA_80 }} numberOfLines={1} adjustsFontSizeToFit>
              {p.naslovna.legenda}
            </Text>
          </Pojava>
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
        <UgaoAspekta ugao={td.aspekt.angle} imeAspekta={td.aspekt.name} tranzitna={td.tranzitna} natalna={td.natalna} sirina={180} />
      </View>
      <Pojava kasni={900}>
        <Ozn boja={MUTNO}>{`Najvažnije danas · ${td.momenat}`}</Ozn>
      </Pojava>
      <View style={{ marginTop: 6 }}>
        <Reci tekst={td.naslov} kasni={1050} className={cn('text-[31px] leading-[34px] tracking-[-0.9px]', tezina('display'))} />
      </View>
      {!!td.sazetak && (
        <Pojava kasni={1700} style={{ marginTop: 10 }}>
          <Text className={cn('text-[14px] leading-[20px]', tezina('reading'))} style={{ color: MUTNO }}>{td.sazetak}</Text>
        </Pojava>
      )}
      {td.ime !== td.naslov && (
        <Pojava kasni={2000} className="mt-3 self-start rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
          <Text className={cn('text-[12.5px] leading-[17px]', tezina('muted'))}>{td.ime}</Text>
        </Pojava>
      )}
    </Okvir>
  );
}

function KOcene({ p }: { p: PricaDana }) {
  const o = p.ocene!;
  const naj = o.najbolja;
  return (
    <Okvir pozadina={SIVA} datum={p.datumTekst} boja={MUTNO}>
      {naj && (
        <Pojava kasni={200} trajanje={600} ublazavanje={ISKOK} zum bledi={false} pomak={0} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
          <OblastIkona oblast={naj.key} size={60} />
        </Pojava>
      )}
      <Pojava kasni={450}>
        <Ozn boja={MUTNO}>Najbolje mi ide</Ozn>
      </Pojava>
      {naj && (
        <View style={{ marginTop: 6 }}>
          <Reci tekst={naj.name} kasni={550} className={cn('text-[34px] leading-[38px] tracking-[-1px]', tezina('display'))} />
        </View>
      )}
      <Pojava kasni={900} className="mt-4 overflow-hidden rounded-lg border border-card bg-card/80">
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
              <TackiceOcene ocena={r.ocena} velicina={8} kasni={1200 + i * 240} />
              <View style={{ width: 26, alignItems: 'flex-end' }}>
                <Text className={cn('text-[26px] leading-[28px] tracking-[-0.8px]', tezina('display'))}>{r.ocena}</Text>
                {r.ocena === 5 && <KrugOko sirina={50} />}
              </View>
            </View>
          );
        })}
      </Pojava>
    </Okvir>
  );
}

function KIdeKoci({ p }: { p: PricaDana }) {
  const { ide, koci } = p.ideKoci!;
  const blok = (znak: 'plus' | 'minus', natpis: string, t: { tekst: string; ime: string }, kasni: number) => {
    const Ikona = znak === 'plus' ? Plus : Minus;
    return (
      <View>
        <Pojava kasni={kasni} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View className="items-center justify-center rounded-pill bg-background" style={{ width: 30, height: 30 }}>
            <Ikona size={15} color={INK} strokeWidth={3} />
          </View>
          <Text className={cn('text-[17px] leading-[22px]', tezina('display'))}>{natpis}</Text>
        </Pojava>
        <View style={{ marginTop: 10 }}>
          <Reci tekst={t.tekst} kasni={kasni + 150} korak={55} className={cn('text-[25px] leading-[30px] tracking-[-0.6px]', tezina('display'))} />
        </View>
        <Pojava kasni={kasni + 800} style={{ marginTop: 6 }}>
          <Text className="text-[12px] leading-[16px]" style={{ color: INK, opacity: 0.6 }}>{t.ime}</Text>
        </Pojava>
      </View>
    );
  };
  if (ide && koci) {
    // Svaka recenica u svojoj polovini — granica boja je uvek izmedju njih.
    return (
      <View style={{ width: KARTICA.w, height: KARTICA.h, backgroundColor: MINUS, overflow: 'hidden' }} collapsable={false}>
        {/* Gornja polovina se spusti kao zavesa, sa svojom recenicom (kao na slici price). */}
        <Pojava trajanje={900} ublazavanje={ZAVESA} pomak={-KARTICA.h} bledi={false} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: KARTICA.h / 2, backgroundColor: PLUS }}>
          <View style={{ position: 'absolute', left: 22, right: 22, bottom: 22 }}>{blok('plus', 'Ide mi', ide, 500)}</View>
        </Pojava>
        <Text className={OZN} style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.5, color: 'rgba(21,21,21,0.6)' }}>
          {`${p.datumTekst} · astroshop.rs`}
        </Text>
        <View style={{ position: 'absolute', left: 22, right: 22, top: KARTICA.h / 2 + 22 }}>{blok('minus', 'Koči me', koci, 1400)}</View>
        <LogoPrice sirina={LOGO_W} negativ style={{ position: 'absolute', top: LOGO_VRH, left: (KARTICA.w - LOGO_W) / 2 }} />
      </View>
    );
  }
  const jedna = ide ?? koci!;
  return (
    <Okvir pozadina={ide ? PLUS : MINUS} datum={p.datumTekst} boja="rgba(21,21,21,0.6)" negativ>
      {blok(ide ? 'plus' : 'minus', ide ? 'Ide mi' : 'Koči me', jedna, 400)}
    </Okvir>
  );
}

function KMesec({ p }: { p: PricaDana }) {
  const m = p.mesec;
  const okret = useOkret(240);
  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${okret.get()}deg` }] }));
  return (
    <Okvir pozadina={INDIGO} nijansa="noc" datum={p.datumTekst} boja="rgba(255,255,255,0.75)" negativ>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pojava trajanje={1400} pomak={KARTICA.h} bledi={false} style={{ shadowColor: LILA, shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } }}>
          <Animated.View style={stil}>
            <MoonDisc angle={m.faza.angle} size={116} />
          </Animated.View>
        </Pojava>
        <Pojava kasni={700} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Broj do={m.faza.illuminationPct} kasni={800} style={{ fontSize: 70, lineHeight: 72, color: BELA, letterSpacing: -4 }} />
          <Text className={cn('text-[26px] leading-[28px]', tezina('display'))} style={{ color: BELA }}> %</Text>
        </Pojava>
      </View>
      <View style={{ marginTop: 14 }}>
        <FazeMeseca trenutna={fazaOsmina(m.faza.angle)} velicina={22} />
      </View>
      <Pojava kasni={1700} style={{ marginTop: 14 }}>
        <Ozn boja={BELA_80}>{`Mesec danas · ${m.sledeca}`}</Ozn>
      </Pojava>
      <View style={{ marginTop: 6 }}>
        <Reci
          tekst={m.naslov}
          kasni={1850}
          korak={80}
          className={cn('text-[28px] leading-[32px] tracking-[-0.8px]', tezina('display'))}
          style={{ color: BELA }}
          pre={(
            <Pojava kasni={1750} trajanje={500} ublazavanje={BLAGO} zum bledi={false} pomak={0} style={{ marginRight: 8 }}>
              <ZnakIkona znak={m.znak.key} element={m.znak.element} size={26} />
            </Pojava>
          )}
        />
      </View>
      {m.zaTebe && (
        <Pojava kasni={2500} style={{ marginTop: 12, borderRadius: 12, padding: 11, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }}>
          <Ozn boja={BELA_80}>Za mene</Ozn>
          <Text className={cn('mt-0.5 text-[15px] leading-[19px]', tezina('naslovUTekstu'))} style={{ color: BELA }}>{m.zaTebe.naslov}</Text>
          {!!m.zaTebe.tekst && <Text className="text-[13px] leading-[18px]" style={{ color: BELA_80 }}>{m.zaTebe.tekst}</Text>}
        </Pojava>
      )}
    </Okvir>
  );
}

function KSavet({ p }: { p: PricaDana }) {
  const s = p.savet!;
  // Blok je centriran na sredistu zraka (282 od 640), kao na slici price.
  const SREDINA = 282;
  // Velicina po duzini saveta, kao na slici price: visina bloka bez oznake (13 + 12) i natpisa ispod (14 + redovi).
  const natpis = `Iz tumačenja tranzita ${s.ime}.`;
  const sirina = KARTICA.w - 44;
  const vel = velicinaSaveta(s.tekst, sirina, (SREDINA - 116) * 2 - 25 - 14 - visinaNatpisa(natpis, sirina), VELICINE_SAVETA_KARTICA);
  return (
    <View style={{ width: KARTICA.w, height: KARTICA.h, backgroundColor: SIVA, overflow: 'hidden' }} collapsable={false}>
      <PricaPozadina nijansa="zlato" sirina={KARTICA.w} visina={KARTICA.h} />
      <View style={{ position: 'absolute', left: (KARTICA.w - 700) / 2, top: SREDINA - 350 }}>
        <Zraci velicina={700} />
      </View>
      <Text className={OZN} style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.5, color: MUTNO }}>
        {`${p.datumTekst} · astroshop.rs`}
      </Text>
      <View style={{ position: 'absolute', left: 22, right: 22, top: 116, height: (SREDINA - 116) * 2, justifyContent: 'center', alignItems: 'center' }}>
        <Pojava kasni={300}>
          <Ozn boja={MUTNO}>Savet dana</Ozn>
        </Pojava>
        <View style={{ marginTop: 12 }}>
          <Reci
            tekst={s.tekst}
            kasni={450}
            korak={korakReci(s.tekst, 450)}
            centar
            className={tezina('display')}
            style={{ fontSize: vel.velicina, lineHeight: vel.prored, letterSpacing: -0.036 * vel.velicina }}
          />
        </View>
        <Pojava kasni={1200} style={{ marginTop: 14 }}>
          <Text className="text-center text-[13px] leading-[18px]" style={{ color: MUTNO }}>{natpis}</Text>
        </Pojava>
      </View>
      <LogoPrice sirina={LOGO_W} style={{ position: 'absolute', top: LOGO_VRH, left: (KARTICA.w - LOGO_W) / 2 }} />
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

/**
 * ZAVRSNI KADAR VIDEA (Ivan, 30.9.2026): logo i sajt, posle poslednje slike (`VIDEO.zavrsni`).
 * Samo u videu — prica i slika za deljenje ga nemaju. Indigo kao naslovna: video pocinje i
 * zavrsava bojom brenda.
 */
export function KarticaKraj() {
  const w = 280;
  return (
    <View style={{ width: KARTICA.w, height: KARTICA.h, backgroundColor: INDIGO, overflow: 'hidden' }} collapsable={false}>
      <PricaPozadina nijansa="noc" sirina={KARTICA.w} visina={KARTICA.h} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Pojava kasni={250} trajanje={800}>
          <LogoPrice sirina={w} negativ />
        </Pojava>
        <Pojava kasni={700} style={{ marginTop: 22 }}>
          <Text className={OZN} style={{ fontSize: 12, lineHeight: 16, letterSpacing: 2.4, color: BELA_80 }}>astroshop.rs</Text>
        </Pojava>
      </View>
    </View>
  );
}

/** Kartica za deljenje slike `k` — ista kao slika price. */
export function KarticaZaDeljenje({ p, k }: { p: PricaDana; k: SlikaKljuc }) {
  const K = KARTICE[k];
  return <K p={p} />;
}

