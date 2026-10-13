import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import { ChevronRight, Lock } from 'lucide-react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { ZnakIkona } from '@/components/znak-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { PlanetaIkona, imaIkonu } from '@/components/planeta-ikona';
import { SLIKE_ZNAKA } from '@/components/prica-znaka/slike-znaka';
import { PlanetaZiva } from '@/components/planeta-ziva';
import { AspektRed, Tacka, redosledPlaneta, stepenMinut } from '@/components/karta-lista';
import { PREMIUM, PremiumKartica } from '@/components/zakljucano';
import { cn } from '@/lib/utils';
import { useCenaNatalneKarte } from '@/lib/kupovina';
import { natalTopic, type MoonSign, type NatalAspect } from '@/lib/natal-keys';
import { useNatalTexts, type NatalNaslov } from '@/lib/natal-texts';
import { prveRecenice } from '@/lib/tumacenje';
import type { ZodiacSign } from '@/lib/zodiac';
import type { ResolvedProfile } from '@/store/profile';
import { useT, type Recnik } from '@/i18n';
import { brand } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/** Koliko aspekata se vidi pre "Svi aspekti". */
const ASPEKATA = 5;

/** Precnik planete na kartici i znaka dole desno (sa belim prstenom), kao na plocici trojke. */
const PLANETA = 64;
/** Krug sa brojem kuce u donjem redu kartice. */
const KUCA_KRUG = 22;
const KUCA_KRUG_SLOVA = 11;
const ZNACKA = 24;
const PRSTEN = 3;


/**
 * PROBNA VERZIJA 2 donjeg dela natalne karte (Ivan, 13.10.2026; prekidac u profilu, `kartaVerzija`):
 * ispod kruga ZBIJEN SPISAK svih pozicija bez znacenja (dve kolone), kartica za JEDNOKRATNU kupovinu
 * tumacenja (besplatni), pa KARTICA ZA SVAKU PLANETU — znak, kuca i podnaslovi astrologa — koja otvara
 * celo tumacenje, i aspekti (prvih pet, ostali na dodir). Krug i ime crta `NatalnaKartaPrikaz`.
 *
 * Kratak tekst po planeti jos NE POSTOJI (korpus ima naslov, podnaslov i dugi tekst), pa kartica nosi
 * podnaslove. Kupovina nije ukljucena (`lib/kupovina.ts`); u v2 nema velike trojke, pa ni ulaza u pricu o znaku.
 */
export function KartaV2({ resolved, osobaId, mesecZnak, aspects, naslovi, zakljucan, premium, otvori }: {
  resolved: ResolvedProfile;
  osobaId?: string;
  mesecZnak: MoonSign;
  aspects: (NatalAspect & { interpreted: boolean })[];
  naslovi: Map<string, NatalNaslov>;
  zakljucan: (k: string) => boolean;
  premium: boolean;
  otvori: (tema: string, deo?: 'kuca') => void;
}) {
  const t = useT();
  const tv = t.karta.v2;
  const { chart, timeUnknown } = resolved;
  const cena = useCenaNatalneKarte();
  const [sviAspekti, setSviAspekti] = React.useState(false);
  const vidljivi = sviAspekti ? aspects : aspects.slice(0, ASPEKATA);
  const kupovina = () => router.push('/natal-kupovina');

  const ascKljuc = `natal.ascendant.sign.${chart.ascendantSign.sign.key}`;
  /**
   * Sta dodir na tacku radi — ISTO u spisku i na kartici: otvara tumacenje, ili list kupovine kad nijedan
   * njen tekst nije otvoren (Sunce i Mesec u znaku su besplatni). `null` = tacka nema tumacenje (MC, podznak bez vremena).
   */
  const akcija = (key: string): { zak: boolean; onPress: () => void } | null => {
    if (key === 'ascendant') {
      if (timeUnknown) return null;
      const zak = zakljucan(ascKljuc);
      return { zak, onPress: zak ? kupovina : () => otvori('ascendant') };
    }
    const topic = natalTopic(chart, timeUnknown, resolved.utc, key);
    if (topic?.kind !== 'planet') return null;
    const kljucevi = [topic.signKey, topic.houseKey].filter((k): k is string => !!k);
    const zak = kljucevi.length > 0 && kljucevi.every(zakljucan);
    return { zak, onPress: zak ? kupovina : () => otvori(key) };
  };

  // Tekst podznaka za njegovu karticu (besplatan red; bez vremena rodjenja podznaka nema).
  const { texts: tekstovi } = useNatalTexts(React.useMemo(() => (timeUnknown ? [] : [ascKljuc]), [timeUnknown, ascKljuc]));

  const mesecNesiguran = !mesecZnak.certain;
  const planete = redosledPlaneta(chart.planets);
  const pozicije: PozicijaStavka[] = [
    {
      tacka: 'ascendant', glyph: 'ASC', ime: t.karta.podznak, muted: timeUnknown, znak: timeUnknown ? undefined : chart.ascendantSign.sign,
      opis: timeUnknown ? t.karta.lista.nepoznat : `${chart.ascendantSign.sign.name} ${stepenMinut(chart.ascendantSign)}`,
    },
    ...planete.map((p): PozicijaStavka => {
      const nesiguran = p.key === 'moon' && mesecNesiguran;
      const znak = nesiguran && !mesecZnak.certain
        ? t.karta.prikaz.znakIli(mesecZnak.from.name, mesecZnak.to.name)
        : `${p.position.sign.name} ${stepenMinut(p.position)}${p.retrograde ? ` ${t.karta.retro}` : ''}`;
      return { tacka: p.key, glyph: p.glyph, ime: p.name, opis: znak, znak: nesiguran ? undefined : p.position.sign, kuca: timeUnknown ? undefined : p.house };
    }),
    {
      tacka: 'midheaven', glyph: 'MC', ime: t.karta.mc, muted: timeUnknown, znak: timeUnknown ? undefined : chart.midheavenSign.sign,
      opis: timeUnknown ? t.karta.lista.nepoznat : `${chart.midheavenSign.sign.name} ${stepenMinut(chart.midheavenSign)}`,
    },
  ];
  const pola = Math.ceil(pozicije.length / 2);

  return (
    <>
      {/* Spisak pozicija: dve kolone, bez znacenja; dodir otvara tumacenje te tacke (Ivan, 13.10.2026). */}
      {/* JEDNA kartica: red = leva i desna pozicija, vodoravne linije izmedju redova od ivice do ivice (pravilo 2) i
          jedna uspravna na sredini (Ivan, 13.10.2026; bez linija i posebna kartica za svaku poziciju probani istog dana i
          vraceni). Redosled PO REDOVIMA (1 2 / 3 4 / …; Ivan, 13.10.2026): Podznak, Sunce / Mesec, Merkur / … / Pluton, MC. */}
      <View className={cn(CARD_SURFACE, 'mx-5 mt-5 overflow-hidden')}>
        {Array.from({ length: pola }, (_, i) => {
          const leva = pozicije[2 * i];
          const desna = pozicije[2 * i + 1];
          return (
            <View key={leva.tacka} className={cn('flex-row px-1', i < pola - 1 && 'border-b border-border')}>
              {/* Uspravna linija: desna ivica leve celije, neprekinuta kroz sve redove. */}
              <View className="flex-1 border-r border-border"><Pozicija {...leva} onPress={akcija(leva.tacka)?.onPress} /></View>
              <View className="flex-1 pl-1">{desna ? <Pozicija {...desna} onPress={akcija(desna.tacka)?.onPress} /> : null}</View>
            </View>
          );
        })}
      </View>

      {timeUnknown && (
        <View className={cn(CARD_SURFACE, 'mx-5 mt-4 p-4')}>
          <Text variant="muted">{t.karta.prikaz.bezVremena}</Text>
        </View>
      )}

      {!premium && (
        <PremiumKartica
          className="mx-5 mt-10"
          naslov={tv.ctaNaslov}
          opis={tv.ctaOpis}
          dugme={tv.ctaDugme(cena)}
          onPress={kupovina}
        />
      )}

      {/* Bez naslova iznad kartica (Ivan, 13.10.2026; naslov "Planete u karti" i stakleni tabovi Planete / Aspekti probani
          istog dana i izbaceni). Razmak do prve kartice: 12 ovde + 12 koliko kartica ima iznad sebe. */}
      <View className="h-3" />


      {!timeUnknown && (
        <PodznakKartica
          znak={chart.ascendantSign.sign}
          oznaka={`${t.karta.podznak} ${t.nebo.uZnaku(chart.ascendantSign.sign.key as ZnakKljuc)}`}
          podnaslov={naslovi.get(ascKljuc)?.subtitle ?? ''}
          // Prve dve recenice (tekst podznaka je besplatan, pa stize ceo); dok ne stigne, prva recenica.
          tekst={(tekstovi.get(ascKljuc)?.body ? prveRecenice(tekstovi.get(ascKljuc)!.body, PODZNAK_RECENICA) : null) ?? naslovi.get(ascKljuc)?.recenica ?? ''}
          zakljucano={!!akcija('ascendant')?.zak}
          onPress={akcija('ascendant')?.onPress ?? kupovina}
        />
      )}
      {planete.map((p) => {
        const topic = natalTopic(chart, timeUnknown, resolved.utc, p.key);
        if (topic?.kind !== 'planet') return null;
        const nesiguran = !!topic.moon && !topic.moon.certain;
        const uZnaku = nesiguran && topic.moon && !topic.moon.certain
          ? t.karta.prikaz.uZnakuIli(topic.moon.from.key as ZnakKljuc, topic.moon.to.key as ZnakKljuc)
          : t.nebo.uZnaku(p.position.sign.key as ZnakKljuc);
        const a = akcija(p.key);
        if (!a) return null;
        return (
          <PlanetaKartica
            key={p.key}
            tacka={p.key}
            telo={<PlanetaZiva planeta={p.key} size={PLANETA} />}
            ime={p.name}
            znak={nesiguran ? null : p.position.sign}
            gde={topic.houseKey ? `${uZnaku} ${t.karta.uKuci(p.house)}` : uZnaku}
            podnaslov={topic.signKey ? naslovi.get(topic.signKey)?.subtitle ?? '' : ''}
            recenica={topic.signKey ? naslovi.get(topic.signKey)?.recenica : undefined}
            uKuci={topic.houseKey ? { kuca: p.house, podnaslov: naslovi.get(topic.houseKey)?.subtitle ?? '' } : undefined}
            zakljucano={a.zak}
            onPress={a.onPress}
          />
        );
      })}

      {/* Aspekti ispod planeta: prvih pet (najtesnji), ostali na dodir. */}
      <Text variant="label" className="mx-5 mt-8" accessibilityRole="header">{t.karta.aspektiNaslov(aspects.length)}</Text>
      <View className={cn(CARD_SURFACE, 'mx-5 mt-3 overflow-hidden')}>
        {vidljivi.map((a, i) => (
          <AspektRed
            key={a.key}
            aspekt={a}
            naslov={a.interpreted ? naslovi.get(a.key)?.subtitle ?? '' : ''}
            zakljucan={a.interpreted && zakljucan(a.key)}
            last={sviAspekti && i === vidljivi.length - 1}
            onPress={a.interpreted ? (zakljucan(a.key) ? kupovina : () => otvori(a.key)) : undefined}
          />
        ))}
        {!sviAspekti && aspects.length > ASPEKATA && (
          <Pressable onPress={() => setSviAspekti(true)} accessibilityRole="button"
            className="min-h-[44px] flex-row items-center px-4 py-3 active:opacity-60">
            <Text variant="row" className="flex-1" style={{ color: brand.indigo }}>{tv.sviAspekti(aspects.length)}</Text>
            <ChevronRight size={18} color={brand.indigo} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>

      {/* Druga kartica za kupovinu na KRAJU strane (Ivan, 13.10.2026) — ista kao gornja, za onoga ko je stigao do dna. */}
      {!premium && (
        <PremiumKartica
          className="mx-5 mt-10"
          naslov={tv.ctaNaslov}
          opis={tv.ctaOpis}
          dugme={tv.ctaDugme(cena)}
          onPress={kupovina}
        />
      )}
    </>
  );
}

type PozicijaStavka = { tacka: string; glyph: string; ime: string; opis: string; znak?: ZodiacSign; kuca?: number; muted?: boolean };

/** Ikonica tacke u spisku i mali znak dole desno uz nju (sa belim prstenom); broj kuce uz ime. */
const POZ_IKONA = 28;
const POZ_ZNAK = 14;
const POZ_KUCA = POZ_ZNAK; // isti krug kao znak uz ikonicu (Ivan, 13.10.2026)
/** Broj u krugu kuce: isti kao dok je krug bio 20 pt. */
const POZ_KUCA_SLOVA = 9;

/** Jedna pozicija u spisku: ikonica, ime i uz njega mali broj kuce, ispod sitno "Lav 19°40′". */
function Pozicija({ tacka, glyph, ime, opis, znak, kuca, muted, onPress }: PozicijaStavka & { onPress?: () => void }) {
  const t = useT();
  return (
    // Dodir otvara tumacenje te tacke (ili list kupovine); MC i podznak bez vremena nemaju tumacenje, pa nisu dugme.
    <Pressable onPress={onPress} disabled={!onPress} accessible accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${ime}, ${opis}${kuca ? `, ${t.karta.kuca(kuca)}` : ''}`}
      className="min-h-[48px] flex-row items-center gap-1.5 px-2 py-2 active:opacity-60"
      style={{ opacity: muted ? 0.5 : 1 }}>
      <View style={{ width: POZ_IKONA, height: POZ_IKONA, marginRight: 4 }}>
        <Tacka tacka={tacka} glyph={glyph} size={POZ_IKONA} />
        {znak && (
          <View className="absolute items-center justify-center rounded-full bg-card"
            style={{ width: POZ_ZNAK + 4, height: POZ_ZNAK + 4, right: -6, bottom: -4 }}>
            <ZnakIkona znak={znak.key} element={znak.element} size={POZ_ZNAK} />
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text variant="muted" className="flex-shrink text-foreground" numberOfLines={1}>{ime}</Text>
          {kuca ? <KucaBroj kuca={kuca} size={POZ_KUCA} puna={{ slova: POZ_KUCA_SLOVA }} /> : null}
        </View>
        <Text variant="caption" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{opis}</Text>
      </View>
    </Pressable>
  );
}

/** Pozadina kartice podznaka (krug sa orbitama, bledi nadole): slika i njena visina / sirina (1149 x 562 px). */
const POZADINA = require('../../assets/images/znak-kartica-back.png');
const POZADINA_RAZMERA = 562 / 1149;

/** Polozena gravira na vrhu kartice podznaka: sirina i najveca visina. */
const GRAVIRA = 240;
const GRAVIRA_VISINA = 215;
/** Skoro kvadratne gravire (Ovan, Vaga, Ribe) bi na punoj visini bile krupnije od ostalih — nize su (Ivan, 13.10.2026). */
const GRAVIRA_VISINA_ZNAK: Record<string, number> = { aries: 175, libra: 175, pisces: 175 };
/** Uspravna gravira desno od teksta: sirina, koliko izlazi preko desne ivice (odseceno) i od kog odnosa visine i sirine vazi. */
const GRAVIRA_DESNO = 150;
/** Devica je sitnija na crtezu od Blizanaca, pa joj je gravira sira (Ivan, 13.10.2026: "malo veca"). */
const GRAVIRA_DESNO_ZNAK: Record<string, number> = { virgo: 180 };
const GRAVIRA_VAN = 28;
const USPRAVNA_OD = 1.2;

/** Koliko recenica tumacenja podznaka ide na njegovu karticu. */
export const PODZNAK_RECENICA = 2;

/**
 * Kartica PODZNAKA (Ivan, 13.10.2026) — drugacija od kartica planeta: mali simbol ZNAKA uz natpis (ne "ASC"),
 * gravira znaka na vrhu, na sredini, ispod nje natpis i naslov astrologa (levo), PRVE DVE RECENICE tumacenja i veza "Saznaj više" umesto strelice.
 */
export function PodznakKartica({ znak, oznaka, podnaslov, tekst, zakljucano, onPress }: {
  znak: ZodiacSign;
  oznaka: string;
  podnaslov: string;
  tekst: string;
  zakljucano: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const gravira = SLIKE_ZNAKA[znak.key]?.gravira;
  const odnos = gravira ? gravira.h / gravira.w : 1;
  // Uspravna gravira: znatno visa nego sira (Blizanci 1,39 i Devica 1,26; Vaga sa 1,07 ostaje gore).
  const uspravna = odnos > USPRAVNA_OD;
  const desno = GRAVIRA_DESNO_ZNAK[znak.key] ?? GRAVIRA_DESNO;
  const [sirina, setSirina] = React.useState(0);
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={podnaslov ? `${oznaka}. ${podnaslov}` : oznaka}
      // Sirina kartice se MERI: `width: '100%'` + `aspectRatio` na apsolutnoj slici je crtao sliku pogresne velicine (kao `PremiumKartica`).
      onLayout={(e) => setSirina(e.nativeEvent.layout.width)}
      className={cn(CARD_SURFACE, 'mx-5 mt-3 overflow-hidden p-4 active:opacity-80')}>
      {/* Pozadinska slika uz SAM VRH kartice, cele sirine (Ivan, 13.10.2026; `files/znak-kartica-back.png`) — samo kod
          polozenih gravira; Blizanci i Devica (gravira desno) je nemaju. Gravira i tekst idu preko nje. */}
      {!uspravna && sirina > 0 && (
        <Image source={POZADINA} resizeMode="cover" accessibilityIgnoresInvertColors
          style={{ position: 'absolute', top: 0, left: 0, width: sirina, height: sirina * POZADINA_RAZMERA, opacity: 0.8 }} />
      )}
      {/* POLOZENA gravira (vecina znakova): velika, na sredini, na vrhu kartice, sa vazduhom iznad i ispod.
          USPRAVNA (Blizanci, Devica — visa nego sira): desno od teksta, uspravno centrirana i odsecena ivicom
          kartice, a sav tekst u levoj koloni (Ivan, 13.10.2026). */}
      {gravira && !uspravna && (
        <View className="items-center py-5">
          <Image source={gravira.src} resizeMode="contain" accessibilityIgnoresInvertColors
            style={{ width: GRAVIRA, height: Math.min(GRAVIRA * odnos, GRAVIRA_VISINA_ZNAK[znak.key] ?? GRAVIRA_VISINA) }} />
        </View>
      )}
      {gravira && uspravna && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, right: -GRAVIRA_VAN, justifyContent: 'center' }}>
          <Image source={gravira.src} resizeMode="contain" accessibilityIgnoresInvertColors
            style={{ width: desno, height: desno * odnos }} />
        </View>
      )}
      <View style={uspravna ? { marginRight: desno - GRAVIRA_VAN - 8, minHeight: desno * odnos - 8 } : undefined}>
        {/* Mali natpis pa veliki naslov, levo poravnati. */}
        <View className="flex-row items-center gap-1.5">
          <ZnakIkona znak={znak.key} element={znak.element} size={16} />
          <Text variant="oznaka" className="flex-1" numberOfLines={2}>{oznaka}</Text>
          {zakljucano && <Lock size={16} color={PREMIUM} strokeWidth={2.4} />}
        </View>
        {!!podnaslov && (
          <NaslovCeleReci size={21} lineHeight={26} min={16} variant="h2"
            className={cn('mt-2 tracking-[-0.3px] text-foreground', tezina('karticaNaslov'))}>
            {podnaslov}
          </NaslovCeleReci>
        )}
        {/* Pasus levo poravnat; kod polozene gravire celom sirinom kartice. */}
        {!!tekst && <Text variant="muted" className="mt-3">{tekst}</Text>}
        <Text variant="chip" className="mt-3" style={{ color: brand.indigo }}>{t.krug.saznajVise}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Kartica planete u rasporedu KARTICE TRANZITA (Ivan, 13.10.2026): sitnim verzalom "SUNCE U LAVU U 11. KUĆI",
 * naslov astrologa za znak, prva recenica tumacenja (do tri reda), desno slika tela sa znakom i lila strelica;
 * ispod linije od ivice do ivice krug sa brojem kuce i naslov kuce. Cela kartica je dugme: otvara tumacenje,
 * ili list kupovine kad je zakljucana (katanac desno u redu kuce; bez reda kuce uz strelicu).
 */
function PlanetaKartica({ tacka, telo, ime, znak, gde, podnaslov, recenica, uKuci, zakljucano, onPress }: {
  /** Kljuc tacke ("sun", "ascendant") — za mali znak uz ime. */
  tacka: string;
  telo: React.ReactNode;
  ime: string;
  /** `null` = znak nije siguran (Mesec bez vremena rodjenja). */
  znak: ZodiacSign | null;
  /** "u Lavu u 11. kući" — ide u oznaku iza imena. */
  gde: string;
  podnaslov: string;
  /** Prva recenica tumacenja; nema je dok server ne posalje (`natal_kartice`). */
  recenica?: string;
  uKuci?: { kuca: number; podnaslov: string };
  zakljucano: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const tv = t.karta.v2;
  const katanac = <Lock size={16} color={PREMIUM} strokeWidth={2.4} />;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={tv.karticaA11y(ime, gde, podnaslov, zakljucano)}
      className={cn(CARD_SURFACE, 'mx-5 mt-3 overflow-hidden active:opacity-80')}>
      <View className="flex-row items-center gap-3 py-4 pl-4 pr-3">
        <View className="flex-1">
          {/* Mali znak planete uz ime: samo simbol u indigu, bez kruga (Ivan, 13.10.2026). */}
          <View className="flex-row items-center gap-1.5">
            {imaIkonu(tacka) && <PlanetaIkona planeta={tacka} size={13} bezKruga />}
            <Text variant="oznaka" className="flex-1" numberOfLines={2}>{ime} {gde}</Text>
          </View>
          {!!podnaslov && (
            <NaslovCeleReci size={21} lineHeight={26} min={16} variant="h2"
              className={cn('mt-2 tracking-[-0.3px] text-foreground', tezina('karticaNaslov'))}>
              {podnaslov}
            </NaslovCeleReci>
          )}
          {!!recenica && <Text variant="muted" className="mt-1.5" numberOfLines={3}>{recenica}</Text>}
        </View>
        <View style={{ width: PLANETA, height: PLANETA, marginRight: 8 }}>
          {telo}
          <View className="absolute items-center justify-center rounded-full bg-background"
            style={{ width: ZNACKA + 2 * PRSTEN, height: ZNACKA + 2 * PRSTEN, right: -10, bottom: -PRSTEN }}>
            {znak ? (
              <ZnakIkona znak={znak.key} element={znak.element} size={ZNACKA} />
            ) : (
              <View className="items-center justify-center rounded-full bg-fill-strong" style={{ width: ZNACKA, height: ZNACKA }}>
                <Text variant="caption" className="text-foreground">?</Text>
              </View>
            )}
          </View>
        </View>
        {zakljucano && !uKuci ? katanac : null}
        <ChevronRight size={20} color={OBLAST_BOJA} strokeWidth={2.2} style={{ marginLeft: -2, marginRight: -4 }} />
      </View>
      {uKuci && (
        <View className="min-h-[44px] flex-row items-center gap-2 border-t border-border px-4 py-3">
          <KucaBroj kuca={uKuci.kuca} size={KUCA_KRUG} puna={{ slova: KUCA_KRUG_SLOVA }} />
          <Text variant="muted" className="flex-1 text-foreground" numberOfLines={2}>{uKuci.podnaslov}</Text>
          {zakljucano ? katanac : null}
        </View>
      )}
    </Pressable>
  );
}
