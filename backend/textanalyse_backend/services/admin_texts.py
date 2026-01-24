from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from ..db import models


def list_all_texts(db: Session) -> List[models.Text]:
    return (
        db.query(models.Text)
        .order_by(models.Text.created_at.desc())
        .all()
    )


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
