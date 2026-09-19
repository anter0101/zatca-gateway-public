import type { InvoiceType, TaxPayer, TaxPayerStatus } from "@/types/tax-payer";

let nextId = 21;

const seed: TaxPayer[] = [
  {
    id: 1,
    vendorId: 1,
    vatNumber: "300000000000003",
    legalName: "Al Noor Trading Co",
    organizationUnitName: "Riyadh Branch",
    locationAddress: "RRRD2929",
    industryBusinessCategory: "Retail",
    invoiceType: "both",
    status: "onboarded",
  },
  {
    id: 2,
    vendorId: 1,
    vatNumber: "300000000001003",
    legalName: "Desert Foods LLC",
    organizationUnitName: "Jeddah Branch",
    locationAddress: "JEDD1100",
    industryBusinessCategory: "Food & Beverage",
    invoiceType: "simplified",
    status: "draft",
  },
  {
    id: 3,
    vendorId: 1,
    vatNumber: "300000000002003",
    legalName: "Oasis Electronics",
    organizationUnitName: "Dammam Branch",
    locationAddress: "DMMD3344",
    industryBusinessCategory: "Electronics",
    invoiceType: "standard",
    status: "onboarded",
  },
  {
    id: 4,
    vendorId: 1,
    vatNumber: "300000000003003",
    legalName: "Palm Textiles",
    organizationUnitName: "Khobar Branch",
    locationAddress: "KHBD5566",
    industryBusinessCategory: "Textiles",
    invoiceType: "both",
    status: "suspended",
  },
  {
    id: 5,
    vendorId: 1,
    vatNumber: "300000000004003",
    legalName: "Sandstorm Logistics",
    organizationUnitName: "Riyadh HQ",
    locationAddress: "RRRD7788",
    industryBusinessCategory: "Logistics",
    invoiceType: "standard",
    status: "draft",
  },
  {
    id: 6,
    vendorId: 1,
    vatNumber: "300000000005003",
    legalName: "Falcon Auto Parts",
    organizationUnitName: "Qassim Branch",
    locationAddress: "QSMD9900",
    industryBusinessCategory: "Automotive",
    invoiceType: "both",
    status: "onboarded",
  },
  {
    id: 7,
    vendorId: 2,
    vatNumber: "310000000000003",
    legalName: "Capital Markets SA",
    organizationUnitName: "Main Office",
    locationAddress: "RRRD1111",
    industryBusinessCategory: "Finance",
    invoiceType: "standard",
    status: "onboarded",
  },
  {
    id: 8,
    vendorId: 2,
    vatNumber: "310000000001003",
    legalName: "Green Valley Farms",
    organizationUnitName: "Al Kharj",
    locationAddress: "KHRJ2222",
    industryBusinessCategory: "Agriculture",
    invoiceType: "simplified",
    status: "draft",
  },
  {
    id: 9,
    vendorId: 2,
    vatNumber: "310000000002003",
    legalName: "Metro Pharma",
    organizationUnitName: "Riyadh Clinic",
    locationAddress: "RRRD3333",
    industryBusinessCategory: "Healthcare",
    invoiceType: "both",
    status: "onboarded",
  },
  {
    id: 10,
    vendorId: 2,
    vatNumber: "310000000003003",
    legalName: "Skyline Construction",
    organizationUnitName: "Site Office",
    locationAddress: "RRRD4444",
    industryBusinessCategory: "Construction",
    invoiceType: "standard",
    status: "suspended",
  },
  {
    id: 11,
    vendorId: 2,
    vatNumber: "310000000004003",
    legalName: "Bright Books",
    organizationUnitName: "Olaya Store",
    locationAddress: "RRRD5555",
    industryBusinessCategory: "Retail",
    invoiceType: "simplified",
    status: "draft",
  },
  {
    id: 12,
    vendorId: 4,
    vatNumber: "320000000000003",
    legalName: "Gulf Fashion House",
    organizationUnitName: "Mall Branch",
    locationAddress: "JEDD6666",
    industryBusinessCategory: "Fashion",
    invoiceType: "both",
    status: "onboarded",
  },
  {
    id: 13,
    vendorId: 4,
    vatNumber: "320000000001003",
    legalName: "Coastal Cafe Group",
    organizationUnitName: "Corniche",
    locationAddress: "JEDD7777",
    industryBusinessCategory: "Food & Beverage",
    invoiceType: "simplified",
    status: "onboarded",
  },
  {
    id: 14,
    vendorId: 4,
    vatNumber: "320000000002003",
    legalName: "Red Sea Imports",
    organizationUnitName: "Warehouse",
    locationAddress: "JEDD8888",
    industryBusinessCategory: "Wholesale",
    invoiceType: "standard",
    status: "draft",
  },
  {
    id: 15,
    vendorId: 4,
    vatNumber: "320000000003003",
    legalName: "Pearl Jewelry",
    organizationUnitName: "Flagship",
    locationAddress: "JEDD9999",
    industryBusinessCategory: "Jewelry",
    invoiceType: "both",
    status: "suspended",
  },
  {
    id: 16,
    vendorId: 5,
    vatNumber: "330000000000003",
    legalName: "Hijaz Dates Co",
    organizationUnitName: "Madinah Branch",
    locationAddress: "MDND1010",
    industryBusinessCategory: "Agriculture",
    invoiceType: "simplified",
    status: "onboarded",
  },
  {
    id: 17,
    vendorId: 5,
    vatNumber: "330000000001003",
    legalName: "Holy City Hotels",
    organizationUnitName: "Reception",
    locationAddress: "MDND2020",
    industryBusinessCategory: "Hospitality",
    invoiceType: "standard",
    status: "draft",
  },
  {
    id: 18,
    vendorId: 5,
    vatNumber: "330000000002003",
    legalName: "Pilgrim Transport",
    organizationUnitName: "Fleet HQ",
    locationAddress: "MDND3030",
    industryBusinessCategory: "Transport",
    invoiceType: "both",
    status: "onboarded",
  },
  {
    id: 19,
    vendorId: 5,
    vatNumber: "330000000003003",
    legalName: "Zamzam Retail",
    organizationUnitName: "Store 1",
    locationAddress: "MDND4040",
    industryBusinessCategory: "Retail",
    invoiceType: "simplified",
    status: "draft",
  },
  {
    id: 20,
    vendorId: 5,
    vatNumber: "330000000004003",
    legalName: "Haram Services",
    organizationUnitName: "Ops Center",
    locationAddress: "MDND5050",
    industryBusinessCategory: "Services",
    invoiceType: "standard",
    status: "suspended",
  },
];

let taxPayers: TaxPayer[] = [...seed];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export type TaxPayerInput = {
  vatNumber: string;
  legalName: string;
  organizationUnitName: string;
  locationAddress: string;
  industryBusinessCategory: string;
  invoiceType: InvoiceType;
  status?: TaxPayerStatus;
};

export async function listTaxPayers(vendorId: number): Promise<TaxPayer[]> {
  await delay();
  return taxPayers.filter((payer) => payer.vendorId === vendorId);
}

export async function createTaxPayer(
  vendorId: number,
  input: TaxPayerInput,
): Promise<TaxPayer> {
  await delay();
  const payer: TaxPayer = {
    id: nextId++,
    vendorId,
    vatNumber: input.vatNumber,
    legalName: input.legalName,
    organizationUnitName: input.organizationUnitName,
    locationAddress: input.locationAddress,
    industryBusinessCategory: input.industryBusinessCategory,
    invoiceType: input.invoiceType,
    status: input.status ?? "draft",
  };
  taxPayers = [payer, ...taxPayers];
  return payer;
}

export async function updateTaxPayer(
  id: number,
  input: TaxPayerInput,
): Promise<TaxPayer> {
  await delay();
  const index = taxPayers.findIndex((payer) => payer.id === id);
  if (index === -1) {
    throw new Error("Tax payer not found");
  }
  const updated: TaxPayer = {
    ...taxPayers[index],
    vatNumber: input.vatNumber,
    legalName: input.legalName,
    organizationUnitName: input.organizationUnitName,
    locationAddress: input.locationAddress,
    industryBusinessCategory: input.industryBusinessCategory,
    invoiceType: input.invoiceType,
    status: input.status ?? taxPayers[index].status,
  };
  taxPayers = [
    ...taxPayers.slice(0, index),
    updated,
    ...taxPayers.slice(index + 1),
  ];
  return updated;
}

export async function removeTaxPayer(id: number): Promise<void> {
  await delay();
  taxPayers = taxPayers.filter((payer) => payer.id !== id);
}
