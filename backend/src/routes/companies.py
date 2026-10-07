from typing import Optional, Dict
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from src.models import database
from src.schemas.common import Page
from src.schemas.company import Company, CompanyDetail
from src.cache import ttl_cached

router = APIRouter(prefix="/api/companies", tags=["Companies"])


# --- Helpers: State normalization ---
_STATE_SYNONYMS: Dict[str, str] = {
    # legacy -> canonical
    "orissa": "odisha",
    "pondicherry": "puducherry",
}

def _normalize_state_py(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    t = s.strip().lower()
    # replace ampersand with 'and'
    t = t.replace("&", "and")
    # collapse multiple spaces
    t = " ".join(t.split())
    # synonyms
    t = _STATE_SYNONYMS.get(t, t)
    # filter out invalid pseudo states
    if t.startswith("roc ") or t in {"invalid_1"}:
        return None
    # title case for display (keep common lowercase words as-is)
    # but preserve known forms
    mapping_display = {
        "jammu and kashmir": "Jammu & Kashmir",
        "dadra and nagar haveli": "Dadra & Nagar Haveli",
    }
    disp = mapping_display.get(t, t.title())
    return disp

# SQL expression to normalize state on DB side to compare reliably
NORMALIZE_STATE_SQL = (
    "LOWER("  # final compare in lowercase
    "REGEXP_REPLACE("
    " TRIM(REPLACE("
    "  CASE"
    "   WHEN LOWER(TRIM(c.state)) IN ('orissa') THEN 'odisha'"
    "   WHEN LOWER(TRIM(c.state)) IN ('pondicherry') THEN 'puducherry'"
    "   ELSE c.state END, '&', 'and')),"
    " '\\s+', ' ', 'g'"
    ")"
    ")"
)

@router.get("", response_model=Page[Company])
def list_companies(
    db=Depends(database.get_db),
    q: Optional[str] = Query(None, description="Search by company name or CIN"),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    activity_code: Optional[str] = Query(None),
    mca_category: Optional[str] = Query(None, description="Filter by MCA category"),
    a_capital_min: Optional[float] = Query(None, ge=0),
    a_capital_max: Optional[float] = Query(None, ge=0),
    p_capital_min: Optional[float] = Query(None, ge=0),
    p_capital_max: Optional[float] = Query(None, ge=0),
    dor_from: Optional[str] = Query(None, description="Date of registration from (YYYY-MM-DD)"),
    dor_to: Optional[str] = Query(None, description="Date of registration to (YYYY-MM-DD)"),
    contacted: Optional[bool] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: Optional[str] = Query("created_at"),
    order_dir: Optional[str] = Query("desc")
):
    # Whitelist allowed order_by fields to prevent SQL injection
    allowed_sort = {
        "created_at": "created_at",
        "companyname": "companyname",
        "city": "city",
        "state": "state",
        "a_capital": "a_capital",
    }
    order_col = allowed_sort.get(order_by, "created_at")
    direction = "DESC" if (order_dir or "").lower() == "desc" else "ASC"

    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(c.companyname ILIKE :q OR c.cin ILIKE :q)")
        params["q"] = f"%{q}%"
    if state:
        # compare using normalized forms
        where_clauses.append(f"{NORMALIZE_STATE_SQL} = :norm_state")
        params["norm_state"] = (_normalize_state_py(state) or state).lower().replace("&", "and").strip()
    if city:
        where_clauses.append("c.city ILIKE :city")
        params["city"] = f"%{city.strip()}%"
    if activity_code:
        where_clauses.append("c.activity_code = :activity_code")
        params["activity_code"] = activity_code
    if mca_category:
        where_clauses.append("m.mca_category = :mca_category")
        params["mca_category"] = mca_category
    if a_capital_min is not None:
        where_clauses.append("c.a_capital >= :a_capital_min")
        params["a_capital_min"] = a_capital_min
    if a_capital_max is not None:
        where_clauses.append("c.a_capital <= :a_capital_max")
        params["a_capital_max"] = a_capital_max
    if p_capital_min is not None:
        where_clauses.append("c.p_capital >= :p_capital_min")
        params["p_capital_min"] = p_capital_min
    if p_capital_max is not None:
        where_clauses.append("c.p_capital <= :p_capital_max")
        params["p_capital_max"] = p_capital_max
    if dor_from:
        where_clauses.append("c.dor >= :dor_from")
        params["dor_from"] = dor_from
    if dor_to:
        where_clauses.append("c.dor <= :dor_to")
        params["dor_to"] = dor_to
    if contacted is not None:
        where_clauses.append("c.contacted = :contacted")
        params["contacted"] = contacted

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # Count query needs LEFT JOIN if filtering by mca_category
    count_join = "LEFT JOIN mca_codes m ON c.activity_code = m.activity_code" if mca_category else ""
    count_sql = text(f"SELECT COUNT(*) FROM company_det c {count_join} {where_sql}")
    total = db.execute(count_sql, params).scalar() or 0

    sql = text(
        f"""
        SELECT c.cin, c.companyname, c.city, c.state, c.a_capital, c.p_capital,
               (SELECT COALESCE(d.mobile_1, d.mobile_2, d.mobile_3, d.mobile_4, d.mobile_5)::text
                FROM director_det d WHERE d.cin = c.cin ORDER BY d.created_at DESC NULLS LAST LIMIT 1) AS phone,
               c.company_email, c.toc, c.created_at,
               COALESCE(m.mca_category, 'NA') as mca_category, 
               COALESCE(m.division_description, 'NA') as division_description,
               to_char(c.dor, 'YYYY-MM-DD') as dor, c.contacted
        FROM company_det c
        LEFT JOIN mca_codes m ON c.activity_code = m.activity_code
        {where_sql}
        ORDER BY c.{order_col} {direction}
        LIMIT :limit OFFSET :offset
        """
    )
    rows = db.execute(sql, {**params, "limit": limit, "offset": offset}).fetchall()

    items = [
        {
            "cin": r[0],
            "companyname": r[1],
            "city": r[2],
            "state": r[3],
            "a_capital": r[4],
            "p_capital": r[5],
            "phone": r[6],
            "company_email": r[7],
            "toc": r[8],
            "created_at": r[9],
            "mca_category": r[10],
            "division_description": r[11],
            "dor": r[12],
            "contacted": r[13],
        }
        for r in rows
    ]

    return {
        "total": int(total),
        "limit": limit,
        "offset": offset,
        "items": items,
    }


@router.get("/{cin}", response_model=dict)
def get_company_detail(cin: str, db=Depends(database.get_db)):
    try:
        # Fetch company details
        company_sql = text(
            """
            SELECT cin, companyname, to_char(dor, 'YYYY-MM-DD') as dor, 
                   pincode, city, state, country,
                   a_capital, p_capital, toc, activity_code, activity_description,
                   reg_off_addr, company_email, contacted, created_at, updated_at
            FROM company_det WHERE cin = :cin
            """
        )
        row = db.execute(company_sql, {"cin": cin}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Company not found: {cin}")

        company = {
            "cin": row[0],
            "companyname": row[1],
            "dor": row[2],
            "pincode": row[3],
            "city": row[4],
            "state": row[5],
            "country": row[6],
            "a_capital": row[7],
            "p_capital": row[8],
            "toc": row[9],
            "activity_code": row[10],
            "activity_description": row[11],
            "reg_off_addr": row[12],
            "company_email": row[13],
            "contacted": row[14],
            "created_at": row[15],
            "updated_at": row[16],
        }

        # Fetch directors (minimal stable schema subset)
        directors_sql = text(
            """
            SELECT din, director_name, to_char(date_joined, 'YYYY-MM-DD') as date_joined, 
                   designation, contacted, created_at, updated_at
            FROM director_det WHERE cin = :cin ORDER BY created_at DESC NULLS LAST
            """
        )
        drows = db.execute(directors_sql, {"cin": cin}).fetchall()
        directors = [
            {
                "din": r[0],
                "director_name": r[1],
                "date_joined": r[2],
                "designation": r[3],
                "contacted": r[4],
                "created_at": r[5],
                "updated_at": r[6],
            }
            for r in drows
        ]
        return {"company": CompanyDetail(**company), "directors": directors}
    except Exception as e:
        return {"detail": f"Failed to load company {cin}: {e}"}


@router.get("/meta/states")
@ttl_cached("meta_states")
def get_states(db=Depends(database.get_db)):
    """Get all unique states from the database"""
    rows = db.execute(
        text("SELECT DISTINCT state FROM company_det WHERE state IS NOT NULL")
    ).fetchall()
    norm = []
    seen = set()
    for (raw,) in rows:
        name = _normalize_state_py(raw)
        if not name:
            continue
        if name not in seen:
            seen.add(name)
            norm.append(name)
    norm.sort()
    return {"states": norm}


@router.get("/meta/categories")
@ttl_cached("meta_categories")
def get_mca_categories(db=Depends(database.get_db)):
    """Get all unique MCA categories from the mca_codes table"""
    rows = db.execute(
        text("SELECT DISTINCT mca_category FROM mca_codes WHERE mca_category IS NOT NULL ORDER BY mca_category")
    ).fetchall()
    return {"categories": [r[0] for r in rows]}


# --- Statistics Endpoints ---
@router.get("/stats/by-state")
@ttl_cached("stats_by_state")
def stats_by_state(db=Depends(database.get_db)):
    """Number of companies grouped by state."""
    rows = db.execute(
        text(
            """
            SELECT state, COUNT(*) AS cnt
            FROM company_det
            WHERE state IS NOT NULL
            GROUP BY state
            """
        )
    ).fetchall()
    agg: Dict[str, int] = {}
    for raw, cnt in rows:
        name = _normalize_state_py(raw)
        if not name:
            continue
        agg[name] = agg.get(name, 0) + int(cnt)
    items = sorted(
        [{"state": k, "count": v} for k, v in agg.items()],
        key=lambda x: (-x["count"], x["state"]) 
    )
    return {"items": items}


@router.get("/stats/by-category")
@ttl_cached("stats_by_category")
def stats_by_category(db=Depends(database.get_db)):
    """Number of companies grouped by MCA category (via mca_codes)."""
    rows = db.execute(
        text(
            """
            SELECT COALESCE(m.mca_category, 'NA') AS category, COUNT(*) AS cnt
            FROM company_det c
            LEFT JOIN mca_codes m ON c.activity_code = m.activity_code
            GROUP BY COALESCE(m.mca_category, 'NA')
            ORDER BY cnt DESC, category ASC
            """
        )
    ).fetchall()
    items = [
        {"mca_category": r[0], "count": int(r[1])}
        for r in rows
    ]
    return {"items": items}


@router.get("/stats/by-paid-up-capital")
@ttl_cached("stats_by_paid_up_capital")
def stats_by_paid_up_capital(db=Depends(database.get_db)):
    """Number of companies grouped into paid-up capital buckets.

    Buckets (in INR):
      - 0
      - 1 to 1 Lakh (1e5)
      - 1 Lakh to 10 Lakhs (1e6)
      - 10 Lakhs to 1 Crore (1e7)
      - 1 Crore to 10 Crores (1e8)
      - > 10 Crores
    """
    sql = text(
        """
        SELECT label, min_val, max_val, cnt FROM (
            SELECT '0' AS label, 0::bigint AS min_val, 0::bigint AS max_val,
                   COUNT(*) AS cnt
            FROM company_det WHERE COALESCE(p_capital, 0) = 0
            UNION ALL
            SELECT '1 - 1L' AS label, 1::bigint, 100000::bigint,
                   COUNT(*) AS cnt
            FROM company_det WHERE p_capital BETWEEN 1 AND 100000
            UNION ALL
            SELECT '1L - 10L' AS label, 100001::bigint, 1000000::bigint,
                   COUNT(*) AS cnt
            FROM company_det WHERE p_capital BETWEEN 100001 AND 1000000
            UNION ALL
            SELECT '10L - 1Cr' AS label, 1000001::bigint, 10000000::bigint,
                   COUNT(*) AS cnt
            FROM company_det WHERE p_capital BETWEEN 1000001 AND 10000000
            UNION ALL
            SELECT '1Cr - 10Cr' AS label, 10000001::bigint, 100000000::bigint,
                   COUNT(*) AS cnt
            FROM company_det WHERE p_capital BETWEEN 10000001 AND 100000000
            UNION ALL
            SELECT '> 10Cr' AS label, 100000001::bigint, NULL::bigint,
                   COUNT(*) AS cnt
            FROM company_det WHERE p_capital > 100000000
        ) t
        ORDER BY 
            CASE label
                WHEN '0' THEN 1
                WHEN '1 - 1L' THEN 2
                WHEN '1L - 10L' THEN 3
                WHEN '10L - 1Cr' THEN 4
                WHEN '1Cr - 10Cr' THEN 5
                ELSE 6
            END
        """
    )
    rows = db.execute(sql).fetchall()
    items = [
        {
            "label": r[0],
            "min": int(r[1]) if r[1] is not None else None,
            "max": int(r[2]) if r[2] is not None else None,
            "count": int(r[3]),
        }
        for r in rows
    ]
    return {"items": items}
