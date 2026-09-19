# ZATCA Gateway — delivery roadmap

Straight build order for the tax invoicing gateway. Detail lives in each phase file. Product overview: [sdk/ZATCA-SAAS-GATEWAY.md](../sdk/ZATCA-SAAS-GATEWAY.md). SDK reference: [sdk/ZATCA-SDK-STUDY.md](../sdk/ZATCA-SDK-STUDY.md). CSR form: [sdk/CSR-FORM.md](../sdk/CSR-FORM.md).

## Stack

- **NestJS** (`backend/`) — public SaaS API, Fatoora HTTP, workers
- **Java 11–14 sidecar** — only place `fatoora` runs (CSR, sign, hash, QR, validate, invoice-request)
- **Next.js** (`frontend/`) — platform-admin dashboard (Phase 5)
- **PostgreSQL** — system of record
- **Redis** — BullMQ jobs + rate limits

No Spring Boot. No RabbitMQ. Do **not** put SDK dummy `cert.pem` / keys on live tax payer rows.

## Who does what

| Actor | Role |
| --- | --- |
| Platform admin | Creates vendors, keys, tax payers (JWT `/api/...`) |
| Vendor ERP | Calls gateway with `sk_test_` / `sk_live_` (`/v1/...`) |
| Tax payer | No login; ERP sends Fatoora OTP for onboard |

## Phases

```mermaid
flowchart LR
  P1[1_Schema] --> P2[2_AdminAPIs]
  P2 --> P3[3_Sidecar_and_Onboard]
  P3 --> P4[4_LiveInvoices]
  P4 --> P5[5_Harden]
```

| Phase | File | Delivers |
| --- | --- | --- |
| 1 | [phase-one.md](phase-one.md) | Postgres ERD (single column source of truth) |
| 2 | [phase-two.md](phase-two.md) | Admin JWT: vendors, API keys, tax-payer identity |
| 3 | [phase-three.md](phase-three.md) | Java sidecar **with per-job sandbox** + vendor onboard (CSR → OTP → CSID → 6 samples → PCSID) |
| 4 | [phase-four.md](phase-four.md) | Live UBL generator + clearance / reporting |
| 5 | [phase-five.md](phase-five.md) | Webhooks, rate limits, audit, key rotate, admin dashboard |

Sandbox + env isolation is **Phase 3**, not after invoices — the JAR is single-folder and onboard already needs it.

## Out of v1

VAT groups, `systems` / multi-EGS, vendor team login, export / self-bill / third-party / prepayment `386`, RabbitMQ, Spring.
