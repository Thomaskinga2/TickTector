"""Build the app's bundled data from data/massgov/*.csv and MassGIS boundaries.

Outputs (committed):
  lib/data/towns.json          351 towns: id, name, county, lat, lng, population
  lib/data/county-stats.json   per county + "State Total": 2025 rates, score, yearly cases, ER visit rates
  lib/data/statewide.json      statewide cases per year and disease
  public/geo/ma-towns.json     town outlines + county lines, pre-projected to SVG coordinates

Run from the repo root: python3 data/scripts/build_app_data.py
Needs network for MassGIS (public, no key). Stdlib only.
"""

import csv
import json
import math
import re
import subprocess
import urllib.parse
from collections import defaultdict
from pathlib import Path

MASSGIS = "https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services"
TOWNS_URL = f"{MASSGIS}/Massachusetts_Municipalities_Hosted/FeatureServer/0/query"
COUNTY_LINES_URL = f"{MASSGIS}/Massachusetts_Counties/FeatureServer/0/query"

# Map projection: equirectangular, scaled by cos(latitude) so MA isn't stretched.
WEST, EAST, SOUTH, NORTH = -73.52, -69.90, 41.22, 42.90
LAT0 = (SOUTH + NORTH) / 2
WIDTH = 1000
SCALE = WIDTH / ((EAST - WEST) * math.cos(math.radians(LAT0)))
HEIGHT = round((NORTH - SOUTH) * SCALE)

DISEASE_KEYS = {"Lyme disease": "lyme", "Babesiosis": "babesiosis", "Anaplasmosis (HGA)": "hga"}
LATEST_YEAR = "2025"


def project(lng: float, lat: float) -> tuple[float, float]:
    return ((lng - WEST) * math.cos(math.radians(LAT0)) * SCALE, (NORTH - lat) * SCALE)


def fetch_all(url: str, params: dict) -> list[dict]:
    """Page through an ArcGIS query (one big request times out)."""
    features, offset = [], 0
    while True:
        query = {**params, "f": "geojson", "outSR": 4326, "resultOffset": offset, "resultRecordCount": 50}
        # curl, not urllib: python.org builds on macOS ship without root certificates.
        out = subprocess.run(["curl", "-sf", "-m", "120", f"{url}?{urllib.parse.urlencode(query)}"],
                             check=True, capture_output=True).stdout
        page = json.loads(out)
        features += page["features"]
        if len(page["features"]) < 50:
            return features
        offset += 50


def rings_of(geometry: dict) -> list[list[list[float]]]:
    if geometry["type"] == "Polygon":
        return geometry["coordinates"]
    if geometry["type"] == "MultiPolygon":
        return [ring for poly in geometry["coordinates"] for ring in poly]
    if geometry["type"] == "LineString":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiLineString":
        return geometry["coordinates"]
    return []


def ring_area(ring: list[list[float]]) -> float:
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1])) / 2


def centroid(ring: list[list[float]]) -> tuple[float, float]:
    a = ring_area(ring)
    if abs(a) < 1e-12:
        xs, ys = zip(*ring)
        return sum(xs) / len(xs), sum(ys) / len(ys)
    cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        f = x1 * y2 - x2 * y1
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    return cx / (6 * a), cy / (6 * a)


def to_path(rings: list[list[list[float]]], closed: bool, min_area: float = 0.0) -> str:
    """Project, round to 0.1 px, drop repeated points and tiny islands."""
    parts = []
    for ring in rings:
        pts = []
        for lng, lat in ring:
            x, y = project(lng, lat)
            p = (round(x, 1), round(y, 1))
            if not pts or p != pts[-1]:
                pts.append(p)
        if len(pts) < (3 if closed else 2):
            continue
        if closed and abs(ring_area([list(p) for p in pts])) < min_area:
            continue
        parts.append("M" + "L".join(f"{x:g} {y:g}" for x, y in pts) + ("Z" if closed else ""))
    return "".join(parts)


def title(name: str) -> str:
    words = re.split(r"([ -])", name.lower())
    small = {"by", "the", "of"}
    out = [w if (w in small and i > 0) or w in " -" else w.capitalize() for i, w in enumerate(words)]
    return "".join(out)


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def county_key(county: str) -> str:
    """Stats use one combined row for the islands."""
    return "Dukes & Nantucket" if county in ("Dukes", "Nantucket") else county


def build_geo(root: Path):
    towns_out, shapes = [], []
    features = fetch_all(TOWNS_URL, {"where": "1=1", "outFields": "TOWN,COUNTY,POP2020",
                                     "maxAllowableOffset": 0.002, "geometryPrecision": 5})
    for f in sorted(features, key=lambda f: f["properties"]["TOWN"]):
        p = f["properties"]
        rings = rings_of(f["geometry"])
        main = max(rings, key=lambda r: abs(ring_area(r)))
        lng, lat = centroid(main)
        town = {"id": slug(p["TOWN"]), "name": title(p["TOWN"]), "county": title(p["COUNTY"]),
                "lat": round(lat, 4), "lng": round(lng, 4), "population": p["POP2020"]}
        towns_out.append(town)
        # Keep every ring of at least 4 px² (and always the main one), so small islands stay visible.
        d = to_path([main], True) + to_path([r for r in rings if r is not main], True, min_area=4)
        shapes.append({"id": town["id"], "county": town["county"], "d": d})

    lines = fetch_all(COUNTY_LINES_URL, {"where": "OUTLINE=2", "outFields": "OUTLINE",
                                         "maxAllowableOffset": 0.002, "geometryPrecision": 5})
    county_lines = "".join(to_path(rings_of(f["geometry"]), False) for f in lines)

    # Label position and zoom box per county, from its towns.
    by_county = defaultdict(list)
    for s in shapes:
        by_county[s["county"]].append(s)
    counties = []
    for name, items in sorted(by_county.items()):
        nums = [float(n) for s in items for n in re.findall(r"-?\d+(?:\.\d+)?", s["d"])]
        xs, ys = nums[0::2], nums[1::2]
        members = [t for t in towns_out if t["county"] == name]
        pop = sum(t["population"] for t in members)
        lx, ly = project(sum(t["lng"] * t["population"] for t in members) / pop,
                         sum(t["lat"] * t["population"] for t in members) / pop)
        counties.append({"name": name, "statsKey": county_key(name),
                         "bbox": [round(min(xs)), round(min(ys)), round(max(xs) - min(xs)), round(max(ys) - min(ys))],
                         "label": [round(lx), round(ly)]})

    geo = {"width": WIDTH, "height": HEIGHT,
           "projection": {"west": WEST, "north": NORTH, "lat0": LAT0, "scale": SCALE},
           "towns": shapes, "countyLines": county_lines, "counties": counties}
    (root / "public/geo").mkdir(parents=True, exist_ok=True)
    (root / "public/geo/ma-towns.json").write_text(json.dumps(geo, separators=(",", ":")))
    (root / "lib/data").mkdir(parents=True, exist_ok=True)
    (root / "lib/data/towns.json").write_text(json.dumps(towns_out, indent=0, separators=(",", ":")))
    return towns_out


def build_stats(root: Path):
    rows = list(csv.DictReader(open(root / "data/massgov/county_annual.csv")))
    stats = defaultdict(lambda: {"rates": {}, "trend": defaultdict(dict), "er": []})
    for r in rows:
        key = DISEASE_KEYS.get(r["disease"])
        county = county_key(r["county"])
        if key is None or county in ("Unknown", "Cape Cod & Islands"):
            continue
        s = stats[county]
        cases = int(r["cases"]) if r["cases"] else None
        if cases is not None:
            # Lyme 2010-2011 lists Dukes and Nantucket separately: add them up.
            s["trend"][r["year"]][key] = s["trend"][r["year"]].get(key, 0) + cases
        if r["year"] == LATEST_YEAR and r["incidence_per_100k"]:
            s["rates"][key] = float(r["incidence_per_100k"])

    er_rows = list(csv.DictReader(open(root / "data/massgov/syndromic_county.csv")))
    totals = defaultdict(lambda: [0, 0])
    for r in er_rows:
        period = r["period"][:4] + (" (Jan–Aug)" if r["period"].endswith("-08") else "")
        stats[r["county"]]["er"].append({"period": period, "rate": float(r["rate_per_10k_visits"])})
        totals[period][0] += int(r["tickborne_disease_visits"])
        totals[period][1] += int(r["ed_visits_total"])
    stats["State Total"]["er"] = [{"period": p, "rate": round(v / t * 10_000, 2)} for p, (v, t) in sorted(totals.items())]

    out = {}
    for county, s in sorted(stats.items()):
        out[county] = {
            "county": county,
            "score": round(sum(s["rates"].values()), 1),
            "rates": {k: s["rates"].get(k) for k in DISEASE_KEYS.values()},
            "trend": [{"year": int(y), **{k: v.get(k) for k in DISEASE_KEYS.values()}} for y, v in sorted(s["trend"].items())],
            "er": sorted(s["er"], key=lambda e: e["period"]),
        }
    (root / "lib/data/county-stats.json").write_text(json.dumps(out, indent=1))

    by_year = defaultdict(dict)
    names = {"Lyme Disease": "lyme", "Babesiosis": "babesiosis", "Human Granulocytic Anaplasmosis": "hga",
             "Borrelia miyamotoi": "miyamotoi", "Powassan virus": "powassan"}
    for r in csv.DictReader(open(root / "data/massgov/statewide_cases.csv")):
        by_year[r["year"]][names[r["disease"]]] = int(r["cases"])
    statewide = [{"year": y.replace("_ytd", ""), "partial": y.endswith("_ytd"), **v} for y, v in sorted(by_year.items())]
    (root / "lib/data/statewide.json").write_text(json.dumps(statewide, indent=1))
    return out


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    towns = build_geo(root)
    stats = build_stats(root)
    print(f"{len(towns)} towns, {len(stats)} county stats")
    for f in ("public/geo/ma-towns.json", "lib/data/towns.json", "lib/data/county-stats.json", "lib/data/statewide.json"):
        print(f"{f}: {(root / f).stat().st_size / 1024:.0f} KB")
