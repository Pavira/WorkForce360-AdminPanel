import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusFilterSection from "@/components/ui/StatusFilterSection";
import useCompaniesList from "@/hooks/useCompaniesList";
import { createCompanyFirebaseUser } from "@/services/company_service";

const SEARCH_OPTIONS = [
  { label: "Company Name", value: "company_name" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
];

export default function ListCompanies() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [modalError, setModalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
  } = useCompaniesList();
  const statusOptions = [
    { label: "Approved", value: "approved", count: approvedCount },
    { label: "Un-Approved", value: "unapproved", count: unapprovedCount },
    { label: "Draft", value: "draft", count: draftCount },
  ];

  const COUNTRY_CODES = [
    { code: "+91", name: "India" },
    { code: "+1", name: "USA" },
    { code: "+44", name: "UK" },
    { code: "+61", name: "Australia" },
  ];

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10,15}$/;
    const cleaned = String(phone || "").replace(/\s/g, "");
    return phoneRegex.test(cleaned);
  };

  const handleRegister = async () => {
    setModalError("");

    if (!phoneNumber.trim()) {
      setModalError("Please enter a phone number.");
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setModalError("Invalid phone number format. Enter 10-15 digits.");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    setIsLoading(true);
    try {
      const response = await createCompanyFirebaseUser(
        fullPhoneNumber,
        countryCode,
      );
      setIsModalOpen(false);
      setPhoneNumber("");
      navigate(
        `/companies/add?firebase_uid=${encodeURIComponent(response.firebase_uid || response.uid)}&phone_number=${encodeURIComponent(response.phone_number || fullPhoneNumber)}&country_code=${encodeURIComponent(countryCode)}`,
      );
    } catch (err) {
      setModalError(
        err.message || "Failed to create company. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPhoneNumber("");
    setCountryCode("+91");
    setModalError("");
  };

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Companies"
          subtitle="Manage company details"
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Plus size={16} />
              Add Company
            </button>
          }
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
                      Company Name
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Phone
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((company) => {
                    const phone =
                      company.contact_country_code && company.contact_phone
                        ? `${company.contact_country_code} ${company.contact_phone}`
                        : company.contact_phone || "-";

                    return (
                      <tr
                        key={company.id}
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="cursor-pointer border-b border-gray-100 transition hover:bg-purple-50"
                      >
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">
                          {company.company_name || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {phone}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {company.contact_email || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {company.status || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/add-job/${company.id}`, {
                                state: { company },
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            Create Job
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {items.map((company) => {
                const phone =
                  company.contact_country_code && company.contact_phone
                    ? `${company.contact_country_code} ${company.contact_phone}`
                    : company.contact_phone || "-";

                return (
                  <div
                    key={company.id}
                    onClick={() => navigate(`/companies/${company.id}`)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-purple-50"
                  >
                    <p className="text-base font-semibold text-gray-800">
                      {company.company_name || "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">Phone: {phone}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Email: {company.contact_email || "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Status: {company.status || "-"}
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Add Company
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="w-28 shrink-0">
                  <select
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.code} ({country.name})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => {
                    setPhoneNumber(event.target.value);
                    setModalError("");
                  }}
                  placeholder="9876543210"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Example: +91 9876543210
              </p>
            </div>

            {modalError ? (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {modalError}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Register"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
