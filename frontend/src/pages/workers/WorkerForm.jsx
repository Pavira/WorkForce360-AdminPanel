import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  getCategorySkills,
  getSubCategorySkillsByCategoryId,
} from "@/services/workerService";
import FileUploadComponent from "@/components/fileUpload/FileUploadComponent";

const createEmptyCategory = () => ({
  categoryId: "",
  experienceYears: "",
  subCategoryIds: [],
});

const emptyForm = {
  name: "",
  countryCode: "+91",
  authNumber: "",
  categories: [createEmptyCategory()],
  address: "",
  city: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
  // New document fields
  logo: "",
  aadhaar: "",
  pan: "",
  certificates: [],
};

const toInputValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toOptionalString = (value) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const toOptionalNumber = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numericValue = Number(text);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
};

const normalizeInitialData = (initialData = {}) => {
  const categories = Array.isArray(initialData.categories)
    ? initialData.categories
        .map((category) => ({
          categoryId: toInputValue(
            category?.categoryId ?? category?.category_id ?? "",
          ),
          experienceYears: toInputValue(
            category?.experienceYears ?? category?.experience_years ?? "",
          ),
          subCategoryIds: normalizeStringArray(
            category?.subCategoryIds ?? category?.sub_category_ids ?? [],
          ),
        }))
        .filter(
          (category) => category.categoryId || category.subCategoryIds.length,
        )
    : [];

  const documents = Array.isArray(initialData?.documentInfo?.documents)
    ? initialData.documentInfo.documents
        .map((document) => ({
          documentType: toInputValue(document?.documentType),
          documentUrl: toInputValue(document?.documentUrl),
        }))
        .filter((document) => document.documentType || document.documentUrl)
    : [];

  return {
    name: toInputValue(initialData.name),
    countryCode: toInputValue(initialData.countryCode || "+91"),
    authNumber: toInputValue(initialData.authNumber),
    categories: categories.length > 0 ? categories : [createEmptyCategory()],
    address: toInputValue(initialData.address),
    city: toInputValue(initialData.city),
    state: toInputValue(initialData.state),
    pincode: toInputValue(initialData.pincode),
    latitude: toInputValue(initialData.latitude),
    longitude: toInputValue(initialData.longitude),
    bankName: toInputValue(initialData?.bankDetails?.bankName),
    accountHolderName: toInputValue(
      initialData?.bankDetails?.accountHolderName,
    ),
    accountNumber: toInputValue(initialData?.bankDetails?.accountNumber),
    ifscCode: toInputValue(initialData?.bankDetails?.ifscCode),
    upiId: toInputValue(initialData?.bankDetails?.upiId),
    // New document fields
    logo: toInputValue(initialData?.documentInfo?.logoUrl),
    aadhaar: toInputValue(
      initialData?.documentInfo?.documents?.find(
        (d) => d.documentType === "aadhaar",
      )?.documentUrl,
    ),
    pan: toInputValue(
      initialData?.documentInfo?.documents?.find(
        (d) => d.documentType === "pan",
      )?.documentUrl,
    ),
    certificates: normalizeStringArray(
      initialData?.documentInfo?.documents
        ?.filter((d) => d.documentType === "certificate")
        .map((d) => d.documentUrl) || [],
    ),
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

  return {
    id: String(id),
    name: String(name || id),
  };
};

export default function WorkerForm({
  mode = "create",
  initialData,
  loading = false,
  submitLabel,
  onSubmit,
  enableSkillLookup = false,
}) {
  const [form, setForm] = useState(() =>
    initialData ? normalizeInitialData(initialData) : emptyForm,
  );
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryOptionsMap, setSubCategoryOptionsMap] = useState({});
  const [subCategoryLoadingMap, setSubCategoryLoadingMap] = useState({});

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
        const options = response
          .map((item) => normalizeSkillOption(item))
          .filter(Boolean);
        setCategoryOptions(options);
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
      if (!enableSkillLookup || !categoryId) return;

      if (subCategoryOptionsMap[categoryId]) return;

      try {
        setSubCategoryLoadingMap((prev) => ({ ...prev, [categoryId]: true }));
        const response = await getSubCategorySkillsByCategoryId(categoryId);
        const options = response
          .map((item) => normalizeSkillOption(item))
          .filter(Boolean);

        setSubCategoryOptionsMap((prev) => ({
          ...prev,
          [categoryId]: options,
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

    const uniqueCategoryIds = Array.from(
      new Set(
        form.categories
          .map((category) => String(category.categoryId || "").trim())
          .filter(Boolean),
      ),
    );

    uniqueCategoryIds.forEach((categoryId) => {
      fetchSubCategories(categoryId);
    });
  }, [enableSkillLookup, fetchSubCategories, form.categories]);

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, currentIndex) => {
        if (currentIndex !== index) return category;

        if (key === "categoryId") {
          return {
            ...category,
            categoryId: value,
            subCategoryIds: [],
          };
        }

        return { ...category, [key]: value };
      }),
    }));

    if (key === "categoryId" && value) {
      fetchSubCategories(value);
    }
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
        if (checked) {
          existingIds.add(safeId);
        } else {
          existingIds.delete(safeId);
        }

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
    if (!name) {
      throw new Error("Worker name is required.");
    }

    const categories = form.categories
      .map((category) => {
        const categoryId = category.categoryId.trim();
        if (!categoryId) return null;

        return {
          categoryId,
          experienceYears: toOptionalNumber(category.experienceYears),
          subCategoryIds: normalizeStringArray(category.subCategoryIds),
        };
      })
      .filter(Boolean);

    const bankDetails =
      toOptionalString(form.bankName) ||
      toOptionalString(form.accountHolderName) ||
      toOptionalString(form.accountNumber) ||
      toOptionalString(form.ifscCode) ||
      toOptionalString(form.upiId)
        ? {
            bankName: toOptionalString(form.bankName),
            accountHolderName: toOptionalString(form.accountHolderName),
            accountNumber: toOptionalString(form.accountNumber),
            ifscCode: toOptionalString(form.ifscCode),
            upiId: toOptionalString(form.upiId),
          }
        : null;

    // Build documents array from new fields
    const documents = [];
    if (toOptionalString(form.aadhaar)) {
      documents.push({
        documentType: "aadhaar",
        documentUrl: toOptionalString(form.aadhaar),
      });
    }
    if (toOptionalString(form.pan)) {
      documents.push({
        documentType: "pan",
        documentUrl: toOptionalString(form.pan),
      });
    }
    form.certificates.filter(Boolean).forEach((certUrl) => {
      documents.push({ documentType: "certificate", documentUrl: certUrl });
    });

    const documentInfo =
      toOptionalString(form.logo) || documents.length > 0
        ? {
            logoUrl: toOptionalString(form.logo),
            documents,
          }
        : null;

    return {
      name,
      countryCode: toOptionalString(form.countryCode),
      authNumber: toOptionalString(form.authNumber),
      categories,
      address: toOptionalString(form.address),
      city: toOptionalString(form.city),
      state: toOptionalString(form.state),
      pincode: toOptionalString(form.pincode),
      latitude: toOptionalNumber(form.latitude),
      longitude: toOptionalNumber(form.longitude),
      bankDetails,
      documentInfo,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const payload = buildPayload();
      await onSubmit(payload);
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

        {error ? (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

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
              Auth Number
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
            <Plus size={16} />
            Add Category
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
                        placeholder="123e4567-e89b-12d3-a456-426614174000"
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
                        className={`max-h-36 overflow-auto rounded-lg border border-gray-300 bg-white p-2 ${
                          loading || !selectedCategoryId || isSubCategoryLoading
                            ? "opacity-60"
                            : ""
                        }`}
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

                    {enableSkillLookup ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {isSubCategoryLoading
                          ? "Loading sub categories..."
                          : "You can select multiple sub categories."}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                    Remove
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
              value={form.latitude}
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
              value={form.longitude}
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
        <h3 className="text-base font-semibold text-gray-800">Bank Details</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Bank Name
            </label>
            <input
              type="text"
              value={form.bankName}
              onChange={(event) =>
                handleFieldChange("bankName", event.target.value)
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
              value={form.accountHolderName}
              onChange={(event) =>
                handleFieldChange("accountHolderName", event.target.value)
              }
              placeholder="Sangeetha S"
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
              value={form.accountNumber}
              onChange={(event) =>
                handleFieldChange("accountNumber", event.target.value)
              }
              placeholder="1234567890"
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
              value={form.ifscCode}
              onChange={(event) =>
                handleFieldChange("ifscCode", event.target.value)
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
              value={form.upiId}
              onChange={(event) =>
                handleFieldChange("upiId", event.target.value)
              }
              placeholder="name@bank"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">Documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload required documents. Drag and drop or click to browse.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Logo Upload */}
          <FileUploadComponent
            documentType="logo"
            value={form.logo}
            onChange={(value) => handleFieldChange("logo", value)}
            disabled={loading}
          />

          {/* Aadhaar Card Upload */}
          <FileUploadComponent
            documentType="aadhaar"
            value={form.aadhaar}
            onChange={(value) => handleFieldChange("aadhaar", value)}
            disabled={loading}
          />

          {/* PAN Card Upload */}
          <FileUploadComponent
            documentType="pan"
            value={form.pan}
            onChange={(value) => handleFieldChange("pan", value)}
            disabled={loading}
          />

          {/* Certificates Upload (Multiple) */}
          <div className="md:col-span-2">
            <FileUploadComponent
              documentType="certificate"
              value={form.certificates}
              onChange={(value) => handleFieldChange("certificates", value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

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
