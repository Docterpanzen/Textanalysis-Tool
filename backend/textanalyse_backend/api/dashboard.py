from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import distinct, func, desc
from sqlalchemy.orm import Session

from ..db import models
from ..db.session import get_db
from ..schemas.dashboard import DashboardMetrics, DashboardInsights, DashboardQuality, RunSeriesPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _parse_terms(raw: Optional[str]) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [t.strip() for t in raw.split(",") if t.strip()]
    if isinstance(data, list):
        return [str(t) for t in data if str(t).strip()]
    return [str(data)]


@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
) -> DashboardMetrics:
    if bool(start) ^ bool(end):
        start = None
        end = None

    runs_query = db.query(models.AnalysisRun)
    if start and end:
        runs_query = runs_query.filter(models.AnalysisRun.created_at >= start)
        runs_query = runs_query.filter(models.AnalysisRun.created_at <= end)

    total_runs = runs_query.count()

    latest_run = runs_query.order_by(desc(models.AnalysisRun.created_at)).first()
    latest_run_at = latest_run.created_at if latest_run else None

    run_ids = [row[0] for row in runs_query.with_entities(models.AnalysisRun.id).all()]

    if not run_ids:
        return DashboardMetrics(
            totalRuns=0,
            totalTexts=0,
            avgTextsPerRun=0.0,
            avgClustersPerRun=0.0,
            latestRunAt=None,
            runSeries=[],
            insights=DashboardInsights(topTerms=[]),
            quality=DashboardQuality(emptyTextCount=0, avgTextLength=0.0, singletonClusterRate=0.0),
        )

    total_text_links = (
        db.query(models.AnalysisRunText)
        .filter(models.AnalysisRunText.analysis_run_id.in_(run_ids))
        .count()
    )

    text_ids = [
        row[0]
        for row in db.query(distinct(models.AnalysisRunText.text_id))
        .filter(models.AnalysisRunText.analysis_run_id.in_(run_ids))
        .all()
    ]
    total_texts = len(text_ids)

    total_clusters = (
        db.query(models.Cluster)
        .filter(models.Cluster.analysis_run_id.in_(run_ids))
        .count()
    )

    avg_texts_per_run = total_text_links / total_runs if total_runs else 0.0
    avg_clusters_per_run = total_clusters / total_runs if total_runs else 0.0

    empty_text_count = 0
    avg_text_length = 0.0
    if text_ids:
        empty_text_count = (
            db.query(models.Text)
            .filter(models.Text.id.in_(text_ids))
            .filter(func.length(models.Text.content) == 0)
            .count()
        )
        avg_text_length = (
            db.query(func.avg(func.length(models.Text.content)))
            .filter(models.Text.id.in_(text_ids))
            .scalar()
            or 0.0
        )

    singleton_clusters = (
        db.query(models.Cluster)
        .filter(models.Cluster.analysis_run_id.in_(run_ids))
        .filter(models.Cluster.size <= 1)
        .count()
    )
    singleton_rate = singleton_clusters / total_clusters if total_clusters else 0.0

    series_rows = (
        db.query(func.date(models.AnalysisRun.created_at).label("day"), func.count())
        .filter(models.AnalysisRun.id.in_(run_ids))
        .group_by("day")
        .order_by("day")
        .all()
    )
    run_series = [RunSeriesPoint(date=str(day), count=count) for day, count in series_rows]

    term_counter: Counter[str] = Counter()
    term_rows = (
        db.query(models.Cluster.top_terms)
        .filter(models.Cluster.analysis_run_id.in_(run_ids))
        .all()
    )
    for (raw_terms,) in term_rows:
        for term in _parse_terms(raw_terms):
            term_counter[term.lower()] += 1

    top_terms = [term for term, _ in term_counter.most_common(8)]

    vectorizer_row = (
        runs_query.with_entities(models.AnalysisRun.vectorizer, func.count())
        .group_by(models.AnalysisRun.vectorizer)
        .order_by(desc(func.count()))
        .first()
    )
    most_common_vectorizer = vectorizer_row[0] if vectorizer_row else None

    cluster_count_row = (
        runs_query.with_entities(models.AnalysisRun.num_clusters, func.count())
        .group_by(models.AnalysisRun.num_clusters)
        .order_by(desc(func.count()))
        .first()
    )
    most_common_cluster_count = cluster_count_row[0] if cluster_count_row else None

    return DashboardMetrics(
        totalRuns=total_runs,
        totalTexts=total_texts,
        avgTextsPerRun=avg_texts_per_run,
        avgClustersPerRun=avg_clusters_per_run,
        latestRunAt=latest_run_at,
        runSeries=run_series,
        insights=DashboardInsights(
            topTerms=top_terms,
            mostCommonVectorizer=most_common_vectorizer,
            mostCommonClusterCount=most_common_cluster_count,
        ),
        quality=DashboardQuality(
            emptyTextCount=empty_text_count,
            avgTextLength=avg_text_length,
            singletonClusterRate=singleton_rate,
        ),
    )
