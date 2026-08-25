import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


def clean_name(value: str) -> str:
    value = re.sub(r"（注[：:].*", "", value).strip()
    return re.sub(r"\s+", "", value)


def parse_catalog(pdf_path: Path):
    reader = PdfReader(str(pdf_path))
    disciplines = []
    discipline = None
    family = None

    for page in reader.pages[2:]:
        text = page.extract_text(extraction_mode="layout") or ""
        for raw in text.splitlines():
            line = raw.strip()
            if not line:
                continue

            match = re.match(r"^(\d{2})\s+学科门类[：:]\s*(.+)$", line)
            if match:
                discipline = [match.group(1), clean_name(match.group(2)), []]
                disciplines.append(discipline)
                family = None
                continue

            match = re.match(r"^(\d{4})\s+(.+类)\s*$", line)
            if match and discipline:
                family = [match.group(1), clean_name(match.group(2)), []]
                discipline[2].append(family)
                continue

            match = re.match(r"^(\d{6,7}[TK]*)\s+(.+)$", line)
            if match and discipline:
                if family is None:
                    family = [f"{discipline[0]}00", f"{discipline[1]}直属专业", []]
                    discipline[2].append(family)
                family[2].append([match.group(1), clean_name(match.group(2))])

    family_count = sum(len(item[2]) for item in disciplines)
    major_count = sum(len(item[2]) for discipline in disciplines for item in discipline[2])
    if len(disciplines) != 13 or family_count != 93 or major_count != 883:
        raise RuntimeError(
            f"Unexpected catalog shape: {len(disciplines)} disciplines, "
            f"{family_count} display groups, {major_count} majors"
        )
    return disciplines


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build-catalog.py <official-catalog.pdf> <catalog-2026.js>")

    pdf_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    catalog = parse_catalog(pdf_path)
    payload = json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
    output_path.write_text(
        "// Generated from the Ministry of Education 2026 undergraduate major catalog.\n"
        "// 13 disciplines, 92 official major classes, 883 majors.\n"
        "// The cross-disciplinary discipline has no official class layer; 1400 is a UI-only display group.\n"
        f"const UNDERGRADUATE_CATALOG = {payload};\n"
        "const CATALOG_META = {year:2026,disciplines:13,officialFamilies:92,displayGroups:93,majors:883," 
        "source:'https://www.moe.gov.cn/srcsite/A08/moe_1034/s3882/202604/t20260427_1434931.html'};\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
