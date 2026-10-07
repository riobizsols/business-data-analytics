-- Optional indexes missing from bdata_db (most filter/sort indexes already exist).
-- CONCURRENTLY builds without locking writes, so other apps keep running.
-- Run off-peak with plain psql (NOT inside a transaction, no -1 flag):
--   psql "postgresql://postgres:...@HOST:5432/bdata_db" -f deploy/recommended_indexes.sql
-- If a CONCURRENTLY build fails it leaves an INVALID index; drop it and retry.

SET maintenance_work_mem = '256MB';
SET statement_timeout = 0;

-- Paid-up capital filters and the capital-bucket dashboard chart.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_det_p_capital
    ON company_det (p_capital);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_det_a_capital
    ON company_det (a_capital);

-- Substring search (ILIKE '%term%') on names. Needs pg_trgm; these are the largest indexes.
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_det_name_trgm
--     ON company_det USING gin (companyname gin_trgm_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_director_det_name_trgm
--     ON director_det USING gin (director_name gin_trgm_ops);

ANALYZE company_det;
