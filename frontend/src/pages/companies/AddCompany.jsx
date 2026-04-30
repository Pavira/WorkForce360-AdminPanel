import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import CompanyForm from "./CompanyForm";
import { createCompany, getIndustries } from "@/services/company_service";
import { useEffect } from "react";

const stripCountryCodeFromPhone = (rawPhone = "", rawCountryCode = "") => {
  const phone = String(rawPhone || "").trim();
  const country = String(rawCountryCode || "").trim();
  if (!phone) return "";
  if (country && phone.startsWith(country)) {
    return phone.slice(country.length).trim();
  }
  return phone;
};

export default function AddCompany() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(true);

  const firebaseUid = searchParams.get("firebase_uid") || "";
  const phoneNumber = searchParams.get("phone_number") || "";
  const countryCode = searchParams.get("country_code") || "+91";

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

  const handleSubmit = async (payload) => {
    try {
      setLoading(true);
      await createCompany(payload, firebaseUid);
      navigate("/companies");
    } catch (error) {
      console.error("Failed to create company:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Add Company"
          subtitle="Create a new company profile"
          action={
            <button
              onClick={() => navigate("/companies")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          }
        />

        <CompanyForm
          mode="create"
          loading={loading}
          onSubmit={handleSubmit}
          firebaseUid={firebaseUid}
          initialData={
            phoneNumber
              ? {
                  authPhone: stripCountryCodeFromPhone(
                    phoneNumber,
                    countryCode,
                  ),
                  countryCode: countryCode || "+91",
                }
              : undefined
          }
          industries={industryOptions}
          industriesLoading={industryLoading}
        />
      </div>
    </DashboardLayout>
  );
}
