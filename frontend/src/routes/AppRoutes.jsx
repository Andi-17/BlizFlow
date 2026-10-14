import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import { buildBusinessPublicUrl, getBusinessSubdomain, supportsBusinessSubdomains } from '../utils/tenantHost'

import PublicLayout from '../layouts/PublicLayout'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import AdminLayout from '../layouts/AdminLayout'

import Home from '../pages/public/Home'
import Features from '../pages/public/Features'
import Pricing from '../pages/public/Pricing'
import About from '../pages/public/About'
import Contact from '../pages/public/Contact'
import CompanyLanding from '../pages/public/CompanyLanding'

import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import VerifyEmail from '../pages/auth/VerifyEmail'

import CreateCompany from '../pages/onboarding/CreateCompany'
import BillingSuccess from '../pages/onboarding/BillingSuccess'
import BillingCancel from '../pages/onboarding/BillingCancel'

import Dashboard from '../pages/app/Dashboard'
import Customers from '../pages/app/Customers'
import CustomerForm from '../pages/app/CustomerForm'
import CustomerDetail from '../pages/app/CustomerDetail'
import Products from '../pages/app/Products'
import ProductForm from '../pages/app/ProductForm'
import Inventory from '../pages/app/Inventory'
import Orders from '../pages/app/Orders'
import OrderForm from '../pages/app/OrderForm'
import OrderDetail from '../pages/app/OrderDetail'
import Invoices from '../pages/app/Invoices'
import InvoiceForm from '../pages/app/InvoiceForm'
import InvoiceDetail from '../pages/app/InvoiceDetail'
import Employees from '../pages/app/Employees'
import Tasks from '../pages/app/Tasks'
import Projects from '../pages/app/Projects'
import Reports from '../pages/app/Reports'
import Billing from '../pages/app/Billing'
import MyWork from '../pages/app/MyWork'
import Settings from '../pages/app/Settings'
import ContactMessages from '../pages/app/ContactMessages'
import Companies from '../pages/app/Companies'

import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminCompanies from '../pages/admin/AdminCompanies'
import AdminPlans from '../pages/admin/AdminPlans'
import AdminContactMessages from '../pages/admin/AdminContactMessages'
import AdminSubscriptions from '../pages/admin/AdminSubscriptions'
import AdminPayments from '../pages/admin/AdminPayments'
import AdminBillingInvoices from '../pages/admin/AdminBillingInvoices'
import AdminActivityLogs from '../pages/admin/AdminActivityLogs'

import NotFound from '../pages/errors/NotFound'
import Forbidden from '../pages/errors/Forbidden'

function BillingSuccessRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/app/billing/success${search}`} replace />
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner fullPage />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function CompanyRequiredRoute() {
  const { hasCompany, hasMembership, loading, ready, companies } = useCompany()
  const { loading: authLoading, isPlatformAdmin, memberships } = useAuth()

  if (authLoading || !ready || loading) {
    return <LoadingSpinner fullPage label="Loading workspace…" />
  }

  const membershipCount = companies?.length || memberships?.length || 0
  if (!hasMembership && membershipCount === 0 && !isPlatformAdmin) {
    return <Navigate to="/onboarding/company" replace />
  }

  if (!hasCompany && membershipCount > 0) {
    return <Navigate to="/app/workspaces" replace />
  }

  if (isPlatformAdmin && !hasCompany && membershipCount === 0) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

function WorkspacesRoute() {
  const { hasMembership, loading, ready, companies } = useCompany()
  const { loading: authLoading, isPlatformAdmin, memberships } = useAuth()

  if (authLoading || !ready || loading) {
    return <LoadingSpinner fullPage label="Loading workspaces…" />
  }

  const membershipCount = companies?.length || memberships?.length || 0
  if (!hasMembership && membershipCount === 0 && !isPlatformAdmin) {
    return <Navigate to="/onboarding/company" replace />
  }

  return <Outlet />
}

function AdminRoute({ children }) {
  const { isPlatformAdmin, loading, isAuthenticated } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isPlatformAdmin) return <Navigate to="/forbidden" replace />
  return children
}

function GuestOnly({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const { ready } = useCompany()

  if (loading || (isAuthenticated && !ready)) {
    return <LoadingSpinner fullPage />
  }

  if (isAuthenticated) {
    // Always enter the app shell; CompanyRequiredRoute decides onboarding vs dashboard.
    return <Navigate to="/app" replace />
  }

  return children
}

function BusinessPathRedirect() {
  const { slug } = useParams()

  if (supportsBusinessSubdomains() && slug) {
    const target = buildBusinessPublicUrl(slug)
    if (target && !target.includes('/b/')) {
      window.location.replace(target)
      return <LoadingSpinner fullPage />
    }
  }

  return <CompanyLanding />
}

export default function AppRoutes() {
  const tenantSlug = getBusinessSubdomain()

  if (tenantSlug) {
    return (
      <Routes>
        <Route path="*" element={<CompanyLanding slugOverride={tenantSlug} />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="b/:slug" element={<BusinessPathRedirect />} />

      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="billing/success" element={<BillingSuccessRedirect />} />
        <Route path="billing/cancel" element={<BillingCancel />} />
        <Route path="forbidden" element={<Forbidden />} />
      </Route>

      <Route
        element={
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        }
      >
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      <Route
        path="verify-email"
        element={
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VerifyEmail />} />
      </Route>

      <Route
        path="onboarding"
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="company" element={<CreateCompany />} />
        <Route path="plan" element={<Navigate to="/app/billing" replace />} />
      </Route>

      <Route
        path="app"
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route element={<WorkspacesRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="workspaces" element={<Companies />} />
            <Route path="companies" element={<Navigate to="/app/workspaces" replace />} />
          </Route>
        </Route>

        <Route element={<CompanyRequiredRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="my-work" element={<MyWork />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/new" element={<CustomerForm />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="customers/:id/edit" element={<CustomerForm />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="employees" element={<Employees />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="projects" element={<Projects />} />
            <Route path="reports" element={<Reports />} />
            <Route path="billing" element={<Billing />} />
            <Route path="billing/success" element={<BillingSuccess />} />
            <Route path="settings" element={<Settings />} />
            <Route path="contacts" element={<ContactMessages />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="billing-invoices" element={<AdminBillingInvoices />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="activity" element={<AdminActivityLogs />} />
        <Route path="messages" element={<AdminContactMessages />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
