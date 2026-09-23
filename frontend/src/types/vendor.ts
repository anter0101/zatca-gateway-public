export type VendorStatus = "active" | "suspended";

export type Vendor = {
  id: number;
  name: string;
  slug: string;
  status: VendorStatus;
};

export type VendorStatusFilter = "all" | VendorStatus;

export const vendorStatusOptions: VendorStatusFilter[] = [
  "all",
  "active",
  "suspended",
];

export type CreateVendorInput = {
  name: string;
  slug?: string;
  status?: VendorStatus;
};

export type UpdateVendorInput = {
  name?: string;
  slug?: string;
  status?: VendorStatus;
};
