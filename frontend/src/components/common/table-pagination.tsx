"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/utils/css-classes-merge";

type TablePaginationProps = {
  totalCount: number;
  defaultLimit?: number;
  limitOptions?: number[];
  className?: string;
  showPageInfo?: boolean;
};

export default function TablePagination({
  totalCount,
  defaultLimit = 10,
  limitOptions = [10, 20, 30, 50, 100],
  className,
  showPageInfo = false,
}: TablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // const t = useTranslations("common.pagination");

  // Get current page and limit from URL params
  const currentPage = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || defaultLimit;

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Ensure current page is within bounds
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // Create URL with updated params
  const createQueryString = useCallback(
    (params: Record<string, string | number>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        newParams.set(key, String(value));
      });

      return newParams.toString();
    },
    [searchParams],
  );

  // Navigate to a specific page
  const goToPage = useCallback(
    (page: number) => {
      const queryString = createQueryString({ page });
      router.push(`${pathname}?${queryString}`);
    },
    [createQueryString, pathname, router],
  );

  // Change limit and reset to first page
  const changeLimit = useCallback(
    (newLimit: string) => {
      const queryString = createQueryString({ limit: newLimit, page: 1 });
      router.push(`${pathname}?${queryString}`);
    },
    [createQueryString, pathname, router],
  );

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (safePage > 3) {
        pages.push("ellipsis");
      }

      // Pages around current
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safePage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [safePage, totalPages]);

  // Calculate display range
  const startItem = totalCount === 0 ? 0 : (safePage - 1) * limit + 1;
  const endItem = Math.min(safePage * limit, totalCount);

  const canGoPrevious = safePage > 1;
  const canGoNext = safePage < totalPages;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 py-4 sm:flex-row",
        className,
      )}
    >
      {" "}
      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goToPage(1)}
          disabled={!canGoPrevious}
          // aria-label={t("first-page")}
        >
          <ChevronsRightIcon className="size-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goToPage(safePage - 1)}
          disabled={!canGoPrevious}
          // aria-label={t("previous-page")}
        >
          <ChevronRightIcon className="size-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="text-muted-foreground flex size-8 items-center justify-center"
              >
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === safePage ? "default" : "outline"}
                size="icon"
                className="size-8"
                onClick={() => goToPage(pageNum)}
                // aria-label={{ page: pageNum }}
                aria-current={pageNum === safePage ? "page" : undefined}
              >
                {pageNum}
              </Button>
            ),
          )}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goToPage(safePage + 1)}
          disabled={!canGoNext}
          // aria-label={t("next-page")}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goToPage(totalPages)}
          disabled={!canGoNext}
          // aria-label={t("last-page")}
        >
          <ChevronsLeftIcon className="size-4" />
        </Button>
      </div>
      {/* Page info */}
      {showPageInfo && (
        <div className="text-muted-foreground text-sm">
          {/* {t("page-info", { startItem, endItem, totalCount })} */}
        </div>
      )}
      {/* Items per page selector */}
      {/* <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("show")}</span>
        <Select value={String(limit)} onValueChange={changeLimit}>
          <SelectTrigger className="w-[70px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{t("element")}</span>
      </div> */}
    </div>
  );
}
