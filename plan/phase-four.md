# Phase 4 — Live invoices

**Depends on:** [phase-three.md](phase-three.md) (sidecar sandbox, onboarded PCSID).  
**Delivers:** UBL generator + `POST /v1/invoices` (clearance / reporting).  
**Next:** [phase-five.md](phase-five.md) — Harden.

Build UBL 2.1 from vendor JSON using the ZATCA Data Dictionary and SDK samples. Vendor sends **business data**; gateway computes totals, stamps seller, sets ICV/PIH, sidecar signs + SDK `-validate`, then Fatoora.

## This phase

- Invoice table + `POST /v1/invoices` (worker + poll)
- Generator for the **six** live document types
- Discounts, VAT %, credit/debit (returns), standard vs simplified
- Fatoora clearance / reporting with correct headers and JSON body
- On reject: **do not** advance PIH; store signed + cleared XML when successful

**Not this phase:** export, self-billing, third-party, summary, nominal, B2G, prepayment `386`, non-SAR.

```mermaid
flowchart TB
  ERP[VendorERP] -->|Bearer_sk plus Idempotency-Key| Nest
  Nest -->|lock tax_payer| PG
  Nest --> Queue[BullMQ]
  Queue --> Worker
  Worker --> Gen[UBL_generator]
  Worker --> Sidecar
  Worker -->|standard clearance| Fatoora
  Worker -->|simplified reporting| Fatoora
```

Auth: `Authorization: Bearer sk_test_...` / `sk_live_...`. Tax payer must be `onboarded` (PCSID). Seller address fields required. Test keys → simulation only. Header `Idempotency-Key` required.

---

## Six document types

Same root `<Invoice>`. Type is code + KSA-2 `@name`.

| Kind | subtype | typeCode | KSA-2 | Fatoora | Buyer |
| --- | --- | --- | --- | --- | --- |
| Standard tax invoice | `standard` | `388` | `0100000` | clearance **before** customer gets it | **Mandatory** |
| Standard credit (return) | `standard` | `381` | `0100000` | clearance | Mandatory + `originalInvoiceId` + reason |
| Standard debit | `standard` | `383` | `0100000` | clearance | Mandatory + `originalInvoiceId` + reason |
| Simplified tax invoice | `simplified` | `388` | `0200000` | reporting within **24h** (BR-KSA-98) | Optional |
| Simplified credit (return) | `simplified` | `381` | `0200000` | reporting | Optional buyer; original + reason |
| Simplified debit | `simplified` | `383` | `0200000` | reporting | Optional buyer; original + reason |

Gated by tax payer `invoice_type` (`standard` / `simplified` / `both`). Mismatch → `400` (`taxpayer_invoice_type`).

**Return** = credit note (`381`) with `instructionNote` (dictionary **M** on 381/383, **NA** on 388).

---

## HTTP

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/v1/invoices` | Header `Idempotency-Key`. **202**. Worker: XML → sign → validate → clearance/reporting |
| `GET` | `/v1/invoices/:id` | Status, hash, QR, ZATCA error. No private keys |
| `GET` | `/v1/invoices` | Filter by taxPayerId, status, subtype |

`jobId = invoice:{vendorId}:{idempotencyKey}`. `SELECT … FOR UPDATE` on `tax_payers` for ICV/PIH.

Statuses: `queued` → `signed` → `submitted` → `cleared` \| `reported` \| `rejected` \| `failed`.

---

## Payload (`POST /v1/invoices`)

Seller is **not** in the body — copied from the tax payer.

```json
{
  "taxPayerId": 12,
  "documentNumber": "INV-2026-0001",
  "subtype": "standard",
  "type": "invoice",
  "issueDate": "2026-09-19",
  "issueTime": "18:30:00",
  "currency": "SAR",
  "supplyDate": "2026-09-19",
  "paymentMeansCode": "10",
  "instructionNote": null,
  "originalInvoiceId": null,
  "buyer": {
    "name": "Fatoora Samples LTD",
    "vatNumber": "399999999800003",
    "idScheme": "CRN",
    "idValue": "1010010000",
    "streetName": "Salah Al-Din",
    "buildingNumber": "1111",
    "district": "Al-Murooj",
    "city": "Riyadh",
    "postalZone": "12222",
    "country": "SA"
  },
  "documentDiscount": {
    "amount": 10.00,
    "reason": "discount",
    "percent": 5,
    "baseAmount": 200.00,
    "taxCategory": "S",
    "taxPercent": 15
  },
  "lines": [
    {
      "id": "1",
      "name": "Book",
      "quantity": 2,
      "unitCode": "PCE",
      "unitPrice": 100.00,
      "discount": { "amount": 5.00, "percent": 5, "baseAmount": 100.00 },
      "taxCategory": "S",
      "taxPercent": 15
    }
  ]
}
```

`type`: `invoice` \| `credit` \| `debit` (388 / 381 / 383). `return` is an alias of `credit`.

Credit/debit required:

```json
{
  "type": "credit",
  "originalInvoiceId": 88,
  "instructionNote": "In case of goods or services refund | عند ترجيع السلع أو الخدمات"
}
```

| Category | Code | Percent | Exemption |
| --- | --- | --- | --- |
| Standard rated | `S` | 15 (typical) | none |
| Zero rated | `Z` | 0 | code + text **C** (e.g. `VATEX-SA-35`) |
| Exempt | `E` | 0 | e.g. `VATEX-SA-29-7` |
| Out of scope | `O` | 0 | `VATEX-SA-OOS` |

`ChargeIndicator` for allowances is always `false` (BR-KSA-F-02).

---

## Generator rules

Dictionary: **M** / **O** / **C** / **NA**. Nest builds XML from Phase 4 rules; local gate is SDK `-validate` only (Phase 3).

**Always**

- `ProfileID` = `reporting:1.0`
- `ID`, `UUID` (KSA-1), `IssueDate`, `IssueTime` `hh:mm:ss` (KSA-25)
- `InvoiceTypeCode` + `@name` 7 chars
- `DocumentCurrencyCode` + `TaxCurrencyCode` (usually `SAR`, BR-KSA-68)
- ICV monotonic (KSA-16); PIH previous hash (KSA-13); first PIH from [Data/PIH/pih.txt](../sdk/Data/PIH/pih.txt)
- QR filled by SDK (KSA-14); stamp on `-sign` (KSA-15)
- Seller: VAT, name, full address, one ID scheme (BR-KSA-08/09)
- Two `TaxTotal` blocks; `LegalMonetaryTotal` with `PayableAmount`
- ≥1 line; amounts 2 decimals (BR-KSA-F-04); UBL element order matches samples

**Standard only:** buyer name + full address; line `TaxAmount` + `RoundingAmount` (**M**).

**Credit / debit only:** `BillingReference` (BR-KSA-56); `InstructionNote` (BR-KSA-17); original same tax payer.

**Discounts (C):** document / line / price allowances with `ChargeIndicator=false`.

**Tax math:** gateway computes; group by (category, percent); `PayableAmount` = inclusive − prepaid (v1 prepaid 0).

**Simplified QR:** tags 1–8 including signature (07) and public key (08). Confirm CLI flag `-qr` vs `-invoicewithqr` via sidecar `-help` after install.

---

## Fatoora submit

SDK builds:

```json
{ "invoiceHash": "<hash>", "uuid": "<invoice UUID>", "invoice": "<base64 XML>" }
```

| Subtype | Path | Notes |
| --- | --- | --- |
| Standard | `POST /invoices/clearance/single` | Must clear **before** issuing to customer. Send `Clearance-Status` header as required by Fatoora |
| Simplified | `POST /invoices/reporting/single` | Report within **24 hours** (BR-KSA-98) |

Auth: Basic from PCSID (binary security token + secret), not our JWT. Environment must match `tax_payers.zatca_environment` and key prefix.

Errors: Stripe-like `{ error: { type, code, message, zatca_code } }`.

---

## Worker

1. Validate JSON + taxpayer type + original invoice + seller address present
2. Lock tax payer; assign UUID, ICV, PIH
3. Generate unsigned XML (no UBLExtensions, no QR value)
4. Sidecar sign / validate / invoice-request (sandbox)
5. Standard → clearance; simplified → reporting
6. **On success:** save hash as next PIH; store `unsigned_xml`, `signed_xml`, `cleared_xml` (if any), QR; status `cleared` or `reported`
7. **On ZATCA reject or SDK NOT PASS:** do **not** advance PIH; status `rejected` / `failed`

---

## Schema

Create `invoices` from [phase-one.md](phase-one.md) (including `idempotency_key`, XML columns, `zatca_request` / `zatca_response`, `job_id`, `error`).

---

## Out of scope

- KSA-2 flags other than `01`/`02`
- Document-level charges (`ChargeIndicator` true)
- Invoice type `386` prepayment
- Dashboard UI, webhooks (Phase 5)
- RabbitMQ
