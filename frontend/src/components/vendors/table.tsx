"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";

import Pagination from "@/components/common/pagination";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Vendor } from "@/types/vendor";

type VendorsTableProps = {
  data?: Vendor[];
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
};

export default function VendorsTable({
  data = [],
  totalCount = data.length,
  currentPage = 1,
  pageSize = 5,
  isLoading = false,
  onPageChange = () => undefined,
  onEdit,
  onDelete,
}: VendorsTableProps) {
  const t = useTranslations("vendors");
  const showPagination = totalCount > pageSize || isLoading;

  if (isLoading) {
    return (
      <div className="border-border bg-background w-full rounded-2xl border p-3 sm:p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold sm:mb-6 sm:text-2xl">
          {t("table.count", { count: totalCount })}
        </h3>
        <TableSkeleton columns={4} pageSize={pageSize} />
        {showPagination && (
          <Pagination
            totalCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={onPageChange}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  }

  return (
    <div className="border-border bg-background w-full rounded-2xl border p-3 sm:p-6">
      <span className="text-foreground mb-3 text-lg font-semibold sm:mb-6 sm:text-xl">
        {t("table.count", { count: totalCount })}
      </span>

      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-foreground h-10 px-2 text-start text-base font-semibold lg:h-12">
              {t("table.columns.name")}
            </TableHead>
            <TableHead className="text-foreground h-10 px-2 text-start text-base font-semibold lg:h-12">
              {t("table.columns.slug")}
            </TableHead>
            <TableHead className="text-foreground h-10 px-2 text-start text-base font-semibold lg:h-12">
              {t("table.columns.status")}
            </TableHead>
            <TableHead className="text-foreground h-10 px-2 text-start text-base font-semibold lg:h-12">
              {t("table.columns.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground h-20 px-2 text-center text-base"
              >
                {t("table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            data.map((vendor) => (
              <TableRow key={vendor.id} className="border-border">
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell className="font-medium">{vendor.slug}</TableCell>
                <TableCell className="px-2 text-sm">
                  <span
                    className={
                      vendor.status === "active"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }
                  >
                    {t(`table.status.${vendor.status}`)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-8"
                      aria-label={`${t("table.actions.edit")} ${vendor.name}`}
                      onClick={() => onEdit?.(vendor)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="size-8"
                      aria-label={`${t("table.actions.delete")} ${vendor.name}`}
                      onClick={() => onDelete?.(vendor)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <Pagination
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
