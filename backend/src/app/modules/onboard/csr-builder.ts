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
    environment === ZatcaEnvironment.SIMULATION
      ? `TST-${tin}-${taxPayer.vatNumber}`
      : `Antoor-${taxPayer.vatNumber}`;

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

/** Strip PEM headers / whitespace for Fatoora body csr field (base64). */
export function csrToBase64(csrPem: string): string {
  return csrPem
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/\s+/g, '')
    .trim();
}
