# backend/textanalyse_backend/config.py
from dataclasses import dataclass

@dataclass
class Settings:
  frontend_origin: str = "http://localhost:4200"
  default_num_clusters: int = 5

settings = Settings()
