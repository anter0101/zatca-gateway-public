# Fatoora swagger exports

Official Integration Sandbox swagger PDFs (paths are identical under `simulation` and `core` bases). Used by Nest `ZatcaClient` contracts in [plan/phase-three.md](../../plan/phase-three.md) and [plan/phase-four.md](../../plan/phase-four.md).

| File | Endpoint |
| --- | --- |
| `compliance_csid.pdf` | `POST /compliance` |
| `compliance_invoice.pdf` | `POST /compliance/invoices` |
| `onboarding.pdf` | `POST /production/csids` |
| `renewal.pdf` | `PATCH /production/csids` |
| `clearance.pdf` | `POST /invoices/clearance/single` |
| `reporting.pdf` | `POST /invoices/reporting/single` |
