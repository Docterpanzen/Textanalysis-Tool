# backend/textanalyse_backend/api/textanalyse.py
from fastapi import APIRouter
from ..schemas.textanalyse import (
    AnalyzeRequest,
    TextAnalysisResult,
    ClusterInfo,
)
from ..services.preprocessing import clean_documents
from ..services.vectorization import vectorize
from ..services.clustering import reduce_dimensions, kmeans_cluster, top_terms_per_cluster

router = APIRouter(prefix="/analyze", tags=["textanalyse"])

@router.post("", response_model=TextAnalysisResult)
def analyze(req: AnalyzeRequest) -> TextAnalysisResult:
    texts = [doc.content for doc in req.documents]
    names = [doc.name for doc in req.documents]
    opts = req.options

    cleaned = clean_documents(texts)

    X, feature_names = vectorize(
        cleaned,
        mode=opts.vectorizer,      # "bow" | "tf" | "tfidf"
        max_features=opts.maxFeatures,
    )

    X_red = reduce_dimensions(X, opts.numComponents if opts.useDimReduction else None)

    k = opts.numClusters or 1
    labels = kmeans_cluster(X_red, k=k)

    cluster_terms = top_terms_per_cluster(
        X,
        labels=labels,
        feature_names=feature_names,
        k=k,
        top_n=10,
    )

    clusters: list[ClusterInfo] = []
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
