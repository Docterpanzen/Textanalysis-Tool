# textanalyse_backend/services/pipeline.py
from typing import List
import logging

from ..schemas.textanalyse import (
    AnalyzeRequest,
    TextAnalysisResult,
    ClusterInfo,
)
from .preprocessing import clean_documents
from .vectorization import vectorize
from .clustering import reduce_dimensions, kmeans_cluster, top_terms_per_cluster

logger = logging.getLogger(__name__)


def run_pipeline(req: AnalyzeRequest) -> TextAnalysisResult:
    """Führt die komplette Textanalyse-Pipeline aus."""

    texts = [doc.content for doc in req.documents]
    names = [doc.name for doc in req.documents]
    opts = req.options

    # Logging JETZT, wo opts existiert
    logger.info(
        "Starte Pipeline: %d Dokumente, vectorizer=%s, clusters=%d",
        len(req.documents),
        opts.vectorizer,
        opts.numClusters,
    )

    # 1. Vorverarbeitung
    cleaned = clean_documents(texts)

    # 2. Vektorisierung (vectorizer ist bei dir aktuell ein string)
    X, feature_names = vectorize(
        cleaned,
        mode=opts.vectorizer,          # "bow" | "tf" | "tfidf"
        max_features=opts.maxFeatures,
    )

    # 3. Dimensionsreduktion (optional)
    if opts.useDimReduction:
        X_red = reduce_dimensions(X, opts.numComponents)
    else:
        # k-Means braucht ein dense array
        X_red = X.toarray()

    # 4. Clustering
    k = int(opts.numClusters)
    labels = kmeans_cluster(X_red, k=k)

    # 5. Typische Wörter je Cluster
    cluster_terms = top_terms_per_cluster(
        X,
        labels=labels,
        feature_names=feature_names,
        k=k,
        top_n=10,
    )

    # 6. Ergebnisobjekte bauen
    clusters: List[ClusterInfo] = []
    for cluster_id in range(k):
        doc_indices = [i for i, lab in enumerate(labels) if lab == cluster_id]
        clusters.append(
            ClusterInfo(
                id=cluster_id,
                documentNames=[names[i] for i in doc_indices],
                topTerms=cluster_terms[cluster_id],
            )
        )

    return TextAnalysisResult(
        clusters=clusters,
        vocabularySize=len(feature_names),
    )
