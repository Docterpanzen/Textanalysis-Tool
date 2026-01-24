from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class RunSeriesPoint(BaseModel):
    date: str
    count: int


class DashboardInsights(BaseModel):
    topTerms: List[str]
    mostCommonVectorizer: Optional[str] = None
    mostCommonClusterCount: Optional[int] = None


class DashboardQuality(BaseModel):
    emptyTextCount: int
    avgTextLength: float
    singletonClusterRate: float


class DashboardMetrics(BaseModel):
    totalRuns: int
    totalTexts: int
    avgTextsPerRun: float
    avgClustersPerRun: float
    latestRunAt: Optional[datetime] = None
    runSeries: List[RunSeriesPoint]
    insights: DashboardInsights
    quality: DashboardQuality
