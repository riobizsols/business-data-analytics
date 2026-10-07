# Deploy to the VPS (bda.rioassetmanagement.net)

Stack: `docker-compose.vps.yml` runs the API (`backend/`), the Next.js app (`frontend/`),
and a small nginx. It uses the existing Postgres (`bdata_db` in the `alm_db` container);
it does not start a database. Only one port is published, on `172.17.0.1:8095` (the docker0
bridge, not reachable from the internet).

Ports 80/443 on this server belong to the `alm_nginx` container (config in `/root/alm-main/nginx/`).
It terminates TLS with the `*.rioassetmanagement.net` certificate and forwards `bda` to us.

```
browser -> alm_nginx :443 (TLS) -> 172.17.0.1:8095 -> bda proxy container
             /api/*, /auth/*  -> api:8000  -> Postgres 103.192.199.178:5432 (bdata_db)
             everything else  -> web:3000  (server-side pages call api:8000 directly)
```

The frontend is built with an empty `NEXT_PUBLIC_API_BASE`, so the browser calls the API on
the same domain.

## Protection for the shared server and database

- At most `API_WORKERS * (DB_POOL_SIZE + DB_MAX_OVERFLOW)` = 20 DB connections.
- Every query from this app is cancelled by Postgres after `DB_STATEMENT_TIMEOUT_MS` (60s).
- Connections show up as `application_name = bda_analytics` in `pg_stat_activity`.
- Dashboard counts and stats are cached for `STATS_CACHE_TTL_SECONDS` (600s).
- CPU and memory caps on every container, and Docker logs are rotated (3 x 10 MB).

## 1. DNS and the tenant app

`*.rioassetmanagement.net` is a wildcard record, so no DNS change is needed.
An exact `server_name bda.rioassetmanagement.net` wins over the tenant wildcard in nginx.
Add `bda` to the tenant app's reserved-subdomain list so no tenant can register it.

## 2. Code

```bash
cd ~ && git clone https://github.com/riobizsols/business-data-analytics.git bda
```

## 3. Config

```bash
cd ~/bda
cp deploy/vps.env.example deploy/vps.env
chmod 600 deploy/vps.env
nano deploy/vps.env
```

Set the real user and password in
`DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@103.192.199.178:5432/bdata_db?sslmode=disable`.
In the password, URL-encode `@` `:` `/` `#` `%` (`@` -> `%40`) and write `$` as `$$`.
Keep `BDA_BIND_IP=172.17.0.1` and `BDA_HTTP_PORT=8095`.
Set `ADMIN_PASSWORD` only if the `users` table has no `admin` user yet.

## 4. Build and start

```bash
cd ~/bda
nice -n 19 docker compose --env-file deploy/vps.env -f docker-compose.vps.yml build
docker compose --env-file deploy/vps.env -f docker-compose.vps.yml up -d
docker compose --env-file deploy/vps.env -f docker-compose.vps.yml ps
curl -s http://172.17.0.1:8095/api/health/db                                # {"db":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" http://172.17.0.1:8095/login      # 200
```

## 5. Route the domain through alm_nginx

Append the `bda` server block to the config file alm_nginx loads, test, and reload.
Reload is graceful: tenant sites keep running. `>>` appends in place, which keeps the
bind mount working (do not replace the file).

```bash
cp /root/alm-main/nginx/nginx-ssl.conf /root/alm-main/nginx/nginx-ssl.conf.bak-$(date +%F)
cat ~/bda/deploy/alm-nginx-bda.conf >> /root/alm-main/nginx/nginx-ssl.conf
docker exec alm_nginx nginx -t && docker exec alm_nginx nginx -s reload
curl -s -o /dev/null -w "%{http_code}\n" https://bda.rioassetmanagement.net/login   # 200
```

If `nginx -t` fails, restore the backup and reload:

```bash
cp /root/alm-main/nginx/nginx-ssl.conf.bak-$(date +%F) /root/alm-main/nginx/nginx-ssl.conf
docker exec alm_nginx nginx -s reload
```

## Wildcard certificate renewal

`rioassetmanagement.net-0001` (`*.rioassetmanagement.net`) uses manual DNS-01 validation,
so it does not renew automatically. Renew before it expires (it covers all tenant sites too):

```bash
certbot certonly --manual --preferred-challenges dns --cert-name rioassetmanagement.net-0001 \
  -d rioassetmanagement.net -d '*.rioassetmanagement.net'
docker restart alm_nginx
```

`alm_nginx` mounts the certificate files directly, so it needs a restart (not just a reload)
to pick up the renewed files.

## Operations

```bash
alias bda='docker compose --env-file ~/bda/deploy/vps.env -f ~/bda/docker-compose.vps.yml'
bda logs -f --tail 100 api          # or web, proxy
bda restart api
# update
cd ~/bda && git pull && nice -n 19 bda build && bda up -d
# resource usage
docker stats --no-stream bda-api-1 bda-web-1 bda-proxy-1
# DB connections used by this app
docker exec alm_db psql -U postgres -c "select state, count(*) from pg_stat_activity where application_name='bda_analytics' group by 1"
# stop everything (database untouched)
bda down
```

Optional: `deploy/recommended_indexes.sql` adds the two missing capital indexes without locking tables.
