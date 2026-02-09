# Frontend Deploy (Lihatin-UI)

Production Docker deployment for Next.js app.

## Prerequisites

- Docker Engine + Compose plugin installed.
- Backend API already deployed and reachable.

## 1) Configure

```bash
cd deploy/ui-prod
cp .env.example .env
nano .env
```

Set `NEXT_PUBLIC_API_URL` to your public API endpoint (include `/v1`).

## 2) Build and Run

```bash
docker compose build --no-cache
docker compose up -d
```

Check status:

```bash
docker compose ps
docker compose logs -f web
```

Smoke test:

```bash
curl -I http://127.0.0.1:3000
```

## 3) Upgrade

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

## Notes

- `NEXT_PUBLIC_API_URL` is compiled at build time. Rebuild image after changing it.
- Keep `WEB_BIND_IP=127.0.0.1` and serve via reverse proxy (Nginx/Caddy) in production.
