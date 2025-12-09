from __future__ import annotations

from functools import lru_cache
from typing import Set

import nltk
from nltk.corpus import stopwords as nltk_stopwords


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
