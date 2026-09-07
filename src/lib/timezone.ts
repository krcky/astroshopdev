/**
 * Lokalno vreme rodjenja -> UTC.
 *
 * ZASTO JE OVO KRITICNO: Zemlja se okrene 15 stepeni na sat. Greska od jednog
 * sata pomeri ascendent za ~15 stepeni — to je pola znaka, i cela karta je
 * pogresna. Zimsko/letnje racunanje vremena mora da bude tacno ZA DATUM
 * RODJENJA, ne za danas.
 *
 * Primarno koristimo Intl (ima punu IANA bazu i istoriju promena). Hermes na
 * nekim Android uredjajima nema pun ICU, pa postoji i rezervni put: eksplicitno
 * evropsko pravilo, koje pokriva Srbiju i region tacno od 1996. naovamo.
 */

/** Da li JS runtime ume da racuna pomeraj za proizvoljnu IANA zonu. */
export const hasFullIntl: boolean = (() => {
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Belgrade',
      timeZoneName: 'longOffset',
    });
    return f.format(new Date()).includes('GMT');
  } catch {
    return false;
  }
})();

/** Pomeraj zone u minutima za dati trenutak, preko Intl. */
function offsetViaIntl(utc: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(utc);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value; // npr. "GMT+02:00"
    if (!name) return null;
    const m = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    if (!m) return name === 'GMT' ? 0 : null;
    const sign = m[1] === '-' ? -1 : 1;
    return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3] ?? '0', 10));
  } catch {
    return null;
  }
}

/** Poslednja nedelja datog meseca u 01:00 UTC — trenutak prelaska u EU. */
function lastSundayUtc(year: number, month: number): number {
  const d = new Date(Date.UTC(year, month + 1, 0)); // poslednji dan meseca
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return Date.UTC(year, month, d.getUTCDate(), 1, 0, 0);
}

/**
 * Rezervno pravilo za evropske zone: letnje vreme od poslednje nedelje marta
 * do poslednje nedelje oktobra (01:00 UTC). Vazi u EU od 1996.
 */
function offsetEuropeFallback(utc: Date, standardOffsetMinutes: number): number {
  const y = utc.getUTCFullYear();
  const t = utc.getTime();
  const dst = t >= lastSundayUtc(y, 2) && t < lastSundayUtc(y, 9);
  return standardOffsetMinutes + (dst ? 60 : 0);
}

export type TimeZoneInfo = {
  /** IANA ime, npr. "Europe/Belgrade". */
  name: string;
  /** Zimski pomeraj u minutima, npr. 60 za Srbiju. */
  standardOffsetMinutes: number;
  /** Da li zona koristi evropsko pravilo za letnje vreme. */
  europeanDst: boolean;
};

/**
 * Pretvara lokalno vreme rodjenja u UTC.
 *
 * Pomeraj zavisi od trenutka, a trenutak zavisi od pomeraja — zato dve
 * iteracije: prva procena, pa korekcija. Konvergira uvek osim za nepostojeca
 * vremena u satu kad se sat pomera unapred.
 */
export function zoneOffsetMinutes(
  utc: Date,
  tz: TimeZoneInfo,
  /** Za testiranje: preskoci Intl i koristi eksplicitno pravilo. */
  forceFallback = false
): number {
  const viaIntl = !forceFallback && hasFullIntl ? offsetViaIntl(utc, tz.name) : null;
  if (viaIntl !== null) return viaIntl;
  return tz.europeanDst
    ? offsetEuropeFallback(utc, tz.standardOffsetMinutes)
    : tz.standardOffsetMinutes;
}

export function localBirthToUtc(
  year: number,
  month: number, // 1—12
  day: number,
  hour: number,
  minute: number,
  tz: TimeZoneInfo,
  forceFallback = false
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetAt = (ms: number) => zoneOffsetMinutes(new Date(ms), tz, forceFallback);

  let utc = naive - offsetAt(naive) * 60_000;
  utc = naive - offsetAt(utc) * 60_000; // korekcija oko granice prelaska
  return new Date(utc);
}

/** Za prikaz: "UTC+2" / "UTC-5:30". */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}
