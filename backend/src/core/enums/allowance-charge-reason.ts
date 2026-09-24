/** UN/ECE allowance/charge reason written into the invoice XML. */
export enum AllowanceChargeReasonCode {
  DISCOUNT = '95',
  ADVERTISING = 'AA',
  ADDITIONAL_PACKAGING = 'ABL',
  OTHER_SERVICES = 'ADR',
  PICKUP = 'ADT',
  FREIGHT = 'FC',
  FINANCING = 'FI',
  LABELLING = 'LA',
  LEGALISATION = 'LF',
  PROMOTIONAL = 'PAD',
}

/** Values the invoice API accepts for a document charge. */
export enum ChargeReason {
  DISCOUNT = 'discount',
  ADVERTISING = 'advertising',
  ADDITIONAL_PACKAGING = 'additional_packaging',
  OTHER_SERVICES = 'other_services',
  PICKUP = 'pickup',
  FREIGHT = 'freight',
  FINANCING = 'financing',
  LABELLING = 'labelling',
  LEGALISATION_FEE = 'legalisation_fee',
  PROMOTIONAL = 'promotional',
}

export const CHARGE_REASON_CODE: Record<ChargeReason, AllowanceChargeReasonCode> = {
  [ChargeReason.DISCOUNT]: AllowanceChargeReasonCode.DISCOUNT,
  [ChargeReason.ADVERTISING]: AllowanceChargeReasonCode.ADVERTISING,
  [ChargeReason.ADDITIONAL_PACKAGING]: AllowanceChargeReasonCode.ADDITIONAL_PACKAGING,
  [ChargeReason.OTHER_SERVICES]: AllowanceChargeReasonCode.OTHER_SERVICES,
  [ChargeReason.PICKUP]: AllowanceChargeReasonCode.PICKUP,
  [ChargeReason.FREIGHT]: AllowanceChargeReasonCode.FREIGHT,
  [ChargeReason.FINANCING]: AllowanceChargeReasonCode.FINANCING,
  [ChargeReason.LABELLING]: AllowanceChargeReasonCode.LABELLING,
  [ChargeReason.LEGALISATION_FEE]: AllowanceChargeReasonCode.LEGALISATION,
  [ChargeReason.PROMOTIONAL]: AllowanceChargeReasonCode.PROMOTIONAL,
};
