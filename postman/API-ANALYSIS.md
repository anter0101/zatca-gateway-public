# ZATCA Gateway — Postman API analysis

Complete reference for the importable collection
[`ZATCA-Gateway.postman_collection.json`](ZATCA-Gateway.postman_collection.json)
and environment
[`ZATCA-Gateway.local.postman_environment.json`](ZATCA-Gateway.local.postman_environment.json).

This document matches the collection **and** the Nest backend (`backend/src`).
Values in requests are **exact API strings** (lowercase enums unless noted).

---

## 1. What the collection covers

| Layer | Prefix | Auth | Purpose |
| --- | --- | --- | --- |
| Admin (Phase 2) | `/api/*` | JWT `Bearer {{admin_token}}` | Login, vendors, API keys, tax payers, users |
| Vendor onboard (Phase 3) | `/v1/taxpayers/*` | `Bearer {{api_key}}` **or** admin JWT | CSR, onboard job, poll, renew PCSID |

Invoice **clearance / reporting** endpoints are **not** in this collection yet.
Backend enums `InvoiceStatus`, `InvoiceTypeCode`, and `InvoiceSubtype` are documented in §4 for later phases.

**Error envelope** (all failed JSON APIs):

```json
{
  "error": {
    "type": "invalid_request",
    "code": "validation_error",
    "message": "…",
    "zatca_code": null
  }
}
```

Optional field `error.details` may appear. `zatca_code` is set when Fatoora/ZATCA returns a code (onboard worker).

---

## 2. Import and environment

1. Postman → **Import** both JSON files.
2. Activate **ZATCA Gateway — Local**.

Collection variable: `base_url` default `http://localhost:8080` (overridden by the environment).

### 2.1 Environment variables

| Key | Type | Default (local) | Set by | Used by |
| --- | --- | --- | --- | --- |
| `base_url` | default | `http://localhost:8080` | you | every request |
| `admin_email` | default | `admin@admin.com` | you / seeder | Login |
| `admin_password` | secret | `12345` | you / seeder | Login |
| `admin_token` | secret | empty | Login test script | folders 2–4, 6 |
| `vendor_id` | default | `1` | Create vendor (`201`) | vendors, keys, tax payers |
| `api_key_id` | default | `1` | Generate API key (`201`) | Revoke |
| `api_key` | secret | empty | Generate API key (`201`) — **once** | folder 5 |
| `tax_payer_id` | default | `1` | Create tax payer (`201`) | tax payers + onboard |
| `user_id` | default | `1` | Create user | Update / Delete user |
| `otp` | secret | `123456` | **you** (Fatoora portal) | Start onboard, Renew |
| `csr_common_name` | default | `TST-886431145-399999999900003` | ZATCA sample | reference only |
| `csr_serial_number` | default | `1-TST\|2-TST\|3-ed22f1d8-…` | ZATCA sample | reference only |
| `csr_organization_identifier` | default | `399999999900003` | ZATCA sample | Create tax payer `vatNumber` |
| `csr_organization_unit_name` | default | `Riyadh Branch` | ZATCA sample | Create tax payer |
| `csr_organization_name` | default | `Maximum Speed Tech Supply LTD` | ZATCA sample | Create tax payer |
| `csr_country_name` | default | `SA` | ZATCA sample | server hard-codes `SA` |
| `csr_invoice_type` | default | `1100` | ZATCA bitmap | derived from `invoice_type` |
| `csr_location_address` | default | `RRRD2929` | Wasel | Create tax payer |
| `csr_industry_business_category` | default | `Supply activities` | ZATCA sample | Create tax payer |
| `invoice_type` | default | `both` | you | Create tax payer API field |

Test scripts persist IDs into the **environment**, not the collection.

### 2.2 Suggested run order

| # | Folder | Request | Side effect |
| --- | --- | --- | --- |
| 1 | Auth | Login (admin) | `admin_token` |
| 2 | Vendors | Create vendor | `vendor_id` |
| 3 | API Keys | Generate API key | `api_key` + `api_key_id` |
| 4 | Tax Payers | Create tax payer | `tax_payer_id` |
| 5 | Onboard | Create CSR | CSR PEM in body |
| — | Fatoora | Register CSR, copy OTP | set `otp` |
| 6 | Onboard | Start onboard | `202` queued |
| 7 | Onboard | Poll onboard progress | until `onboarded` / `failed` |

---

## 3. Authentication

### 3.1 Admin JWT (`AuthGuard` + `RolesGuard`)

Header:

```http
Authorization: Bearer {{admin_token}}
```

- Login is **public**.
- Folders **2 Vendors, 3 API Keys, 4 Tax Payers, 6 Users**: JWT required, role **`ADMIN`** (list users also allows **`USER`** on the backend).
- JWT user is loaded from payload `id`. Inactive users cannot log in.

### 3.2 Vendor API key (`ApiKeyOrJwtGuard`)

Header (folder **5 Onboard**):

```http
Authorization: Bearer {{api_key}}
```

Accepted prefixes (see `ApiKeyPrefix`):

| Prefix | Maps to `ZatcaEnvironment` |
| --- | --- |
| `sk_sandbox_` | `developer_portal` |
| `sk_test_` | `simulation` |
| `sk_live_` | `production` |

Behavior:

- Missing Bearer → `401` `unauthorized` “Missing Authorization Bearer token”.
- Token starting with `sk_*` → HMAC hash lookup; updates `lastUsedAt`.
- Revoked → `401` `api_key_revoked`.
- Expired → `401` `api_key_expired`.
- Invalid → `401` `unauthorized` “Invalid API key”.
- Key’s vendor must own the tax payer → `403` `forbidden`.
- Key environment vs tax payer `zatcaEnvironment` → `403` `api_key_scope`.
- Non-`sk_*` token is treated as JWT (admin can call onboard too).

**Plaintext `key` is returned only on generate.** List/revoke never return `key` or `keyHash`.

---

## 4. Enums (backend + API)

TypeScript enums live in `backend/src/core/enums/`. JSON uses the **string values**.

### 4.1 `UserRole`

| Member | API value | Used in |
| --- | --- | --- |
| `ADMIN` | `ADMIN` | Login response, create/update user, admin routes |
| `USER` | `USER` | Create user example |

### 4.2 `SoftwareVendorStatus`

| Member | API value | Default |
| --- | --- | --- |
| `ACTIVE` | `active` | yes |
| `SUSPENDED` | `suspended` | |

Create/update vendor `status` is optional.

### 4.3 `ApiKeyPrefix`

| Member | API value |
| --- | --- |
| `SK_SANDBOX` | `sk_sandbox_` |
| `SK_TEST` | `sk_test_` |
| `SK_LIVE` | `sk_live_` |

Postman generate example uses `sk_test_` + `expiresInDays: 90`.

### 4.4 `ZatcaEnvironment`

| Member | API value | Typical key |
| --- | --- | --- |
| `SIMULATION` | `simulation` | `sk_test_` |
| `DEVELOPER_PORTAL` | `developer_portal` | `sk_sandbox_` |
| `PRODUCTION` | `production` | `sk_live_` |

Stored on tax payer after CSR/onboard. Not a request field in the collection.

### 4.5 `TaxPayerStatus`

| Member | API value | When |
| --- | --- | --- |
| `DRAFT` | `draft` | create (server default) |
| `ONBOARDED` | `onboarded` | worker finished |
| `SUSPENDED` | `suspended` | admin lifecycle |

Create DTO **omits** `status`; clients cannot set it on create.

### 4.6 `TaxPayerInvoiceType` ↔ CSR bitmap `csr.invoice.type`

| Member | API value | CSR 4-bit | Compliance samples |
| --- | --- | --- | --- |
| `BOTH` | `both` | `1100` | 6 (standard + simplified × invoice/credit/debit) |
| `STANDARD` | `standard` | `1000` | 3 (standard only) |
| `SIMPLIFIED` | `simplified` | `0100` | 3 (simplified only) |

Default on create: `both`. Postman env: `invoice_type=both` → bitmap `1100`.

Sample keys:

- Standard: `standard_invoice`, `standard_credit`, `standard_debit`
- Simplified: `simplified_invoice`, `simplified_credit`, `simplified_debit`

### 4.7 `OnboardStatus`

| Member | API value | Typical `step` | `progress` (illustrative) |
| --- | --- | --- | --- |
| `IDLE` | `idle` | null | 0 |
| `CSR_CREATED` | `csr_created` | `csr` | ~5 |
| `QUEUED` | `queued` | `csid` or `csr` | 0 |
| `RUNNING` | `running` | `compliance` / `pcsid` | 1–99 |
| `ONBOARDED` | `onboarded` | `done` | 100 |
| `FAILED` | `failed` | last step | last progress |

Poll until `onboarded` or `failed`. Never returns OTP, PEM, private key, or CSID.

### 4.8 `OnboardStep`

| Member | API value | Meaning |
| --- | --- | --- |
| `CSR` | `csr` | CSR generated (or renew CSR) |
| `CSID` | `csid` | Compliance CSID (OTP + CSR to Fatoora) |
| `COMPLIANCE` | `compliance` | Sample invoices signed + submitted |
| `PCSID` | `pcsid` | Production CSID |
| `DONE` | `done` | Finished |

### 4.9 Seller ID scheme (not a TS enum; regex on DTO)

Allowed `sellerIdScheme`: `CRN` | `MOM` | `MLS` | `SAG` | `OTH` | `700`.  
Default in DB: `CRN`. Postman create body uses `CRN` + `sellerIdValue` `1010010000`.

### 4.10 Sort order (query)

`sortOrder`: `ASC` | `DESC`. Combined with `sortField` (e.g. `id`).

### 4.11 Invoice enums (not in Postman yet)

**`InvoiceSubtype`:** `standard` | `simplified`

**`InvoiceTypeCode` (UBL):**

| Member | Code |
| --- | --- |
| `INVOICE` | `388` |
| `CREDIT` | `381` |
| `DEBIT` | `383` |

**`InvoiceStatus`:** `received` | `queued` | `signed` | `submitted` | `cleared` | `reported` | `rejected` | `failed`

---

## 5. Shared conventions

### 5.1 Pagination (list endpoints)

Query:

| Param | Default | Notes |
| --- | --- | --- |
| `page` | `1` | **1-based** in the query; server stores `page - 1` internally |
| `pageSize` | `10` (query DTO) | `PageRequest` fallback size is `20` if size is `0` |
| `sortField` | omitted | if set, sort is `sortField,sortOrder` |
| `sortOrder` | `ASC` | only if `sortField` is set |

Response **headers**:

| Header | Meaning |
| --- | --- |
| `X-Total-Count` | total rows |
| `Current-Page` | 0-based page index used internally (`page - 1`) |
| `Has-Next-Page` | `"true"` / `"false"` |

Body is a **JSON array**, not `{ items, total }`.

### 5.2 Audit fields (`BaseDTO`)

Present on many entities: `id`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, `deletedBy`, `deletedAt`. Soft-delete sets `deletedAt` / `deletedBy`; lists exclude deleted rows.

### 5.3 HTTP status → default `error.type` / `error.code`

| HTTP | type | code |
| --- | --- | --- |
| 400 | `invalid_request` | `validation_error` |
| 401 | `authentication_error` | `unauthorized` |
| 403 | `authorization_error` | `forbidden` |
| 404 | `not_found` | `not_found` |
| 409 | `conflict` | `conflict` |
| 500 | `api_error` | `internal_error` |

Named business codes override the default `code` (tables below).

---

## 6. Folder 1 — Auth

### `POST /api/auth/login` — Login (admin)

**Auth:** none  

**Body:**

| Field | Type | Required | Example |
| --- | --- | --- | --- |
| `email` | string | yes | `{{admin_email}}` |
| `password` | string | yes | `{{admin_password}}` |
| `rememberMe` | number | no | unused in collection |

**200:**

```json
{
  "user": {
    "id": 1,
    "email": "admin@admin.com",
    "username": "Administrator",
    "role": "ADMIN",
    "activated": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Password is never returned (`@Exclude` on DTO).

**Test script:** if `200` and `body.token`, set `admin_token`.

| Status | code | When |
| --- | --- | --- |
| 400 | `validation_error` | missing/invalid body (example: empty `{}`) |
| 401 | `unauthorized` | wrong email/password (“Invalid login email or password!”) |
| 400 | `validation_error` | user exists but `activated=false` |

---

## 7. Folder 2 — Vendors (ADMIN)

All routes: `Authorization: Bearer {{admin_token}}`, role `ADMIN`.  
Path base: `/api/vendors`.

### 7.1 `POST /api/vendors` — Create vendor

**Body:**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | yes | min length 1 |
| `slug` | string | no | unique; slugified from `name` if omitted |
| `status` | enum | no | `active` \| `suspended`; default `active` |

Collection body:

```json
{ "name": "Antoor ERP", "slug": "antoor-erp", "status": "active" }
```

**201** example: `id`, `name`, `slug`, `status`, audit fields.

**Test script:** `201` → `vendor_id`.

| Status | code | When |
| --- | --- | --- |
| 409 | `slug_taken` | slug already used |
| 400 | `validation_error` | empty name / bad enum |

### 7.2 `GET /api/vendors` — List vendors

Query: `page`, `pageSize`, optional `sortField`, `sortOrder`.  
**200:** array of vendors + pagination headers.

### 7.3 `GET /api/vendors/{{vendor_id}}` — Get by id

**200:** vendor object.  
**404** `vendor_not_found` “Vendor not found”.

### 7.4 `PUT /api/vendors/{{vendor_id}}` — Update

Partial body (`name`, `slug`, `status`, …).  
**200:** updated vendor. **404** `vendor_not_found`. **409** `slug_taken`.

### 7.5 `DELETE /api/vendors/{{vendor_id}}` — Soft delete

**200:** empty body.  
**409** `vendor_has_tax_payers` “Cannot delete vendor that still has tax payers”.  
**404** `vendor_not_found`.

---

## 8. Folder 3 — API Keys (ADMIN)

Base: `/api/vendors/{{vendor_id}}/api-keys`.

### 8.1 `POST .../api-keys` — Generate

**Body (exactly one expiry style):**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `prefix` | enum | yes | `sk_sandbox_` \| `sk_test_` \| `sk_live_` |
| `expiresInDays` | int ≥ 1 | if no `expiresAt` | relative expiry |
| `expiresAt` | ISO datetime | if no `expiresInDays` | must be in the **future** |

Collection:

```json
{ "prefix": "sk_test_", "expiresInDays": 90 }
```

Alternative from description:

```json
{ "prefix": "sk_live_", "expiresAt": "2027-01-01T00:00:00.000Z" }
```

**201:** includes **`key`** (full secret), `id`, `prefix`, `last4`, `expiresAt`, `lastUsedAt`, `revokedAt`, `expired`, `createdAt`.

**Test script:** `201` → `api_key_id`, `api_key`.

| Status | code | When |
| --- | --- | --- |
| 400 | `expires_required` | neither expiry field, or `expiresAt` not in the future |
| 404 | `vendor_not_found` | bad vendor |

### 8.2 `GET .../api-keys` — List

Metadata only — **no `key`**. Pagination same as vendors.

### 8.3 `POST .../api-keys/{{api_key_id}}/revoke`

Idempotent. **200:** same metadata with `revokedAt` set.  
**404** `api_key_not_found`.

---

## 9. Folder 4 — Tax Payers (ADMIN)

Base: `/api/vendors/{{vendor_id}}/tax-payers`.

### 9.1 Identity vs CSR (`csr.*`)

| API field | CSR property | Example |
| --- | --- | --- |
| `vatNumber` | `csr.organization.identifier` | `399999999900003` |
| `legalName` | `csr.organization.name` | Maximum Speed Tech Supply LTD |
| `organizationUnitName` | `csr.organization.unit.name` | Riyadh Branch |
| `locationAddress` | `csr.location.address` | `RRRD2929` |
| `industryBusinessCategory` | `csr.industry.business.category` | Supply activities |
| `invoiceType` `both` | `csr.invoice.type` | `1100` |
| (server) `country=SA` | `csr.country.name` | `SA` |
| (Create CSR) | `csr.common.name` | `TST-{tin}-{vat}` (non-prod) or `Antoor-{vat}` (prod) |
| (Create CSR) | `csr.serial.number` | `1-Antoor\|2-Gateway\|3-{uuid}` |

Env `csr_common_name` / `csr_serial_number` are **ZATCA portal samples**. Live CSR identity is generated at Create CSR.

### 9.2 Field validation

| Field | Required on create | Rules |
| --- | --- | --- |
| `vatNumber` | yes | 15 digits `/^3\d{13}3$/`, **11th digit `0`** (index 10). Example `399999999900003` |
| `legalName` | yes | non-empty |
| `organizationUnitName` | yes | non-empty |
| `locationAddress` | yes | Wasel `/^[A-Z]{4}\d{4}$/` e.g. `RRRD2929` |
| `industryBusinessCategory` | yes | non-empty |
| `invoiceType` | no | `both` \| `standard` \| `simplified` (default `both`) |
| `streetName`, `buildingNumber`, `district`, `city`, `postalZone` | no | strings |
| `sellerIdScheme` | no | `CRN` \| `MOM` \| `MLS` \| `SAG` \| `OTH` \| `700` |
| `sellerIdValue` | no | string |

Server sets `country=SA`, `status=draft`. Unique **VAT per vendor**.

### 9.3 `POST .../tax-payers` — Create

Collection body uses env CSR identity + address/seller fields.

**201:** full identity; `status: "draft"`.  
**Test script:** `201` → `tax_payer_id`.

| Status | code | When |
| --- | --- | --- |
| 400 | `vat_invalid` / `validation_error` | VAT shape or 11th digit |
| 400 | `wasel_invalid` / `validation_error` | locationAddress pattern |
| 409 | `vat_taken` | same VAT already on this vendor |
| 404 | `vendor_not_found` | |

### 9.4 `GET .../tax-payers` — List

Paginated array.

### 9.5 `GET .../tax-payers/{{tax_payer_id}}`

**200:** identity. **404** `tax_payer_not_found`.

Sensitive columns (`privateKeyEncrypted`, CSIDs, CSR PEM) are **not** in the public mapper used by this API.

### 9.6 `PUT .../tax-payers/{{tax_payer_id}}`

Partial identity update (not `status`/`country`/`vendorId` on Create DTO subset).  
**409** `vat_taken` if VAT collides.

### 9.7 `DELETE .../tax-payers/{{tax_payer_id}}`

Soft delete. **200** empty body. **404** `tax_payer_not_found`.

---

## 10. Folder 5 — Onboard `/v1` (sk_* or ADMIN JWT)

Auth: `Bearer {{api_key}}` (collection default) or admin JWT.  
Test keys (`sk_test_`) force **simulation**. Live keys (`sk_live_`) → **production**.

### 10.1 `POST /v1/taxpayers/{{tax_payer_id}}/onboard/csr` — Create CSR

**Body:** `{}` (ignored). Nest builds CSR from tax payer identity + key environment.

**200 `CsrCreatedDTO`:**

| Field | Type | Notes |
| --- | --- | --- |
| `taxPayerId` | number | |
| `status` | `csr_created` | `OnboardStatus` |
| `csr` | string | PEM `-----BEGIN CERTIFICATE REQUEST-----` — register in Fatoora |
| `commonName` | string | generated |
| `serialNumber` | string | generated UUID EGS |

**Private key is never returned.**

Saved example “CSR config properties (reference)” is **not** the HTTP response; it documents sidecar `csr-config.properties`.

**Operator step:** paste CSR into Fatoora, copy OTP into env `otp`.

### 10.2 `POST /v1/taxpayers/{{tax_payer_id}}/onboard` — Start onboard

**Body:**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `otp` | string | yes | length 1–32 |

**202 `OnboardProgressDTO`:**

```json
{
  "taxPayerId": 12,
  "status": "queued",
  "step": "csid",
  "progress": 0,
  "complianceDone": 0,
  "complianceTotal": 6,
  "error": null
}
```

`complianceTotal` is 6 for `both`, 3 for `standard` or `simplified`.

Worker: compliance CSID → sample invoices → PCSID.

| Status | code | When |
| --- | --- | --- |
| 409 | `csr_required` | no CSR yet |
| 409 | `onboard_running` | job already running |
| 403 | `api_key_scope` / `forbidden` | env or vendor mismatch |
| 404 | `tax_payer_not_found` | |

ZATCA OTP failures surface later on poll as `status: failed` with `error` / `zatcaBody`, often `zatca_code` such as `Invalid-OTP`.

### 10.3 `GET /v1/taxpayers/{{tax_payer_id}}/onboard` — Poll

**200** progress only.

Saved examples:

| Example | status | step | progress | complianceDone |
| --- | --- | --- | --- | --- |
| running | `running` | `compliance` | 55 | 3 / 6 |
| onboarded | `onboarded` | `done` | 100 | 6 / 6 |
| after CSR | `csr_created` | `csr` | 5 | 0 / 6 |

Poll until `onboarded` or `failed`. `error` is a string; `zatcaBody` is raw Fatoora JSON when present.

### 10.4 `POST /v1/taxpayers/{{tax_payer_id}}/renew` — Renew production CSID

Same body as start (`otp`). **202** queued, typically `step: csr`.

Requires completed first onboard + existing PCSID.

| Status | code | When |
| --- | --- | --- |
| 409 | `not_onboarded` | first onboard not done |
| 409 | `pcsid_required` | no production CSID |
| 409 | `onboard_running` | job in flight |

Renew: new CSR → OTP renew → compliance samples → new PCSID.

---

## 11. Folder 6 — Users (ADMIN)

Base: `/api/users`. JWT required.

### 11.1 `GET /api/users` — List

Roles: **ADMIN and USER**. Paginated array.

Example item: `id`, `email`, `username`, `role`, `activated` (no password).

### 11.2 `POST /api/users` — Create

**ADMIN only.**

| Field | Required | Rules |
| --- | --- | --- |
| `email` | yes | unique, email format |
| `password` | yes | stored hashed |
| `username` | yes | non-empty |
| `role` | yes | `ADMIN` \| `USER` |
| `activated` | no | boolean |
| `imageUrl` | no | |

**201** user without password.  
**400** “User with email … already exists”.  
**Test script:** `201` or `200` → `user_id`.

### 11.3 `PUT /api/users/{{user_id}}` — Update

Partial. Email uniqueness checked against other users.  
**404** “User with id … not found”.

### 11.4 `DELETE /api/users/{{user_id}}`

**200** empty. **404** if missing.

---

## 12. Error code catalog (named codes)

| HTTP | type | code | Typical message |
| --- | --- | --- | --- |
| 400 | `invalid_request` | `validation_error` | class-validator messages |
| 400 | `invalid_request` | `vat_invalid` | VAT 15 digits, start/end 3 |
| 400 | `invalid_request` | `wasel_invalid` | Wasel `AAAA9999` |
| 400 | `invalid_request` | `expires_required` | need `expiresAt` or `expiresInDays` |
| 401 | `authentication_error` | `unauthorized` | missing/invalid JWT or key |
| 401 | `authentication_error` | `api_key_revoked` | revoked |
| 401 | `authentication_error` | `api_key_expired` | past `expiresAt` |
| 403 | `authorization_error` | `forbidden` | role or vendor mismatch |
| 403 | `authorization_error` | `api_key_scope` | prefix vs ZATCA env |
| 404 | `not_found` | `vendor_not_found` | |
| 404 | `not_found` | `tax_payer_not_found` | |
| 404 | `not_found` | `api_key_not_found` | |
| 404 | `not_found` | `not_found` | generic |
| 409 | `conflict` | `slug_taken` | vendor slug |
| 409 | `conflict` | `vat_taken` | VAT per vendor |
| 409 | `conflict` | `vendor_has_tax_payers` | cannot delete vendor |
| 409 | `conflict` | `csr_required` | start onboard without CSR |
| 409 | `conflict` | `onboard_running` | duplicate job |
| 409 | `conflict` | `not_onboarded` | renew too early |
| 409 | `conflict` | `pcsid_required` | renew without PCSID |
| 500 | `api_error` | `internal_error` | unexpected |
| * | `zatca_error` | (Fatoora code) | worker / ZATCA client |

---

## 13. End-to-end sequence (state machine)

```
Login (JWT)
  → Create vendor (active)
  → Generate sk_test_ key (copy once)
  → Create tax payer (draft, VAT + Wasel)
  → POST CSR (csr_created, PEM)
  → [human] Fatoora register CSR + OTP
  → POST onboard { otp } (queued → running)
  → GET poll
        csr → csid → compliance → pcsid → done
  → tax payer status onboarded
  → later: POST renew { otp } (new PCSID)
```

---

## 14. Collection vs backend gaps

| Topic | Notes |
| --- | --- |
| Invoice submit/clear/report | Enums exist; no Postman folder yet |
| `sk_sandbox_` | Supported in API; collection example uses `sk_test_` |
| Register / activate user | `AuthService` has extra methods; collection only has login |
| Pagination `Current-Page` | 0-based internal index; query `page` is 1-based |
| Create CSR body | Collection sends `{}`; fields come from tax payer, not request JSON |
| Progress `zatcaBody` | In DTO; not in all saved Postman examples |

---

## 15. Files

| File | Role |
| --- | --- |
| `postman/ZATCA-Gateway.postman_collection.json` | Collection v2.1 + saved examples + test scripts |
| `postman/ZATCA-Gateway.local.postman_environment.json` | Local URLs, seed admin, CSR samples |
| `postman/README.md` | Short import + run order |
| `backend/src/core/enums/*.ts` | Source of truth for enum strings |
