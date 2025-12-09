# textanalyse_backend/api/textanalyse.py
from fastapi import APIRouter, HTTPException, status

from ..schemas.textanalyse import AnalyzeRequest, TextAnalysisResult
from ..services.pipeline import run_pipeline

router = APIRouter(prefix="/analyze", tags=["textanalyse"])
import logging
logger = logging.getLogger(__name__)


@router.post("", response_model=TextAnalysisResult)
def analyze(req: AnalyzeRequest) -> TextAnalysisResult:
    # ein paar einfache Sicherheitschecks
    if len(req.documents) > 200:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Zu viele Dokumente (max. 200).",
        )

    total_chars = sum(len(d.content) for d in req.documents)
    if total_chars > 2_000_000:  # 2 Mio Zeichen ~ 2 MB Text
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Zu viel Textinhalt (max. ca. 2 MB).",
        )

    try:
        return run_pipeline(req)
    except ValueError as e:
        # z.B. wenn k > Anzahl Dokumente o.Ä.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ungültige Parameter für Analyse: {e}",
        )
    except Exception as e:  # letztes Netz
        logger.exception("Fehler in /analyze: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unerwarteter Fehler bei der Analyse.",
        ) from e
