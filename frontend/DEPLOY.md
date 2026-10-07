# Deploying the frontend

The frontend is a Next.js app built as a standalone Node server. The server does not need the source code or `node_modules`; it needs only the `deploy-package` folder and Node.js 20 or newer.

## 1. Build the package (on this machine)

From the `frontend` folder:

```powershell
.\package_for_deploy.ps1 -ApiBase https://api.example.com
```

`-ApiBase` is the backend address as the browser sees it. It is fixed into the build, so rebuild if the backend address changes. Use `-ApiBase ""` only if a reverse proxy serves `/api` and `/auth` on the same host as the site.

The result is `frontend\deploy-package`. Copy that whole folder to the server, including the hidden `.next` folder inside it.

## 2. Run it on the server

Inside the copied folder:

Linux:

```bash
PORT=3000 HOSTNAME=0.0.0.0 API_INTERNAL_BASE=http://127.0.0.1:8000 node server.js
```

Windows (PowerShell):

```powershell
$env:PORT="3000"; $env:HOSTNAME="0.0.0.0"; $env:API_INTERNAL_BASE="http://127.0.0.1:8000"; node server.js
```

`API_INTERNAL_BASE` is how the Next.js server reaches the backend when it renders pages (dashboard, companies, directors). It can be a private address. If it is not set, the server uses the `-ApiBase` value from the build.

Open `http://<server>:3000/login`.

To keep it running after logout, run `node server.js` under a process manager such as systemd or PM2, or as a Windows service or scheduled task.

## 3. Backend settings this depends on

- The backend must be reachable from browsers at the `-ApiBase` address.
- If the site and backend are on different origins, set the backend's `CORS_ALLOW_ORIGINS` to the site origin, for example `https://data.example.com`.

## Updating

Rebuild the package, replace the folder on the server, and restart `node server.js`.
