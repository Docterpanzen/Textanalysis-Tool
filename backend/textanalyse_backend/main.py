# backend/textanalyse_backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.textanalyse import router as textanalyse_router
from .config import settings

app = FastAPI(title="Textanalyse Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(textanalyse_router)
