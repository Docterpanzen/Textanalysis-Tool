from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AnalysisRunOptions(BaseModel):
    vectorizer: str
    maxFeatures: Optional[int] = None
    numClusters: int
    useDimReduction: bool
    numComponents: Optional[int] = None
    useStopwords: Optional[bool] = None
    stopwordMode: Optional[str] = None


class AnalysisRunSummary(BaseModel):
    id: int
    created_at: datetime
    vectorizer: str
    numClusters: int
    useDimReduction: bool
    numComponents: Optional[int]
    textCount: int
    clusterCount: int


class AnalysisRunText(BaseModel):
    id: int
    name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClusterSummary(BaseModel):
    id: int
    clusterIndex: int
    topTerms: List[str]
    wordCloudPng: Optional[str] = None
    size: int
    textIds: List[int]
    textNames: List[str]


class AnalysisRunDetail(BaseModel):
    id: int
    created_at: datetime
    options: AnalysisRunOptions
    texts: List[AnalysisRunText]
    clusters: List[ClusterSummary]


class HistoryOverview(BaseModel):
    totalRuns: int
    todayRuns: int
    filteredRuns: int
    runs: List[AnalysisRunSummary]
