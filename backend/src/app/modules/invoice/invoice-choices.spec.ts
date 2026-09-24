import { InvoiceDocumentType } from 'src/core/enums/invoice-document-type';
import { InvoiceTypeCode } from 'src/core/enums/invoice-type-code';
import { ChargeReason } from 'src/core/enums/allowance-charge-reason';
import { BuyerId } from 'src/core/enums/party-id-scheme';
import { PaymentMeans } from 'src/core/enums/payment-means-code';
import { TaxCategory } from 'src/core/enums/tax-category-code';
import { InvoiceCurrency } from 'src/core/enums/invoice-currency';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import {
  documentTypeToCode,
  invoiceOptions,
  normalizeDocumentType,
  toZatcaInvoiceParts,
} from './invoice-choices';

describe('invoiceOptions', () => {
  const options = invoiceOptions();

  it('lists the frontend choice values', () => {
    expect(options.subtype.map((item) => item.value)).toEqual([
      InvoiceSubtype.STANDARD,
      InvoiceSubtype.SIMPLIFIED,
    ]);
    expect(options.type.map((item) => item.value)).toEqual([
      InvoiceDocumentType.INVOICE,
      InvoiceDocumentType.CREDIT,
      InvoiceDocumentType.DEBIT,
      InvoiceDocumentType.RETURN,
    ]);
    expect(options.currency.map((item) => item.value)).toEqual([
      InvoiceCurrency.SAR,
    ]);
    expect(options.paymentMeansCode.map((item) => item.value)).toContain(
      PaymentMeans.BANK_CARD,
    );
    expect(options.buyerIdScheme.map((item) => item.value)).toEqual([
      BuyerId.COMMERCIAL_REGISTRATION,
      BuyerId.MOMRA_LICENSE,
      BuyerId.MLSD_LICENSE,
      BuyerId.SAGIA_LICENSE,
      BuyerId.OTHER,
      BuyerId.NUMBER_700,
    ]);
    expect(options.taxCategory.map((item) => item.value)).toEqual([
      TaxCategory.STANDARD,
      TaxCategory.ZERO_RATED,
      TaxCategory.EXEMPT,
      TaxCategory.OUT_OF_SCOPE,
    ]);
    expect(options.allowanceChargeReasonCode.map((item) => item.value)).toContain(
      ChargeReason.LABELLING,
    );
    expect(options.paymentMeansCode.every((item) => Number.isNaN(Number(item.value)))).toBe(
      true,
    );
  });

  it('marks return as an alias of credit', () => {
    const ret = options.type.find((item) => item.value === 'return');
    expect(ret?.aliasOf).toBe('credit');
    expect(normalizeDocumentType('return')).toBe(InvoiceDocumentType.CREDIT);
    expect(documentTypeToCode('return')).toBe(InvoiceTypeCode.CREDIT);
    expect(documentTypeToCode('invoice')).toBe(InvoiceTypeCode.INVOICE);
    expect(documentTypeToCode('debit')).toBe(InvoiceTypeCode.DEBIT);
  });

  it('requires an exemption on zero, exempt, and out of scope', () => {
    const byValue = Object.fromEntries(
      options.taxCategory.map((item) => [item.value, item.exemptionRequired]),
    );
    expect(byValue).toEqual({
      standard: false,
      zero_rated: true,
      exempt: true,
      out_of_scope: true,
    });
  });

  it('maps readable choices to ZATCA codes', () => {
    const mapped = toZatcaInvoiceParts({
      paymentMeansCode: PaymentMeans.BANK_CARD,
      buyer: { idScheme: BuyerId.COMMERCIAL_REGISTRATION },
      lines: [{ taxCategory: TaxCategory.ZERO_RATED, id: '1', name: 'Book' }],
      documentCharge: {
        taxCategory: TaxCategory.STANDARD,
        reasonCode: ChargeReason.LABELLING,
        amount: 1,
      },
    });
    expect(mapped.paymentMeansCode).toBe('48');
    expect(mapped.buyer?.idScheme).toBe('CRN');
    expect(mapped.lines[0].taxCategory).toBe('Z');
    expect(mapped.documentCharge?.reasonCode).toBe('LA');
  });
});
