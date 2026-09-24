/** UN/ECE 4461 codes written into the invoice XML. */
export enum PaymentMeansCode {
  CASH = '10',
  CREDIT_TRANSFER = '30',
  BANK_ACCOUNT = '42',
  BANK_CARD = '48',
  INSTRUMENT_NOT_DEFINED = '1',
}

/** Values the invoice API accepts. Mapped to UN/ECE codes when the XML is built. */
export enum PaymentMeans {
  CASH = 'cash',
  CREDIT_TRANSFER = 'credit_transfer',
  BANK_ACCOUNT = 'bank_account',
  BANK_CARD = 'bank_card',
  NOT_DEFINED = 'not_defined',
}

export const PAYMENT_MEANS_CODE: Record<PaymentMeans, PaymentMeansCode> = {
  [PaymentMeans.CASH]: PaymentMeansCode.CASH,
  [PaymentMeans.CREDIT_TRANSFER]: PaymentMeansCode.CREDIT_TRANSFER,
  [PaymentMeans.BANK_ACCOUNT]: PaymentMeansCode.BANK_ACCOUNT,
  [PaymentMeans.BANK_CARD]: PaymentMeansCode.BANK_CARD,
  [PaymentMeans.NOT_DEFINED]: PaymentMeansCode.INSTRUMENT_NOT_DEFINED,
};
