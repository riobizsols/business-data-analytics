from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from src.models import database
from src.auth.security import require_download_access
from pydantic import BaseModel
import io
import pandas as pd
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/batch", tags=["Batch Operations"])

class MarkContactedRequest(BaseModel):
    dins: List[str]

@router.get("/companies/selected")
def get_selected_companies(
    db=Depends(database.get_db),
    cins: str = Query(..., description="Comma-separated list of CINs"),
):
    """Get details of selected companies by their CINs"""
    cin_list = [c.strip() for c in cins.split(",") if c.strip()]
    if not cin_list:
        raise HTTPException(status_code=400, detail="No CINs provided")
    
    placeholders = ", ".join([f":cin{i}" for i in range(len(cin_list))])
    params = {f"cin{i}": cin for i, cin in enumerate(cin_list)}
    
    rows = db.execute(
        text(
            f"""
            SELECT cin, companyname, city, state, a_capital, p_capital,
                   company_email, toc, created_at
            FROM company_det
            WHERE cin IN ({placeholders})
            ORDER BY companyname
            """
        ),
        params
    ).fetchall()
    
    items = [
        {
            "cin": r[0],
            "companyname": r[1],
            "city": r[2],
            "state": r[3],
            "a_capital": r[4],
            "p_capital": r[5],
            "company_email": r[6],
            "toc": r[7],
            "created_at": r[8],
        }
        for r in rows
    ]
    
    return {"total": len(items), "items": items}


@router.get("/directors/by-companies")
def get_directors_by_companies(
    db=Depends(database.get_db),
    cins: str = Query(..., description="Comma-separated list of CINs"),
):
    """Get all directors for selected companies"""
    cin_list = [c.strip() for c in cins.split(",") if c.strip()]
    if not cin_list:
        raise HTTPException(status_code=400, detail="No CINs provided")
    
    placeholders = ", ".join([f":cin{i}" for i in range(len(cin_list))])
    params = {f"cin{i}": cin for i, cin in enumerate(cin_list)}
    
    rows = db.execute(
        text(
            f"""
            SELECT d.din, d.director_name, d.designation,
                   to_char(d.date_joined, 'YYYY-MM-DD') as date_joined,
                   COALESCE(d.mobile_1, d.mobile_2, d.mobile_3, d.mobile_4, d.mobile_5)::text AS phone,
                   COALESCE(d.email_1, d.email_2, d.email_3) AS email,
                   d.contacted,
                   c.companyname,
                   d.cin,
                   c.city,
                   c.state
            FROM director_det d
            LEFT JOIN company_det c ON d.cin = c.cin
            WHERE d.cin IN ({placeholders})
            ORDER BY d.director_name
            """
        ),
        params
    ).fetchall()
    
    items = [
        {
            "din": r[0],
            "director_name": r[1],
            "designation": r[2],
            "date_joined": r[3],
            "phone": r[4],
            "email": r[5],
            "contacted": r[6],
            "companyname": r[7],
            "cin": r[8],
            "city": r[9],
            "state": r[10],
        }
        for r in rows
    ]
    
    return {"total": len(items), "items": items}


@router.get("/directors/selected")
def get_selected_directors(
    db=Depends(database.get_db),
    dins: str = Query(..., description="Comma-separated list of DINs"),
):
    """Get details of selected directors by their DINs"""
    din_list = [d.strip() for d in dins.split(",") if d.strip()]
    if not din_list:
        raise HTTPException(status_code=400, detail="No DINs provided")
    
    placeholders = ", ".join([f":din{i}" for i in range(len(din_list))])
    params = {f"din{i}": din for i, din in enumerate(din_list)}
    
    rows = db.execute(
        text(
            f"""
            SELECT d.din, d.director_name, d.designation,
                   to_char(d.date_joined, 'YYYY-MM-DD') as date_joined,
                   d.mobile_1::text, d.mobile_2::text, d.mobile_3::text, 
                   d.mobile_4::text, d.mobile_5::text,
                   d.email_1, d.email_2, d.email_3,
                   d.contacted,
                   c.companyname,
                   d.cin,
                   c.city,
                   c.state,
                   c.company_email
            FROM director_det d
            LEFT JOIN company_det c ON d.cin = c.cin
            WHERE d.din IN ({placeholders})
            ORDER BY d.director_name
            """
        ),
        params
    ).fetchall()
    
    items = [
        {
            "din": r[0],
            "director_name": r[1],
            "designation": r[2],
            "date_joined": r[3],
            "mobile_1": r[4],
            "mobile_2": r[5],
            "mobile_3": r[6],
            "mobile_4": r[7],
            "mobile_5": r[8],
            "email_1": r[9],
            "email_2": r[10],
            "email_3": r[11],
            "contacted": r[12],
            "companyname": r[13],
            "cin": r[14],
            "city": r[15],
            "state": r[16],
            "company_email": r[17],
        }
        for r in rows
    ]
    
    return {"total": len(items), "items": items}


@router.post("/directors/mark-contacted")
def mark_directors_contacted(
    request: MarkContactedRequest,
    db=Depends(database.get_db),
):
    """Mark selected directors as contacted and also mark their companies as contacted"""
    if not request.dins:
        raise HTTPException(status_code=400, detail="No DINs provided")
    
    placeholders = ", ".join([f":din{i}" for i in range(len(request.dins))])
    params = {f"din{i}": din for i, din in enumerate(request.dins)}
    
    # Update directors
    director_result = db.execute(
        text(
            f"""
            UPDATE director_det
            SET contacted = true
            WHERE din IN ({placeholders})
            """
        ),
        params
    )
    
    # Update corresponding companies
    company_result = db.execute(
        text(
            f"""
            UPDATE company_det
            SET contacted = true
            WHERE cin IN (
                SELECT DISTINCT cin 
                FROM director_det 
                WHERE din IN ({placeholders})
            )
            """
        ),
        params
    )
    
    db.commit()
    
    return {
        "success": True, 
        "directors_updated": director_result.rowcount,
        "companies_updated": company_result.rowcount
    }


@router.get("/directors/export-selected")
def export_selected_directors(
    db=Depends(database.get_db),
    _user=Depends(require_download_access),
    dins: str = Query(..., description="Comma-separated list of DINs"),
):
    """Export selected directors to Excel"""
    din_list = [d.strip() for d in dins.split(",") if d.strip()]
    if not din_list:
        raise HTTPException(status_code=400, detail="No DINs provided")
    
    placeholders = ", ".join([f":din{i}" for i in range(len(din_list))])
    params = {f"din{i}": din for i, din in enumerate(din_list)}
    
    rows = db.execute(
        text(
            f"""
            SELECT d.din, d.director_name, d.designation,
                   to_char(d.date_joined, 'YYYY-MM-DD') as date_joined,
                   d.mobile_1::text, d.mobile_2::text, d.mobile_3::text, 
                   d.mobile_4::text, d.mobile_5::text,
                   d.email_1, d.email_2, d.email_3,
                   d.contacted,
                   c.companyname,
                   d.cin,
                   c.city,
                   c.state,
                   c.company_email,
                   c.a_capital,
                   c.p_capital
            FROM director_det d
            LEFT JOIN company_det c ON d.cin = c.cin
            WHERE d.din IN ({placeholders})
            ORDER BY d.director_name
            """
        ),
        params
    ).fetchall()
    
    # Create DataFrame
    df = pd.DataFrame(rows, columns=[
        "DIN", "Director Name", "Designation", "Date Joined",
        "Mobile 1", "Mobile 2", "Mobile 3", "Mobile 4", "Mobile 5",
        "Email 1", "Email 2", "Email 3",
        "Contacted", "Company Name", "CIN", "City", "State", 
        "Company Email", "Authorized Capital", "Paid-up Capital"
    ])
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Directors')
        
        # Get the xlsxwriter workbook and worksheet objects
        workbook = writer.book
        worksheet = writer.sheets['Directors']
        
        # Add some formatting
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4F46E5',
            'font_color': 'white',
            'border': 1
        })
        
        # Write headers with formatting
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
            
        # Auto-adjust column widths
        for i, col in enumerate(df.columns):
            max_len = max(df[col].astype(str).apply(len).max(), len(col)) + 2
            worksheet.set_column(i, i, min(max_len, 50))
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=selected_directors.xlsx"}
    )
