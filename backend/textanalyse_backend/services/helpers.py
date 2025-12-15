from __future__ import annotations

from functools import lru_cache
import io
from pathlib import Path
from typing import Set

import pdfplumber
from docx import Document

import nltk
from nltk.corpus import stopwords as nltk_stopwords



def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()


def extract_text_from_bytes(filename: str, data: bytes) -> str:
    """
    Extract text depending on file extension.
    Supported: .txt, .md, .pdf, .docx
    """
    ext = _ext(filename)

    if ext in (".txt", ".md"):
        # try utf-8 first, fallback to latin-1 (common for older docs)
        try:
            return data.decode("utf-8")
        except UnicodeDecodeError:
            return data.decode("latin-1", errors="replace")

    if ext == ".docx":
        bio = io.BytesIO(data)
        doc = Document(bio)
        # join paragraphs
        return "\n".join(p.text for p in doc.paragraphs)

    if ext == ".pdf":
        bio = io.BytesIO(data)
        texts: list[str] = []
        with pdfplumber.open(bio) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t.strip():
                    texts.append(t)
        return "\n\n".join(texts)

    raise ValueError(f"Unsupported file type: {ext}. Supported: .txt, .md, .pdf, .docx")


# Ensure stopwords corpus is available
def _ensure_stopwords_downloaded() -> None:
    """
    Make sure the NLTK stopwords corpus is available.
    In development this will download it once if missing.
    In production you would typically pre-download it.
    """
    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        nltk.download("stopwords")


@lru_cache(maxsize=8)
def get_stopwords(lang_mode: str = "de_en") -> Set[str]:
    """
    Return a stopword set for the requested language mode.

    lang_mode:
      - "de", "german"   -> German stopwords
      - "en", "english"  -> English stopwords
      - "de_en", "both"  -> union of German + English (default)
      - "none", "off"    -> empty set (no stopwords)
    """
    mode = (lang_mode or "").lower()

    if mode in ("none", "off"):
        return set()

    _ensure_stopwords_downloaded()

    if mode in ("de", "german"):
        return set(w.lower() for w in nltk_stopwords.words("german"))

    if mode in ("en", "english"):
        return set(w.lower() for w in nltk_stopwords.words("english"))

    # default: assume German + English mixed
    de = set(w.lower() for w in nltk_stopwords.words("german"))
    en = set(w.lower() for w in nltk_stopwords.words("english"))
    
    return de | en
