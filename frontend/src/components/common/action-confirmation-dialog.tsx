"use client";

import React from "react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ActionConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  isLoading = false,
}: ActionConfirmationDialogProps) {
  const t = useTranslations("common");

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>{message}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive text-white"
          >
            {isLoading
              ? t("actions.processing")
              : confirmText || t("actions.confirm")}
          </AlertDialogAction>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText || t("actions.cancel")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
