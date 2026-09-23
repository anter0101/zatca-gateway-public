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
  type CreateVendorFormData,
  createVendorSchema,
  useCreateVendor,
} from "@/hooks/vendors/create";
import {
  type EditVendorFormData,
  useEditVendor,
} from "@/hooks/vendors/edit";
import type { Vendor } from "@/types/vendor";
import { cn } from "@/utils/css-classes-merge";
import { zodResolver } from "@hookform/resolvers/zod";

type VendorFormProps = {
  mode: "create" | "edit";
  vendor?: Vendor;
  onClose?: () => void;
};

type FormData = CreateVendorFormData | EditVendorFormData;

const defaultValues: FormData = {
  name: "",
  slug: "",
  status: "active",
};

export default function VendorForm({
  mode,
  vendor,
  onClose,
}: VendorFormProps) {
  const t = useTranslations("vendors.form");
  const { createVendorMutation, isCreateVendorPending } = useCreateVendor();
  const { editVendorMutation, isEditVendorPending } = useEditVendor();

  const isLoading = isCreateVendorPending || isEditVendorPending;

  const form = useForm<FormData>({
    resolver: zodResolver(createVendorSchema(t)),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await createVendorMutation(data);
      } else {
        if (!vendor) {
          toast.error(t("actions.error-missing-id"));
          return;
        }
        await editVendorMutation({ id: vendor.id, data });
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
    if (mode === "edit" && vendor) {
      form.reset({
        name: vendor.name,
        slug: vendor.slug,
        status: vendor.status,
      });
    } else if (mode === "create") {
      form.reset(defaultValues);
    }
  }, [mode, form, vendor]);

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

        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("slug")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={t("slug-placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("status")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("select-status")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">{t("status-active")}</SelectItem>
                    <SelectItem value="suspended">
                      {t("status-suspended")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
