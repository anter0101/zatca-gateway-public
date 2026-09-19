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
  createSystemOwnerSchema,
  useCreateSystemOwner,
  type CreateSystemOwnerFormData,
} from "@/hooks/system-owners/create";
import {
  useEditSystemOwner,
  type EditSystemOwnerFormData,
} from "@/hooks/system-owners/edit";
import type { SystemOwner } from "@/types/system-owner";
import { cn } from "@/utils/css-classes-merge";

type SystemOwnerFormProps = {
  mode: "create" | "edit";
  owner?: SystemOwner;
  onClose?: () => void;
};

type FormData = CreateSystemOwnerFormData | EditSystemOwnerFormData;

const defaultValues: FormData = {
  name: "",
  slug: "",
  status: "active",
};

export default function SystemOwnerForm({
  mode,
  owner,
  onClose,
}: SystemOwnerFormProps) {
  const t = useTranslations("system-owners.form");
  const { createSystemOwnerMutation, isCreateSystemOwnerPending } =
    useCreateSystemOwner();
  const { editSystemOwnerMutation, isEditSystemOwnerPending } =
    useEditSystemOwner();

  const isLoading = isCreateSystemOwnerPending || isEditSystemOwnerPending;

  const form = useForm<FormData>({
    resolver: zodResolver(createSystemOwnerSchema(t)),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await createSystemOwnerMutation(data);
      } else {
        if (!owner) {
          toast.error(t("actions.error-missing-id"));
          return;
        }
        await editSystemOwnerMutation({ id: owner.id, data });
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
    if (mode === "edit" && owner) {
      form.reset({
        name: owner.name,
        slug: owner.slug,
        status: owner.status,
      });
    } else if (mode === "create") {
      form.reset(defaultValues);
    }
  }, [mode, form, owner]);

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
