import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Clock,
  Users,
  Briefcase,
  IndianRupee,
  Phone,
  Settings,
  Save,
} from "lucide-react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { getCompanyById } from "@/services/company_service";
import {
  getCategorySkills,
  getSubCategorySkillsByCategoryId,
} from "@/services/workerService";
import { createJob } from "../../services/jobService";

/**
 * AddJob Component
 * Handles the creation of a new job post for a specific company.
 * Follows design patterns from the Company Registration and Worker management modules.
 */
export default function AddJob() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const companyFromState = location.state?.company;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [company, setCompany] = useState(companyFromState || null);
  const [skillCategories, setSkillCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [formData, setFormData] = useState({
    skillCategoryId: "",
    subCategoryId: "",
    industryTypeId: "",
    tier: 1,
    description: "",
    addressType: "existing",
    selectedAddressIndex: 0,
    workAddress: "",
    nearbyLandmark: "",
    latitude: 0,
    longitude: 0,
    scheduledStartDateTime: "",
    scheduledEndDateTime: "",
    scheduledDuration: "",
    durationType: "hours",
    shift: "Day",
    workers: 1,
    experienceRequired: "",
    wage: 0,
    name: "",
    countryCode: "+91",
    phoneNumber: "",
    email: "",
    toolProvided: false,
    toolDetails: "",
    languagePreference: "",
    specialInstructions: "",
  });

  // Initialization: Fetch company details and skill categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyData, skillsData] = await Promise.all([
          !company ? getCompanyById(companyId) : Promise.resolve(company),
          getCategorySkills(),
        ]);

        if (!company) setCompany(companyData);
        setSkillCategories(skillsData || []);

        if (companyData) {
          setFormData((prev) => ({
            ...prev,
            name: companyData.contact_person_name || "",
            phoneNumber: companyData.contact_phone || "",
            countryCode: companyData.contact_country_code || "+91",
            email: companyData.contact_email || "",
            workAddress: companyData.addresses?.[0]?.address || "",
            nearbyLandmark: companyData.addresses?.[0]?.unit_name || "",
            latitude: companyData.addresses?.[0]?.latitude || 0,
            longitude: companyData.addresses?.[0]?.longitude || 0,
            industryTypeId: companyData.industry_id || "",
          }));
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [companyId, company]);

  // Dependent dropdown: Fetch subcategories when skill category changes
  useEffect(() => {
    if (formData.skillCategoryId) {
      getSubCategorySkillsByCategoryId(formData.skillCategoryId).then(
        setSubCategories,
      );
    } else {
      setSubCategories([]);
    }
  }, [formData.skillCategoryId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Auto-fill wage when subcategory is selected (based on suggested wage from API)
  const handleSubCategoryChange = (e) => {
    const subId = e.target.value;
    const sub = subCategories.find(
      (s) => String(s.id || s.industry_id) === String(subId),
    );
    setFormData((prev) => ({
      ...prev,
      subCategoryId: subId,
      wage: sub?.suggested_wage || sub?.wage || prev.wage || 0,
    }));
  };

  // Toggle between existing company addresses or a custom location
  const handleAddressToggle = (type, index = 0) => {
    if (type === "existing" && company?.addresses?.[index]) {
      const addr = company.addresses[index];
      setFormData((prev) => ({
        ...prev,
        addressType: "existing",
        selectedAddressIndex: index,
        workAddress: addr.address,
        nearbyLandmark: addr.unit_name || "",
        latitude: addr.latitude || 0,
        longitude: addr.longitude || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        addressType: "new",
        workAddress: "",
        nearbyLandmark: "",
        latitude: 0,
        longitude: 0,
      }));
    }
  };

  // Dynamic calculation for the Total Amount
  const expectedTotal = useMemo(() => {
    return Number(formData.workers || 0) * Number(formData.wage || 0);
  }, [formData.workers, formData.wage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const latitude = Number(formData.latitude);
      const longitude = Number(formData.longitude);
      const payload = {
        ...formData,
        companyId,
        expectedTotal,
        scheduledStartDateTime: new Date(
          formData.scheduledStartDateTime,
        ).toISOString(),
        scheduledEndDateTime: new Date(
          formData.scheduledEndDateTime,
        ).toISOString(),
        latitude: Number.isFinite(latitude) ? latitude : undefined,
        longitude: Number.isFinite(longitude) ? longitude : undefined,
      };
      delete payload.addressType;
      delete payload.selectedAddressIndex;

      await createJob(payload);
      navigate("/jobs");
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <PageHeader
          title="Create New Job"
          subtitle={`For ${company?.company_name || "Company"}`}
          action={
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft size={16} /> Back
            </button>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
          {/* 1. Basic Job Info */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Briefcase className="text-purple-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Basic Job Info
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Skill Category *
                </label>
                <select
                  name="skillCategoryId"
                  value={formData.skillCategoryId}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="">Select Category</option>
                  {skillCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Sub Category *
                </label>
                <select
                  name="subCategoryId"
                  value={formData.subCategoryId}
                  onChange={handleSubCategoryChange}
                  required
                  disabled={!formData.skillCategoryId}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
                >
                  <option value="">Select Sub-Category</option>
                  {subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Job Tier
                </label>
                <input
                  type="text"
                  name="tier"
                  value={formData.tier}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
                  placeholder="e.g. Tier 1, Tier 2"
                  disabled
                />
                {/* <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select> */}
              </div>
              <div className="space-y-1 md:col-span-3">
                <label className="text-sm font-medium text-gray-700">
                  Job Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Describe the job roles and responsibilities..."
                />
              </div>
            </div>
          </section>

          {/* 2. Location */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="text-purple-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Location</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {company?.addresses?.map((addr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddressToggle("existing", idx)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      formData.addressType === "existing" &&
                      formData.selectedAddressIndex === idx
                        ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {addr.city || "Office"} Address {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddressToggle("new")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    formData.addressType === "new"
                      ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  + Add New Address
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Address *
                  </label>
                  <input
                    type="text"
                    name="workAddress"
                    value={formData.workAddress}
                    onChange={handleInputChange}
                    readOnly={formData.addressType === "existing"}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
                    placeholder="Enter site location address"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    name="nearbyLandmark"
                    value={formData.nearbyLandmark}
                    onChange={handleInputChange}
                    readOnly={formData.addressType === "existing"}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      step="any"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      readOnly={formData.addressType === "existing"}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      step="any"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      readOnly={formData.addressType === "existing"}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Timing & Duration */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Clock className="text-purple-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Timing & Duration
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Scheduled Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledStartDateTime"
                  value={formData.scheduledStartDateTime}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Scheduled End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledEndDateTime"
                  value={formData.scheduledEndDateTime}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Duration *
                </label>
                <input
                  type="number"
                  name="scheduledDuration"
                  value={formData.scheduledDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Unit
                </label>
                <select
                  name="durationType"
                  value={formData.durationType}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Shift
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                  <option value="Rotational">Rotational</option>
                </select>
              </div>
            </div>
          </section>

          {/* 4 & 5. Workforce & Payment */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Users className="text-purple-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">
                  Workforce Requirements
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Number of Workers *
                  </label>
                  <input
                    type="number"
                    name="workers"
                    value={formData.workers}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Experience Required
                  </label>
                  <input
                    type="number"
                    name="experienceRequired"
                    value={formData.experienceRequired}
                    min="1"
                    onChange={handleInputChange}
                    placeholder="e.g. 2+ years preferred"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <IndianRupee className="text-purple-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">
                  Payment Details
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Wage (per unit) *
                  </label>
                  <input
                    type="number"
                    name="wage"
                    value={formData.wage}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Expected Total (Auto-calculated)
                  </label>
                  <div className="flex h-10 items-center rounded-lg bg-purple-50 px-3 text-sm font-bold text-purple-700">
                    ₹ {expectedTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 6. Contact Information */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Phone className="text-purple-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Contact Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                    {formData.countryCode}
                  </span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-r-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
            </div>
          </section>

          {/* 7. Job Rules & Preferences */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Settings className="text-purple-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Job Rules & Preferences
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Tool Provided by Company?
                </label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      checked={formData.toolProvided}
                      onChange={() =>
                        setFormData((p) => ({ ...p, toolProvided: true }))
                      }
                      className="h-4 w-4 accent-purple-600"
                    />{" "}
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      checked={!formData.toolProvided}
                      onChange={() =>
                        setFormData((p) => ({
                          ...p,
                          toolProvided: false,
                          toolDetails: "",
                        }))
                      }
                      className="h-4 w-4 accent-purple-600"
                    />{" "}
                    No
                  </label>
                </div>
              </div>

              {formData.toolProvided && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Tool Details
                  </label>
                  <input
                    type="text"
                    name="toolDetails"
                    value={formData.toolDetails}
                    onChange={handleInputChange}
                    placeholder="Specify tools provided..."
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Language Preference
                </label>
                <input
                  type="text"
                  name="languagePreference"
                  value={formData.languagePreference}
                  onChange={handleInputChange}
                  placeholder="e.g. Hindi, English"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Special Instructions
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Add any specific instructions for workers..."
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-10 py-3.5 text-base font-bold text-white transition hover:bg-purple-700 disabled:opacity-60 md:w-auto"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Plus size={20} />
              )}
              Create Job Listing
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
