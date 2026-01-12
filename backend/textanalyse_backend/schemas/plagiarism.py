from typing import Literal, Optional, List
from pydantic import BaseModel, Field, ConfigDict

class PlagiarismDocument(BaseModel):
    name: str
    content: str

class CleaningOptions(BaseModel):
    enabled: bool = True
    preset: Optional[Literal["default", "strict"]] = "default"
    toLower: Optional[bool] = True
    normalizeWhitespace: Optional[bool] = True
    removeUrlsEmails: Optional[bool] = True
    stripDiacritics: Optional[bool] = False
    removePunctuation: Optional[bool] = True


class PlagiarismOptions(BaseModel):
    shingleType: Literal["char", "word"] = "char"
    shingleSize: int = Field(5, ge=1, le=20)
    numHashes: int = Field(100, ge=10, le=500)
    numBands: int = Field(25, ge=1)
    numRows: int = Field(2, ge=1)
    cleaning: Optional[CleaningOptions] = None

class PlagiarismCheckRequest(BaseModel):
    documents: List[PlagiarismDocument]  # expect exactly 2 (validated in route)
    options: PlagiarismOptions

class PlagiarismCheckResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    similarity_percent: float = Field(..., alias="similarityPercent")
    jaccard_estimate: Optional[float] = Field(None, alias="jaccardPercent")
    candidate_pairs_found: Optional[int] = Field(None, alias="candidatePairsFound")
    notes: Optional[list[str]] = None
