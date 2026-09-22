# Postman — ZATCA Gateway

Importable Collection v2.1 with saved examples for Phase 2 (admin) and Phase 3 (onboard).

Full request/response, enum, and error analysis: [`API-ANALYSIS.md`](API-ANALYSIS.md).

## Import

1. Open Postman → **Import**
2. Select:
   - [`ZATCA-Gateway.postman_collection.json`](ZATCA-Gateway.postman_collection.json)
   - [`ZATCA-Gateway.local.postman_environment.json`](ZATCA-Gateway.local.postman_environment.json)
3. Activate environment **ZATCA Gateway — Local**

## Suggested run order

| # | Folder | Request | Side effect |
| --- | --- | --- | --- |
| 1 | Auth | Login (admin) | sets `admin_token` |
| 2 | Vendors | Create vendor | sets `vendor_id` |
| 3 | API Keys | Generate API key | sets `api_key` + `api_key_id` (copy key once) |
| 4 | Tax Payers | Create tax payer | sets `tax_payer_id` |
| 5 | Onboard | Create CSR | uses `{{api_key}}`; register CSR in Fatoora |
| 6 | Onboard | Start onboard | set env `otp` from portal |
| 7 | Onboard | Poll onboard progress | until `onboarded` / `failed` |

## Auth

- Folders **2–4, 6**: `Bearer {{admin_token}}`
- Folder **5 Onboard**: `Bearer {{api_key}}` (`sk_test_` / `sk_live_`); admin JWT also accepted

## Notes

- VAT must match `/^3\d{13}3$/` with 11th digit `0` (e.g. `399999999900003`)
- Wasel `locationAddress`: e.g. `RRRD2929`
- Generate-key response is the only place plaintext `key` appears
- Onboard progress never returns OTP, PEM, or CSID

## CSR sample (env)

ZATCA SDK example values live in the environment as `csr_*` (used by Create tax payer):

```
csr.common.name=TST-886431145-399999999900003
csr.serial.number=1-TST|2-TST|3-ed22f1d8-e6a2-1118-9b58-d9a8f11e445f
csr.organization.identifier=399999999900003
csr.organization.unit.name=Riyadh Branch
csr.organization.name=Maximum Speed Tech Supply LTD
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=RRRD2929
csr.industry.business.category=Supply activities
```

`invoice_type=both` ↔ bitmap `1100`. Create CSR builds CN/serial at runtime; env holds the portal sample for reference.
