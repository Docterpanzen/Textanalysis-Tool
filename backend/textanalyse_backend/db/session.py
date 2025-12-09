# textanalyse_backend/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# SQLite-Datenbank im backend-Ordner:
# "sqlite:///./textanalyse.db" -> Datei heißt textanalyse.db im aktuellen Arbeitsverzeichnis
DATABASE_URL = "sqlite:///./textanalyse.db"

# check_same_thread=False ist für SQLite + FastAPI/Threading nötig
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Klassische SQLAlchemy-Session (synchron)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Später für FastAPI-Dependencies nutzbar:

    def endpoint(db: Session = Depends(get_db)):
        ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
