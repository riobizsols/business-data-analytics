# Deploy to the VPS (bda.rioassetmanagement.net)

Stack: `docker-compose.vps.yml` runs the API, the Next.js app, and a small nginx.
It uses the existing Postgres (`bdata_db`); it does not start a database.
Only one port is published, on `127.0.0.1:${BDA_HTTP_PORT}`. The host nginx serves
`bda.rioassetmanagement.net` with TLS and forwards to that port.

## Protection for the shared server and database

- At most `API_WORKERS * (DB_POOL_SIZE + DB_MAX_OVERFLOW)` = 20 DB connections.
- Every query from this app is cancelled by Postgres after `DB_STATEMENT_TIMEOUT_MS` (60s).
- Connections show up as `application_name = bda_analytics` in `pg_stat_activity`.
- Dashboard counts and stats are cached for `STATS_CACHE_TTL_SECONDS` (600s).
- CPU and memory caps on every container, and Docker logs are rotated (3 x 10 MB).

## 1. DNS

Add an `A` record: `bda` -> the VPS public IP.

## 2. Code

```bash
sudo mkdir -p /opt/bda && sudo chown $USER /opt/bda
git clone https://github.com/riobizsols/business-data-analytics.git /opt/bda
cd /opt/bda
```

The `frontend/` folder is a gitlink with no `.gitmodules`, so clone leaves it empty.
Copy the Next.js source (`@bdata/ui`, with `package.json`) into `/opt/bda/frontend/`.
If it ships its own `Dockerfile`, set `FRONTEND_DOCKERFILE=Dockerfile` in `deploy/vps.env`.

## 3. Config

Copy `deploy/vps.env` from your machine (it is git-ignored):

```bash
scp deploy/vps.env USER@VPS:/opt/bda/deploy/vps.env
```

Set `ADMIN_PASSWORD` only if the `users` table has no `admin` user yet, and set
`BDA_HTTP_PORT` to a free port. Keep `deploy/host-nginx-bda.conf` on the same port.

## 4. Build and start

Build at low CPU priority so running services are not slowed down:

```bash
cd /opt/bda
nice -n 19 docker compose --env-file deploy/vps.env -f docker-compose.vps.yml build
docker compose --env-file deploy/vps.env -f docker-compose.vps.yml up -d
docker compose --env-file deploy/vps.env -f docker-compose.vps.yml ps
curl -s http://127.0.0.1:8095/api/health/db
```

## 5. Domain and TLS (host nginx)

```bash
sudo cp deploy/host-nginx-bda.conf /etc/nginx/sites-available/bda.rioassetmanagement.net
sudo ln -s /etc/nginx/sites-available/bda.rioassetmanagement.net /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bda.rioassetmanagement.net
```

Open `https://bda.rioassetmanagement.net/login`.

## Operations

```bash
# logs
docker compose --env-file deploy/vps.env -f docker-compose.vps.yml logs -f --tail 100 api
# update
git pull && nice -n 19 docker compose --env-file deploy/vps.env -f docker-compose.vps.yml build \
  && docker compose --env-file deploy/vps.env -f docker-compose.vps.yml up -d
# resource usage
docker stats --no-stream bda-api-1 bda-web-1 bda-proxy-1
# DB connections used by this app
psql "$PG" -c "select state, count(*) from pg_stat_activity where application_name='bda_analytics' group by 1"
```

Optional: `deploy/recommended_indexes.sql` adds the two missing capital indexes without locking tables.
