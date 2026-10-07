#!/usr/bin/env python3
"""
Database Connection Verification Script
Run this script to verify connectivity to the existing business data system
"""

import os
import psycopg2
import json
from datetime import datetime
from urllib.parse import urlparse
try:
    from dotenv import load_dotenv
    # Load .env if present in the working directory (non-fatal if missing)
    load_dotenv()
except Exception:
    # dotenv is optional; ignore if not installed
    pass


def _get_connection_config():
    """Return a (dsn, info_dict) using env vars.
    Priority: DATABASE_URL > individual DB_* vars > built-in defaults.
    The info_dict is sanitized (no password).
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        parsed = urlparse(db_url)
        info = {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 5432,
            "database": (parsed.path or "").lstrip("/") or "bdata_db",
            "user": parsed.username or "bdata_user",
            "source": "DATABASE_URL",
        }
        return db_url, info

    # Fallback to individual variables with sensible defaults
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "5432"))
    name = os.getenv("DB_NAME", "bdata_db")
    user = os.getenv("DB_USER", "bdata_user")
    password = os.getenv("DB_PASSWORD", "bdata_password")

    dsn = f"postgresql://{user}:{password}@{host}:{port}/{name}"
    info = {
        "host": host,
        "port": port,
        "database": name,
        "user": user,
        "source": "DB_* env with defaults",
    }
    return dsn, info

def test_database_connection():
    """Test database connectivity and return system info"""
    try:
        # Build connection from env vars
        dsn, conn_info = _get_connection_config()
        conn = psycopg2.connect(dsn)
        
        cursor = conn.cursor()
        
        # Basic connectivity test
        cursor.execute('SELECT version()')
        db_version = cursor.fetchone()[0]
        
        # Get table information
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        # Get data counts
        cursor.execute('SELECT COUNT(*) FROM company_det')
        company_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM director_det')
        director_count = cursor.fetchone()[0]
        
        # Get sample data
        cursor.execute("""
            SELECT cin, companyname, city, state 
            FROM company_det 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        sample_companies = cursor.fetchall()
        
        cursor.execute("""
            SELECT din, director_name, designation 
            FROM director_det 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        sample_directors = cursor.fetchall()
        
        # Get geographic distribution
        cursor.execute("""
            SELECT state, COUNT(*) as count 
            FROM company_det 
            WHERE state IS NOT NULL 
            GROUP BY state 
            ORDER BY count DESC 
            LIMIT 10
        """)
        state_distribution = cursor.fetchall()
        
        # Create verification report
        verification_data = {
            "status": "SUCCESS",
            "timestamp": datetime.now().isoformat(),
            "database_info": {
                "version": db_version,
                "host": conn_info["host"],
                "port": conn_info["port"],
                "database": conn_info["database"],
                "user": conn_info["user"],
                "source": conn_info["source"],
            },
            "tables": tables,
            "data_summary": {
                "total_companies": company_count,
                "total_directors": director_count
            },
            "sample_companies": [
                {
                    "cin": row[0],
                    "name": row[1],
                    "city": row[2],
                    "state": row[3]
                } for row in sample_companies
            ],
            "sample_directors": [
                {
                    "din": row[0],
                    "name": row[1],
                    "designation": row[2]
                } for row in sample_directors
            ],
            "state_distribution": [
                {
                    "state": row[0],
                    "count": row[1]
                } for row in state_distribution
            ]
        }
        
        conn.close()
        return verification_data
        
    except Exception as e:
        return {
            "status": "ERROR",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "message": "Failed to connect to database. Please check if PostgreSQL container is running."
        }

def main():
    print("🔍 Business Data System - Connection Verification")
    print("=" * 60)
    
    result = test_database_connection()
    
    if result["status"] == "SUCCESS":
        print("✅ DATABASE CONNECTION SUCCESSFUL!")
        print(f"📊 Database Version: {result['database_info']['version'].split(',')[0]}")
        print(f"📋 Available Tables: {len(result['tables'])}")
        print(f"🏢 Total Companies: {result['data_summary']['total_companies']:,}")
        print(f"👤 Total Directors: {result['data_summary']['total_directors']:,}")
        
        print("\n🌍 Top States by Company Count:")
        for state_data in result['state_distribution'][:5]:
            print(f"  • {state_data['state']}: {state_data['count']:,} companies")
        
        print("\n🏢 Sample Companies:")
        for company in result['sample_companies']:
            print(f"  • {company['cin']}: {company['name']} ({company['city']}, {company['state']})")
        
        print("\n👤 Sample Directors:")
        for director in result['sample_directors']:
            print(f"  • {director['din']}: {director['name']} - {director['designation']}")
        
        print("\n📄 Full verification report saved to: verification_report.json")
        
        # Save detailed report
        with open('verification_report.json', 'w') as f:
            json.dump(result, f, indent=2, default=str)
            
    else:
        print("❌ DATABASE CONNECTION FAILED!")
        print(f"🔥 Error: {result['error']}")
        print(f"💡 Message: {result['message']}")
        
        print("\n🔧 Troubleshooting Steps:")
        print("1. Ensure Docker is running")
        print("2. Check if PostgreSQL container is running: docker ps")
        print("3. Verify container name: bdata-postgres-1")
        print("4. Check if port 5432 is accessible")
        
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()