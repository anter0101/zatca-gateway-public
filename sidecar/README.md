# Java Fatoora sidecar

Internal-only HTTP service. Nest calls `SIDECAR_URL` (default `http://sidecar:8090`).

| Endpoint | Phase 0 | Phase 3+ |
| --- | --- | --- |
| `GET /health` | `200` | same |
| `POST /internal/csr` | `501` | CSR via `fatoora` in per-job sandbox |
| `POST /internal/sign` | `501` | sign |
| `POST /internal/validate` | `501` | validate |
| `POST /internal/hash` | `501` | hash |
| `POST /internal/invoice-request` | `501` | invoice-request JSON |

SDK tree is baked at `/opt/zatca-sdk` (`FATOORA_HOME`). Do not expose this port through nginx.

See [plan/phase-three.md](../plan/phase-three.md).
