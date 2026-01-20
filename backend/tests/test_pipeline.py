from textanalyse_backend.schemas.textanalyse import TextAnalysisOptions, TextDocument
from textanalyse_backend.services.pipeline import run_pipeline, run_pipeline_with_labels


def _docs():
    return [
        TextDocument(name="doc1.txt", content="Alpha beta gamma delta."),
        TextDocument(name="doc2.txt", content="Beta gamma delta epsilon."),
    ]


def _options():
    return TextAnalysisOptions(
        vectorizer="tfidf",
        maxFeatures=100,
        numClusters=2,
        useDimReduction=False,
        numComponents=None,
        useStopwords=False,
        stopwordMode="none",
    )


def test_run_pipeline_basic():
    result = run_pipeline(_docs(), _options())
    assert result.vocabularySize > 0
    assert len(result.clusters) == 2
    assert all(len(cluster.topTerms) > 0 for cluster in result.clusters)


def test_run_pipeline_with_labels():
    result, labels = run_pipeline_with_labels(_docs(), _options())
    assert len(labels) == 2
    assert len(result.clusters) == 2
