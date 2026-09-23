"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CreateTaxPayerFormData,
  createTaxPayerSchema,
  useCreateTaxPayer,
} from "@/hooks/tax-payers/create";
import {
  type EditTaxPayerFormData,
  useEditTaxPayer,
} from "@/hooks/tax-payers/edit";
import type { TaxPayer } from "@/types/tax-payer";
import {
  invoiceTypeOptions,
  type SellerIdScheme,
  sellerIdSchemeOptions,
} from "@/types/tax-payer";
import { cn } from "@/utils/css-classes-merge";
import { zodResolver } from "@hookform/resolvers/zod";

type TaxPayerFormProps = {
  mode: "create" | "edit";
  vendorId: number;
  payer?: TaxPayer;
  onClose?: () => void;
};

type FormData = CreateTaxPayerFormData | EditTaxPayerFormData;

function resolveSellerIdScheme(
  value: string | null | undefined,
): SellerIdScheme {
  for (const scheme of sellerIdSchemeOptions) {
    if (scheme === value) {
      return scheme;
    }
  }
  return "CRN";
}

const defaultValues: FormData = {
  vatNumber: "",
  legalName: "",
  organizationUnitName: "",
  locationAddress: "",
  industryBusinessCategory: "",
  invoiceType: "both",
  streetName: "",
  buildingNumber: "",
  district: "",
  city: "",
  postalZone: "",
  sellerIdScheme: "CRN",
  sellerIdValue: "",
};

export default function TaxPayerForm({
  mode,
  vendorId,
  payer,
  onClose,
}: TaxPayerFormProps) {
  const t = useTranslations("tax-payers.form");
  const { createTaxPayerMutation, isCreateTaxPayerPending } =
    useCreateTaxPayer(vendorId);
  const { editTaxPayerMutation, isEditTaxPayerPending } =
    useEditTaxPayer(vendorId);

  const isLoading = isCreateTaxPayerPending || isEditTaxPayerPending;

  const form = useForm<FormData>({
    resolver: zodResolver(createTaxPayerSchema(t)),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await createTaxPayerMutation(data);
      } else {
        if (!payer) {
          toast.error(t("actions.error-missing-id"));
          return;
        }
        await editTaxPayerMutation({ id: payer.id, data });
      }
      form.reset();
      onClose?.();
    } catch {
      // Error toast is handled by the mutation onError
    }
  };

  useEffect(() => {
    if (mode === "edit" && payer) {
      form.reset({
        vatNumber: payer.vatNumber,
        legalName: payer.legalName,
        organizationUnitName: payer.organizationUnitName,
        locationAddress: payer.locationAddress,
        industryBusinessCategory: payer.industryBusinessCategory,
        invoiceType: payer.invoiceType,
        streetName: payer.streetName ?? "",
        buildingNumber: payer.buildingNumber ?? "",
        district: payer.district ?? "",
        city: payer.city ?? "",
        postalZone: payer.postalZone ?? "",
        sellerIdScheme: resolveSellerIdScheme(payer.sellerIdScheme),
        sellerIdValue: payer.sellerIdValue ?? "",
      });
    } else if (mode === "create") {
      form.reset(defaultValues);
    }
  }, [mode, form, payer]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "border-border bg-background flex w-full flex-col gap-5 rounded-2xl border p-6",
        )}
      >
        <header className="space-y-1 text-center">
          <h1 className="text-foreground text-xl font-semibold">
            {mode === "create" ? t("create-title") : t("edit-title")}
          </h1>
        </header>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          {mode === "edit" && payer && (
            <div className="bg-muted/40 grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {t("status")}
                </p>
                <p className="text-sm font-medium">
                  {t(`status-${payer.status}`)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {t("country")}
                </p>
                <p className="text-sm font-medium">{payer.country || "SA"}</p>
              </div>
              {payer.zatcaEnvironment ? (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    {t("zatca-environment")}
                  </p>
                  <p className="text-sm font-medium">
                    {t(`zatca-environment-options.${payer.zatcaEnvironment}`)}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("legal-name")}</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vat-number")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={t("vat-placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organizationUnitName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("organization-unit")}</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("location-address")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={t("location-placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industryBusinessCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("industry")}</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("invoice-type")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("select-invoice-type")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {invoiceTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`invoice-type-options.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-border space-y-4 border-t pt-4">
            <h2 className="text-foreground text-sm font-semibold">
              {t("seller-address-section")}
            </h2>

            <FormField
              control={form.control}
              name="streetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("street-name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buildingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("building-number")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("district")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("city")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("postal-zone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sellerIdScheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("seller-id-scheme")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "CRN"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("select-seller-id-scheme")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sellerIdSchemeOptions.map((scheme) => (
                        <SelectItem key={scheme} value={scheme}>
                          {t(`seller-id-scheme-options.${scheme}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sellerIdValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("seller-id-value")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onClose?.();
            }}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {mode === "create" ? t("create-title") : t("edit-title")}
          </Button>
        </footer>
      </form>
    </Form>
  );
}
