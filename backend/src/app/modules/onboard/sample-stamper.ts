import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';

const SAMPLE_FILES: Record<string, string> = {
  standard_invoice: 'Standard_Invoice.xml',
  standard_credit: 'Standard_Credit_Note.xml',
  standard_debit: 'Standard_Debit_Note.xml',
  simplified_invoice: 'Simplified_Invoice.xml',
  simplified_credit: 'Simplified_Credit_Note.xml',
  simplified_debit: 'Simplified_Debit_Note.xml',
};

export type StampedSample = {
  key: string;
  xml: string;
  uuid: string;
};

function samplesDir(): string {
  return (
    process.env.ZATCA_SAMPLES_DIR ||
    join(process.cwd(), 'assets', 'zatca-samples')
  );
}

function loadSample(file: string): string {
  return readFileSync(join(samplesDir(), file), 'utf8');
}

/** Strip signature / QR so sidecar can re-sign. */
export function stripSignedBits(xml: string): string {
  let out = xml;
  out = out.replace(/<ext:UBLExtensions[\s\S]*?<\/ext:UBLExtensions>/g, '');
  out = out.replace(/<cac:Signature[\s\S]*?<\/cac:Signature>/g, '');
  out = out.replace(
    /<cac:AdditionalDocumentReference>[\s\S]*?<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/g,
    '',
  );
  return out;
}

function replaceTag(xml: string, tag: string, value: string): string {
  const re = new RegExp(`(<cbc:${tag}[^>]*>)([\\s\\S]*?)(</cbc:${tag}>)`, 'i');
  if (!re.test(xml)) {
    return xml;
  }
  return xml.replace(re, `$1${escapeXml(value)}$3`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stampSeller(xml: string, taxPayer: TaxPayer): string {
  let out = xml;

  // PartyTaxScheme CompanyID (VAT)
  out = out.replace(
    /(<cac:PartyTaxScheme>\s*<cbc:CompanyID>)([^<]*)(<\/cbc:CompanyID>)/i,
    `$1${escapeXml(taxPayer.vatNumber)}$3`,
  );

  // RegistrationName
  out = out.replace(
    /(<cac:PartyLegalEntity>\s*<cbc:RegistrationName>)([^<]*)(<\/cbc:RegistrationName>)/i,
    `$1${escapeXml(taxPayer.legalName)}$3`,
  );

  if (taxPayer.sellerIdValue) {
    out = out.replace(
      /(<cac:PartyIdentification>\s*<cbc:ID[^>]*>)([^<]*)(<\/cbc:ID>)/i,
      `$1${escapeXml(taxPayer.sellerIdValue)}$3`,
    );
  }

  if (taxPayer.streetName) {
    out = out.replace(
      /(<cbc:StreetName>)([^<]*)(<\/cbc:StreetName>)/i,
      `$1${escapeXml(taxPayer.streetName)}$3`,
    );
  }
  if (taxPayer.buildingNumber) {
    out = out.replace(
      /(<cbc:BuildingNumber>)([^<]*)(<\/cbc:BuildingNumber>)/i,
      `$1${escapeXml(taxPayer.buildingNumber)}$3`,
    );
  }
  if (taxPayer.district) {
    out = out.replace(
      /(<cbc:CitySubdivisionName>)([^<]*)(<\/cbc:CitySubdivisionName>)/i,
      `$1${escapeXml(taxPayer.district)}$3`,
    );
  }
  if (taxPayer.city) {
    out = out.replace(
      /(<cbc:CityName>)([^<]*)(<\/cbc:CityName>)/i,
      `$1${escapeXml(taxPayer.city)}$3`,
    );
  }
  if (taxPayer.postalZone) {
    out = out.replace(
      /(<cbc:PostalZone>)([^<]*)(<\/cbc:PostalZone>)/i,
      `$1${escapeXml(taxPayer.postalZone)}$3`,
    );
  }

  return out;
}

function stampIcvPih(xml: string, icv: string, pih: string): string {
  let out = xml;
  out = out.replace(
    /(<cac:AdditionalDocumentReference>\s*<cbc:ID>ICV<\/cbc:ID>\s*<cbc:UUID>)([^<]*)(<\/cbc:UUID>)/i,
    `$1${escapeXml(icv)}$3`,
  );
  // PIH hash lives under AdditionalDocumentReference ID=PIH → EmbeddedDocumentBinaryObject
  out = out.replace(
    /(<cac:AdditionalDocumentReference>\s*<cbc:ID>PIH<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>)([^<]*)(<\/cbc:EmbeddedDocumentBinaryObject>)/i,
    `$1${escapeXml(pih)}$3`,
  );
  return out;
}

export function listSampleKeys(
  invoiceType: TaxPayerInvoiceType,
): Array<keyof typeof SAMPLE_FILES> {
  const standard: Array<keyof typeof SAMPLE_FILES> = [
    'standard_invoice',
    'standard_credit',
    'standard_debit',
  ];
  const simplified: Array<keyof typeof SAMPLE_FILES> = [
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
  key: keyof typeof SAMPLE_FILES,
  taxPayer: TaxPayer,
  icv: string,
  pih: string,
): StampedSample {
  const raw = loadSample(SAMPLE_FILES[key]);
  let xml = stripSignedBits(raw);
  const uuid = randomUUID();
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19);

  xml = stampSeller(xml, taxPayer);
  xml = replaceTag(xml, 'UUID', uuid);
  xml = replaceTag(xml, 'IssueDate', date);
  xml = replaceTag(xml, 'IssueTime', time);
  xml = stampIcvPih(xml, icv, pih);

  return { key, xml, uuid };
}

export function complianceTotal(invoiceType: TaxPayerInvoiceType): number {
  return listSampleKeys(invoiceType).length;
}
