# Deploy BDataUI on a server

The server stack is Postgres, the API, the Next.js app, and nginx. Nginx is the only published port. The browser calls `/api` and `/auth` on that same host, and nginx forwards them to the API.

Local Windows hosting is unchanged. Use `docker-compose.yml` for the existing Postgres and Redis containers, and `docker-compose.prod.yml` on the server.

## Requirements

- Docker Engine and the Docker Compose plugin
- A database dump of the business tables (`company_det`, `director_det`, `mca_codes`, and any related tables)

## First start

From the project root on the server:

```bash
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env`. Set `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, and `PUBLIC_ORIGIN` (for example `http://203.0.113.10` or `https://data.example.com`).

```bash
docker compose --env-file deploy/.env -f docker-compose.prod.yml up -d --build
```

On the first start the API creates the login tables and the admin user from `ADMIN_USERNAME` and `ADMIN_PASSWORD`. It does not reset that password on later restarts.

Open `http://<server>/login`.

Health checks:

- App: `http://<server>/`
- API: `http://<server>/api/health`
- Database: `http://<server>/api/health/db`

## Load the company data

Restore a dump into the new database. If the dump already includes the `users` table, restore it before the first API start, or the bootstrap admin will be skipped because that username already exists.

```bash
docker compose --env-file deploy/.env -f docker-compose.prod.yml up -d postgres
docker compose --env-file deploy/.env -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < bdata.sql
docker compose --env-file deploy/.env -f docker-compose.prod.yml up -d --build
```

From the machine that already has the data, a dump of the business tables looks like:

```bash
docker exec bdata-postgres-1 pg_dump -U bdata_user -d bdata_db \
  -t company_det -t director_det -t mca_codes > bdata.sql
```

Add any other business tables that dump misses. Copy `bdata.sql` to the server and restore it with the command above.

## HTTPS

Put Caddy or another TLS proxy in front of `HTTP_PORT`, or change `HTTP_PORT` to `8080` and point the proxy at it. Set `PUBLIC_ORIGIN` to the `https://` address.

## Updates

```bash
docker compose --env-file deploy/.env -f docker-compose.prod.yml up -d --build
```

Postgres data stays in the `pgdata` volume.
