# textanalyse_backend/api/texts.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db import models
from ..schemas.texts import TextCreate, TextRead

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/texts", tags=["texts"])



@router.post("", response_model=TextRead, status_code=status.HTTP_201_CREATED)
def create_text(payload: TextCreate, db: Session = Depends(get_db)) -> TextRead:
    """
    Legt einen neuen Text in der Datenbank an.
    Wird später von der Input-Seite aufgerufen.
    """
    db_text = models.Text(
        name=payload.name,
        content=payload.content,
    )
    db.add(db_text)
    db.commit()
    db.refresh(db_text)
    logging.info(f"Text mit ID {db_text.id} in der Datenbank angelegt.")
    return db_text


@router.get("", response_model=List[TextRead])
def list_texts(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Filter nach Name oder Inhalt"),
) -> List[TextRead]:
    """
    Gibt eine Liste gespeicherter Texte zurück.
    Unterstützt Paging (limit/offset) und eine einfache Suchfunktion.
    """

    query = db.query(models.Text)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.Text.name.ilike(like)) | (models.Text.content.ilike(like))
        )

    texts = (
        query.order_by(models.Text.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return texts


@router.get("/{text_id}", response_model=TextRead)
def get_text(text_id: int, db: Session = Depends(get_db)) -> TextRead:
    """
    Liefert einen einzelnen Text anhand seiner ID.
    Praktisch, wenn du später in der Detailansicht den Inhalt nachladen willst.
    """
    db_text = db.query(models.Text).filter(models.Text.id == text_id).first()
    if not db_text:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Text mit ID {text_id} nicht gefunden.",
        )
    return db_text
