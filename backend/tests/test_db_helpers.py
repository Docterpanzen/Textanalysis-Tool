import pytest
from fastapi import HTTPException

from textanalyse_backend.db import models
from textanalyse_backend.services.db_helpers import load_documents_by_ids, load_text_records_by_ids


def _seed_texts(db_session):
    text_a = models.Text(name="a.txt", content="Alpha beta")
    text_b = models.Text(name="b.txt", content="Beta gamma")
    db_session.add_all([text_a, text_b])
    db_session.commit()
    db_session.refresh(text_a)
    db_session.refresh(text_b)
    return text_a, text_b


def test_load_text_records_order(db_session):
    text_a, text_b = _seed_texts(db_session)
    records = load_text_records_by_ids(db_session, [text_b.id, text_a.id])
    assert [record.id for record in records] == [text_b.id, text_a.id]


def test_load_text_records_missing(db_session):
    text_a, _ = _seed_texts(db_session)
    with pytest.raises(HTTPException) as exc:
        load_text_records_by_ids(db_session, [text_a.id, 9999])
    assert exc.value.status_code == 400


def test_load_documents_by_ids(db_session):
    text_a, text_b = _seed_texts(db_session)
    docs = load_documents_by_ids(db_session, [text_a.id, text_b.id])
    assert [doc.name for doc in docs] == [text_a.name, text_b.name]
