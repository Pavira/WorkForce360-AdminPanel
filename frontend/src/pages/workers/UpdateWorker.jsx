import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkerForm from "./WorkerForm";
import { getWorkerById, updateWorker } from "@/services/workerService";

const mapWorkerToFormData = (worker) => {
  const primaryBank = Array.isArray(worker?.bank_details)
    ? worker.bank_details[0]
    : worker?.bank_details || null;

  return {
    name: worker?.name || "",
    countryCode: worker?.country_code || worker?.countryCode || "+91",
    authNumber: worker?.auth_number || worker?.authNumber || "",
    categories: Array.isArray(worker?.categories)
      ? worker.categories.map((category) => ({
          categoryId: category?.categoryId || category?.category_id || "",
          experienceYears:
            category?.experienceYears ?? category?.experience_years ?? "",
          subCategoryIds:
            category?.subCategoryIds || category?.sub_category_ids || [],
        }))
      : [],
    address: worker?.address || "",
    city: worker?.city || "",
    state: worker?.state || "",
    pincode: worker?.pincode || "",
    latitude: worker?.latitude ?? "",
    longitude: worker?.longitude ?? "",
    bankDetails: {
      bankName: primaryBank?.bank_name || primaryBank?.bankName || "",
      accountHolderName:
        primaryBank?.account_holder_name ||
        primaryBank?.accountHolderName ||
        "",
      accountNumber:
        primaryBank?.account_number || primaryBank?.accountNumber || "",
      ifscCode:
        primaryBank?.ifsc_code ||
        primaryBank?.ifscCode ||
        primaryBank?.ifsc ||
        "",
      upiId: primaryBank?.upi_id || primaryBank?.upiId || "",
    },
    documentInfo: {
      logoUrl: worker?.logo_url || worker?.logoUrl || "",
      documents: Array.isArray(worker?.documents)
        ? worker.documents.map((document) => ({
            documentType:
              document?.document_type || document?.documentType || "",
            documentUrl: document?.document_url || document?.documentUrl || "",
          }))
        : [],
    },
  };
};

export default function UpdateWorker() {
  const navigate = useNavigate();
  const { workerId } = useParams();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getWorkerById(workerId);
        setWorker(response || null);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load worker details.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  const initialData = useMemo(() => mapWorkerToFormData(worker), [worker]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await updateWorker(workerId, payload);
      navigate(`/workers/${workerId}`);
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

  if (!worker) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
          Worker not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Update Worker"
          subtitle="Edit worker profile details"
          action={
            <button
              onClick={() => navigate(`/workers/${workerId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          }
        />

        <WorkerForm
          mode="edit"
          initialData={initialData}
          loading={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          enableSkillLookup
          firebaseUid={worker?.firebase_uid || worker?.firebaseUid || ""}
        />
      </div>
    </DashboardLayout>
  );
}
