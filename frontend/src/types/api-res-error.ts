export enum ApiErrorCode {
  SlugTaken = "slug_taken",
  VatTaken = "vat_taken",
  VatInvalid = "vat_invalid",
  WaselInvalid = "wasel_invalid",
  ExpiresRequired = "expires_required",
  VendorHasTaxPayers = "vendor_has_tax_payers",
  CsrRequired = "csr_required",
  OnboardRunning = "onboard_running",
}

export type ApiErrorBody = {
  type: string;
  code: string;
  message: string;
  zatca_code: string | null;
};

export type IApiResError = {
  error: ApiErrorBody;
};
