"use client";

import React from "react";

import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

export default function Pagination({
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  isLoading = false,
}: Props) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const maxVisiblePages = 5;

  if (totalPages <= 1 && !isLoading) {
    return null;
  }

  const generatePaginationItems = () => {
    const items: React.ReactNode[] = [];

    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(
      totalPages - 1,
      currentPage + Math.floor(maxVisiblePages / 2),
    );

    if (totalPages <= maxVisiblePages + 2) {
      startPage = 2;
      endPage = totalPages - 1;
    }

    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => !isLoading && onPageChange(1)}
          className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs transition ${
            currentPage === 1
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        >
          1
        </PaginationLink>
      </PaginationItem>,
    );

    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <span className="text-muted-foreground flex h-7 w-7 items-center justify-center text-xs">
            ...
          </span>
        </PaginationItem>,
      );
    }

    const middleItems = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i,
    ).map((i) => (
      <PaginationItem key={i}>
        <PaginationLink
          onClick={() => !isLoading && onPageChange(i)}
          className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs transition ${
            currentPage === i
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        >
          {i}
        </PaginationLink>
      </PaginationItem>
    ));

    items.push(...middleItems);

    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <span className="text-muted-foreground flex h-7 w-7 items-center justify-center text-xs">
            ...
          </span>
        </PaginationItem>,
      );
    }

    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => !isLoading && onPageChange(totalPages)}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs transition ${
              currentPage === totalPages
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  const generatePlaceholderItems = () => (
    <>
      {[1, 2, 3, 4, 5].map((key) => (
        <PaginationItem key={key}>
          <div className="border-border bg-muted text-muted-foreground flex h-7 w-7 animate-pulse items-center justify-center rounded border text-xs select-none">
            {key}
          </div>
        </PaginationItem>
      ))}
      <PaginationItem>
        <span className="text-muted-foreground flex h-7 w-7 items-center justify-center text-xs">
          ...
        </span>
      </PaginationItem>
    </>
  );

  return (
    <div className="flex w-full justify-center overflow-x-auto p-2">
      <PaginationContent className="min-w-max">
        <PaginationItem>
          <PaginationPrevious
            onClick={() =>
              !isLoading && currentPage > 1 && onPageChange(currentPage - 1)
            }
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs transition ${
              currentPage === 1 || isLoading
                ? "pointer-events-none opacity-50"
                : "hover:bg-muted"
            }`}
          />
        </PaginationItem>

        {isLoading ? generatePlaceholderItems() : generatePaginationItems()}

        <PaginationItem>
          <PaginationNext
            onClick={() =>
              !isLoading &&
              currentPage < totalPages &&
              onPageChange(currentPage + 1)
            }
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs transition ${
              currentPage === totalPages || isLoading
                ? "pointer-events-none opacity-50"
                : "hover:bg-muted"
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </div>
  );
}
