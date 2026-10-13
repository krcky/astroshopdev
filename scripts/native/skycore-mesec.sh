#!/bin/sh
# Slike Meseca za sat (Astrodial): ISTIH 30 ilustracija kao u aplikaciji (`assets/images/mesec/`,
# pravi ih `scripts/mesec-faze.ts`), prepisane u katalog Apple Watch aplikacije i u Wear OS resurse.
# Posle izmene slika u aplikaciji:  sh scripts/native/skycore-mesec.sh
set -e
cd "$(dirname "$0")/../.."
for i in $(seq -w 1 30); do
  d="watch/NeboSat/Assets.xcassets/mesec-$i.imageset"
  mkdir -p "$d"
  cp "assets/images/mesec/mesec-$i.png" "$d/mesec-$i.png"
  printf '{"images":[{"idiom":"universal","filename":"mesec-%s.png"}],"info":{"version":1,"author":"xcode"}}\n' "$i" > "$d/Contents.json"
  mkdir -p wear/src/main/res/drawable-nodpi
  cp "assets/images/mesec/mesec-$i.png" "wear/src/main/res/drawable-nodpi/mesec_$i.png"
done
echo "prepisano 30 slika Meseca (Apple Watch i Wear OS)"
