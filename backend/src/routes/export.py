import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from src.models import database
from src.auth.security import require_download_access

try:
    import pandas as pd  # optional for Excel export
except Exception:
    pd = None

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/companies.csv")
def export_companies_csv(
    db=Depends(database.get_db),
    _user=Depends(require_download_access),
    q: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=100000),
    offset: int = Query(0, ge=0),
):
    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(companyname ILIKE :q OR cin ILIKE :q)")
        params["q"] = f"%{q}%"
    if state:
        where_clauses.append("state = :state")
        params["state"] = state
    if city:
        where_clauses.append("city ILIKE :city")
        params["city"] = f"%{city.strip()}%"
    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    sql = text(
        f"""
        SELECT cin, companyname, city, state, a_capital, p_capital, company_email, created_at
        FROM company_det
        {where_sql}
        ORDER BY created_at DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """
    )
    rows = db.execute(sql, {**params, "limit": limit, "offset": offset}).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["cin", "companyname", "city", "state", "a_capital", "p_capital", "company_email", "created_at"])
    for r in rows:
        writer.writerow(r)
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=companies.csv"})


@router.get("/companies.xlsx")
def export_companies_xlsx(
    db=Depends(database.get_db),
    _user=Depends(require_download_access),
    q: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    limit: int = Query(10000, ge=1, le=100000),
    offset: int = Query(0, ge=0),
):
    if pd is None:
        # Fallback to CSV if pandas not installed
        return export_companies_csv(db, None, q, state, city, limit, offset)

    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(companyname ILIKE :q OR cin ILIKE :q)")
        params["q"] = f"%{q}%"
    if state:
        where_clauses.append("state = :state")
        params["state"] = state
    if city:
        where_clauses.append("city ILIKE :city")
        params["city"] = f"%{city.strip()}%"
    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    sql = text(
        f"""
        SELECT cin, companyname, city, state, a_capital, p_capital, company_email, created_at
        FROM company_det
        {where_sql}
        ORDER BY created_at DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """
    )
    rows = db.execute(sql, {**params, "limit": limit, "offset": offset}).fetchall()
    df = pd.DataFrame(rows, columns=["cin", "companyname", "city", "state", "a_capital", "p_capital", "company_email", "created_at"])  # type: ignore
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:  # type: ignore
        df.to_excel(writer, index=False, sheet_name="companies")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=companies.xlsx"})

@router.get("/directors.csv")
def export_directors_csv(
    db=Depends(database.get_db),
    _user=Depends(require_download_access),
    q: Optional[str] = Query(None),
    cin: Optional[str] = Query(None),
    designation: Optional[str] = Query(None),
    contacted: Optional[bool] = Query(None),
    doj_from: Optional[str] = Query(None),
    doj_to: Optional[str] = Query(None),
    limit: int = Query(10000, ge=1, le=100000),
    offset: int = Query(0, ge=0),
):
    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(director_name ILIKE :q OR din ILIKE :q)")
        params["q"] = f"%{q}%"
    if cin:
        where_clauses.append("cin = :cin")
        params["cin"] = cin
    if designation:
        where_clauses.append("designation = :designation")
        params["designation"] = designation
    if contacted is not None:
        where_clauses.append("contacted = :contacted")
        params["contacted"] = contacted
    if doj_from:
        where_clauses.append("date_joined >= :doj_from")
        params["doj_from"] = doj_from
    if doj_to:
        where_clauses.append("date_joined <= :doj_to")
        params["doj_to"] = doj_to
    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    sql = text(
        f"""
        SELECT din, director_name, designation, 
               to_char(date_joined, 'YYYY-MM-DD') as date_joined,
               COALESCE(mobile_1, mobile_2, mobile_3, mobile_4, mobile_5)::text AS phone,
               COALESCE(email_1, email_2, email_3) AS email,
               created_at
        FROM director_det
        {where_sql}
        ORDER BY created_at DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """
    )
    rows = db.execute(sql, {**params, "limit": limit, "offset": offset}).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["din", "director_name", "designation", "date_joined", "phone", "email", "created_at"])
    for r in rows:
        writer.writerow(r)
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=directors.csv"})
