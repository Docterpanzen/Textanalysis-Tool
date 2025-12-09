from typing import List, Optional
from pydantic import BaseModel


class TextDocument(BaseModel):
    name: str
    content: str


class ClusterInfo(BaseModel):
    id: int
    documentNames: List[str]
    topTerms: List[str]
    wordCloudPng: Optional[str] = None


class TextAnalysisOptions(BaseModel):
    vectorizer: str                  # "bow" | "tf" | "tfidf"
    maxFeatures: Optional[int] = None
    numClusters: int = 5
    useDimReduction: bool = True
    numComponents: Optional[int] = 100
    useStopwords: bool = True
    stopwordMode: Optional[str] = "de_en"


class TextAnalysisResult(BaseModel):
    clusters: List[ClusterInfo]
    vocabularySize: int


class AnalyzeRequest(BaseModel):
    documents: List[TextDocument]
    options: TextAnalysisOptions


class AnalyzeByIdsRequest(BaseModel):
    text_ids: List[int]
    options: TextAnalysisOptions