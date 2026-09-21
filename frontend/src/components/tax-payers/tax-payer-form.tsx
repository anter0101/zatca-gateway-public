"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { zodResolver } from "@hookform/resolvers/zod";

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
  createTaxPayerSchema,
  useCreateTaxPayer,
  type CreateTaxPayerFormData,
} from "@/hooks/tax-payers/create";
import {
  useEditTaxPayer,
  type EditTaxPayerFormData,
} from "@/hooks/tax-payers/edit";
import type { TaxPayer } from "@/types/tax-payer";
import { invoiceTypeOptions } from "@/types/tax-payer";
import { cn } from "@/utils/css-classes-merge";

type TaxPayerFormProps = {
  mode: "create" | "edit";
  vendorId: number;
  payer?: TaxPayer;
  onClose?: () => void;
};

type FormData = CreateTaxPayerFormData | EditTaxPayerFormData;

const defaultValues: FormData = {
  vatNumber: "",
  legalName: "",
  organizationUnitName: "",
  locationAddress: "",
  industryBusinessCategory: "",
  invoiceType: "both",
  status: "draft",
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
      toast.error(
        t(
          mode === "create"
            ? "actions.error-creating"
            : "actions.error-editing",
        ),
      );
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
        status: payer.status,
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

          {mode === "edit" && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "draft"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("select-status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{t("status-draft")}</SelectItem>
                      <SelectItem value="onboarded">
                        {t("status-onboarded")}
                      </SelectItem>
                      <SelectItem value="suspended">
                        {t("status-suspended")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
