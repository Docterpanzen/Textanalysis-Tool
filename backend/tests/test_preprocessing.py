from textanalyse_backend.services.preprocessing import clean_text

def test_clean_text_basic():
    raw = "Hallo, Welt!!!  Das  ist\t  ein  TEST..."
    cleaned = clean_text(raw)
    assert cleaned == "hallo welt das ist ein test"