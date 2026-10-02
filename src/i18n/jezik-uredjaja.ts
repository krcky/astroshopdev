/**
 * JEZIK PO TELEFONU (Ivan, 2.10.2026) — samo dok korisnik nije sam izabrao jezik
 * (prvi ekran ili profil); rucni izbor uvek pobedjuje (`store/jezik.ts`).
 *
 * Dva podatka sa telefona, bez dozvole i bez mreze (`expo-localization`):
 *   1. spisak zeljenih jezika, redom (mnogi imaju i drugi: "engleski, pa srpski"),
 *   2. REGION telefona — odvojen od jezika: Srbin sa telefonom na engleskom skoro uvek ima region
 *      Srbija (valuta, datum, prognoza). Zato engleski telefon NE znaci engleski korisnik.
 * Redom: nas jezik na spisku -> region -> engleski. Lokacija (GPS/IP) namerno NE: trazi dozvolu ili
 * mrezu, a pogresna je uz VPN i na putu. Cist modul (pravilo 6), proverava ga `check:prevod`.
 */
import type { Jezik } from './jezik';

/** Ono sto treba od `Localization.getLocales()` (isti oblici polja). */
export type JezikTelefona = { languageCode: string | null; regionCode: string | null };

/** Jezik telefona -> nas jezik. "sh" je stari zajednicki kod (srpskohrvatski), "cnr" crnogorski. */
const PO_JEZIKU: Record<string, Jezik> = {
  sr: 'sr', cnr: 'sr', sh: 'sr', hr: 'hr', bs: 'bs', sl: 'sl', mk: 'mk',
};

/**
 * Region -> jezik, kad nijedan nas jezik nije na spisku. BiH = bosanski (Ivan, 2.10.2026); Srbin ili
 * Hrvat iz BiH ionako obicno ima srpski / hrvatski telefon, pa ga uhvati prvo pravilo. Kosovo (XK) srpski.
 */
const PO_REGIONU: Record<string, Jezik> = {
  RS: 'sr', ME: 'sr', XK: 'sr', HR: 'hr', BA: 'bs', SI: 'sl', MK: 'mk',
};

export function jezikTelefona(spisak: readonly JezikTelefona[]): Jezik {
  // 1) prvi NAS jezik na spisku zeljenih jezika (i kad nije prvi: "nemacki, pa hrvatski")
  for (const l of spisak) {
    const j = l.languageCode ? PO_JEZIKU[l.languageCode.toLowerCase()] : undefined;
    if (j) return j;
  }
  // 2) region telefona (prvi koji postoji)
  const region = spisak.find((l) => l.regionCode)?.regionCode?.toUpperCase();
  if (region && PO_REGIONU[region]) return PO_REGIONU[region];
  // 3) ostatak sveta (Ivan, 2.10.2026)
  return 'en';
}
