# backend/textanalyse_backend/config.py
from dataclasses import dataclass

@dataclass
class Settings:
  frontend_origin: str = "https://textanalysis-tool-1.onrender.com"
  default_num_clusters: int = 5

settings = Settings()
