import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkerForm from "./WorkerForm";
import { createWorker } from "@/services/workerService";

export default function AddWorker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setLoading(true);
      await createWorker(payload);
      navigate("/workers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Add Worker"
          subtitle="Create a new worker profile"
          action={
            <button
              onClick={() => navigate("/workers")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          }
        />

        <WorkerForm
          mode="create"
          loading={loading}
          onSubmit={handleSubmit}
          enableSkillLookup
        />
      </div>
    </DashboardLayout>
  );
}
