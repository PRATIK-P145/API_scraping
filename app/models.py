from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ArticleCreate(BaseModel):
    title: str
    url: str
    content: str
    published_date: Optional[datetime] = None
    source: str = "beyondchats"
    status: str = "Extracted"
    references: List[str] = []

