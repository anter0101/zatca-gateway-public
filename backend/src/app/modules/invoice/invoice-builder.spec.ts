import { join } from 'path';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { InvoiceTypeCode } from 'src/core/enums/invoice-type-code';
import { TaxCategoryCode } from 'src/core/enums/tax-category-code';
import { buildInvoiceXml } from './invoice-builder';

const TEMPLATES = join(__dirname, '../../../../assets/zatca-templates');

function seller(): TaxPayer {
  return {
    vatNumber: '399999999900003',
    legalName: 'Test Seller',
    sellerIdScheme: 'CRN',
    sellerIdValue: '1010010000',
    streetName: 'Prince Sultan',
    buildingNumber: '2322',
    district: 'Al-Murabba',
    city: 'Riyadh',
    postalZone: '23333',
    country: 'SA',
  } as TaxPayer;
}

describe('buildInvoiceXml', () => {
  const prev = process.env.ZATCA_TEMPLATES_DIR;

  beforeAll(() => {
    process.env.ZATCA_TEMPLATES_DIR = TEMPLATES;
  });

  afterAll(() => {
    if (prev === undefined) {
      delete process.env.ZATCA_TEMPLATES_DIR;
    } else {
      process.env.ZATCA_TEMPLATES_DIR = prev;
    }
  });

  it('stamps ICV, a document charge, and a zero-rated line', () => {
    const xml = buildInvoiceXml({
      documentNumber: 'INV-1',
      uuid: '8d487816-70b8-4ade-a618-9d620b73814a',
      issueDate: '2026-09-19',
      issueTime: '18:30:00',
      subtype: InvoiceSubtype.STANDARD,
      typeCode: InvoiceTypeCode.INVOICE,
      ksa2: '0100000',
      icv: '42',
      pih: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
      currency: 'SAR',
      paymentMeansCode: '10',
      seller: seller(),
      buyer: { name: 'Buyer Co', vatNumber: '399999999800003' },
      documentDiscount: {
        amount: 10,
        reason: 'discount',
        taxCategory: TaxCategoryCode.STANDARD,
        taxPercent: 15,
      },
      documentCharge: {
        amount: 60,
        reason: 'Legalisation fee',
        reasonCode: 'LF',
        taxCategory: TaxCategoryCode.STANDARD,
        taxPercent: 15,
      },
      lines: [
        {
          id: '1',
          name: 'Book',
          quantity: 2,
          unitPrice: 100,
          discountAmount: 5,
          taxCategory: TaxCategoryCode.ZERO,
          taxPercent: 0,
          exemptionCode: 'VATEX-SA-35',
          exemptionReason: 'Medicines and medical equipment',
        },
      ],
    });

    expect(xml).toContain('<cbc:ID>INV-1</cbc:ID>');
    expect(xml).toContain('<cbc:UUID>42</cbc:UUID>');
    expect(xml).toContain('<cbc:CompanyID>399999999900003</cbc:CompanyID>');
    expect(xml).toContain('<cbc:ChargeIndicator>true</cbc:ChargeIndicator>');
    expect(xml).toContain('<cbc:AllowanceChargeReasonCode>LF</cbc:AllowanceChargeReasonCode>');
    expect(xml).toContain('<cbc:ChargeIndicator>false</cbc:ChargeIndicator>');
    expect(xml).toContain('<cbc:ID>Z</cbc:ID>');
    expect(xml).toContain('VATEX-SA-35');
    expect(xml).toContain('name="0100000"');
    expect(xml).not.toContain('<cbc:ID>QR</cbc:ID>');
  });
});
