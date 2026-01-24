# textanalyse_backend/main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .api.textanalyse import router as textanalyse_router
from .api.texts import router as texts_router
from .api.plagiarism import router as plagiarism_router
from .api.history import router as history_router
from .api.dashboard import router as dashboard_router
from .api.admin import router as admin_router
from .config import settings

from .db.session import engine, ensure_sqlite_columns
from .db import models







logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# Lifespan-Handler (Startup + Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initialisiere Datenbank (SQLite)…")
    models.Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()
    logger.info("Datenbank-Tabellen sind bereit.")

    yield  # <<<<< hier läuft die App

    logger.info("Server fährt herunter…")


# Erstelle FastAPI-App mit Lifespan
app = FastAPI(title="Textanalyse Backend", lifespan=lifespan)


# CORS-Konfiguration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API-Router einbinden
app.include_router(textanalyse_router)
app.include_router(texts_router) 
app.include_router(plagiarism_router)
app.include_router(history_router)
app.include_router(admin_router)
app.include_router(dashboard_router)

logger.info("Textanalyse Backend gestartet")
