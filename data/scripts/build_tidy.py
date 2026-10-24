# Build tidy CSVs from extracted mass.gov tables.
# Usage: build_tidy.py <extract_out_dir> <massgov_page_text.json> <dest_dir>
import csv
import json
import re
import sys
from pathlib import Path

DISEASES = [("lyme", "Lyme disease"), ("babesiosis", "Babesiosis"), ("hga", "Anaplasmosis (HGA)"),
            ("anaplasmosis", "Anaplasmosis (HGA)"), ("miyamotoi", "Borrelia miyamotoi"), ("powassan", "Powassan virus")]


def disease_of(text: str) -> str | None:
    t = text.lower()
    for key, name in DISEASES:
        if key in t:
            return name
    return None


def num(s: str) -> str:
    s = s.replace(",", "").replace("%", "").strip()
    return s if re.fullmatch(r"-?\d+(\.\d+)?", s) else ""


def county_name(s: str) -> str:
    s = s.strip().rstrip("*").strip()
    s = s.title().replace("Dukes/Nantucket", "Dukes & Nantucket").replace("Dukes And Nantucket", "Dukes & Nantucket")
    return "State Total" if s.lower().startswith(("state total", "total", "massachusetts")) else s


def county_annual(out: Path, dest: Path):
    rows = []
    for r in csv.DictReader(open(out / "tables-index.csv")):
        table = list(csv.reader(open(out / "tables" / r["file"])))
        header = " ".join(table[0])
        if not table[0][0].lower().startswith("county") or not any(k in header.lower() for k in ("rate", "incidence")):
            continue
        # Annual reports name the disease in the table caption; older summaries in the file name.
        caption = re.search(r"Table \d+: [^,]*", r["caption"])
        disease = disease_of(caption.group(0)) if caption and "surveillance-report-20" in r["source"] else disease_of(r["source"])
        if disease is None or "co-infection" in r["source"]:
            continue
        year = re.search(r"(20\d\d)", table[0][1]).group(1)
        lyme_split = len(table[0]) == 4  # 2012-2014 Lyme: confirmed, probable, combined rate
        for line in table[1:]:
            if not line or not line[0].strip():
                continue
            cases = str(int(num(line[1]) or 0) + int(num(line[2]) or 0)) if lyme_split else num(line[1])
            rate = num(line[3]) if lyme_split else num(line[2])
            rows.append([year, disease, county_name(line[0]), cases, rate, table[0][1].strip(), r["file"]])
    rows.sort(key=lambda x: (x[1], x[0], x[2] == "State Total", x[2]))
    with open(dest / "county_annual.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["year", "disease", "county", "cases", "incidence_per_100k", "case_definition", "source_table"])
        w.writerows(rows)
    return len(rows)


def syndromic(out: Path, dest: Path):
    rows = []
    for r in csv.DictReader(open(out / "tables-index.csv")):
        if "syndromic" not in r["source"]:
            continue
        m = re.search(r"(january-december-|december-|august-)(20\d\d)", r["source"])
        period = f"{m.group(2)}-01..{m.group(2)}-08" if m.group(1) == "august-" else f"{m.group(2)}-01..{m.group(2)}-12"
        for line in list(csv.reader(open(out / "tables" / r["file"])))[1:]:
            if line and line[0].strip():
                rows.append([period, county_name(line[0]), num(line[1]), num(line[2]), num(line[3]), r["file"]])
    rows.sort()
    with open(dest / "syndromic_county.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["period", "county", "ed_visits_total", "tickborne_disease_visits", "rate_per_10k_visits", "source_table"])
        w.writerows(rows)
    return len(rows)


def statewide(page_json: Path, dest: Path):
    text = json.loads(page_json.read_text())
    lines = text.split("\n")
    start = next(i for i, l in enumerate(lines) if l.startswith("Disease\t2015"))
    years = [re.sub(r"\s*YTD\d*$", "_ytd", y.strip()) for y in lines[start].split("\t")[1:]]
    rows = []
    for l in lines[start + 1:]:
        cells = l.split("\t")
        if cells[0].startswith(("Total", "Disease")) or len(cells) < 2:
            break
        name = re.sub(r"\d$", "", cells[0]).strip()
        for y, v in zip(years, cells[1:]):
            rows.append([y, name, num(v)])
    with open(dest / "statewide_cases.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["year", "disease", "cases"])
        w.writerows(rows)
    return len(rows)


if __name__ == "__main__":
    out, page, dest = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    dest.mkdir(parents=True, exist_ok=True)
    print("county_annual:", county_annual(out, dest))
    print("syndromic_county:", syndromic(out, dest))
    print("statewide_cases:", statewide(page, dest))
