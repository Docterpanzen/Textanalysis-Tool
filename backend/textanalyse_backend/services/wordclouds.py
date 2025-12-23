from __future__ import annotations
import base64
import io
from typing import Dict, List
import numpy as np

try:
    from wordcloud import WordCloud
except ImportError:  # falls lib fehlt
    WordCloud = None  # type: ignore[assignment]


def _make_wordcloud_png(freqs: Dict[str, float]) -> str | None:
    '''
    Erstellt eine Wordcloud als PNG-Bild (Base64-kodiert) aus Wortfrequenzen.
    
    :param freqs: Wortfrequenzen (Wort -> Gewicht)
    :type freqs: Dict[str, float]
    :return: Base64-kodiertes PNG-Bild der Wordcloud oder None
    :rtype: str | None
    '''
    if WordCloud is None:
        return None

    if not freqs:
        return None

    wc = WordCloud(
        width=600,
        height=400,
        background_color="white",
        collocations=False,
    ).generate_from_frequencies(freqs)

    buf = io.BytesIO()
    wc.to_image().save(buf, format="PNG")
    png_bytes = buf.getvalue()
    return base64.b64encode(png_bytes).decode("ascii")


def generate_cluster_wordclouds(
    X,
    labels: np.ndarray,
    feature_names: List[str],
    top_n: int = 80,
) -> Dict[int, str]:
    '''
    Generiert Wordclouds für jeden Cluster basierend auf den Top-N Begriffen.

    :param X: Dokument-Term-Matrix (CSR)
    :param labels: Clusterlabels pro Dokument
    :type labels: np.ndarray
    :param feature_names: Vokabular (Index -> Wort)
    :type feature_names: List[str]
    :param top_n: Anzahl der Top-Begriffe pro Cluster
    :type top_n: int
    :return: Dictionary mit Cluster-ID als Schlüssel und Base64-kodiertem PNG-Bild als Wert
    :rtype: Dict[int, str]
    '''
    if WordCloud is None:
        return {}

    n_docs = X.shape[0]
    if n_docs == 0:
        return {}

    wordclouds: Dict[int, str] = {}
    labels = np.asarray(labels)

    for cluster_id in np.unique(labels):
        mask = labels == cluster_id
        if not mask.any():
            continue

        # Summe der Spalten aller Dokumente in diesem Cluster
        cluster_vec = np.asarray(X[mask].sum(axis=0)).ravel()
        # Indizes sortiert nach Gewicht, absteigend
        idx_sorted = np.argsort(-cluster_vec)

        freqs: Dict[str, float] = {}
        count = 0
        for idx in idx_sorted:
            weight = float(cluster_vec[idx])
            if weight <= 0:
                continue
            term = feature_names[idx]
            freqs[term] = weight
            count += 1
            if count >= top_n:
                break

        png_b64 = _make_wordcloud_png(freqs)
        if png_b64:
            wordclouds[int(cluster_id)] = png_b64

    return wordclouds
