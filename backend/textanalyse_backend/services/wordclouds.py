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
    """
    Erzeuge ein PNG als Base64-String aus Wortfrequenzen.
    Gibt None zurück, wenn wordcloud nicht installiert ist
    oder keine sinnvollen Frequenzen vorhanden sind.
    """
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
    """
    Berechnet für jeden Cluster eine Wordcloud (als Base64-PNG-String).
    X: Dokument-Term-Matrix (CSR)
    labels: Clusterlabels pro Dokument
    feature_names: Vokabular (Index -> Wort)
    """
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
