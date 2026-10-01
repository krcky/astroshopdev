import * as React from 'react';
import { AppState, Platform, View } from 'react-native';
import Animated, { makeMutable, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { tr } from '@/i18n/jezik';
import { KARTICA, KarticaKraj } from '@/components/prica/kartica';
import { ZAVESA } from '@/components/prica/crtezi';
import { PlatnoVidea, type PlatnoVideaRef } from '@/components/prica/platno-videa';
import { SatSlike, VremeVidea } from '@/components/prica/sat';
import { otvoriVideo } from '@/components/prica/video-traka';
import { kadarVidea, poluprecnikKruga, rasporedVidea, VIDEO } from '@/lib/prica';
import { poslednjiDodir } from '@/store/budnost';
import { fajlVidea, folderVidea, useVideoPrice, type PosaoVidea, type VrstaVidea } from '@/store/video-price';

/**
 * RADIONICA VIDEA PRICE (Ivan, 30.9.2026): cela prica, SA svim pokretima, kao MP4 —
 * dok korisnik radi sta hoce u aplikaciji. Kad je gotov: obavestenje i traka iznad tabova
 * (`video-traka.tsx`), a video je na listu `/video-price`.
 *
 * ZA SVAKU PRICU (1.10.2026): radionica zna samo `PosaoVidea` — kartice po redu i koliko koja traje
 * (`poslovi-videa.tsx`: dnevna, o znaku). Posle poslednje kartice ide zavrsni kadar sa logom.
 *
 * Kako: karta za deljenje (`kartica.tsx`, 360 × 640, prvo lice, datum i logo) crta se
 * VAN EKRANA u nativno platno (`modules/video-price`). Za svaki kadar se sat slike
 * (`sat.tsx`) postavi na tacno taj trenutak, saceka se da se kadar nacrta, i platno ga
 * preda koderu. Zato je svaki kadar tacan koliko god snimanje trajalo (provereno na
 * brojacu kadrova, 30.9.2026) — prica i video imaju ista vremena.
 *
 *  - STAJE kratko posle svakog dodira, da snimanje ne trza skrol, i nastavlja sama.
 *  - IZLAZAK IZ APLIKACIJE = POCETAK ISPOCETKA, sa novim karticama (provereno u simulatoru,
 *    30.9.2026): iOS u pozadini ugasi koder, a posle povratka su trake i broj na naslovnoj
 *    skocili nazad na stanje od pre izlaska i tako ostali do kraja slike (vrednost im se
 *    vise ne menja, pa ih nista ne ispravi). Prekid se ne broji kao greska.
 *  - Prava greska (koder, fajl): ispocetka, najvise tri puta, pa "Video nije uspeo".
 *  - Na kraju ZAVRSNI KADAR (logo i astroshop.rs, `KarticaKraj`, ~2 s), sa istim prelazom krugom.
 *  - Samo jedan posao; nov posao brise stari fajl (`store/video-price.ts`).
 *  - SVE SLIKE SE MONTIRAJU PRE PRVOG KADRA, skrivene (krug 0), i tokom snimanja React nista ne
 *    crta iznova — samo se menjaju satovi i krugovi (Ivan, 30.9.2026: "nesto isfleshira" na svakom
 *    prelazu). Do tada se nova slika montirala tek na prelazu: prva dva kadra su pokazala nju u
 *    obliku zvezde (zaobljenje od punog kruga na sloju od 0 pt, pa `layer.render(in:)` nacrta
 *    putanju koja sama sebe sece), a donja slika, crtana iznova zbog novog `r`, vratila se na
 *    pocetno stanje ("Su…" umesto celog naslova). Isti uzrok kao skok posle izlaska iz aplikacije.
 */

/** Kako platno crta kadar: `sloj` (CALayer, CPU) je ~2x brzi od `hijerarhija`, isti kadar. */
const NACIN: 'sloj' | 'hijerarhija' = 'sloj';
/** Posle dodira snimanje stoji ovoliko (ms): skrol i prelazi idu glatko. */
const POSLE_DODIRA = 1500;
/** Posle montiranja slika: vreme za raspored i slike (lokalne, vec dekodirane). */
const NOVA_SLIKA_MS = 250;
const POKUSAJA = 3;

/** Aplikacija je izasla iz prvog plana — kadrovi posle toga nisu pouzdani. (Jedan objekat, ne
 * podklasa `Error`-a: `instanceof` na podklasi ugradjene klase ume da ne radi posle Babel-a.) */
const PREKID = new Error('prekid');

/** Krug prelaza, u koordinatama kartice — isto mesto kao kad prica sama ide dalje. */
const KX = KARTICA.w * VIDEO.krugX;
const KY = KARTICA.h * VIDEO.krugY;
const KR = poluprecnikKruga(KARTICA.w, KARTICA.h, KX, KY);

/** Za koliko se krug "gurne" posle montiranja, da se stil sigurno primeni na vec napravljen pogled. */
const GURNI = 0.01;

const cekaj = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Dva kadra: sat postavljen iz JS-a stize na UI nit, pa se kadar nacrta. */
const dvaKadra = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Ceka dok aplikacija nije u prvom planu i dok korisnik upravo nesto dira. */
async function dozvola(otkazano: () => boolean) {
  while (!otkazano() && (AppState.currentState !== 'active' || Date.now() - poslednjiDodir() < POSLE_DODIRA)) {
    await cekaj(200);
  }
}

/** Korenska radionica — montira se u `_layout.tsx`, crta samo dok se video pravi. */
export function VideoRadionica() {
  const posao = useVideoPrice((s) => s.posao);
  if (!PlatnoVidea || !posao) return null;
  // Nov posao = nova radionica (kljuc), bez ostataka prethodnog.
  return <Radionica key={`${posao.vrsta}-${posao.kljuc}`} posao={posao} />;
}

function Radionica({ posao }: { posao: PosaoVidea }) {
  const Platno = PlatnoVidea!;
  const platno = React.useRef<PlatnoVideaRef>(null);
  // Kartice price, pa zavrsni kadar sa logom (indeks `posao.trajanja.length`).
  const raspored = React.useMemo(() => rasporedVidea(posao.trajanja, VIDEO.zavrsni), [posao]);
  // Posle prekida kartice se montiraju iznova (nov kljuc) — bez ostataka od pre izlaska.
  const [pokusaj, setPokusaj] = React.useState(0);
  const slika = raspored.pocetak.length;

  // Sat svake slike i poluprecnik njenog kruga: 0 = skrivena, KR = cela. Svaka ima SVOJ, da se sloj
  // nikad ne crta iznova. Broj slika zavisi od price (dnevna 7, znak 10), pa `makeMutable`, ne hook po slici.
  const satovi = React.useMemo(() => Array.from({ length: slika }, () => makeMutable(0)), [slika]);
  const krugovi = React.useMemo(() => Array.from({ length: slika }, (_, j) => makeMutable(j === 0 ? KR : 0)), [slika]);
  // Vreme od prvog kadra — za krug loga, koji se vrti kroz ceo video (`logo-price.tsx`).
  const vreme = useSharedValue(0);

  React.useEffect(() => {
    let otkazano = false;
    let prekinuto = false;
    const jeOtkazano = () => otkazano;
    const { javiNapredak, gotovo, neuspeh } = useVideoPrice.getState();
    const pratiApp = AppState.addEventListener('change', (st) => { if (st !== 'active') prekinuto = true; });

    const snimi = async () => {
      const ja = platno.current;
      if (!ja) throw new Error('nema platna');
      prekinuto = AppState.currentState !== 'active';
      javiNapredak(0);
      folderVidea().create({ intermediates: true, idempotent: true });
      const fajl = fajlVidea(posao.ime);
      // Pocetno stanje: prva slika cela, ostale skrivene, svi satovi na nuli. Slike su vec
      // montirane (i posle prekida — nov `pokusaj`, nove kartice); daj im vreme za raspored i slike.
      const krugSada = krugovi.map(() => -1);
      const krugNa = (j: number, r: number) => {
        if (krugSada[j] === r) return;
        krugSada[j] = r;
        krugovi[j].set(r);
      };
      satovi.forEach((sat) => sat.set(0));
      vreme.set(0);
      await cekaj(NOVA_SLIKA_MS * 4);
      // Krug se "gurne" i vrati, da mapper stila sigurno prodje posle montiranja pogleda.
      for (let j = 0; j < slika; j++) krugNa(j, (j === 0 ? KR : 0) + GURNI);
      await dvaKadra();
      for (let j = 0; j < slika; j++) krugNa(j, j === 0 ? KR : 0);
      await dvaKadra();
      await ja.pocni(fajl.uri, VIDEO.sirina, VIDEO.visina, VIDEO.fps, VIDEO.bitrate);
      for (let f = 0; f < raspored.kadrova; f++) {
        await dozvola(jeOtkazano);
        if (otkazano) return null;
        if (prekinuto) throw PREKID;
        const k = kadarVidea(raspored, f);
        vreme.set((f * 1000) / VIDEO.fps);
        satovi[k.gore.i].set(k.gore.sat);
        if (k.dole) satovi[k.dole.i].set(k.dole.sat);
        // Gornja se otkriva krugom, donja je cela dok traje prelaz, ostale su skrivene.
        for (let j = 0; j < slika; j++) {
          krugNa(j, j === k.gore.i ? KR * ZAVESA(k.prelaz) : j === k.dole?.i ? KR : 0);
        }
        await dvaKadra();
        if (otkazano) return null;
        await ja.kadar(f, NACIN);
        // Kadar snimljen dok je app izlazila iz prvog plana nije pouzdan.
        if (prekinuto) throw PREKID;
        if (f % 10 === 0) javiNapredak(f / raspored.kadrova);
      }
      return ja.zavrsi();
    };

    (async () => {
      let greske = 0;
      while (!otkazano) {
        try {
          const uri = await snimi();
          if (otkazano || !uri) return;
          gotovo(uri);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          void obavesti(posao);
          return;
        } catch (e) {
          // U log (Console.app na Mac-u, i u Release buildu), da se neuspeh na telefonu moze procitati.
          if (e !== PREKID) console.warn('[video price] pokusaj nije uspeo:', e instanceof Error ? e.message : String(e));
          try { await platno.current?.otkazi(); } catch { /* nista */ }
          if (otkazano) return;
          if (e !== PREKID && ++greske >= POKUSAJA) break;
          // Kad se korisnik vrati: nove kartice, pa od prvog kadra.
          await dozvola(jeOtkazano);
          setPokusaj((n) => n + 1);
          await cekaj(NOVA_SLIKA_MS);
        }
      }
      if (!otkazano) neuspeh();
    })();

    return () => {
      otkazano = true;
      pratiApp.remove();
      platno.current?.otkazi().catch(() => {});
    };
  }, [posao, raspored, satovi, krugovi, vreme, slika]);

  const sve = React.useMemo(() => Array.from({ length: slika }, (_, i) => i), [slika]);
  return (
    // Van ekrana: korisnik je ne vidi, VoiceOver je ne nalazi, dodir ne stize.
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: -2 * KARTICA.w - 100, top: 0, width: KARTICA.w, height: KARTICA.h }}>
      <Platno ref={platno} collapsable={false} style={{ width: KARTICA.w, height: KARTICA.h }}>
        <VremeVidea vreme={vreme}>
          {/* Redom: kasnija slika je iznad ranije, pa se nova uvek otkriva preko prethodne. */}
          {sve.map((i) => (
            <Sloj key={`${pokusaj}-${i}`} posao={posao} i={i} sat={satovi[i]} r={krugovi[i]} />
          ))}
        </VremeVidea>
      </Platno>
    </View>
  );
}

/**
 * Jedna slika u krugu (kao `Otkrivanje` u `app/prica.tsx`). `memo`: svi propovi su stalni, pa se
 * sloj posle montiranja nikad ne crta iznova — novo crtanje bi vratilo pokrete na pocetne vrednosti.
 * Skrivena (krug 0) je i providna: tada se ne crta nista, ni ako raspored jos kasni.
 */
const Sloj = React.memo(function Sloj({ posao, i, sat, r }: { posao: PosaoVidea; i: number; sat: SharedValue<number>; r: SharedValue<number> }) {
  const spolja = useAnimatedStyle(() => {
    const rr = Math.max(0, r.get());
    return { left: KX - rr, top: KY - rr, width: 2 * rr, height: 2 * rr, borderRadius: rr, opacity: rr > 0 ? 1 : 0 };
  });
  const unutra = useAnimatedStyle(() => ({ left: r.get() - KX, top: r.get() - KY }));
  return (
    <Animated.View style={[{ position: 'absolute', overflow: 'hidden' }, spolja]}>
      <Animated.View style={[{ position: 'absolute', width: KARTICA.w, height: KARTICA.h }, unutra]}>
        <SatSlike sat={sat}>
          {i < posao.trajanja.length ? posao.kartica(i) : <KarticaKraj />}
        </SatSlike>
      </Animated.View>
    </Animated.View>
  );
});

/* ------------------------------------------------------------------------- *
 * Obavestenje: "Tvoj video je spreman"
 * ------------------------------------------------------------------------- */

const VRSTA = 'video-price';
const KANAL = 'video-price';

/** Lokalno obavestenje — i dok je aplikacija otvorena (`ObavestenjeVidea`). Bez dozvole nista; traka i dalje javlja. */
async function obavesti(posao: PosaoVidea) {
  try {
    const d = await Notifications.getPermissionsAsync();
    const moze = d.granted || d.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!moze) return;
    // Android 8+: obavestenje ide kroz kanal (korisnik ga moze iskljuciti posebno u podesavanjima).
    // HIGH = iskoci na vrhu ekrana, kao baner na iOS-u; bez zvuka i vibracije, kao i tamo.
    // Vaznost kanala se posle prvog pravljenja ne moze menjati iz aplikacije — samo nov kanal.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(KANAL, {
        name: tr().prica.posao.kanal,
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        enableVibrate: false,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: tr().prica.posao.obavestenjeNaslov,
        body: tr().prica.posao.obavestenjeTekst(posao.opis),
        data: { vrsta: VRSTA, video: posao.vrsta },
      },
      trigger: Platform.OS === 'android' ? { channelId: KANAL } : null,
    });
  } catch { /* nista — traka iznad tabova i dalje javlja */ }
}

/**
 * Pre prvog videa: ako korisnik jos nije odgovorio na obavestenja (npr. nalog od pre
 * koraka `push.tsx`), iOS ga pita SADA — tada zna zasto. Ko je odbio, ne pita se ponovo.
 */
export async function pitajZaObavestenje() {
  try {
    const d = await Notifications.getPermissionsAsync();
    if (d.status === 'undetermined') await Notifications.requestPermissionsAsync();
  } catch { /* nista */ }
}

/**
 * Korenski slusalac (`_layout.tsx`): obavestenje o videu se pokaze i dok je aplikacija
 * otvorena (druga obavestenja ne — isto kao do sada), a dodir otvara list sa videom.
 */
export function ObavestenjeVidea() {
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.setNotificationHandler({
      handleNotification: async (n) => {
        const nase = (n.request.content.data as { vrsta?: string } | undefined)?.vrsta === VRSTA;
        return { shouldShowBanner: nase, shouldShowList: nase, shouldPlaySound: false, shouldSetBadge: false };
      },
    });
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const podaci = r.notification.request.content.data as { vrsta?: string; video?: VrstaVidea } | undefined;
      if (podaci?.vrsta !== VRSTA) return;
      try { otvoriVideo(podaci.video === 'znak' ? 'znak' : 'dan'); } catch { /* navigacija jos nije montirana */ }
    });
    return () => sub.remove();
  }, []);
  return null;
}
