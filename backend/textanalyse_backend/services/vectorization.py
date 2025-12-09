from typing import Tuple, Literal, Optional
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
import numpy as np

VectorizerType = Literal["bow", "tf", "tfidf"]

def vectorize(
    texts: list[str],
    mode: VectorizerType,
    max_features: Optional[int] = None,
) -> Tuple[csr_matrix, list[str]]:
    if mode in ("bow", "tf"):
        vec = CountVectorizer(max_features=max_features)
        X = vec.fit_transform(texts)

        if mode == "tf":
            row_sums = np.asarray(X.sum(axis=1)).ravel()
            row_sums[row_sums == 0] = 1
            X = X.multiply(1 / row_sums[:, None])
    else:
        vec = TfidfVectorizer(max_features=max_features)
        X = vec.fit_transform(texts)

    feature_names = list(vec.get_feature_names_out())
    return X, feature_names
