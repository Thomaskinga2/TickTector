# Extract every <table> from textutil-converted HTML into CSVs, with the caption
# (the last text block before the table). Usage: extract_tables.py <html_dir> <txt_dir> <out_dir>
import csv
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


def decode(raw: bytes) -> str:
    m = re.search(rb'charset=["\']?([\w-]+)', raw[:2000])
    for enc in ([m.group(1).decode()] if m else []) + ["utf-8", "utf-16", "cp1252"]:
        try:
            return raw.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("utf-8", "replace")


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self.stack, self.text_since, self.last_text = [], [], [], ""
        self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            caption = clean(" ".join(self.text_since)) or self.last_text
            self.stack.append({"caption": caption[-300:], "rows": []})
            self.text_since = []
        elif tag == "tr" and self.stack:
            self.stack[-1]["rows"].append([])
        elif tag in ("td", "th") and self.stack:
            self.cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.stack and self.cell is not None:
            if not self.stack[-1]["rows"]:
                self.stack[-1]["rows"].append([])
            self.stack[-1]["rows"][-1].append(clean(" ".join(self.cell)))
            self.cell = None
        elif tag == "table" and self.stack:
            t = self.stack.pop()
            t["rows"] = [r for r in t["rows"] if any(c for c in r)]
            if t["rows"]:
                self.tables.append(t)
        elif tag in ("p", "div", "br") and not self.stack:
            block = clean(" ".join(self.text_since))
            if block:
                self.last_text = block
                self.text_since = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)
        elif not self.stack:
            self.text_since.append(data)


def main(html_dir: str, txt_dir: str, out_dir: str):
    out = Path(out_dir)
    (out / "tables").mkdir(parents=True, exist_ok=True)
    (out / "text").mkdir(parents=True, exist_ok=True)
    index = []
    for html in sorted(Path(html_dir).glob("*.html")):
        slug = html.stem.removesuffix("-doc")
        parser = Tables()
        parser.feed(decode(html.read_bytes()))
        for i, t in enumerate(parser.tables, 1):
            name = f"{slug}__t{i:02d}.csv"
            with open(out / "tables" / name, "w", newline="") as f:
                csv.writer(f).writerows(t["rows"])
            index.append([slug, i, name, len(t["rows"]), max(len(r) for r in t["rows"]), t["caption"]])
        txt = Path(txt_dir) / f"{html.stem}.txt"
        if txt.exists():
            (out / "text" / f"{slug}.txt").write_text(decode(txt.read_bytes()))
    with open(out / "tables-index.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["source", "table", "file", "rows", "cols", "caption"])
        w.writerows(index)
    print(f"{len(index)} tables from {len(list(Path(html_dir).glob('*.html')))} documents")


if __name__ == "__main__":
    main(*sys.argv[1:4])
