/** VAT category codes written into the invoice XML. */
export enum TaxCategoryCode {
  STANDARD = 'S',
  ZERO = 'Z',
  EXEMPT = 'E',
  OUT_OF_SCOPE = 'O',
}

/** Values the invoice API accepts for a line, discount, or charge. */
export enum TaxCategory {
  STANDARD = 'standard',
  ZERO_RATED = 'zero_rated',
  EXEMPT = 'exempt',
  OUT_OF_SCOPE = 'out_of_scope',
}

export const TAX_CATEGORY_CODE: Record<TaxCategory, TaxCategoryCode> = {
  [TaxCategory.STANDARD]: TaxCategoryCode.STANDARD,
  [TaxCategory.ZERO_RATED]: TaxCategoryCode.ZERO,
  [TaxCategory.EXEMPT]: TaxCategoryCode.EXEMPT,
  [TaxCategory.OUT_OF_SCOPE]: TaxCategoryCode.OUT_OF_SCOPE,
};
