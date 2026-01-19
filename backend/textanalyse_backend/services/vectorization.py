from typing import Tuple, Literal, Optional

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

from .helpers import get_stopwords

VectorizerType = Literal["bow", "tf", "tfidf"]


def vectorize(
    texts: list[str],
    mode: VectorizerType,
    max_features: Optional[int] = None,
    stopword_mode: Optional[str] = "de",
) -> Tuple[csr_matrix, list[str]]:
    """
    Vectorize a list of texts using BoW, TF or TF-IDF.

    Parameters
    ----------
    texts : list[str]
        Preprocessed texts (already cleaned/tokenized on a basic level).
    mode : "bow" | "tf" | "tfidf"
        Vectorization mode.
    max_features : int | None
        Maximum vocabulary size (None = unlimited).
    stopword_mode : str | None
        Controls which stopwords to remove:
          - None / "" / "none" / "off"  -> no stopword removal (backwards compatible)
          - e.g. "de", "en", "de_en"    -> passed to get_stopwords(...)
    """

    # Decide whether we use any stopwords
    stop_words = None
    if stopword_mode is not None:
        m = (stopword_mode or "").lower()
        if m not in ("", "none", "off"):
            # get_stopwords should return a set/list of lowercase strings
            sw = get_stopwords(m)
            stop_words = list(sw) if sw else None

    if mode in ("bow", "tf"):
        vec = CountVectorizer(
            max_features=max_features,
            stop_words=stop_words,
        )
        X = vec.fit_transform(texts)

        if mode == "tf":
            # Row-wise normalization to term frequency
            row_sums = np.asarray(X.sum(axis=1)).ravel()
            row_sums[row_sums == 0] = 1  # avoid division by zero
            X = X.multiply(1 / row_sums[:, None]).tocsr()

    elif mode == "tfidf":
        vec = TfidfVectorizer(
            max_features=max_features,
            stop_words=stop_words,
        )
        X = vec.fit_transform(texts)

    else:
        raise ValueError(f"Unknown vectorizer mode: {mode}")

    feature_names = list(vec.get_feature_names_out())
    return X, feature_names
