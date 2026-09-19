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
