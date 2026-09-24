# Phase 4 — Invoice enums, types, and APIs

Invoice calls use an API key issued for **one tax payer** (`POST /api/vendors/:vendorId/api-keys` with `taxPayerId`). That key can create, list, and read only that tax payer's invoices. A vendor-wide key (no `taxPayerId`) is for tax payers and onboard, and invoice routes reject it with **403** `taxpayer_key_required`.

The tax payer must be onboarded (PCSID) and have street, building, city, and postal code. Seller, tax payer id, and document number are not in the body. The gateway assigns the document number as `{vatNumber}-{sequence}` (`399999999900003-000001`, then `000002`, and so on).

Send the words from `GET /v1/invoices/options` (`value` in the request, `label` on the screen). The gateway writes the ZATCA codes into the XML.

Base path: `/v1/invoices` (nginx `http://localhost/v1/invoices`, or `{{base_url}}` in Postman).

## APIs

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/v1/invoices/options` | Dropdown values. No body. |
| `POST` | `/v1/invoices` | Header `Idempotency-Key` required. **202**. Queues sign, SDK validate, then clearance (standard) or reporting (simplified). |
| `GET` | `/v1/invoices` | Query `status`, `subtype`. Only the tax payer on the key. |
| `GET` | `/v1/invoices/:id` | Status, hash, QR, generated `documentNumber`, error. No private keys or XML secrets. |

`POST` is idempotent on `(tax payer, Idempotency-Key)`. A repeat returns the same invoice and does not take a new document number.

### POST body

```json
{
  "subtype": "standard",
  "type": "invoice",
  "issueDate": "2026-09-24",
  "issueTime": "18:30:00",
  "currency": "SAR",
  "supplyDate": "2026-09-24",
  "paymentMeansCode": "cash",
  "instructionNote": null,
  "originalInvoiceId": null,
  "buyer": {
    "name": "Fatoora Samples LTD",
    "vatNumber": "399999999800003",
    "idScheme": "commercial_registration",
    "idValue": "1010010000",
    "streetName": "Salah Al-Din",
    "buildingNumber": "1111",
    "district": "Al-Murooj",
    "city": "Riyadh",
    "postalZone": "12222",
    "country": "SA"
  },
  "documentDiscount": {
    "amount": 10,
    "reason": "discount",
    "taxCategory": "standard",
    "taxPercent": 15
  },
  "documentCharge": {
    "amount": 60,
    "reasonCode": "legalisation_fee",
    "reason": "Legalisation fee",
    "taxCategory": "standard",
    "taxPercent": 15
  },
  "lines": [
    {
      "id": "1",
      "name": "Book",
      "quantity": 2,
      "unitCode": "PCE",
      "unitPrice": 100,
      "discountAmount": 5,
      "taxCategory": "standard",
      "taxPercent": 15,
      "exemptionCode": null,
      "exemptionReason": null
    }
  ]
}
```

`documentDiscount`, `documentCharge`, `buyer` (simplified only), `supplyDate`, `instructionNote`, and `originalInvoiceId` are optional except where the rules below say otherwise.

### GET invoice

```json
{
  "id": 1,
  "taxPayerId": 1,
  "documentNumber": "399999999900003-000001",
  "subtype": "standard",
  "type": "invoice",
  "typeCode": "388",
  "status": "queued",
  "uuid": "8d487816-70b8-4ade-a618-9d620b73814a",
  "invoiceHash": null,
  "qr": null,
  "error": null
}
```

`type` in the response is `invoice`, `credit`, or `debit` (never `return`). `typeCode` is the UBL code.

## Enums

### subtype → KSA-2 and Fatoora

| Value | Label | KSA-2 | Fatoora |
| --- | --- | --- | --- |
| `standard` | Standard (clearance) | `0100000` | `POST .../invoices/clearance/single`, `Clearance-Status: 1` |
| `simplified` | Simplified (reporting) | `0200000` | `POST .../invoices/reporting/single`, `Clearance-Status: 0` |

Must match the tax payer `invoice_type` (`standard`, `simplified`, or `both`). Otherwise **400** `taxpayer_invoice_type`. Standard requires `buyer.name`.

### type → UBL type code

| Request `type` | Stored as | `typeCode` |
| --- | --- | --- |
| `invoice` | invoice | `388` |
| `credit` | credit | `381` |
| `debit` | debit | `383` |
| `return` | credit (alias) | `381` |

Credit, debit, and return require `originalInvoiceId` (same vendor and tax payer) and `instructionNote`. Otherwise **400** `credit_debit_reference_required`.

### currency

| Value | Label |
| --- | --- |
| `SAR` | SAR |

Show `label` in the form. Send `value`.

### paymentMeansCode

| Value to send | Label |
| --- | --- |
| `cash` | Cash |
| `credit_transfer` | Credit transfer |
| `bank_account` | Payment to bank account |
| `bank_card` | Bank card |
| `not_defined` | Instrument not defined |

### buyer.idScheme

| Value to send | Label |
| --- | --- |
| `commercial_registration` | Commercial registration |
| `momra_license` | Momra license |
| `mlsd_license` | MLSD license |
| `sagia_license` | Sagia license |
| `other` | Other |
| `number_700` | 700 number |

### taxCategory

Used on a line, `documentDiscount`, and `documentCharge`.

| Value to send | Label | Typical percent | Exemption |
| --- | --- | --- | --- |
| `standard` | Standard rated | 15 | none |
| `zero_rated` | Zero rated | 0 | `exemptionCode` + `exemptionReason` required |
| `exempt` | Exempt | 0 | required |
| `out_of_scope` | Out of scope | 0 | required |

Example exemption codes: `VATEX-SA-35` (zero rated), `VATEX-SA-29-7` (exempt), `VATEX-SA-OOS` (out of scope). Missing exemption is **400** `exemption_required`.

`documentDiscount` is an allowance (`ChargeIndicator` false) and reduces the taxable amount. `documentCharge` is a charge (`ChargeIndicator` true) and increases it. A line `discountAmount` is also an allowance.

### documentCharge.reasonCode

| Value to send | Label |
| --- | --- |
| `discount` | Discount |
| `advertising` | Advertising |
| `additional_packaging` | Additional packaging |
| `other_services` | Other services |
| `pickup` | Pickup |
| `freight` | Freight |
| `financing` | Financing |
| `labelling` | Labelling |
| `legalisation_fee` | Legalisation fee |
| `promotional` | Promotional |

### status (stored, query filter)

`received` → `queued` → `signed` → `submitted` → `cleared` (standard) or `reported` (simplified).

Failure stops at `rejected` or `failed`. The previous-invoice hash advances only after ZATCA accepts the invoice.

## Other errors

| HTTP | code | When |
| --- | --- | --- |
| 403 | `api_key_required` | JWT with no vendor API key |
| 403 | `taxpayer_key_required` | Invoice call used a key that is not bound to a tax payer |
| 400 | `api_key_taxpayer_environment` | Key prefix does not match the tax payer ZATCA environment |
| 400 | `idempotency_key_required` | Missing `Idempotency-Key` |
| 404 | `tax_payer_not_found` | `taxPayerId` on key create is not this vendor's |
| 409 | `taxpayer_not_onboarded` | No PCSID |
| 409 | `seller_address_required` | Street, building, city, or postal code missing |
| 400 | `buyer_required` | Standard invoice without buyer name |
| 404 | `original_invoice_not_found` | Credit/debit original is missing or belongs to another tax payer |
| 404 | `invoice_not_found` | GET id is not this tax payer's |

## Postman

Import `postman/ZATCA-Gateway.postman_collection.json` and `postman/ZATCA-Gateway.local.postman_environment.json`.

Two keys:

1. **Generate API key** saves `vendor_api_key`. Folder **3b. API Keys (vendor key)** lists, creates, and revokes keys at `/v1/api-keys` (no vendor id). Folder **4b. Tax payers (vendor key)** creates, lists, updates, and deletes tax payers at `/v1/taxpayers`. No vendor id in the path or body.
2. **Generate invoice key (one tax payer)** saves `taxpayer_api_key`. Folder **5b** onboards that tax payer at `POST /v1/taxpayers/onboard/csr`, `POST /v1/taxpayers/onboard`, `GET /v1/taxpayers/onboard`, and `POST /v1/taxpayers/renew` (no id in the path). Folders **7. Standard invoices** and **8. Simplified invoices** use the same key. Each has options, list, get, and a POST for every case. Bodies send words such as `bank_card` and `labelling`. They do not send `taxPayerId` or `documentNumber`. Credit, debit, and return use `original_invoice_id` after a successful invoice.
