"""
Isto sto i Excel (`excel.py`), ali kao TEKST — Gemini Excel ne procita uvek, a CSV i tekst da.
Za svaki jezik: `<jezik>.csv` (ceo list) i `<jezik>-deo-N.txt` (do 160 stavki, za lepljenje u razgovor).
Vazne stavke idu prve.

    npx tsx scripts/prevod/izvoz.ts > /tmp/prevod.json
    python3 scripts/prevod/tekst.py /tmp/prevod.json Prevod-izvoz
"""
import csv
import json
import os
import sys

JEZICI = {"hr": "Hrvatski", "bs": "Bosanski", "sl": "Slovenscina", "mk": "Makedonski", "en": "English"}
PO_DELU = 160


def main(ulaz: str, folder: str) -> None:
    redovi = sorted(json.load(open(ulaz, encoding="utf-8")), key=lambda r: not r["vazno"])
    os.makedirs(folder, exist_ok=True)
    for kod, ime in JEZICI.items():
        with open(os.path.join(folder, f"{kod}.csv"), "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["kljuc", "gde se vidi", "srpski", "prevod", "vazno"])
            for r in redovi:
                w.writerow([r["kljuc"], r["kontekst"], r["sr"], r[kod], "DA" if r["vazno"] else ""])
        delovi = [redovi[i:i + PO_DELU] for i in range(0, len(redovi), PO_DELU)]
        for n, deo in enumerate(delovi, start=1):
            linije = [f"=== {ime} — deo {n} od {len(delovi)} ({len(deo)} stavki) ===", ""]
            for r in deo:
                linije += [
                    f"kljuc: {r['kljuc']}" + ("   [VAZNO]" if r["vazno"] else ""),
                    f"gde se vidi: {r['kontekst'] or '-'}",
                    f"srpski: {r['sr']}",
                    f"prevod: {r[kod]}",
                    "",
                ]
            open(os.path.join(folder, f"{kod}-deo-{n}.txt"), "w", encoding="utf-8").write("\n".join(linije))
        print(f"{ime}: {kod}.csv + {len(delovi)} delova")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
