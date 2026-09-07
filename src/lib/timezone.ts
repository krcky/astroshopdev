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
/**
 * Da li runtime ume da izracuna pomeraj za proizvoljnu IANA zonu.
 *
 * Ne proverava se da li poziv PROLAZI nego da li daje TACAN rezultat, na dva
 * poznata slucaja: Beograd u julu mora biti +120, u januaru +60. Hermes na
 * nekim uredjajima prihvata opciju ali vraca beskoristan odgovor — takav
 * runtime mora da padne na eksplicitno pravilo, a ne da tiho gresi.
 */
export const hasFullIntl: boolean = (() => {
  try {
    const leto = rawOffsetViaIntl(new Date(Date.UTC(2020, 6, 1, 12)), 'Europe/Belgrade');
    const zima = rawOffsetViaIntl(new Date(Date.UTC(2020, 0, 1, 12)), 'Europe/Belgrade');
    return leto === 120 && zima === 60;
  } catch {
    return false;
  }
})();

/** Pomeraj zone u minutima za dati trenutak, preko Intl. Null ako ne zna. */
function rawOffsetViaIntl(utc: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(utc);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value; // npr. "GMT+02:00"
    if (!name) return null;
    const m = name.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    // Goli "GMT" NE znaci nulti pomeraj. Runtime koji ne ume da izracuna
    // pomeraj za trazenu zonu vraca upravo to. Ako bismo ga procitali kao 0,
    // dobili bismo pogresnu kartu koja izgleda ispravno — najgora greska.
    // Zato: ne znamo -> null -> ide se na eksplicitno pravilo.
    if (!m) return null;
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
 * Rezervno pravilo za evropske zone.
 *
 * Pocetak je uvek poslednja nedelja marta u 01:00 UTC. KRAJ SE MENJAO:
 * do 1995. zakljucno letnje vreme se zavrsavalo poslednje nedelje SEPTEMBRA,
 * a od 1996. poslednje nedelje OKTOBRA. Bez te razlike svako rodjenje u
 * oktobru pre 1996. dobija sat viska — sto pomera ascendent za 15 stepeni.
 */
function offsetEuropeFallback(utc: Date, standardOffsetMinutes: number): number {
  const y = utc.getUTCFullYear();
  const t = utc.getTime();
  const krajMeseca = y >= 1996 ? 9 : 8; // oktobar : septembar
  const dst = t >= lastSundayUtc(y, 2) && t < lastSundayUtc(y, krajMeseca);
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
  const viaIntl = !forceFallback && hasFullIntl ? rawOffsetViaIntl(utc, tz.name) : null;
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
