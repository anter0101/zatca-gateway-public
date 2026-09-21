# Local stack (Phase 0)

```bash
cd deployment
cp .env.example .env
docker compose up --build
```

| Path | Role |
| --- | --- |
| `docker-compose.yml` | Nest, Next, Postgres, Redis, Java sidecar, nginx |
| `.env.example` | Env contract (copy to `.env`) |
| `nginx.conf` | `/` → frontend, `/api` + `/v1` → backend |

Sidecar is internal only (`http://sidecar:8090`). See [plan/phase-zero.md](../plan/phase-zero.md).

## Onboard / BullMQ

Compose sets `BULL_PREFIX=bull:docker` so Docker workers do not share queue keys with a host Nest (`pnpm start:prod` / `node dist/main`) that points at published Redis `:6379` with the default `bull` prefix. If both run, the host can steal onboard jobs and persist opaque errors like `Api Error Exception`.

When testing onboard against this stack:

1. Do **not** also run the backend on the host against the same Redis.
2. Rebuild after backend changes: `docker compose up --build -d backend`
3. Use a real OTP from the matching Fatoora portal (simulation / developer portal / production — not swagger sample `123345`).

## ZATCA environments

| Env | Base URL | API key | CSR flag |
| --- | --- | --- | --- |
| `simulation` | `.../e-invoicing/simulation` | `sk_test_` | `-sim` |
| `developer_portal` | `.../e-invoicing/developer-portal` | `sk_sandbox_` | `-nonprod` |
| `production` | `.../e-invoicing/core` | `sk_live_` | (none) |

Set `ZATCA_DEVELOPER_PORTAL_BASE_URL` in `.env` (see `.env.example`). Rebuild **backend + sidecar** after changing CSR env flags.
