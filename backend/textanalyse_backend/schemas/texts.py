# textanalyse_backend/schemas/texts.py
from datetime import datetime
from pydantic import BaseModel, Field


class TextBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


class TextCreate(TextBase):
    """Payload, den das Frontend schickt, wenn ein neuer Text gespeichert wird."""
    pass


class TextRead(BaseModel):
    """Antwortmodell, das die API zurückgibt."""
    id: int
    name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True  # wichtig für SQLAlchemy -> Pydantic v2
