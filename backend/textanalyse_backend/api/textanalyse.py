from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from ..schemas.textanalyse import (
    AnalyzeRequest,
    AnalyzeByIdsRequest,
    TextDocument,
    TextAnalysisResult,
)
from ..services.pipeline import run_pipeline, run_pipeline_with_labels
from ..services.db_helpers import load_text_records_by_ids
from ..services.history import save_analysis_run
from ..db.session import get_db

# <--- WICHTIG: dieses 'router' importiert deine main.py
router = APIRouter(prefix="/analyze", tags=["textanalyse"])


@router.post("", response_model=TextAnalysisResult)
def analyze(req: AnalyzeRequest) -> TextAnalysisResult:
    """
    Analyze raw documents (name + content) that are sent directly from the frontend.
    This is the original workflow without database IDs.
    """

    if len(req.documents) > 200:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Zu viele Dokumente (max. 200).",
        )

    total_chars = sum(len(d.content) for d in req.documents)
    if total_chars > 2_000_000:  # ~2 MB text
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Zu viel Textinhalt (max. ca. 2 MB).",
        )

    try:
        # Pipeline bekommt explizit die Dokumente + Optionen
        return run_pipeline(req.documents, req.options)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ungültige Parameter für Analyse: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unerwarteter Fehler bei der Analyse.",
        ) from e


@router.post("/byIds", response_model=TextAnalysisResult)
def analyze_by_ids(
    req: AnalyzeByIdsRequest,
    db: Session = Depends(get_db),
) -> TextAnalysisResult:
    """
    Analyze texts by database IDs instead of raw uploaded content.
    This is used by the Textanalyse-Seite im Frontend.
    """

    # 1) Texte aus DB holen und in TextDocument-Objekte umwandeln
    text_records = load_text_records_by_ids(db, req.text_ids)
    documents = [
        TextDocument(name=text.name, content=text.content or "") for text in text_records
    ]

    # 2) Pipeline aufrufen (gleiche Funktion wie oben)
    try:
        result, labels = run_pipeline_with_labels(documents, req.options)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ungültige Parameter für Analyse: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unerwarteter Fehler bei der Analyse.",
        ) from e

    # 3) Analyseergebnis in der Historie speichern
    try:
        save_analysis_run(
            db,
            [text.id for text in text_records],
            req.options,
            labels,
            result,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fehler beim Speichern der Analyse-Historie.",
        ) from e

    return result
