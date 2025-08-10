#!/usr/bin/env python3
import json
import sys
from argparse import ArgumentParser
from typing import Any, Dict, Iterable, List

# Fields we’ll output (and validate)
OUT_KEYS = [
    "name",
    "slug",
    "provider",  # from model_creator.slug or name
    "artificial_analysis_intelligence_index",
    "artificial_analysis_coding_index",
    "artificial_analysis_math_index",
    "price_input_tokens",
    "price_output_tokens",
    "median_output_tokens_per_second",
]

# Providers we allow (normalize before comparison)
ALLOWED_PROVIDERS = {
    "openai",
    "anthropic",
    "google",
}

def norm_provider(p: Any) -> str:
    return str(p or "").strip().lower().replace(" ", "").replace("_", "-")

def extract_one(model: Dict[str, Any]) -> Dict[str, Any]:
    evals   = model.get("evaluations") or {}
    pricing = model.get("pricing") or {}
    creator = model.get("model_creator") or {}

    # Handle possible misspelling for intelligence index
    ai_intel = (
        evals.get("artificial_analysis_intelligence_index")
        if "artificial_analysis_intelligence_index" in evals
        else evals.get("aritificial_analysis_intelligence_index")
    )

    return {
        "name": model.get("name"),
        "slug": model.get("slug"),
        "provider": (creator.get("slug") or creator.get("name")),
        "artificial_analysis_intelligence_index": ai_intel,
        "artificial_analysis_coding_index": evals.get("artificial_analysis_coding_index"),
        "artificial_analysis_math_index": evals.get("artificial_analysis_math_index"),
        "price_input_tokens": pricing.get("price_1m_input_tokens"),
        "price_output_tokens": pricing.get("price_1m_output_tokens"),
        "median_output_tokens_per_second": model.get("median_output_tokens_per_second"),
    }

def iter_source(doc: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    data = doc.get("data")
    if isinstance(data, list):
        for itm in data:
            if isinstance(itm, dict):
                yield itm
    elif isinstance(doc, dict) and "name" in doc:
        yield doc

def valid_row(row: Dict[str, Any]) -> bool:
    # Provider allowlist
    prov = norm_provider(row.get("provider"))
    if prov not in ALLOWED_PROVIDERS:
        return False

    # Keep only rows where every requested field exists and is neither None nor 0
    for k in OUT_KEYS:
        if k not in row:
            return False
        v = row[k]
        if v is None or v == 0:
            return False
        if isinstance(v, str) and v.strip() == "":
            return False
    return True

def main():
    ap = ArgumentParser(description="Extract model fields from JSON → JSON (drop rows with missing/null/0 fields and non-allowed providers)")
    ap.add_argument("infile", help="Input JSON (or '-' for stdin)")
    ap.add_argument("-o", "--out", help="Output JSON file (default: stdout)")
    args = ap.parse_args()

    raw = sys.stdin.read() if args.infile == "-" else open(args.infile, "r", encoding="utf-8").read()
    doc = json.loads(raw)

    extracted: List[Dict[str, Any]] = [extract_one(m) for m in iter_source(doc)]
    out_rows: List[Dict[str, Any]] = [r for r in extracted if valid_row(r)]

    outfh = sys.stdout if not args.out else open(args.out, "w", encoding="utf-8")
    try:
        json.dump(out_rows, outfh, indent=2, ensure_ascii=False)
        if outfh is sys.stdout:
            print()
    finally:
        if outfh is not sys.stdout:
            outfh.close()

if __name__ == "__main__":
    main()
