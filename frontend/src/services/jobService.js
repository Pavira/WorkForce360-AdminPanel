import api from "@/config/axios";

const VALID_STATUS = new Set([
  "searching",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "no_worker_match",
]);

const isNonEmptyValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

const buildSafeQueryParams = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!isNonEmptyValue(value)) return;
    query.append(key, String(value));
  });

  return query.toString();
};

const extractApiData = (response) => response?.data?.data ?? null;

const buildListParams = (params = {}) => {
  const hasCursor = isNonEmptyValue(params.cursor);
  const safePage = Math.max(1, Number(params.page) || 1);

  return {
    page: hasCursor ? null : safePage,
    page_size: params.page_size,
    cursor: hasCursor ? params.cursor : null,
    search_term: params.search_term,
    search_type: params.search_type,
  };
};

const safeApiError = (error, fallbackMessage) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage ||
    "Something went wrong. Please try again.";

  const safeError = new Error(message);
  safeError.originalError = error;
  return safeError;
};

export const getJobsByStatus = async (status = "searching", options = {}) => {
  const safeStatus = VALID_STATUS.has(status) ? status : "searching";
  const queryString = buildSafeQueryParams(
    buildListParams(options.params || {}),
  );
  const endpoint = queryString
    ? `/admin_panel_job/${safeStatus}?${queryString}`
    : `/admin_panel_job/${safeStatus}`;

  try {
    const response = await api.get(endpoint, {
      signal: options.signal,
    });
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, `Failed to load ${safeStatus} jobs.`);
  }
};

export const getJobById = async (jobId) => {
  try {
    const response = await api.get(`/admin_panel_job/${jobId}`);
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to load job details.");
  }
};

export const getNearestWorkersByJobId = async (jobId, options = {}) => {
  const queryString = buildSafeQueryParams({
    limit: options.limit,
  });
  const endpoint = queryString
    ? `/admin_panel_job/${jobId}/nearest_workers?${queryString}`
    : `/admin_panel_job/${jobId}/nearest_workers`;

  try {
    const response = await api.get(endpoint, {
      signal: options.signal,
    });
    const data = extractApiData(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw safeApiError(error, "Failed to load nearest workers.");
  }
};

export const assignJobToWorker = async (jobId, workerId) => {
  try {
    const response = await api.post(
      `/admin_panel_job/${jobId}/assign/${workerId}`,
      {
        job_id: jobId,
        worker_id: workerId,
      },
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to assign worker.");
  }
};

export const createJob = async (payload) => {
  const normalizedPayload = { ...(payload || {}) };
  delete normalizedPayload.addressType;
  delete normalizedPayload.selectedAddressIndex;

  const parsedLatitude = Number(normalizedPayload.latitude);
  const parsedLongitude = Number(normalizedPayload.longitude);

  if (Number.isFinite(parsedLatitude)) {
    normalizedPayload.latitude = parsedLatitude;
  }

  if (Number.isFinite(parsedLongitude)) {
    normalizedPayload.longitude = parsedLongitude;
  }

  try {
    const response = await api.post(
      "/admin_panel_job/create_job_post",
      normalizedPayload,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to create job.");
  }
};

// Backward-compatible alias used in ViewJob.
export const assignWorkerToJob = assignJobToWorker;
