"use client";

import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 5;
const FIRST_PAGE = 1;

type UseFiltersProps<T> = {
  data: T[];
  pageSize?: number;
  filters?: ((item: T) => boolean)[];
  searchValue?: string;
  searchFn?: (item: T, search: string) => boolean;
};

export function useFilters<T>({
  data,
  pageSize = DEFAULT_PAGE_SIZE,
  filters = [],
  searchValue = "",
  searchFn,
}: UseFiltersProps<T>) {
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const passFilters = filters.every((fn) => fn(item));

      const passSearch =
        !searchFn ||
        normalizedSearch.length === 0 ||
        searchFn(item, normalizedSearch);

      return passFilters && passSearch;
    });
  }, [data, filters, normalizedSearch, searchFn]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredData.length / pageSize));
  }, [filteredData.length, pageSize]);

  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safePage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const resetPage = () => setCurrentPage(FIRST_PAGE);

  return {
    filteredData,
    paginatedData,
    currentPage: safePage,
    totalPages,
    pageSize,
    setCurrentPage: goToPage,
    resetPage,
  };
}
