import { readFileSync } from 'fs';
import { join } from 'path';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import {
  assertIcvPihPresent,
  listSampleKeys,
  stampSample,
  stripSignedBits,
} from './sample-stamper';

const SAMPLES_DIR = join(__dirname, '../../../../assets/zatca-samples');
const TEMPLATES_DIR = join(__dirname, '../../../../assets/zatca-templates');

function mockTaxPayer(overrides: Partial<TaxPayer> = {}): TaxPayer {
  return {
    vatNumber: '399999999900003',
    legalName: 'Test Seller Co',
    sellerIdScheme: 'CRN',
    sellerIdValue: '1010010000',
    streetName: 'Test Street',
    buildingNumber: '1234',
    district: 'District',
    city: 'Riyadh',
    postalZone: '12345',
    invoiceType: TaxPayerInvoiceType.BOTH,
    ...overrides,
  } as TaxPayer;
}

describe('stripSignedBits', () => {
  it('removes QR without deleting ICV or PIH', () => {
    const raw = readFileSync(
      join(SAMPLES_DIR, 'Simplified_Invoice.xml'),
      'utf8',
    );
    expect(raw).toContain('<cbc:ID>ICV</cbc:ID>');
    expect(raw).toContain('<cbc:ID>PIH</cbc:ID>');
    expect(raw).toContain('<cbc:ID>QR</cbc:ID>');

    const stripped = stripSignedBits(raw);
    expect(stripped).toContain('<cbc:ID>ICV</cbc:ID>');
    expect(stripped).toContain('<cbc:ID>PIH</cbc:ID>');
    expect(stripped).not.toContain('<cbc:ID>QR</cbc:ID>');
    expect(stripped).not.toContain('UBLExtensions');
    expect(stripped).not.toMatch(/<cac:Signature[\s>]/);
    assertIcvPihPresent(stripped);
  });
});

describe('stampSample', () => {
  const prev = process.env.ZATCA_TEMPLATES_DIR;

  beforeAll(() => {
    process.env.ZATCA_TEMPLATES_DIR = TEMPLATES_DIR;
  });

  afterAll(() => {
    if (prev === undefined) {
      delete process.env.ZATCA_TEMPLATES_DIR;
    } else {
      process.env.ZATCA_TEMPLATES_DIR = prev;
    }
  });

  const keys = listSampleKeys(TaxPayerInvoiceType.BOTH);

  it('lists all six sample keys for BOTH', () => {
    expect(keys).toHaveLength(6);
  });

  it.each(keys)(
    'fills %s with seller VAT, ICV, and PIH',
    (key) => {
      const tp = mockTaxPayer({ vatNumber: '301121971500003' });
      const pih =
        'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
      const stamped = stampSample(key, tp, '42', pih);

      expect(stamped.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(stamped.xml).toContain(
        '<cbc:CompanyID>301121971500003</cbc:CompanyID>',
      );
      expect(stamped.xml).toContain('<cbc:RegistrationName>Test Seller Co</cbc:RegistrationName>');
      expect(stamped.xml).toMatch(
        /<cbc:ID>\s*ICV\s*<\/cbc:ID>\s*<cbc:UUID>42<\/cbc:UUID>/i,
      );
      expect(stamped.xml).toContain(pih);
      expect(stamped.xml).toContain('<cbc:ID>GW-42</cbc:ID>');
      assertIcvPihPresent(stamped.xml);
      expect(stamped.xml).not.toContain('<cbc:ID>QR</cbc:ID>');
    },
  );
});
