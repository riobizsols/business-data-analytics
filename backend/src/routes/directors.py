from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from src.models import database
from src.schemas.common import Page
from src.schemas.director import Director, DirectorDetail

router = APIRouter(prefix="/api/directors", tags=["Directors"])

@router.get("", response_model=Page[Director])
def list_directors(
    db=Depends(database.get_db),
    q: Optional[str] = Query(None, description="Search by director name or DIN"),
    designation: Optional[str] = Query(None),
    contacted: Optional[bool] = Query(None, description="Whether the director/company has been contacted"),
    doj_from: Optional[str] = Query(None, description="Date joined from (YYYY-MM-DD)"),
    doj_to: Optional[str] = Query(None, description="Date joined to (YYYY-MM-DD)"),
    order_by: Optional[str] = Query("created_at"),
    order_dir: Optional[str] = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    allowed_sort = {
        "created_at": "created_at",
        "director_name": "director_name",
        "designation": "designation",
        "date_joined": "date_joined",
    }
    order_col = allowed_sort.get(order_by, "created_at")
    direction = "DESC" if (order_dir or "").lower() == "desc" else "ASC"

    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(d.director_name ILIKE :q OR d.din ILIKE :q OR d.cin ILIKE :q)")
        params["q"] = f"%{q}%"
    if designation:
        where_clauses.append("d.designation = :designation")
        params["designation"] = designation
    if contacted is not None:
        where_clauses.append("d.contacted = :contacted")
        params["contacted"] = contacted
    if doj_from:
        where_clauses.append("d.date_joined >= :doj_from")
        params["doj_from"] = doj_from
    if doj_to:
        where_clauses.append("d.date_joined <= :doj_to")
        params["doj_to"] = doj_to

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    total = db.execute(text(f"SELECT COUNT(*) FROM director_det d {where_sql}"), params).scalar() or 0
    rows = db.execute(
        text(
            f"""
            SELECT d.din, d.director_name, d.designation, 
                   to_char(d.date_joined, 'YYYY-MM-DD') as date_joined,
                   COALESCE(d.mobile_1, d.mobile_2, d.mobile_3, d.mobile_4, d.mobile_5)::text AS phone,
                   COALESCE(d.email_1, d.email_2, d.email_3) AS email, 
                   d.created_at,
                   c.companyname,
                   d.cin,
                   c.city
            FROM director_det d
            LEFT JOIN company_det c ON d.cin = c.cin
            {where_sql}
            ORDER BY d.{order_col} {direction} NULLS LAST
            LIMIT :limit OFFSET :offset
            """
        ),
        {**params, "limit": limit, "offset": offset},
    ).fetchall()

    items = [
        {
            "din": r[0],
            "director_name": r[1],
            "designation": r[2],
            "date_joined": r[3],
            "phone": r[4],
            "email": r[5],
            "created_at": r[6],
            "companyname": r[7],
            "cin": r[8],
            "city": r[9],
        }
        for r in rows
    ]

    return {"total": int(total), "limit": limit, "offset": offset, "items": items}


@router.get("/{din}", response_model=dict)
def get_director_detail(din: str, db=Depends(database.get_db)):
    # Director basic details with all mobile and email fields
    drow = db.execute(
        text(
            """
            SELECT din, director_name, designation, 
                   to_char(date_joined, 'YYYY-MM-DD') as date_joined, 
                   contacted, created_at, updated_at,
                   mobile_1, mobile_2, mobile_3, mobile_4, mobile_5,
                   email_1, email_2, email_3
            FROM director_det WHERE din = :din
            """
        ),
        {"din": din},
    ).fetchone()
    if not drow:
        raise HTTPException(status_code=404, detail=f"Director not found: {din}")

    # Collect all non-null mobile numbers
    mobiles = [drow[i] for i in range(7, 12) if drow[i]]
    # Collect all non-null emails
    emails = [drow[i] for i in range(12, 15) if drow[i]]

    director = {
        "din": drow[0],
        "director_name": drow[1],
        "designation": drow[2],
        "date_joined": drow[3],
        "contacted": drow[4],
        "created_at": drow[5],
        "updated_at": drow[6],
        "mobiles": mobiles,
        "emails": emails,
    }

    # Associated companies
    crows = db.execute(
        text(
            """
            SELECT c.cin, c.companyname, c.city, c.state, c.created_at
            FROM company_det c
            INNER JOIN director_det d ON c.cin = d.cin
            WHERE d.din = :din
            ORDER BY c.created_at DESC NULLS LAST
            """
        ),
        {"din": din},
    ).fetchall()
    companies = [
        {
            "cin": r[0],
            "companyname": r[1],
            "city": r[2],
            "state": r[3],
            "created_at": r[4],
        }
        for r in crows
    ]

    return {"director": director, "companies": companies}
