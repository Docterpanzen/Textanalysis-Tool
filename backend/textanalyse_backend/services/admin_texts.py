from __future__ import annotations

from __future__ import annotations

import hashlib
import json
from typing import Iterable, List, Optional, Tuple

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


def _serialize_tags(tags: Iterable[str]) -> str:
    return json.dumps(_normalize_tags(tags))


def list_all_texts(db: Session) -> List[models.Text]:
    return db.query(models.Text).order_by(models.Text.created_at.desc()).all()


def list_admin_texts(
    db: Session,
    search: Optional[str] = None,
    scope: str = "both",
    tag: Optional[str] = None,
) -> List[models.Text]:
    query = db.query(models.Text)

    if search:
        like = f"%{search}%"
        if scope == "name":
            query = query.filter(models.Text.name.ilike(like))
        elif scope == "content":
            query = query.filter(models.Text.content.ilike(like))
        else:
            query = query.filter(
                (models.Text.name.ilike(like)) | (models.Text.content.ilike(like))
            )

    texts = query.order_by(models.Text.created_at.desc()).all()

    if tag:
        tag_lower = tag.strip().lower()
        if tag_lower:
            texts = [
                t
                for t in texts
                if tag_lower in {x.lower() for x in parse_tags(t.tags)}
            ]

    return texts


def get_usage_map(db: Session) -> dict[int, list[int]]:
    links = db.query(models.AnalysisRunText.text_id, models.AnalysisRunText.analysis_run_id).all()
    usage: dict[int, list[int]] = {}
    for text_id, run_id in links:
        usage.setdefault(text_id, []).append(run_id)
    return usage


def update_text_tags(db: Session, text_id: int, tags: Iterable[str]) -> List[str]:
    text = db.query(models.Text).filter(models.Text.id == text_id).first()
    if not text:
        raise ValueError("not_found")

    normalized = _normalize_tags(tags)
    text.tags = _serialize_tags(normalized)
    db.add(text)
    db.commit()
    db.refresh(text)
    return normalized


def delete_text_if_unused(db: Session, text_id: int) -> None:
    text = db.query(models.Text).filter(models.Text.id == text_id).first()
    if not text:
        raise ValueError("not_found")

    has_run_link = (
        db.query(models.AnalysisRunText)
        .filter(models.AnalysisRunText.text_id == text_id)
        .first()
    )
    has_cluster_link = (
        db.query(models.ClusterAssignment)
        .filter(models.ClusterAssignment.text_id == text_id)
        .first()
    )

    if has_run_link or has_cluster_link:
        raise ValueError("in_use")

    db.delete(text)
    db.commit()


def bulk_delete_texts(db: Session, ids: Iterable[int]) -> Tuple[List[int], List[int], List[int]]:
    deleted: List[int] = []
    in_use: List[int] = []
    not_found: List[int] = []
    for text_id in ids:
        try:
            delete_text_if_unused(db, int(text_id))
            deleted.append(int(text_id))
        except ValueError as exc:
            if str(exc) == "not_found":
                not_found.append(int(text_id))
            elif str(exc) == "in_use":
                in_use.append(int(text_id))
            else:
                raise
    return deleted, in_use, not_found


def cleanup_suggestions(db: Session) -> tuple[list[int], list[int], list[list[int]]]:
    texts = db.query(models.Text).all()

    run_links = {
        row.text_id
        for row in db.query(models.AnalysisRunText.text_id).distinct().all()
    }
    cluster_links = {
        row.text_id
        for row in db.query(models.ClusterAssignment.text_id).distinct().all()
    }

    unused = [t.id for t in texts if t.id not in run_links and t.id not in cluster_links]
    empty = [t.id for t in texts if not (t.content or "").strip()]

    dup_map: dict[str, list[int]] = {}
    for t in texts:
        content = (t.content or "").strip()
        if not content:
            continue
        digest = hashlib.md5(content.encode("utf-8", errors="ignore")).hexdigest()
        dup_map.setdefault(digest, []).append(t.id)

    duplicate_groups = [ids for ids in dup_map.values() if len(ids) > 1]
    return unused, empty, duplicate_groups
