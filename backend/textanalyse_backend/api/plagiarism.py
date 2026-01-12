from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
import json

from ..schemas.plagiarism import PlagiarismCheckRequest, PlagiarismCheckResponse
from ..services.plagiarism_service import check_plagiarism
from ..services.helpers import extract_text_from_bytes

router = APIRouter(prefix="/plagiarism", tags=["plagiarism"])

@router.post("/check", response_model=PlagiarismCheckResponse)
def plagiarism_check(req: PlagiarismCheckRequest):
    try:
        if len(req.documents) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exactly two documents must be provided.",
            )

        doc_a = req.documents[0].content or ""
        doc_b = req.documents[1].content or ""

        opts = req.options

        # Basic param guard (optional)
        if opts.numBands * opts.numRows != opts.numHashes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid LSH parameters: numBands * numRows must equal numHashes.",
            )

        # cleaning flag (frontend already cleans, but keep option for backend later)
        clean_enabled = bool(opts.cleaning.enabled) if opts.cleaning else False

        res = check_plagiarism(
            doc_a,
            doc_b,
            shingle_size=opts.shingleSize,
            shingle_type=opts.shingleType,
            num_hashes=opts.numHashes,
            num_bands=opts.numBands,
            num_rows=opts.numRows,
            clean=clean_enabled,
        )

        return res

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/checkFiles", response_model=PlagiarismCheckResponse)
async def plagiarism_check_files(
    fileA: UploadFile = File(...),
    fileB: UploadFile = File(...),
    options: str = Form(...),  # JSON string
):
    # 1) parse options json
    try:
        opts = json.loads(options)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid options JSON: {e}",
        )

    # 2) read bytes
    data_a = await fileA.read()
    data_b = await fileB.read()

    # 3) extract text by extension
    try:
        text_a = extract_text_from_bytes(fileA.filename or "a.txt", data_a)
        text_b = extract_text_from_bytes(fileB.filename or "b.txt", data_b)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Optional: fail early if pdf/docx produced no text
    if not text_a.strip() or not text_b.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One of the documents contains no extractable text (e.g., scanned PDF).",
        )

    # 4) call your existing logic
    try:
        return check_plagiarism(
            text_a,
            text_b,
            shingle_size=opts["shingleSize"],
            shingle_type=opts["shingleType"],
            num_hashes=opts["numHashes"],
            num_bands=opts["numBands"],
            num_rows=opts["numRows"],
            clean=opts.get("cleaning", {}).get("enabled", True),
        )
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing option field: {e}",
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))