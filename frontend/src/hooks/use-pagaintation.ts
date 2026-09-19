"use client";

import { useSearchParams } from "next/navigation";

export function usePaginationParams(defaultLimit = 10) {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || defaultLimit;

  return { page, limit };
}
