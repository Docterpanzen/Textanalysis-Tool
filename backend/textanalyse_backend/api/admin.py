from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from ..db import models
from ..db.session import get_db
from ..schemas.admin import (
    AdminBulkDeleteRequest,
    AdminBulkDeleteResponse,
    AdminCleanupSuggestions,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminRunRead,
    AdminRunUpdateTagsRequest,
    AdminTextRead,
    AdminUpdateTagsRequest,
)
from ..services.admin_auth import ADMIN_PASSWORD, ADMIN_USERNAME, create_token, require_admin
from ..services.admin_texts import (
    bulk_delete_texts,
    cleanup_suggestions,
    get_usage_map,
    list_admin_texts,
    list_all_texts,
    parse_tags,
    update_text_tags,
)
from ..services.admin_runs import (
    delete_run,
    list_admin_runs,
    parse_tags as parse_run_tags,
    update_run_tags,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    if payload.username != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    token = create_token()
    return AdminLoginResponse(token=token)


@router.get("/texts", response_model=List[AdminTextRead])
def admin_list_texts(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
    search: Optional[str] = Query(None),
    scope: str = Query("both", pattern="^(name|content|both)$"),
    tag: Optional[str] = Query(None),
) -> List[AdminTextRead]:
    texts = list_admin_texts(db, search=search, scope=scope, tag=tag)
    usage = get_usage_map(db)

    response: List[AdminTextRead] = []
    for text in texts:
        run_ids = usage.get(text.id, [])
        response.append(
            AdminTextRead(
                id=text.id,
                name=text.name,
                content=text.content,
                tags=parse_tags(text.tags),
                created_at=text.created_at,
                usedInHistory=len(run_ids) > 0,
                historyRunIds=sorted(set(run_ids)),
            )
        )

    return response


@router.delete("/texts/{text_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_text(
    text_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> Response:
    deleted, in_use, not_found = bulk_delete_texts(db, [text_id])
    if not deleted:
        if text_id in not_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Text {text_id} not found.",
            )
        if text_id in in_use:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Text is referenced by analysis history and cannot be deleted.",
            )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/texts/{text_id}/tags", response_model=AdminTextRead)
def admin_update_tags(
    text_id: int,
    payload: AdminUpdateTagsRequest,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> AdminTextRead:
    try:
        tags = update_text_tags(db, text_id, payload.tags)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Text {text_id} not found.",
        )

    usage = get_usage_map(db)
    run_ids = usage.get(text_id, [])
    text = db.query(models.Text).filter(models.Text.id == text_id).first()
    if not text:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Text not found.")

    return AdminTextRead(
        id=text.id,
        name=text.name,
        content=text.content,
        tags=tags,
        created_at=text.created_at,
        usedInHistory=len(run_ids) > 0,
        historyRunIds=sorted(set(run_ids)),
    )


@router.post("/texts/bulk-delete", response_model=AdminBulkDeleteResponse)
def admin_bulk_delete(
    payload: AdminBulkDeleteRequest,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> AdminBulkDeleteResponse:
    deleted, in_use, not_found = bulk_delete_texts(db, payload.ids)
    return AdminBulkDeleteResponse(
        deletedIds=deleted,
        inUseIds=in_use,
        notFoundIds=not_found,
    )


@router.get("/texts/cleanup", response_model=AdminCleanupSuggestions)
def admin_cleanup_suggestions(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> AdminCleanupSuggestions:
    unused, empty, duplicates = cleanup_suggestions(db)
    return AdminCleanupSuggestions(
        unusedIds=unused,
        emptyIds=empty,
        duplicateGroups=duplicates,
    )


@router.get("/texts/export.csv")
def admin_export_csv(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> Response:
    texts = list_all_texts(db)
    usage = get_usage_map(db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "content", "tags", "created_at", "used_in_history"])

    for text in texts:
        tags = text.tags or ""
        used = "yes" if text.id in usage else "no"
        writer.writerow(
            [
                text.id,
                text.name,
                text.content,
                tags,
                text.created_at.isoformat() if text.created_at else "",
                used,
            ]
        )

    headers = {
        "Content-Disposition": "attachment; filename=admin_texts.csv",
    }
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers=headers,
    )


@router.get("/runs", response_model=List[AdminRunRead])
def admin_list_runs(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    tag: Optional[str] = Query(None),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
) -> List[AdminRunRead]:
    if bool(start) ^ bool(end):
        start = None
        end = None

    rows = list_admin_runs(db, sort=sort, tag=tag, start=start, end=end)
    return [
        AdminRunRead(
            id=run.id,
            created_at=run.created_at,
            vectorizer=run.vectorizer,
            numClusters=run.num_clusters,
            useDimReduction=run.use_dim_reduction,
            numComponents=run.num_components,
            textCount=text_count or 0,
            clusterCount=cluster_count or 0,
            tags=parse_run_tags(run.tags),
        )
        for run, text_count, cluster_count in rows
    ]


@router.patch("/runs/{run_id}/tags", response_model=AdminRunRead)
def admin_update_run_tags(
    run_id: int,
    payload: AdminRunUpdateTagsRequest,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> AdminRunRead:
    try:
        tags = update_run_tags(db, run_id, payload.tags)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found.",
        )

    row = (
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
        .filter(models.AnalysisRun.id == run_id)
        .group_by(models.AnalysisRun.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found.")

    run, text_count, cluster_count = row
    return AdminRunRead(
        id=run.id,
        created_at=run.created_at,
        vectorizer=run.vectorizer,
        numClusters=run.num_clusters,
        useDimReduction=run.use_dim_reduction,
        numComponents=run.num_components,
        textCount=text_count or 0,
        clusterCount=cluster_count or 0,
        tags=tags,
    )


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_run(
    run_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> Response:
    try:
        delete_run(db, run_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
