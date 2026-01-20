from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from textanalyse_backend.db import models
from textanalyse_backend.db.session import get_db
from textanalyse_backend.main import app


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    models.Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture()
def db_session(db_engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def test_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    @asynccontextmanager
    async def no_lifespan(_: object):
        yield

    original_lifespan = app.router.lifespan_context
    app.router.lifespan_context = no_lifespan
    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.router.lifespan_context = original_lifespan
        app.dependency_overrides.clear()
