# backend/textanalyse_backend/services/preprocessing.py
import re
from typing import List


def clean_text(text: str) -> str:
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text, flags=re.UNICODE)
    return text.strip().lower()


def clean_documents(texts: List[str]) -> List[str]:
    return [clean_text(t) for t in texts]
