# textanalyse_backend/db/models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text as SAText,
    DateTime,
    Boolean,
    ForeignKey,
    func,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Text(Base):
    __tablename__ = "texts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    content = Column(SAText, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Beziehungen
    analysis_runs = relationship(
        "AnalysisRunText", back_populates="text", cascade="all, delete-orphan"
    )
    cluster_assignments = relationship(
        "ClusterAssignment", back_populates="text", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Text id={self.id} name={self.name!r}>"


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vectorizer = Column(String(20), nullable=False)          # "bow" | "tf" | "tfidf"
    num_clusters = Column(Integer, nullable=False)
    use_dim_reduction = Column(Boolean, nullable=False, default=True)
    num_components = Column(Integer, nullable=True)
    language = Column(String(5), nullable=True)              # z.B. "de", "en"
    description = Column(SAText, nullable=True)

    # Beziehungen
    texts = relationship(
        "AnalysisRunText", back_populates="analysis_run", cascade="all, delete-orphan"
    )
    clusters = relationship(
        "Cluster", back_populates="analysis_run", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AnalysisRun id={self.id} vectorizer={self.vectorizer} k={self.num_clusters}>"


class AnalysisRunText(Base):
    """
    Verknüpfungstabelle: welche Texte wurden in welchem Run verwendet?
    """
    __tablename__ = "analysis_run_texts"

    id = Column(Integer, primary_key=True, index=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id"), nullable=False)
    text_id = Column(Integer, ForeignKey("texts.id"), nullable=False)

    analysis_run = relationship("AnalysisRun", back_populates="texts")
    text = relationship("Text", back_populates="analysis_runs")

    def __repr__(self) -> str:
        return f"<AnalysisRunText run_id={self.analysis_run_id} text_id={self.text_id}>"


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id"), nullable=False)
    cluster_index = Column(Integer, nullable=False)  # 0,1,2,...
    top_terms = Column(SAText, nullable=True)          # z.B. JSON oder kommagetrennt
    wordcloud_png = Column(SAText, nullable=True)      # base64 PNG
    size = Column(Integer, nullable=False, default=0)

    analysis_run = relationship("AnalysisRun", back_populates="clusters")
    assignments = relationship(
        "ClusterAssignment", back_populates="cluster", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Cluster id={self.id} run_id={self.analysis_run_id} idx={self.cluster_index} size={self.size}>"


class ClusterAssignment(Base):
    """
    Verknüpft Texte mit Clustern eines Runs.
    """
    __tablename__ = "cluster_assignments"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)
    text_id = Column(Integer, ForeignKey("texts.id"), nullable=False)

    cluster = relationship("Cluster", back_populates="assignments")
    text = relationship("Text", back_populates="cluster_assignments")

    def __repr__(self) -> str:
        return f"<ClusterAssignment cluster_id={self.cluster_id} text_id={self.text_id}>"
