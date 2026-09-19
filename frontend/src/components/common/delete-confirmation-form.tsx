"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";

// Delete confirmation schema factory
const createDeleteConfirmationSchema = (t: (key: string) => string) =>
  z.object({
    confirmationText: z
      .string()
      .min(1, t("validation.confirmation-text-required"))
      .refine(
        (value) => value.toLowerCase() === "delete",
        t("validation.confirmation-text-must-be-delete"),
      ),
  });

type DeleteConfirmationFormData = z.infer<
  ReturnType<typeof createDeleteConfirmationSchema>
>;

interface DeleteConfirmationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName: string;
  itemType:
    | "category"
    | "subcategory"
    | "levelThree"
    | "user-data"
    | "role-data";
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmationForm({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemType,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationFormProps) {
  const t = useTranslations("common");

  const form = useForm<DeleteConfirmationFormData>({
    resolver: zodResolver(createDeleteConfirmationSchema(t)),
    defaultValues: {
      confirmationText: "",
    },
  });

  const onSubmit = (data: DeleteConfirmationFormData) => {
    onConfirm();
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const getItemTypeColor = () => {
    switch (itemType) {
      case "category":
        return "text-blue-600";
      case "subcategory":
        return "text-green-600";
      case "levelThree":
        return "text-yellow-700";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-destructive">{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Information */}
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {t(`forms.${itemType}`)}:
                </span>
                <span className={`text-sm font-semibold ${getItemTypeColor()}`}>
                  {itemName}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-destructive/10 rounded-lg border border-red-200 p-2">
            <div className="flex gap-2">
              <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-destructive text-sm font-medium">
                  {t("forms.warning")}
                </h3>
                <div className="text-destructive text-sm">
                  <ul className="list-disc">
                    <li>{t("forms.delete-warning-irreversible")}</li>

                    <li>{t("forms.delete-warning-backup")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Confirmation Input */}
              <FormField
                control={form.control}
                name="confirmationText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.type-delete-to-confirm")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("forms.delete-placeholder")}
                        {...field}
                        disabled={isLoading}
                        className="font-mono"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="submit"
                  className="bg-destructive hover:bg-destructive"
                  disabled={isLoading || !form.watch("confirmationText")}
                >
                  {isLoading
                    ? t("actions.deleting")
                    : t("actions.delete-permanently")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  {t("actions.cancel")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
