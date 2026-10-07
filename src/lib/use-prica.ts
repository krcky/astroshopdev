/**
 * Podaci dnevne price — sve iz ISTIH racuna kao pocetna, da prica i pocetna nikad
 * ne kazu dve razlicite stvari o istom danu. Izbor slika i trajanje su u `lib/prica.ts`.
 */
import * as React from 'react';

import { useT } from '@/i18n';
import { bodyLongitude, type AspectDef } from '@/lib/astro';
import { buildPersonalDaily, datum } from '@/lib/horoscope';
import { phaseDay, naslovMeseca, type PhaseDay } from '@/lib/moon';
import { oceneOblasti, trajanjeTekst, trajanjeTranzita } from '@/lib/oblasti';
import {
  brojTonova, legendaTonova, momenatNatpis, najbolja, slikeDana, trajanjeSlike, TRAJANJE_STALNO,
  type BrojTonova, type SlikaKljuc,
} from '@/lib/prica';
import type { Tone } from '@/lib/tone';
import { useTransitTexts } from '@/lib/transit-texts';
import { dayKey, pickBrief, strongestMoonHit, type NatalTarget, type Transit } from '@/lib/transits';
import { pickTvojDan, tvojDanLogFor } from '@/lib/tvoj-dan';
import { prveRecenice } from '@/lib/tumacenje';
import { useOblastiDana } from '@/lib/use-oblasti';
import { SIGN_CASES, signFromLongitude, type ZodiacSign } from '@/lib/zodiac';
import { useAuthStore } from '@/store/auth';
import { useDanas } from '@/store/danas';
import { useResolvedProfile } from '@/store/profile';
import { tvojDanShownFor, useTvojDanLog } from '@/store/tvoj-dan-log';
import type { OblastKey } from '@/lib/oblasti-config';

export type Tetiva = { tranzit: number; natal: number; ton: Tone };
export type Tacka = { key: string; name: string; glyph: string };

export type PricaDana = {
  /** Danasnji trenutak (`useDanas`). */
  datum: Date;
  /** "Sre, 30. sep 2026" */
  datumTekst: string;
  dan: string;
  slike: SlikaKljuc[];
  /** Trajanje svake slike u ms; poslednja stoji posle isteka. */
  trajanja: Record<SlikaKljuc, number>;
  naslovna: {
    broj: number;
    tonovi: Tone[];
    brojevi: BrojTonova;
    legenda: string;
    tetive: Tetiva[];
    /** Longituda na 9 sati: Ascendent, bez vremena rodjenja 0°. */
    levo: number;
  };
  tvojDan: {
    kljuc: string;
    tranzitna: Tacka;
    natalna: NatalTarget;
    aspekt: AspectDef;
    ime: string;
    momenat: string;
    naslov: string;
    sazetak: string;
    /** Pozitivni efekat i izazov iz kratkog teksta (savet je u `savet`); prazno dok tekst ne stigne. */
    efekat: string;
    izazov: string;
  } | null;
  ocene: {
    redovi: { key: OblastKey; name: string; ocena: number; oznaka: string; juce: number | null }[];
    najbolja: { key: OblastKey; name: string; ocena: number; oznaka: string } | null;
  } | null;
  ideKoci: { ide: { tekst: string; ime: string } | null; koci: { tekst: string; ime: string } | null } | null;
  mesec: {
    faza: PhaseDay;
    znak: ZodiacSign;
    naslov: string;
    /** "Poslednja četvrt · Sub, 3. okt" */
    sledeca: string;
    zaTebe: { naslov: string; tekst: string } | null;
  };
  savet: { tekst: string; ime: string; kljuc: string } | null;
  /** Tekstovi jos stizu — prica ceka da ne bi preskocila slike koje ce imati tekst. */
  ucitava: boolean;
};

export function usePricaDana(): PricaDana | null {
  const resolved = useResolvedProfile();
  const danas = useDanas();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  // Recnik u zavisnostima: prica se sklopi iznova kad se jezik promeni.
  const recnik = useT();
  const tvojDanLog = useTvojDanLog(tvojDanShownFor(userId));

  const juce = React.useMemo(() => new Date(danas.getFullYear(), danas.getMonth(), danas.getDate() - 1, 12), [danas]);
  const oblasti = useOblastiDana(resolved, danas);
  const oblastiJuce = useOblastiDana(resolved, juce);

  // Isti izbor "Tvog dana" kao na pocetnoj (isti dnevnik, isti dan).
  const pick = React.useMemo(
    () => (resolved
      ? pickTvojDan(resolved.chart, danas, resolved.timeUnknown,
          tvojDanLogFor(resolved.chart, danas, tvojDanLog, resolved.timeUnknown, danas))
      : null),
    [resolved, danas, tvojDanLog]
  );
  const daily = React.useMemo(() => (resolved ? buildPersonalDaily(resolved, danas) : null), [resolved, danas]);
  const brief = React.useMemo(
    () => (daily ? pickBrief(daily.entries.map((e) => e.transit), pick?.contentKey ?? null) : null),
    [daily, pick]
  );
  const mesecHit = React.useMemo(
    () => (daily ? strongestMoonHit(daily.moonDay.hits, pick?.contentKey ?? null) : null),
    [daily, pick]
  );

  const kljucevi = React.useMemo(() => {
    const k = new Set<string>();
    if (pick) k.add(pick.contentKey);
    for (const t of brief?.ide ?? []) k.add(t.contentKey);
    for (const t of brief?.koci ?? []) k.add(t.contentKey);
    if (mesecHit) k.add(mesecHit.contentKey);
    return [...k];
  }, [pick, brief, mesecHit]);
  const { texts, loading } = useTransitTexts(kljucevi, 'short');

  return React.useMemo(() => {
    if (!resolved || !oblasti) return null;
    const { chart, timeUnknown } = resolved;
    const t = recnik.prica.racun;

    // --- naslovna: lista dana, najvazniji prvi (kao tab "Tranziti")
    const lista = oblasti.poVaznosti;
    const tonovi = lista.map((s) => s.ton);
    const brojevi = brojTonova(tonovi);
    const tetive = lista.map((s) => ({
      tranzit: bodyLongitude(s.red.transiting.key, danas),
      natal: s.red.natal.longitude,
      ton: s.ton,
    }));

    // --- Tvoj dan
    const tdTekst = pick ? texts.get(pick.contentKey) : undefined;
    const tvojDan = pick ? {
      kljuc: pick.contentKey,
      tranzitna: pick.transiting,
      natalna: pick.natal,
      aspekt: pick.aspect,
      ime: t.imeTranzita(pick.transiting.name, pick.aspect.name, pick.natal.name),
      momenat: momenatNatpis(pick.moment) ?? trajanjeTekst(trajanjeTranzita(pick, danas)).toLowerCase(),
      naslov: tdTekst?.title || t.imeTranzita(pick.transiting.name, pick.aspect.name, pick.natal.name),
      sazetak: tdTekst?.body ? prveRecenice(tdTekst.body) : '',
      efekat: tdTekst?.positive ?? '',
      izazov: tdTekst?.challenge ?? '',
    } : null;

    // --- ocene: u prici SVE cetiri i za besplatne, bez katanaca (Ivan, 30.9.2026) —
    // izuzetak od pravila 18c; na pocetnoj besplatni i dalje vidi samo `BESPLATNO.oblasti`.
    const jucerasnje = new Map((oblastiJuce ? oceneOblasti(oblastiJuce) : []).map((o) => [o.key, o.ocena]));
    const redovi = oceneOblasti(oblasti).map((o) => ({ ...o, juce: jucerasnje.get(o.key) ?? null }));
    const ocene = redovi.length ? { redovi, najbolja: najbolja(redovi) } : null;

    // --- Ide ti / Koči te: prva recenica koja IMA tekst, kao "Danas ukratko"
    const sa = (kandidati: Transit[], polje: 'positive' | 'challenge') => {
      for (const k of kandidati) {
        const r = texts.get(k.contentKey)?.[polje];
        if (r) return { tekst: r, ime: t.imeTranzita(k.transiting.name, k.aspect.name, k.natal.name) };
      }
      return null;
    };
    const ide = brief ? sa(brief.ide, 'positive') : null;
    const koci = brief ? sa(brief.koci, 'challenge') : null;
    const ideKoci = ide || koci ? { ide, koci } : null;

    // --- Mesec: isti izvor kao kartica i ekran Mesec
    const faza = phaseDay(danas);
    const znak = signFromLongitude(faza.moonLongitude).sign;
    const hitTekst = mesecHit ? texts.get(mesecHit.contentKey) : undefined;
    const mesec = {
      faza,
      znak,
      naslov: naslovMeseca(faza.name, SIGN_CASES[znak.key].loc),
      // "Sledi:" (UX recenzija 1.10.2026): bez toga je "Mesec danas · Poslednja četvrt · Sub, 3. okt"
      // u istom redu pisalo "danas" i drugi dan, pa se citalo kao greska.
      sledeca: t.sledi(faza.next.name, datum(faza.next.at, { dan: true })),
      zaTebe: hitTekst?.title
        ? { naslov: hitTekst.title, tekst: hitTekst.body ? prveRecenice(hitTekst.body, 1) : '' }
        : null,
    };

    // --- savet iz kratkog teksta "Tvog dana"
    const savet = pick && tdTekst?.advice ? { tekst: tdTekst.advice, ime: tvojDan!.ime, kljuc: pick.contentKey } : null;

    const slike = slikeDana({
      tranzita: lista.length,
      tvojDan: !!tvojDan,
      ocene: !!ocene,
      ideKoci: !!ideKoci,
      savet: !!savet,
    });
    const trajanja: Record<SlikaKljuc, number> = {
      naslovna: TRAJANJE_STALNO.naslovna,
      tvojDan: trajanjeSlike(tvojDan ? `${tvojDan.naslov} ${tvojDan.sazetak}` : ''),
      ocene: TRAJANJE_STALNO.ocene,
      ideKoci: trajanjeSlike(`${ide?.tekst ?? ''} ${koci?.tekst ?? ''}`),
      mesec: trajanjeSlike(`${mesec.naslov} ${mesec.zaTebe?.naslov ?? ''} ${mesec.zaTebe?.tekst ?? ''}`),
      savet: TRAJANJE_STALNO.savet,
    };

    return {
      datum: danas,
      datumTekst: datum(danas, { dan: true, godina: true }),
      dan: dayKey(danas),
      slike,
      trajanja,
      naslovna: {
        broj: lista.length,
        tonovi,
        brojevi,
        legenda: legendaTonova(brojevi),
        tetive,
        levo: timeUnknown ? 0 : chart.houses.ascendant,
      },
      tvojDan,
      ocene,
      ideKoci,
      mesec,
      savet,
      ucitava: loading,
    };
  }, [resolved, oblasti, oblastiJuce, pick, brief, mesecHit, texts, loading, danas, recnik]);
}
