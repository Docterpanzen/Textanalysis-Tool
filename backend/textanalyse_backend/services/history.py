import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from ..db import models
from ..schemas.textanalyse import TextAnalysisOptions, TextAnalysisResult

logger = logging.getLogger(__name__)


def _serialize_extra_options(opts: TextAnalysisOptions) -> str:
    payload = {
        "maxFeatures": opts.maxFeatures,
        "useStopwords": getattr(opts, "useStopwords", None),
        "stopwordMode": getattr(opts, "stopwordMode", None),
    }
    return json.dumps(payload)


def _parse_extra_options(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    return data


def build_options_payload(run: models.AnalysisRun) -> dict:
    extras = _parse_extra_options(run.description)
    return {
        "vectorizer": run.vectorizer,
        "maxFeatures": extras.get("maxFeatures"),
        "numClusters": run.num_clusters,
        "useDimReduction": run.use_dim_reduction,
        "numComponents": run.num_components,
        "useStopwords": extras.get("useStopwords"),
        "stopwordMode": extras.get("stopwordMode"),
    }


def save_analysis_run(
    db: Session,
    text_ids: List[int],
    options: TextAnalysisOptions,
    labels: List[int],
    result: TextAnalysisResult,
) -> models.AnalysisRun:
    if len(text_ids) != len(labels):
        raise ValueError("Label count does not match text ID count.")

    stopword_mode = getattr(options, "stopwordMode", None)
    use_stopwords = getattr(options, "useStopwords", None)
    language = None
    if use_stopwords is False:
        language = "none"
    elif stopword_mode:
        language = stopword_mode

    run = models.AnalysisRun(
        vectorizer=options.vectorizer,
        num_clusters=options.numClusters,
        use_dim_reduction=options.useDimReduction,
        num_components=options.numComponents,
        language=language,
        description=_serialize_extra_options(options),
    )
    db.add(run)
    db.flush()

    for text_id in text_ids:
        db.add(
            models.AnalysisRunText(
                analysis_run_id=run.id,
                text_id=text_id,
            )
        )

    clusters_by_index: dict[int, models.Cluster] = {}
    for cluster in result.clusters:
        db_cluster = models.Cluster(
            analysis_run_id=run.id,
            cluster_index=cluster.id,
            top_terms=json.dumps(cluster.topTerms),
            wordcloud_png=cluster.wordCloudPng,
            size=len(cluster.documentNames),
        )
        db.add(db_cluster)
        clusters_by_index[cluster.id] = db_cluster

    db.flush()

    for text_id, label in zip(text_ids, labels):
        cluster = clusters_by_index.get(label)
        if not cluster:
            logger.warning("Missing cluster for label %s in run %s", label, run.id)
            continue
        db.add(
            models.ClusterAssignment(
                cluster_id=cluster.id,
                text_id=text_id,
            )
        )

    db.commit()
    db.refresh(run)
    return run
