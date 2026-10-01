import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/ui/text';
import { NaslovSekcije } from '@/components/naslov-sekcije';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { leaveSheetTo, SheetScroll } from '@/components/sheet';
import { PremiumKartica } from '@/components/zakljucano';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { useTransitTexts } from '@/lib/transit-texts';
import { useKarta } from '@/lib/osobe-api';
import { useEntitlement } from '@/store/auth';
import { tvojDanInfo } from '@/lib/tvoj-dan';
import { trajanjeTranzita } from '@/lib/oblasti';
import { AspektIkona, imaAspekt, type AspektKljuc } from '@/components/aspekt-ikona';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { PLANETA_POTEZ, IkonaTacke } from '@/components/planeta-ikona';
import { TransitTrajanje } from '@/components/transit-trajanje';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { OdeljakIkona } from '@/components/odeljak-ikona';
import { rasporedDuge, vrstaSekcije } from '@/lib/tumacenje';
import { AstrologSlika } from '@/components/astrolog-slika';
import { ASTROLOG } from '@/lib/pitanja';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { useNaMrezi } from '@/lib/mreza';
import { useT } from '@/i18n';



/**
 * Detaljno tumacenje jednog tranzita — duga verzija.
 *
 * Duga verzija stize samo ako korisnik ima aktivan pristup. To NE proverava
 * ova komponenta nego RLS politika u bazi: server jednostavno ne posalje
 * tekst. Ako `long` stigne prazan a `short` nije, znaci da pristup nije
 * placen — i tada se prikazuje kratka verzija sa pozivom na otkljucavanje.
 */
export default function TransitDetail() {
  const t = useT();
  const tx = t.danas.tumacenje;
  // `osoba`: tranzit na kartu druge osobe (strana osobe, 29.9.2026) — bez njega korisnikova karta.
  const { key, osoba } = useLocalSearchParams<{ key: string; osoba?: string }>();
  const resolved = useKarta(osoba);
  const entitlement = useEntitlement();
  const naMrezi = useNaMrezi();

  const kljucevi = React.useMemo(() => (key ? [String(key)] : []), [key]);
  const { texts: duga, loading: dugaLoading } = useTransitTexts(kljucevi, 'long');
  const { texts: kratka } = useTransitTexts(kljucevi, 'short');

  // Sve o tranzitu iz KLJUCA i karte (ne iz trenutnog neba): planete, aspekt,
  // vladar; trajanje isto kao na listi (`trajanjeTranzita`).
  const danas = React.useMemo(() => new Date(), []);
  const tranzit = React.useMemo(
    () => (resolved && key ? tvojDanInfo(resolved.chart, resolved.timeUnknown, String(key)) : null),
    [resolved, key]
  );
  const prozor = React.useMemo(() => (tranzit ? trajanjeTranzita(tranzit, danas) : null), [tranzit, danas]);

  if (!resolved) {
    // Osoba je u medjuvremenu obrisana (ili je drugi nalog) — list to kaze, ne salje na kapiju.
    if (osoba) return <SheetScroll><Text variant="muted">{tx.osobaViseNije}</Text></SheetScroll>;
    return <Redirect href="/" />;
  }

  const puna = duga.get(String(key));
  const sazeta = kratka.get(String(key));

  return (
    // Nativni list odozdo, kao sva tumacenja (`_layout.tsx`, Ivan 28.9.2026).
    <SheetScroll>
          {/* Gore: ikonice levo, ime tranzita GORE DESNO (Ivan, 28.9.2026). Ispod:
              naslov levo i ilustracija aspekta desno, dnom u istoj ravni. */}
          {tranzit && (
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-2">
                <Simbol tacka={tranzit.transiting} />
                <AspektIkona aspekt={tranzit.aspect.key as AspektKljuc} size={15} potez={PLANETA_POTEZ * SIMBOL} />
                <Simbol tacka={tranzit.natal} />
              </View>
              <Text variant="oznaka" className="flex-1 text-right text-foreground">
                {t.danas.tranzit.ime(tranzit.transiting.name, tranzit.aspect.name, tranzit.natal.name)}
              </Text>
            </View>
          )}
          <View className="mt-7 flex-row items-end gap-5">
            {/* Cele reci: duga rec u uskoj koloni smanji naslov umesto da se prelomi (32 -> najmanje 22). */}
            <NaslovCeleReci size={32} lineHeight={38} min={22} className="flex-1">
              {puna?.title || sazeta?.title || tx.tranzit}
            </NaslovCeleReci>
            {tranzit && imaAspekt(tranzit.aspect.key) && (
              <AspektIlustracija
                aspekt={tranzit.aspect.key}
                tranzitna={{ key: tranzit.transiting.key, glyph: tranzit.transiting.glyph, vladar: tranzit.ruler === 'transiting' }}
                natalna={{ key: tranzit.natal.key, glyph: tranzit.natal.glyph, vladar: tranzit.ruler === 'natal' }}
                width={120}
              />
            )}
          </View>
          {/* Traka u svetloj lila, boji ikonica oblasti i izabranog taba (Ivan, 28.9.2026). */}
          {prozor && tranzit && (
            <TransitTrajanje trajanje={prozor} date={danas} className="mt-8" boja={OBLAST_BOJA} opseg />
          )}
          <View className="mb-8" />

          {dugaLoading ? (
            <TextPlaceholder lines={8} />
          ) : puna ? (
            // Redosled (Ivan, 1.10.2026, posle UX recenzije): prva recenica veca i crna, ostatak
            // prvog pasusa sivo, pa stavke (efekti, izazovi, saveti), pa nastavak teksta, pa
            // "Pitaj astrologa". Racun je `rasporedDuge` (`lib/tumacenje.ts`, `check:tumacenje`).
            (() => {
              const r = rasporedDuge(puna.body ?? '', puna.sections);
              const imaNastavak = !!r.nastavakTekst;
              return (
                <>
                  {!!r.uvod && (
                    <Text variant="default" className={cn('text-[20px] leading-[29px] tracking-[-0.2px]', tezina('naslovUTekstu'))}>
                      {r.uvod}
                    </Text>
                  )}
                  {!!r.prviPasus && (
                    <View className={r.uvod ? 'mt-3' : undefined}><TumacenjeTekst tekst={r.prviPasus} /></View>
                  )}
                  {r.odeljci.map((s) => <OdeljakDuge key={s.heading} s={s} />)}
                  {/* Isti naslov kao odeljci iznad, samo bez ikonice (Ivan, 1.10.2026). */}
                  {imaNastavak && (
                    <View className="mt-7">
                      <NaslovSekcije>{tx.viseOTranzitu}</NaslovSekcije>
                      <TumacenjeTekst tekst={r.nastavakTekst} />
                    </View>
                  )}
                  {tranzit && (
                    <PitajOTranzitu
                      tema={`${tranzit.transiting.name} ${tranzit.aspect.name} ${tranzit.natal.name}`}
                      osoba={osoba}
                    />
                  )}
                </>
              );
            })()
          ) : (
            <>
              {!!sazeta?.body && <Text variant="reading">{sazeta.body}</Text>}

              {/* Pristup je placen a duga verzija ipak nije dosla — tekst za
                  ovaj tranzit jos nije u korpusu. Poziv na kupovinu bi tu bio
                  pogresan: nema sta da se otkljuca. */}
              {/* Bez interneta duga verzija nije stigla jer nema veze, ne zato sto je
                  nema — tada se to i kaze (Ivan, 29.9.2026). */}
              {entitlement?.active ? (
                <Text variant="muted" className="mt-6 text-xs">
                  {naMrezi ? tx.nijeNapisano : tx.stizeKadVeza}
                </Text>
              ) : (
                <PremiumKartica
                  izLista
                  ilustracija
                  className="mt-12"
                  // Tekst: verzija 2 od tri (Ivan, 30.9.2026) — iskreno kaze da je gore kratka verzija.
                  naslov={tx.procitajDoKraja}
                  opis={tx.kratkaVerzija}
                  dugme={tx.otkljucajCeo}
                />
              )}
            </>
          )}
    </SheetScroll>
  );
}

/** Precnik crnih ikonica planeta u zaglavlju lista (Ivan: "smanji"). */
const SIMBOL = 26;

/** Crna ikonica planete (ili Asc/MC) za zaglavlje lista — ista i na natalnom tumacenju. */
function Simbol({ tacka }: { tacka: { key: string; glyph: string } }) {
  return <IkonaTacke tacka={tacka} size={SIMBOL} />;
}

/**
 * Odeljak duge verzije: naslov sa ikonicom pa tekst. Svi poznati odeljci imaju Ivanove 3D
 * slike (`OdeljakIkona`); jednokratni naslovi su bez ikonice.
 */
function OdeljakDuge({ s }: { s: { heading: string; body: string } }) {
  const vrsta = vrstaSekcije(s.heading);
  return (
    <View className="mt-7">
      <NaslovSekcije
        ikona={vrsta ? <OdeljakIkona odeljak={vrsta} size={26} /> : undefined}>
        {s.heading}
      </NaslovSekcije>
      <TumacenjeTekst tekst={s.body} />
    </View>
  );
}

/**
 * Kraj lista: pitanje astrologu o ovom tranzitu (Ivan, 1.10.2026). Korisnik je upravo
 * procitao nesto sto se tice njega — najprirodnije mesto za pitanje. Isti izgled kao
 * kartica "Otključaj" (`PremiumKartica`), samo umesto katanca Bobanova slika (Ivan).
 * Cene nema: dolazi samo iz RevenueCat-a (pravilo 21). Pitanje pocinje imenom tranzita.
 */
function PitajOTranzitu({ tema, osoba }: { tema: string; osoba?: string }) {
  const tx = useT().danas.tumacenje;
  return (
    <PremiumKartica
      className="mt-14"
      naslov={tx.pitajNaslov}
      opis={tx.pitajOpis(ASTROLOG.ime, !!osoba)}
      dugme={tx.postaviPitanje}
      znacka={{
        velicina: SLIKA_ASTROLOGA,
        sadrzaj: (
          // Beo obod odvaja sliku od ivice kartice, kao sto indigo krug odvaja katanac.
          // 4 pt navise (Ivan, 1.10.2026) — samo ovde, katanac na Premium kartici ostaje gde je.
          <View className="rounded-full bg-card p-[3px]" style={{ transform: [{ translateY: -4 }] }}>
            <AstrologSlika velicina={SLIKA_ASTROLOGA - 6} />
          </View>
        ),
      }}
      // Prvo uvod (astrolog, uslovi, cena), pa pisanje — kao "Postavi pitanje" na tabu Pitaj (Ivan, 1.10.2026).
      onPress={() => leaveSheetTo({ pathname: '/pitanje-novo', params: osoba ? { korak: 'uvod', tema, osoba } : { korak: 'uvod', tema } })}
    />
  );
}

/** Precnik Bobanove slike na kartici (sa belim obodom) — veci od kruga sa katancem, da se lice vidi. */
const SLIKA_ASTROLOGA = 64;
