from typing import List

import numpy as np

from ..schemas.textanalyse import (
    TextDocument,
    TextAnalysisOptions,
    TextAnalysisResult,
    ClusterInfo,
)
from .preprocessing import clean_documents
from .vectorization import vectorize
from .clustering import reduce_dimensions, kmeans_cluster, top_terms_per_cluster
from .wordclouds import generate_cluster_wordclouds  # NEW

import logging

logger = logging.getLogger(__name__)


def run_pipeline(
    documents: List[TextDocument],
    opts: TextAnalysisOptions,
) -> TextAnalysisResult:
    '''
    Führt die Textanalyse-Pipeline durch. 
    
    :param documents: Liste der zu analysierenden Dokumente
    :type documents: List[TextDocument]
    :param opts: Analyse-Optionen
    :type opts: TextAnalysisOptions
    :return: Ergebnis der Textanalyse
    :rtype: TextAnalysisResult
    '''
    logger.info(
        "Starte Pipeline: %d Dokumente, vectorizer=%s, clusters=%d",
        len(documents),
        opts.vectorizer,
        opts.numClusters,
    )

    texts = [doc.content for doc in documents]
    names = [doc.name for doc in documents]

    cleaned = clean_documents(texts)

    stopword_mode = getattr(opts, "stopwordMode", "de")
    if not getattr(opts, "useStopwords", True):
        stopword_mode = "none"

    X, feature_names = vectorize(
        cleaned,
        mode=opts.vectorizer,
        max_features=opts.maxFeatures,
        stopword_mode=stopword_mode,
    )

    if opts.useDimReduction:
        X_red = reduce_dimensions(X, opts.numComponents)
    else:
        X_red = X.toarray()

    k = int(opts.numClusters)
    labels = kmeans_cluster(X_red, k=k)

    cluster_terms = top_terms_per_cluster(
        X,
        labels=labels,
        feature_names=feature_names,
        k=k,
        top_n=10,
    )

    try:
        cluster_wordclouds = generate_cluster_wordclouds(
            X,
            labels=np.array(labels),
            feature_names=feature_names,
            top_n=80,
        )
    except Exception as e:  
        logger.exception("Fehler bei der Wordcloud-Erzeugung: %s", e)
        cluster_wordclouds = {}

    clusters: List[ClusterInfo] = []
    for cluster_id in range(k):
        doc_indices = [i for i, lab in enumerate(labels) if lab == cluster_id]
        clusters.append(
            ClusterInfo(
                id=cluster_id,
                documentNames=[names[i] for i in doc_indices],
                topTerms=cluster_terms[cluster_id],
                wordCloudPng=cluster_wordclouds.get(cluster_id),
            )
        )

    return TextAnalysisResult(
        clusters=clusters,
        vocabularySize=len(feature_names),
    )
