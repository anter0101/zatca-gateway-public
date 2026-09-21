import { randomUUID } from 'crypto';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';

export type CsrIdentity = {
  commonName: string;
  serialNumber: string;
  properties: string;
  config: Record<string, string>;
};

function invoiceTypeBitmap(type: TaxPayerInvoiceType): string {
  switch (type) {
    case TaxPayerInvoiceType.STANDARD:
      return '1000';
    case TaxPayerInvoiceType.SIMPLIFIED:
      return '0100';
    default:
      return '1100';
  }
}

export function buildCsrIdentity(
  taxPayer: TaxPayer,
  environment: ZatcaEnvironment,
): CsrIdentity {
  const tin = taxPayer.vatNumber.slice(0, 10);
  const egsUuid = randomUUID();
  const serialNumber = `1-Antoor|2-Gateway|3-${egsUuid}`;
  const commonName =
    environment === ZatcaEnvironment.PRODUCTION
      ? `Antoor-${taxPayer.vatNumber}`
      : `TST-${tin}-${taxPayer.vatNumber}`;

  const config: Record<string, string> = {
    'csr.common.name': commonName,
    'csr.serial.number': serialNumber,
    'csr.organization.identifier': taxPayer.vatNumber,
    'csr.organization.unit.name': taxPayer.organizationUnitName,
    'csr.organization.name': taxPayer.legalName,
    'csr.country.name': 'SA',
    'csr.invoice.type': invoiceTypeBitmap(taxPayer.invoiceType),
    'csr.location.address': taxPayer.locationAddress,
    'csr.industry.business.category': taxPayer.industryBusinessCategory,
  };

  const properties = Object.entries(config)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  return { commonName, serialNumber, properties, config };
}

/**
 * Encode CSR for Fatoora `POST /compliance` body `{ "csr": "..." }`.
 * Fatoora expects UTF-8 base64 of the **full PEM** (headers + newlines),
 * e.g. decoding starts with `-----BEGIN CERTIFICATE REQUEST-----`.
 */
export function csrToBase64(csrPem: string): string {
  let value = csrPem.trim();
  if (!value) {
    return '';
  }

  // Already Fatoora-encoded (swagger example starts with LS0tLS1CRUdJTi…)
  const compact = value.replace(/\s+/g, '');
  if (compact.startsWith('LS0tLS1CRUdJTi')) {
    return compact;
  }

  // Literal JSON escapes stored as text (e.g. one-line PEM with `\n`)
  value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  value = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!/^-----BEGIN /m.test(value)) {
    const body = value.replace(/\s+/g, '');
    value =
      '-----BEGIN CERTIFICATE REQUEST-----\n' +
      body +
      '\n-----END CERTIFICATE REQUEST-----';
  }

  return Buffer.from(value, 'utf8').toString('base64');
}
