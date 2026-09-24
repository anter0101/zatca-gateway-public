import { readFileSync } from 'fs';
import { join } from 'path';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { InvoiceTypeCode } from 'src/core/enums/invoice-type-code';
import { TaxCategoryCode } from 'src/core/enums/tax-category-code';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';

export type MoneyLine = {
  id: string;
  name: string;
  quantity: number;
  unitCode?: string;
  unitPrice: number;
  discountAmount?: number;
  taxCategory: TaxCategoryCode | string;
  taxPercent: number;
  exemptionCode?: string | null;
  exemptionReason?: string | null;
};

export type DocumentAllowance = {
  amount: number;
  reason?: string | null;
  reasonCode?: string | null;
  taxCategory: TaxCategoryCode | string;
  taxPercent: number;
  exemptionCode?: string | null;
  exemptionReason?: string | null;
};

export type InvoiceBuyer = {
  name: string;
  vatNumber?: string | null;
  idScheme?: string | null;
  idValue?: string | null;
  streetName?: string | null;
  buildingNumber?: string | null;
  district?: string | null;
  city?: string | null;
  postalZone?: string | null;
  country?: string | null;
};

export type BuildInvoiceInput = {
  documentNumber: string;
  uuid: string;
  issueDate: string;
  issueTime: string;
  subtype: InvoiceSubtype;
  typeCode: InvoiceTypeCode;
  ksa2: string;
  icv: string;
  pih: string;
  currency: string;
  supplyDate?: string | null;
  paymentMeansCode: string;
  instructionNote?: string | null;
  originalDocumentNumber?: string | null;
  seller: TaxPayer;
  buyer?: InvoiceBuyer | null;
  documentDiscount?: DocumentAllowance | null;
  documentCharge?: DocumentAllowance | null;
  lines: MoneyLine[];
};

const TEMPLATES: Record<string, string> = {
  'standard:388': 'standard_invoice.xml',
  'standard:381': 'standard_credit.xml',
  'standard:383': 'standard_debit.xml',
  'simplified:388': 'simplified_invoice.xml',
  'simplified:381': 'simplified_credit.xml',
  'simplified:383': 'simplified_debit.xml',
};

function templatesDir(): string {
  return (
    process.env.ZATCA_TEMPLATES_DIR ||
    join(process.cwd(), 'assets', 'zatca-templates')
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function money(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function taxAmount(base: number, percent: number): number {
  return Math.round(base * percent) / 100;
}

function taxCategoryXml(
  category: string,
  percent: number,
  exemptionCode?: string | null,
  exemptionReason?: string | null,
): string {
  const exemption =
    category === TaxCategoryCode.STANDARD
      ? ''
      : `${exemptionCode ? `<cbc:TaxExemptionReasonCode>${escapeXml(exemptionCode)}</cbc:TaxExemptionReasonCode>` : ''}${exemptionReason ? `<cbc:TaxExemptionReason>${escapeXml(exemptionReason)}</cbc:TaxExemptionReason>` : ''}`;
  return `<cac:TaxCategory><cbc:ID>${escapeXml(category)}</cbc:ID><cbc:Percent>${money(percent)}</cbc:Percent>${exemption}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>`;
}

function allowanceXml(
  charge: boolean,
  amount: number,
  currency: string,
  reason: string,
  reasonCode: string | null | undefined,
  category: string,
  percent: number,
  exemptionCode?: string | null,
  exemptionReason?: string | null,
): string {
  const code = reasonCode
    ? `<cbc:AllowanceChargeReasonCode>${escapeXml(reasonCode)}</cbc:AllowanceChargeReasonCode>`
    : '';
  return `<cac:AllowanceCharge><cbc:ChargeIndicator>${charge}</cbc:ChargeIndicator>${code}<cbc:AllowanceChargeReason>${escapeXml(reason)}</cbc:AllowanceChargeReason><cbc:Amount currencyID="${currency}">${money(amount)}</cbc:Amount>${taxCategoryXml(category, percent, exemptionCode, exemptionReason)}</cac:AllowanceCharge>`;
}

function replaceBlock(
  xml: string,
  tag: string,
  next: string,
): string {
  const re = new RegExp(`<cac:${tag}>[\\s\\S]*?</cac:${tag}>`);
  if (!re.test(xml)) {
    throw new Error(`template missing ${tag}`);
  }
  return xml.replace(re, next);
}

function replaceFirst(
  xml: string,
  tag: string,
  value: string,
): string {
  const re = new RegExp(`(<cbc:${tag}[^>]*>)[\\s\\S]*?(</cbc:${tag}>)`);
  if (!re.test(xml)) {
    throw new Error(`template missing cbc:${tag}`);
  }
  return xml.replace(re, `$1${escapeXml(value)}$2`);
}

export function buildInvoiceXml(input: BuildInvoiceInput): string {
  const file = TEMPLATES[`${input.subtype}:${input.typeCode}`];
  if (!file) {
    throw new Error(`no template for ${input.subtype} ${input.typeCode}`);
  }
  let xml = readFileSync(join(templatesDir(), file), 'utf8');
  const currency = input.currency;

  xml = replaceFirst(xml, 'ID', input.documentNumber);
  xml = replaceFirst(xml, 'UUID', input.uuid);
  xml = replaceFirst(xml, 'IssueDate', input.issueDate);
  xml = replaceFirst(xml, 'IssueTime', input.issueTime);
  xml = xml.replace(
    /<cbc:InvoiceTypeCode name="[^"]*">[^<]*<\/cbc:InvoiceTypeCode>/,
    `<cbc:InvoiceTypeCode name="${escapeXml(input.ksa2)}">${escapeXml(input.typeCode)}</cbc:InvoiceTypeCode>`,
  );
  xml = xml.replace(
    /(<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*ICV\s*<\/cbc:ID>\s*<cbc:UUID>)[^<]*(<\/cbc:UUID>)/,
    `$1${escapeXml(input.icv)}$2`,
  );
  xml = xml.replace(
    /(<cac:AdditionalDocumentReference>\s*<cbc:ID>\s*PIH\s*<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>)[^<]*(<\/cbc:EmbeddedDocumentBinaryObject>)/,
    `$1${escapeXml(input.pih)}$2`,
  );

  xml = stampSeller(xml, input.seller);
  xml = replaceBlock(xml, 'AccountingCustomerParty', customerXml(input.buyer));

  if (input.supplyDate) {
    if (xml.includes('<cbc:ActualDeliveryDate>')) {
      xml = xml.replace(
        /<cbc:ActualDeliveryDate>[^<]*<\/cbc:ActualDeliveryDate>/,
        `<cbc:ActualDeliveryDate>${escapeXml(input.supplyDate)}</cbc:ActualDeliveryDate>`,
      );
    }
  }

  xml = replaceBlock(
    xml,
    'PaymentMeans',
    paymentXml(input.paymentMeansCode, input.instructionNote),
  );

  if (input.originalDocumentNumber && xml.includes('<cac:BillingReference>')) {
    xml = xml.replace(
      /(<cac:BillingReference>\s*<cac:InvoiceDocumentReference>\s*<cbc:ID>)[^<]*(<\/cbc:ID>)/,
      `$1${escapeXml(input.originalDocumentNumber)}$2`,
    );
  }

  const totals = compute(input);
  const tail =
    documentAllowances(input, currency) +
    taxTotalsXml(totals, currency) +
    monetaryXml(totals, currency) +
    input.lines.map((line) => lineXml(line, currency)).join('');
  xml = xml.replace(
    /<cac:AllowanceCharge>[\s\S]*<\/cac:InvoiceLine>/,
    tail,
  );
  return xml;
}

function stampSeller(xml: string, seller: TaxPayer): string {
  return xml.replace(
    /<cac:AccountingSupplierParty>[\s\S]*?<\/cac:AccountingSupplierParty>/,
    `<cac:AccountingSupplierParty><cac:Party>` +
      `<cac:PartyIdentification><cbc:ID schemeID="${escapeXml(seller.sellerIdScheme || 'CRN')}">${escapeXml(seller.sellerIdValue || '')}</cbc:ID></cac:PartyIdentification>` +
      `<cac:PostalAddress>` +
      `<cbc:StreetName>${escapeXml(seller.streetName || '')}</cbc:StreetName>` +
      `<cbc:BuildingNumber>${escapeXml(seller.buildingNumber || '')}</cbc:BuildingNumber>` +
      `<cbc:CitySubdivisionName>${escapeXml(seller.district || '')}</cbc:CitySubdivisionName>` +
      `<cbc:CityName>${escapeXml(seller.city || '')}</cbc:CityName>` +
      `<cbc:PostalZone>${escapeXml(seller.postalZone || '')}</cbc:PostalZone>` +
      `<cac:Country><cbc:IdentificationCode>${escapeXml(seller.country || 'SA')}</cbc:IdentificationCode></cac:Country>` +
      `</cac:PostalAddress>` +
      `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(seller.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` +
      `<cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(seller.legalName)}</cbc:RegistrationName></cac:PartyLegalEntity>` +
      `</cac:Party></cac:AccountingSupplierParty>`,
  );
}

function customerXml(buyer?: InvoiceBuyer | null): string {
  if (!buyer?.name) {
    return '<cac:AccountingCustomerParty></cac:AccountingCustomerParty>';
  }
  const id = buyer.idValue
    ? `<cac:PartyIdentification><cbc:ID schemeID="${escapeXml(buyer.idScheme || 'CRN')}">${escapeXml(buyer.idValue)}</cbc:ID></cac:PartyIdentification>`
    : '';
  const vat = buyer.vatNumber
    ? `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(buyer.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
    : '';
  return (
    `<cac:AccountingCustomerParty><cac:Party>${id}` +
    `<cac:PostalAddress>` +
    `<cbc:StreetName>${escapeXml(buyer.streetName || '')}</cbc:StreetName>` +
    `<cbc:BuildingNumber>${escapeXml(buyer.buildingNumber || '')}</cbc:BuildingNumber>` +
    `<cbc:CitySubdivisionName>${escapeXml(buyer.district || '')}</cbc:CitySubdivisionName>` +
    `<cbc:CityName>${escapeXml(buyer.city || '')}</cbc:CityName>` +
    `<cbc:PostalZone>${escapeXml(buyer.postalZone || '')}</cbc:PostalZone>` +
    `<cac:Country><cbc:IdentificationCode>${escapeXml(buyer.country || 'SA')}</cbc:IdentificationCode></cac:Country>` +
    `</cac:PostalAddress>${vat}` +
    `<cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(buyer.name)}</cbc:RegistrationName></cac:PartyLegalEntity>` +
    `</cac:Party></cac:AccountingCustomerParty>`
  );
}

function paymentXml(code: string, note?: string | null): string {
  const instruction = note
    ? `<cbc:InstructionNote>${escapeXml(note)}</cbc:InstructionNote>`
    : '';
  return `<cac:PaymentMeans><cbc:PaymentMeansCode>${escapeXml(code)}</cbc:PaymentMeansCode>${instruction}</cac:PaymentMeans>`;
}

type Totals = {
  lineExtension: number;
  discount: number;
  charge: number;
  taxExclusive: number;
  tax: number;
  taxInclusive: number;
  groups: Map<string, { category: string; percent: number; taxable: number; tax: number; exemptionCode?: string | null; exemptionReason?: string | null }>;
};

function compute(input: BuildInvoiceInput): Totals {
  const groups = new Map<string, Totals['groups'] extends Map<string, infer V> ? V : never>();
  let lineExtension = 0;
  for (const line of input.lines) {
    const net = line.quantity * line.unitPrice - (line.discountAmount || 0);
    lineExtension += net;
    addGroup(groups, line.taxCategory, line.taxPercent, net, line.exemptionCode, line.exemptionReason);
  }
  const discount = input.documentDiscount?.amount || 0;
  const charge = input.documentCharge?.amount || 0;
  if (input.documentDiscount) {
    addGroup(
      groups,
      input.documentDiscount.taxCategory,
      input.documentDiscount.taxPercent,
      -discount,
      input.documentDiscount.exemptionCode,
      input.documentDiscount.exemptionReason,
    );
  }
  if (input.documentCharge) {
    addGroup(
      groups,
      input.documentCharge.taxCategory,
      input.documentCharge.taxPercent,
      charge,
      input.documentCharge.exemptionCode,
      input.documentCharge.exemptionReason,
    );
  }
  let tax = 0;
  for (const group of groups.values()) {
    tax += group.tax;
  }
  const taxExclusive = lineExtension - discount + charge;
  return {
    lineExtension,
    discount,
    charge,
    taxExclusive,
    tax,
    taxInclusive: taxExclusive + tax,
    groups,
  };
}

function addGroup(
  groups: Totals['groups'],
  category: string,
  percent: number,
  taxable: number,
  exemptionCode?: string | null,
  exemptionReason?: string | null,
): void {
  const key = `${category}:${percent}`;
  const existing = groups.get(key);
  const tax = taxAmount(taxable, percent);
  if (!existing) {
    groups.set(key, {
      category,
      percent,
      taxable,
      tax,
      exemptionCode,
      exemptionReason,
    });
    return;
  }
  existing.taxable += taxable;
  existing.tax += tax;
}

function documentAllowances(input: BuildInvoiceInput, currency: string): string {
  const discount = input.documentDiscount;
  const charge = input.documentCharge;
  const discountXml = allowanceXml(
    false,
    discount?.amount || 0,
    currency,
    discount?.reason || 'discount',
    null,
    discount?.taxCategory || TaxCategoryCode.STANDARD,
    discount?.taxPercent ?? 15,
    discount?.exemptionCode,
    discount?.exemptionReason,
  );
  const chargeXml = charge
    ? allowanceXml(
        true,
        charge.amount,
        currency,
        charge.reason || 'charge',
        charge.reasonCode,
        charge.taxCategory,
        charge.taxPercent,
        charge.exemptionCode,
        charge.exemptionReason,
      )
    : '';
  return discountXml + chargeXml;
}

function taxTotalsXml(totals: Totals, currency: string): string {
  const subs = [...totals.groups.values()]
    .map(
      (group) =>
        `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="${currency}">${money(group.taxable)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${currency}">${money(group.tax)}</cbc:TaxAmount>${taxCategoryXml(group.category, group.percent, group.exemptionCode, group.exemptionReason)}</cac:TaxSubtotal>`,
    )
    .join('');
  const amount = `<cbc:TaxAmount currencyID="${currency}">${money(totals.tax)}</cbc:TaxAmount>`;
  return `<cac:TaxTotal>${amount}</cac:TaxTotal><cac:TaxTotal>${amount}${subs}</cac:TaxTotal>`;
}

function monetaryXml(totals: Totals, currency: string): string {
  const charge =
    totals.charge > 0
      ? `<cbc:ChargeTotalAmount currencyID="${currency}">${money(totals.charge)}</cbc:ChargeTotalAmount>`
      : '';
  return (
    `<cac:LegalMonetaryTotal>` +
    `<cbc:LineExtensionAmount currencyID="${currency}">${money(totals.lineExtension)}</cbc:LineExtensionAmount>` +
    `<cbc:TaxExclusiveAmount currencyID="${currency}">${money(totals.taxExclusive)}</cbc:TaxExclusiveAmount>` +
    `<cbc:TaxInclusiveAmount currencyID="${currency}">${money(totals.taxInclusive)}</cbc:TaxInclusiveAmount>` +
    `<cbc:AllowanceTotalAmount currencyID="${currency}">${money(totals.discount)}</cbc:AllowanceTotalAmount>` +
    charge +
    `<cbc:PrepaidAmount currencyID="${currency}">0.00</cbc:PrepaidAmount>` +
    `<cbc:PayableAmount currencyID="${currency}">${money(totals.taxInclusive)}</cbc:PayableAmount>` +
    `</cac:LegalMonetaryTotal>`
  );
}

function lineXml(line: MoneyLine, currency: string): string {
  const discount = line.discountAmount || 0;
  const net = line.quantity * line.unitPrice - discount;
  const tax = taxAmount(net, line.taxPercent);
  const lineAllowance =
    discount > 0
      ? `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator><cbc:Amount currencyID="${currency}">${money(discount)}</cbc:Amount></cac:AllowanceCharge>`
      : '';
  return (
    `<cac:InvoiceLine>` +
    `<cbc:ID>${escapeXml(line.id)}</cbc:ID>` +
    `<cbc:InvoicedQuantity unitCode="${escapeXml(line.unitCode || 'PCE')}">${line.quantity.toFixed(6)}</cbc:InvoicedQuantity>` +
    `<cbc:LineExtensionAmount currencyID="${currency}">${money(net)}</cbc:LineExtensionAmount>` +
    `<cac:TaxTotal><cbc:TaxAmount currencyID="${currency}">${money(tax)}</cbc:TaxAmount><cbc:RoundingAmount currencyID="${currency}">${money(net + tax)}</cbc:RoundingAmount></cac:TaxTotal>` +
    `<cac:Item><cbc:Name>${escapeXml(line.name)}</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>${escapeXml(line.taxCategory)}</cbc:ID><cbc:Percent>${money(line.taxPercent)}</cbc:Percent>${line.taxCategory === TaxCategoryCode.STANDARD ? '' : `${line.exemptionCode ? `<cbc:TaxExemptionReasonCode>${escapeXml(line.exemptionCode)}</cbc:TaxExemptionReasonCode>` : ''}${line.exemptionReason ? `<cbc:TaxExemptionReason>${escapeXml(line.exemptionReason)}</cbc:TaxExemptionReason>` : ''}`}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>` +
    `<cac:Price><cbc:PriceAmount currencyID="${currency}">${money(line.unitPrice)}</cbc:PriceAmount>${lineAllowance}</cac:Price>` +
    `</cac:InvoiceLine>`
  );
}
