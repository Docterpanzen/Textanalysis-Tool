from __future__ import annotations

import json
from datetime import datetime
from typing import Iterable, List, Optional

from sqlalchemy import desc, func, distinct
from sqlalchemy.orm import Session

from ..db import models


def _normalize_tags(tags: Iterable[str]) -> List[str]:
    normalized = []
    seen = set()
    for tag in tags:
        val = (tag or "").strip()
        if not val:
            continue
        lower = val.lower()
        if lower in seen:
            continue
        seen.add(lower)
        normalized.append(val)
    return normalized


def parse_tags(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [t.strip() for t in raw.split(",") if t.strip()]
    if isinstance(data, list):
        return [str(t).strip() for t in data if str(t).strip()]
    return [str(data).strip()]


def serialize_tags(tags: Iterable[str]) -> str:
    return json.dumps(_normalize_tags(tags))


def update_run_tags(db: Session, run_id: int, tags: Iterable[str]) -> List[str]:
    run = db.query(models.AnalysisRun).filter(models.AnalysisRun.id == run_id).first()
    if not run:
        raise ValueError("not_found")
    normalized = _normalize_tags(tags)
    run.tags = serialize_tags(normalized)
    db.add(run)
    db.commit()
    db.refresh(run)
    return normalized


def list_admin_runs(
    db: Session,
    sort: str = "desc",
    tag: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> list[tuple[models.AnalysisRun, int, int]]:
    query = (
        db.query(
            models.AnalysisRun,
            func.count(distinct(models.AnalysisRunText.text_id)).label("text_count"),
            func.count(distinct(models.Cluster.id)).label("cluster_count"),
        )
        .outerjoin(
            models.AnalysisRunText,
            models.AnalysisRunText.analysis_run_id == models.AnalysisRun.id,
        )
        .outerjoin(models.Cluster, models.Cluster.analysis_run_id == models.AnalysisRun.id)
    )

    if start and end:
        query = query.filter(models.AnalysisRun.created_at >= start)
        query = query.filter(models.AnalysisRun.created_at <= end)

    sort_order = models.AnalysisRun.created_at.asc()
    if sort.lower() == "desc":
        sort_order = desc(models.AnalysisRun.created_at)

    rows = query.group_by(models.AnalysisRun.id).order_by(sort_order).all()

    if tag:
        tag_lower = tag.strip().lower()
        if tag_lower:
            rows = [
                (run, text_count, cluster_count)
                for run, text_count, cluster_count in rows
                if tag_lower in {t.lower() for t in parse_tags(run.tags)}
            ]

    return rows
