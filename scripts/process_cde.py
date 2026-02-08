#!/usr/bin/env python3
"""
Process raw CDE JSON data into embeddings and 2D coordinates for visualization.

Pipeline:
  1. Load raw JSON, extract text (designation + definition + stewardOrg)
  2. Compute embeddings with google/embeddinggemma-300m via sentence_transformers (cached)
  3. Compute 2D layout with openTSNE (cached)
  4. (future) Clustering + labeling

Usage:
  python scripts/process_cde.py data/raw/cde-260207.json
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np

PYTHON = Path(sys.executable)
CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
EMBEDDING_MODEL = "google/embeddinggemma-300m"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def file_hash(path: Path) -> str:
    """Fast MD5 of a file for cache invalidation."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def cache_path(name: str, src_hash: str) -> Path:
    return CACHE_DIR / f"{name}_{src_hash}.npy"


# ---------------------------------------------------------------------------
# Step 1: Load & extract text
# ---------------------------------------------------------------------------

def load_cde_json(path: Path) -> list[dict]:
    """Load raw CDE JSON and return list of dicts with extracted fields."""
    with open(path) as f:
        raw = json.load(f)

    records = []
    for item in raw:
        # Primary designation (first one)
        designation = ""
        if item.get("designations"):
            designation = item["designations"][0].get("designation", "")

        # Primary definition (first one)
        definition = ""
        if item.get("definitions"):
            definition = item["definitions"][0].get("definition", "")

        steward = ""
        if item.get("stewardOrg"):
            steward = item["stewardOrg"].get("name", "")

        # Year from created date
        year = None
        created = item.get("created", "")
        if created:
            try:
                year = int(created[:4])
            except (ValueError, IndexError):
                pass

        records.append({
            "tinyId": item.get("tinyId", ""),
            "designation": designation,
            "definition": definition,
            "stewardOrg": steward,
            "year": year,
            # Combine for embedding
            "text": f"{designation}. {definition} [{steward}]",
        })

    print(f"  Loaded {len(records)} CDE records")
    return records


# ---------------------------------------------------------------------------
# Step 2: Embeddings
# ---------------------------------------------------------------------------

def compute_embeddings(records: list[dict], src_hash: str) -> np.ndarray:
    """Compute or load cached sentence embeddings."""
    cp = cache_path("embeddings", src_hash)
    if cp.exists():
        print(f"  Loading cached embeddings from {cp.name}")
        return np.load(cp)

    print(f"  Computing embeddings with {EMBEDDING_MODEL} ...")
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(EMBEDDING_MODEL)
    texts = [r["text"] for r in records]
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=64)
    embeddings = np.asarray(embeddings, dtype=np.float32)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    np.save(cp, embeddings)
    print(f"  Saved embeddings {embeddings.shape} -> {cp.name}")
    return embeddings


# ---------------------------------------------------------------------------
# Step 3: 2D projection with openTSNE
# ---------------------------------------------------------------------------

def compute_tsne(embeddings: np.ndarray, src_hash: str) -> np.ndarray:
    """Compute or load cached openTSNE 2D projection."""
    cp = cache_path("tsne2d", src_hash)
    if cp.exists():
        print(f"  Loading cached t-SNE from {cp.name}")
        return np.load(cp)

    print(f"  Computing t-SNE 2D projection ({embeddings.shape[0]} points) ...")
    from openTSNE import TSNE

    tsne = TSNE(
        n_components=2,
        perplexity=30,
        initialization="pca",
        metric="cosine",
        n_jobs=-1,
        random_state=42,
        verbose=True,
    )
    coords = tsne.fit(embeddings)
    coords = np.asarray(coords, dtype=np.float32)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    np.save(cp, coords)
    print(f"  Saved t-SNE coords {coords.shape} -> {cp.name}")
    return coords


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Process CDE data for visualization")
    parser.add_argument("input", type=Path, help="Path to raw CDE JSON file")
    parser.add_argument("--skip-tsne", action="store_true", help="Only compute embeddings, skip t-SNE")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: {args.input} not found", file=sys.stderr)
        sys.exit(1)

    src_hash = file_hash(args.input)[:12]
    print(f"Input: {args.input}  (hash: {src_hash})")

    # Step 1
    print("\n[Step 1] Loading CDE data ...")
    records = load_cde_json(args.input)

    # Step 2
    print("\n[Step 2] Embeddings ...")
    embeddings = compute_embeddings(records, src_hash)

    # Step 3
    if not args.skip_tsne:
        print("\n[Step 3] t-SNE 2D projection ...")
        coords = compute_tsne(embeddings, src_hash)
    else:
        print("\n[Step 3] Skipped (--skip-tsne)")
        coords = None

    print("\nDone! Cached outputs in:", CACHE_DIR)
    if coords is not None:
        print(f"  embeddings : {embeddings.shape}")
        print(f"  tsne coords: {coords.shape}")

    # Return for programmatic use
    return records, embeddings, coords


if __name__ == "__main__":
    main()
