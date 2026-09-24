/** Scheme IDs written into the invoice XML. */
export enum PartyIdScheme {
  CRN = 'CRN',
  MOM = 'MOM',
  MLS = 'MLS',
  SAG = 'SAG',
  OTH = 'OTH',
  SEVEN_HUNDRED = '700',
}

/** Values the invoice API accepts for a buyer identifier. */
export enum BuyerId {
  COMMERCIAL_REGISTRATION = 'commercial_registration',
  MOMRA_LICENSE = 'momra_license',
  MLSD_LICENSE = 'mlsd_license',
  SAGIA_LICENSE = 'sagia_license',
  OTHER = 'other',
  NUMBER_700 = 'number_700',
}

export const BUYER_ID_SCHEME: Record<BuyerId, PartyIdScheme> = {
  [BuyerId.COMMERCIAL_REGISTRATION]: PartyIdScheme.CRN,
  [BuyerId.MOMRA_LICENSE]: PartyIdScheme.MOM,
  [BuyerId.MLSD_LICENSE]: PartyIdScheme.MLS,
  [BuyerId.SAGIA_LICENSE]: PartyIdScheme.SAG,
  [BuyerId.OTHER]: PartyIdScheme.OTH,
  [BuyerId.NUMBER_700]: PartyIdScheme.SEVEN_HUNDRED,
};
