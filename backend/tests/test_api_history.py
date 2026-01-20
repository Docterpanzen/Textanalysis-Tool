from datetime import datetime, timedelta

from textanalyse_backend.db import models
from textanalyse_backend.schemas.textanalyse import TextAnalysisOptions, TextDocument
from textanalyse_backend.services.history import save_analysis_run
from textanalyse_backend.services.pipeline import run_pipeline_with_labels


def _seed_history(db_session):
    text_a = models.Text(name="a.txt", content="Alpha beta gamma delta.")
    text_b = models.Text(name="b.txt", content="Beta gamma delta epsilon.")
    db_session.add_all([text_a, text_b])
    db_session.commit()
    db_session.refresh(text_a)
    db_session.refresh(text_b)

    docs = [
        TextDocument(name=text_a.name, content=text_a.content),
        TextDocument(name=text_b.name, content=text_b.content),
    ]
    opts = TextAnalysisOptions(
        vectorizer="tfidf",
        maxFeatures=100,
        numClusters=2,
        useDimReduction=False,
        numComponents=None,
        useStopwords=False,
        stopwordMode="none",
    )
    result, labels = run_pipeline_with_labels(docs, opts)
    run1 = save_analysis_run(db_session, [text_a.id, text_b.id], opts, labels, result)
    run2 = save_analysis_run(db_session, [text_a.id, text_b.id], opts, labels, result)

    now = datetime.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    run1.created_at = start_of_day - timedelta(days=1) + timedelta(hours=1)
    run2.created_at = start_of_day + timedelta(hours=1)
    db_session.commit()

    return run1, run2, text_a, text_b


def test_history_list_sort_and_filter(test_client, db_session):
    run1, run2, text_a, _ = _seed_history(db_session)

    res = test_client.get("/history?sort=desc")
    assert res.status_code == 200
    data = res.json()
    assert data["totalRuns"] == 2
    assert data["filteredRuns"] == 2
    assert data["todayRuns"] == 1
    assert data["runs"][0]["id"] == run2.id

    res = test_client.get("/history?sort=asc")
    assert res.status_code == 200
    data = res.json()
    assert data["runs"][0]["id"] == run1.id

    res = test_client.get(f"/history?text_ids={text_a.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["filteredRuns"] == 2

    res = test_client.get("/history?text_ids=9999")
    assert res.status_code == 200
    data = res.json()
    assert data["filteredRuns"] == 0
    assert data["runs"] == []


def test_history_detail(test_client, db_session):
    _, run2, _, _ = _seed_history(db_session)

    res = test_client.get(f"/history/{run2.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == run2.id
    assert len(data["texts"]) == 2
    assert len(data["clusters"]) == 2
    assert "options" in data
    assert "wordCloudPng" in data["clusters"][0]
