def test_plagiarism_check_identical_docs(test_client):
    payload = {
        "documents": [
            {"name": "a.txt", "content": "Alpha beta gamma delta."},
            {"name": "b.txt", "content": "Alpha beta gamma delta."},
        ],
        "options": {
            "shingleType": "char",
            "shingleSize": 5,
            "numHashes": 100,
            "numBands": 10,
            "numRows": 10,
            "cleaning": {"enabled": True},
        },
    }

    res = test_client.post("/plagiarism/check", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["similarityPercent"] >= 99.0


def test_plagiarism_check_requires_two_documents(test_client):
    payload = {
        "documents": [{"name": "a.txt", "content": "Only one document."}],
        "options": {
            "shingleType": "char",
            "shingleSize": 5,
            "numHashes": 100,
            "numBands": 10,
            "numRows": 10,
            "cleaning": {"enabled": True},
        },
    }

    res = test_client.post("/plagiarism/check", json=payload)
    assert res.status_code == 400
