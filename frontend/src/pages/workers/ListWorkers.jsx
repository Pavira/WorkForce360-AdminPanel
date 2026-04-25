import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusFilterSection from "@/components/ui/StatusFilterSection";
import useWorkersList from "@/hooks/useWorkersList";

const SEARCH_OPTIONS = [
  { label: "Worker Name", value: "worker_name" },
  { label: "Phone", value: "phone" },
  // { label: "Email", value: "email" },
];

export default function ListWorkers() {
  const navigate = useNavigate();
  const {
    items,
    totalCount,
    page,
    searchTerm,
    searchType,
    activeStatus,
    approvedCount,
    unapprovedCount,
    draftCount,
    loading,
    error,
    isPrevDisabled,
    isNextDisabled,
    handleSearchInputChange,
    handleSearchTypeChange,
    handleStatusChange,
    handlePrevPage,
    handleNextPage,
  } = useWorkersList();

  const statusOptions = [
    { label: "Approved", value: "approved", count: approvedCount },
    { label: "Un-Approved", value: "unapproved", count: unapprovedCount },
    { label: "Draft", value: "draft", count: draftCount },
  ];

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Workers"
          subtitle="Manage worker details"
          // action={
          //   <button
          //     onClick={() => navigate("/workers/add")}
          //     className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          //   >
          //     <Plus size={16} />
          //     Add Worker
          //   </button>
          // }
        />

        <StatusFilterSection
          summaryLabel="Total Entries"
          summaryCount={totalCount}
          options={statusOptions}
          activeValue={activeStatus}
          onChange={handleStatusChange}
        />

        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="searchType"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Search Type
            </label>
            <select
              id="searchType"
              value={searchType}
              onChange={handleSearchTypeChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {SEARCH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="searchTerm"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Search Term
            </label>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
              />
              <input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={handleSearchInputChange}
                placeholder="Type at least 3 characters to search"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            {searchTerm.trim().length > 0 && searchTerm.trim().length < 3 ? (
              <p className="mt-1 text-xs text-amber-600">
                Enter at least 3 characters to trigger search.
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <p className="text-base font-medium text-gray-700">No data found</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Worker Name
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Phone
                    </th>
                    {/* <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th> */}
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((worker) => {
                    const phone =
                      worker.contact_country_code && worker.contact_phone
                        ? `${worker.contact_country_code} ${worker.contact_phone}`
                        : worker.contact_phone || worker.phone || "-";

                    return (
                      <tr
                        key={worker.id}
                        onClick={() => navigate(`/workers/${worker.id}`)}
                        className="cursor-pointer border-b border-gray-100 transition hover:bg-purple-50"
                      >
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">
                          {worker.worker_name ||
                            worker.name ||
                            worker.company_name ||
                            "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {phone}
                        </td>
                        {/* <td className="px-5 py-3 text-sm text-gray-700">
                          {worker.contact_email || worker.email || "-"}
                        </td> */}
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {worker.status || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {items.map((worker) => {
                const phone =
                  worker.contact_country_code && worker.contact_phone
                    ? `${worker.contact_country_code} ${worker.contact_phone}`
                    : worker.contact_phone || worker.phone || "-";

                return (
                  <div
                    key={worker.id}
                    onClick={() => navigate(`/workers/${worker.id}`)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-purple-50"
                  >
                    <p className="text-base font-semibold text-gray-800">
                      {worker.worker_name ||
                        worker.name ||
                        worker.company_name ||
                        "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">Phone: {phone}</p>
                    {/* <p className="mt-1 text-sm text-gray-600">
                      Email: {worker.contact_email || worker.email || "-"}
                    </p> */}
                    <p className="mt-1 text-sm text-gray-600">
                      Status: {worker.status || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-600">Current Page: {page}</p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={isPrevDisabled}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={isNextDisabled}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
