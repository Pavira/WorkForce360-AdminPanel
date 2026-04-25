import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  X,
  Briefcase,
  Clock3,
  Users,
  Wallet,
  Phone,
  ShieldCheck,
  Database,
  Search,
  Building2,
  MapPin,
  Landmark,
  FileText,
  Activity,
} from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import {
  getJobById,
  getNearestWorkersByJobId,
  assignWorkerToJob,
} from "@/services/jobService";
import { getWorkerById } from "@/services/workerService";

const isPrimitive = (value) =>
  value === null ||
  value === undefined ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

const toLabel = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const isUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

const isImageUrl = (value) =>
  isUrl(value) && /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value.trim());

function InfoCard({ label, value }) {
  const finalValue = displayValue(value);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {isImageUrl(finalValue) ? (
        <img
          src={finalValue}
          alt={label}
          className="mt-2 h-24 w-24 rounded-lg border border-slate-200 object-cover"
        />
      ) : isUrl(finalValue) ? (
        <a
          href={finalValue}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block break-all text-sm font-medium text-blue-600 transition hover:text-blue-800"
        >
          {finalValue}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-medium text-slate-800">
          {finalValue}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Icon size={16} />
          </span>
        ) : null}
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {subtitle}
      </div>
    </div>
  );
}

function DynamicObjectGrid({ data }) {
  const entries = Object.entries(data || {});
  if (!entries.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
        -
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => {
        if (isPrimitive(value)) {
          return <InfoCard key={key} label={toLabel(key)} value={value} />;
        }

        if (Array.isArray(value)) {
          return (
            <InfoCard
              key={key}
              label={toLabel(key)}
              value={
                value.length === 0
                  ? "-"
                  : value.every(isPrimitive)
                    ? value.map(displayValue).join(", ")
                    : JSON.stringify(value)
              }
            />
          );
        }

        return (
          <InfoCard
            key={key}
            label={toLabel(key)}
            value={JSON.stringify(value)}
          />
        );
      })}
    </div>
  );
}

function DynamicArraySection({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
        -
      </p>
    );
  }

  if (items.every(isPrimitive)) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InfoCard label={title} value={items.map(displayValue).join(", ")} />
      </div>
    );
  }

  return items.map((item, index) => (
    <div
      key={item?.id || index}
      className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
    >
      <h4 className="mb-3 text-sm font-semibold text-slate-700">
        {title} {index + 1}
      </h4>
      {isPrimitive(item) ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoCard label={title} value={item} />
        </div>
      ) : (
        <DynamicObjectGrid data={item} />
      )}
    </div>
  ));
}

const JOB_SECTIONS = [
  {
    title: "Basic Job Info",
    subtitle: "Core Job Identity",
    icon: Briefcase,
    fields: [
      "id",
      "status",
      "is_active",
      "company_id",
      "company_name",
      "skill_category_id",
      "skill_category_name",
      "sub_category_id",
      "sub_category_name",
      "industry_type_id",
      "industry_type_name",
      "assigned_worker_id",
      "assigned_worker_name",
      "description",
    ],
  },
  {
    title: "Timing And Duration",
    subtitle: "Schedule Lifecycle",
    icon: Clock3,
    fields: [
      "scheduled_start_datetime",
      "scheduled_end_datetime",
      "scheduled_duration",
      "duration_type",
      "shift",
      "posted_at",
      "assigned_at",
      "started_at",
      "completed_at",
      "cancelled_at",
      "created_at",
      "updated_at",
    ],
  },
  {
    title: "Workforce Requirement",
    subtitle: "People And Level",
    icon: Users,
    fields: ["workers", "tier", "experience_required"],
  },
  {
    title: "Payment Detail",
    subtitle: "Compensation Summary",
    icon: Wallet,
    fields: ["wage", "expected_total"],
  },
  {
    title: "Contact Information",
    subtitle: "Location And Contact",
    icon: Phone,
    fields: [
      "name",
      "country_code",
      "phone_number",
      "email",
      "work_address",
      "nearby_landmark",
      "latitude",
      "longitude",
    ],
  },
  {
    title: "Job Rules And Preference",
    subtitle: "Operational Preferences",
    icon: ShieldCheck,
    fields: [
      "language_preference",
      "tool_provided",
      "tool_details",
      "special_instructions",
    ],
  },
];

const pickExistingFields = (source, fields) =>
  fields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      acc[key] = source[key];
    }
    return acc;
  }, {});

const getBooleanCapsuleClass = (value) =>
  value
    ? "bg-green-100 text-green-800 border border-green-200"
    : "bg-red-100 text-red-800 border border-red-200";

const parseDistance = (distanceValue) => {
  const parsed = Number.parseFloat(distanceValue);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDistanceCapsuleClass = (distanceValue) => {
  const distance = parseDistance(distanceValue);
  if (distance === null)
    return "bg-slate-100 text-slate-700 border border-slate-200";
  if (distance < 10)
    return "bg-green-100 text-green-800 border border-green-200";
  if (distance < 30)
    return "bg-yellow-100 text-yellow-800 border border-yellow-200";
  return "bg-red-100 text-red-800 border border-red-200";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatBoolean = (value) => {
  if (value === null || value === undefined) return "-";
  return value ? "Yes" : "No";
};

function WorkerDetailsModal({ isOpen, onClose, worker, loading, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 shadow-2xl md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Worker Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <X size={16} />
            Close
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : !worker ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            Worker details not found.
          </p>
        ) : (
          <>
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
              <SectionHeader
                icon={Building2}
                title="Basic Details"
                subtitle="Core Profile"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard label="Worker ID" value={worker.id} />
                <InfoCard label="Firebase UID" value={worker.firebase_uid} />
                <InfoCard label="Worker Name" value={worker.name} />
                <InfoCard
                  label="Auth Number"
                  value={
                    worker.country_code && worker.auth_number
                      ? `${worker.country_code} ${worker.auth_number}`
                      : worker.auth_number
                  }
                />
                <InfoCard label="Country Code" value={worker.country_code} />
                <InfoCard
                  label="Approval Message Shown"
                  value={formatBoolean(worker.status_approval_message_shown)}
                />
                <InfoCard
                  label="Created At"
                  value={formatDate(worker.created_at)}
                />
                <InfoCard
                  label="Updated At"
                  value={formatDate(worker.updated_at)}
                />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Logo
                </p>
                {worker.logo_url ? (
                  <img
                    src={worker.logo_url}
                    alt="Worker Logo"
                    className="mt-2 h-20 w-20 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-800">-</p>
                )}
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
              <SectionHeader
                icon={Briefcase}
                title="Category Details"
                subtitle="Skills and Experience"
              />
              {Array.isArray(worker.categories) &&
              worker.categories.length > 0 ? (
                worker.categories.map((category, index) => (
                  <div
                    key={category.categoryId || index}
                    className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
                  >
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">
                      Category {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InfoCard
                        label="Category Name"
                        value={category.categoryName}
                      />
                      <InfoCard
                        label="Experience (Years)"
                        value={category.experienceYears}
                      />
                      <InfoCard
                        label="Sub Categories"
                        value={
                          Array.isArray(category.subCategoryNames) &&
                          category.subCategoryNames.length > 0
                            ? category.subCategoryNames.join(", ")
                            : "-"
                        }
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  -
                </p>
              )}
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
              <SectionHeader
                icon={MapPin}
                title="Address Details"
                subtitle="Locations"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard label="Address" value={worker.address} />
                <InfoCard label="City" value={worker.city} />
                <InfoCard label="State" value={worker.state} />
                <InfoCard label="Pincode" value={worker.pincode} />
                <InfoCard label="Latitude" value={worker.latitude} />
                <InfoCard label="Longitude" value={worker.longitude} />
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
              <SectionHeader
                icon={Landmark}
                title="Bank Details"
                subtitle="Payment Setup"
              />
              {Array.isArray(worker.bank_details) &&
              worker.bank_details.length > 0 ? (
                worker.bank_details.map((bank, index) => (
                  <div
                    key={bank.id || index}
                    className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
                  >
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">
                      Bank Account {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InfoCard
                        label="Bank Name"
                        value={bank.bank_name || bank.bankName}
                      />
                      <InfoCard
                        label="Account Holder Name"
                        value={
                          bank.account_holder_name || bank.accountHolderName
                        }
                      />
                      <InfoCard
                        label="Account Number"
                        value={bank.account_number || bank.accountNumber}
                      />
                      <InfoCard
                        label="IFSC Code"
                        value={bank.ifsc_code || bank.ifsc}
                      />
                      <InfoCard
                        label="UPI ID"
                        value={bank.upi_id || bank.upiId}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  -
                </p>
              )}
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
              <SectionHeader
                icon={FileText}
                title="Documents"
                subtitle="Attachments"
              />
              {Array.isArray(worker.documents) &&
              worker.documents.length > 0 ? (
                worker.documents.map((doc, index) => (
                  <div
                    key={doc.id || index}
                    className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
                  >
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">
                      Document {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InfoCard
                        label="Document Type"
                        value={doc.document_type}
                      />
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Document URL
                        </p>
                        {doc.document_url ? (
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-sm font-medium text-blue-600 transition hover:text-blue-800"
                          >
                            View Document
                          </a>
                        ) : (
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            -
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  -
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
              <SectionHeader
                icon={Activity}
                title="Live Status"
                subtitle="Realtime Flags"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard label="Status" value={worker.status} />
                <InfoCard
                  label="Is Active"
                  value={formatBoolean(worker.is_active)}
                />
                <InfoCard
                  label="Is Online"
                  value={formatBoolean(worker.is_online)}
                />
                <InfoCard
                  label="Is Available"
                  value={formatBoolean(worker.is_available)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ViewJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nearestWorkers, setNearestWorkers] = useState([]);
  const [nearestWorkersLoading, setNearestWorkersLoading] = useState(false);
  const [nearestWorkersError, setNearestWorkersError] = useState(null);
  const [assigningWorkerId, setAssigningWorkerId] = useState(null);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [workerModalLoading, setWorkerModalLoading] = useState(false);
  const [workerModalError, setWorkerModalError] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getJobById(jobId);
      if (response) {
        setJob(response);
      } else {
        throw new Error("Failed to fetch job details");
      }
    } catch (err) {
      setError("Failed to load job details");
      console.error("Error fetching job:", err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleSearchWorkers = async () => {
    try {
      setNearestWorkersLoading(true);
      setNearestWorkersError(null);
      const workers = await getNearestWorkersByJobId(jobId, { limit: 50 });
      setNearestWorkers(Array.isArray(workers) ? workers : []);
    } catch (err) {
      console.error("Error fetching nearest workers:", err);
      setNearestWorkers([]);
      setNearestWorkersError(
        err?.message || "Failed to load nearest workers. Please try again.",
      );
    } finally {
      setNearestWorkersLoading(false);
    }
  };

  const handleAssignWorker = async (workerId) => {
    try {
      setAssigningWorkerId(workerId);
      setNearestWorkersError(null);
      await assignWorkerToJob(jobId, workerId);
      window.location.reload();
    } catch (err) {
      console.error("Error assigning worker:", err);
      setNearestWorkersError(
        err?.message || "Failed to assign worker. Please try again.",
      );
    } finally {
      setAssigningWorkerId(null);
    }
  };

  const handleOpenWorkerModal = async (workerId) => {
    if (!workerId) return;

    try {
      setWorkerModalOpen(true);
      setWorkerModalLoading(true);
      setWorkerModalError(null);
      setSelectedWorker(null);

      const workerDetails = await getWorkerById(workerId);
      setSelectedWorker(workerDetails || null);
    } catch (err) {
      console.error("Error fetching worker details:", err);
      setWorkerModalError(
        err?.message || "Failed to load worker details. Please try again.",
      );
    } finally {
      setWorkerModalLoading(false);
    }
  };

  const handleCloseWorkerModal = () => {
    setWorkerModalOpen(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const usedFieldKeys = new Set(
    JOB_SECTIONS.flatMap((section) => section.fields),
  );
  const sectionData = JOB_SECTIONS.map((section) => ({
    ...section,
    values: pickExistingFields(job, section.fields),
  }));

  const additionalPrimitiveEntries = Object.fromEntries(
    Object.entries(job).filter(
      ([key, value]) => isPrimitive(value) && !usedFieldKeys.has(key),
    ),
  );
  const nestedObjectEntries = Object.entries(job).filter(
    ([, value]) => value && typeof value === "object" && !Array.isArray(value),
  );
  const nestedArrayEntries = Object.entries(job).filter(([, value]) =>
    Array.isArray(value),
  );

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 shadow-lg md:p-6">
        <PageHeader
          title="Job Details"
          subtitle="View of all job information from backend response"
          action={
            <button
              onClick={() => navigate("/jobs")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          }
        />

        {sectionData.map((section) => (
          <div
            key={section.title}
            className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5"
          >
            <SectionHeader
              icon={section.icon}
              title={section.title}
              subtitle={section.subtitle}
            />
            <DynamicObjectGrid data={section.values} />
          </div>
        ))}

        {Object.keys(additionalPrimitiveEntries).length > 0 ? (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
            <SectionHeader
              icon={Database}
              title="Additional Details"
              subtitle="Other Root Fields"
            />
            <DynamicObjectGrid data={additionalPrimitiveEntries} />
          </div>
        ) : null}

        {nestedObjectEntries.map(([key, value]) => (
          <div
            key={key}
            className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5"
          >
            <SectionHeader
              icon={Database}
              title={toLabel(key)}
              subtitle="Nested Object"
            />
            <DynamicObjectGrid data={value} />
          </div>
        ))}

        {nestedArrayEntries.map(([key, value]) => (
          <div
            key={key}
            className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5"
          >
            <SectionHeader
              icon={Database}
              title={toLabel(key)}
              subtitle="List Data"
            />
            <DynamicArraySection title={toLabel(key)} items={value} />
          </div>
        ))}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-800">Find Workers</h3>
            <button
              type="button"
              onClick={handleSearchWorkers}
              disabled={nearestWorkersLoading || Boolean(assigningWorkerId)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={16} />
              {nearestWorkersLoading ? "Searching..." : "Search Workers"}
            </button>
          </div>

          {nearestWorkersError ? (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {nearestWorkersError}
            </div>
          ) : null}

          {nearestWorkersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : nearestWorkers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Click `Search Workers` to fetch nearest workers for this job.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Worker ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Is Online
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Is Available
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Distance (km)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nearestWorkers.map((worker) => {
                    const isOnline = Boolean(worker?.is_online);
                    const isAvailable = Boolean(worker?.is_available);
                    const canAssign = isOnline && isAvailable;

                    return (
                      <tr
                        key={worker?.worker_id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {worker?.worker_id ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWorkerModal(worker.worker_id)
                              }
                              className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
                            >
                              {worker.worker_id}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {worker?.worker_id ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWorkerModal(worker.worker_id)
                              }
                              className="font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
                            >
                              {worker?.worker_name || "-"}
                            </button>
                          ) : (
                            worker?.worker_name || "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {worker?.phone_number || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getBooleanCapsuleClass(
                              isOnline,
                            )}`}
                          >
                            {isOnline ? "TRUE" : "FALSE"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getBooleanCapsuleClass(
                              isAvailable,
                            )}`}
                          >
                            {isAvailable ? "TRUE" : "FALSE"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getDistanceCapsuleClass(
                              worker?.distance_in_km,
                            )}`}
                          >
                            {worker?.distance_in_km ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignWorker(worker?.worker_id)
                            }
                            disabled={
                              // !worker?.worker_id ||
                              // !canAssign ||
                              assigningWorkerId !== null
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              canAssign
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {assigningWorkerId === worker?.worker_id
                              ? "Assigning..."
                              : "Assign Worker"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <WorkerDetailsModal
        isOpen={workerModalOpen}
        onClose={handleCloseWorkerModal}
        worker={selectedWorker}
        loading={workerModalLoading}
        error={workerModalError}
      />
    </DashboardLayout>
  );
}
