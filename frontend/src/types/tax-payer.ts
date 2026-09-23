export type TaxPayerStatus = "draft" | "onboarded" | "suspended";

export type InvoiceType = "both" | "standard" | "simplified";

export type SellerIdScheme = "CRN" | "MOM" | "MLS" | "SAG" | "OTH" | "700";

export type ZatcaEnvironment =
  | "simulation"
  | "developer_portal"
  | "production";

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
  country: string;
  streetName?: string | null;
  buildingNumber?: string | null;
  district?: string | null;
  city?: string | null;
  postalZone?: string | null;
  sellerIdScheme?: string | null;
  sellerIdValue?: string | null;
  /** Present only if the API includes it (not always in REST mapper). */
  zatcaEnvironment?: ZatcaEnvironment | null;
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

export const sellerIdSchemeOptions: SellerIdScheme[] = [
  "CRN",
  "MOM",
  "MLS",
  "SAG",
  "OTH",
  "700",
];
