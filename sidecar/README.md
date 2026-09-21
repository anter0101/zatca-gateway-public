# Java Fatoora sidecar

Internal-only HTTP service. Nest calls `SIDECAR_URL` (default `http://sidecar:8090`).

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Liveness |
| `POST /internal/csr` | Generate CSR + private key (`-sim` when `environment=simulation`) |
| `POST /internal/sign` | Sign invoice XML |
| `POST /internal/validate` | Local SDK validate |
| `POST /internal/hash` | Generate invoice hash |
| `POST /internal/invoice-request` | Build Fatoora JSON `{ invoiceHash, uuid, invoice }` |

SDK tree is baked at `/opt/zatca-sdk` (`FATOORA_HOME`). Each job uses a temp sandbox + `SDK_CONFIG`, then wiped. Concurrency capped by `SIDECAR_MAX_CONCURRENT`. Do not expose this port through nginx.

See [plan/phase-three.md](../plan/phase-three.md).
