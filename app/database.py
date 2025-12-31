from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ArticleCreate(BaseModel):
    title: str
    url: str
    content: str
    published_date: Optional[datetime] = None
    source: str = "beyondchats"
    status: str = "original"
    references: List[str] = Field(default_factory=list)
