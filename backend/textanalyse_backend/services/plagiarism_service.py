import random
import re
import numpy as np
from typing import List, Set

import logging

logger = logging.getLogger(__name__)

# helpers

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9äöüß\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def get_char_shingles(text: str, k: int) -> Set[str]:
    return {text[i:i+k] for i in range(len(text) - k + 1)}


def get_word_shingles(text: str, k: int) -> Set[str]:
    words = text.split()
    return {" ".join(words[i:i+k]) for i in range(len(words) - k + 1)}


def generate_hash_functions(n: int):
    max_hash = 2**31 - 1
    funcs = []
    for _ in range(n):
        a = random.randint(1, max_hash)
        b = random.randint(0, max_hash)
        funcs.append(lambda x, a=a, b=b: (a * hash(x) + b) % max_hash)
    return funcs


# core logic

def compute_minhash(shingles: List[Set[str]], num_hashes: int) -> np.ndarray:
    hash_funcs = generate_hash_functions(num_hashes)
    sig = np.full((num_hashes, len(shingles)), np.inf)

    for doc_idx, shingle_set in enumerate(shingles):
        for sh in shingle_set:
            for h_idx, h in enumerate(hash_funcs):
                sig[h_idx, doc_idx] = min(sig[h_idx, doc_idx], h(sh))

    return sig


def lsh_candidate(signature: np.ndarray, bands: int, rows: int) -> bool:
    for b in range(bands):
        start = b * rows
        end = start + rows
        if end > signature.shape[0]:
            break

        band = signature[start:end, :]
        if tuple(band[:, 0]) == tuple(band[:, 1]):
            return True

    return False


def jaccard(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


# public API

def check_plagiarism(
    text_a: str,
    text_b: str,
    *,
    shingle_size: int,
    shingle_type: str,
    num_hashes: int,
    num_bands: int,
    num_rows: int,
    clean: bool,
):
    logger.info("Plagiatprüfung gestartet.")
    if clean:
        text_a = clean_text(text_a)
        text_b = clean_text(text_b)

    if shingle_type == "word":
        shingles_a = get_word_shingles(text_a, shingle_size)
        shingles_b = get_word_shingles(text_b, shingle_size)
    else:
        shingles_a = get_char_shingles(text_a, shingle_size)
        shingles_b = get_char_shingles(text_b, shingle_size)

    signature = compute_minhash([shingles_a, shingles_b], num_hashes)
    candidate = lsh_candidate(signature, num_bands, num_rows)

    jac = jaccard(shingles_a, shingles_b)

    return {
        "similarity_percent": round(jac * 100, 2),
        "jaccard_estimate": round(jac * 100, 2),
        "candidate_pair": candidate,
    }
