from typing import Any
from pydantic import BaseModel


class SearchResult(BaseModel):
    data: list[dict[str, Any]]
    total: int
    query: str


class PaginatedResponse(BaseModel):
    data: list[dict[str, Any]]
    total: int
    limit: int
    offset: int


class GraphResponse(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
