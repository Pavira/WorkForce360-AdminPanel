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
  MapPin,
  Landmark,
  FileText,
} from "lucide-react";
import {
  getCompanyById,
  approveCompany,
  unapproveCompany,
  rejectCompany,
} from "@/services/company_service";
import PageHeader from "@/components/ui/PageHeader";

export default function ViewCompany() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCompanyDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCompanyById(companyId);
      if (response) {
        setCompany(response);
      } else {
        throw new Error("Failed to fetch company details");
      }
    } catch (err) {
      setError("Failed to load company details");
      console.error("Error fetching company:", err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  const handleApprove = async () => {
    try {
      setActionLoading("approve");
      await approveCompany(companyId);
      navigate("/companies");
    } catch (err) {
      console.error("Error approving company:", err);
      setError("Failed to approve company");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnapprove = async () => {
    try {
      setActionLoading("unapprove");
      await unapproveCompany(companyId);
      navigate("/companies");
    } catch (err) {
      console.error("Error unapproving company:", err);
      setError("Failed to unapprove company");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading("reject");
      await rejectCompany(companyId);
      fetchCompanyDetails();
    } catch (err) {
      console.error("Error rejecting company:", err);
      setError("Failed to reject company");
    } finally {
      setActionLoading(null);
    }
  };

  const display = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
  };

  const InfoCard = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800 break-words">
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
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Company not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 shadow-lg md:p-6">
        <PageHeader
          title="Company Details 🏢"
          subtitle="Clean view of all company information"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/companies/${companyId}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                onClick={() => navigate("/companies")}
                className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          }
        />

        {/* Basic Details */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <SectionHeader
            icon={Building2}
            emoji="🧾"
            title="Basic Details"
            subtitle="Core Profile"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoCard label="Company Name" value={company.company_name} />
            <InfoCard label="Industry" value={company.industry_name} />
            <InfoCard label="GST Number" value={company.gst_number} />
            <InfoCard label="Status" value={company.status} />
            <InfoCard label="Auth Phone" value={company.auth_phone} />
            <InfoCard
              label="Contact Person Name"
              value={company.contact_person_name}
            />
            <InfoCard
              label="Contact Phone"
              value={
                company.contact_country_code && company.contact_phone
                  ? `${company.contact_country_code} ${company.contact_phone}`
                  : "-"
              }
            />
            <InfoCard label="Contact Email" value={company.contact_email} />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Logo
            </p>
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt="Company Logo"
                className="mt-2 h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <p className="mt-1 text-sm font-medium text-slate-800">-</p>
            )}
          </div>
        </div>

        {/* Address Details */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <SectionHeader
            icon={MapPin}
            emoji="📍"
            title="Address Details"
            subtitle="Locations"
          />
          {company.addresses && company.addresses.length > 0 ? (
            company.addresses.map((address, index) => (
              <div
                key={address.id || index}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
              >
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                  Address {index + 1} 🏙️
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard label="Address" value={address.address} />
                  <InfoCard label="Unit Name" value={address.unit_name} />
                  <InfoCard label="City" value={address.city} />
                  <InfoCard label="State" value={address.state} />
                  <InfoCard label="Pincode" value={address.pincode} />
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              -
            </p>
          )}
        </div>

        {/* Bank Details */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <SectionHeader
            icon={Landmark}
            emoji="🏦"
            title="Bank Details"
            subtitle="Payment Setup"
          />
          {company.bank_details && company.bank_details.length > 0 ? (
            company.bank_details.map((bank, index) => (
              <div
                key={bank.id || index}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
              >
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                  Bank Account {index + 1} 💳
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard label="Bank Name" value={bank.bank_name} />
                  <InfoCard
                    label="Account Holder Name"
                    value={bank.account_holder_name}
                  />
                  <InfoCard
                    label="Account Number"
                    value={bank.account_number}
                  />
                  <InfoCard label="IFSC Code" value={bank.ifsc_code} />
                  <InfoCard label="UPI ID" value={bank.upi_id} />
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              -
            </p>
          )}
        </div>

        {/* Documents */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-4 md:p-5">
          <SectionHeader
            icon={FileText}
            emoji="📁"
            title="Documents"
            subtitle="Attachments"
          />
          {company.documents && company.documents.length > 0 ? (
            company.documents.map((doc, index) => (
              <div
                key={doc.id || index}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 last:mb-0"
              >
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                  Document {index + 1} 📄
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

        {/* Action Buttons */}
        <div className="mb-2 flex flex-wrap gap-3">
          <button
            onClick={handleApprove}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle size={18} />
            {actionLoading === "approve" ? "Approving..." : "Approve ✅"}
          </button>
          <button
            onClick={handleUnapprove}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition duration-200 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AlertTriangle size={18} />
            {actionLoading === "unapprove" ? "Unapproving..." : "Unapprove ⚠️"}
          </button>
          {/* <button
            onClick={handleReject}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle size={18} />
            {actionLoading === "reject" ? "Rejecting..." : "Reject ❌"}
          </button> */}
        </div>
      </div>
    </DashboardLayout>
  );
}
