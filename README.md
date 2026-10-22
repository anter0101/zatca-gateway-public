# ZATCA Gateway

Tax invoicing SaaS gateway (NestJS + Next.js + Java Fatoora sidecar).

## Quick start (Docker)

```bash
cd deployment
cp .env.example .env
docker compose up --build
```

Then open http://localhost (nginx → frontend / `/api` + `/v1` → backend).

## Docs

- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Roadmap: [plan/README.md](plan/README.md)
- Phase 0 (compose): [plan/phase-zero.md](plan/phase-zero.md)
- Fatoora swagger: [sdk/fatoora-swagger/](sdk/fatoora-swagger/)
