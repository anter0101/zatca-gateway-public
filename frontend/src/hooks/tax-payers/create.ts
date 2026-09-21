import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTaxPayer } from "@/mockup-data/tax-payers";
import type { InvoiceType, TaxPayerStatus } from "@/types/tax-payer";

import { taxPayersQueryKey } from "./get-all";

export function createTaxPayerSchema(t: (key: string) => string) {
  return z.object({
    vatNumber: z
      .string()
      .regex(/^3\d{13}3$/, t("validation.vat-invalid")),
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
    status: z.enum(["draft", "onboarded", "suspended"]).optional(),
  });
}

export type CreateTaxPayerFormData = z.infer<
  ReturnType<typeof createTaxPayerSchema>
>;

export function useCreateTaxPayer(vendorId: number) {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: {
      vatNumber: string;
      legalName: string;
      organizationUnitName: string;
      locationAddress: string;
      industryBusinessCategory: string;
      invoiceType: InvoiceType;
      status?: TaxPayerStatus;
    }) => createTaxPayer(vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxPayersQueryKey(vendorId) });
      toast.success(t("on-success"));
    },
    onError: () => {
      toast.error(t("on-error"));
    },
  });

  return {
    createTaxPayerMutation: mutation.mutateAsync,
    isCreateTaxPayerPending: mutation.isPending,
  };
}
