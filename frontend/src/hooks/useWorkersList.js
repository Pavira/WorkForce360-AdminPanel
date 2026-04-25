import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "@/utils/debounce";
import { getWorkersByStatus } from "@/services/workerService";

const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;
const INITIAL_PAGE_SIZE = 20;

const normalizeSearchTerm = (value) => value.trim();

export default function useWorkersList() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [prevCursor, setPrevCursor] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("worker_name");
  const [activeStatus, setActiveStatus] = useState("approved");

  const [approvedCount, setApprovedCount] = useState(0);
  const [unapprovedCount, setUnapprovedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

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

  const loadWorkers = useCallback(async () => {
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

      const payload = await getWorkersByStatus(activeStatus, {
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
      setItems(safeItems);
      setTotalCount(
        Number.isFinite(payload?.total_count)
          ? payload.total_count
          : safeItems.length,
      );
      setNextCursor(payload?.next_cursor ?? null);
      setPrevCursor(payload?.prev_cursor ?? null);
      setApprovedCount(
        Number.isFinite(payload?.approved_count) ? payload.approved_count : 0,
      );
      setUnapprovedCount(
        Number.isFinite(payload?.unapproved_count)
          ? payload.unapproved_count
          : 0,
      );
      setDraftCount(
        Number.isFinite(payload?.draft_count) ? payload.draft_count : 0,
      );

      if (Number.isFinite(payload?.page_size) && payload.page_size > 0) {
        setPageSize(payload.page_size);
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      if (latestRequestIdRef.current !== requestId) return;
      setItems([]);
      setError(err?.message || "Failed to load workers. Please try again.");
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
    loadWorkers();
  }, [loadWorkers]);

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
    approvedCount,
    unapprovedCount,
    draftCount,
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
