from fastapi.testclient import TestClient
from textanalyse_backend.main import app

client = TestClient(app)

def test_analyze_minimal_request():
    payload = {
        "documents": [
            {"name": "doc1.txt", "content": "Das ist ein Testtext."},
            {"name": "doc2.txt", "content": "Noch ein Beispieltext."},
        ],
        "options": {
            "vectorizer": "tfidf",
            "maxFeatures": 1000,
            "numClusters": 2,
            "useDimReduction": False,
            "numComponents": None,
        },
    }

    response = client.post("/analyze", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "clusters" in data
    assert "vocabularySize" in data
    assert len(data["clusters"]) == 2