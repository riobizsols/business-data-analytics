from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from src.models import database

router = APIRouter(prefix="/api/views", tags=["Views"])

class SavedView(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=100)
    scope: str = Field("companies", description="e.g., companies, directors")
    filters: Dict[str, Any]

def ensure_table(db):
    db.execute(text(
        """
        CREATE TABLE IF NOT EXISTS saved_views (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            scope TEXT NOT NULL,
            filters JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """
    ))

@router.get("", response_model=List[SavedView])
def list_views(db=Depends(database.get_db), scope: Optional[str] = None):
    ensure_table(db)
    if scope:
        rows = db.execute(text("SELECT id, name, scope, filters FROM saved_views WHERE scope = :scope ORDER BY updated_at DESC"), {"scope": scope}).fetchall()
    else:
        rows = db.execute(text("SELECT id, name, scope, filters FROM saved_views ORDER BY updated_at DESC")).fetchall()
    return [{"id": r[0], "name": r[1], "scope": r[2], "filters": r[3]} for r in rows]

@router.post("", response_model=SavedView)
def create_view(payload: SavedView, db=Depends(database.get_db)):
    ensure_table(db)
    row = db.execute(
        text("INSERT INTO saved_views (name, scope, filters) VALUES (:name, :scope, :filters) RETURNING id, name, scope, filters"),
        {"name": payload.name, "scope": payload.scope, "filters": payload.filters},
    ).fetchone()
    return {"id": row[0], "name": row[1], "scope": row[2], "filters": row[3]}

@router.get("/{view_id}", response_model=SavedView)
def get_view(view_id: int, db=Depends(database.get_db)):
    ensure_table(db)
    row = db.execute(text("SELECT id, name, scope, filters FROM saved_views WHERE id = :id"), {"id": view_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"View not found: {view_id}")
    return {"id": row[0], "name": row[1], "scope": row[2], "filters": row[3]}

@router.put("/{view_id}", response_model=SavedView)
def update_view(view_id: int, payload: SavedView, db=Depends(database.get_db)):
    ensure_table(db)
    row = db.execute(
        text("UPDATE saved_views SET name = :name, scope = :scope, filters = :filters, updated_at = NOW() WHERE id = :id RETURNING id, name, scope, filters"),
        {"id": view_id, "name": payload.name, "scope": payload.scope, "filters": payload.filters},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"View not found: {view_id}")
    return {"id": row[0], "name": row[1], "scope": row[2], "filters": row[3]}

@router.delete("/{view_id}")
def delete_view(view_id: int, db=Depends(database.get_db)):
    ensure_table(db)
    result = db.execute(text("DELETE FROM saved_views WHERE id = :id"), {"id": view_id})
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail=f"View not found: {view_id}")
    return {"status": "deleted", "id": view_id}
