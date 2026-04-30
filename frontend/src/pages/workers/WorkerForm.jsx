import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  getCategorySkills,
  getSubCategorySkillsByCategoryId,
} from "@/services/workerService";
import FileUploadComponent from "@/components/fileUpload/FileUploadComponent";

const createEmptyCategory = () => ({
  categoryId: "",
  experienceYears: 0,
  subCategoryIds: [],
});

const toInputValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toOptionalString = (value) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toNullableNumber = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numericValue = Number(text);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
};

const normalizeInitialData = (initialData = {}, firebaseUid = "") => {
  const categories = Array.isArray(initialData.categories)
    ? initialData.categories
        .map((category) => ({
          categoryId: toInputValue(
            category?.categoryId ?? category?.category_id ?? "",
          ),
          experienceYears: Number(
            category?.experienceYears ?? category?.experience_years ?? 0,
          ),
          subCategoryIds: normalizeStringArray(
            category?.subCategoryIds ?? category?.sub_category_ids ?? [],
          ),
        }))
        .filter((category) => category.categoryId)
    : [];

  const documentInfo = initialData?.documentInfo || {
    logoUrl: initialData?.logoUrl || initialData?.logo_url || "",
    documents: initialData?.documents || [],
  };

  return {
    firebase_uid: toInputValue(initialData.firebase_uid || firebaseUid),
    name: toInputValue(initialData.name),
    countryCode: toInputValue(initialData.countryCode || "+91"),
    authNumber: toInputValue(initialData.authNumber),
    categories: categories.length > 0 ? categories : [createEmptyCategory()],
    address: toInputValue(initialData.address),
    city: toInputValue(initialData.city),
    state: toInputValue(initialData.state),
    pincode: toInputValue(initialData.pincode),
    latitude: toNullableNumber(initialData.latitude),
    longitude: toNullableNumber(initialData.longitude),
    bankDetails: {
      bankName: toInputValue(initialData?.bankDetails?.bankName),
      accountHolderName: toInputValue(
        initialData?.bankDetails?.accountHolderName,
      ),
      accountNumber: toInputValue(initialData?.bankDetails?.accountNumber),
      ifscCode: toInputValue(initialData?.bankDetails?.ifscCode),
      upiId: toInputValue(initialData?.bankDetails?.upiId),
    },
    documentInfo: {
      logoUrl: toInputValue(documentInfo?.logoUrl),
      documents: Array.isArray(documentInfo?.documents)
        ? documentInfo.documents
            .map((document) => ({
              documentType: toInputValue(
                document?.documentType || document?.document_type,
              ).toUpperCase(),
              documentUrl: toInputValue(
                document?.documentUrl || document?.document_url,
              ),
            }))
            .filter((document) => document.documentType && document.documentUrl)
        : [],
    },
  };
};

const normalizeSkillOption = (item) => {
  if (!item || typeof item !== "object") return null;
  const id =
    item.id ||
    item.category_skill_id ||
    item.sub_category_id ||
    item.categoryId ||
    item.subCategoryId;
  const name =
    item.name ||
    item.category_skill_name ||
    item.sub_category_name ||
    item.categoryName ||
    item.subCategoryName;
  if (!id) return null;
  return { id: String(id), name: String(name || id) };
};

export default function WorkerForm({
  mode = "create",
  initialData,
  loading = false,
  submitLabel,
  onSubmit,
  enableSkillLookup = false,
  firebaseUid,
}) {
  const [form, setForm] = useState(() =>
    normalizeInitialData(initialData || {}, firebaseUid || ""),
  );
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryOptionsMap, setSubCategoryOptionsMap] = useState({});
  const [subCategoryLoadingMap, setSubCategoryLoadingMap] = useState({});

  useEffect(() => {
    setForm(normalizeInitialData(initialData || {}, firebaseUid || ""));
  }, [initialData, firebaseUid]);

  const primaryLabel =
    submitLabel || (mode === "edit" ? "Update Worker" : "Create Worker");

  const sectionTitle = useMemo(
    () =>
      mode === "edit"
        ? "Update worker profile details"
        : "Register a new worker profile",
    [mode],
  );

  useEffect(() => {
    if (!enableSkillLookup) return;
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);
        setCategoryError("");
        const response = await getCategorySkills();
        setCategoryOptions(
          response.map((item) => normalizeSkillOption(item)).filter(Boolean),
        );
      } catch (fetchError) {
        setCategoryError(
          fetchError?.message || "Failed to load skill categories.",
        );
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategories();
  }, [enableSkillLookup]);

  const fetchSubCategories = useCallback(
    async (categoryId) => {
      if (
        !enableSkillLookup ||
        !categoryId ||
        subCategoryOptionsMap[categoryId]
      )
        return;
      try {
        setSubCategoryLoadingMap((prev) => ({ ...prev, [categoryId]: true }));
        const response = await getSubCategorySkillsByCategoryId(categoryId);
        setSubCategoryOptionsMap((prev) => ({
          ...prev,
          [categoryId]: response
            .map((item) => normalizeSkillOption(item))
            .filter(Boolean),
        }));
      } catch {
        setSubCategoryOptionsMap((prev) => ({ ...prev, [categoryId]: [] }));
      } finally {
        setSubCategoryLoadingMap((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [enableSkillLookup, subCategoryOptionsMap],
  );

  useEffect(() => {
    if (!enableSkillLookup) return;
    Array.from(
      new Set(
        form.categories
          .map((category) => String(category.categoryId || "").trim())
          .filter(Boolean),
      ),
    ).forEach((categoryId) => {
      fetchSubCategories(categoryId);
    });
  }, [enableSkillLookup, fetchSubCategories, form.categories]);

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const upsertDocument = (documentType, documentUrl) => {
    setForm((prev) => {
      if (documentType === "logo") {
        return {
          ...prev,
          documentInfo: {
            ...prev.documentInfo,
            logoUrl: String(documentUrl || ""),
          },
        };
      }

      const normalizedType = String(documentType || "").toUpperCase();
      const existing = prev.documentInfo.documents.filter(
        (doc) => doc.documentType !== normalizedType,
      );
      const normalizedUrls = []
        .concat(documentUrl || [])
        .map((url) => String(url || "").trim())
        .filter(Boolean);
      const nextDocuments = [
        ...existing,
        ...normalizedUrls.map((url) => ({
          documentType: normalizedType,
          documentUrl: url,
        })),
      ];

      return {
        ...prev,
        documentInfo: {
          ...prev.documentInfo,
          documents: nextDocuments,
        },
      };
    });
  };

  const categoryDocUrls = (type) =>
    form.documentInfo.documents
      .filter((doc) => doc.documentType === type)
      .map((doc) => doc.documentUrl)
      .filter(Boolean);

  const handleCategoryChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, currentIndex) => {
        if (currentIndex !== index) return category;
        if (key === "categoryId") {
          return { ...category, categoryId: value, subCategoryIds: [] };
        }
        if (key === "experienceYears") {
          return { ...category, experienceYears: Number(value || 0) };
        }
        return { ...category, [key]: value };
      }),
    }));

    if (key === "categoryId" && value) fetchSubCategories(value);
  };

  const handleSubCategoryToggle = (index, subCategoryId, checked) => {
    const safeId = String(subCategoryId || "").trim();
    if (!safeId) return;
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, currentIndex) => {
        if (currentIndex !== index) return category;
        const existingIds = new Set(
          normalizeStringArray(category.subCategoryIds),
        );
        if (checked) existingIds.add(safeId);
        else existingIds.delete(safeId);
        return { ...category, subCategoryIds: Array.from(existingIds) };
      }),
    }));
  };

  const addCategory = () => {
    setForm((prev) => ({
      ...prev,
      categories: [...prev.categories, createEmptyCategory()],
    }));
  };

  const removeCategory = (index) => {
    setForm((prev) => {
      const nextCategories = prev.categories.filter(
        (_, currentIndex) => currentIndex !== index,
      );
      return {
        ...prev,
        categories:
          nextCategories.length > 0 ? nextCategories : [createEmptyCategory()],
      };
    });
  };

  const buildPayload = () => {
    const name = form.name.trim();
    if (!name) throw new Error("Worker name is required.");

    const authNumber = toOptionalString(form.authNumber);
    if (!authNumber) throw new Error("Auth number is required.");

    const categories = form.categories
      .map((category) => {
        const categoryId = String(category.categoryId || "").trim();
        if (!categoryId) return null;
        return {
          categoryId,
          experienceYears: Number.isFinite(Number(category.experienceYears))
            ? Number(category.experienceYears)
            : 0,
          subCategoryIds: normalizeStringArray(category.subCategoryIds),
        };
      })
      .filter(Boolean);

    if (categories.length === 0)
      throw new Error("At least one category is required.");

    const logoUrl = toOptionalString(form.documentInfo.logoUrl);
    if (!logoUrl) throw new Error("Logo upload is required.");

    const documents = (form.documentInfo.documents || [])
      .map((doc) => ({
        documentType: String(doc.documentType || "")
          .toUpperCase()
          .trim(),
        documentUrl: toOptionalString(doc.documentUrl),
      }))
      .filter((doc) => doc.documentType && doc.documentUrl);

    const safeFirebaseUid = toOptionalString(form.firebase_uid || firebaseUid);
    if (!safeFirebaseUid) throw new Error("firebase_uid is required.");

    return {
      // firebase_uid: safeFirebaseUid,
      name,
      countryCode: toOptionalString(form.countryCode),
      authNumber,
      categories,
      address: toOptionalString(form.address),
      city: toOptionalString(form.city),
      state: toOptionalString(form.state),
      pincode: toOptionalString(form.pincode),
      latitude: toNullableNumber(form.latitude),
      longitude: toNullableNumber(form.longitude),
      bankDetails: {
        bankName: toOptionalString(form.bankDetails?.bankName),
        accountHolderName: toOptionalString(
          form.bankDetails?.accountHolderName,
        ),
        accountNumber: toOptionalString(form.bankDetails?.accountNumber),
        ifscCode: toOptionalString(form.bankDetails?.ifscCode),
        upiId: toOptionalString(form.bankDetails?.upiId),
      },
      documentInfo: {
        logoUrl,
        documents,
      },
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      await onSubmit(buildPayload());
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Failed to submit the worker details. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">
          {sectionTitle}
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                handleFieldChange("name", event.target.value)
              }
              placeholder="Worker name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Country Code
            </label>
            <input
              type="text"
              value={form.countryCode}
              onChange={(event) =>
                handleFieldChange("countryCode", event.target.value)
              }
              placeholder="+91"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Auth Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.authNumber}
              onChange={(event) =>
                handleFieldChange("authNumber", event.target.value)
              }
              placeholder="9876543210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">Bank Details</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Bank Name
            </label>
            <input
              type="text"
              value={form.bankDetails.bankName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  bankDetails: {
                    ...prev.bankDetails,
                    bankName: event.target.value,
                  },
                }))
              }
              placeholder="HDFC Bank"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Account Holder Name
            </label>
            <input
              type="text"
              value={form.bankDetails.accountHolderName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  bankDetails: {
                    ...prev.bankDetails,
                    accountHolderName: event.target.value,
                  },
                }))
              }
              placeholder="Ravi Kumar"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Account Number
            </label>
            <input
              type="text"
              value={form.bankDetails.accountNumber}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  bankDetails: {
                    ...prev.bankDetails,
                    accountNumber: event.target.value,
                  },
                }))
              }
              placeholder="123456789012"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              IFSC Code
            </label>
            <input
              type="text"
              value={form.bankDetails.ifscCode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  bankDetails: {
                    ...prev.bankDetails,
                    ifscCode: event.target.value,
                  },
                }))
              }
              placeholder="HDFC0001234"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              UPI ID
            </label>
            <input
              type="text"
              value={form.bankDetails.upiId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  bankDetails: {
                    ...prev.bankDetails,
                    upiId: event.target.value,
                  },
                }))
              }
              placeholder="name@upi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800">
            Skills (Categories)
          </h3>
          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
            disabled={loading}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {enableSkillLookup && categoryError ? (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
            {categoryError}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          {form.categories.map((category, index) => {
            const selectedCategoryId = category.categoryId;
            const subCategoryOptions =
              subCategoryOptionsMap[selectedCategoryId] || [];
            const isSubCategoryLoading =
              Boolean(subCategoryLoadingMap[selectedCategoryId]) &&
              Boolean(selectedCategoryId);

            return (
              <div
                key={`category-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Skill Category
                    </label>
                    {enableSkillLookup ? (
                      <select
                        value={category.categoryId}
                        onChange={(event) =>
                          handleCategoryChange(
                            index,
                            "categoryId",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        disabled={loading || categoryLoading}
                      >
                        <option value="">
                          {categoryLoading
                            ? "Loading categories..."
                            : "Select skill category"}
                        </option>
                        {categoryOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={category.categoryId}
                        onChange={(event) =>
                          handleCategoryChange(
                            index,
                            "categoryId",
                            event.target.value,
                          )
                        }
                        placeholder="category id"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        disabled={loading}
                      />
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={category.experienceYears}
                      onChange={(event) =>
                        handleCategoryChange(
                          index,
                          "experienceYears",
                          event.target.value,
                        )
                      }
                      placeholder="3"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Sub Categories
                    </label>
                    {enableSkillLookup ? (
                      <div
                        className={`max-h-36 overflow-auto rounded-lg border border-gray-300 bg-white p-2 ${loading || !selectedCategoryId || isSubCategoryLoading ? "opacity-60" : ""}`}
                      >
                        {subCategoryOptions.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            {selectedCategoryId
                              ? "No sub categories found."
                              : "Select a skill category first."}
                          </p>
                        ) : (
                          subCategoryOptions.map((option) => {
                            const checked = normalizeStringArray(
                              category.subCategoryIds,
                            ).includes(String(option.id));
                            return (
                              <label
                                key={option.id}
                                className="mb-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 last:mb-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) =>
                                    handleSubCategoryToggle(
                                      index,
                                      option.id,
                                      event.target.checked,
                                    )
                                  }
                                  disabled={
                                    loading ||
                                    !selectedCategoryId ||
                                    isSubCategoryLoading
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>{option.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={category.subCategoryIds.join(", ")}
                        onChange={(event) =>
                          handleCategoryChange(
                            index,
                            "subCategoryIds",
                            event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="id-1, id-2"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        disabled={loading}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    disabled={loading}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">Address</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                handleFieldChange("address", event.target.value)
              }
              placeholder="123, Anna Nagar, Chennai"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(event) =>
                handleFieldChange("city", event.target.value)
              }
              placeholder="Chennai"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(event) =>
                handleFieldChange("state", event.target.value)
              }
              placeholder="Tamil Nadu"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pincode
            </label>
            <input
              type="text"
              value={form.pincode}
              onChange={(event) =>
                handleFieldChange("pincode", event.target.value)
              }
              placeholder="600040"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={toInputValue(form.latitude)}
              onChange={(event) =>
                handleFieldChange("latitude", event.target.value)
              }
              placeholder="13.0827"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={toInputValue(form.longitude)}
              onChange={(event) =>
                handleFieldChange("longitude", event.target.value)
              }
              placeholder="80.2707"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">Documents</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FileUploadComponent
            documentType="logo"
            value={form.documentInfo.logoUrl}
            onChange={(value) => upsertDocument("logo", value)}
            firebaseUid={form.firebase_uid || firebaseUid}
            disabled={loading}
          />
          <FileUploadComponent
            documentType="AC"
            value={categoryDocUrls("AC")}
            onChange={(value) => upsertDocument("AC", value)}
            firebaseUid={form.firebase_uid || firebaseUid}
            disabled={loading}
          />
          <FileUploadComponent
            documentType="PAN"
            value={categoryDocUrls("PAN")}
            onChange={(value) => upsertDocument("PAN", value)}
            firebaseUid={form.firebase_uid || firebaseUid}
            disabled={loading}
          />
          <div className="md:col-span-2">
            <FileUploadComponent
              documentType="CR"
              value={categoryDocUrls("CR")}
              onChange={(value) => upsertDocument("CR", value)}
              firebaseUid={form.firebase_uid || firebaseUid}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : primaryLabel}
        </button>
      </div>
    </form>
  );
}
