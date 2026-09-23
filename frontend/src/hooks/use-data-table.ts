"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQueryState } from "nuqs";
import { useDebounce } from "./use-debounce";

export interface UseDataTableOptions<T> {
  data: T[];
  searchFields?: (keyof T | ((item: T) => string | number | null | undefined))[];
  filterFn?: (item: T) => boolean;
  defaultPageSize?: number;
}

export function useDataTable<T>({
  data = [],
  searchFields = [],
  filterFn,
  defaultPageSize = 10,
}: UseDataTableOptions<T>) {
  // URL Query States
  const [searchParam, setSearchParam] = useQueryState("search", {
    defaultValue: "",
  });
  const [pageParam, setPageParam] = useQueryState("page", {
    defaultValue: "1",
  });
  const [pageSizeParam, setPageSizeParam] = useQueryState("pageSize", {
    defaultValue: String(defaultPageSize),
  });

  // Local state for instant typing responsiveness
  const [searchTerm, setSearchTerm] = useState(searchParam || "");

  // Debounced search term for URL sync and filtering
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Sync debounced search to URL query param and reset page to 1
  useEffect(() => {
    if (debouncedSearch !== searchParam) {
      setSearchParam(debouncedSearch || null);
      setPageParam("1");
    }
  }, [debouncedSearch, searchParam, setSearchParam, setPageParam]);

  // Keep local searchTerm in sync if the URL param changes externally, e.g. back button (render-time, no effect)
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam);
  if (searchParam !== prevSearchParam) {
    setPrevSearchParam(searchParam);
    if (searchParam !== searchTerm && searchParam !== debouncedSearch) {
      setSearchTerm(searchParam || "");
    }
  }

  // Handle instant clear
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchParam(null);
    setPageParam("1");
  }, [setSearchParam, setPageParam]);

  // Parse page and pageSize
  const pageSize = useMemo(() => {
    const parsed = parseInt(pageSizeParam || String(defaultPageSize), 10);
    return isNaN(parsed) || parsed <= 0 ? defaultPageSize : parsed;
  }, [pageSizeParam, defaultPageSize]);

  const rawPage = useMemo(() => {
    const parsed = parseInt(pageParam || "1", 10);
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [pageParam]);

  // 1. Filter data by search query and custom filterFn
  const filteredData = useMemo(() => {
    let result = data;

    // Apply custom filterFn if provided
    if (filterFn) {
      result = result.filter(filterFn);
    }

    // Apply text search across searchFields
    const trimmed = debouncedSearch.trim().toLowerCase();
    if (trimmed && searchFields.length > 0) {
      result = result.filter((item) => {
        return searchFields.some((field) => {
          let value: unknown;
          if (typeof field === "function") {
            value = field(item);
          } else {
            value = item[field];
          }

          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(trimmed);
        });
      });
    }

    return result;
  }, [data, debouncedSearch, searchFields, filterFn]);

  // 2. Compute pagination bounds
  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(rawPage, totalPages);

  // Keep page URL param in bounds
  useEffect(() => {
    if (rawPage > totalPages && totalPages > 0) {
      setPageParam(String(totalPages));
    }
  }, [rawPage, totalPages, setPageParam]);

  // 3. Slice paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Handler helpers
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPageParam(String(newPage));
    },
    [setPageParam]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSizeParam(String(newPageSize));
      setPageParam("1");
    },
    [setPageSizeParam, setPageParam]
  );

  return {
    searchTerm,
    setSearchTerm,
    clearSearch,
    debouncedSearch,
    currentPage,
    setPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalCount,
    rawCount: data.length,
    totalPages,
    filteredData,
    paginatedData,
  };
}
