import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "@/utils/debounce";
import { getJobsByStatus } from "@/services/jobService";

const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;
const INITIAL_PAGE_SIZE = 20;
const JOB_STATUSES = [
  "searching",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "no_worker_match",
];

const DEFAULT_STATUS_COUNTS = JOB_STATUSES.reduce((acc, status) => {
  acc[status] = 0;
  return acc;
}, {});

const normalizeSearchTerm = (value) => value.trim();
const isFiniteCount = (value) => Number.isFinite(value);

const getStatusCountFromPayload = (payload, status) => {
  const statusCountKey = `${status}_count`;
  const directCount = payload?.[statusCountKey];
  if (isFiniteCount(directCount)) return directCount;

  const statusCounts = payload?.status_counts;
  if (statusCounts && isFiniteCount(statusCounts[status])) {
    return statusCounts[status];
  }

  const counts = payload?.counts;
  if (counts && isFiniteCount(counts[status])) {
    return counts[status];
  }

  return null;
};

export default function useJobsList() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [prevCursor, setPrevCursor] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("job_title");
  const [activeStatus, setActiveStatus] = useState("searching");
  const [statusCounts, setStatusCounts] = useState(DEFAULT_STATUS_COUNTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const debouncedSearchUpdater = useMemo(
    () =>
      debounce((nextSearchTerm) => {
        setCursor(null);
        setPage(1);
        setDebouncedSearchTerm(nextSearchTerm);
      }, SEARCH_DEBOUNCE_MS),
    [],
  );

  const cancelInFlightRequest = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const loadJobs = useCallback(async () => {
    const trimmedSearchTerm = normalizeSearchTerm(debouncedSearchTerm);
    const hasValidSearch = trimmedSearchTerm.length >= MIN_SEARCH_LENGTH;
    const hasShortSearch =
      trimmedSearchTerm.length > 0 &&
      trimmedSearchTerm.length < MIN_SEARCH_LENGTH;

    if (hasShortSearch) return;

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    cancelInFlightRequest();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const payload = await getJobsByStatus(activeStatus, {
        params: {
          page,
          page_size: pageSize,
          cursor,
          search_term: hasValidSearch ? trimmedSearchTerm : null,
          search_type: hasValidSearch ? searchType : null,
        },
        signal: controller.signal,
      });

      if (latestRequestIdRef.current !== requestId) return;

      const safeItems = Array.isArray(payload?.items) ? payload.items : [];
      const resolvedTotalCount = Number.isFinite(payload?.total_count)
        ? payload.total_count
        : safeItems.length;

      setItems(safeItems);
      setTotalCount(resolvedTotalCount);
      setNextCursor(payload?.next_cursor ?? null);
      setPrevCursor(payload?.prev_cursor ?? null);
      setStatusCounts((previousCounts) => {
        const nextCounts = { ...previousCounts };
        let hasAnyExplicitStatusCount = false;

        JOB_STATUSES.forEach((status) => {
          const statusCount = getStatusCountFromPayload(payload, status);
          if (isFiniteCount(statusCount)) {
            nextCounts[status] = statusCount;
            hasAnyExplicitStatusCount = true;
          }
        });

        // Fallback for APIs that only return total_count for the active status.
        if (!hasAnyExplicitStatusCount) {
          nextCounts[activeStatus] = resolvedTotalCount;
        }

        return nextCounts;
      });

      if (Number.isFinite(payload?.page_size) && payload.page_size > 0) {
        setPageSize(payload.page_size);
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      if (latestRequestIdRef.current !== requestId) return;
      setItems([]);
      setError(err?.message || "Failed to load jobs. Please try again.");
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [
    activeStatus,
    cancelInFlightRequest,
    cursor,
    debouncedSearchTerm,
    page,
    pageSize,
    searchType,
  ]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    return () => {
      debouncedSearchUpdater.cancel();
      cancelInFlightRequest();
    };
  }, [cancelInFlightRequest, debouncedSearchUpdater]);

  const handleSearchInputChange = useCallback(
    (event) => {
      const value = event.target.value;
      const normalizedValue = normalizeSearchTerm(value);

      setSearchTerm(value);

      if (normalizedValue.length === 0) {
        debouncedSearchUpdater.cancel();
        setDebouncedSearchTerm("");
        setPage(1);
        setCursor(null);
        setNextCursor(null);
        setPrevCursor(null);
        return;
      }

      if (normalizedValue.length >= MIN_SEARCH_LENGTH) {
        debouncedSearchUpdater(normalizedValue);
      } else {
        debouncedSearchUpdater.cancel();
      }
    },
    [debouncedSearchUpdater],
  );

  const handleSearchTypeChange = useCallback(
    (event) => {
      const nextSearchType = event.target.value;
      const normalizedValue = normalizeSearchTerm(searchTerm);

      setSearchType(nextSearchType);

      if (normalizedValue.length >= MIN_SEARCH_LENGTH) {
        debouncedSearchUpdater.cancel();
        setPage(1);
        setCursor(null);
        setDebouncedSearchTerm(normalizedValue);
      }
    },
    [debouncedSearchUpdater, searchTerm],
  );

  const handleStatusChange = useCallback((nextStatus) => {
    setActiveStatus(nextStatus);
    setPage(1);
    setCursor(null);
    setNextCursor(null);
    setPrevCursor(null);
  }, []);

  const handleNextPage = useCallback(() => {
    if (loading) return;

    if (nextCursor) {
      setCursor(nextCursor);
      return;
    }

    setCursor(null);
    setPage((previousPage) => previousPage + 1);
  }, [loading, nextCursor]);

  const handlePrevPage = useCallback(() => {
    if (loading) return;

    if (prevCursor) {
      setCursor(prevCursor);
      return;
    }

    setCursor(null);
    setPage((previousPage) => Math.max(1, previousPage - 1));
  }, [loading, prevCursor]);

  const hasPageBasedNext = page * pageSize < totalCount;
  const isPrevDisabled = loading || (!prevCursor && page <= 1);
  const isNextDisabled = loading || (!nextCursor && !hasPageBasedNext);

  return {
    items,
    totalCount,
    page,
    searchTerm,
    searchType,
    activeStatus,
    statusCounts,
    loading,
    error,
    isPrevDisabled,
    isNextDisabled,
    handleSearchInputChange,
    handleSearchTypeChange,
    handleStatusChange,
    handlePrevPage,
    handleNextPage,
  };
}
