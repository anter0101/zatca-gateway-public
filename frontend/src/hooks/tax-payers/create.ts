import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { z } from "zod";

import { useCreate } from "@/hooks/base/create";
import type { IApiResError } from "@/types/api-res-error";
import type { TaxPayer } from "@/types/tax-payer";
import { getApiErrorMessage } from "@/utils/api-error";

import { taxPayersQueryKey } from "./get-all";

export function createTaxPayerSchema(t: (key: string) => string) {
  return z.object({
    vatNumber: z.string().refine(
      (value) => /^3\d{13}3$/.test(value) && value[10] === "0",
      { message: t("validation.vat-invalid") },
    ),
    legalName: z.string().min(1, t("validation.legal-name-required")),
    organizationUnitName: z
      .string()
      .min(1, t("validation.organization-unit-required")),
    locationAddress: z
      .string()
      .regex(/^[A-Z]{4}\d{4}$/, t("validation.location-address-invalid")),
    industryBusinessCategory: z
      .string()
      .min(1, t("validation.industry-required")),
    invoiceType: z.enum(["both", "standard", "simplified"], {
      message: t("validation.invoice-type-required"),
    }),
    streetName: z.string().optional(),
    buildingNumber: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    postalZone: z.string().optional(),
    sellerIdScheme: z
      .enum(["CRN", "MOM", "MLS", "SAG", "OTH", "700"])
      .optional(),
    sellerIdValue: z.string().optional(),
  });
}

export type CreateTaxPayerFormData = z.infer<
  ReturnType<typeof createTaxPayerSchema>
>;

export function useCreateTaxPayer(vendorId: number) {
  const t = useTranslations("common");

  const {
    mutateAsync: createTaxPayerMutation,
    isPending: isCreateTaxPayerPending,
  } = useCreate<CreateTaxPayerFormData, TaxPayer, AxiosError<IApiResError>>({
    endPoint: `/api/vendors/${vendorId}/tax-payers`,
    queryKey: [...taxPayersQueryKey(vendorId)],
    onSuccess: () => {
      toast.success(t("message.on-success"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t));
    },
  });

  return { createTaxPayerMutation, isCreateTaxPayerPending };
}
