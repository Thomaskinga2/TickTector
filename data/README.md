# Tick data

Extracted on 2026-10-24 from two public sources. Numbers are copied exactly from the source documents. Totals were checked: every county table adds up to its state total, apart from cases DPH lists as "unknown county".

| Source | What we took |
|---|---|
| Massachusetts DPH, [Tick-borne disease surveillance summaries and data](https://www.mass.gov/lists/tick-borne-disease-surveillance-summaries-and-data) and [Monthly tick-borne disease reports](https://www.mass.gov/lists/monthly-tick-borne-disease-reports) | 40 Word documents: annual reports 2019–2025, disease summaries back to 2010, syndromic (ER visit) reports 2019–Aug 2026, and the statewide case table on the page |
| Town of Amherst, [Ticks](https://www.amherstma.gov/3784/Ticks) | Page text, links, and text from the 4 linked PDFs |

Cite as: Massachusetts Department of Public Health, Bureau of Infectious Disease and Laboratory Sciences. DPH data are preliminary and subject to change.

## Files

### Ready to use (`data/massgov/`)

**`county_annual.csv`**: cases and incidence by county, year and disease (558 rows).

| Column | Meaning |
|---|---|
| `year` | 2010–2025 |
| `disease` | `Lyme disease`, `Babesiosis`, `Anaplasmosis (HGA)` |
| `county` | County name, or `State Total` |
| `cases` | Reported cases (for Lyme 2012–2014: confirmed + probable) |
| `incidence_per_100k` | Cases per 100,000 residents, as published |
| `case_definition` | The source column header, which says which case types are counted |
| `source_table` | File in `tables/` the row came from |

Coverage:
- Babesiosis and HGA: every year, 2011–2025.
- Lyme: 2010–2014 and 2022–2025. DPH published no county Lyme tables for 2015–2021.

**`syndromic_county.csv`**: emergency department visits for tick-borne disease by county (104 rows): `period` (full years 2019–2025, plus `2026-01..2026-08`), `county`, `ed_visits_total`, `tickborne_disease_visits`, `rate_per_10k_visits`. This is the most recent county-level signal.

**`statewide_cases.csv`**: statewide case counts by disease, 2015 to 2026 year-to-date (data as of 2026-10-05), from the table on the mass.gov page. Columns: `year`, `disease`, `cases`.

### Everything else (`data/massgov/`, `data/amherst/`)

- `massgov/tables/`: all 68 tables found in the documents, one CSV each. `tables-index.csv` lists each table's source document and caption. This includes Borrelia miyamotoi and Powassan virus county counts, co-infection tables, symptom tables, and the 2016–2025 trend table (`tickborne-disease-surveillance-report-2025__t01.csv`).
- `massgov/text/`: full text of every DPH document, including the narrative highlights. Example: "The county with the highest rate was Barnstable (380.23)…"
- `amherst/ticks-page.md`: the Amherst Ticks page, word for word, with its links.
- `amherst/pdf-text/`: text from the "All About Ticks" flyer, the tick check guide, the tick management pamphlet, and the 2025 insect repellent guide.

## Caveats (read before computing risk)

1. **Lyme numbers change meaning across years.**
   - 2015: confirmed and probable cases with active public health follow-up.
   - 2016–2021: few cases have enough information to count, so Lyme looks artificially low (28 cases in 2021).
   - 2022 onward: a laboratory-only probable case definition.
   - Don't compare Lyme across these periods. Babesiosis and HGA are consistent across years.
2. **Two different statewide Lyme series.** `statewide_cases.csv` (mass.gov page, 8,619 in 2025) counts surveillance cases. The 2025 report's trend table (17,113 in 2025) also counts suspect cases.
3. **Unknown county.** State totals include cases with unknown county. Example: 15 Lyme cases in 2025 and 557 in 2010.
4. **Region names differ by year.** HGA 2011–2012 groups Barnstable, Dukes and Nantucket as `Cape Cod & Islands`. Lyme 2010–2011 lists `Dukes` and `Nantucket` separately. Later years use `Dukes & Nantucket`.
5. **No town-level numbers.** The reports show city/town incidence only as map images (e.g. "Ten-year Lyme disease incidence rates per 100,000 population by city/town"). Town-level counts would need a data request to DPH. The finest level here is county: Amherst is in **Hampshire County**.
6. **Amherst context.** The town page says: "In 2025, more than a quarter of the cases in the region were in Amherst residents."

## Re-creating this data

The raw downloads (`data/raw/`, 56 MB) are git-ignored. mass.gov blocks scripted downloads (HTTP 403), so the files were fetched through a real browser session. To rebuild from the raw files on macOS:

```bash
# 1. Word -> HTML/text (macOS textutil)
mkdir -p /tmp/conv-html /tmp/conv-txt
for f in data/raw/massgov/*; do b=$(basename "${f%.*}")
  textutil -convert html -output /tmp/conv-html/$b.html "$f"
  textutil -convert txt  -output /tmp/conv-txt/$b.txt  "$f"; done
# 2. Tables -> CSV, then tidy datasets
python3 data/scripts/extract_tables.py /tmp/conv-html /tmp/conv-txt data/massgov
python3 data/scripts/build_tidy.py data/massgov data/massgov/page-text.json data/massgov
# 3. PDF text
for f in data/raw/amherst/*.pdf; do swift data/scripts/pdftext.swift "$f" > data/amherst/pdf-text/$(basename "${f%.pdf}").txt; done
```

`data/massgov/page-text.json` is the mass.gov page text (its `innerText` as a JSON string), used to build `statewide_cases.csv`.
