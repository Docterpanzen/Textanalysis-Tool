import re
from typing import List


def clean_text(text: str) -> str:
    '''
    Clean a single text by removing punctuation and extra whitespace,
    and converting to lowercase.
    '''
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text, flags=re.UNICODE)
    return text.strip().lower()


def clean_documents(texts: List[str]) -> List[str]:
    '''
    Clean a list of documents by removing punctuation and extra whitespace,
    and converting to lowercase.
    '''
    return [clean_text(t) for t in texts]
