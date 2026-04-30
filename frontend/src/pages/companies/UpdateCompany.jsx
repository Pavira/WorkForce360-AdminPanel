import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import CompanyForm from "./CompanyForm";
import {
  getCompanyById,
  getIndustries,
  updateCompany,
} from "@/services/company_service";

const mapCompanyToFormData = (company) => ({
  companyName: company?.company_name || company?.companyName || "",
  authPhone: company?.auth_phone || company?.authPhone || "",
  countryCode: company?.country_code || company?.countryCode || "+91",
  industryId: company?.industry_id || company?.industryId || "",
  gstNo: company?.gst_number || company?.gstNo || "",
  addresses: Array.isArray(company?.addresses)
    ? company.addresses.map((address) => ({
        address: address?.address || "",
        unitName: address?.unit_name || address?.unitName || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        latitude: address?.latitude ?? 0,
        longitude: address?.longitude ?? 0,
      }))
    : [],
  contactInfo: {
    contactPersonName:
      company?.contact_person_name || company?.contactInfo?.contactPersonName || "",
    contactCountryCode:
      company?.contact_country_code || company?.contactInfo?.contactCountryCode || "+91",
    contactPersonPhone:
      company?.contact_phone || company?.contactInfo?.contactPersonPhone || "",
    contactEmail: company?.contact_email || company?.contactInfo?.contactEmail || "",
  },
  documentInfo: {
    logoUrl: company?.logo_url || company?.documentInfo?.logoUrl || "",
    documents: Array.isArray(company?.documents)
      ? company.documents.map((doc) => ({
          documentType: doc?.document_type || doc?.documentType || "",
          documentUrl: doc?.document_url || doc?.documentUrl || "",
        }))
      : [],
  },
  bankDetails: {
    bankName:
      company?.bank_details?.[0]?.bank_name ||
      company?.bankDetails?.bankName ||
      "",
    accountHolderName:
      company?.bank_details?.[0]?.account_holder_name ||
      company?.bankDetails?.accountHolderName ||
      "",
    accountNumber:
      company?.bank_details?.[0]?.account_number ||
      company?.bankDetails?.accountNumber ||
      "",
    ifscCode:
      company?.bank_details?.[0]?.ifsc_code || company?.bankDetails?.ifscCode || "",
    upiId: company?.bank_details?.[0]?.upi_id || company?.bankDetails?.upiId || "",
  },
  firebase_uid: company?.firebase_uid || company?.firebaseUid || "",
});

export default function UpdateCompany() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [industryOptions, setIndustryOptions] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getCompanyById(companyId);
        setCompany(response || null);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load company details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setIndustryLoading(true);
        const response = await getIndustries();
        setIndustryOptions(Array.isArray(response) ? response : []);
      } finally {
        setIndustryLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  const initialData = useMemo(() => mapCompanyToFormData(company), [company]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await updateCompany(companyId, payload);
      navigate(`/companies/${companyId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
          Company not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Update Company"
          subtitle="Edit company profile details"
          action={
            <button
              onClick={() => navigate(`/companies/${companyId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          }
        />

        <CompanyForm
          mode="edit"
          initialData={initialData}
          loading={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          firebaseUid={company?.firebase_uid || company?.firebaseUid || ""}
          industries={industryOptions}
          industriesLoading={industryLoading}
        />
      </div>
    </DashboardLayout>
  );
}
