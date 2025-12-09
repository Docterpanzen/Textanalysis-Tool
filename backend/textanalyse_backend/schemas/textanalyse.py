from typing import List, Optional
from pydantic import BaseModel


class TextDocument(BaseModel):
    name: str
    content: str


class TextAnalysisOptions(BaseModel):
    vectorizer: str                  # "bow" | "tf" | "tfidf"
    maxFeatures: Optional[int] = None
    numClusters: int = 5
    useDimReduction: bool = True
    numComponents: Optional[int] = 100


class ClusterInfo(BaseModel):
    id: int
    documentNames: List[str]
    topTerms: List[str]


class TextAnalysisResult(BaseModel):
    clusters: List[ClusterInfo]
    vocabularySize: int


class AnalyzeRequest(BaseModel):
    documents: List[TextDocument]
    options: TextAnalysisOptions
