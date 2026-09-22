import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';

/** Unsigned UBL templates for compliance onboard (one per document type). */
const TEMPLATE_FILES: Record<string, string> = {
  standard_invoice: 'standard_invoice.xml',
  standard_credit: 'standard_credit.xml',
  standard_debit: 'standard_debit.xml',
  simplified_invoice: 'simplified_invoice.xml',
  simplified_credit: 'simplified_credit.xml',
  simplified_debit: 'simplified_debit.xml',
};

export type SampleKey = keyof typeof TEMPLATE_FILES;

export type StampedSample = {
  key: string;
  xml: string;
  uuid: string;
};

function templatesDir(): string {
  return (
    process.env.ZATCA_TEMPLATES_DIR ||
    join(process.cwd(), 'assets', 'zatca-templates')
  );
}

function loadTemplate(file: string): string {
  return readFileSync(join(templatesDir(), file), 'utf8');
}

/**
 * Strip signature / QR so a signed fixture can be re-signed.
 * QR ADR match requires ID=QR as the first child so ICV/PIH siblings are kept.
 */
export function stripSignedBits(xml: string): string {
  let out = xml;
  out = out.replace(/<ext:UBLExtensions[\s\S]*?<\/ext:UBLExtensions>/gi, '');
  out = out.replace(/<cac:Signature[\s\S]*?<\/cac:Signature>/gi, '');
  out = out.replace(
    /<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*QR\s*<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/gi,
    '',
  );
  return out;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Replace the first invoice-level cbc:UUID (comes before ICV's UUID). */
function replaceInvoiceUuid(xml: string, uuid: string): string {
  if (!/<cbc:UUID>/i.test(xml)) {
    throw new Error('template missing invoice cbc:UUID');
  }
  return xml.replace(
    /(<cbc:UUID>)([^<]*)(<\/cbc:UUID>)/i,
    `$1${escapeXml(uuid)}$3`,
  );
}

function replaceFirstTag(xml: string, tag: string, value: string): string {
  const finder = new RegExp(`<cbc:${tag}[^>]*>`, 'i');
  if (!finder.test(xml)) {
    throw new Error(`template missing cbc:${tag}`);
  }
  const re = new RegExp(`(<cbc:${tag}[^>]*>)([\\s\\S]*?)(</cbc:${tag}>)`, 'i');
  return xml.replace(re, `$1${escapeXml(value)}$3`);
}

function stampSeller(xml: string, taxPayer: TaxPayer): string {
  let out = xml;

  out = out.replace(
    /(<cac:AccountingSupplierParty>[\s\S]*?<cac:PartyTaxScheme>\s*<cbc:CompanyID>)([^<]*)(<\/cbc:CompanyID>)/i,
    `$1${escapeXml(taxPayer.vatNumber)}$3`,
  );

  out = out.replace(
    /(<cac:AccountingSupplierParty>[\s\S]*?<cac:PartyLegalEntity>\s*<cbc:RegistrationName>)([^<]*)(<\/cbc:RegistrationName>)/i,
    `$1${escapeXml(taxPayer.legalName)}$3`,
  );

  if (taxPayer.sellerIdValue) {
    const scheme = escapeXml(taxPayer.sellerIdScheme || 'CRN');
    out = out.replace(
      /(<cac:AccountingSupplierParty>[\s\S]*?<cac:PartyIdentification>\s*)<cbc:ID\b[^>]*>[^<]*<\/cbc:ID>/i,
      `$1<cbc:ID schemeID="${scheme}">${escapeXml(taxPayer.sellerIdValue)}</cbc:ID>`,
    );
  }

  if (taxPayer.streetName) {
    out = out.replace(
      /(<cac:AccountingSupplierParty>[\s\S]*?<cbc:StreetName>)([^<]*)(<\/cbc:StreetName>)/i,
      `$1${escapeXml(taxPayer.streetName)}$3`,
    );
  }
  if (taxPayer.buildingNumber) {
    out = out.replace(
      /(<cac:AccountingSupplierParty>[\s\S]*?<cbc:BuildingNumber>)([^<]*)(<\/cbc:BuildingNumber>)/i,
      `$1${escapeXml(taxPayer.buildingNumber)}$3`,
    );
  }
  if (taxPayer.district) {
    out = out.replace(
      /(<cac:AccountingSupplierParty>[\s\S]*?<cbc:CitySubdivisionName>)([^<]*)(<\/cbc:CitySubdivisionName>)/i,
      `$1${escapeXml(taxPayer.district)}$3`,
    );
  }
  if (taxPayer.city) {
    out = out.replace(
      /(<cac:AccountingSupplierParty>[\s\S]*?<cbc:CityName>)([^<]*)(<\/cbc:CityName>)/i,
      `$1${escapeXml(taxPayer.city)}$3`,
    );
  }
  if (taxPayer.postalZone) {
    out = out.replace(
      /(<cac:AccountingSupplierParty>[\s\S]*?<cbc:PostalZone>)([^<]*)(<\/cbc:PostalZone>)/i,
      `$1${escapeXml(taxPayer.postalZone)}$3`,
    );
  }

  return out;
}

function stampIcvPih(xml: string, icv: string, pih: string): string {
  if (
    !/<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*ICV\s*<\/cbc:ID>/i.test(
      xml,
    )
  ) {
    throw new Error('template missing ICV AdditionalDocumentReference');
  }
  if (
    !/<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*PIH\s*<\/cbc:ID>/i.test(
      xml,
    )
  ) {
    throw new Error('template missing PIH AdditionalDocumentReference');
  }
  let out = xml.replace(
    /(<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*ICV\s*<\/cbc:ID>\s*<cbc:UUID>)([^<]*)(<\/cbc:UUID>)/i,
    `$1${escapeXml(icv)}$3`,
  );
  out = out.replace(
    /(<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*PIH\s*<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>)([^<]*)(<\/cbc:EmbeddedDocumentBinaryObject>)/i,
    `$1${escapeXml(pih)}$3`,
  );
  return out;
}

/** Fail fast if KSA-16 / KSA-13 structure is missing after fill. */
export function assertIcvPihPresent(xml: string): void {
  const icv = xml.match(
    /<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*ICV\s*<\/cbc:ID>\s*<cbc:UUID>([^<]*)<\/cbc:UUID>/i,
  );
  if (!icv || !icv[1]?.trim()) {
    throw new Error('stamped XML missing non-empty ICV (KSA-16)');
  }
  const pih = xml.match(
    /<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*PIH\s*<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]*)<\/cbc:EmbeddedDocumentBinaryObject>/i,
  );
  if (!pih || !pih[1]?.trim()) {
    throw new Error('stamped XML missing non-empty PIH (KSA-13)');
  }
}

export function listSampleKeys(
  invoiceType: TaxPayerInvoiceType,
): SampleKey[] {
  const standard: SampleKey[] = [
    'standard_invoice',
    'standard_credit',
    'standard_debit',
  ];
  const simplified: SampleKey[] = [
    'simplified_invoice',
    'simplified_credit',
    'simplified_debit',
  ];
  if (invoiceType === TaxPayerInvoiceType.STANDARD) {
    return standard;
  }
  if (invoiceType === TaxPayerInvoiceType.SIMPLIFIED) {
    return simplified;
  }
  return [...standard, ...simplified];
}

export function stampSample(
  key: SampleKey,
  taxPayer: TaxPayer,
  icv: string,
  pih: string,
): StampedSample {
  const file = TEMPLATE_FILES[key];
  if (!file) {
    throw new Error(`unknown sample key: ${String(key)}`);
  }
  let xml = loadTemplate(file);
  // Templates are unsigned; strip is a no-op safety net if a signed copy slips in.
  xml = stripSignedBits(xml);

  const uuid = randomUUID();
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19);

  xml = stampSeller(xml, taxPayer);
  xml = replaceInvoiceUuid(xml, uuid);
  xml = replaceFirstTag(xml, 'IssueDate', date);
  xml = replaceFirstTag(xml, 'IssueTime', time);
  xml = replaceFirstTag(xml, 'ID', `GW-${icv}`);
  xml = stampIcvPih(xml, icv, pih);
  assertIcvPihPresent(xml);

  return { key, xml, uuid };
}

export function complianceTotal(invoiceType: TaxPayerInvoiceType): number {
  return listSampleKeys(invoiceType).length;
}
