from textanalyse_backend.db import models


def test_analyze_by_ids_persists_history(test_client, db_session):
    text_a = models.Text(name="a.txt", content="Alpha beta gamma delta.")
    text_b = models.Text(name="b.txt", content="Beta gamma delta epsilon.")
    db_session.add_all([text_a, text_b])
    db_session.commit()
    db_session.refresh(text_a)
    db_session.refresh(text_b)

    payload = {
        "text_ids": [text_a.id, text_b.id],
        "options": {
            "vectorizer": "tfidf",
            "maxFeatures": 100,
            "numClusters": 2,
            "useDimReduction": False,
            "numComponents": None,
            "useStopwords": False,
            "stopwordMode": "none",
        },
    }

    res = test_client.post("/analyze/byIds", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "clusters" in data
    assert len(data["clusters"]) == 2

    history_res = test_client.get("/history")
    assert history_res.status_code == 200
    history = history_res.json()
    assert history["totalRuns"] == 1
