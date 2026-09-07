/**
 * Gradovi za onboarding — mesto rodjenja daje geografsku sirinu i duzinu,
 * bez kojih nema ascendenta ni kuca.
 *
 * Namerno je ugradjena lista umesto geokodiranja preko API-ja: radi offline,
 * bez kljuceva i bez troska, a pokriva Srbiju, region i najvecu dijasporu.
 * Kad zatreba siri opseg, ovde se ubacuje geokoder — potpis `searchCities`
 * ostaje isti.
 */
import type { TimeZoneInfo } from '@/lib/timezone';

const CET: TimeZoneInfo = { name: 'Europe/Belgrade', standardOffsetMinutes: 60, europeanDst: true };
const tzEU = (name: string, std = 60): TimeZoneInfo => ({ name, standardOffsetMinutes: std, europeanDst: true });
const tz = (name: string, std: number): TimeZoneInfo => ({ name, standardOffsetMinutes: std, europeanDst: false });

export type City = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  tz: TimeZoneInfo;
};

export const CITIES: City[] = [
  // Srbija
  { name: 'Beograd', country: 'Srbija', latitude: 44.7866, longitude: 20.4489, tz: CET },
  { name: 'Novi Sad', country: 'Srbija', latitude: 45.2671, longitude: 19.8335, tz: CET },
  { name: 'Niš', country: 'Srbija', latitude: 43.3209, longitude: 21.8958, tz: CET },
  { name: 'Kragujevac', country: 'Srbija', latitude: 44.0128, longitude: 20.9114, tz: CET },
  { name: 'Subotica', country: 'Srbija', latitude: 46.1001, longitude: 19.6651, tz: CET },
  { name: 'Zrenjanin', country: 'Srbija', latitude: 45.3836, longitude: 20.3819, tz: CET },
  { name: 'Pančevo', country: 'Srbija', latitude: 44.8708, longitude: 20.6403, tz: CET },
  { name: 'Čačak', country: 'Srbija', latitude: 43.8914, longitude: 20.3497, tz: CET },
  { name: 'Kruševac', country: 'Srbija', latitude: 43.5806, longitude: 21.3269, tz: CET },
  { name: 'Kraljevo', country: 'Srbija', latitude: 43.7256, longitude: 20.6892, tz: CET },
  { name: 'Novi Pazar', country: 'Srbija', latitude: 43.1367, longitude: 20.5122, tz: CET },
  { name: 'Smederevo', country: 'Srbija', latitude: 44.6633, longitude: 20.9289, tz: CET },
  { name: 'Leskovac', country: 'Srbija', latitude: 42.9981, longitude: 21.9461, tz: CET },
  { name: 'Valjevo', country: 'Srbija', latitude: 44.2708, longitude: 19.8908, tz: CET },
  { name: 'Užice', country: 'Srbija', latitude: 43.8556, longitude: 19.8425, tz: CET },
  { name: 'Vranje', country: 'Srbija', latitude: 42.5514, longitude: 21.9008, tz: CET },
  { name: 'Šabac', country: 'Srbija', latitude: 44.7489, longitude: 19.6906, tz: CET },
  { name: 'Sombor', country: 'Srbija', latitude: 45.7742, longitude: 19.1122, tz: CET },
  { name: 'Požarevac', country: 'Srbija', latitude: 44.6217, longitude: 21.1856, tz: CET },
  { name: 'Pirot', country: 'Srbija', latitude: 43.1531, longitude: 22.5861, tz: CET },
  { name: 'Zaječar', country: 'Srbija', latitude: 43.9042, longitude: 22.2794, tz: CET },
  { name: 'Sremska Mitrovica', country: 'Srbija', latitude: 44.9769, longitude: 19.6122, tz: CET },
  { name: 'Jagodina', country: 'Srbija', latitude: 43.9772, longitude: 21.2611, tz: CET },
  { name: 'Priština', country: 'Srbija', latitude: 42.6629, longitude: 21.1655, tz: CET },

  // Region
  { name: 'Podgorica', country: 'Crna Gora', latitude: 42.4304, longitude: 19.2594, tz: tzEU('Europe/Podgorica') },
  { name: 'Sarajevo', country: 'BiH', latitude: 43.8563, longitude: 18.4131, tz: tzEU('Europe/Sarajevo') },
  { name: 'Banja Luka', country: 'BiH', latitude: 44.7722, longitude: 17.1910, tz: tzEU('Europe/Sarajevo') },
  { name: 'Zagreb', country: 'Hrvatska', latitude: 45.8150, longitude: 15.9819, tz: tzEU('Europe/Zagreb') },
  { name: 'Split', country: 'Hrvatska', latitude: 43.5081, longitude: 16.4402, tz: tzEU('Europe/Zagreb') },
  { name: 'Skoplje', country: 'S. Makedonija', latitude: 41.9981, longitude: 21.4254, tz: tzEU('Europe/Skopje') },
  { name: 'Ljubljana', country: 'Slovenija', latitude: 46.0569, longitude: 14.5058, tz: tzEU('Europe/Ljubljana') },
  { name: 'Sofija', country: 'Bugarska', latitude: 42.6977, longitude: 23.3219, tz: tzEU('Europe/Sofia', 120) },
  { name: 'Temišvar', country: 'Rumunija', latitude: 45.7489, longitude: 21.2087, tz: tzEU('Europe/Bucharest', 120) },
  { name: 'Budimpešta', country: 'Mađarska', latitude: 47.4979, longitude: 19.0402, tz: tzEU('Europe/Budapest') },
  { name: 'Solun', country: 'Grčka', latitude: 40.6401, longitude: 22.9444, tz: tzEU('Europe/Athens', 120) },

  // Dijaspora
  { name: 'Beč', country: 'Austrija', latitude: 48.2082, longitude: 16.3738, tz: tzEU('Europe/Vienna') },
  { name: 'Cirih', country: 'Švajcarska', latitude: 47.3769, longitude: 8.5417, tz: tzEU('Europe/Zurich') },
  { name: 'Minhen', country: 'Nemačka', latitude: 48.1351, longitude: 11.5820, tz: tzEU('Europe/Berlin') },
  { name: 'Berlin', country: 'Nemačka', latitude: 52.5200, longitude: 13.4050, tz: tzEU('Europe/Berlin') },
  { name: 'Frankfurt', country: 'Nemačka', latitude: 50.1109, longitude: 8.6821, tz: tzEU('Europe/Berlin') },
  { name: 'Pariz', country: 'Francuska', latitude: 48.8566, longitude: 2.3522, tz: tzEU('Europe/Paris') },
  { name: 'London', country: 'V. Britanija', latitude: 51.5074, longitude: -0.1278, tz: tzEU('Europe/London', 0) },
  { name: 'Amsterdam', country: 'Holandija', latitude: 52.3676, longitude: 4.9041, tz: tzEU('Europe/Amsterdam') },
  { name: 'Stokholm', country: 'Švedska', latitude: 59.3293, longitude: 18.0686, tz: tzEU('Europe/Stockholm') },
  { name: 'Rim', country: 'Italija', latitude: 41.9028, longitude: 12.4964, tz: tzEU('Europe/Rome') },
  { name: 'Milano', country: 'Italija', latitude: 45.4642, longitude: 9.1900, tz: tzEU('Europe/Rome') },
  { name: 'Moskva', country: 'Rusija', latitude: 55.7558, longitude: 37.6173, tz: tz('Europe/Moscow', 180) },

  // Prekookeanski
  { name: 'Njujork', country: 'SAD', latitude: 40.7128, longitude: -74.0060, tz: tz('America/New_York', -300) },
  { name: 'Čikago', country: 'SAD', latitude: 41.8781, longitude: -87.6298, tz: tz('America/Chicago', -360) },
  { name: 'Los Anđeles', country: 'SAD', latitude: 34.0522, longitude: -118.2437, tz: tz('America/Los_Angeles', -480) },
  { name: 'Toronto', country: 'Kanada', latitude: 43.6532, longitude: -79.3832, tz: tz('America/Toronto', -300) },
  { name: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, tz: tz('Asia/Dubai', 240) },
  { name: 'Sidnej', country: 'Australija', latitude: -33.8688, longitude: 151.2093, tz: tz('Australia/Sydney', 600) },
];

/** Skida dijakritike da pretraga radi i kad se kuca bez kvacica ("nis" -> "Niš"). */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'd')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function searchCities(query: string, limit = 8): City[] {
  const q = fold(query.trim());
  if (!q) return CITIES.slice(0, limit);

  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const n = fold(c.name);
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q) || fold(c.country).includes(q)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

export function cityByName(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}
