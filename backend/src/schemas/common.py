from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class PageMeta(BaseModel):
    total: int
    limit: int = Field(ge=1, le=100, default=20)
    offset: int = Field(ge=0, default=0)

class Page(BaseModel, Generic[T]):
    total: int
    limit: int
    offset: int
    items: List[T]
