export type TaxPayerStatus = "draft" | "onboarded" | "suspended";

export type InvoiceType = "both" | "standard" | "simplified";

export type TaxPayer = {
  id: number;
  vendorId: number;
  vatNumber: string;
  legalName: string;
  organizationUnitName: string;
  locationAddress: string;
  industryBusinessCategory: string;
  invoiceType: InvoiceType;
  status: TaxPayerStatus;
};

export type TaxPayerStatusFilter = "all" | TaxPayerStatus;

export const taxPayerStatusOptions: TaxPayerStatusFilter[] = [
  "all",
  "draft",
  "onboarded",
  "suspended",
];

export const invoiceTypeOptions: InvoiceType[] = [
  "both",
  "standard",
  "simplified",
];
