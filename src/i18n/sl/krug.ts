import type { Recnik } from '../sr';

/** Kolo življenja na začetnem zaslonu in list področja. Enaka oblika kot `sr/krug.ts`. */
export const krug: Recnik['krug'] = {
  naslov: 'Tvoje življenje danes',
  /** Naslov kad je izabran drugi dan ("danas" ne stoji uz datum sutra). */
  naslovDrugiDan: 'Tvoje življenje',
  oblasti: {
    karijera: 'Kariera',
    finansije: 'Finance',
    zdravlje: 'Zdravje',
    porodica: 'Družina',
    partner: 'Partner',
    licni_razvoj: 'Osebna rast',
    zabava: 'Zabava',
    prijateljstvo: 'Prijateljstvo',
  },
  stanja: { pritisak: 'Zahtevno', oprez: 'Previdno', mirno: 'Uravnoteženo', raste: 'Ugodno', procvat: 'Odlično' },
  danas: 'Danes',
  nedelja: 'Ta teden',
  saznajVise: 'Izvedi več',
  nemaUticaja: 'Danes ni močnega vpliva na to področje.',
  zakljucanaRecenica: 'Poved za danes je z Premium.',
  stavkeNaslov: 'Kaj vpliva',
  josTranzita: (n, tranzita) => `še ${n} ${tranzita} na tem področju`,
  sedamDana: 'Naslednjih 7 dni',
  linijaNeutralno: 'Črta je nevtralen dan (3).',
  zakljucanList: 'Podrobnosti tega področja so z Premium. Stanje in današnja moč sta odprta.',
  zakljucanoUPremium: 'Jutri, naslednjih 7 dni in celoten tranzit so z Premium.',
  oblastA11y: (oblast, stanje, ocena) => `${oblast}, ${stanje}, ${ocena} od 5`,
  oblastZakljucanaA11y: (oblast, stanje) => `${oblast}, ${stanje}, podrobnosti z Premium`,
  /** Promena ocene u odnosu na prethodni dan (strelica na kartici oblasti; cita ga citac ekrana). */
  odJuce: { gore: 'višje kot včeraj', dole: 'nižje kot včeraj' },
  znakSunca: (znak) => `Znak Sonca: ${znak}`,
  podznak: (znak) => `Dvignjeni znak: ${znak}`,
};
