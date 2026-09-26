# Dizajn sistem

Izveden iz snimaka ekrana referentne aplikacije (Luma, iOS, iPhone 15/16 Pro —
1179x2556 px, @3x). Nijedna vrednost ovde nije pretpostavljena: boje su ocitane
kao modalna vrednost piksela unutar povrsine elementa, mere kao bounding box
podeljen sa 3, a velicine slova izvedene iz visine verzala na snimku.

Izvor istine je **`src/theme/tokens.ts`**. `src/global.css` i `tailwind.config.js`
su prepis istih brojeva u oblik koji NativeWind razume. Menja se prvo tokens.ts.

---

## 1. Pismo

**Sistemsko** — SF Pro na iOS-u, Roboto na Androidu. `fontFamily` se nigde ne
postavlja; React Native bez nje uzme sistemsko pismo. Debljina ide obicnim
Tailwind klasama za tezinu (`font-medium`, `font-semibold`, `font-bold`), sto sa
sistemskim pismom radi kako treba.

### Kako je odluceno

Sa snimaka se pismo NE moze pouzdano prepoznati. Merenja:

| metoda | Inter | SF Pro | Helvetica Neue |
|---|---|---|---|
| poklapanje oblika (IoU, 46 slova iz tri reci) | **0,863** | 0,832 | 0,852 |
| odnos x-visine prema verzalu (snimak: 0,7348) | 0,7500 | **0,7431** | 0,7200 |

Oblici vuku ka Inter-u za dlaku, proporcije ka SF Pro-u za dlaku. Na verzalu od
44 px sa greskom merenja od ±1 px obe razlike su **unutar suma** — Inter i
SF Pro se sa ovih snimaka ne razlikuju. Jedino sto se pouzdano iskljucuje je
Helvetica Neue: noga slova `R` daje 0,63 prema 0,86 kod ostala dva.

Presudila je druga vrsta dokaza: referentna aplikacija je nativna iOS
aplikacija, a izvedene velicine padaju tacno na iOS-ovu lestvicu (17 body,
15 subheadline, 13 footnote, 11 caption2). To je sistemsko pismo, ne uvezeno.

Uz to, sistemsko pismo je i prakticno bolje: 0 KB u bundle-u umesto 1,3 MB za
cetiri reza Inter-a, Dynamic Type i opticke velicine rade same, i `fontWeight`
ponovo radi — kod uvezenog pisma je svaki rez zasebna familija pa bi debljina
morala kroz cetiri `font-*` klase.

Cena je jedina stvarna mana: iOS i Android ne izgledaju identicno. Roboto je
takodje neutralan grotesk, a korisnik ne uporedjuje dva telefona.

### Skala

Za svaki stil je izmerena visina verzala na snimku, pa je potrazena velicina
SF Pro-a (sa optickom velicinom = toj velicini) ciji je verzal tacno toliko
visok. Visina reda 15/20 je izmerena direktno (dva puta, 60 px vrh-do-vrha);
ostalo prati iOS-ovu lestvicu, na koju izvedene velicine i inace padaju.

| varijanta | klasa | cap (pt) | velicina / red | tezina | boja |
|---|---|---|---|---|---|
| `title` | `text-title` | 14,67 | 21 / 26 | bold | ink |
| `section` | `text-section` | 14,00 | 20 / 25 | bold | ink |
| `nav` | `text-nav` | 12,67 | 18 / 23 | semibold | ink |
| `row` | `text-row` | 12,00 | 17 / 22 | medium | ink |
| dugme | `text-button` | — | 17 / 22 | semibold | belo |
| `label` | `text-group` | 12,00 | 17 / 22 | medium | subtle |
| `default` | `text-body` | — | 15 / 20 | regular | ink |
| `body` | `text-body` | 10,33 | 15 / 20 | regular | muted |
| `chip` | `text-chip` | 10,67 | 15 / 20 | medium | ink |
| `muted` | `text-meta` | 10,33 | 15 / 20 | regular | muted |
| `caption` | `text-caption` | 9,33 | 13 / 18 | regular | muted |
| `tab` | `text-tab` | — | 11 / 13 | medium | subtle |

Naslov u navigacionoj traci je **18**, ne iOS-ovih podrazumevanih 17 —
izmereni verzal od 38 px na 17pt bi bio 35,9 px.

Naslov grupe (`label`) je **obicnim slovima**, siv, bez razmaka medju slovima.
Referentna aplikacija nema nijedan verzalni natpis — "Preferences" i
"Resources" su recenice, ne naljepnice.

## 2. Boje

Interfejs je crno-beo. Boja postoji na tacno dva mesta: kvadraticu ikone u redu
i mehuricu poruke. Nigde drugde.

### Neutralna osnova

| token | hex | klasa | gde |
|---|---|---|---|
| white | `#FFFFFF` | `bg-background` | pozadina ekrana |
| grouped | `#F6F7F8` | `bg-grouped` | ekran sa grupisanim karticama |
| fill | `#F5F5F5` | `bg-fill`, `bg-input` | polje za unos, kruzna ikona |
| fillStrong | `#EBEBEB` | `bg-fill-strong` | aktivna kapsula u traci |
| separator | `#F0F0F0` | `border-border` | linija razdvajanja, 1pt |
| ink | `#151515` | `text-foreground` | glavni tekst, primarno dugme |
| inkMuted | `#727273` | `text-muted-foreground` | opisi, meta podaci |
| inkSubtle | `#9C9C9D` | `text-subtle` | placeholder, naslov grupe, neaktivan tab |

Glavni tekst **nije cisto crno**. `#000000` na `#FFFFFF` na OLED ekranu "zvoni";
`#151515` ne.

### Akcenti

Samo na kvadraticima ikona (28pt) i mehuricu poruke. Simbol u kvadraticu je
uvek beo — boja oznacava vrstu stavke, ne privlaci paznju na sebe.

| token | hex | klasa |
|---|---|---|
| blue | `#427CF6` | `bg-tint-blue` |
| blueIcon | `#3773F6` | `bg-tint-blue-icon` |
| purple | `#6F3CF6` | `bg-tint-purple` |
| red | `#EB4743` | `bg-tint-red` |
| green | `#6ECF6F` | `bg-tint-green` |
| pink | `#EB3C86` | `bg-tint-pink` |
| yellow | `#F4C844` | `bg-tint-yellow` |
| gray | `#9A9C9D` | `bg-tint-gray` |
| black | `#14171B` | `bg-tint-black` |

Zlatna (`--gold`) ostaje izvan ovog sistema — po pravilu 2 u `CLAUDE.md` sluzi
ISKLJUCIVO kao akcenat na placenom sadrzaju.

---

## 3. Mere

### Poluprecnici

| token | vrednost | gde |
|---|---|---|
| `rounded-tile` | 8 | kvadratic ikone |
| `rounded-bubble` | 16 | mehuric poruke |
| `rounded-lg` | 24 | kartica, panel, grupa redova |
| `rounded-pill` | puna kapsula | dugme, polje, kapsula kategorije, traka |

Referentna aplikacija ima samo dve prave vrednosti: **24** i **kapsula**. Posto
su dugme (50pt) i polje (48pt) niski, 24 na njima izgleda kao kapsula — u kodu
se pisu kao kapsula da se ne razidju kad se visina promeni.

### Visine

| token | vrednost |
|---|---|
| `h-button` | 50 |
| `h-button-compact` | 46 |
| `h-field` | 48 |
| `min-h-row` | 57 |
| `h-chip` | 40 |
| `h-header-button` / `w-header-button` | 40 |
| `h-tile` / `w-tile` | 28 |
| lebdeca traka | 65 |

### Razmaci

`px-screen` = **20** — leva i desna margina svakog ekrana. Kartica, dugme i
polje pocinju tacno tu.
`p-gutter` = **16** — unutrasnji razmak u kartici i redu.

### Senke

Referentna aplikacija ih koristi stedljivo:

- `shadow.soft` — belo dugme na beloj pozadini (zaglavlje, "Skip", neaktivno
  dugme). Ta dugmad **nemaju ivicu**: skeniranje piksela poprecno kroz dugme ne
  pokazuje skok u boji, nego mek prelaz sa `#FFFFFF` na `#F9F8F9` ka sredini.
- `shadow.floating` — lebdeca traka na dnu.
- Kartice na sivoj pozadini **nemaju nijednu senku**. Razdvaja ih razlika u
  boji.

---

## 4. Komponente

| komponenta | fajl |
|---|---|
| `Text` | `src/components/ui/text.tsx` |
| `Button` | `src/components/ui/button.tsx` |
| `Input` | `src/components/ui/input.tsx` |
| `Card` | `src/components/ui/card.tsx` |
| `Group`, `GroupHeader`, `ListRow`, `IconTile` | `src/components/ui/list.tsx` |
| `Chip` | `src/components/ui/chip.tsx` |
| `FloatingTabBar` | `src/components/floating-tab-bar.tsx` |
| `Screen` | `src/components/screen.tsx` |

### Dugme

```tsx
<Button onPress={...}><Text>Započni</Text></Button>              // crno, kapsula, 50pt
<Button variant="secondary">...</Button>                          // #F5F5F5
<Button variant="soft">...</Button>                               // belo + meka senka
<Button variant="outline">...</Button>                            // 1pt ivica
<Button size="icon" variant="soft">...</Button>                   // krug 40pt u zaglavlju
```

Neaktivno dugme **nije prigusena crna** — postane belo sa sivim natpisom. To je
namerno: prigusena crna i dalje vuce oko kao glavna akcija, belo jasno kaze
"jos ne moze". `Button` to radi sam kad dobije `disabled`.

Ekran nikad nema dva primarna dugmeta.

#### Crno dugme nije ravna povrsina

Poprecni presek kroz sva cetiri crna dugmeta na snimcima daje ISTI niz
vrednosti (crveni kanal, od spoljne ivice ka unutra):

```
FF FF | 4E | 1F | 47 39 28 1E 1D 1B 1A 19 19 18 18 17 17 17 16 16 16 15 15 ...
belo    AA  ivica  svetlo jezgro ——— dug, jedva vidljiv pad ka #151515
```

Iz toga se citaju tri stvari:

1. **Ivica od 1 piksela je tamnija od ispune** — `#121212` prema `#151515`.
   Ne crtamo je: tri nivoa od 255 nijedan ekran ne prikaze, a na vebu
   `react-native-web` pretvara `style` u klasu pa `borderWidth` svejedno pojede
   njegova osnovna klasa.
2. **Odmah unutar ivice stoji svetla linija** koja pada ka ispuni. To je ono
   sto se okom vidi kao "linijica" na vrhu dugmeta. Vrh je `#474747` = bela
   preko `#151515` na ~21% neprovidnosti.
3. **Sjaj postoji samo gore i dole.** Levo i desno presek ide belo → ivica →
   `#151515` bez ijednog medjukoraka. I ne skalira se sa visinom: dugme od
   34,7pt i dugme od 50,7pt imaju identican profil — dakle nije preliv preko
   cele visine nego efekat na ivici, visok tacno **7pt**.

Svetle povrsine ovo **nemaju**. Presek kroz polje za unos (`#F5F5F5`) je ravan
od ivice do ivice. Efekat je iskljucivo na crnoj povrsini.

Najverovatnije je u pitanju iOS 26 Liquid Glass sa crnim tonom. Namerno ga ne
crtamo preko `expo-glass-effect` — tamo bi postojao samo na iOS-u 26, a ovako
izgleda isto na Androidu, starijem iOS-u i vebu. Crtaju ga dva
`LinearGradient`-a u `button.tsx`, sa neprovidnostima prepisanim iz preseka.

### Grupisana lista

```tsx
<View className={GROUPED_SCREEN}>
  <GroupHeader>Podešavanja</GroupHeader>
  <Group>
    <ListRow
      leading={<IconTile color={TILE.red}><Bell size={16} color="#fff" /></IconTile>}
      title="Obaveštenja"
      onPress={...}
    />
    <ListRow title="Dozvole" onPress={...} />
  </Group>
</View>
```

Linija izmedju redova je **uvucena** do pocetka teksta, ne preko cele sirine —
`Group` je crta sam, ne treba je pisati rucno.

---

## 5. Vrh ekrana

Preliv i zamucena traka. Oba dolaze iz `Screen`
(`src/components/screen.tsx`) — ekran ih ne sklapa sam.

```tsx
<Screen label="Natalna karta" padded={false}>...</Screen>
```

### Pozadina je siva, kartice su bele

Ovo je uslov da se efekat uopste vidi. Bela kartica na beloj pozadini je ista
boja, a preliv koji stoji iznad oboji i nju i pozadinu podjednako — kartica
koja prolazi kroz preliv se tada ne vidi kao kartica. Recept povrsine je
`CARD_SURFACE` u `ui/card.tsx`:

```
rounded-lg border border-card bg-card/80
```

- `bg-card/80` — bela na **80%**, ne puna bela. Sivo ispod se probija kroz tih
  20%, pa kartica u prelivu poprimi nijansu umesto da ostane mrtvo bela.
- `border-card` — ivica je **puna** bela, dakle svetlija od sopstvene ispune.
  To daje ostar rub na sivom; bez nje poluprovidna ispuna na ivici izgleda
  izlizano.

`bg-card/80` radi samo zato sto je `card` u `tailwind.config.js` zapisan sa
`<alpha-value>`. Bez tog zamenika Tailwind nema gde da ubaci alfu u `hsl(...)`,
modifikator tiho otpadne i kartica ispadne neprovidna.

**Tanke linije koje stoje direktno na sivom idu na `border-fill-strong`, ne na
`border-border`.** `#F0F0F0` na belom je petnaest nivoa razlike, a na `#F6F7F8`
samo sest — podvlaka polja i linija izmedju redova skoro nestanu. `#EBEBEB`
vraca kontrast. Unutar bele kartice `border-border` ostaje.

### Preliv

```
linear-gradient(
  rgba(125, 83, 230, 0.40)  0%,    ljubicasta
  rgba(57, 91, 242, 0.21)  50%,    plava
  rgba(95, 121, 198, 0)   100%     providno
)
```

Visok **180**, fiksiran za vrh ekrana, ne pomera se sa sadrzajem.

Boje su procitane iz `getComputedStyle` na luma.com — referenca postoji i kao
veb aplikacija, pa se vrednost ne mora vaditi iz piksela.

**Providnost je namerno DVOSTRUKA u odnosu na referencu** (0,2 / 0,1 / 0).
Toliko se na vebu, preko sirokog prozora, lepo vidi; na telefonu je preslabo i
preliv izgleda kao prljav ekran, ne kao boja. Nijansa je ista, samo jaca. Ovo
je jedino mesto gde namerno odstupamo od izmerene vrednosti — ako treba jos
jace ili slabije, menja se SAMO alfa u `backdrop.colors`.

**Preliv stoji IZNAD sadrzaja, ne ispod njega.** To je cela tajna izgleda. Sve
tri boje su providne, pa kartice prolaze ispod i primaju nijansu dok su u
gornjih 180pt. Da je pozadina, kartice bi ostale bele i efekta ne bi bilo.

Ne sme da hvata dodir: bez `pointerEvents="none"` preliv pokrije gornjih 180pt
liste i tamo nista ne moze da se pritisne.

### Traka

**Zamucenje se pali tek na klizanje.** Na vrhu liste `intensity` je nula: dok
ispod trake nema niceg, nema sta ni da se zamuti — traka tada samo posvetli
prazan prostor i preko preliva se procita kao siva pruga. Udeo raste sa
pomerajem i stigne na pun posle `headerBar.blurAt` (24pt).

To MORA preko Reanimated-ovog `animatedProps`. `intensity` je obican prop, ne
stil, i do njega se drugacije ne stize:

- RN-ov `Animated` ne pomaze. `BlurView` je klasna komponenta bez
  `setNativeProps`, pa animirana providnost na njemu ne stigne do ekrana —
  provereno, traka ostane na nuli i kad je stanje upaljeno.
- `expo-blur` bas zato izvozi `getAnimatableRef()`. Provereno: `intensity` 20
  daje `blur(4px)`.

Visoka **70** ispod statusne trake (referenca ima 53; podignuto 26.9.2026 zbog loga od
47pt u traci) — razmak na vrhu sadrzaja je
`insets.top + headerBar.height`, i racuna se na jednom mestu. Da ga svaki ekran
sam sabira, prvi naslov bi se na jednom podvukao pod traku a na drugom odlepio,
i to bi se videlo tek na telefonu sa zarezom.

`intensity` **nije** prepis CSS-ovog `blur(16px)` iz reference. Na iOS-u
`expo-blur` bira sistemski materijal i `intensity` je udeo tog materijala
(1–100), ne poluprecnik u pikselima — te dve lestvice nemaju vezu. Broj je
izabran da lici, ne izmeren, i to je jedina vrednost u `tokens.ts` za koju to
vazi. Materijal je najtanji (`systemUltraThinMaterialLight`) jer referenca nema
tintu, samo zamucenje; deblji dodaju belu koprenu i traka pocne da izgleda kao
neprovidna povrsina.

### Redosled slojeva

Odozdo nagore, prepisano iz reference:

1. sadrzaj (`ScrollView`) — bez svojih umetaka na vrhu
2. zamucenje — visoko `insets.top + headerBar.height`, ostro se zavrsava
3. **preliv** — visok 180, PREKO zamucenja
4. natpis trake

U referenci je preliv dete trake koja nosi `backdrop-filter`, pa se crta posle
zamucenja i nastavlja ispod njega jos ~127px. Ako preliv ode iznad zamucenja,
gornji deo u visini trake izgubi boju i traka izgleda kao siva pruga.

Sva tri sloja su **direktna deca** korenskog `View`-a. Kad su preliv i natpis
uvuceni u zajednicki omotac visine trake, Android odsece preliv na visinu trake jer
podrazumevano secka ono sto izadje iz roditelja — a iOS ne secka, pa bi se
razlika videla tek na drugom telefonu.

### Android: zamucenje tiho izostane

`ExpoBlurView.kt` radi `if (blurTarget != null) method else BlurMethod.NONE`.
Bez `blurTarget` nema ni greske ni izuzetka — samo providna traka bez
zamucenja. Zato je sadrzaj u `Screen`-u obmotan u `BlurTargetView` i njegov
`ref` ide traci. Na iOS-u je `BlurTargetView` obican `View`, pa ne kosta nista.

Metod je `dimezisBlurViewSdk31Plus`, ne `dimezisBlurView`: na starijem Androidu
je Dimezis skup i trza pri klizanju, a ovaj sam padne na `none` ispod SDK 31.

---

## 6. Zamka koja se vec desila

`tailwind-merge` mora da **zna** nase klase, inace ih svrsta u pogresnu grupu.
Bez spiska u `src/lib/utils.ts`, `text-button` (velicina slova) bude prepoznat
kao BOJA teksta, pa u `cn('text-primary-foreground', 'text-button')` pobedi kao
poslednji i pojede belu — natpis na crnom dugmetu ispadne crn na crnom.

**Svaki kljuc dodat u `tailwind.config.js` mora da se pojavi i u `utils.ts`.**

## 7. Zaokruzivanje HSL-a

Tokeni su hex, a NativeWind trazi HSL trojke — svaka boja postoji na dva mesta
i prepisuje se rukom. `0 0% 8%` daje `#141414`, ne `#151515`: jedan nivo
promasaja koji se okom ne vidi, ali cini da "izmereno" vise nije izmereno.
Otkriveno je citanjem `backgroundColor` sa iscrtanog dugmeta, ne gledanjem.

`npm run check:tokens` vraca svaku HSL varijablu u hex i poredi je sa
`tokens.ts`, u oba smera. Ulazi u `npm run check`.
