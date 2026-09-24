import {
  CHARGE_REASON_CODE,
  ChargeReason,
} from 'src/core/enums/allowance-charge-reason';
import { InvoiceCurrency } from 'src/core/enums/invoice-currency';
import { InvoiceDocumentType } from 'src/core/enums/invoice-document-type';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { InvoiceTypeCode } from 'src/core/enums/invoice-type-code';
import { BUYER_ID_SCHEME, BuyerId } from 'src/core/enums/party-id-scheme';
import {
  PAYMENT_MEANS_CODE,
  PaymentMeans,
} from 'src/core/enums/payment-means-code';
import {
  TAX_CATEGORY_CODE,
  TaxCategory,
  TaxCategoryCode,
} from 'src/core/enums/tax-category-code';

export type InvoiceChoice = {
  value: string;
  label: string;
  aliasOf?: string;
  exemptionRequired?: boolean;
  defaultPercent?: number;
};

export type InvoiceOptions = {
  subtype: InvoiceChoice[];
  type: InvoiceChoice[];
  currency: InvoiceChoice[];
  paymentMeansCode: InvoiceChoice[];
  buyerIdScheme: InvoiceChoice[];
  taxCategory: InvoiceChoice[];
  allowanceChargeReasonCode: InvoiceChoice[];
};

export function invoiceOptions(): InvoiceOptions {
  return {
    subtype: [
      { value: InvoiceSubtype.STANDARD, label: 'Standard (clearance)' },
      { value: InvoiceSubtype.SIMPLIFIED, label: 'Simplified (reporting)' },
    ],
    type: [
      { value: InvoiceDocumentType.INVOICE, label: 'Invoice' },
      { value: InvoiceDocumentType.CREDIT, label: 'Credit note' },
      { value: InvoiceDocumentType.DEBIT, label: 'Debit note' },
      {
        value: InvoiceDocumentType.RETURN,
        label: 'Return',
        aliasOf: InvoiceDocumentType.CREDIT,
      },
    ],
    currency: [{ value: InvoiceCurrency.SAR, label: 'SAR' }],
    paymentMeansCode: [
      { value: PaymentMeans.CASH, label: 'Cash' },
      { value: PaymentMeans.CREDIT_TRANSFER, label: 'Credit transfer' },
      { value: PaymentMeans.BANK_ACCOUNT, label: 'Payment to bank account' },
      { value: PaymentMeans.BANK_CARD, label: 'Bank card' },
      { value: PaymentMeans.NOT_DEFINED, label: 'Instrument not defined' },
    ],
    buyerIdScheme: [
      { value: BuyerId.COMMERCIAL_REGISTRATION, label: 'Commercial registration' },
      { value: BuyerId.MOMRA_LICENSE, label: 'Momra license' },
      { value: BuyerId.MLSD_LICENSE, label: 'MLSD license' },
      { value: BuyerId.SAGIA_LICENSE, label: 'Sagia license' },
      { value: BuyerId.OTHER, label: 'Other' },
      { value: BuyerId.NUMBER_700, label: '700 number' },
    ],
    taxCategory: [
      {
        value: TaxCategory.STANDARD,
        label: 'Standard rated',
        defaultPercent: 15,
        exemptionRequired: false,
      },
      {
        value: TaxCategory.ZERO_RATED,
        label: 'Zero rated',
        defaultPercent: 0,
        exemptionRequired: true,
      },
      {
        value: TaxCategory.EXEMPT,
        label: 'Exempt',
        defaultPercent: 0,
        exemptionRequired: true,
      },
      {
        value: TaxCategory.OUT_OF_SCOPE,
        label: 'Out of scope',
        defaultPercent: 0,
        exemptionRequired: true,
      },
    ],
    allowanceChargeReasonCode: [
      { value: ChargeReason.DISCOUNT, label: 'Discount' },
      { value: ChargeReason.ADVERTISING, label: 'Advertising' },
      { value: ChargeReason.ADDITIONAL_PACKAGING, label: 'Additional packaging' },
      { value: ChargeReason.OTHER_SERVICES, label: 'Other services' },
      { value: ChargeReason.PICKUP, label: 'Pickup' },
      { value: ChargeReason.FREIGHT, label: 'Freight' },
      { value: ChargeReason.FINANCING, label: 'Financing' },
      { value: ChargeReason.LABELLING, label: 'Labelling' },
      { value: ChargeReason.LEGALISATION_FEE, label: 'Legalisation fee' },
      { value: ChargeReason.PROMOTIONAL, label: 'Promotional' },
    ],
  };
}

export function normalizeDocumentType(
  type: InvoiceDocumentType | string,
): InvoiceDocumentType.INVOICE | InvoiceDocumentType.CREDIT | InvoiceDocumentType.DEBIT {
  if (type === InvoiceDocumentType.RETURN || type === InvoiceDocumentType.CREDIT) {
    return InvoiceDocumentType.CREDIT;
  }
  if (type === InvoiceDocumentType.DEBIT) {
    return InvoiceDocumentType.DEBIT;
  }
  return InvoiceDocumentType.INVOICE;
}

export function documentTypeToCode(
  type: InvoiceDocumentType | string,
): InvoiceTypeCode {
  const normalized = normalizeDocumentType(type);
  if (normalized === InvoiceDocumentType.CREDIT) {
    return InvoiceTypeCode.CREDIT;
  }
  if (normalized === InvoiceDocumentType.DEBIT) {
    return InvoiceTypeCode.DEBIT;
  }
  return InvoiceTypeCode.INVOICE;
}

export function ksa2Name(subtype: InvoiceSubtype): string {
  return subtype === InvoiceSubtype.SIMPLIFIED ? '0200000' : '0100000';
}

type Taxed = { taxCategory: TaxCategory };

/** Map the words the client sent into the codes written on the invoice. */
export function toZatcaInvoiceParts<
  TLine extends Taxed,
  TDiscount extends Taxed,
  TCharge extends Taxed & { reasonCode: ChargeReason },
  TBuyer extends { idScheme?: BuyerId },
>(input: {
  paymentMeansCode: PaymentMeans;
  buyer?: TBuyer | null;
  lines: TLine[];
  documentDiscount?: TDiscount | null;
  documentCharge?: TCharge | null;
}): {
  paymentMeansCode: string;
  buyer?: TBuyer & { idScheme?: string };
  lines: Array<Omit<TLine, 'taxCategory'> & { taxCategory: TaxCategoryCode }>;
  documentDiscount?: Omit<TDiscount, 'taxCategory'> & { taxCategory: TaxCategoryCode };
  documentCharge?: Omit<TCharge, 'taxCategory' | 'reasonCode'> & {
    taxCategory: TaxCategoryCode;
    reasonCode: string;
  };
} {
  const buyer = input.buyer
    ? {
        ...input.buyer,
        idScheme: input.buyer.idScheme
          ? BUYER_ID_SCHEME[input.buyer.idScheme]
          : input.buyer.idScheme,
      }
    : undefined;
  const mapCategory = <T extends Taxed>(row: T) => ({
    ...(row as object),
    taxCategory: TAX_CATEGORY_CODE[row.taxCategory],
  });
  return {
    paymentMeansCode: PAYMENT_MEANS_CODE[input.paymentMeansCode],
    buyer,
    lines: input.lines.map(
      (line) => mapCategory(line) as Omit<TLine, 'taxCategory'> & { taxCategory: TaxCategoryCode },
    ),
    documentDiscount: input.documentDiscount
      ? (mapCategory(input.documentDiscount) as Omit<TDiscount, 'taxCategory'> & {
          taxCategory: TaxCategoryCode;
        })
      : undefined,
    documentCharge: input.documentCharge
      ? ({
          ...(input.documentCharge as object),
          taxCategory: TAX_CATEGORY_CODE[input.documentCharge.taxCategory],
          reasonCode: CHARGE_REASON_CODE[input.documentCharge.reasonCode],
        } as Omit<TCharge, 'taxCategory' | 'reasonCode'> & {
          taxCategory: TaxCategoryCode;
          reasonCode: string;
        })
      : undefined,
  };
}
