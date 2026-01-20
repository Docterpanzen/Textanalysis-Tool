from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..db.models import Text
from ..schemas.textanalyse import TextDocument


def load_text_records_by_ids(db: Session, text_ids: List[int]) -> List[Text]:
    """Load Text model records in the same order as the provided IDs."""

    if not text_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text IDs provided.",
        )

    db_texts = db.query(Text).filter(Text.id.in_(text_ids)).all()

    if not db_texts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No texts found for the provided IDs.",
        )

    by_id = {t.id: t for t in db_texts}
    missing = set(text_ids) - set(by_id.keys())
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Some text IDs were not found: {sorted(missing)}",
        )

    return [by_id[text_id] for text_id in text_ids]


def load_documents_by_ids(db: Session, text_ids: List[int]) -> List[TextDocument]:
    """Load texts from DB and convert them to TextDocument objects."""

    db_texts = load_text_records_by_ids(db, text_ids)

    return [
        TextDocument(
            name=t.name,
            content=t.content or "",
        )
        for t in db_texts
    ]
