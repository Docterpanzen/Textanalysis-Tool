def test_create_and_list_texts(test_client):
    payload = {"name": "sample.txt", "content": "Hello world"}
    res = test_client.post("/texts", json=payload)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == "sample.txt"
    assert created["content"] == "Hello world"
    assert "id" in created

    list_res = test_client.get("/texts")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["id"] == created["id"] for item in items)


def test_get_text_not_found(test_client):
    res = test_client.get("/texts/9999")
    assert res.status_code == 404
