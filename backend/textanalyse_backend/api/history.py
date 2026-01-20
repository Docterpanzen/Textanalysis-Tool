import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, distinct, func
from sqlalchemy.orm import Session, selectinload

from ..db import models
from ..db.session import get_db
from ..schemas.history import (
    AnalysisRunDetail,
    AnalysisRunOptions,
    AnalysisRunSummary,
    AnalysisRunText,
    ClusterSummary,
    HistoryOverview,
)
from ..services.history import build_options_payload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])


def _parse_top_terms(raw: Optional[str]) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [term.strip() for term in raw.split(",") if term.strip()]
    if isinstance(data, list):
        return [str(term) for term in data]
    return [str(data)]


def _parse_text_ids(raw: Optional[str]) -> list[int]:
    if not raw:
        return []
    ids: list[int] = []
    for part in raw.replace(";", ",").split(","):
        value = part.strip()
        if not value:
            continue
        try:
            ids.append(int(value))
        except ValueError:
            continue
    return ids


@router.get("", response_model=HistoryOverview)
def list_history(
    db: Session = Depends(get_db),
    start: Optional[datetime] = Query(None, description="Start timestamp (ISO8601)"),
    end: Optional[datetime] = Query(None, description="End timestamp (ISO8601)"),
    text_ids: Optional[str] = Query(
        None, description="Comma-separated text IDs to filter"
    ),
    sort: str = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> HistoryOverview:
    total_runs = db.query(func.count(models.AnalysisRun.id)).scalar() or 0

    now = datetime.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    today_runs = (
        db.query(func.count(models.AnalysisRun.id))
        .filter(models.AnalysisRun.created_at >= start_of_day)
        .filter(models.AnalysisRun.created_at < end_of_day)
        .scalar()
        or 0
    )

    text_id_list = _parse_text_ids(text_ids)
    run_ids_subquery = None
    if text_id_list:
        run_ids_subquery = (
            db.query(distinct(models.AnalysisRunText.analysis_run_id))
            .filter(models.AnalysisRunText.text_id.in_(text_id_list))
            .subquery()
        )

    filtered_query = db.query(models.AnalysisRun)
    if start:
        filtered_query = filtered_query.filter(models.AnalysisRun.created_at >= start)
    if end:
        filtered_query = filtered_query.filter(models.AnalysisRun.created_at <= end)
    if run_ids_subquery is not None:
        filtered_query = filtered_query.filter(models.AnalysisRun.id.in_(run_ids_subquery))
    filtered_runs = filtered_query.count()

    data_query = (
        db.query(
            models.AnalysisRun,
            func.count(distinct(models.AnalysisRunText.text_id)).label("text_count"),
            func.count(distinct(models.Cluster.id)).label("cluster_count"),
        )
        .outerjoin(
            models.AnalysisRunText,
            models.AnalysisRunText.analysis_run_id == models.AnalysisRun.id,
        )
        .outerjoin(
            models.Cluster,
            models.Cluster.analysis_run_id == models.AnalysisRun.id,
        )
    )
    if start:
        data_query = data_query.filter(models.AnalysisRun.created_at >= start)
    if end:
        data_query = data_query.filter(models.AnalysisRun.created_at <= end)
    if run_ids_subquery is not None:
        data_query = data_query.filter(models.AnalysisRun.id.in_(run_ids_subquery))

    sort_order = models.AnalysisRun.created_at.asc()
    if sort.lower() == "desc":
        sort_order = desc(models.AnalysisRun.created_at)

    rows = (
        data_query.group_by(models.AnalysisRun.id)
        .order_by(sort_order)
        .offset(offset)
        .limit(limit)
        .all()
    )

    runs = [
        AnalysisRunSummary(
            id=run.id,
            created_at=run.created_at,
            vectorizer=run.vectorizer,
            numClusters=run.num_clusters,
            useDimReduction=run.use_dim_reduction,
            numComponents=run.num_components,
            textCount=text_count or 0,
            clusterCount=cluster_count or 0,
        )
        for run, text_count, cluster_count in rows
    ]

    return HistoryOverview(
        totalRuns=total_runs,
        todayRuns=today_runs,
        filteredRuns=filtered_runs,
        runs=runs,
    )


@router.get("/{run_id}", response_model=AnalysisRunDetail)
def get_history_detail(
    run_id: int,
    db: Session = Depends(get_db),
) -> AnalysisRunDetail:
    run = (
        db.query(models.AnalysisRun)
        .options(
            selectinload(models.AnalysisRun.texts).selectinload(models.AnalysisRunText.text),
            selectinload(models.AnalysisRun.clusters)
            .selectinload(models.Cluster.assignments)
            .selectinload(models.ClusterAssignment.text),
        )
        .filter(models.AnalysisRun.id == run_id)
        .first()
    )

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run {run_id} not found.",
        )

    text_map = {}
    for link in run.texts:
        if link.text and link.text.id not in text_map:
            text_map[link.text.id] = link.text

    texts = [
        AnalysisRunText(
            id=text.id,
            name=text.name,
            content=text.content or "",
            created_at=text.created_at,
        )
        for text in sorted(text_map.values(), key=lambda t: t.id)
    ]

    clusters: list[ClusterSummary] = []
    for cluster in sorted(run.clusters, key=lambda c: c.cluster_index):
        text_ids = []
        text_names = []
        for assignment in cluster.assignments:
            text_ids.append(assignment.text_id)
            if assignment.text:
                text_names.append(assignment.text.name)

        clusters.append(
            ClusterSummary(
                id=cluster.id,
                clusterIndex=cluster.cluster_index,
                topTerms=_parse_top_terms(cluster.top_terms),
                wordCloudPng=cluster.wordcloud_png,
                size=cluster.size,
                textIds=text_ids,
                textNames=text_names,
            )
        )

    options_payload = build_options_payload(run)

    return AnalysisRunDetail(
        id=run.id,
        created_at=run.created_at,
        options=AnalysisRunOptions(**options_payload),
        texts=texts,
        clusters=clusters,
    )
