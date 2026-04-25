import api from "@/config/axios";

const VALID_STATUS = new Set(["approved", "unapproved", "draft"]);

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

// Get workers by status with search + hybrid pagination and cancellation support
export const getWorkersByStatus = async (status = "approved", options = {}) => {
  const safeStatus = VALID_STATUS.has(status) ? status : "approved";
  const queryString = buildSafeQueryParams(
    buildListParams(options.params || {}),
  );
  const endpoint = queryString
    ? `/admin_panel_worker/${safeStatus}?${queryString}`
    : `/admin_panel_worker/${safeStatus}`;

  try {
    const response = await api.get(endpoint, {
      signal: options.signal,
    });
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, `Failed to load ${safeStatus} workers.`);
  }
};

// Get worker by ID from admin panel routes
export const getWorkerById = async (workerId) => {
  try {
    const response = await api.get(`/admin_panel_worker/${workerId}`);
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to load worker details.");
  }
};

// Approve worker
export const approveWorker = async (workerId) => {
  try {
    const response = await api.patch(
      `/admin_panel_worker/approve_worker_profile/${workerId}`,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to approve worker.");
  }
};

// Unapprove worker
export const unapproveWorker = async (workerId) => {
  try {
    const response = await api.patch(
      `/admin_panel_worker/unapprove/${workerId}`,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to unapprove worker.");
  }
};

// Reject worker
export const rejectWorker = async (workerId) => {
  try {
    const response = await api.patch(`/admin_panel_worker/reject/${workerId}`);
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to reject worker.");
  }
};

// Create worker (registration payload)
export const createWorker = async (payload) => {
  try {
    const response = await api.post("/admin_panel_worker/register", payload);
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to create worker.");
  }
};

// Update worker profile
export const updateWorker = async (workerId, payload) => {
  try {
    const response = await api.patch(
      `/admin_panel_worker/${workerId}`,
      payload,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to update worker.");
  }
};

// Skill categories list
export const getCategorySkills = async () => {
  try {
    const response = await api.get("/category_skills");
    const data = extractApiData(response);
    return Array.isArray(data) ? data : [];
  } catch {
    try {
      const fallbackResponse = await api.get("/industry_skill/category_skills");
      const fallbackData = extractApiData(fallbackResponse);
      return Array.isArray(fallbackData) ? fallbackData : [];
    } catch (fallbackError) {
      throw safeApiError(fallbackError, "Failed to load category skills.");
    }
  }
};

// Sub-category skills by category ID
export const getSubCategorySkillsByCategoryId = async (categorySkillId) => {
  if (!categorySkillId) return [];

  try {
    const response = await api.get(`/sub_category_skills/${categorySkillId}`);
    const data = extractApiData(response);
    return Array.isArray(data) ? data : [];
  } catch {
    // Fallback for APIs that accept category id as query parameter.
    try {
      const fallbackResponse = await api.get("/sub_category_skills", {
        params: { category_skill_id: categorySkillId },
      });
      const fallbackData = extractApiData(fallbackResponse);
      return Array.isArray(fallbackData) ? fallbackData : [];
    } catch {
      try {
        const industryPathResponse = await api.get(
          `/industry_skill/sub_category_skills/${categorySkillId}`,
        );
        const industryPathData = extractApiData(industryPathResponse);
        return Array.isArray(industryPathData) ? industryPathData : [];
      } catch (industryPathError) {
        throw safeApiError(
          industryPathError,
          "Failed to load sub-category skills.",
        );
      }
    }
  }
};
