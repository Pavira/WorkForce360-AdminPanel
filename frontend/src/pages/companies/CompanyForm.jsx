import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import FileUploadComponent from "@/components/fileUpload/FileUploadComponent";
import { getIndustries } from "@/services/company_service";

const createEmptyAddress = () => ({
  address: "",
  unitName: "",
  city: "",
  state: "",
  pincode: "",
  latitude: 0,
  longitude: 0,
});

const toInputValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toOptionalString = (value) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toNumberOrZero = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeInitialData = (initialData = {}, firebaseUid = "") => {
  const addresses = Array.isArray(initialData?.addresses)
    ? initialData.addresses.map((address) => ({
        address: toInputValue(address?.address),
        unitName: toInputValue(address?.unitName || address?.unit_name),
        city: toInputValue(address?.city),
        state: toInputValue(address?.state),
        pincode: toInputValue(address?.pincode),
        latitude: toNumberOrZero(address?.latitude),
        longitude: toNumberOrZero(address?.longitude),
      }))
    : [];

  const documentInfo = initialData?.documentInfo || {};

  return {
    firebase_uid: toInputValue(initialData?.firebase_uid || firebaseUid),
    companyName: toInputValue(
      initialData?.companyName || initialData?.company_name,
    ),
    authPhone: toInputValue(initialData?.authPhone || initialData?.auth_phone),
    countryCode: toInputValue(initialData?.countryCode || "+91"),
    industryId: toInputValue(
      initialData?.industryId || initialData?.industry_id,
    ),
    gstNo: toInputValue(initialData?.gstNo || initialData?.gst_number),
    addresses: addresses.length > 0 ? addresses : [createEmptyAddress()],
    contactInfo: {
      contactPersonName: toInputValue(
        initialData?.contactInfo?.contactPersonName ||
          initialData?.contact_person_name,
      ),
      contactCountryCode: toInputValue(
        initialData?.contactInfo?.contactCountryCode ||
          initialData?.contact_country_code ||
          "+91",
      ),
      contactPersonPhone: toInputValue(
        initialData?.contactInfo?.contactPersonPhone ||
          initialData?.contact_phone,
      ),
      contactEmail: toInputValue(
        initialData?.contactInfo?.contactEmail || initialData?.contact_email,
      ),
    },
    documentInfo: {
      logoUrl: toInputValue(documentInfo?.logoUrl || initialData?.logo_url),
      documents: Array.isArray(documentInfo?.documents)
        ? documentInfo.documents
            .map((doc) => ({
              documentType: toInputValue(
                doc?.documentType || doc?.document_type,
              ).toUpperCase(),
              documentUrl: toInputValue(doc?.documentUrl || doc?.document_url),
            }))
            .filter((doc) => doc.documentType && doc.documentUrl)
        : [],
    },
    bankDetails: {
      bankName: toInputValue(
        initialData?.bankDetails?.bankName ||
          initialData?.bank_details?.bank_name ||
          initialData?.bank_details?.[0]?.bank_name,
      ),
      accountHolderName: toInputValue(
        initialData?.bankDetails?.accountHolderName ||
          initialData?.bank_details?.account_holder_name ||
          initialData?.bank_details?.[0]?.account_holder_name,
      ),
      accountNumber: toInputValue(
        initialData?.bankDetails?.accountNumber ||
          initialData?.bank_details?.account_number ||
          initialData?.bank_details?.[0]?.account_number,
      ),
      ifscCode: toInputValue(
        initialData?.bankDetails?.ifscCode ||
          initialData?.bank_details?.ifsc_code ||
          initialData?.bank_details?.[0]?.ifsc_code,
      ),
      upiId: toInputValue(
        initialData?.bankDetails?.upiId ||
          initialData?.bank_details?.upi_id ||
          initialData?.bank_details?.[0]?.upi_id,
      ),
    },
  };
};

const normalizeIndustryOption = (item) => {
  if (!item || typeof item !== "object") return null;
  const id =
    item.id || item.industry_id || item.industryId || item.industry_type_id;
  const name =
    item.name ||
    item.industry_name ||
    item.industryName ||
    item.industry_type_name ||
    item.industryTypeName;
  if (!id) return null;
  return { id: String(id), name: String(name || id) };
};

export default function CompanyForm({
  mode = "create",
  initialData,
  loading = false,
  submitLabel,
  onSubmit,
  firebaseUid,
  industries = [],
  industriesLoading = false,
}) {
  const [form, setForm] = useState(() =>
    normalizeInitialData(initialData || {}, firebaseUid || ""),
  );
  const [localIndustries, setLocalIndustries] = useState([]);
  const [localIndustriesLoading, setLocalIndustriesLoading] = useState(false);
  const [industryError, setIndustryError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(normalizeInitialData(initialData || {}, firebaseUid || ""));
  }, [initialData, firebaseUid]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLocalIndustriesLoading(true);
        setIndustryError("");
        const response = await getIndustries();
        setLocalIndustries(Array.isArray(response) ? response : []);
      } catch (fetchError) {
        setLocalIndustries([]);
        setIndustryError(
          fetchError?.message || "Failed to load industry types.",
        );
      } finally {
        setLocalIndustriesLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  const resolvedIndustries = useMemo(
    () => (industries.length > 0 ? industries : localIndustries),
    [industries, localIndustries],
  );

  const isIndustryLoading = industriesLoading || localIndustriesLoading;

  const industryOptions = useMemo(
    () =>
      resolvedIndustries
        .map((item) => normalizeIndustryOption(item))
        .filter(Boolean),
    [resolvedIndustries],
  );

  const primaryLabel =
    submitLabel || (mode === "edit" ? "Update Company" : "Create Company");
  const sectionTitle = useMemo(
    () =>
      mode === "edit"
        ? "Update company profile details"
        : "Register a new company profile",
    [mode],
  );

  const handleAddressChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, currentIndex) =>
        currentIndex === index ? { ...address, [key]: value } : address,
      ),
    }));
  };

  const addAddress = () => {
    setForm((prev) => ({
      ...prev,
      addresses: [...prev.addresses, createEmptyAddress()],
    }));
  };

  const removeAddress = (index) => {
    setForm((prev) => {
      const nextAddresses = prev.addresses.filter(
        (_, currentIndex) => currentIndex !== index,
      );
      return {
        ...prev,
        addresses: nextAddresses.length
          ? nextAddresses
          : [createEmptyAddress()],
      };
    });
  };

  const setDocumentsByType = (documentType, documentUrls) => {
    const normalizedType = String(documentType || "")
      .trim()
      .toUpperCase();
    const safeUrls = []
      .concat(documentUrls || [])
      .map((url) => String(url || "").trim())
      .filter(Boolean);

    setForm((prev) => {
      const withoutType = (prev.documentInfo.documents || []).filter(
        (doc) =>
          String(doc.documentType || "").toUpperCase() !== normalizedType,
      );
      const withType = safeUrls.map((url) => ({
        documentType: normalizedType,
        documentUrl: url,
      }));
      return {
        ...prev,
        documentInfo: {
          ...prev.documentInfo,
          documents: [...withoutType, ...withType],
        },
      };
    });
  };

  const docUrlsForType = (documentType) =>
    (form.documentInfo.documents || [])
      .filter(
        (doc) =>
          String(doc.documentType || "").toUpperCase() ===
          String(documentType || "").toUpperCase(),
      )
      .map((doc) => doc.documentUrl)
      .filter(Boolean);

  const buildPayload = () => {
    const companyName = String(form.companyName || "").trim();
    if (!companyName) throw new Error("Company name is required.");

    const authPhone = toOptionalString(form.authPhone);
    if (!authPhone) throw new Error("Auth phone is required.");
    const countryCode = toOptionalString(form.countryCode);
    if (!countryCode) throw new Error("Country code is required.");

    const industryId = String(form.industryId || "").trim();
    if (!industryId) throw new Error("Industry is required.");

    const logoUrl = toOptionalString(form.documentInfo.logoUrl);
    if (!logoUrl) throw new Error("Logo upload is required.");

    return {
      companyName,
      countryCode,
      industryId,
      authPhone,
      gstNo: toOptionalString(form.gstNo),
      addresses: form.addresses.map((address) => ({
        address: toOptionalString(address.address),
        unitName: toOptionalString(address.unitName),
        city: toOptionalString(address.city),
        state: toOptionalString(address.state),
        pincode: toOptionalString(address.pincode),
        latitude: toNumberOrZero(address.latitude),
        longitude: toNumberOrZero(address.longitude),
      })),
      contactInfo: {
        contactPersonName: toOptionalString(form.contactInfo.contactPersonName),
        contactCountryCode: toOptionalString(
          form.contactInfo.contactCountryCode,
        ),
        contactPersonPhone: toOptionalString(
          form.contactInfo.contactPersonPhone,
        ),
        contactEmail: toOptionalString(form.contactInfo.contactEmail),
      },
      documentInfo: {
        logoUrl,
        documents: (form.documentInfo.documents || [])
          .map((doc) => ({
            documentType: String(doc.documentType || "")
              .trim()
              .toUpperCase(),
            documentUrl: toOptionalString(doc.documentUrl),
          }))
          .filter((doc) => doc.documentType && doc.documentUrl),
      },
      bankDetails: {
        bankName: toOptionalString(form.bankDetails.bankName),
        accountHolderName: toOptionalString(form.bankDetails.accountHolderName),
        accountNumber: toOptionalString(form.bankDetails.accountNumber),
        ifscCode: toOptionalString(form.bankDetails.ifscCode),
        upiId: toOptionalString(form.bankDetails.upiId),
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
          "Failed to submit the company details. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">Basic Info 🏢</h3>
        <p className="mt-1 text-sm text-gray-600">{sectionTitle}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Company Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  companyName: event.target.value,
                }))
              }
              placeholder="ABC Private Limited"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Auth Phone <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.authPhone || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  authPhone: event.target.value,
                }))
              }
              placeholder="+919876543210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Country Code <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.countryCode || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  countryCode: event.target.value,
                }))
              }
              placeholder="+91"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Industry <span className="text-red-600">*</span>
            </label>
            {industryError ? (
              <p className="mb-2 text-xs text-amber-600">{industryError}</p>
            ) : null}
            <select
              value={form.industryId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  industryId: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading || isIndustryLoading}
              required
            >
              <option value="">
                {isIndustryLoading
                  ? "Loading industry types..."
                  : "Select Industry Type"}
              </option>
              {industryOptions.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              GST Number
            </label>
            <input
              type="text"
              value={form.gstNo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gstNo: event.target.value }))
              }
              placeholder="29ABCDE1234F1Z5"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">
          Contact Info 📞
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Contact person name"
            value={form.contactInfo.contactPersonName}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                contactInfo: {
                  ...prev.contactInfo,
                  contactPersonName: event.target.value,
                },
              }))
            }
            disabled={loading}
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="+91"
            value={form.contactInfo.contactCountryCode}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                contactInfo: {
                  ...prev.contactInfo,
                  contactCountryCode: event.target.value,
                },
              }))
            }
            disabled={loading}
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Contact phone"
            value={form.contactInfo.contactPersonPhone}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                contactInfo: {
                  ...prev.contactInfo,
                  contactPersonPhone: event.target.value,
                },
              }))
            }
            disabled={loading}
          />
          <input
            type="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="contact@company.com"
            value={form.contactInfo.contactEmail}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                contactInfo: {
                  ...prev.contactInfo,
                  contactEmail: event.target.value,
                },
              }))
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800">
            Address 🗺️ <span className="text-red-600">*</span>
          </h3>
          <button
            type="button"
            onClick={addAddress}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
            disabled={loading}
          >
            <Plus size={16} /> Add Address
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {form.addresses.map((address, index) => (
            <div
              key={`address-${index}`}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 md:col-span-2"
                  placeholder="Address"
                  value={address.address}
                  onChange={(event) =>
                    handleAddressChange(index, "address", event.target.value)
                  }
                  disabled={loading}
                  required
                />
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Unit Name"
                  value={address.unitName}
                  onChange={(event) =>
                    handleAddressChange(index, "unitName", event.target.value)
                  }
                  disabled={loading}
                  required
                />
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="City"
                  value={address.city}
                  onChange={(event) =>
                    handleAddressChange(index, "city", event.target.value)
                  }
                  disabled={loading}
                  required
                />
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="State"
                  value={address.state}
                  onChange={(event) =>
                    handleAddressChange(index, "state", event.target.value)
                  }
                  disabled={loading}
                  required
                />
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Pincode"
                  value={address.pincode}
                  onChange={(event) =>
                    handleAddressChange(index, "pincode", event.target.value)
                  }
                  disabled={loading}
                  required
                />
                <input
                  type="number"
                  step="any"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Latitude"
                  value={toInputValue(address.latitude)}
                  onChange={(event) =>
                    handleAddressChange(index, "latitude", event.target.value)
                  }
                  disabled={loading}
                />
                <input
                  type="number"
                  step="any"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Longitude"
                  value={toInputValue(address.longitude)}
                  onChange={(event) =>
                    handleAddressChange(index, "longitude", event.target.value)
                  }
                  disabled={loading}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeAddress(index)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  disabled={loading}
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">
          Bank Details 🏦
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Bank Name"
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
            disabled={loading}
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Account Holder Name"
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
            disabled={loading}
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Account Number"
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
            disabled={loading}
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="IFSC Code"
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
            disabled={loading}
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 md:col-span-2"
            placeholder="UPI ID"
            value={form.bankDetails.upiId}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, upiId: event.target.value },
              }))
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-base font-semibold text-gray-800">Documents 📁</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FileUploadComponent
            documentType="logo"
            value={form.documentInfo.logoUrl}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                documentInfo: { ...prev.documentInfo, logoUrl: value },
              }))
            }
            firebaseUid={form.firebase_uid || firebaseUid}
            disabled={loading}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FileUploadComponent
            documentType="registration_certificate"
            value={docUrlsForType("CRC")}
            onChange={(value) => setDocumentsByType("CRC", value)}
            firebaseUid={form.firebase_uid || firebaseUid}
            disabled={loading}
          />
          <FileUploadComponent
            documentType="gst_certificate"
            value={docUrlsForType("GST")}
            onChange={(value) => setDocumentsByType("GST", value)}
            firebaseUid={form.firebase_uid || firebaseUid}
            disabled={loading}
          />
          <div className="md:col-span-2">
            <FileUploadComponent
              documentType="id_proof"
              value={docUrlsForType("IDP")}
              onChange={(value) => setDocumentsByType("IDP", value)}
              firebaseUid={form.firebase_uid || firebaseUid}
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <FileUploadComponent
              documentType="CPHOTO"
              value={docUrlsForType("CPHOTO")}
              onChange={(value) => setDocumentsByType("CPHOTO", value)}
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
