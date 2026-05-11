import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
// import ListInvoices from "../pages/invoices/ListInvoices";
// import AddInvoice from "../pages/invoices/AddInvoice";
// import UpdateInvoice from "../pages/invoices/UpdateInvoice";
// import ListCustomers from "../pages/customers/ListCustomers";
import ListCompanies from "../pages/companies/ListCompanies";
import ViewCompany from "../pages/companies/ViewCompany";
import AddCompany from "../pages/companies/AddCompany";
import UpdateCompany from "../pages/companies/UpdateCompany";
import ListWorkers from "../pages/workers/ListWorkers";
import ViewWorker from "../pages/workers/ViewWorker";
import AddWorker from "../pages/workers/AddWorker";
import UpdateWorker from "../pages/workers/UpdateWorker";
import ListJobs from "../pages/jobs/ListJobs";
import ViewJob from "../pages/jobs/ViewJob";
import AddJob from "../pages/jobs/AddJob";
// import AddCustomer from "../pages/customers/AddCustomer";
// import UpdateCustomer from "../pages/customers/UpdateCustomer";
// import ListItems from "../pages/items/ListItems";
// import AddItem from "../pages/items/AddItem";
// import UpdateItem from "../pages/items/UpdateItem";

function LogoutRedirect() {
  useEffect(() => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
  }, []);

  return <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/logout" element={<LogoutRedirect />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/invoices" element={<ListInvoices />} />
        <Route path="/invoices/add" element={<AddInvoice />} />
        <Route path="/invoices/:invoiceId" element={<UpdateInvoice />} />
        <Route path="/customers" element={<ListCustomers />} />
        <Route path="/customers/add" element={<AddCustomer />} /> */}
        <Route path="/companies" element={<ListCompanies />} />
        <Route path="/companies/add" element={<AddCompany />} />
        <Route path="/companies/:companyId" element={<ViewCompany />} />
        <Route path="/companies/:companyId/edit" element={<UpdateCompany />} />
        <Route path="/workers" element={<ListWorkers />} />
        <Route path="/workers/add" element={<AddWorker />} />
        <Route path="/workers/:workerId" element={<ViewWorker />} />
        <Route path="/workers/:workerId/edit" element={<UpdateWorker />} />
        <Route path="/jobs" element={<ListJobs />} />
        <Route path="/jobs/:jobId" element={<ViewJob />} />
        <Route path="/add-job/:companyId" element={<AddJob />} />
        {/* <Route path="/customers/:customerId" element={<UpdateCustomer />} /> */}
        {/* <Route path="/items" element={<ListItems />} />
        <Route path="/items/add" element={<AddItem />} />
        <Route path="/items/:itemId" element={<UpdateItem />} /> */}
      </Routes>
    </HashRouter>
  );
}
