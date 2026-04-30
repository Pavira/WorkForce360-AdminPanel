import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import {
  ArrowLeft,
  Pencil,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Briefcase,
  MapPin,
  Landmark,
  FileText,
  Activity,
} from "lucide-react";
import {
  getWorkerById,
  approveWorker,
  unapproveWorker,
  rejectWorker,
} from "@/services/workerService";
import PageHeader from "@/components/ui/PageHeader";

export default function ViewWorker() {
  const navigate = useNavigate();
  const { workerId } = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWorkerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkerById(workerId);
      if (response) {
        setWorker(response);
      } else {
        throw new Error("Failed to fetch worker details");
      }
    } catch (err) {
      setError("Failed to load worker details");
      console.error("Error fetching worker:", err);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  const handleApprove = async () => {
    try {
      setActionLoading("approve");
      await approveWorker(workerId);
      navigate("/workers");
    } catch (err) {
      console.error("Error approving worker:", err);
      setError("Failed to approve worker");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnapprove = async () => {
    try {
      setActionLoading("unapprove");
      await unapproveWorker(workerId);
      navigate("/workers");
    } catch (err) {
      console.error("Error unapproving worker:", err);
      setError("Failed to unapprove worker");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading("reject");
      await rejectWorker(workerId);
      fetchWorkerDetails();
    } catch (err) {
      console.error("Error rejecting worker:", err);
      setError("Failed to reject worker");
    } finally {
      setActionLoading(null);
    }
  };

  const display = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
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

  const InfoCard = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {display(value)}
      </p>
    </div>
  );

  const SectionHeader = ({ icon, emoji, title, subtitle }) => {
    const SectionIcon = icon;

    return (
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {SectionIcon ? <SectionIcon size={14} /> : null}
          {subtitle}
        </div>
      </div>
    );
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

  if (!worker) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">Worker not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 shadow-lg md:p-6">
        <PageHeader
          title="Worker Details"
          subtitle="Clean view of all worker information"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/workers/${workerId}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                onClick={() => navigate("/workers")}
                className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          }
        />

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <SectionHeader
            icon={Building2}
            emoji="🏢"
            title="Basic Details"
            subtitle="Core Profile"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoCard label="Worker ID" value={worker.id} />
            <InfoCard label="Firebase UID" value={worker.firebase_uid} />
            <InfoCard label="Worker Name" value={worker.name} />
            {/* <InfoCard label="Status" value={worker.status} />  */}
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
            {/* <InfoCard label="Current Job ID" value={worker.current_job_id} /> */}
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
            emoji="🎯"
            title="Category Details"
            subtitle="Skills and Experience"
          />
          {worker.categories && worker.categories.length > 0 ? (
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
            emoji="📍"
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
            emoji="📌"
            title="Bank Details"
            subtitle="Payment Setup"
          />
          {worker.bank_details && worker.bank_details.length > 0 ? (
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
                    value={bank.account_holder_name || bank.accountHolderName}
                  />
                  <InfoCard
                    label="Account Number"
                    value={bank.account_number || bank.accountNumber}
                  />
                  <InfoCard
                    label="IFSC Code"
                    value={bank.ifsc_code || bank.ifsc}
                  />
                  <InfoCard label="UPI ID" value={bank.upi_id || bank.upiId} />
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
            emoji="📄"
            title="Documents"
            subtitle="Attachments"
          />
          {worker.documents && worker.documents.length > 0 ? (
            worker.documents.map((doc, index) => (
              <div
                key={doc.id || index}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
              >
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                  Document {index + 1}
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard label="Document Type" value={doc.document_type} />
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

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <SectionHeader
            icon={Activity}
            emoji="⚡"
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

        <div className="mb-2 flex flex-wrap gap-3">
          <button
            onClick={handleApprove}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle size={18} />
            {actionLoading === "approve" ? "Approving..." : "Approve"}
          </button>
          <button
            onClick={handleUnapprove}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition duration-200 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AlertTriangle size={18} />
            {actionLoading === "unapprove" ? "Unapproving..." : "Unapprove"}
          </button>
          {/* <button
            onClick={handleReject}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle size={18} />
            {actionLoading === "reject" ? "Rejecting..." : "Reject"}
          </button> */}
        </div>
      </div>
    </DashboardLayout>
  );
}
