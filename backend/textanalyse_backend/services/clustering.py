from typing import List, Iterable
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix


def reduce_dimensions(
    X: csr_matrix,
    n_components: int | None,
) -> np.ndarray:
    '''
    Reduce the dimensionality of the input matrix X using Truncated SVD.
    
    :param X: Input data matrix (sparse)
    :type X: csr_matrix
    :param n_components: Number of components to reduce to
    :type n_components: int | None
    :return: Reduced data matrix
    :rtype: ndarray[_AnyShape, dtype[Any]]
    '''
    if not n_components or n_components <= 0 or n_components >= X.shape[1]:
        return X.toarray()
    svd = TruncatedSVD(n_components=n_components)
    return svd.fit_transform(X)


def kmeans_cluster(
    X: np.ndarray,
    k: int,
) -> np.ndarray:
    '''
    Cluster the input data X into k clusters using K-Means.

    :param X: Input data matrix
    :type X: np.ndarray
    :param k: Number of clusters
    :type k: int
    :return: Cluster labels for each sample
    :rtype: ndarray[_AnyShape, dtype[Any]]
    '''
    kmeans = KMeans(n_clusters=k, n_init="auto")
    return kmeans.fit_predict(X)


def top_terms_per_cluster(
    X,
    labels: Iterable[int],
    feature_names: list[str],
    k: int,
    top_n: int = 10,
) -> list[list[str]]:
    '''
    Get the top N terms for each cluster based on mean feature values.

    :param X: Input data matrix (sparse)
    :param labels: Cluster labels for each sample
    :type labels: Iterable[int]
    :param feature_names: List of feature names corresponding to columns in X
    :type feature_names: list[str]
    :param k: Number of clusters
    :type k: int
    :param top_n: Number of top terms to return per cluster
    :type top_n: int
    :return: List of top terms for each cluster
    :rtype: list[list[str]]
    '''

    # WICHTIG: Auf CSR konvertieren, damit X[idx] funktioniert
    if not isinstance(X, csr_matrix):
        X = csr_matrix(X)

    labels = np.asarray(labels)
    clusters: list[list[str]] = []

    for cluster_id in range(k):
        idx = np.where(labels == cluster_id)[0]
        if len(idx) == 0:
            clusters.append([])
            continue

        # Jetzt funktioniert das Indexing
        cluster_matrix = X[idx]

        # Mittelwert pro Feature im Cluster
        mean_vec = np.asarray(cluster_matrix.mean(axis=0)).ravel()

        # Top-N Terme
        top_idx = mean_vec.argsort()[::-1][:top_n]
        terms = [feature_names[i] for i in top_idx if mean_vec[i] > 0]

        clusters.append(terms)

    return clusters