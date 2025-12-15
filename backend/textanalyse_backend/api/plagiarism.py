from fastapi import APIRouter, HTTPException, status
from ..schemas.plagiarism import PlagiarismCheckRequest, PlagiarismCheckResponse
from ..services.plagiarism_service import check_plagiarism

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
