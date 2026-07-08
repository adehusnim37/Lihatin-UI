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
Also set other build-time public vars if used in your environment:

- `NEXT_PUBLIC_FRONTEND_URL`
- `NEXT_PUBLIC_BRAND_URL`
- `NEXT_PUBLIC_API_DOCS_URL`
- `NEXT_PUBLIC_POSTMAN_COLLECTION_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (if support captcha enabled)

Set `JWT_SECRET` if you want SSR auth guard to verify local token signature before backend fallback.

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
curl -fsS http://127.0.0.1:3000/api/health
```

## 3) Upgrade

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

## Notes

- All `NEXT_PUBLIC_*` vars are compiled at build time. Rebuild image after changing them.
- Keep `WEB_BIND_IP=127.0.0.1` and serve via reverse proxy (Nginx/Caddy) in production.
