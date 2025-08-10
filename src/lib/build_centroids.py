#!/usr/bin/env python3
import json
import math
import os
import sys
from argparse import ArgumentParser
from typing import Dict, List

from openai import OpenAI

MODEL_DEFAULT = "text-embedding-3-small"

def l2_norm(v: List[float]) -> float:
    return math.sqrt(sum(x * x for x in v)) or 1.0

def normalize(v: List[float]) -> List[float]:
    n = l2_norm(v)
    return [x / n for x in v]

def mean(vectors: List[List[float]]) -> List[float]:
    if not vectors:
        raise ValueError("No vectors to average.")
    dim = len(vectors[0])
    acc = [0.0] * dim
    for vec in vectors:
        if len(vec) != dim:
            raise ValueError("Inconsistent embedding dimensions.")
        for i, x in enumerate(vec):
            acc[i] += x
    return [x / len(vectors) for x in acc]

def embed_texts(client: OpenAI, model: str, texts: List[str]) -> List[List[float]]:
    # One request per batch (OpenAI embeddings API accepts a list)
    resp = client.embeddings.create(model=model, input=texts)
    # Preserve order
    return [d.embedding for d in resp.data]

def build_group_centroids(client: OpenAI, model: str, groups: Dict[str, List[str]]):
    out = []
    dim = None
    for name, examples in groups.items():
        examples = [t for t in examples if t and t.strip()]
        if not examples:
            continue
        embs = embed_texts(client, model, examples)
        embs = [normalize(e) for e in embs]
        centroid = normalize(mean(embs))
        dim = dim or len(centroid)
        out.append({"name": name, "centroid": centroid})
    out.sort(key=lambda x: x["name"])
    return out, dim

def main():
    ap = ArgumentParser(description="Build semantic centroids from seed prompts.")
    ap.add_argument("seeds", help="Path to seeds JSON (see example).")
    ap.add_argument("-o", "--out", default="semantic-centroids.json", help="Output JSON path.")
    ap.add_argument("--model", default=MODEL_DEFAULT, help="Embedding model (default: text-embedding-3-small)")
    args = ap.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: set OPENAI_API_KEY in your environment.", file=sys.stderr)
        sys.exit(1)

    with open(args.seeds, "r", encoding="utf-8") as f:
        seeds = json.load(f)

    client = OpenAI(api_key=api_key)

    categories = seeds.get("categories", {})
    difficulty = seeds.get("difficulty", {})

    cat_centroids, dim1 = build_group_centroids(client, args.model, categories)
    dif_centroids, dim2 = build_group_centroids(client, args.model, difficulty)
    dim = dim1 or dim2
    if dim is None:
        raise ValueError("No centroids produced. Check your seeds file.")

    out = {
        "model": args.model,
        "dimension": dim,
        "categories": cat_centroids,
        "difficulty": dif_centroids,
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {args.out} (dim={dim}) with "
          f"{len(cat_centroids)} category and {len(dif_centroids)} difficulty centroids.")

if __name__ == "__main__":
    main()
