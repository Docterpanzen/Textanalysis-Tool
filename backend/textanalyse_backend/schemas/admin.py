from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class AdminLoginResponse(BaseModel):
    token: str


class AdminTextRead(BaseModel):
    id: int
    name: str
    content: str
    tags: List[str]
    created_at: datetime
    usedInHistory: bool
    historyRunIds: List[int]


class AdminUpdateTagsRequest(BaseModel):
    tags: List[str]


class AdminBulkDeleteRequest(BaseModel):
    ids: List[int]


class AdminBulkDeleteResponse(BaseModel):
    deletedIds: List[int]
    inUseIds: List[int]
    notFoundIds: List[int]


class AdminCleanupSuggestions(BaseModel):
    unusedIds: List[int]
    emptyIds: List[int]
    duplicateGroups: List[List[int]]


class AdminExportRow(BaseModel):
    id: int
    name: str
    content: str
    tags: Optional[str]
    created_at: datetime
    usedInHistory: bool


class AdminRunRead(BaseModel):
    id: int
    created_at: datetime
    vectorizer: str
    numClusters: int
    useDimReduction: bool
    numComponents: Optional[int]
    textCount: int
    clusterCount: int
    tags: List[str]


class AdminRunUpdateTagsRequest(BaseModel):
    tags: List[str]
